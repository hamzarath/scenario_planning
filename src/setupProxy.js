const { createProxyMiddleware } = require('http-proxy-middleware');
const corsMiddleware = require('./middleware/cors');

module.exports = function(app) {
  // Apply CORS middleware first
  app.use(corsMiddleware);

  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:1234',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': ''
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add CORS headers
        proxyReq.setHeader('Access-Control-Allow-Origin', '*');
        proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      }
    })
  );
}; 