const express = require('express');
const session = require('express-session');
const router = express.Router();
const bodyParser = require('body-parser');
var formidable = require('formidable');
router.use(express.json());
const Database = require('better-sqlite3');
const path = require('path');
// Öppna databasen
const dbPath = path.join(__dirname, '..', 'data', 'database', 'tricell_intranet.db');
const db = new Database(dbPath);


router.post('/', (request, response) => {
    if (request.session.userId) {

        const message = request.body.chatmessage;
        const employeeid = request.session.userId;

        try {
            // Skriv in nytt meddelande 
            const insert = db.prepare(`
                INSERT INTO chat (message, employeeCode, createdAt, readBy) 
                VALUES (?, ?, datetime('now', 'localtime'), ?)
            `)
            // Radera gamla meddelanden ur chatten
            const limitrule = db.prepare("DELETE FROM chat WHERE id NOT IN (SELECT id FROM chat ORDER BY id DESC LIMIT 20)");


            limitrule.run();
            insert.run(message, employeeid, employeeid)
            response.send("");
        } catch (err) {
            console.error(err);
            response.status(500).send("Ett fel uppstod");
        }
    }
});

router.get('/', (request, response) => {
    if (request.session.userId) {
        try {
            let chatbody = "";
            const currentUsername = request.session.userId;

            // 1. Hämta meddelanden och joina med employee-tabellen
            // Vi använder createdAt istället för postdate/posttime
            const query = `
                SELECT o.id, o.message, o.createdAt, o.readBy, o.employeeCode, i.name 
                FROM chat o 
                INNER JOIN employees i ON o.employeeCode = i.employeeCode 
                ORDER BY o.id ASC
            `;

            const messages = db.prepare(query).all();

            // Förbered UPDATE-statement utanför loopen för bättre prestanda
            const updateReadBy = db.prepare("UPDATE chat SET readBy = ? WHERE id = ?");

            for (const msg of messages) {
                const str_id = msg.id;
                const str_employeecode = msg.employeeCode;
                const str_message = msg.message;
                const str_name = msg.name || "Unknown";
                let str_readby = msg.readBy || "";

                // Formatera datumet från vår nya DATETIME-kolumn
                // Om msg.createdAt är "2023-10-27 14:30:00" delar vi upp det för visning
                const timestamp = msg.createdAt ? msg.createdAt.split(' ') : ["-", "-"];
                const displayDate = timestamp[0];
                const displayTime = timestamp[1];

                // 2. Kolla om användaren läst meddelandet
                if (!str_readby.includes(currentUsername)) {
                    const new_readby = (str_readby + " " + currentUsername).trim();
                    updateReadBy.run(new_readby, str_id);
                }

                // 3. Bygg HTML-strängen
                const isMe = str_employeecode === currentUsername;
                const bgColor = isMe ? "#99ccff" : "#ffffff";
                const textAlign = isMe ? "right" : "left";
                const displayName = isMe ? "You" : str_name;

                chatbody += `
                    <div style="width:230px; text-align:${textAlign}; font-size:11px; color:#ffffff;">
                        ${displayName} (${str_employeecode}) <br />
                        ${displayDate} | ${displayTime}<br />
                    </div>
                    <div style="background-color:${bgColor}; padding:5px; margin:5px; margin-bottom:20px; border-radius:5px; color:#000;">
                        ${str_message}
                    </div>
                `;
            }

            response.send(chatbody);

        } catch (err) {
            console.error("Database error:", err);
            response.status(500).send("Kunde inte hämta chatten.");
        }
    } else {
        response.status(401).send("Ej inloggad");
    }
});

module.exports = router;