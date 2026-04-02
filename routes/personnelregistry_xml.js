const e = require('express');
const { application } = require('express');
const express = require('express');
const readHTML = require('../readHTML.js');
const router = express.Router();
router.use(express.json());
const xml2js = require('xml2js');
//var path = require('path');

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


// Test-array med personal
const personnel =
    [
        { id: 1, employeecode: 'ITXX-01', name: 'Hulk' },
        { id: 2, employeecode: 'ITXX-02', name: 'Grimlock' },
        { id: 3, employeecode: 'ITXX-03', name: 'Professor Chaos' },
        { id: 4, employeecode: 'ITXX-04', name: 'Ironman' },
        { id: 5, employeecode: 'ITXX-05', name: 'Gargamel' },
        { id: 6, employeecode: 'ITXX-06', name: 'Cara Dune' },
        { id: 7, employeecode: 'ITXX-07', name: 'Darkwing Duck' },
        { id: 8, employeecode: 'ITXX-08', name: 'Hellcat' },
        { id: 9, employeecode: 'ITXX-09', name: 'Judge Dredd' }
    ];

// --------------------- Lista all personal -------------------------------
router.get('/', function (request, response) {
    //response.send(personnel); // Skriver ut objektet array, kan inte mixa sträng och objekt i res.send()
    //response.sendFile(path.join(__dirname, '../', 'head.html')) // Läser in EN html-fil
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write(htmlHead);
    response.write(htmlHeader);
    response.write(htmlMenu);
    response.write(htmlInfoStart);

    // skapa tabell struktur för de inhämtade värdena

    response.write(htmlPersonnelStart);

    // läs in och extrahera värdena ur XML filen
    let fsx = require('fs');
    let xmltext = fsx.readFileSync('./data/xml/personnel_registry.xml');
    xmltext = xmltext.toString();
    xmltext = xmltext.replace(/[\n\t\r]/g, "");
    let xmlArray = xmltext.split('<employee>');
    xmlArray.shift();
    let tableRowsHtml = "";
    xmlArray.forEach(employee => {
        let str_employeeCode = employee.substring(employee.indexOf('<employeeCode>') + 14, employee.lastIndexOf('</employeeCode>'));

        let str_name = employee.substring(employee.indexOf('<name>') + 6, employee.lastIndexOf('</name>'));
        let str_signatureDate = employee.substring(employee.indexOf('<signatureDate>') + 15, employee.lastIndexOf('</signatureDate>'));
        let str_rank = employee.substring(employee.indexOf('<rank>') + 6, employee.lastIndexOf('</rank>'));
        let str_securityAccessLevel = employee.substring(employee.indexOf('<securityAccessLevel>') + 21, employee.lastIndexOf('</securityAccessLevel>'));

        tableRowsHtml += `
    <div class="row">
        <div class="table_cell_values">${str_employeeCode}</div>
        <div class="table_cell_values_name"><a href="/api/personnelregistry/${str_employeeCode}">${str_name} </a></div>
        <div class="table_cell_values">${str_signatureDate}</div>
        <div class="table_cell_values">${str_rank}</div>
        <div class="table_cell_values">${str_securityAccessLevel}</div>
    </div>`;
    });
    response.write(tableRowsHtml)
    response.write(htmlPersonnelStop);
    response.write(htmlInfoStop);
    response.write(htmlFooter);
    response.write(htmlBottom);
    response.end();

    //response.send(personnel);
});

