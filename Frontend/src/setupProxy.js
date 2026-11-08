const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = app => {
    // Keep API requests and their documentation on the same development backend.
    app.use(['/api', '/docs', '/openapi.json'], createProxyMiddleware({
        target: process.env.FEATX_DEV_BACKEND_URL || 'http://127.0.0.1:13010',
        changeOrigin: true,
        proxyTimeout: 600000,
    }));
};
