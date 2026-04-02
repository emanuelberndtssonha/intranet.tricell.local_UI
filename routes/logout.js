const express = require('express');
const readHTML = require('../readHTML.js');
const router = express.Router();
const fs = require('fs')
router.use(express.json());
//var path = require('path');
const path = require("path");
const checkAuth = require('../authMiddleware.js'); // Se till att sökvägen stämmer

// Läs in layouten
router.use(express.static('./public'));

var htmlHead = readHTML('./masterframe/head.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlMenu = readHTML('./masterframe/menu.html');
var htmlInfoStart = readHTML('./masterframe/infoStart.html');
var htmlInfoStop = readHTML('./masterframe/infoStop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');


// --------------------- Default-sida -------------------------------
router.get('/', checkAuth, function (request, response) {
    request.session.destroy();

    var htmlMenu = readHTML('./masterframe/menu.html');

    response.write(htmlHead);
    response.write(htmlHeader);
    response.write(htmlMenu);
    response.write(htmlInfoStart);

    response.write('You have logged out!')


    response.write(htmlInfoStop);
    response.write(htmlFooter);
    response.write(htmlBottom);
    response.end();
});

module.exports = router;