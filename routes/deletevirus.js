const express = require('express');
const router = express.Router();

router.use(express.static('./public'));
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'database', 'data.db');
const db = new Database(dbPath);

const checkAuth = require('../authMiddleware.js'); // Se till att sökvägen stämmer
// --------------------- Läs in Masterframen --------------------------------
const readHTML = require('../readHTML.js');
const fs = require('fs');

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


// ---------------------- Radera person ------------------------------------------------
router.get('/:virusId', checkAuth, function (request, response) {


    // Öppna databasen



    response.setHeader('Content-type', 'text/html');
    response.write(htmlHead);
    if (request.session && request.session.userId) {
        htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
        response.write(htmlLoggedinMenuCSS);
        htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');
        response.write(htmlLoggedinMenuJS);
        htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');
        response.write(htmlLoggedinMenu);

    }
    response.write(htmlLoggedinMenuCSS);
    response.write(htmlLoggedinMenuJS);
    response.write(htmlLoggedinMenu);


    response.write(htmlHeader);
    response.write(htmlMenu);
    response.write(htmlInfoStart);


    try {
        // Ta reda på användarens employeecode (för att kunna radera bilden)
        const employeeCodeToDelete = request.params.virusId;

        // Radera direkt från databasen
        const deleteEmployee = db.prepare("DELETE FROM ResearchObjects WHERE ID = ?");
        const result = deleteEmployee.run(employeeCodeToDelete);

        // Radera bilden
        if (result.changes > 0) {

            response.write("virus deleted...");
        } else {
            response.write("No virus found with that code.");
        }

        // Ge respons till användaren
        response.write("virus deleted<br/><p /><a href=\"/api/personnelregistry\" style=\"color:#336699;text-decoration:none;\">Delete another virus</a>");
    } catch (error) {
        console.error(error);
        response.status(500).send('Kunde inte uppdatera');
    }


    response.write(htmlInfoStop);
    response.write(htmlFooter);
    response.write(htmlBottom);
    response.end();


});


module.exports = router;