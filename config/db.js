/**
 * Database Connection Pool Configuration
 * Uses mysql2/promise for async/await queries and connection pooling.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'blood_bank_db',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    timezone: '+00:00'
});

// Test database connection at startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✓ Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'blood_bank_db'));
        connection.release();
    } catch (error) {
        console.error('✗ Error connecting to MySQL database:', error.message);
    }
}

testConnection();

module.exports = pool;
