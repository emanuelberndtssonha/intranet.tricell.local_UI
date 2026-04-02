// authMiddleware.js
function checkAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next(); // Användaren är inloggad, släpp igenom dem!
    } else {
        // Inte inloggad, skicka tillbaka till start/login
        res.redirect('/');
    }
}

module.exports = checkAuth;