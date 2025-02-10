# DeepSeek R1 Life Coach - 你的AI生活思考助手

这是一个基于 DeepSeek R1 大模型的生活教练网页应用，帮助用户进行深度思考和情绪记录。

## 主要功能

### 1. 深度对话
- 支持与 AI 进行持续性对话
- 可以追加回复，深入探讨话题
- 自动保存所有对话历史

### 2. 情绪记录
- 支持5种基础情绪标记：
  - 😊 开心
  - 😔 低落
  - 😡 愤怒
  - 😨 焦虑
  - 😐 平静
- 情绪变化趋势可视化

### 3. 周报分析
- 自动生成每周总结报告
- 包含情绪变化趋势分析
- 提供 AI 洞察和建议

### 4. 数据存储
- 使用浏览器 LocalStorage 存储数据
- 支持数据导出备份

## 技术栈
- 前端：HTML5, CSS3, JavaScript
- AI模型：DeepSeek R1
- 数据存储：LocalStorage

## 项目结构
```
/
├── index.html          # 主页面
├── css/               # 样式文件
│   └── style.css      # 主样式表
├── js/                # JavaScript文件
│   ├── main.js        # 主逻辑
│   ├── storage.js     # 数据存储相关
│   ├── ai.js          # AI交互相关
│   └── charts.js      # 图表相关
└── README.md          # 项目说明
```
