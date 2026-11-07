/**
 * Dashboard & General Pages Controller
 * Manages public landing page with live database statistics and administrative analytics.
 */
const Donor = require('../models/donorModel');
const BloodStock = require('../models/stockModel');
const BloodRequest = require('../models/requestModel');

const dashboardController = {
    /**
     * Render the public home page with live statistics from MySQL
     */
    async renderHome(req, res, next) {
        try {
            // Fetch live statistics directly from MySQL
            const [donorCount, totalUnits, totalRequests, fulfilledRequests, stockPreview] = await Promise.all([
                Donor.countAll(),
                BloodStock.getTotalUnits(),
                BloodRequest.countAll(),
                BloodRequest.countAll({ status: 'Fulfilled' }),
                BloodStock.getAll()
            ]);

            res.render('pages/index', {
                title: 'LifeDrop – Every Drop Saves a Life | Blood Bank Management System',
                stats: {
                    registeredDonors: donorCount,
                    availableUnits: totalUnits,
                    totalRequests: totalRequests,
                    fulfilledRequests: fulfilledRequests
                },
                stockPreview
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Render About page
     */
    renderAbout(req, res) {
        res.render('pages/about', {
            title: 'About Our Mission | LifeDrop Blood Bank'
        });
    },

    /**
     * Render Contact page
     */
    renderContact(req, res) {
        res.render('pages/contact', {
            title: 'Contact Support & Blood Centers | LifeDrop',
            messages: {
                success: req.flash('success')
            }
        });
    },

    /**
     * Handle Contact form submission (feedback / message)
     */
    handleContactSubmit(req, res) {
        req.flash('success', 'Thank you for reaching out! Our 24/7 blood helpline coordinator will get in touch shortly.');
        res.redirect('/contact');
    },

    /**
     * Admin: Render administrative dashboard with 6 overview cards and Chart.js analytics
     */
    async renderDashboard(req, res, next) {
        try {
            const [
                donorStats,
                totalUnits,
                lowStockCount,
                requestStats,
                stockList,
                recentDonors,
                recentRequests
            ] = await Promise.all([
                Donor.getStats(),
                BloodStock.getTotalUnits(),
                BloodStock.getLowStockCount(10),
                BloodRequest.getStats(),
                BloodStock.getAll(),
                Donor.findAll({ limit: 5, offset: 0 }),
                BloodRequest.findAll({ limit: 5, offset: 0 })
            ]);

            const summary = requestStats.summary || {};

            res.render('admin/dashboard', {
                title: 'Admin Analytics Dashboard | LifeDrop',
                cards: {
                    totalDonors: donorStats.total,
                    totalUnits: totalUnits,
                    lowStockCount: lowStockCount,
                    pendingRequests: summary.pending || 0,
                    approvedRequests: summary.approved || 0,
                    fulfilledRequests: summary.fulfilled || 0,
                    rejectedRequests: summary.rejected || 0
                },
                stockList,
                recentDonors,
                recentRequests,
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
     * Admin: API endpoint to provide real-time database data for Chart.js
     */
    async getChartData(req, res, next) {
        try {
            const [stockDistribution, donorStats, requestStats] = await Promise.all([
                BloodStock.getDistribution(),
                Donor.getStats(),
                BloodRequest.getStats()
            ]);

            const summary = requestStats.summary || {};

            res.json({
                success: true,
                stockDistribution,
                donorRegistrations: {
                    labels: donorStats.monthly.map(m => m.month_label),
                    data: donorStats.monthly.map(m => m.count)
                },
                requestUrgency: {
                    labels: requestStats.byUrgency.map(u => u.urgency),
                    data: requestStats.byUrgency.map(u => u.count)
                },
                requestStatus: {
                    labels: ['Pending', 'Approved', 'Fulfilled', 'Rejected'],
                    data: [
                        summary.pending || 0,
                        summary.approved || 0,
                        summary.fulfilled || 0,
                        summary.rejected || 0
                    ]
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Admin: Render comprehensive printable reports page
     */
    async renderReports(req, res, next) {
        try {
            const [donorStats, totalUnits, requestStats, stockList] = await Promise.all([
                Donor.getStats(),
                BloodStock.getTotalUnits(),
                BloodRequest.getStats(),
                BloodStock.getAll()
            ]);

            res.render('admin/reports', {
                title: 'Comprehensive Operations Report | LifeDrop Admin',
                donorStats,
                totalUnits,
                requestStats,
                stockList,
                generatedAt: new Date().toLocaleString('en-US', {
                    dateStyle: 'full',
                    timeStyle: 'medium'
                })
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = dashboardController;
