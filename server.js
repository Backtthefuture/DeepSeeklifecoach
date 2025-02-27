// 简单的 CORS 代理服务器
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8888;

// 启用 CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// 代理 API 请求到火山方舟
app.use('/api/proxy', createProxyMiddleware({
  target: 'https://ark.cn-beijing.volces.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy': '/api/v3/chat/completions'
  },
  onProxyRes: function(proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  }
}));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API 代理地址: http://localhost:${PORT}/api/proxy`);
});
