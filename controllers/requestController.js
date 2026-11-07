/**
 * Blood Request Controller
 * Handles patient blood requests and admin approval/rejection workflows with stock verification.
 */
const BloodRequest = require('../models/requestModel');
const BloodStock = require('../models/stockModel');
const { validationResult } = require('../middleware/validationMiddleware');

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const urgencyLevels = ['Normal', 'Urgent', 'Emergency'];

const requestController = {
    /**
     * Render the public blood request page
     */
    async renderRequestForm(req, res, next) {
        try {
            // Optional preselected blood group from query param
            const selectedGroup = req.query.group && bloodGroups.includes(req.query.group) ? req.query.group : '';
            res.render('pages/requestBlood', {
                title: 'Request Blood Units | LifeDrop',
                bloodGroups,
                urgencyLevels,
                selectedGroup,
                formData: { blood_group: selectedGroup },
                errors: []
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Submit blood request
     */
    async submitRequest(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).render('pages/requestBlood', {
                    title: 'Request Blood Units | LifeDrop',
                    bloodGroups,
                    urgencyLevels,
                    selectedGroup: req.body.blood_group || '',
                    formData: req.body,
                    errors: errors.array()
                });
            }

            const {
                patient_name,
                hospital_name,
                blood_group,
                units_required,
                contact_number,
                urgency,
                additional_notes
            } = req.body;

            const requestId = await BloodRequest.create({
                patient_name,
                hospital_name,
                blood_group,
                units_required,
                contact_number,
                urgency,
                additional_notes
            });

            res.redirect(`/request/confirmation/${requestId}`);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Render confirmation page with request ID and status
     */
    async renderRequestSuccess(req, res, next) {
        try {
            const request = await BloodRequest.findById(req.params.id);
            if (!request) {
                req.flash('error', 'Blood request not found.');
                return res.redirect('/request');
            }

            res.render('pages/requestSuccess', {
                title: `Request #${request.request_id} Submitted | LifeDrop`,
                request
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Admin: List blood requests with search and filters
     */
    async listRequests(req, res, next) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            const search = req.query.search ? req.query.search.trim() : '';
            const bloodGroup = req.query.bloodGroup || '';
            const urgency = req.query.urgency || '';
            const status = req.query.status || '';

            const [requests, totalCount, stockList] = await Promise.all([
                BloodRequest.findAll({ search, bloodGroup, urgency, status, limit, offset }),
                BloodRequest.countAll({ search, bloodGroup, urgency, status }),
                BloodStock.getAll()
            ]);

            // Create a lookup map of available units by blood group
            const stockMap = {};
            stockList.forEach(s => {
                stockMap[s.blood_group] = s.units_available;
            });

            const totalPages = Math.ceil(totalCount / limit) || 1;

            res.render('admin/requests', {
                title: 'Manage Blood Requests | LifeDrop Admin',
                requests,
                stockMap,
                currentPage: page,
                totalPages,
                totalCount,
                search,
                bloodGroup,
                urgency,
                status,
                bloodGroups,
                urgencyLevels,
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
     * Admin: Approve blood request and atomically deduct stock in transaction
     */
    async approveRequest(req, res, next) {
        try {
            const requestId = req.params.id;
            const result = await BloodRequest.approve(requestId);

            req.flash(
                'success',
                `Request #${requestId} approved! ${result.deductedUnits} unit(s) of ${result.bloodGroup} deducted. (${result.remainingUnits} units remaining in stock).`
            );
            res.redirect('/admin/requests');
        } catch (error) {
            req.flash('error', error.message || 'Failed to approve request.');
            res.redirect('/admin/requests');
        }
    },

    /**
     * Admin: Reject blood request without stock deduction
     */
    async rejectRequest(req, res, next) {
        try {
            const requestId = req.params.id;
            await BloodRequest.reject(requestId);

            req.flash('success', `Request #${requestId} has been marked as Rejected.`);
            res.redirect('/admin/requests');
        } catch (error) {
            req.flash('error', error.message || 'Failed to reject request.');
            res.redirect('/admin/requests');
        }
    },

    /**
     * Admin: Mark approved request as Fulfilled
     */
    async fulfillRequest(req, res, next) {
        try {
            const requestId = req.params.id;
            await BloodRequest.fulfill(requestId);

            req.flash('success', `Request #${requestId} has been marked as Fulfilled.`);
            res.redirect('/admin/requests');
        } catch (error) {
            req.flash('error', error.message || 'Failed to fulfill request.');
            res.redirect('/admin/requests');
        }
    }
};

module.exports = requestController;