// --------------------- Hämta en specifik person -------------------------------
router.get('/:employeeId', function (request, response) {
    const targetId = request.params.employeeId;

    // Flytta in require högst upp i filen egentligen, men här fungerar också
    let fsx = require('fs');
    let xml2js = require('xml2js');

    fsx.readFile('./data/xml/personnel_registry.xml', 'utf-8', function (err, data) {
        if (err) {
            // Om filen inte finns skickar vi felet direkt
            return response.status(500).send('Kunde inte läsa XML-filen');
        }

        xml2js.parseString(data, function (err, result) {
            if (err || !result) {
                return response.status(500).send('Fel vid parsing av XML');
            }

            let employees = result.personnelRegistry.employee;
            let foundEmployee = null;

            // Leta efter rätt anställd
            for (let i = 0; i < employees.length; i++) {
                if (employees[i].employeeCode && employees[i].employeeCode[0] === targetId) {
                    foundEmployee = employees[i];
                    break;
                }
            }

            if (!foundEmployee) {
                // Om vi inte hittar personen, skicka 404
                return response.status(404).send('Employee not found!');
            }

            // Extrahera värden (med säkerhetskoll för [0])
            let str_employeeCode = foundEmployee.employeeCode[0];
            let str_name = foundEmployee.name ? foundEmployee.name[0] : "Unknown";
            let str_dateOfBirth = foundEmployee.dateOfBirth ? foundEmployee.dateOfBirth[0] : "-";
            let str_sex = foundEmployee.sex ? foundEmployee.sex[0] : "-";
            let str_bloodType = foundEmployee.bloodType ? foundEmployee.bloodType[0] : "-";
            let str_height = foundEmployee.height ? foundEmployee.height[0] : "-";
            let str_weight = foundEmployee.weight ? foundEmployee.weight[0] : "-";
            let str_rank = foundEmployee.rank ? foundEmployee.rank[0] : "-";
            let str_department = foundEmployee.department ? foundEmployee.department[0] : "-";
            let str_securityLevel = foundEmployee.securityAccessLevel ? foundEmployee.securityAccessLevel[0] : "N/A";

            let str_background = foundEmployee.background ? foundEmployee.background[0] : "N/A";
            let str_strengths = foundEmployee.strengths ? foundEmployee.strengths[0] : "N/A";
            let str_weaknesses = foundEmployee.weaknesses ? foundEmployee.weaknesses[0] : "N/A";

            // NU skickar vi headern, när vi vet att allt gick bra
            response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            response.write(htmlHead);
            response.write(htmlHeader);
            response.write(htmlMenu);
            response.write(htmlInfoStart);

            let htmloutput = `
           <link rel="stylesheet" type="text/css" href="css/personell.css">
              
                    <table class="mellantabell">
                      <td class="fotokolumn">
                        <table class="fotokolumn">
                          <tr>
                            <td><img src="/photos/${str_employeeCode}.jpg" alt="${str_name}" style="width:164px;" /></td>
                          </tr>
                          <tr><td class="spacer10"></td></tr>
                          <tr>
                            <td class="fotokolumntextkod">
                              <span class="employee">EMPLOYEE CODE: </span>
                              <span class="kod">${str_employeeCode}</span>
                            </td>
                          </tr>
                          <tr><td class="spacer10"></td></tr>
                          <tr>
                            <td class="fotokolumntextlevel">
                              <span>SECURITY CLEARANCE LEVEL: </span> <br>
                              <span class="level">${str_securityLevel}</span>
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
                          <tr><td class="varde-rad">${str_name}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${str_dateOfBirth}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${str_sex}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${str_bloodType}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${str_height}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${str_weight}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${str_department}</td></tr>
                          <tr><td class="varde-linje"></td></tr>
                          <tr><td class="varde-spacer"></td></tr>
                          <tr><td class="varde-rad">${str_rank}</td></tr>
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
                            ${str_background}
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
                            ${str_strengths}
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
                            ${str_weaknesses}
                    </td>
                    </tr>
                </table>
                <!-- Strenhths-tabell slut -->
                <!-- Background-tabell slut -->

                <!-- ========================= Weaknesses slut ========================= -->
`

            response.write(htmloutput);
            response.write(htmlInfoStop);
            response.write(htmloutput2);

            response.write(htmlFooter);
            response.write(htmlBottom);
            response.end(); // Avsluta alltid anropet inuti callbacken
        });
    });
});

// --------------------- Skapa en ny person -------------------------------
router.post('/', function (request, response) {
    const employee = {
        id: personnel.length + 1,
        employeecode: request.body.employeecode,
        name: request.body.name,
    };
    personnel.push(employee);
    response.send(employee);
});

// --------------------- Uppdatera en person -------------------------------
router.put('/:id', function (request, response) {
    const employee = personnel.find(o => o.id === parseInt(request.params.id));
    if (!employee) response.status(404).send('Employee not found!');

    employee.employeecode = request.body.employeecode;
    employee.name = request.body.name;
    response.send(employee);
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