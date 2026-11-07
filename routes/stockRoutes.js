const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { requireAdminAuth } = require('../middleware/authMiddleware');
const { stockAdjustmentRules } = require('../middleware/validationMiddleware');

// Public availability
router.get('/availability', stockController.renderAvailability);

// Admin stock management
router.get('/admin/stock', requireAdminAuth, stockController.renderStockManagement);
router.post('/admin/stock/adjust', requireAdminAuth, stockAdjustmentRules, stockController.adjustStock);

module.exports = router;
