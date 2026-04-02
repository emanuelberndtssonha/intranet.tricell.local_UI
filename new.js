const Database = require('better-sqlite3');
const path = require('path');

// Sökväg till din logg-databas
const dbPathA = path.join(__dirname, 'data', 'database', 'activity_log.db');
const dbA = new Database(dbPathA);

// Skapa tabellen med rätt inställningar för ID
const createTableQuery = `
CREATE TABLE IF NOT EXISTS Log (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Activity TEXT NOT NULL,
    EmployeeCode TEXT NOT NULL,
    Name TEXT,
    Date TEXT,
    Time TEXT
);`;

dbA.exec(createTableQuery);

console.log("Databasen och tabellen 'Log' är nu redo med korrekt AutoIncrement!");