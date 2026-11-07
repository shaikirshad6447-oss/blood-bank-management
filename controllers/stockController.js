/**
 * Blood Stock Controller
 * Manages public blood availability viewing and administrative inventory adjustments.
 */
const BloodStock = require('../models/stockModel');
const { validationResult } = require('../middleware/validationMiddleware');

const stockController = {
    /**
     * Render public blood availability page
     */
    async renderAvailability(req, res, next) {
        try {
            const stockList = await BloodStock.getAll();
            const totalUnits = await BloodStock.getTotalUnits();

            res.render('pages/availability', {
                title: 'Real-Time Blood Availability | LifeDrop',
                stockList,
                totalUnits
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Admin: Render stock management interface
     */
    async renderStockManagement(req, res, next) {
        try {
            const stockList = await BloodStock.getAll();
            const totalUnits = await BloodStock.getTotalUnits();
            const lowStockCount = await BloodStock.getLowStockCount(10);

            res.render('admin/stock', {
                title: 'Blood Stock Management | LifeDrop Admin',
                stockList,
                totalUnits,
                lowStockCount,
                messages: {
                    success: req.flash('success'),
                    error: req.flash('error')
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Admin: Adjust blood stock units with database transaction
     */
    async adjustStock(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.flash('error', errors.array()[0].msg);
                return res.redirect('/admin/stock');
            }

            const { blood_group, amount, operation } = req.body;
            const parsedAmount = parseInt(amount, 10);

            const result = await BloodStock.adjustStock(blood_group, parsedAmount, operation);

            req.flash(
                'success',
                `Successfully updated ${blood_group} stock: changed from ${result.previousUnits} to ${result.newUnits} units.`
            );
            res.redirect('/admin/stock');
        } catch (error) {
            req.flash('error', error.message || 'Error updating stock inventory.');
            res.redirect('/admin/stock');
        }
    }
};

module.exports = stockController;
