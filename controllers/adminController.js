/**
 * Admin Authentication Controller
 * Handles administrator session login, password verification with bcrypt, and logout.
 */
const bcrypt = require('bcrypt');

const adminController = {
    /**
     * Render the admin login view
     */
    renderLogin(req, res) {
        res.render('admin/login', {
            title: 'Administrator Login | LifeDrop Portal',
            messages: {
                error: req.flash('error'),
                success: req.flash('success')
            }
        });
    },

    /**
     * Process admin login
     */
    async login(req, res, next) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                req.flash('error', 'Please enter both username and password.');
                return res.redirect('/admin/login');
            }

            const configuredUsername = process.env.ADMIN_USERNAME || 'admin';
            const configuredHash = process.env.ADMIN_PASSWORD_HASH;

            // Check username match
            if (username.trim() !== configuredUsername) {
                req.flash('error', 'Invalid administrator credentials.');
                return res.redirect('/admin/login');
            }

            // Verify password hash
            let isMatch = false;
            if (configuredHash) {
                isMatch = await bcrypt.compare(password, configuredHash);
            } else {
                // Fallback for initial default setup if hash is missing
                isMatch = (password === 'admin123');
            }

            if (!isMatch) {
                req.flash('error', 'Invalid administrator credentials.');
                return res.redirect('/admin/login');
            }

            // Regenerate session for session fixation protection
            req.session.regenerate((err) => {
                if (err) return next(err);

                req.session.admin = {
                    username: configuredUsername,
                    loggedInAt: new Date(),
                    role: 'Super Administrator'
                };

                const returnUrl = req.session.returnTo || '/admin/dashboard';
                delete req.session.returnTo;

                req.flash('success', `Welcome back, ${configuredUsername}!`);
                res.redirect(returnUrl);
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Log out administrator
     */
    logout(req, res, next) {
        req.session.destroy((err) => {
            if (err) return next(err);
            res.clearCookie('connect.sid');
            res.redirect('/admin/login?logged_out=1');
        });
    }
};

module.exports = adminController;
