// 简单的 CORS 代理服务器
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 启用 CORS
app.use(cors());

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// 代理 API 请求到火山方舟
app.use('/api/proxy', createProxyMiddleware({
  target: process.env.VOLCES_API_URL || 'https://ark.cn-beijing.volces.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy': process.env.VOLCES_PATH || '/api/v3/chat/completions'
  },
  onProxyRes: function(proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  },
  // 增加超时设置为 120000 毫秒（2分钟）
  timeout: 120000,
  proxyTimeout: 120000
}));

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API 代理地址: http://localhost:${PORT}/api/proxy`);
});
