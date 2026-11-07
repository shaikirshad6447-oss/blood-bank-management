# LifeDrop – Blood Bank Management System

> **"Every Drop Saves a Life."**  
> A complete, modern, interactive, and responsive healthcare technology platform connecting voluntary blood donors with emergency hospital requisitions.

---

## 🌟 Overview & Key Features

LifeDrop is a production-grade full-stack Blood Bank Management System developed using a clean **Model-View-Controller (MVC)** architecture. Built for academic excellence, hospital administration, and emergency dispatch, it incorporates:

- **Stunning Healthcare UI/UX**: Inspired by Red Cross and modern healthcare SaaS interfaces with Inter/Manrope typography, responsive layouts, subtle shadows, and crisp status badges.
- **Real-Time Live Statistics**: Registered Donors, Available Units, Total Requests, and Fulfilled Requests queried dynamically from MySQL (no hardcoded data).
- **8 Blood Groups Inventory**: Real-time stock status (Green: Available, Orange: Low Stock, Red: Out of Stock) with visual capacity gauges.
- **ACID Transaction-Safe Operations**: Request approvals and stock adjustments run inside atomic database transactions (`START TRANSACTION`, row-level locks `FOR UPDATE`, and `COMMIT`/`ROLLBACK`), strictly preventing negative stock and duplicate deductions.
- **Secure Administrator Portal**: Protected session authentication using **bcrypt** password hashing, HTTP-only secure cookies, and login rate limiting.
- **Interactive Visualizations**: Embedded Chart.js analytics for blood group distribution, monthly donor registrations, urgency breakdown, and request status pipeline.
- **Printable Clinical Audit Reports**: Executive summary reports formatted for printing and PDF generation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), EJS, Bootstrap 5, Font Awesome 6, Chart.js 4 |
| **Backend** | Node.js (v24+), Express.js |
| **Database** | MySQL 8.0 (100% MySQL Workbench compatible) |
| **Security** | Helmet (CSP), express-rate-limit, express-session, bcrypt, express-validator |
| **Database Driver** | `mysql2/promise` with connection pooling |

---

## 📂 Project Architecture

```
blood-bank-management/
│
├── config/
│   └── db.js                      # MySQL connection pool with promise support
│
├── controllers/
│   ├── donorController.js         # Public registration, donor CRUD
│   ├── requestController.js       # Requisitions, approval transactions
│   ├── stockController.js         # Public availability, stock adjustments
│   ├── adminController.js         # Admin login, sessions, bcrypt authentication
│   └── dashboardController.js     # Home stats, admin analytics, Chart API, reports
│
├── middleware/
│   ├── authMiddleware.js          # Route guards & session protection
│   ├── validationMiddleware.js    # express-validator rules
│   └── errorMiddleware.js         # 404 and 500 error handlers
│
├── models/
│   ├── donorModel.js              # SQL queries for `donors` table
│   ├── stockModel.js              # SQL queries & transactions for `blood_stock` table
│   └── requestModel.js            # SQL queries & atomic deductions for `requests` table
│
├── routes/
│   ├── donorRoutes.js             # /donate, /admin/donors
│   ├── requestRoutes.js           # /request, /admin/requests
│   ├── stockRoutes.js             # /availability, /admin/stock
│   ├── adminRoutes.js             # /admin/login, /admin/dashboard, /admin/reports
│   └── dashboardRoutes.js         # /, /about, /contact
│
├── views/
│   ├── partials/                  # header, footer, navbar, alerts, adminSidebar, adminNavbar
│   ├── pages/                     # index, registerDonor, donorSuccess, availability, requestBlood, requestSuccess, about, contact, 404, 500
│   └── admin/                     # login, dashboard, donors, donorEdit, stock, requests, reports
│
├── public/
│   ├── css/                       # style.css, admin.css
│   ├── js/                        # main.js, admin.js, charts.js
│   └── images/                    # logo.svg, hero-illustration.svg
│
├── .env                           # Configured environment variables
├── .env.example                   # Example template for environment setup
├── .gitignore
├── database.sql                   # Complete MySQL initialization script
├── package.json
├── server.js                      # Application server entrypoint
└── README.md
```

---

## 🗄️ Database Design (Exactly Three Core Tables)

Database Name: `blood_bank_db`

