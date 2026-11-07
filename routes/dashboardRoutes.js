const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Public landing & informational pages
router.get('/', dashboardController.renderHome);
router.get('/about', dashboardController.renderAbout);
router.get('/contact', dashboardController.renderContact);
router.post('/contact', dashboardController.handleContactSubmit);

module.exports = router;
