// 环境变量处理中间件
module.exports = (req, res) => {
  // 获取环境变量
  const envVars = {
    VOLCES_API_KEY: process.env.VOLCES_API_KEY || '',
    VOLCES_MODEL: process.env.VOLCES_MODEL || 'deepseek-r1-250120'
  };
  
  // 返回环境变量
  res.status(200).json(envVars);
};
