const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { requireAdminAuth } = require('../middleware/authMiddleware');
const { requestValidationRules } = require('../middleware/validationMiddleware');

// Public blood request routes
router.get('/request', requestController.renderRequestForm);
router.post('/request', requestValidationRules, requestController.submitRequest);
router.get('/request/confirmation/:id', requestController.renderRequestSuccess);

// Admin blood request management
router.get('/admin/requests', requireAdminAuth, requestController.listRequests);
router.post('/admin/requests/:id/approve', requireAdminAuth, requestController.approveRequest);
router.post('/admin/requests/:id/reject', requireAdminAuth, requestController.rejectRequest);
router.post('/admin/requests/:id/fulfill', requireAdminAuth, requestController.fulfillRequest);

module.exports = router;
