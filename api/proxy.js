// Serverless 函数：API代理
const https = require('https');
const url = require('url');

// 默认API密钥（推荐使用环境变量）
const DEFAULT_API_KEY = 'a411daf6-b1bf-49c3-a8a9-cdedf38b6173';

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 处理OPTIONS请求（预检请求）
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  try {
    // 获取请求体
    const body = req.body;
    
    // 构建请求选项
    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY || DEFAULT_API_KEY}`
      },
      timeout: 120000 // 120秒超时
    };

    // 发送请求到DeepSeek API
    const apiRequest = https.request(options, (apiRes) => {
      // 设置响应头
      res.statusCode = apiRes.statusCode;
      Object.keys(apiRes.headers).forEach(key => {
        res.setHeader(key, apiRes.headers[key]);
      });

      // 处理流式响应
      if (body.stream) {
        apiRes.pipe(res);
      } else {
        // 处理非流式响应
        let data = '';
        apiRes.on('data', (chunk) => {
          data += chunk;
        });
        apiRes.on('end', () => {
          try {
            // 尝试解析JSON响应
            const jsonData = JSON.parse(data);
            res.json(jsonData);
          } catch (e) {
            // 如果不是有效的JSON，直接返回原始数据
            res.send(data);
          }
        });
      }
    });

    // 错误处理
    apiRequest.on('error', (error) => {
      console.error('API请求错误:', error);
      res.status(500).json({ error: `API请求失败: ${error.message}` });
    });

    // 设置请求超时
    apiRequest.on('timeout', () => {
      apiRequest.destroy();
      res.status(504).json({ error: 'API请求超时' });
    });

    // 写入请求体
    apiRequest.write(JSON.stringify(body));
    apiRequest.end();

  } catch (error) {
    console.error('处理请求错误:', error);
    res.status(500).json({ error: `服务器错误: ${error.message}` });
  }
};