1. **`donors`**
   - `donor_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `full_name` (VARCHAR(100), NOT NULL)
   - `age` (INT, NOT NULL, CHECK age BETWEEN 18 AND 65)
   - `gender` (ENUM('Male', 'Female', 'Other'), NOT NULL)
   - `blood_group` (ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), NOT NULL)
   - `phone` (VARCHAR(20), UNIQUE, NOT NULL)
   - `email` (VARCHAR(100), UNIQUE, NOT NULL)
   - `address` (TEXT, NOT NULL)
   - `last_donation_date` (DATE, NULL)
   - `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

2. **`blood_stock`**
   - `stock_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `blood_group` (ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), UNIQUE, NOT NULL)
   - `units_available` (INT, NOT NULL, DEFAULT 0, CHECK units_available >= 0)
   - `last_updated` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
   *(Initialized with all 8 blood groups)*

3. **`requests`**
   - `request_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `patient_name` (VARCHAR(100), NOT NULL)
   - `hospital_name` (VARCHAR(150), NOT NULL)
   - `blood_group` (ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), NOT NULL)
   - `units_required` (INT, NOT NULL, CHECK units_required > 0)
   - `contact_number` (VARCHAR(20), NOT NULL)
   - `urgency` (ENUM('Normal', 'Urgent', 'Emergency'), NOT NULL, DEFAULT 'Normal')
   - `additional_notes` (TEXT, NULL)
   - `request_date` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
   - `status` (ENUM('Pending', 'Approved', 'Fulfilled', 'Rejected'), NOT NULL, DEFAULT 'Pending')

---

## 🚀 Installation & Setup Guide

### 1. Database Setup in MySQL or MySQL Workbench

Open **MySQL Workbench** or your MySQL command line:
1. Open the file `database.sql` in MySQL Workbench (File &rarr; Open SQL Script).
2. Execute the entire script (Click the Lightning Bolt icon ⚡).
3. The script will create `blood_bank_db`, create the 3 tables with proper constraints and indexes, and populate initial stock and realistic demo records.

Alternatively, import via command prompt / terminal:
```bash
mysql -u root -p < database.sql
```

### 2. Configure Environment Variables

The project includes a pre-configured `.env` file. You can adjust your MySQL credentials if needed:
```env
PORT=3000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=blood_bank_db
DB_PORT=3306

# Security & Session
SESSION_SECRET=lifedrop_super_secret_session_key_2026_xyz
ADMIN_USERNAME=admin
# bcrypt hash for 'admin123'
ADMIN_PASSWORD_HASH=$2b$10$VM/t/0SuDxtXnM0WPS54oeHGxC/WdzRPxxLEcYya2uN3vZLsRckeC
```

### 3. Install Dependencies & Start the Server

```bash
# Install dependencies
npm install

# Start the application
npm start
```

Visit the application in your browser:
- **Public Website**: [http://localhost:3000](http://localhost:3000)
- **Admin Portal**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 🔑 Default Administrator Credentials

- **Username**: `admin`
- **Password**: `admin123`
*(Authenticated securely via bcrypt hashing and protected against brute-force with IP rate limiting).*

---

## 🧪 Demonstration & Testing Workflows

1. **Live Landing Page (`/`)**:
   - Observe live metrics (Donors, Units, Total Requests, Fulfilled Requests) loaded directly from MySQL.
2. **Donor Registration (`/donate`)**:
   - Try registering with age < 18 or > 65 (rejected by both client & server).
   - Enter valid details; observe redirection to the confirmation view with unique Donor ID.
   - Verify that submitting duplicate phone/email returns a user-friendly error.
3. **Live Blood Stock (`/availability`)**:
   - View all 8 blood groups with color-coded badges and real-time status indicators.
   - Test the instant search and status filter dropdowns.
4. **Blood Request Submission (`/request`)**:
   - Submit a request for a patient; receive a unique tracking ID (e.g. `#REQ-8`) with initial status `Pending`.
   - Verify that available stock has **not** been deducted yet.
5. **Admin Dashboard (`/admin/dashboard`)**:
   - Log in with `admin` / `admin123`.
   - View the 6 overview KPI cards and dynamic Chart.js visualizations.
6. **Stock Management (`/admin/stock`)**:
   - Open stock adjustment modal; add or set units for a group. Observe real-time update and transaction safety.
7. **Request Approval & Atomic Stock Deduction (`/admin/requests`)**:
   - Locate the pending request. Click **Approve**.
   - Notice that the required units are deducted from the exact blood group atomically.
   - Try approving a request where `units_required > units_available`; observe clear flash warning: *"Insufficient stock for blood group..."*.
   - Mark an approved request as **Fulfilled**.
8. **Printable Reports (`/admin/reports`)**:
   - View full clinical audit summary and click **Print / Save as PDF**.
