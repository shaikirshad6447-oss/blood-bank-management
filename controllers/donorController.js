/**
 * Donor Controller
 * Manages donor registrations, validation, editing, and listing.
 */
const Donor = require('../models/donorModel');
const { validationResult } = require('../middleware/validationMiddleware');

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const donorController = {
    /**
     * Render the public donor registration page
     */
    renderRegistrationForm(req, res) {
        res.render('pages/registerDonor', {
            title: 'Become a Blood Donor | LifeDrop',
            bloodGroups,
            formData: {},
            errors: []
        });
    },

    /**
     * Process donor registration form submission
     */
    async registerDonor(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).render('pages/registerDonor', {
                    title: 'Become a Blood Donor | LifeDrop',
                    bloodGroups,
                    formData: req.body,
                    errors: errors.array()
                });
            }

            const { full_name, age, gender, blood_group, phone, email, address, last_donation_date } = req.body;

            // Check for duplicate phone or email
            const existingDonor = await Donor.findByEmailOrPhone(email, phone);
            if (existingDonor) {
                const duplicateField = existingDonor.email.toLowerCase() === email.toLowerCase() ? 'Email address' : 'Phone number';
                return res.status(409).render('pages/registerDonor', {
                    title: 'Become a Blood Donor | LifeDrop',
                    bloodGroups,
                    formData: req.body,
                    errors: [{ msg: `${duplicateField} is already registered with another donor profile.` }]
                });
            }

            const donorId = await Donor.create({
                full_name,
                age,
                gender,
                blood_group,
                phone,
                email,
                address,
                last_donation_date: last_donation_date || null
            });

            // Redirect to confirmation page
            res.redirect(`/donate/success/${donorId}`);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Display registration success page
     */
    async renderRegistrationSuccess(req, res, next) {
        try {
            const donor = await Donor.findById(req.params.id);
            if (!donor) {
                req.flash('error', 'Donor record not found.');
                return res.redirect('/donate');
            }
            res.render('pages/donorSuccess', {
                title: 'Donor Registration Confirmed | LifeDrop',
                donor
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Admin: List all donors with search, filter, and pagination
     */
    async listDonors(req, res, next) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            const search = req.query.search ? req.query.search.trim() : '';
            const bloodGroup = req.query.bloodGroup || '';

            const [donors, totalCount] = await Promise.all([
                Donor.findAll({ search, bloodGroup, limit, offset }),
                Donor.countAll({ search, bloodGroup })
            ]);

            const totalPages = Math.ceil(totalCount / limit) || 1;

            res.render('admin/donors', {
                title: 'Manage Donors | LifeDrop Admin',
                donors,
                currentPage: page,
                totalPages,
                totalCount,
                search,
                bloodGroup,
                bloodGroups,
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
     * Admin: Render edit donor form
     */
    async renderEditDonor(req, res, next) {
        try {
            const donor = await Donor.findById(req.params.id);
            if (!donor) {
                req.flash('error', 'Donor not found.');
                return res.redirect('/admin/donors');
            }

            res.render('admin/donorEdit', {
                title: `Edit Donor: ${donor.full_name} | LifeDrop Admin`,
                donor,
                bloodGroups,
                errors: []
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Admin: Update donor information
     */
    async updateDonor(req, res, next) {
        try {
            const donorId = req.params.id;
            const errors = validationResult(req);
            const donor = await Donor.findById(donorId);

            if (!donor) {
                req.flash('error', 'Donor not found.');
                return res.redirect('/admin/donors');
            }

            if (!errors.isEmpty()) {
                return res.status(422).render('admin/donorEdit', {
                    title: `Edit Donor: ${donor.full_name} | LifeDrop Admin`,
                    donor: { ...req.body, donor_id: donorId },
                    bloodGroups,
                    errors: errors.array()
                });
            }

            const { full_name, age, gender, blood_group, phone, email, address, last_donation_date } = req.body;

            // Check for duplicates excluding current donor
            const duplicate = await Donor.findByEmailOrPhone(email, phone, donorId);
            if (duplicate) {
                return res.status(409).render('admin/donorEdit', {
                    title: `Edit Donor: ${donor.full_name} | LifeDrop Admin`,
                    donor: { ...req.body, donor_id: donorId },
                    bloodGroups,
                    errors: [{ msg: 'Email address or phone number is already used by another donor.' }]
                });
            }

            await Donor.update(donorId, {
                full_name,
                age,
                gender,
                blood_group,
                phone,
                email,
                address,
                last_donation_date: last_donation_date || null
            });

            req.flash('success', `Donor profile for ${full_name} was successfully updated.`);
            res.redirect('/admin/donors');
        } catch (error) {
            next(error);
        }
    },

    /**
     * Admin: Delete donor record
     */
    async deleteDonor(req, res, next) {
        try {
            const donorId = req.params.id;
            const donor = await Donor.findById(donorId);

            if (!donor) {
                req.flash('error', 'Donor record not found.');
                return res.redirect('/admin/donors');
            }

            await Donor.delete(donorId);
            req.flash('success', `Donor record for ${donor.full_name} was deleted successfully.`);
            res.redirect('/admin/donors');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = donorController;
