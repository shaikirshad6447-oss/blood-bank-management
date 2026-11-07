/**
 * Blood Stock Model
 * Handles database operations for the `blood_stock` table.
 * Enforces transaction safety and non-negative inventory constraints.
 */
const db = require('../config/db');

const BloodStock = {
    /**
     * Get stock for all 8 blood groups in standard logical order
     */
    async getAll() {
        const query = `
            SELECT stock_id, blood_group, units_available, last_updated,
            CASE 
                WHEN units_available > 10 THEN 'Available'
                WHEN units_available BETWEEN 1 AND 10 THEN 'Low Stock'
                ELSE 'Out of Stock'
            END AS status_label,
            CASE 
                WHEN units_available > 10 THEN 'success'
                WHEN units_available BETWEEN 1 AND 10 THEN 'warning'
                ELSE 'danger'
            END AS status_badge
            FROM blood_stock
            ORDER BY FIELD(blood_group, 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
        `;
        const [rows] = await db.execute(query);
        return rows;
    },

    /**
     * Get stock record for a specific blood group
     */
    async getByGroup(blood_group) {
        const query = `SELECT * FROM blood_stock WHERE blood_group = ?`;
        const [rows] = await db.execute(query, [blood_group]);
        return rows[0] || null;
    },

    /**
     * Get total blood units currently available
     */
    async getTotalUnits() {
        const [rows] = await db.execute(`SELECT COALESCE(SUM(units_available), 0) AS total_units FROM blood_stock`);
        return rows[0].total_units;
    },

    /**
     * Adjust stock units using a database transaction.
     * Prevents negative stock.
     * @param {string} blood_group
     * @param {number} adjustmentDelta - Positive to add, negative to deduct
     * @param {string} [operationType='add'] - 'add' or 'set'
     */
    async adjustStock(blood_group, amount, operationType = 'add') {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Lock row for update
            const [rows] = await connection.execute(
                `SELECT units_available FROM blood_stock WHERE blood_group = ? FOR UPDATE`,
                [blood_group]
            );

            if (rows.length === 0) {
                throw new Error(`Blood group ${blood_group} not found in inventory.`);
            }

            const currentUnits = rows[0].units_available;
            let newUnits;

            if (operationType === 'set') {
                newUnits = parseInt(amount, 10);
            } else {
                newUnits = currentUnits + parseInt(amount, 10);
            }

            if (newUnits < 0) {
                throw new Error(`Cannot update stock. Resulting units (${newUnits}) cannot be negative.`);
            }

            await connection.execute(
                `UPDATE blood_stock SET units_available = ?, last_updated = CURRENT_TIMESTAMP WHERE blood_group = ?`,
                [newUnits, blood_group]
            );

            await connection.commit();
            return { blood_group, previousUnits: currentUnits, newUnits };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Get distribution formatted for Chart.js
     */
    async getDistribution() {
        const rows = await this.getAll();
        return {
            labels: rows.map(r => r.blood_group),
            data: rows.map(r => r.units_available)
        };
    },

    /**
     * Get low stock count (units <= 10)
     */
    async getLowStockCount(threshold = 10) {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS count FROM blood_stock WHERE units_available <= ?`,
            [threshold]
        );
        return rows[0].count;
    }
};

module.exports = BloodStock;
