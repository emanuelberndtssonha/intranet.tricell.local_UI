const express = require('express');
const router = express.Router();
router.use(express.json());
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database', 'tricell_intranet.db');
const db = new Database(dbPath);

router.get('/', (request, response) => {
    try {
        // 1. Kontrollera att användaren är inloggad
        if (!request.session.userId) {
            return response.status(401).send("0");
        }

        const currentUserId = request.session.userId.toString();

        // 2. Hämta alla meddelanden. 
        // .all() behövs för att result ska bli en array som går att loopa.
        const rows = db.prepare('SELECT readBy FROM chat').all();

        let newMessagesCount = 0;

        // 3. Loopa igenom resultaten
        for (const row of rows) {
            // Se till att readBy inte är null (blir en tom sträng annars)
            const readBy = row.readBy || "";

            // Kolla om userId INTE finns i readBy-strängen
            if (!readBy.includes(currentUserId)) {
                newMessagesCount++;
            }
        }

        // 4. Skicka tillbaka antalet som en sträng
        response.send(newMessagesCount.toString());

    } catch (err) {
        console.error("Fel vid räkning av meddelanden:", err);
        response.status(500).send("0");
    }
});

module.exports = router;