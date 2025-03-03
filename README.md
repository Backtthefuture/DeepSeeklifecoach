# DeepSeek 生活教练 v0.5.1

基于 DeepSeek 大语言模型的生活教练应用，帮助你进行生活规划、情感疏导和个人成长。

## 功能特点

- 🤖 智能对话：基于 DeepSeek 模型的智能对话系统
- 😊 情绪识别：支持多种情绪状态的识别和回应
- 📊 对话分析：手动分析所有对话内容，生成洞察报告
- 📝 历史记录：保存所有对话记录，方便回顾
- 🔄 数据导出：支持导出所有对话数据
- ❌ 删除对话：支持删除不需要的对话记录
- 👥 社群互动：加入用户社群，分享使用心得
- ✨ Markdown 支持：AI 回复支持 Markdown 格式，显示更美观

## 最新更新

### v0.5.2 (2025-03-03)
- 🚀 优化 API 请求处理，增加超时时间至 120 秒
- 🔧 改进 Vercel 部署配置，支持长时间运行的 Serverless 函数
- 🔒 增强 API 密钥管理，支持通过环境变量配置
- 📝 更新部署文档，添加环境变量设置说明

### v0.5.1 (2025-02-27)
- 🔄 优化删除对话体验，点击删除按钮后立即关闭弹窗
- 🚀 提升用户界面响应速度，改善整体交互体验

### v0.5.0 (2025-02-27)
- 🚀 优化Vercel部署配置，修复API请求404错误
- 🔌 配置API代理，实现与火山方舟API的稳定连接
- 🔒 添加CORS头信息，确保跨域请求正常工作
- 📝 更新文档和版本号

### v0.4.0 (2025-02-27)
- 🚀 优化服务器配置，提升应用稳定性
- 🔧 调整AI模型temperature参数至0.6，提高回复一致性
- 📚 完善本地开发环境文档，添加服务器启动说明
- 📝 更新文档和版本号

### v0.3.2 (2025-02-26)
- ✨ 添加 Markdown 格式支持，美化 AI 回复显示效果
- 🎨 优化引用、列表、标题等样式，提升阅读体验
- 🔧 改进代码结构，提高可维护性
- 📝 更新文档和版本号

### v0.3.1 (2025-02-26)
- 🔄 优化对话分析功能：改为手动触发，分析所有对话
- 🎨 更新界面文字，提升用户体验
- 📝 更新文档和版本号

### v0.3.0 (2025-02-13)
- ✨ 新增社群功能
- 🎨 优化用户界面体验
- 🔗 添加社群二维码和链接
- 📝 更新文档和版本号

### v0.2.3 (2025-02-12)
- 🚀 优化流式输出体验
- 🎯 调整temperature参数，提升回复质量
- 📝 更新文档和版本号

### v0.2.2 (2025-02-11)
- ✅ 验证时间戳修复的正确性
- 🔄 完成全面测试和功能确认
- 📝 更新文档和注释

### v0.2.1 (2025-02-11)
- 🐛 修复情绪图表日期显示问题
- ✨ 优化时间戳处理机制
- 🔧 统一使用10位秒级时间戳
- 📊 增强日期格式化的错误处理

### v0.2.0 (2025-02-10)
- ✨ 新增删除对话功能
- 🎨 优化日期显示格式
- 🐛 修复周报分析中的时间戳解析问题
- 🚀 成功部署到 Vercel 平台

### v0.1.6 (2025-02-09)
- 📦 添加 Vercel 部署支持
- 📝 更新部署文档

## 使用说明

1. 打开应用后，可以直接开始新对话
2. 选择当前的情绪状态（可选）
3. 输入你想说的话，按回车或点击发送
4. 查看 AI 助手的回应
5. 可以点击"刷新分析"查看本周对话的分析报告
6. 需要时可以导出所有对话数据
7. 不需要的对话可以通过删除按钮移除

## 本地开发环境设置

### 安装依赖

在项目根目录下运行以下命令安装所需依赖：

```bash
npm install
```

### 启动本地服务器

在项目根目录下运行以下命令启动本地服务器：

```bash
npm start
```

启动成功后，你将看到以下输出：
```
服务器运行在 http://localhost:3000
API 代理地址: http://localhost:3000/api/proxy
```

现在你可以在浏览器中访问 [http://localhost:3000](http://localhost:3000) 来使用应用。

### 停止服务器

在终端中按下 `Ctrl + C` 组合键可以停止服务器。

## 技术实现

- 前端：HTML5, CSS3, JavaScript
- AI 模型：DeepSeek-R1
- 数据存储：localStorage
- 部署平台：Vercel

## 部署说明

### Vercel 部署步骤

1. Fork 本项目到你的 GitHub 账号
2. 在 Vercel 中导入该项目
3. 配置以下环境变量（可选）：
   - `VOLCES_API_KEY`: 火山方舟 API 密钥（如不设置将使用默认密钥）
   - `VOLCES_MODEL`: DeepSeek 模型名称，默认为 'deepseek-r1-250120'。
   - `VOLCES_HOSTNAME`: 火山方舟 API 主机名，默认为 'ark.cn-beijing.volces.com'。
   - `VOLCES_PATH`: 火山方舟 API 路径，默认为 '/api/v3/chat/completions'。
   - `VOLCES_API_URL`: 完整的火山方舟 API URL，默认为 'https://ark.cn-beijing.volces.com'。
4. 点击部署按钮
5. 部署完成后即可使用

### 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| VOLCES_API_KEY | 否 | 火山方舟 API 密钥，用于访问 DeepSeek 模型。如不设置，将使用代码中的默认密钥。 |
| VOLCES_MODEL | 否 | DeepSeek 模型名称，默认为 'deepseek-r1-250120'。 |
| VOLCES_HOSTNAME | 否 | 火山方舟 API 主机名，默认为 'ark.cn-beijing.volces.com'。 |
| VOLCES_PATH | 否 | 火山方舟 API 路径，默认为 '/api/v3/chat/completions'。 |
| VOLCES_API_URL | 否 | 完整的火山方舟 API URL，默认为 'https://ark.cn-beijing.volces.com'。 |

### Vercel 环境变量设置步骤

1. 登录 Vercel 控制台，进入你的项目
2. 点击 "Settings" 选项卡
3. 在左侧菜单中选择 "Environment Variables"
4. 添加上述环境变量（至少需要设置 `VOLCES_API_KEY`）
5. 点击 "Save" 保存设置
6. 重新部署你的项目以应用新的环境变量

### 超时配置说明

本项目已在 `vercel.json` 中配置了 Serverless 函数的最大运行时间为 120 秒，以处理复杂的 AI 请求。这个配置适用于 Vercel 的付费计划。如果你使用的是免费计划，可能需要调整此值，因为免费计划的函数执行时间限制为 10 秒。

对于免费计划，你可以：
1. 将 `vercel.json` 中的 `maxDuration` 值改为 10（秒）
2. 或者考虑升级到付费计划以获得更长的执行时间

## 注意事项

- 所有数据都存储在浏览器本地，清除浏览器数据会导致对话历史丢失
- 时间戳格式统一使用10位秒级时间戳，确保日期显示的准确性
- 对于复杂的 AI 请求（如分析长文本或生成周报），响应时间可能较长，请耐心等待

## 开发计划

- [ ] 添加数据备份功能
- [ ] 支持更多情绪类型
- [ ] 优化移动端体验
- [ ] 添加主题切换功能

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目！

## 许可证

MIT License