const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Skapa/öppna databasen
const db = new Database('tricell_intranet.db');

// Läs in JSON-filen (använder path.join för att vara säker på sökvägen)
const filePath = path.join(__dirname, 'data', 'json', 'personnelregistry.json');
const rawData = fs.readFileSync(filePath);
const data = JSON.parse(rawData).personnelRegistry.employee;

// 1. Skapa tabellen med ALLA fält som finns i JSON-filen
db.prepare(`
  CREATE TABLE IF NOT EXISTS employees (
    employeeCode TEXT PRIMARY KEY,
    name TEXT,
    signatureDate TEXT,
    dateOfBirth TEXT,
    sex TEXT,
    bloodType TEXT,
    height TEXT,
    weight TEXT,
    rank TEXT,
    securityAccessLevel TEXT,
    department TEXT,
    background TEXT,
    strengths TEXT,
    weaknesses TEXT
  )
`).run();

// 2. Förbered insert-funktionen med rätt antal kolumner (14 stycken)
const insert = db.prepare(`
  INSERT OR REPLACE INTO employees (
    employeeCode, name, signatureDate, dateOfBirth, sex, 
    bloodType, height, weight, rank, securityAccessLevel, 
    department, background, strengths, weaknesses
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// 3. Kör importen i en transaktion för att det ska gå snabbt
const insertMany = db.transaction((employees) => {
    for (const emp of employees) {
        insert.run(
            emp.employeeCode,
            emp.name,
            emp.signatureDate,
            emp.dateOfBirth,
            emp.sex,
            emp.bloodType?.toString(),
            emp.height?.toString(), // Vi gör om till string ifall det är siffror i JSON
            emp.weight?.toString(),
            emp.rank,
            emp.securityAccessLevel,
            emp.department,
            emp.background,
            emp.strengths,
            emp.weaknesses
        );
    }
});

// Kör funktionen
insertMany(data);

console.log(`Klart! Tricell-databasen har uppdaterats med ${data.length} anställda.`);