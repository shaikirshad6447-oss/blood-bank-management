const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { requireAdminAuth } = require('../middleware/authMiddleware');
const { donorValidationRules } = require('../middleware/validationMiddleware');

// Public donor routes
router.get('/donate', donorController.renderRegistrationForm);
router.post('/donate', donorValidationRules, donorController.registerDonor);
router.get('/donate/success/:id', donorController.renderRegistrationSuccess);

// Admin donor management routes
router.get('/admin/donors', requireAdminAuth, donorController.listDonors);
router.get('/admin/donors/:id/edit', requireAdminAuth, donorController.renderEditDonor);
router.post('/admin/donors/:id/edit', requireAdminAuth, donorValidationRules, donorController.updateDonor);
router.post('/admin/donors/:id/delete', requireAdminAuth, donorController.deleteDonor);

module.exports = router;
