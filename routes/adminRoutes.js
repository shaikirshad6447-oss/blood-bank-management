const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const adminController = require('../controllers/adminController');
const dashboardController = require('../controllers/dashboardController');
const { requireAdminAuth, redirectIfAuthenticated } = require('../middleware/authMiddleware');

// Login rate limiter: Max 5 failed attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false
});

// Authentication routes
router.get('/admin/login', redirectIfAuthenticated, adminController.renderLogin);
router.post('/admin/login', loginLimiter, adminController.login);
router.get('/admin/logout', requireAdminAuth, adminController.logout);

// Admin dashboard & reports
router.get('/admin', requireAdminAuth, (req, res) => res.redirect('/admin/dashboard'));
router.get('/admin/dashboard', requireAdminAuth, dashboardController.renderDashboard);
router.get('/admin/api/charts', requireAdminAuth, dashboardController.getChartData);
router.get('/admin/reports', requireAdminAuth, dashboardController.renderReports);

module.exports = router;
