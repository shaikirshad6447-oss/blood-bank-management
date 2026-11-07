/**
 * Donor Model
 * Handles database operations for the `donors` table.
 */
const db = require('../config/db');

const Donor = {
    /**
     * Create a new donor record
     */
    async create(donorData) {
        const { full_name, age, gender, blood_group, phone, email, address, last_donation_date } = donorData;
        const query = `
            INSERT INTO donors (full_name, age, gender, blood_group, phone, email, address, last_donation_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            full_name,
            parseInt(age, 10),
            gender,
            blood_group,
            phone,
            email,
            address,
            last_donation_date || null
        ]);
        return result.insertId;
    },

    /**
     * Find a donor by ID
     */
    async findById(donor_id) {
        const query = `SELECT * FROM donors WHERE donor_id = ?`;
        const [rows] = await db.execute(query, [donor_id]);
        return rows[0] || null;
    },

    /**
     * Check if email or phone is already taken (excluding current donor when editing)
     */
    async findByEmailOrPhone(email, phone, excludeId = null) {
        let query = `SELECT * FROM donors WHERE (email = ? OR phone = ?)`;
        const params = [email, phone];
        if (excludeId) {
            query += ` AND donor_id != ?`;
            params.push(excludeId);
        }
        const [rows] = await db.execute(query, params);
        return rows[0] || null;
    },

    /**
     * Retrieve donors with optional search, blood group filter, and pagination
     */
    async findAll({ search = '', bloodGroup = '', limit = 10, offset = 0 } = {}) {
        let query = `SELECT * FROM donors WHERE 1=1`;
        const params = [];

        if (search) {
            query += ` AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR address LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (bloodGroup) {
            query += ` AND blood_group = ?`;
            params.push(bloodGroup);
        }

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit, 10), parseInt(offset, 10));

        const [rows] = await db.query(query, params);
        return rows;
    },

    /**
     * Count donors matching filters
     */
    async countAll({ search = '', bloodGroup = '' } = {}) {
        let query = `SELECT COUNT(*) AS total FROM donors WHERE 1=1`;
        const params = [];

        if (search) {
            query += ` AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR address LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (bloodGroup) {
            query += ` AND blood_group = ?`;
            params.push(bloodGroup);
        }

        const [rows] = await db.execute(query, params);
        return rows[0].total;
    },

    /**
     * Update an existing donor record
     */
    async update(donor_id, donorData) {
        const { full_name, age, gender, blood_group, phone, email, address, last_donation_date } = donorData;
        const query = `
            UPDATE donors
            SET full_name = ?, age = ?, gender = ?, blood_group = ?, phone = ?, email = ?, address = ?, last_donation_date = ?
            WHERE donor_id = ?
        `;
        const [result] = await db.execute(query, [
            full_name,
            parseInt(age, 10),
            gender,
            blood_group,
            phone,
            email,
            address,
            last_donation_date || null,
            donor_id
        ]);
        return result.affectedRows > 0;
    },

    /**
     * Delete donor by ID
     */
    async delete(donor_id) {
        const query = `DELETE FROM donors WHERE donor_id = ?`;
        const [result] = await db.execute(query, [donor_id]);
        return result.affectedRows > 0;
    },

    /**
     * Get aggregate statistics for dashboards
     */
    async getStats() {
        const [totalRows] = await db.execute(`SELECT COUNT(*) AS total FROM donors`);
        const [groupRows] = await db.execute(`
            SELECT blood_group, COUNT(*) as count 
            FROM donors 
            GROUP BY blood_group
        `);
        const [monthlyRows] = await db.execute(`
            SELECT DATE_FORMAT(created_at, '%b %Y') AS month_label, COUNT(*) AS count
            FROM donors
            GROUP BY DATE_FORMAT(created_at, '%b %Y'), YEAR(created_at), MONTH(created_at)
            ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC
            LIMIT 6
        `);

        return {
            total: totalRows[0].total,
            byGroup: groupRows,
            monthly: monthlyRows
        };
    }
};

module.exports = Donor;
