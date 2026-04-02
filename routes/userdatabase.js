/* =========================================================================
   USERDATABASE.JS - Administratörsverktyg för Användarhantering
   =========================================================================
   Detta skript hanterar CRUD-operationer (Create, Read, Update, Delete)
   för både inloggningsuppgifter (tabell: user_credentials) och profiler (tabell: employees).
*/

const config = require('../config/globals.json');
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', 'data', 'database', 'tricell_intranet.db');
const db = new Database(dbPath);
const readHTML = require('../readHTML.js');

// Gör "public"-mappen tillgänglig för statiska filer (CSS/Bilder)
router.use(express.static('./public'));

// Importera Pug för att kunna rendera den dynamiska menyn (loggedinmenu)

// Ladda in Masterframe-komponenter (HTML-mallar)
var htmlHead = readHTML('./masterframe/head.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlMenu = readHTML('./masterframe/menu.html');
var htmlInfoStart = readHTML('./masterframe/infoStart.html');
var htmlInfoStop = readHTML('./masterframe/infoStop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');
var htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
var htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');
var htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');

/**
 * HJÄLPFUNKTION: Kontrollera om användaren har behörighet (Nivå A)
 * Hämtar employeeCode från cookies/session och kollar mot tabellen 'employee'.
 */
async function hasAccess(request) {
    let securityAccessLevel = request.session.securityAccessLevel || null;
    return securityAccessLevel
}

/**
 * HJÄLPFUNKTION: Visa ett tydligt rött felmeddelande vid nekad åtkomst
 */
function accessDeniedResponse(response) {
    return response.send("<h1 style='color:red;'>Access Denied</h1><p>You must have <b>Administrator Level A</b> to view this page.</p><a href='/'>Back to start</a>");
}


// -------------------------------------------------------------------------
// 1. ROUTE: LISTA ALLA ANVÄNDARE (GET /)
// -------------------------------------------------------------------------
router.get('/', async (request, response) => {
    if (!(await hasAccess(request))) return accessDeniedResponse(response);


    let htmlOutput = `<link rel="stylesheet" href="/css/personnel_registry.css" />
    <table border="0" width="100%">
        <tr>
            <td align="left"><h2>User Database</h2></td>
            <td align="right"><a href="/api/userdatabase/add" style="color:green; text-decoration:none; font-weight:bold; border:1px solid green; padding:5px; border-radius:4px;">[+] Add New User</a></td>
        </tr>
    </table>
    <div class="table">
        <div class="row">
            <div class="light_column_cell">Username</div>
            <div class="dark_column_cell">Full Name</div>
            <div class="light_column_cell">Level</div>
            <div class="light_column_cell">Status</div>
            <div class="light_column_cell" style="text-align:center;">Edit</div>
            <div class="light_column_cell" style="text-align:center;">Del</div>
        </div>
      `;

    try {
        // Hämta data genom att joina users (inloggning) och employee (profilnamn/nivå)
        const result = db.prepare(`
            SELECT user_credentials.employeeCode, employees.[name], employees.securityAccessLevel, user_credentials.lockout 
            FROM user_credentials LEFT JOIN employees ON user_credentials.employeeCode = employees.employeeCode`).all();

        for (let user of result) {
            let lvlStyle = user.securityAccessLevel === 'A' ? "color:red; font-weight:bold;" : "";

            // STATUS-LOGIK: Vi kollar om lockout inte är 0, null eller false (Access sparar True som -1)
            let isLocked = (user.lockout != null && user.lockout != 0 && user.lockout != false && String(user.lockout).toLowerCase() !== 'false');
            let statusText = isLocked ? "<b style='color:red'>LOCKED</b>" : "Active";

            htmlOutput += `
            <div class="row">
                <div class="table_cell_values">${user.employeeCode}</div>
                <div class="table_cell_values_name">${user.name || '<i>No name set</i>'}</div>
                <div class="table_cell_values" style="${lvlStyle}">${user.securityAccessLevel || 'C'}</div>
                <div class="table_cell_values">${statusText}</div>
                <div class="table_cell_values" style="text-align:center;">
                    <a href="/api/userdatabase/edit/${user.employeeCode}" style="color:#0056b3; font-weight:bold; text-decoration:none;">[E]</a>
                </div>
                <div class="table_cell_values" style="text-align:center;">
                    <a href="/api/userdatabase/delete/${user.employeeCode}" style="color:red; text-decoration:none;" onclick="return confirm('Radera?');">[X]</a>
                </div>
            </div>`;
        }
    } catch (err) { htmlOutput += `Error: ${err.message}`; }

    htmlOutput += `</div></div>`;


    const currentUserId = request.session.userId || null;

    const fullContent = htmlOutput;

    // 3. Skicka detta objekt till din EJS-fil
    const secAccessLevel = request.session.securityAccessLevel || null;
    response.render('user', {
        securityAccessLevel: secAccessLevel,
        userId: currentUserId, // Nu är variabeln DEFINIERAD för EJS
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: readHTML('./masterframe/menu_back.html'),
        content: fullContent
    })
});

// -------------------------------------------------------------------------
// 2. ROUTE: FORMULÄR FÖR ATT LÄGGA TILL (GET /add)
// -------------------------------------------------------------------------
router.get('/add', async (request, response) => {

    let htmloutput = ``
    if (!(await hasAccess(request))) return accessDeniedResponse(response);


    // Generera IT-koder dynamiskt för rullistan
    let itCodes = "";
    for (let i = 1; i <= 30; i++) {
        let c = `IT25-${i.toString().padStart(2, '0')}`;
        itCodes += `<option value="${c}">${c}</option>`;
    }

    htmloutput += `
        <h2>Add User & Profile</h2>
        <form action="/api/userdatabase/add" method="POST" style="border:1px solid #ccc; padding:20px; width:400px; background:#f9f9f9;">
            <p>Username (Max 7): <br>
               <input type="text" name="customUsername" maxlength="7" placeholder="Custom name..."> 
                eller <select name="itUsername"><option value="">-Välj IT-kod-</option>${itCodes}</select>
            </p>
            <p>Full Name (No limit): <br>
               <input type="text" name="fullName" placeholder="t.ex. Thomas Anderson" style="width:100%;">
            </p>
            <p>Password (Max 7): <br>
               <input type="password" name="password" maxlength="7" required style="width:100%;">
            </p>
            <p>Security Level: <br>
               <select name="securityLevel" style="width:100%;">
                    <option value="C">C (Standard)</option>
                    <option value="B">B (Manager)</option>
                    <option value="A">A (Admin)</option>
               </select>
            </p>
            <button type="submit" style="padding:10px 20px; background:green; color:white; border:none; border-radius:4px; cursor:pointer;">Create User</button>
        </form>`;
    const currentUserId = request.session.userId || null;

    const fullContent = htmloutput;

    // 3. Skicka detta objekt till din EJS-fil
    const secAccessLevel = request.session.securityAccessLevel || null;
    response.render('user', {
        securityAccessLevel: secAccessLevel,
        userId: currentUserId, // Nu är variabeln DEFINIERAD för EJS
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: readHTML('./masterframe/menu_back.html'),
        content: fullContent
    })
});

// -------------------------------------------------------------------------
// 3. ROUTE: PROCESSA TILLÄGG (POST /add)
// -------------------------------------------------------------------------
router.post('/add', async (request, response) => {
    if (!(await hasAccess(request))) return response.send("Denied");

    // LOGIK FÖR PRECEDENCE:
    // Om 'customUsername' har ett värde används det, annars används valet från rullistan 'itUsername'.
    let user = (request.body.customUsername && request.body.customUsername.trim() !== "")
        ? request.body.customUsername.trim()
        : request.body.itUsername;

    let name = request.body.fullName || user; // Om fullständigt namn saknas, använd användarnamnet
    let pass = request.body.password;
    let lvl = request.body.securityLevel;

    // Säkerhetskontroll för längd (Double-check även på serversidan)
    if (!user || user.length > 7 || pass.length > 7) {
        return response.send("<h2>Error</h2><p>Username/Pass max 7 chars.</p><a href='javascript:history.back()'>Back</a>");
    }

    try {
        // DUBBLETTKONTROLL: Kolla om användaren redan finns i databasen
        let check = db.prepare(`SELECT employeeCode FROM user_credentials WHERE employeeCode='${user}'`);
        if (check.length > 0) {
            return response.send(`<h2>Error</h2><p>User <b>${user}</b> already exists!</p><a href='javascript:history.back()'>Back</a>`);
        }

        // Hasha lösenordet med MD5 (matchar login.js)
        let hashedPass = crypto.createHash('md5').update(pass).digest('hex');

        // Utför INSERT i båda tabellerna
        // 'lockout' sätts till NULL för att kontot ska vara aktivt direkt
        db.prepare(`INSERT INTO user_credentials (employeeCode, password, lockout, logintimes, failedLoginTimes) VALUES (?, ?, ?, ?, ?)`).run(user, hashedPass, 0, 0, 0);
        db.prepare(`INSERT INTO employees (employeeCode, name, securityAccessLevel) VALUES (?, ?, ?)`).run(user, name, lvl);

        response.redirect('/api/userdatabase');
    } catch (err) { response.send("Error: " + err.message); }
});

// -------------------------------------------------------------------------
// 4. ROUTE: FORMULÄR FÖR ATT EDITERA (GET /edit/:username)
// -------------------------------------------------------------------------
router.get('/edit/:username', async (request, response) => {

    let htmloutput = ``
    if (!(await hasAccess(request))) return accessDeniedResponse(response);

    let user = request.params.username;
    try {
        let res = db.prepare(`SELECT user_credentials.lockout, employees.name, employees.securityAccessLevel FROM user_credentials LEFT JOIN employees ON user_credentials.employeeCode = employees.employeeCode WHERE user_credentials.employeeCode='${user}'`).all();
        let data = res[0];

        // Kontrollera om kontot är låst för att förifylla dropdownen korrekt
        let isLocked = (data.lockout != null && data.lockout != 0 && data.lockout != false && String(data.lockout).toLowerCase() !== 'false');

        htmloutput += `
            <h2>Edit User: ${user}</h2>
            <form action="/api/userdatabase/edit/${user}" method="POST" style="border:1px solid #ccc; padding:20px; width:400px;">
                <p>Full Name: <br>
                    <input type="text" name="fullName" value="${data.name || ''}" style="width:100%;">
                </p>
                <p>Status: <br>
                    <select name="lockout" style="width:100%;">
                        <option value="false" ${!isLocked ? 'selected' : ''}>Active (NULL)</option>
                        <option value="true" ${isLocked ? 'selected' : ''}>Locked (True)</option>
                    </select>
                </p>
                <p>Level: <br>
                    <select name="securityLevel" style="width:100%;">
                        <option value="C" ${data.securityAccessLevel === 'C' ? 'selected' : ''}>C</option>
                        <option value="B" ${data.securityAccessLevel === 'B' ? 'selected' : ''}>B</option>
                        <option value="A" ${data.securityAccessLevel === 'A' ? 'selected' : ''}>A</option>
                    </select>
                </p>
                <p>New Password (Max 7): <br>
                    <input type="password" name="password" maxlength="7" placeholder="Leave empty to keep current" style="width:100%;">
                </p>
                <button type="submit" style="padding:10px; background:#0056b3; color:white; border:none; border-radius:4px; cursor:pointer;">Save Changes</button>
            </form>`;
    } catch (err) {
        response.send(err.message);
    }
    const currentUserId = request.session.userId || null;

    const fullContent = htmloutput;

    // 3. Skicka detta objekt till din EJS-fil
    const secAccessLevel = request.session.securityAccessLevel || null;
    response.render('user', {
        securityAccessLevel: secAccessLevel,
        userId: currentUserId, // Nu är variabeln DEFINIERAD för EJS
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: readHTML('./masterframe/menu_back.html'),
        content: fullContent
    })
});

// -------------------------------------------------------------------------
// 5. ROUTE: PROCESSA ÄNDRINGAR (POST /edit/:username)
// -------------------------------------------------------------------------
router.post('/edit/:username', async (request, response) => {
    if (!(await hasAccess(request))) return response.send("Denied");

    let user = request.params.username;
    let name = request.body.fullName;
    // Om status sätts till false skickar vi '0' till SQL för att låsa upp kontot helt
    let lockValue = (request.body.lockout === 'true') ? 'true' : '0';
    let lvl = request.body.securityLevel;
    let newPass = request.body.password;

    try {
        // Om ett nytt lösenord har skrivits in, hashade och uppdatera det
        if (newPass && newPass.trim() !== "") {
            if (newPass.length > 7) return response.send("Error: Pass max 7");
            let hashedPass = crypto.createHash('md5').update(newPass).digest('hex');
            db.prepare(`UPDATE user_credentials SET lockout=?, password=? WHERE employeeCode=?`).run(lockValue, hashedPass, user);
        } else {
            // Annars uppdatera bara status (lockout)
            db.prepare(`UPDATE user_credentials SET lockout=? WHERE employeeCode=?`).run(lockValue, user);
        }
        // Uppdatera profilinformationen i employee-tabellen
        db.prepare(`UPDATE employees SET name=?, securityAccessLevel=? WHERE employeeCode=?`).run(name, lvl, user);


        response.redirect('/api/userdatabase');
    } catch (err) { response.send(err.message); }
});

// -------------------------------------------------------------------------
// 6. ROUTE: RADERA ANVÄNDARE (GET /delete/:username)
// -------------------------------------------------------------------------
router.get('/delete/:username', async (request, response) => {
    if (!(hasAccess(request))) return accessDeniedResponse(response);

    try {
        // Radera från båda tabellerna för att hålla databasen ren (Referentiell integritet)
        db.prepare(`DELETE FROM user_credentials WHERE employeeCode=?`).run(request.params.username);
        db.prepare(`DELETE FROM employees WHERE employeeCode=?`).run(request.params.username);

        response.redirect('/api/userdatabase');
    } catch (err) { response.send(err.message); }
});

// Exportera routern så att den kan användas av huvudservern (app.js)
module.exports = router;