const express = require('express');
const readHTML = require('../readHTML.js');
const router = express.Router();
router.use(express.json());
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const backupVirus = require('../backup.js');
const { read } = require('pdfkit');
const { getVirusImagesHTML } = require('./virusimages.js'); // Importera funktionen för att generera HTML för virusbilder'
const { get } = require('http');

const dbPath = path.join(__dirname, '..', 'data', 'database', 'data.db');
const db = new Database(dbPath);

router.use(express.static('./public'));
var htmlVirusDatabaseStart = readHTML('./masterframe/virusdatabasestart.html')
var htmlVirusDatabaseStop = readHTML('./masterframe/virusdatabasestop.html')
var htmlVirusimagesCSS = readHTML('./masterframe/virusimages_css.html');




router.get('/', function (request, response) {
  const secAccessLevel = request.session.securityAccessLevel || null;
  let tableRowsHtml = "";
  // läs in och extrahera värdena ur XML filen
  try {
    const combinedData = db.prepare(`
      SELECT 
        o.id as virusnummer,
        o.objectStatus,
        o.objectNumber, 
        o.objectName, 
        o.objectCreatedDate, 
        o.objectCreator, 
        MAX(e.entryDate) AS lastChangedDate,  
        COUNT(e.id) AS actualEntries 
      FROM ResearchObjects o
      LEFT JOIN ResearchEntries e ON o.id = e.researchObjectId
      GROUP BY o.id
      ORDER BY o.objectNumber ASC
    `).all();



    combinedData.forEach(virus => {
      if (virus.objectStatus === 'archive' && secAccessLevel !== 'A') { } else {
        const archiveClass = (virus.objectStatus === 'archive') ? 'row-archived' : 'row';
        tableRowsHtml += `
    <div class="${archiveClass}">
        <div class="table_cell_values">${virus.objectNumber}</div>
        <div class="table_cell_values_name"><a href="/api/virusdatabase/${virus.virusnummer}">${virus.objectName} </a></div>
        <div class="table_cell_values">${virus.objectCreatedDate}</div>
        <div class="table_cell_values">${virus.objectCreator}</div>
        <div class="table_cell_values">${virus.actualEntries}</div>
        <div class="table_cell_values">${virus.lastChangedDate || '0'}</div>

    </div>`;
      }
    });
  } catch (error) {
    console.error("Databasfel:", error);
    tableRowsHtml = "<p>Systemet kunde inte ladda data just nu.</p>";

  }


  const currentUserId = request.session.userId || null;

  const fullContent =
    htmlVirusDatabaseStart +
    tableRowsHtml +
    htmlVirusDatabaseStop;

  // 3. Skicka detta objekt till din EJS-fil

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


router.get('/:virusId', function (request, response) {
  const targetId = request.params.virusId;
  const safeVirusId = String(targetId).replace(/[^a-zA-Z0-9_-]/g, '');
  const dirPath = path.join(__dirname, '..', 'data', safeVirusId, 'attachments');
  const functionread = getVirusImagesHTML(targetId);

  let attachmentsHTML = '';

  let hardcodedtest = 'open'

  // toggle
  let level = request.session.securityAccessLevel ? request.session.securityAccessLevel.toString().trim().toUpperCase() : "";
  const btnText = (hardcodedtest === 'open') ? 'Archive Object' : 'Open Object';

  let toggleUrl = (level === 'A')
    ? `/api/virusdatabase/toggle/${safeVirusId}`
    : `javascript:alert('Access denied. Incorrect permissions.');`;


  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);

    attachmentsHTML = files.map(file => {
      const fullPath = path.join(dirPath, file);
      const stats = fs.statSync(fullPath);

      return `
      <div class="source_row">
        <span class="source_value">${file}</span>
        <span class="source_size">${(stats.size / 1024).toFixed(1)} KB</span>
        <span class="source_date"></span>
        <div class="source_icons">
          <form method="POST" action="/api/virusdatabase/${safeVirusId}/delete-file" style="display:inline;">
      <input type="hidden" name="fileName" value="${file}">
      <button type="submit">🗑️</button>
    </form>
        </div>
      </div>
    `;
    }).join('');
  } else {
    attachmentsHTML = `<div class="source_row">Inga filer</div>`;
  }
  const virus = db.prepare('SELECT * FROM ResearchObjects WHERE id = ?').get(targetId)
  if (!virus) {
    console.log("HITTADE INGEN MATCH!");
    return response.status(404).send('virus not found!');
  }

  let htmloutput = `
    <link rel="stylesheet" type="text/css" href="css/viruscss.css">

    
    <div style="padding: 20px;">
        <h1>Research Database:</h1>
        
        <div class="virusRow" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
                <span id="virus_number" style="font-size: 28px; font-weight: bold;">${virus.objectNumber}</span>
                <span id="virus_name" style="font-size: 24px;">${virus.objectName}</span>
            </div>
            
            <div class="dateTimeCreator" style="text-align: right;">
                Created: ${virus.objectCreatedDate} ${virus.objectCreatedTime}<br>
                By: ${virus.objectCreator}
            </div>
        </div>

        <div id="objectText">
            ${virus.objectText || "Forskningstext saknas i databasen."}
        </div>

        <div id="editbutton">
            <a href="/api/virusdatabase/edit/${virus.ID}" class="edit-btn">Edit info</a>
        </div>
    
  <div id="sources_container">
    <div class="source_row">
        <span class="source_label">Security data sheet:</span>
        <span class="source_value">${virus.objectNumber} ${virus.objectName}.pdf</span>
        <span class="source_size">1300 KB</span>
        <span class="source_date">12.04.2023</span>
        <div class="source_icons">
            <span class="icon_edit">📝</span> 
            <span class="icon_delete">🗑️</span>
        </div>
    </div>

    <div class="source_row">
        <span class="source_label">Security Presentation Video:</span>
        <span class="source_value">http://www.youtube.com/...</span>
        <span class="source_size"></span> <span class="source_date"></span>
        <div class="source_icons">
            <span class="icon_edit">📝</span>
        </div>
    </div>

    <div class="source_row">
        <span class="source_label">Security Handling Video:</span>
        <span class="source_value">http://www.youtube.com/...</span>
        <span class="source_size"></span>
        <span class="source_date"></span>
        <div class="source_icons">
            <span class="icon_edit">📝</span>
        </div>
    </div>

</div>
<a href="${toggleUrl}" class='edit-btn'>${btnText}</a>
<div class="addNewFile">
    <p>Upload new file</p>
    <span class="icon_add_file"><a href="/api/data/${safeVirusId}">📝</a></span>
</div>
  <span class="source_label">Attachment:</span>
<div id="sources_container">
  ${attachmentsHTML}
</div>
            <div style="display:flex; align-items: center; justify-content: space-between; width: 650px;">
                <a href="http://localhost:3000/api/virusdatabase/backup/${virus.ID}" style="color:#336699;text-decoration:none;"> 
                <button style="margin-top:10px; padding:6px 14px; background:#4682B4;
                 color:#000; border:1px solid #000; border-radius:0; font-size:12px; font-weight:bold; cursor:pointer;">
                    Backup virus
                </button></a>
            </div>

                
    <h1 style="margin-top: 20px;">Research Entries: </h1>
    <form action="/" id="entryForm" name="entryForm">
        <b>Heading:</b> <input type="text" id="entryHeadingInput" />
        <textarea name="newEntry" id="newEntry"></textarea>
        <input type="button" value="Submit entry" id="submitButton" onClick="submitEntry()"/>
    </form>
    <div id="pastEntryBox"></div>

${functionread}
</div>
`;

  const currentUserId = request.session.userId || null;
  const fullContent =
    htmloutput;


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

// --------------------- Växla Open/Archive -------------------
router.get('/toggle/:id', async function (request, response) {
  const targetId = request.params.id;

  let userLevel = request.session.securityAccessLevel || "";
  userLevel = userLevel.toString().trim().toUpperCase();

  if (userLevel !== 'A') {
    return response.status(403).send("<h1>Nekat</h1><p>Bara administratörer (A) får göra detta.</p>");
  }

  try {
    // 1. Använd .get() för att faktiskt köra frågan och hämta en rad
    // 2. Använd ? som placeholder för att undvika SQL-injektion
    const row = db.prepare(`SELECT objectStatus FROM ResearchObjects WHERE id = ?`).get(targetId);

    // Kontrollera om raden faktiskt hittades
    if (row) {
      const currentStatus = row.objectStatus;
      const newStatus = (currentStatus === 'open') ? 'archive' : 'open';

      // 3. Kör UPDATE med .run() och skicka med variablerna som argument
      db.prepare(`UPDATE ResearchObjects SET objectStatus = ? WHERE id = ?`)
        .run(newStatus, targetId);
    }

    response.redirect('/api/virusdatabase/' + targetId);
  } catch (error) {
    console.error(error); // Bra att logga felet i konsolen så du ser vad som händer
    response.status(500).send("Update failed.");
  }
});
// edit sidan
router.get('/edit/:virusId', function (request, response) {
  const targetId = request.params.virusId;

  const virus = db.prepare('SELECT * FROM ResearchObjects WHERE id = ?').get(targetId)
  console.log(targetId)
  if (!virus) {
    console.log("HITTADE INGEN MATCH!");
    return response.status(404).send('virus not found!');
  }

  let htmloutput = `
    <form action="/api/virusdatabase/update/${virus.objectNumber}" method="POST">
    <link rel="stylesheet" type="text/css" href="/css/viruscss.css">
    
    <div style="padding: 20px;">
        <h1>Edit Research Entry:</h1>
        
        <div class="virusRow" style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
                <label style="display:block; font-size: 10px; font-weight: bold;">OBJECT NUMBER & NAME</label>
                <input type="text" name="objectNumber" value="${virus.objectNumber}" 
                       style="font-size: 28px; font-weight: bold; width: 120px; border: 1px solid #ccc;">
                <input type="text" name="objectName" value="${virus.objectName}" 
                       style="font-size: 24px; width: 300px; border: 1px solid #ccc;">
            </div>
            
            <div class="dateTimeCreator" style="text-align: right; font-size: 12px;">
                Created: ${virus.objectCreatedDate}<br>
                By: ${virus.objectCreator}
            </div>
        </div>

        <div id="objectText" style="padding: 0;"> <textarea name="objectText" 
                      style="width: 100%; height: 200px; border: none; padding: 15px; box-sizing: border-box; font-family: Arial; font-size: 14px;"
            >${virus.objectText}</textarea>
        </div>

        <div style="margin-top: 20px;">
            <button type="submit" class="edit-btn" style="background-color: #548d8d; cursor: pointer;">
                SAVE RESEARCH DATA
            </button>
            <a href="/api/virusdatabase/${virus.objectNumber}" style="margin-left: 10px; color: red;">Cancel</a>
        </div>
    </div>
    </form>
`;

  const currentUserId = request.session.userId || null;
  const fullContent =
    htmloutput;


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




//sparar ändringarna
router.post('edit/:virusId', function (request, response) {
  const targetId = request.params.virusId;
  const b = request.body;
  const updates = {
    objectNumber: b.fobjectNumber,
    objectName: b.fobjectName,
    objectText: b.fobjectText
  };

  try {
    // Filtrera bort undefined-värden för att undvika att skriva över med null
    const keys = Object.keys(updates).filter(key => updates[key] !== undefined);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => updates[key]);

    if (keys.length === 0) {
      return response.status(400).send('Ingen data skickades');
    }

    const sql = `UPDATE ResearchObjects SET ${setClause} WHERE ID = ?`;

    // Kör queryn. Vi skickar med värdena + targetId för WHERE-klausulen
    db.prepare(sql).run(...values, targetId);

    console.log(`Uppdatering lyckades för: ${targetId}`);
    response.redirect('/api/virusdatabase/' + (targetId));
  } catch (error) {
    console.error("SQL Fel:", error);
    response.status(500).send('Kunde inte uppdatera databasen');
  }
});


router.post('/:virusId/delete-file', (req, res) => {
  const virusId = req.params.virusId;
  const fileName = req.body.fileName;

  const safeVirusId = String(virusId).replace(/[^a-zA-Z0-9_-]/g, '');
  const safeFileName = String(fileName).replace(/[^a-zA-Z0-9_.-]/g, '');

  const filePath = path.join(__dirname, '..', 'data', safeVirusId, 'attachments', safeFileName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log("Deleted:", filePath);
  }

  res.redirect(`/api/virusdatabase/${virusId}`);
});


router.get('/backup/:virusId', async function (request, response) {
  const currentUserId = request.session.userId || null;
  const virusId = request.params.virusId;
  let htmlOutput = ""

  const virus = db.prepare('SELECT * FROM ResearchObjects WHERE id = ?').get(virusId)
  if (!virus) {
    console.log("HITTADE INGEN MATCH!");
    return response.status(404).send('virus not found!');
  }
  async function backed() {


    if (request.session && request.session.userId) {
      htmlOutput += `
            <div style="display:flex; align-items: center; justify-content: space-between; width: 650px;">
            <a href="http://localhost:3000/api/editvirus/${virusId}" style="color:#336699;text-decoration:none;"> 
                <button style="margin-top:10px; padding:6px 14px; background:#4682B4;
                 color:#000;
                               border:1px solid #000; border-radius:0;
                               font-size:12px; font-weight:bold; cursor:pointer;">
                    Edit info
                </button></a>
                <button style="margin-top:10px; padding:6px 14px; background:#4682B4;
                 color:#000; border:1px solid #000; border-radius:0; font-size:12px; font-weight:bold; cursor:pointer;">`
      if (await backupVirus(virus)) {
        htmlOutput += `Virus is now backed up`;
      } else {
        htmlOutput += `Error backing up virus`;
      }
      htmlOutput += `</button></div>`
    };
  }
  await backed();
  const secAccessLevel = request.session.securityAccessLevel || null;
  response.render('user', {
    securityAccessLevel: secAccessLevel,
    userId: currentUserId, // Nu är variabeln DEFINIERAD för EJS
    cookieemployeecode: request.cookies.employeecode,
    cookiename: request.cookies.name,
    cookielogintimes: request.cookies.logintimes,
    cookielastlogin: request.cookies.lastlogin,
    menu: readHTML('./masterframe/menu_back.html'),
    content: htmlOutput
  })

});


module.exports = router;