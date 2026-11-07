/**
 * BLOOD BANK MANAGEMENT SYSTEM – LIFEDROP
 * Core Express Server Entrypoint
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const methodOverride = require('method-override');

// Import Database Connection Pool
const db = require('./config/db');

// Import Routes
const dashboardRoutes = require('./routes/dashboardRoutes');
const donorRoutes = require('./routes/donorRoutes');
const stockRoutes = require('./routes/stockRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import Error Handling Middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================================
// SECURITY & MIDDLEWARE CONFIGURATION
// =====================================================================

// Configure Helmet with Content Security Policy allowing required CDNs
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://cdn.jsdelivr.net',
                    'https://cdnjs.cloudflare.com'
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://cdn.jsdelivr.net',
                    'https://cdnjs.cloudflare.com',
                    'https://fonts.googleapis.com'
                ],
                fontSrc: [
                    "'self'",
                    'https://fonts.gstatic.com',
                    'https://cdnjs.cloudflare.com'
                ],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"]
            }
        },
        crossOriginEmbedderPolicy: false
    })
);

// Method override for HTTP verbs
app.use(methodOverride('_method'));

// Request Body Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Configure Template Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session Configuration
app.use(
    session({
        name: 'lifedrop_sid',
        secret: process.env.SESSION_SECRET || 'lifedrop_super_secret_session_key_2026_xyz',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
    })
);

// Flash Messages
app.use(flash());

// Global Template Locals (Available to all EJS templates)
app.use((req, res, next) => {
    res.locals.admin = req.session.admin || null;
    res.locals.messages = {
        success: req.flash('success'),
        error: req.flash('error')
    };
    res.locals.currentPath = req.path;
    next();
});

// =====================================================================
// APPLICATION ROUTE MOUNTING
// =====================================================================
app.use('/', dashboardRoutes);
app.use('/', donorRoutes);
app.use('/', stockRoutes);
app.use('/', requestRoutes);
app.use('/', adminRoutes);

// =====================================================================
// ERROR HANDLING
// =====================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// =====================================================================
// SERVER INITIALIZATION
// =====================================================================
const server = app.listen(PORT, () => {
    console.log('=================================================================');
    console.log('🏥 LIFEDROP – BLOOD BANK MANAGEMENT SYSTEM');
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`🔐 Admin Portal:     http://localhost:${PORT}/admin/login`);
    console.log(`📊 Mode:             ${process.env.NODE_ENV || 'development'}`);
    console.log('=================================================================');
});

// Graceful process termination
process.on('SIGINT', () => {
    console.log('\nShutting down LifeDrop server gracefully...');
    server.close(() => {
        db.end(() => {
            console.log('MySQL connection pool closed.');
            process.exit(0);
        });
    });
});

module.exports = app;
