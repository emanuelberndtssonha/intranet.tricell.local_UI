const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath1 = path.join(__dirname, '..', 'data', 'database', 'tricell_intranet.db');
const dbPath2 = path.join(__dirname, '..', 'data', 'database', 'data.db');
const db1 = new Database(dbPath1);
const db2 = new Database(dbPath2);

router.post('/:id', (request, response) => {
    const id = request.params.id;
    const entryHeading = request.body.entryHeading;
    const entryText = request.body.entryText;
    const employeeid = request.session.userId;

    const validAccessLevels = ["B", "A"];

    if (request.session.userId && validAccessLevels.includes(request.session.securityAccessLevel)) {

        // Skapa datum (DD.MM.YYYY)
        const date_ob = new Date();
        const date = String(date_ob.getDate()).padStart(2, '0');
        const month = String(date_ob.getMonth() + 1).padStart(2, '0');
        const year = date_ob.getFullYear();
        const postdate = `${date}.${month}.${year}`;

        // Skapa klockslag (HH:MM)
        const hour = String(date_ob.getHours()).padStart(2, '0');
        const minutes = String(date_ob.getMinutes()).padStart(2, '0');
        const posttime = `${hour}:${minutes}`;

        try {
            // Förbered SQL-frågan med placeholders (?) för att förhindra SQL Injection
            const stmt = db2.prepare(`
                INSERT INTO ResearchEntries 
                (researchObjectId, entryHeading, entryText, entryWriter, entryDate, entryTime)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            // Kör frågan synkront (better-sqlite3 använder .run() för INSERT/UPDATE/DELETE)
            stmt.run(id, entryHeading, entryText, employeeid, postdate, posttime);

            // Skicka ett lyckat svar tillbaka (viktigt för att AJAX-anropet ska gå vidare)
            response.status(200).send("Entry saved");

        } catch (error) {
            console.error("Fel vid sparande i databasen:", error);
            response.status(500).send("Kunde inte spara inlägget.");
        }
    } else {
        response.status(403).send("Obehörig.");
    }
});
router.get('/:id', (request, response) => {
    const validAccessLevels = ["B", "A"];
    // Kontrollera att användaren är inloggad och har rätt behörighet
    // Notera: Jag använder request.session.loggedin här (se till att det matchar din login-logik)
    if (request.session.userId && validAccessLevels.includes(request.session.securityAccessLevel)) {

        const virusid = request.params.id;

        try {
            // 1. Förbered och kör frågan för att hämta alla entries för detta objekt
            const entryStmt = db2.prepare("SELECT * FROM ResearchEntries WHERE researchObjectId = ? ORDER BY ID DESC");
            const entries = entryStmt.all(virusid); // .all() returnerar en array med objekt

            let entryOutput = "";

            // 2. Loopa igenom resultaten
            entries.forEach(entry => {
                const entryId = entry.id;
                const entryHeading = entry.entryHeading;
                const entryText = entry.entryText;
                const entryWriter = entry.entryWriter; // employeeCode
                const entryDate = entry.entryDate;
                const entryTime = entry.entryTime;

                // 3. Hämta namnet på författaren från den andra databasen (db1)
                const writerStmt = db1.prepare(`
                    SELECT e.name 
                    FROM user_credentials u 
                    LEFT JOIN employees e ON u.employeeCode = e.employeeCode 
                    WHERE u.employeeCode = ?
                `);

                const writerRow = writerStmt.get(entryWriter); // .get() hämtar första matchande raden
                const writerName = writerRow ? writerRow.name : "Okänd användare";

                // 4. Bygg HTML-strängen (använder Template Literals för läsbarhet)
                entryOutput += `
                    <table class="entryTable" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="width: 100%;">
                                ${entryWriter} (${writerName}) | ${entryDate} | Kl ${entryTime}
                            </td>
                            <td rowspan="2" style="text-align: right; vertical-align: bottom;">
                                <div class="deleteButton" onClick="deleteEntry('${entryId}')">D</div>
                            </td>
                        </tr>
                        <tr>
                            <td class="entryHeading">${entryHeading}</td>
                        </tr>
                        <tr>
                            <td class="entryBox" colspan="2">${entryText}</td>
                        </tr>
                    </table>`;
            });

            // 5. Skicka den färdiga HTML-strängen till klienten
            response.send(entryOutput);

        } catch (error) {
            console.error("Databasfel:", error);
            response.status(500).send("Ett fel uppstod vid hämtning av data.");
        }
    } else {
        response.status(403).send("Obehörig åtkomst");
    }
});
router.delete('/:id', (request, response) => {
    const validAccessLevels = ["B", "A"];
    if (request.session.userId && validAccessLevels.includes(request.session.securityAccessLevel)) {
        const id = request.params.id;
        async function sqlQuery() {
            // Skriv in nytt meddelande 
            const result = db2.prepare("DELETE FROM ResearchEntries WHERE CStr(ID)='" + id + "'");
            response.send("");
        }
        sqlQuery();
    }

});

module.exports = router;