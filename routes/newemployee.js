const express = require('express');
const router = express.Router();
const multer = require('multer'); // 1. Importera multer
router.use(express.json());
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database', 'tricell_intranet.db');
const db = new Database(dbPath);
const checkAuth = require('../authMiddleware.js'); // Se till att sökvägen stämmer

router.use(express.static('./public'));


// --------------------- Läs in Masterframen --------------------------------
const readHTML = require('../readHTML.js');
const fs = require('fs');
const { request } = require('http');
;

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


// 2. Konfigurera hur bilden ska sparas
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/photos/'); // Mappen där du läser bilderna ifrån
    },
    filename: function (req, file, cb) {
        // Vi tar employeeCode från URL-parametern (:employeeId)
        // så att filen garanterat döps rätt
        const employeeCode = req.body.femployeecode || 'temp_' + Date.now();
        cb(null, employeeCode + ".jpg");
    }
});

const upload = multer({ storage: storage });

// ---------------------- Lägg till ny person ------------------------------------------------
router.post('/', upload.single('ffile'), function (request, response) {

    console.log("POST mottagen!"); // Logga detta för att se om vi ens når hit
    console.log("Body:", request.body);
    console.log("Fil:", request.file)
    const b = request.body
    // Fix: Hämta det första elementet [0] från varje fält för Formidable v3
    const employeecode = b.femployeecode;
    const name = b.fname;
    const dateofbirth = b.fdateofbirth;
    const height = b.fheight;
    const weight = b.fweight;
    const bloodtype = b.fbloodtype;
    const sex = b.fsex;
    const rank = b.frank;
    const department = b.fdepartment;
    const securityaccesslevel = b.fsecurityaccess;
    const background = b.fbackground;
    const strengths = b.fstrengths;
    const weaknesses = b.fweaknesses;


    console.log("Bearbetat namn:", name); // Nu bör detta visa namnet som en sträng, inte [ 'namn' ]

    // Skapa inskrivningsdatum
    let ts = Date.now();
    let date_ob = new Date(ts);
    let date = String(date_ob.getDate()).padStart(2, '0');
    let month = String(date_ob.getMonth() + 1).padStart(2, '0');
    let year = date_ob.getFullYear();
    let signaturedate = date + "." + month + "." + year;

    response.setHeader('Content-type', 'text/html');
    response.write(htmlHead);

    if (request.session && request.session.userId) {
        response.write(htmlLoggedinMenuCSS);
        response.write(htmlLoggedinMenuJS);
        response.write(htmlLoggedinMenu);
    }

    response.write(htmlHeader);
    response.write(htmlMenu);
    response.write(htmlInfoStart);

    try {
        const insert = db.prepare(`
                INSERT INTO employees (employeeCode, name, signatureDate, dateOfBirth, height, weight, bloodType, sex, rank, department, securityAccessLevel, background, strengths, weaknesses) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

        // Kör insättningen med de "rensade" variablerna
        insert.run(employeecode, name, signaturedate, dateofbirth, height, weight, bloodtype, sex, rank, department, securityaccesslevel, background, strengths, weaknesses);

        response.write("<h2>Personal registrerad</h2>");
        response.write("<p>Den anställde <strong>" + name + "</strong> har lagts till i Tricells register.</p>");
        response.write("<br/><p /><a href=\"/api/newemployee\" style=\"color:#336699;text-decoration:none;\">Lägg till en till anställd</a>");

    } catch (err) {
        console.error("Databasfel:", err);
        if (request.file) fs.unlinkSync(request.file.path);
        response.write("<h2 style='color:red;'>Ett fel uppstod</h2>");
        response.write("<p>Kunde inte lägga till personal. Koden (" + employeecode + ") existerar förmodligen redan.</p>");
        response.write("<br/><a href='javascript:history.back()'>Gå tillbaka och korrigera</a>");
    }

    response.write(htmlInfoStop);
    response.write(htmlFooter);
    response.write(htmlBottom);
    response.end();
});




// ---------------------- Formulär för att lägga till ny person ------------------------------
router.get('/', checkAuth, (request, response) => {
    const currentUserId = request.session.userId || null;
    const photosrc = `photos/default.jpg`
    const genders = ['Male', 'Female', 'Other'];
    // 3. Skicka detta objekt till din EJS-fil
    response.render('user', {
        content: readHTML('./masterframe/newemployee.html'),
        userId: currentUserId, // Nu är variabeln DEFINIERAD för EJS
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: readHTML('./masterframe/menu_back.html'),
        employeecode: "",
        name: "",
        dateofbirth: "",
        signaturedate: "",
        sex: "",
        bloodtype: "",
        height: "",
        weight: "",
        rank: "",
        securityaccesslevel: "",
        department: "",
        background: "",
        strengths: "",
        weaknesses: "",
        securityaccesslevel: "",
        allGenders: genders,
        currentSex: "",
        photo: photosrc,
        securityAccessLevel: request.session.securityAccessLevel || null
    })
});


module.exports = router;