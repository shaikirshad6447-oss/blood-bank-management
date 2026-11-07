/**
 * Database Connection Pool Configuration
 * Supports standard environment variables, cloud connection URIs (Railway / TiDB / Aiven),
 * SSL for managed cloud databases, and automatic idempotent schema self-initialization.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// Determine connection parameters
const isProduction = process.env.NODE_ENV === 'production';
const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

const poolConfig = connectionUri
    ? {
          uri: connectionUri,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
          timezone: '+00:00',
          ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
      }
    : {
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.DB_PASS || ''),
          database: process.env.DB_NAME || 'blood_bank_db',
          port: parseInt(process.env.DB_PORT || '3306', 10),
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
          timezone: '+00:00',
          ssl: (process.env.DB_SSL === 'true' || (isProduction && process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1'))
              ? { rejectUnauthorized: false }
              : undefined
      };

const pool = mysql.createPool(poolConfig);

/**
 * Automatically ensure the 3 required tables exist and populate initial blood groups if empty.
 * Runs idempotently on application boot in both development and cloud production.
 */
async function initializeSchema(connection) {
    // 1. Table: donors
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS donors (
            donor_id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            age INT NOT NULL,
            gender ENUM('Male', 'Female', 'Other') NOT NULL,
            blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
            phone VARCHAR(20) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            address TEXT NOT NULL,
            last_donation_date DATE NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_donor_blood_group (blood_group),
            INDEX idx_donor_created (created_at)
        ) ENGINE=InnoDB;
    `);

    // 2. Table: blood_stock
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS blood_stock (
            stock_id INT AUTO_INCREMENT PRIMARY KEY,
            blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL UNIQUE,
            units_available INT NOT NULL DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_stock_blood_group (blood_group)
        ) ENGINE=InnoDB;
    `);

    // 3. Table: requests
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS requests (
            request_id INT AUTO_INCREMENT PRIMARY KEY,
            patient_name VARCHAR(100) NOT NULL,
            hospital_name VARCHAR(150) NOT NULL,
            blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
            units_required INT NOT NULL,
            contact_number VARCHAR(20) NOT NULL,
            urgency ENUM('Normal', 'Urgent', 'Emergency') NOT NULL DEFAULT 'Normal',
            additional_notes TEXT NULL,
            request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('Pending', 'Approved', 'Fulfilled', 'Rejected') NOT NULL DEFAULT 'Pending',
            INDEX idx_request_blood_group (blood_group),
            INDEX idx_request_status (status),
            INDEX idx_request_urgency (urgency),
            INDEX idx_request_date (request_date)
        ) ENGINE=InnoDB;
    `);

    // Seed blood_stock if empty (exactly 8 blood groups)
    const [rows] = await connection.execute('SELECT COUNT(*) AS count FROM blood_stock');
    if (rows[0].count === 0) {
        console.log('⚡ Initializing standard blood stock groups (A+, A-, B+, B-, AB+, AB-, O+, O-)...');
        await connection.execute(`
            INSERT INTO blood_stock (blood_group, units_available) VALUES
            ('A+', 24), ('A-', 8), ('B+', 32), ('B-', 6),
            ('AB+', 14), ('AB-', 3), ('O+', 45), ('O-', 7);
        `);
    }

    // Seed sample donors if empty for demonstration
    const [donorRows] = await connection.execute('SELECT COUNT(*) AS count FROM donors');
    if (donorRows[0].count === 0) {
        console.log('⚡ Initializing demonstration donor profiles...');
        await connection.execute(`
            INSERT INTO donors (full_name, age, gender, blood_group, phone, email, address, last_donation_date) VALUES
            ('Aarav Sharma', 28, 'Male', 'O+', '9876543210', 'aarav.sharma@example.com', 'Flat 402, Green Park Avenue, Hyderabad', '2026-08-15'),
            ('Priya Patel', 24, 'Female', 'A+', '9812345678', 'priya.patel@example.com', '12 Lake View Road, Jubilee Hills, Hyderabad', '2026-09-02'),
            ('Rohan Verma', 35, 'Male', 'B+', '9845012345', 'rohan.verma@example.com', 'Plot 88, Madhapur Tech Enclave, Hyderabad', '2026-07-20'),
            ('Ananya Deshmukh', 29, 'Female', 'O-', '9723456789', 'ananya.d@example.com', 'C-15, Banjara Residency, Hyderabad', '2026-06-10');
        `);
    }

    // Seed sample requests if empty for demonstration
    const [reqRows] = await connection.execute('SELECT COUNT(*) AS count FROM requests');
    if (reqRows[0].count === 0) {
        console.log('⚡ Initializing demonstration requests...');
        await connection.execute(`
            INSERT INTO requests (patient_name, hospital_name, blood_group, units_required, contact_number, urgency, additional_notes, status) VALUES
            ('Sunita Mehra', 'Apollo Hospital, Jubilee Hills', 'O+', 2, '9988776655', 'Emergency', 'Urgent requirement for cardiac surgery.', 'Approved'),
            ('Rajesh Kumar', 'Yashoda Hospital, Somajiguda', 'B+', 3, '9877665544', 'Urgent', 'Accident trauma patient in ICU Bed 4.', 'Fulfilled'),
            ('Fatima Begum', 'Care Hospital, Banjara Hills', 'A+', 1, '9766554433', 'Normal', 'Scheduled chemotherapy supportive transfusion.', 'Pending');
        `);
    }
}

// Test database connection and run schema validation on startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        const dbName = poolConfig.database || (connectionUri ? 'Cloud Database' : 'blood_bank_db');
        console.log('✓ Successfully connected to MySQL database: ' + dbName);

        // Run automated idempotent schema check
        await initializeSchema(connection);
        console.log('✓ Schema and standard 8 blood stock categories verified.');

        connection.release();
    } catch (error) {
        console.error('✗ Error connecting to MySQL database:', error.message);
        console.error('  Hint: Verify your DB_HOST, DB_USER, DB_PASSWORD, DB_NAME or DATABASE_URL settings.');
    }
}

testConnection();

module.exports = pool;
