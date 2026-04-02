const express = require('express');
const readHTML = require('../readHTML.js');
const router = express.Router();
const fs = require('fs')
router.use(express.json());
//var path = require('path');
const path = require("path");

router.use(express.static('./public'));

// --------------------- Default-sida -------------------------------
router.get('/', function (request, response) {
    const currentUserId = request.session.userId || null;
    const secAccessLevel = request.session.securityAccessLevel || null;
    response.render('user', {
        securityAccessLevel: secAccessLevel,
        userId: currentUserId, // Nu är variabeln DEFINIERAD för EJS
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: readHTML('./masterframe/menu.html'),
        content: readHTML('./public/texts/index.html')
    })
});

// --------------------- Läs en specifik info-sida -------------------------------
router.get('/:infotext', function (request, response) {
    const currentUserId = request.session.userId || null;
    const secAccessLevel = request.session.securityAccessLevel || null;
    const infotext = request.params.infotext;
    if (infotext == "") {
        infotext = 'index';
        var htmlMenu = readHTML('./masterframe/menu.html');
    }
    else {
        var htmlMenu = readHTML('./masterframe/menu_back.html');
    }

    // Läs in rätt info-text
    const filepath = path.resolve(__dirname, "../public/texts/" + infotext + '.html');

    if (fs.existsSync(filepath)) {

        htmlInfo = readHTML(filepath);
    }
    else {
        htmlInfo = readHTML('./public/texts/index.html');
    }


    response.render('user', {
        userId: currentUserId,
        securityAccessLevel: secAccessLevel,
        cookieemployeecode: request.cookies.employeecode,
        cookiename: request.cookies.name,
        cookielogintimes: request.cookies.logintimes,
        cookielastlogin: request.cookies.lastlogin,
        menu: htmlMenu,
        content: htmlInfo
    })

});
module.exports = router;