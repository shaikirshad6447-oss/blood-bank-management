/**
 * Authentication Middleware
 * Guards administrative routes and handles session verification.
 */

function requireAdminAuth(req, res, next) {
    if (req.session && req.session.admin) {
        // Set admin user data into res.locals for templates
        res.locals.admin = req.session.admin;
        return next();
    }
    
    // Store original intended URL for post-login redirect
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'Please log in to access the administrator panel.');
    return res.redirect('/admin/login');
}

function redirectIfAuthenticated(req, res, next) {
    if (req.session && req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    next();
}

module.exports = {
    requireAdminAuth,
    redirectIfAuthenticated
};
