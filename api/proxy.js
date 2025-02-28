// Serverless Function 用于处理API请求
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理预检请求
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

    // 使用node-fetch发送请求，不使用AbortController（可能不兼容）
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      // 使用timeout选项代替AbortController
      timeout: 8000
    });
    
    // 获取响应数据
    const data = await response.text();
    
    // 设置响应状态码
    res.status(response.status);
    
    // 返回响应数据
    return res.send(data);
  } catch (error) {
    console.error('API代理错误:', error);
    
    // 区分超时错误和其他错误
    if (error.type === 'request-timeout') {
      return res.status(504).json({ 
        error: '请求超时，请稍后再试',
        details: '火山方舟API响应时间过长'
      });
    }
    
    // 返回错误信息
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
