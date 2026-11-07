/**
 * Centralized Error Handling Middleware
 */

function notFoundHandler(req, res, next) {
    res.status(404).render('pages/404', {
        title: '404 - Page Not Found',
        path: req.originalUrl
    });
}

function errorHandler(err, req, res, next) {
    console.error('SERVER ERROR:', err.stack || err.message);

    const statusCode = err.status || 500;
    const isDev = process.env.NODE_ENV !== 'production';

    // If request accepts JSON or is AJAX
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(statusCode).json({
            success: false,
            message: err.message || 'Internal Server Error',
            ...(isDev && { stack: err.stack })
        });
    }

    res.status(statusCode).render('pages/500', {
        title: '500 - Server Error',
        message: err.message || 'An unexpected error occurred. Our team has been notified.',
        error: isDev ? err : {}
    });
}

module.exports = {
    notFoundHandler,
    errorHandler
};
