const express = require('express');
const router = express.Router();
const readHTML = require('../readHTML.js');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database', 'tricell_intranet.db');
const db = new Database(dbPath);


// Activity log
const dbPathA = path.join(__dirname, '..', 'data', 'database', 'activity_log.db');
const dbA = new Database(dbPathA);





router.use(express.static('./public'));
var htmlHead = readHTML('./masterframe/head.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlMenu = readHTML('./masterframe/menu_back.html');
var htmlInfoStart = readHTML('./masterframe/infoStart.html');
var htmlInfoStop = readHTML('./masterframe/infoStop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');


router.post('/', (req, res) => {

    const { femployeecode, fpassword } = req.body;

    // Hämta användaren från tabellen 'employees'
    // I din bild såg kolumnnamnet ut att vara 'employee_code' eller liknande
    try {

        var htmloutput = ""
        // 1. Förbered frågan
        const credentialsStmt = db.prepare("SELECT * FROM user_credentials WHERE employeeCode = ?");

        const personnelStmt = db.prepare("SELECT * FROM employees WHERE employeeCode = ?");
        // activity frågor

        const insertLog = dbA.prepare("INSERT INTO Log (Activity, EmployeeCode, [Name], [Date], [Time]) VALUES (?, ?, ?, ?, ?)");

        // 2. Kör frågan (get hämtar första matchande raden)
        const row = credentialsStmt.get(femployeecode);
        const infoRow = personnelStmt.get(femployeecode)
        const newAttempts = row.loginTimes + 1;

        if (!row) {
            htmloutput += `<div class="loginresponse"> Användaren hittades inte </div>`;
            return renderLoginResponse(res, `<div class="loginresponse">${htmloutput}</div>`);
        } else if (fpassword === row.password && row.lockout === 0) {

            // ökar antalet inlogningsantal
            db.prepare("UPDATE user_credentials SET loginTimes = ? WHERE employeeCode = ?")
                .run(newAttempts, femployeecode);
            // nollställer antalet felaktig inloggningar eftersom inloggningen lyckades
            db.prepare("UPDATE user_credentials SET failedLoginTimes = 0 WHERE employeeCode = ?").run(femployeecode);

            let date = Date.now();
            let dateObj = new Date(date);
            let day = dateObj.getDate();
            let month = dateObj.getMonth() + 1;
            let year = dateObj.getFullYear();
            let str_lastlogin = day + "." + month + "." + year
            const now = new Date();
            const loginDate = now.toLocaleDateString('sv-SE'); // t.ex. 2026-03-27
            const timeOfLogin = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
            const query = db.prepare("UPDATE user_credentials SET lastLogin = ? WHERE employeeCode = ?")

            query.run(str_lastlogin, femployeecode)
            // Set cookies
            res.cookie("employeecode", row.employeeCode);
            res.cookie("name", infoRow.name);
            res.cookie("lastlogin", str_lastlogin);
            res.cookie("logintimes", row.loginTimes);

            // Starta sessioner
            req.session.userId = row.employeeCode;
            req.session.securityAccessLevel = infoRow.securityAccessLevel;

            // Acitivity log

            insertLog.run(
                "Login",
                row.employeeCode,
                infoRow.name,
                loginDate,
                timeOfLogin
            );

            dbA.prepare("DELETE FROM Log WHERE ID NOT IN (SELECT ID FROM Log ORDER BY ID DESC LIMIT 150)").run();



            // SPARA och sen REDIRECT (Detta skickar headers)
            return req.session.save((err) => {
                if (err) return res.status(500).send("Sessionsfel");
                res.redirect('./admin'); // <--- Detta är det enda svaret som skickas
            });


        } else if (fpassword === row.password && row.lockout === 1) {

            htmloutput += `<div class="loginresponse"> Ditt konto är låst. </div>`;
            return renderLoginResponse(res, `<div class="loginresponse">${htmloutput}</div>`);
        } else {
            const newFailedAttempts = row.failedLoginTimes + 1;
            const maxAttempts = 3;

            if (newFailedAttempts >= maxAttempts) { // Lås kontot om man försökt för många gånger
                db.prepare("UPDATE user_credentials SET failedLoginTimes = ?, lockout = 1 WHERE employeeCode = ?")
                    .run(newFailedAttempts, femployeecode);
                htmloutput += `<div class="loginresponse" style="color:red;">För många misslyckade försök. Kontot har låsts.</div>`;
                return renderLoginResponse(res, `<div class="loginresponse">${htmloutput}</div>`);
            } else {
                // Uppdatera bara antal försök
                db.prepare("UPDATE user_credentials SET failedLoginTimes = ? WHERE employeeCode = ?")
                    .run(newFailedAttempts, femployeecode);
                htmloutput += `<div class="loginresponse">Fel lösenord. Försök kvar: ${maxAttempts - newAttempts}</div>`;

                return renderLoginResponse(res, `<div class="loginresponse">${htmloutput}</div>`);

            }
        }
        // res.status(401).send("Fel lösenord");

    } catch (err) {
        console.error(err);
        res.status(500).send("Ett internt fel uppstod");
    }
    function renderLoginResponse(res, message) {
        res.write(htmlHead);
        res.write(htmlHeader);
        res.write(htmlMenu);
        res.write(htmlInfoStart);
        res.write(message);
        res.write(htmlInfoStop);
        res.write(htmlFooter);
        res.write(htmlBottom);
        res.end();
    }
});

module.exports = router;