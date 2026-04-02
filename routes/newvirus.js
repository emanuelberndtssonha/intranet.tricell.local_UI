const express = require('express');
const router = express.Router();
router.use(express.json());
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database', 'tricell_intranet.db');
const db = new Database(dbPath);
const checkAuth = require('../authMiddleware.js'); // Se till att sökvägen stämmer

router.use(express.static('./public'));

const readHTML = require('../readHTML.js')

// -
// Skapande av nytt virus
router.get('/', function (request, response) {
    const currentUserId = request.session.userId || null;



    // 3. Skicka detta objekt till din EJS-fil
    response.render('user', {
        userId: currentUserId,
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: readHTML('./masterframe/menu_back.html'),
        content: readHTML('./masterframe/newvirus.html'),
    })
});

module.exports = router;