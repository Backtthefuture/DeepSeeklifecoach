// Serverless Function 用于处理API请求
const https = require('https');

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
    
    // 使用https模块直接发送请求并流式处理响应
    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      // 设置足够大的超时时间：120秒（2分钟）
      timeout: 120000
    };
    
    // 创建请求并直接流式传输响应
    const proxyReq = https.request(options, (proxyRes) => {
      // 设置状态码
      res.status(proxyRes.statusCode);
      
      // 设置响应头
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      
      // 直接流式传输响应
      proxyRes.pipe(res);
    });
    
    // 错误处理
    proxyReq.on('error', (error) => {
      console.error('代理请求错误:', error);
      res.status(500).json({ 
        error: '请求处理失败',
        details: error.message
      });
    });
    
    // 设置请求超时处理
    proxyReq.on('timeout', () => {
      console.warn('请求超时警告 - 但继续等待响应');
      // 注意：我们不终止请求，只记录警告
      // 如果需要在客户端显示超时警告，可以发送一个特殊的状态码
      // 但在这里我们选择继续等待，因为我们已经设置了很长的超时时间
    });
    
    // 显式设置请求超时
    proxyReq.setTimeout(120000, () => {
      console.warn('请求已达到120秒超时限制，但仍在等待响应');
      // 我们不终止请求，让它继续运行直到完成或失败
    });
    
    // 发送请求体
    proxyReq.write(JSON.stringify(requestBody));
    proxyReq.end();
    
    // 注意：这里不需要await，因为我们已经设置了流式处理
  } catch (error) {
    console.error('服务器错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误',
      details: error.message
    });
  }
};
