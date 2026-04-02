const express = require('express');
const readHTML = require('../readHTML.js');
const router = express.Router();
router.use(express.json());
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database', 'tricell_intranet.db');
const db = new Database(dbPath);


console.log("Uppdateringen klar!");

// Läs in layouten
router.use(express.static('./public'));
var htmlHead = readHTML('./masterframe/head.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlMenu = readHTML('./masterframe/menu_back.html');
var htmlInfoStart = readHTML('./masterframe/infoStart.html');
var htmlInfoStop = readHTML('./masterframe/infoStop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');
var htmlPersonnelStart = readHTML('./masterframe/personnelregistrystart.html')
var htmlPersonnelStop = readHTML('./masterframe/personnelregistrystop.html')


// --------------------- Lista all personal -------------------------------
router.get('/', function (request, response) {
    // läs in och extrahera värdena ur XML filen
    try {
        // Hämta all personal från tabellen "employees"
        const employees = db.prepare('SELECT * FROM employees').all();

        var tableRowsHtml = "";
        var newemployeebttn = "";
        if (request.session && request.session.userId) {
            newemployeebttn += `<div class="newemployeebttn"> <a href="/api/newemployee" class="special-link">Add new employee</a></div>`
        }

        employees.forEach(emp => {
            //låter användaren manipulera tabellen genom att lägga till, redigera eller ta bort personal
            if (request.session && request.session.userId) {
                tableRowsHtml += `
    <div class="row">
        <div class="table_cell_values">${emp.employeeCode}</div>
        <div class="table_cell_values_name"><a href="/api/personnelregistry/${emp.employeeCode}">${emp.name} </a></div>
        <div class="table_cell_values">${emp.signatureDate}</div>
        <div class="table_cell_values">${emp.rank}</div>
        <div class="table_cell_values">${emp.securityAccessLevel}</div>
        <div class="edit_button"><a href="/api/editemployee/${emp.employeeCode}"> E </a></div>
        <div class="delete_button"><a href="/api/deleteemployee/${emp.employeeCode}"> D </a></div>
        
    </div>`;
            }
            else {
                tableRowsHtml += `
    <div class="row">
        <div class="table_cell_values">${emp.employeeCode}</div>
        <div class="table_cell_values_name"><a href="/api/personnelregistry/${emp.employeeCode}">${emp.name} </a></div>
        <div class="table_cell_values">${emp.signatureDate}</div>
        <div class="table_cell_values">${emp.rank}</div>
        <div class="table_cell_values">${emp.securityAccessLevel}</div>
    </div>`;
            }
        });
    } catch (error) {
        console.error("Databasfel:", error);
        response.write("<p>Kunde inte hämta personaldata från databasen.</p>");
    }


    const currentUserId = request.session.userId || null;
    const fullContent =
        newemployeebttn +
        readHTML('./masterframe/personnelregistrystart.html') +
        tableRowsHtml +
        readHTML('./masterframe/personnelregistrystop.html');

    const secAccessLevel = request.session.securityAccessLevel || null;
    response.render('user', {
        securityAccessLevel: secAccessLevel,
        userId: currentUserId, // Nu är variabeln DEFINIERAD för EJS
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: readHTML('./masterframe/menu.html'),
        content: fullContent
    })
});

// --------------------- Hämta en specifik person -------------------------------
router.get('/:employeeId', function (request, response) {
    const targetId = request.params.employeeId;

    // FE står för 'Found Employee'
    const FE = db.prepare('SELECT * FROM employees WHERE employeeCode = ?').get(targetId);
    // Lägg till en logg precis innan find för att se vad du letar efter
    if (!FE) {
        console.log("HITTADE INGEN MATCH!");
        return response.status(404).send('Employee not found!');
    }



    let htmloutput = `
           <link rel="stylesheet" type="text/css" href="css/personell.css">
              
                    <table class="mellantabell">
                      <td class="fotokolumn">
                        <table class="fotokolumn">
                          <tr>
                            <td><img src="/photos/${FE.employeeCode}.jpg" 
                            onerror="this.onerror=null; this.src='/photos/${FE.employeeCode}.png';" 
                            alt="${FE.name}" 
                            style="width:164px;" /></td>
                          </tr>
                          <tr><td class="spacer10"></td></tr>
                          <tr>
                            <td class="fotokolumntextkod">
                              <span class="employee">EMPLOYEE CODE: </span>
                              <span class="kod">${FE.employeeCode}</span>
                            </td>
                          </tr>
                          <tr><td class="spacer10"></td></tr>
                          <tr>
                            <td class="fotokolumntextlevel">
                              <span>SECURITY CLEARANCE LEVEL: </span> <br>
                              <span class="level">${FE.securityAccessLevel}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td class="variabler">
                        <table class="variabler-tabell">
                            <tr><td class="variabel-label">NAME:</td></tr>
                            <tr><td class="spacer10"></td></tr>
                            <tr><td class="variabel-label">DATE OF BIRTH:</td></tr>
                            <tr><td class="spacer10"></td></tr>
                            <tr><td class="variabel-label">SEX:</td></tr>
                            <tr><td class="spacer10"></td></tr>
                            <tr><td class="variabel-label">BLOOD TYPE:</td></tr>
                            <tr><td class="spacer10"></td></tr>
                            <tr><td class="variabel-label">HEIGHT:</td></tr>
                            <tr><td class="spacer10"></td></tr>
                            <tr><td class="variabel-label">WEIGHT:</td></tr>
                            <tr><td class="spacer10"></td></tr>
                            <tr><td class="variabel-label">DEPARTMENT:</td></tr>
                            <tr><td class="spacer10"></td></tr>
                            <tr><td class="variabel-label">RANK:</td></tr>
                        </table>
                      </td>
                      <td class="varden">
                        <table class="varden-tabell">
                          <tr><td class="varde-rad">${FE.name}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${FE.dateOfBirth}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${FE.sex}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${FE.bloodType}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${FE.height}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${FE.weight}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${FE.department}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${FE.rank}</td></tr>
                        </table>
                      </td>
              </table>`;

    let htmloutput2 = `
            <!-- ========================= Background start ========================= -->

                <!-- Box-rubrik -->
                <table class="boxrubrik">
                    <tr>
                    <td class="boxrubriktext">&nbsp;&nbsp;Background</td>
                    </tr>
                </table>
                <!-- Box-rubrik slut -->
                <!-- Background-tabell start -->
                <table class="infotable">
                    <tr>
                    <td class="infotablecell">
                            ${FE.background}
                    </td>
                    </tr>
                </table>
                <!-- Strenhths-tabell slut -->
                <!-- Background-tabell slut -->

                <!-- ========================= Background slut ========================= -->

                <!-- ========================= Strengths start ========================= -->

                <!-- Box-rubrik -->
                <table class="boxrubrik">
                    <tr>
                    <td class="boxrubriktext">&nbsp;&nbsp;Strengths</td>
                    </tr>
                </table>
                <!-- Box-rubrik slut -->
                <!-- Background-tabell start -->
                <table class="infotable">
                    <tr>
                    <td class="infotablecell">
                            ${FE.strengths}
                    </td>
                    </tr>
                </table>
                <!-- Strenhths-tabell slut -->
                <!-- Background-tabell slut -->

                <!-- ========================= Strengths slut ========================= -->

                <!-- ========================= Weaknesses start ========================= -->

                <!-- Box-rubrik -->
                <table class="boxrubrik">
                    <tr>
                    <td class="boxrubriktext">&nbsp;&nbsp;Weaknesses</td>
                    </tr>
                </table>
                <!-- Box-rubrik slut -->
                <!-- Background-tabell start -->
                <table class="infotable">
                    <tr>
                    <td class="infotablecell">
                            ${FE.weaknesses}
                    </td>
                    </tr>
                </table>
                <!-- Strenhths-tabell slut -->
                <!-- Background-tabell slut -->

                <!-- ========================= Weaknesses slut ========================= -->
`

    const currentUserId = request.session.userId || null;
    const fullContent =
        htmloutput +
        htmlInfoStop +
        htmloutput2;

    const secAccessLevel = request.session.securityAccessLevel || null;
    response.render('user', {
        securityAccessLevel: secAccessLevel,
        userId: currentUserId, // Nu är variabeln DEFINIERAD för EJS
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: readHTML('./masterframe/menu.html'),
        content: fullContent
    })
});

// --------------------- Skapa en ny person -------------------------------
router.post('/add', function (request, response) {
    const { employeeCode, name, rank, department, securityAccessLevel } = request.body;

    try {
        const insert = db.prepare(`
            INSERT INTO employees (employeeCode, name, rank, department, securityAccessLevel) 
            VALUES (?, ?, ?, ?, ?)
        `);

        insert.run(employeeCode, name, rank, department, securityAccessLevel);
        response.status(201).json({ message: "Anställd skapad!" });
    } catch (err) {
        console.error(err);
        response.status(500).send("Kunde inte lägga till personal. Koden kanske redan finns?");
    }
});

// --------------------- Uppdatera en person -------------------------------
router.put('/:employeeId', function (request, response) {
    const targetId = request.params.employeeId;
    const updates = request.body; // Vi förväntar oss t.ex. { name: 'Nytt namn', rank: 'Ny rank' }

    try {
        // Vi bygger en dynamisk UPDATE-fråga
        const keys = Object.keys(updates);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        if (keys.length === 0) return response.status(400).send('Ingen data skickad');

        const sql = `UPDATE employees SET ${setClause} WHERE employeeCode = ?`;
        const stmt = db.prepare(sql);

        // Lägg till targetId sist i värde-arrayen för WHERE-klausulen
        stmt.run(...values, targetId);

        response.send({ message: 'Success' });
    } catch (error) {
        console.error(error);
        response.status(500).send('Kunde inte uppdatera');
    }
});

// --------------------- Radera en specifik person -------------------------------
router.delete('/:id', function (request, response) {
    const employee = personnel.find(o => o.id === parseInt(request.params.id));
    if (!employee) response.status(404).send('Employee not found!');

    const index = personnel.indexOf(employee);
    personnel.splice(index, 1);

    response.send(employee);
});



module.exports = router;