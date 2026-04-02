const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.use(express.static('./public'));
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'database', 'tricell_intranet.db');
const db = new Database(dbPath);

const multer = require('multer'); // 1. Importera multer

// 2. Konfigurera hur bilden ska sparas
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/photos/'); // Mappen där du läser bilderna ifrån
    },
    filename: function (req, file, cb) {
        // Vi tar employeeCode från URL-parametern (:employeeId)
        // så att filen garanterat döps rätt
        const employeeCode = req.body.femployeecode;
        cb(null, employeeCode + ".jpg");
    }
});

const upload = multer({ storage: storage });

// --------------------- Läs in Masterframen --------------------------------
const readHTML = require('../readHTML.js');
const fs = require('fs');
router.use(express.static('./public'));
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


// ---------------------- Editera person ------------------------------------------------
// --------------------- Uppdatera en person -------------------------------
// Ändra router.put till router.post
router.post('/:employeeId', upload.single('ffile'), function (request, response) {
    const targetId = request.params.employeeId;
    const b = request.body;

    if (request.file) {
        console.log("Ny profilbild sparad som:", request.file.filename);
    }



    const updates = {
        employeeCode: b.femployeecode,
        name: b.fname,
        dateOfBirth: b.fdateofbirth, // Använder det konverterade datumet
        sex: b.fsex,
        bloodType: b.fbloodtype,
        height: b.fheight,
        weight: b.fweight,
        department: b.fdepartment,
        rank: b.frank,
        securityAccessLevel: b.fsecurityaccess,
        background: b.fbackground,
        strengths: b.fstrengths,
        weaknesses: b.fweaknesses
    };

    try {
        // Filtrera bort undefined-värden för att undvika att skriva över med null
        const keys = Object.keys(updates).filter(key => updates[key] !== undefined);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const values = keys.map(key => updates[key]);

        if (keys.length === 0) {
            return response.status(400).send('Ingen data skickades');
        }

        const sql = `UPDATE employees SET ${setClause} WHERE employeeCode = ?`;

        // Kör queryn. Vi skickar med värdena + targetId för WHERE-klausulen
        db.prepare(sql).run(...values, targetId);

        console.log(`Uppdatering lyckades för: ${targetId}`);
        response.redirect('/api/editemployee/' + (b.femployeecode || targetId));
    } catch (error) {
        console.error("SQL Fel:", error);
        response.status(500).send('Kunde inte uppdatera databasen');
    }
});



// ---------------------- Formulär för att editera person ------------------------------
router.get('/:id', (request, response) => {
    var id = request.params.id;
    const currentUserId = request.session.userId || null;

    // Läs nuvarande värden ur databasen
    const row = db.prepare("SELECT * FROM employees WHERE employeeCode= ?").get(id);

    let str_employeeCode = row.employeeCode;
    let str_name = row.name
    let str_dateOfBirth = row.dateOfBirth;
    let str_rank = row.rank;
    let str_securityAccessLevel = row.securityAccessLevel;
    let str_signatureDate = row.signatureDate;
    let str_sex = row.sex;
    let str_bloodType = row.bloodType;
    let str_height = row.height;
    let str_weight = row.weight;
    let str_department = row.department;
    let str_background = row.background;
    let str_strengths = row.strengths;
    let str_weaknesses = row.weaknesses;
    console.log(str_dateOfBirth)
    // Kollar om personen har ett foto
    const path = "./public/photos/" + str_employeeCode + ".jpg";
    if (fs.existsSync(path)) {
        photo = "photos/" + str_employeeCode + ".jpg";
    }
    else {
        photo = "images/default.jpg";
    }

    const genders = ['Male', 'Female', 'Other'];
    // 3. Skicka detta objekt till din EJS-fil
    response.render('editemployee', {
        userId: currentUserId, // Nu är variabeln DEFINIERAD för EJS
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: readHTML('./masterframe/menu_back.html'),
        employeecode: str_employeeCode,
        name: str_name,
        dateofbirth: str_dateOfBirth,
        signaturedate: str_signatureDate,
        sex: str_sex,
        bloodtype: str_bloodType,
        height: str_height,
        weight: str_weight,
        rank: str_rank,
        securityaccesslevel: str_securityAccessLevel,
        department: str_department,
        background: str_background || "",
        strengths: str_strengths || "",
        weaknesses: str_weaknesses || "",
        securityaccesslevel: str_securityAccessLevel,
        allGenders: genders,
        currentSex: str_sex
    })
});

module.exports = router;