const config = require('./config/globals.json');
const express = require('express');
const path = require('path')
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// view table
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// sessioms hantering
const session = require('express-session');
const SessionStore = require('better-sqlite3-session-store')(session);
const checkAuth = require('./authMiddleware.js'); // Se till att sökvägen stämmer
const cookieParser = require('cookie-parser');
app.use(cookieParser());
// Databas
const Database = require('better-sqlite3');
const db = new Database('./data/database/tricell_intranet.db'); // Din befintliga DB


app.use(session({
    store: new SessionStore({
        client: db,
        tableName: 'sessions' // Denna skapas automatiskt i din users.db
    }),
    secret: 'tricell-secret-key', // Byt till något unikt
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Mycket viktigt på localhost!
        maxAge: 1000 * 60 * 60 * 24, // 24 timmar
        httpOnly: true,
        sameSite: 'lax'

    }
}));

// läser in routers
const info = require('./routes/info');
const personnelregistry = require('./routes/personnelregistry');
const login = require('./routes/login');
const virusdatabase = require('./routes/virusdatabase');
const admin = require('./routes/admin');
const deletevirus = require('./routes/deletevirus');
const editvirus = require('./routes/editvirus');
const newemployee = require('./routes/newemployee')
const deleteemployee = require('./routes/deleteemployee');
const editemployee = require('./routes/editemployee')
const logout = require('./routes/logout')
const chat = require('./routes/chat')
const getchat = require('./routes/getchat')
const newvirus = require('./routes/newvirus')
const newdata = require('./routes/fileuploadvirus')
const userdatabase = require('./routes/userdatabase')
const entries = require("./routes/entries")
const livestream = require("./routes/livestream")
const activityLog = require('./routes/activityLog.js');
const editvirusimage = require('./routes/editvirusimage.js');

app.use(express.static('./public'));

const readHTML = require('./readHTML.js');


app.get('/', function (request, response) {
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

app.use('/api/info', info);
app.use('/api/personnelregistry', personnelregistry);
app.use('/api/login', login);
app.use('/api/virusdatabase', virusdatabase);

// Allt under denna rad kräver nu inloggning!
app.use(checkAuth);
app.use('/api/admin', admin);
app.use('/api/deletevirus', deletevirus);
app.use('/api/editvirus', editvirus);
app.use('/api/newvirus', newvirus);
app.use('/api/newemployee', newemployee);
app.use('/api/deleteemployee', deleteemployee);
app.use('/api/editemployee', editemployee);
app.use('/api/logout', logout);
app.use('/api/chat', chat)
app.use('/api/getchat', getchat)
app.use('/api/data', newdata)
app.use('/api/userdatabase', userdatabase)
app.use('/api/entries', entries)
app.use('/api/livestream', livestream)
app.use('/api/activitylog', activityLog);
app.use('/api/editvirusimage', editvirusimage);

// bestämmer port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
