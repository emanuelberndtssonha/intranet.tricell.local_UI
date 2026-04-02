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
    const currentUserId = request.session.userId || null
    const secAccessLevel = request.session.securityAccessLevel
    response.render('user', {
        securityAccessLevel: secAccessLevel,
        content: 'Logged in',
        userId: currentUserId,
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: readHTML('./masterframe/menu_back.html'),
    })
});
module.exports = router;