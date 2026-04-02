const express = require('express');
const router = express.Router();

router.use(express.static('./public'));
const path = require('path');
const Database = require('better-sqlite3');
// Activity log
const dbPath = path.join(__dirname, '..', 'data', 'database', 'activity_log.db');
const db = new Database(dbPath);

//makes so only A and B secrityaccess can edit, delete and add new objects
const canEdit = (request) => {
    if (!request.session.userId) return false;
    const level = request.session.securityAccessLevel;
    return ['A', 'B'].includes(level);
};
// --------------------- Läs in Masterframen --------------------------------
const readHTML = require('../readHTML.js');
const fs = require('fs');
const { json } = require('express');

var htmlHead = readHTML('./masterframe/head.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlMenu = readHTML('./masterframe/menu.html');
var htmlInfoStart = readHTML('./masterframe/infoStart.html');
var htmlInfoStop = readHTML('./masterframe/infoStop.html');
var htmlBottom = readHTML('./masterframe/bottom.html');

// ----------------------  -------------------------------
router.get('/', (request, response) => {


    if (canEdit(request)) {
        try {

            // --- SÄKERHETSKONTROLL (Whitelist) ---
            const allowedSortTypes = ['ID', 'Activity', 'EmployeeCode', 'Name', 'Date'];
            const sortType = allowedSortTypes.includes(request.cookies.sortType)
                ? request.cookies.sortType
                : 'ID'; // Standard om inget matchar

            const sortAmount = parseInt(request.cookies.sortAmount) || 20;

            // HTML för sorteringsknappar
            let htmlOutput = `<link rel="stylesheet" href="css/personnel_registry.css" />
                              <script src="./scripts/activitylogsorting.js"></script>
                              <table border="0">
                                <tr>
                                    <td width="100px"><h2>Activity Log</h2></td>
                                    <td width="80"><h2>Sort Count:</h2></td>
                                    ${[20, 50, 100, 150].map(num => `
                                        <td width="52" onclick="sorting(${num}, '${sortType}')">
                                            <a style="cursor: pointer;"><h2><b>${num}</b></h2></a>
                                        </td>`).join('')}
                                    <td width="88"><h2>Sort By:</h2></td>
                                    <td width="64" onclick="sorting(${sortAmount}, 'Activity')"><a><h2>Activity</h2></a></td>
                                    <td width="52" onclick="sorting(${sortAmount}, 'EmployeeCode')"><a><h2>User</h2></a></td>
                                    <td width="52" onclick="sorting(${sortAmount}, 'ID')"><a><h2>Date</h2></a></td>
                                </tr>
                              </table>`;

            htmlOutput += `<div class="table">
                            <div class="row">
                                <div class="light_column_cell">Activity</div>
                                <div class="dark_column_cell">User</div>
                                <div class="light_column_cell">Name</div>
                                <div class="light_column_cell">Date</div>
                                <div class="light_column_cell">Time</div>
                                <div class="light_column_cell">Delete</div>
                            </div>
                          `;

            // --- SÄKER QUERY ---
            // Vi använder template literal för kolumnnamnet (eftersom det är validerat mot vår whitelist)
            // och ? för antalet (LIMIT).
            const sql = sortType === "ID"
                ? `SELECT ID, Activity, EmployeeCode, Name, Date, Time FROM Log ORDER BY ${sortType} DESC LIMIT ?`
                : `SELECT ID, Activity, EmployeeCode, Name, Date, Time FROM Log ORDER BY ${sortType} DESC, ID DESC LIMIT ?`;

            const rows = db.prepare(sql).all(sortAmount);

            // Loopa igenom resultaten
            rows.forEach(row => {
                htmlOutput += `
                    <div class="row">
                        <div class="table_cell_values">${row.Activity}</div>
                        <div class="table_cell_values_name">${row.EmployeeCode}</div>
                        <div class="table_cell_values">${row.Name}</div>
                        <div class="table_cell_values">${row.Date}</div>
                        <div class="table_cell_values">${row.Time}</div>
                        <div class="table_cell_values">
                            <a href="/api/activitylog/${row.ID}" style="color:red;text-decoration:none;">D</a>
                        </div>
                    </div>`;
            });

            htmlOutput += "</div></div>";


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
        } catch (err) {
            console.error(err);
            response.status(500).send("Database Error");
        }
    } else {
        renderBase();
        response.write("<h2>You are not authorised to access this.</h2>");
        response.write(htmlInfoStop);
        response.write(htmlBottom);
        response.end();
    }
});

// Delete specific activity log
router.get('/:id', (request, response) => {
    // Öppna databasen
    let htmloutput = ``
    const deleteID = request.params.id;

    try {


        if (canEdit(request))  // check permissions first
        {
            const findId = db.prepare(`SELECT ID FROM Log WHERE ID= ?`).get(deleteID);
            const deletestmt = db.prepare(`DELETE FROM Log WHERE ID= ?`)
            if (!findId) {

                htmloutput += `Object not found.`;
            }
            else {
                // delete record - note: deleteResult not result
                deletestmt.run(deleteID)
                htmloutput += `Activity log deleted.<br />
                <a href="http://localhost:3000/api/activitylog" style="color:#336699;">Back to Activity Log</a>`;
            }
        }
        else {
            response.write("You are not authorised to do this.");
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
    } catch (err) {
        console.error(err);
        response.status(500).send("Database Error");

    }


});


module.exports = router;