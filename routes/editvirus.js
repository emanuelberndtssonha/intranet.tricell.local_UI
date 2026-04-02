const express = require('express');
const router = express.Router();
const readHTML = require('../readHTML.js');
const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data', 'database', 'tricell_intranet.db');
const db = new Database(dbPath);
const checkAuth = require('../authMiddleware.js'); // Se till att sökvägen stämmer

router.use(express.static('./public'));

router.get('/', checkAuth, (request, response) => {

    response.send('Virus Database');
});
module.exports = router;