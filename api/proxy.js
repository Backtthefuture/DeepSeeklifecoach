// Vercel Serverless Function for API proxy
const https = require('https');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理OPTIONS请求（预检请求）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从请求中获取数据
    const requestBody = req.body;
    const apiKey = req.headers.authorization?.split(' ')[1] || 'a411daf6-b1bf-49c3-a8a9-cdedf38b6173';

    // 配置请求选项
    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };

    // 创建请求
    const proxyRequest = https.request(options, (proxyRes) => {
      // 设置响应状态码
      res.status(proxyRes.statusCode);
      
      // 设置响应头
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });

      // 流式传输响应数据
      proxyRes.on('data', (chunk) => {
        res.write(chunk);
      });

      // 结束响应
      proxyRes.on('end', () => {
        res.end();
      });
    });

    // 处理请求错误
    proxyRequest.on('error', (error) => {
      console.error('代理请求错误:', error);
      res.status(500).json({ error: 'Proxy request failed', details: error.message });
    });

    // 发送请求体
    proxyRequest.write(JSON.stringify(requestBody));
    proxyRequest.end();
  } catch (error) {
    console.error('服务器错误:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
