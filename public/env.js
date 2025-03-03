// 环境变量注入脚本
(function() {
  // 初始化默认值
  window.ENV_VOLCES_API_KEY = '';
  window.ENV_VOLCES_MODEL = 'deepseek-r1-250120';
  
  // 从服务器获取环境变量
  fetch('/api/env')
    .then(response => response.json())
    .then(data => {
      window.ENV_VOLCES_API_KEY = data.VOLCES_API_KEY || '';
      window.ENV_VOLCES_MODEL = data.VOLCES_MODEL || 'deepseek-r1-250120';
      console.log('环境变量已从服务器加载');
    })
    .catch(error => {
      console.error('加载环境变量失败:', error);
    });
})();
