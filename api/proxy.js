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
  
  try {
    // 获取请求体
    const body = req.body;
    
    // 转发请求到火山方舟API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: JSON.stringify(body)
    });
    
    // 获取响应数据
    const data = await response.text();
    
    // 设置响应状态码
    res.status(response.status);
    
    // 返回响应数据
    return res.send(data);
  } catch (error) {
    console.error('API代理错误:', error);
    // 返回错误信息
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
