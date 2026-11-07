/**
 * Comprehensive Automated Verification Suite for LifeDrop Blood Bank
 * Tests all 16 major functional, architectural, and security requirements.
 */
const http = require('http');
const app = require('./server');
const db = require('./config/db');

let server;
const PORT = 3001; // Isolated port for testing
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body
                });
            });
        });

        req.on('error', reject);

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting LifeDrop Verification Test Suite...\n');
    let passedCount = 0;
    let failedCount = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`  ✓ [PASS] ${testName}`);
            passedCount++;
        } else {
            console.error(`  ✗ [FAIL] ${testName}`);
            failedCount++;
        }
    }

    try {
        // Start test server
        server = app.listen(PORT);
        await new Promise(r => setTimeout(r, 800));

        // ---------------------------------------------------------
        // 1. Verify Database Schema & 3 Core Tables
        // ---------------------------------------------------------
        console.log('--- 1. Database Architecture & Schema Verification ---');
        const [tables] = await db.execute(`SHOW TABLES`);
        const tableNames = tables.map(t => Object.values(t)[0]).sort();
        assert(
            tableNames.length === 3 &&
            tableNames.includes('blood_stock') &&
            tableNames.includes('donors') &&
            tableNames.includes('requests'),
            'Exact 3 core tables exist: blood_stock, donors, requests'
        );

        // Verify exactly 8 blood groups in blood_stock
        const [stockRows] = await db.execute(`SELECT COUNT(*) AS count FROM blood_stock`);
        assert(stockRows[0].count === 8, 'Exactly eight standard blood groups initialized in blood_stock');

        // Verify production health check endpoint
        const healthRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/health',
            method: 'GET'
        });
        assert(healthRes.statusCode === 200, 'GET /health returns HTTP 200');
        const healthData = JSON.parse(healthRes.body);
        assert(healthData.status === 'healthy', 'Health check reports status: healthy');

        // ---------------------------------------------------------
        // 2. Public Home Page & Live Statistics
        // ---------------------------------------------------------
        console.log('\n--- 2. Public Landing Page & Dynamic Statistics ---');
        const homeRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/',
            method: 'GET'
        });
        assert(homeRes.statusCode === 200, 'GET / returns HTTP 200');
        assert(homeRes.body.includes('Your One Donation'), 'Home page contains main heading');
        assert(homeRes.body.includes('Available Blood Units'), 'Home page renders live blood stock statistics');

        // ---------------------------------------------------------
        // 3. Blood Availability Page
        // ---------------------------------------------------------
        console.log('\n--- 3. Real-Time Blood Availability ---');
        const availRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/availability',
            method: 'GET'
        });
        assert(availRes.statusCode === 200, 'GET /availability returns HTTP 200');
        assert(availRes.body.includes('O+'), 'Availability page displays O+ group card');
        assert(availRes.body.includes('AB-'), 'Availability page displays AB- group card');

        // ---------------------------------------------------------
        // 4. Donor Registration & Age Validation
        // ---------------------------------------------------------
        console.log('\n--- 4. Donor Registration Validation & Workflows ---');
        
        // Test Underage (< 18) rejection
        const underagePost = 'full_name=Young+Kid&age=16&gender=Male&blood_group=O%2B&phone=9998887711&email=kid%40test.com&address=Test+Address';
        const underageRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/donate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(underagePost)
            }
        }, underagePost);
        assert(underageRes.statusCode === 422, 'Age < 18 rejected with HTTP 422');
        assert(underageRes.body.includes('between 18 and 65'), 'Correct validation error displayed for underage donor');

        // Test Valid Donor Registration
        const testPhone = '9911223344';
        const testEmail = 'rohit.test@lifedrop.org';
        // Clean up previous test record if exists
        await db.execute(`DELETE FROM donors WHERE email = ?`, [testEmail]);

        const validDonorPost = `full_name=Rohit+Sharma&age=29&gender=Male&blood_group=A%2B&phone=${testPhone}&email=${encodeURIComponent(testEmail)}&address=Banjara+Hills+Lane+4`;
        const validDonorRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/donate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(validDonorPost)
            }
        }, validDonorPost);
        assert(validDonorRes.statusCode === 302, 'Valid donor registration redirects to confirmation (HTTP 302)');

        // Verify donor inserted into MySQL
        const [savedDonor] = await db.execute(`SELECT * FROM donors WHERE email = ?`, [testEmail]);
        assert(savedDonor.length === 1 && savedDonor[0].full_name === 'Rohit Sharma', 'Donor record successfully saved in MySQL donors table');

        // Test Duplicate Rejection
        const duplicateRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/donate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(validDonorPost)
            }
        }, validDonorPost);
        assert(duplicateRes.statusCode === 409, 'Duplicate email/phone registration returns HTTP 409 Conflict');

        // ---------------------------------------------------------
        // 5. Blood Request Submission
        // ---------------------------------------------------------
        console.log('\n--- 5. Patient Blood Requisition Workflows ---');
        const reqPostData = 'patient_name=Kavya+Sen&hospital_name=City+Civil+Hospital&blood_group=B%2B&units_required=2&contact_number=9876501234&urgency=Emergency&additional_notes=Emergency+trauma+ward';
        const submitReqRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/request',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(reqPostData)
            }
        }, reqPostData);
        assert(submitReqRes.statusCode === 302, 'Valid blood request redirects to confirmation (HTTP 302)');

        // Verify request created in DB with status 'Pending'
        const [savedReqs] = await db.execute(`SELECT * FROM requests WHERE patient_name = 'Kavya Sen' ORDER BY request_id DESC LIMIT 1`);
        assert(savedReqs.length === 1, 'Blood request saved in MySQL requests table');
        const testRequestId = savedReqs[0].request_id;
        assert(savedReqs[0].status === 'Pending', 'Initial status of blood request is strictly Pending');

        // ---------------------------------------------------------
        // 6. Admin Authentication & Route Protection
        // ---------------------------------------------------------
        console.log('\n--- 6. Admin Security, Bcrypt Auth & Protected Routes ---');
        
        // Unauthenticated access to dashboard should redirect to login
        const unauthRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/admin/dashboard',
            method: 'GET'
        });
        assert(unauthRes.statusCode === 302 && unauthRes.headers.location === '/admin/login', 'Unauthorized access to /admin/dashboard redirects to /admin/login');

        // Attempt login with invalid password
        const badLoginPost = 'username=admin&password=wrongpassword';
        const badLoginRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/admin/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(badLoginPost)
            }
        }, badLoginPost);
        assert(badLoginRes.statusCode === 302 && badLoginRes.headers.location === '/admin/login', 'Invalid admin password rejected');

        // Successful login with correct bcrypt credentials
        const goodLoginPost = 'username=admin&password=admin123';
        const goodLoginRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/admin/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(goodLoginPost)
            }
        }, goodLoginPost);
        assert(goodLoginRes.statusCode === 302 && goodLoginRes.headers.location === '/admin/dashboard', 'Valid admin login succeeds and redirects to dashboard');
        
        // Extract session cookie
        const setCookie = goodLoginRes.headers['set-cookie'];
        assert(setCookie && setCookie.length > 0, 'Admin session cookie issued');
        const sessionCookie = setCookie ? setCookie[0].split(';')[0] : '';

        // Access dashboard with session cookie
        const authDashRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/admin/dashboard',
            method: 'GET',
            headers: { 'Cookie': sessionCookie }
        });
        assert(authDashRes.statusCode === 200, 'Authenticated admin can view /admin/dashboard');

        // ---------------------------------------------------------
        // 7. Chart.js API Data Endpoint
        // ---------------------------------------------------------
        console.log('\n--- 7. Dynamic Chart.js Analytics API ---');
        const chartRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/admin/api/charts',
            method: 'GET',
            headers: { 'Cookie': sessionCookie }
        });
        assert(chartRes.statusCode === 200, 'GET /admin/api/charts returns HTTP 200');
        const chartData = JSON.parse(chartRes.body);
        assert(chartData.success === true, 'Chart API returns success: true');
        assert(chartData.stockDistribution.labels.length === 8, 'Chart API contains all 8 blood groups in stockDistribution');
        assert(chartData.requestStatus.labels.includes('Pending'), 'Chart API contains request status pipeline metrics');

        // ---------------------------------------------------------
        // 8. ACID Transaction: Stock Approval & Deduction
        // ---------------------------------------------------------
        console.log('\n--- 8. ACID Transaction: Request Approval & Stock Deduction ---');
        
        // Get initial B+ units
        const [bInitial] = await db.execute(`SELECT units_available FROM blood_stock WHERE blood_group = 'B+'`);
        const initialBUnits = bInitial[0].units_available;

        // Approve the 2-unit request for Kavya Sen
        const approveRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: `/admin/requests/${testRequestId}/approve`,
            method: 'POST',
            headers: { 'Cookie': sessionCookie }
        });
        assert(approveRes.statusCode === 302, 'Approve request redirected to requests list');

        // Verify stock deducted
        const [bAfter] = await db.execute(`SELECT units_available FROM blood_stock WHERE blood_group = 'B+'`);
        assert(bAfter[0].units_available === initialBUnits - 2, `B+ stock correctly deducted by 2 units (${initialBUnits} -> ${bAfter[0].units_available})`);

        // Verify request status is now Approved
        const [approvedReq] = await db.execute(`SELECT status FROM requests WHERE request_id = ?`, [testRequestId]);
        assert(approvedReq[0].status === 'Approved', 'Request status updated to Approved');

        // Test duplicate deduction prevention
        const dupApproveRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: `/admin/requests/${testRequestId}/approve`,
            method: 'POST',
            headers: { 'Cookie': sessionCookie }
        });
        const [bAfterDup] = await db.execute(`SELECT units_available FROM blood_stock WHERE blood_group = 'B+'`);
        assert(bAfterDup[0].units_available === bAfter[0].units_available, 'Duplicate approval prevented; stock remains unchanged');

        // Mark as Fulfilled
        const fulfillRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: `/admin/requests/${testRequestId}/fulfill`,
            method: 'POST',
            headers: { 'Cookie': sessionCookie }
        });
        const [fulfilledReq] = await db.execute(`SELECT status FROM requests WHERE request_id = ?`, [testRequestId]);
        assert(fulfilledReq[0].status === 'Fulfilled', 'Request successfully transitioned from Approved to Fulfilled');

        // ---------------------------------------------------------
        // 9. Insufficient Stock Transaction Rollback
        // ---------------------------------------------------------
        console.log('\n--- 9. Insufficient Stock Handling & Transaction Rollback ---');
        const [largeReqResult] = await db.execute(`
            INSERT INTO requests (patient_name, hospital_name, blood_group, units_required, contact_number, urgency, status)
            VALUES ('Huge Demand Patient', 'Emergency Trauma', 'AB-', 999, '9123456789', 'Emergency', 'Pending')
        `);
        const largeReqId = largeReqResult.insertId;

        const [abInitial] = await db.execute(`SELECT units_available FROM blood_stock WHERE blood_group = 'AB-'`);
        const initialABUnits = abInitial[0].units_available;

        // Attempt approval
        await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: `/admin/requests/${largeReqId}/approve`,
            method: 'POST',
            headers: { 'Cookie': sessionCookie }
        });

        // Verify transaction rolled back: stock unchanged and request remains Pending
        const [abAfter] = await db.execute(`SELECT units_available FROM blood_stock WHERE blood_group = 'AB-'`);
        const [checkLargeReq] = await db.execute(`SELECT status FROM requests WHERE request_id = ?`, [largeReqId]);
        assert(abAfter[0].units_available === initialABUnits, 'AB- stock untouched after insufficient units error');
        assert(checkLargeReq[0].status === 'Pending', 'Request remains Pending due to insufficient stock rollback');

        // Clean up test request
        await db.execute(`DELETE FROM requests WHERE request_id = ?`, [largeReqId]);
        await db.execute(`DELETE FROM requests WHERE request_id = ?`, [testRequestId]);
        await db.execute(`DELETE FROM donors WHERE email = ?`, [testEmail]);

        // Restore stock to initial
        await db.execute(`UPDATE blood_stock SET units_available = ? WHERE blood_group = 'B+'`, [initialBUnits]);

        // ---------------------------------------------------------
        // Summary
        // ---------------------------------------------------------
        console.log('\n=============================================================');
        console.log(`🎉 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
        console.log('=============================================================\n');

        if (failedCount > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    } catch (err) {
        console.error('Fatal test error:', err);
        process.exit(1);
    } finally {
        if (server) server.close();
    }
}

runTests();
