-- =====================================================================
-- BLOOD BANK MANAGEMENT SYSTEM – LIFEDROP
-- Database Initialization Script for MySQL & MySQL Workbench
-- Database Name: blood_bank_db
-- Exactly Three Core Tables: donors, blood_stock, requests
-- =====================================================================

DROP DATABASE IF EXISTS blood_bank_db;
CREATE DATABASE blood_bank_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE blood_bank_db;

-- ---------------------------------------------------------------------
-- TABLE 1: donors
-- Stores registered voluntary blood donors
-- ---------------------------------------------------------------------
CREATE TABLE donors (
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
    CONSTRAINT chk_donor_age CHECK (age >= 18 AND age <= 65),
    INDEX idx_donor_blood_group (blood_group),
    INDEX idx_donor_created (created_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE 2: blood_stock
-- Tracks available inventory across all 8 standard human blood groups
-- ---------------------------------------------------------------------
CREATE TABLE blood_stock (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL UNIQUE,
    units_available INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_units_non_negative CHECK (units_available >= 0),
    INDEX idx_stock_blood_group (blood_group)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE 3: requests
-- Stores patient blood requests submitted by hospitals and individuals
-- ---------------------------------------------------------------------
CREATE TABLE requests (
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
    CONSTRAINT chk_units_positive CHECK (units_required > 0),
    INDEX idx_request_blood_group (blood_group),
    INDEX idx_request_status (status),
    INDEX idx_request_urgency (urgency),
    INDEX idx_request_date (request_date)
) ENGINE=InnoDB;

-- =====================================================================
-- INITIAL DATA INSERTION
-- 1. Initialize Exactly Eight Blood Groups in blood_stock
-- =====================================================================
INSERT INTO blood_stock (blood_group, units_available) VALUES
('A+', 24),
('A-', 8),
('B+', 32),
('B-', 6),
('AB+', 14),
('AB-', 3),
('O+', 45),
('O-', 7);

-- ---------------------------------------------------------------------
-- 2. Sample Realistic Donors for Demonstration
-- ---------------------------------------------------------------------
INSERT INTO donors (full_name, age, gender, blood_group, phone, email, address, last_donation_date, created_at) VALUES
('Aarav Sharma', 28, 'Male', 'O+', '9876543210', 'aarav.sharma@example.com', 'Flat 402, Green Park Avenue, Hyderabad', '2026-08-15', '2026-08-15 10:30:00'),
('Priya Patel', 24, 'Female', 'A+', '9812345678', 'priya.patel@example.com', '12 Lake View Road, Jubilee Hills, Hyderabad', '2026-09-02', '2026-09-02 11:15:00'),
('Rohan Verma', 35, 'Male', 'B+', '9845012345', 'rohan.verma@example.com', 'Plot 88, Madhapur Tech Enclave, Hyderabad', '2026-07-20', '2026-07-20 14:00:00'),
('Ananya Deshmukh', 29, 'Female', 'O-', '9723456789', 'ananya.d@example.com', 'C-15, Banjara Residency, Hyderabad', '2026-06-10', '2026-06-10 09:45:00'),
('Vikram Singh', 42, 'Male', 'AB+', '9956781234', 'vikram.singh@example.com', '5th Cross, Begumpet, Hyderabad', '2026-05-18', '2026-05-18 16:20:00'),
('Sneha Reddy', 22, 'Female', 'B-', '9612345098', 'sneha.reddy@example.com', 'H.No 3-4-102, Gachibowli, Hyderabad', '2026-08-30', '2026-08-30 12:10:00'),
('Mohammed Zeeshan', 31, 'Male', 'A-', '9701234567', 'm.zeeshan@example.com', '22 Charminar Heritage Lane, Hyderabad', '2026-09-25', '2026-09-25 15:40:00'),
('Kavita Iyer', 27, 'Female', 'AB-', '9888776655', 'kavita.iyer@example.com', '101 Lotus Crest, Kondapur, Hyderabad', '2026-04-12', '2026-04-12 10:00:00'),
('Rahul Nair', 38, 'Male', 'O+', '9765432109', 'rahul.nair@example.com', '78 Sunshine Boulevard, Kukatpally, Hyderabad', '2026-07-04', '2026-07-04 11:30:00'),
('Deepika Joshi', 26, 'Female', 'A+', '9823456701', 'deepika.j@example.com', '14 Sunrise Apartments, Hitec City, Hyderabad', '2026-10-01', '2026-10-01 13:25:00');

-- ---------------------------------------------------------------------
-- 3. Sample Patient Blood Requests
-- ---------------------------------------------------------------------
INSERT INTO requests (patient_name, hospital_name, blood_group, units_required, contact_number, urgency, additional_notes, request_date, status) VALUES
('Sunita Mehra', 'Apollo Hospital, Jubilee Hills', 'O+', 2, '9988776655', 'Emergency', 'Urgent requirement for cardiac bypass surgery.', '2026-11-05 08:30:00', 'Approved'),
('Rajesh Kumar', 'Yashoda Hospital, Somajiguda', 'B+', 3, '9877665544', 'Urgent', 'Accident trauma patient in ICU Bed 4.', '2026-11-04 14:15:00', 'Fulfilled'),
('Fatima Begum', 'Care Hospital, Banjara Hills', 'A+', 1, '9766554433', 'Normal', 'Scheduled chemotherapy supportive transfusion.', '2026-11-06 09:00:00', 'Pending'),
('Karthik Raja', 'KIMS Hospital, Secunderabad', 'AB-', 2, '9655443322', 'Emergency', 'Severe anemia and acute platelet drop.', '2026-11-06 11:45:00', 'Pending'),
('Manoj Kulkarni', 'Continental Hospital, Nanakramguda', 'O-', 2, '9544332211', 'Urgent', 'Orthopedic knee reconstruction surgery.', '2026-11-03 16:20:00', 'Fulfilled'),
('Divya Nair', 'MaxCure Hospitals, Madhapur', 'A-', 4, '9433221100', 'Emergency', 'Postpartum hemorrhage emergency.', '2026-11-02 20:10:00', 'Approved'),
('Suresh Raina', 'Sunshine Hospitals, Gachibowli', 'B-', 1, '9322110099', 'Normal', 'General surgical procedure scheduled next week.', '2026-11-01 10:00:00', 'Rejected');
