/**
 * Request Validation Middleware
 * Uses express-validator to enforce server-side data integrity.
 */
const { body, validationResult } = require('express-validator');

const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const validGenders = ['Male', 'Female', 'Other'];
const validUrgencies = ['Normal', 'Urgent', 'Emergency'];

// Validation rules for donor registration and profile update
const donorValidationRules = [
    body('full_name')
        .trim()
        .notEmpty().withMessage('Full Name is required.')
        .isLength({ min: 3, max: 100 }).withMessage('Full Name must be between 3 and 100 characters.')
        .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Name should only contain letters, spaces, and hyphens.'),

    body('age')
        .notEmpty().withMessage('Age is required.')
        .isInt({ min: 18, max: 65 }).withMessage('Donor age must be between 18 and 65 years old for safe donation.'),

    body('gender')
        .notEmpty().withMessage('Gender is required.')
        .isIn(validGenders).withMessage('Please select a valid gender option.'),

    body('blood_group')
        .notEmpty().withMessage('Blood group is required.')
        .isIn(validBloodGroups).withMessage('Please select a recognized blood group (A+, A-, B+, B-, AB+, AB-, O+, O-).'),

    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required.')
        .matches(/^[0-9+\-\s()]{10,20}$/).withMessage('Please provide a valid phone number (at least 10 digits).'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email address is required.')
        .isEmail().withMessage('Please provide a valid email address.')
        .normalizeEmail(),

    body('address')
        .trim()
        .notEmpty().withMessage('Residential or hospital address is required.')
        .isLength({ min: 5, max: 500 }).withMessage('Address must be between 5 and 500 characters.'),

    body('last_donation_date')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Please enter a valid donation date.')
        .custom((value) => {
            if (value && new Date(value) > new Date()) {
                throw new Error('Last donation date cannot be in the future.');
            }
            return true;
        })
];

// Validation rules for blood request submission
const requestValidationRules = [
    body('patient_name')
        .trim()
        .notEmpty().withMessage('Patient name is required.')
        .isLength({ min: 2, max: 100 }).withMessage('Patient name must be between 2 and 100 characters.'),

    body('hospital_name')
        .trim()
        .notEmpty().withMessage('Hospital or clinic name is required.')
        .isLength({ min: 3, max: 150 }).withMessage('Hospital name must be between 3 and 150 characters.'),

    body('blood_group')
        .notEmpty().withMessage('Blood group required is mandatory.')
        .isIn(validBloodGroups).withMessage('Please select a valid blood group.'),

    body('units_required')
        .notEmpty().withMessage('Units required is mandatory.')
        .isInt({ min: 1, max: 50 }).withMessage('Requested units must be between 1 and 50 units.'),

    body('contact_number')
        .trim()
        .notEmpty().withMessage('Contact number is required.')
        .matches(/^[0-9+\-\s()]{10,20}$/).withMessage('Please provide a valid contact number (at least 10 digits).'),

    body('urgency')
        .notEmpty().withMessage('Urgency level is required.')
        .isIn(validUrgencies).withMessage('Please select an urgency level (Normal, Urgent, or Emergency).'),

    body('additional_notes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Additional notes cannot exceed 1000 characters.')
];

// Validation rules for admin stock adjustment
const stockAdjustmentRules = [
    body('blood_group')
        .notEmpty().withMessage('Blood group is required.')
        .isIn(validBloodGroups).withMessage('Invalid blood group.'),

    body('amount')
        .notEmpty().withMessage('Amount is required.')
        .isInt({ min: 1, max: 500 }).withMessage('Amount must be a positive integer between 1 and 500.'),

    body('operation')
        .notEmpty().withMessage('Operation type is required.')
        .isIn(['add', 'set']).withMessage('Operation must be either "add" or "set".')
];

module.exports = {
    donorValidationRules,
    requestValidationRules,
    stockAdjustmentRules,
    validationResult
};
