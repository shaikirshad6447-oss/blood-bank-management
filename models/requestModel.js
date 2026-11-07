/**
 * Request Model
 * Handles database operations for the `requests` table.
 * Implements transaction-safe request approvals with atomic stock deduction.
 */
const db = require('../config/db');

const BloodRequest = {
    /**
     * Submit a new blood request (status defaults to Pending)
     */
    async create(requestData) {
        const {
            patient_name,
            hospital_name,
            blood_group,
            units_required,
            contact_number,
            urgency,
            additional_notes
        } = requestData;

        const query = `
            INSERT INTO requests 
            (patient_name, hospital_name, blood_group, units_required, contact_number, urgency, additional_notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `;

        const [result] = await db.execute(query, [
            patient_name,
            hospital_name,
            blood_group,
            parseInt(units_required, 10),
            contact_number,
            urgency || 'Normal',
            additional_notes || null
        ]);

        return result.insertId;
    },

    /**
     * Find a request by its primary key ID
     */
    async findById(request_id) {
        const query = `SELECT * FROM requests WHERE request_id = ?`;
        const [rows] = await db.execute(query, [request_id]);
        return rows[0] || null;
    },

    /**
     * Find requests with search, filtering by blood group, urgency, status, and pagination
     */
    async findAll({ search = '', bloodGroup = '', urgency = '', status = '', limit = 10, offset = 0 } = {}) {
        let query = `SELECT * FROM requests WHERE 1=1`;
        const params = [];

        if (search) {
            query += ` AND (patient_name LIKE ? OR hospital_name LIKE ? OR contact_number LIKE ?)`;
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        if (bloodGroup) {
            query += ` AND blood_group = ?`;
            params.push(bloodGroup);
        }

        if (urgency) {
            query += ` AND urgency = ?`;
            params.push(urgency);
        }

        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }

        query += ` ORDER BY FIELD(urgency, 'Emergency', 'Urgent', 'Normal'), request_date DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit, 10), parseInt(offset, 10));

        const [rows] = await db.query(query, params);
        return rows;
    },

    /**
     * Count requests matching filter criteria
     */
    async countAll({ search = '', bloodGroup = '', urgency = '', status = '' } = {}) {
        let query = `SELECT COUNT(*) AS total FROM requests WHERE 1=1`;
        const params = [];

        if (search) {
            query += ` AND (patient_name LIKE ? OR hospital_name LIKE ? OR contact_number LIKE ?)`;
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        if (bloodGroup) {
            query += ` AND blood_group = ?`;
            params.push(bloodGroup);
        }

        if (urgency) {
            query += ` AND urgency = ?`;
            params.push(urgency);
        }

        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }

        const [rows] = await db.execute(query, params);
        return rows[0].total;
    },

    /**
     * Approve a blood request with atomic stock verification and deduction.
     * Prevents duplicate deductions.
     */
    async approve(request_id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Lock the request row for update
            const [requestRows] = await connection.execute(
                `SELECT * FROM requests WHERE request_id = ? FOR UPDATE`,
                [request_id]
            );

            if (requestRows.length === 0) {
                throw new Error(`Blood request #${request_id} not found.`);
            }

            const request = requestRows[0];

            // 2. Prevent duplicate stock deductions
            if (request.status === 'Approved') {
                throw new Error(`Request #${request_id} has already been approved.`);
            }
            if (request.status === 'Fulfilled') {
                throw new Error(`Request #${request_id} has already been fulfilled.`);
            }
            if (request.status === 'Rejected') {
                throw new Error(`Cannot approve request #${request_id} because it was marked as Rejected.`);
            }

            // 3. Lock stock row for this blood group
            const [stockRows] = await connection.execute(
                `SELECT units_available FROM blood_stock WHERE blood_group = ? FOR UPDATE`,
                [request.blood_group]
            );

            if (stockRows.length === 0) {
                throw new Error(`Blood group ${request.blood_group} does not exist in inventory.`);
            }

            const availableUnits = stockRows[0].units_available;
            const requiredUnits = request.units_required;

            // 4. Check sufficient stock
            if (availableUnits < requiredUnits) {
                throw new Error(
                    `Insufficient stock for blood group ${request.blood_group}. Available: ${availableUnits} units, Required: ${requiredUnits} units.`
                );
            }

            // 5. Deduct stock atomically
            const newUnits = availableUnits - requiredUnits;
            await connection.execute(
                `UPDATE blood_stock SET units_available = ?, last_updated = CURRENT_TIMESTAMP WHERE blood_group = ?`,
                [newUnits, request.blood_group]
            );

            // 6. Update request status to Approved
            await connection.execute(
                `UPDATE requests SET status = 'Approved' WHERE request_id = ?`,
                [request_id]
            );

            await connection.commit();
            return {
                success: true,
                requestId: request_id,
                bloodGroup: request.blood_group,
                deductedUnits: requiredUnits,
                remainingUnits: newUnits
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Reject a blood request without deducting any stock
     */
    async reject(request_id) {
        const query = `UPDATE requests SET status = 'Rejected' WHERE request_id = ? AND status = 'Pending'`;
        const [result] = await db.execute(query, [request_id]);
        if (result.affectedRows === 0) {
            throw new Error(`Request #${request_id} could not be rejected. It may already be processed.`);
        }
        return true;
    },

    /**
     * Mark an approved request as Fulfilled
     */
    async fulfill(request_id) {
        const query = `UPDATE requests SET status = 'Fulfilled' WHERE request_id = ? AND status = 'Approved'`;
        const [result] = await db.execute(query, [request_id]);
        if (result.affectedRows === 0) {
            throw new Error(`Request #${request_id} must be Approved before being marked as Fulfilled.`);
        }
        return true;
    },

    /**
     * Retrieve aggregate request statistics for dashboards and reports
     */
    async getStats() {
        const [statusRows] = await db.execute(`
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approved,
                SUM(CASE WHEN status = 'Fulfilled' THEN 1 ELSE 0 END) AS fulfilled,
                SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected
            FROM requests
        `);

        const [urgencyRows] = await db.execute(`
            SELECT urgency, COUNT(*) AS count
            FROM requests
            GROUP BY urgency
        `);

        const [groupRows] = await db.execute(`
            SELECT blood_group, COUNT(*) AS count, SUM(units_required) AS total_units_requested
            FROM requests
            GROUP BY blood_group
        `);

        return {
            summary: statusRows[0],
            byUrgency: urgencyRows,
            byGroup: groupRows
        };
    }
};

module.exports = BloodRequest;
