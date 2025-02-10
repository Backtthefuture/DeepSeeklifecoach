// 主应用逻辑
const App = {
    // 当前选中的情绪
    selectedEmotion: 'neutral',
    // 当前对话ID
    currentConversationId: null,

    // UI 状态常量
    UIState: {
        IDLE: 'idle',
        LOADING: 'loading',
        UPDATING: 'updating',
        ERROR: 'error'
    },

    // 当前 UI 状态
    currentUIState: 'idle',

    // 初始化应用
    init() {
        this.setupEventListeners();
        this.loadConversations();
        this.updateWeeklyInsight(); // 初始加载周报分析
    },

    // 设置事件监听
    setupEventListeners() {
        // 情绪选择按钮
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectEmotion(btn.dataset.emotion));
        });

        // 发送按钮
        document.getElementById('sendButton').addEventListener('click', async () => {
            await this.sendMessage();
            this.updateWeeklyInsight();
        });

        // 输入框回车发送
        document.getElementById('userInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 导出数据按钮
        document.getElementById('exportData').addEventListener('click', () => this.exportData());

        // 新建对话按钮
        document.getElementById('newChat').addEventListener('click', () => this.startNewChat());

        // 刷新分析按钮
        document.getElementById('refreshInsight').addEventListener('click', () => {
            this.updateWeeklyInsight();
        });
    },

    // 导出数据
    exportData() {
        const data = Storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifecoach-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // 选择情绪
    selectEmotion(emotion) {
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-emotion="${emotion}"]`).classList.add('selected');
        this.selectedEmotion = emotion;
    },

    // 加载对话历史
    loadConversations() {
        const conversations = Storage.getConversations();
        const conversationList = document.getElementById('conversationList');
        conversationList.innerHTML = '';

        conversations.forEach(conversation => {
            const div = document.createElement('div');
            div.className = 'conversation-item';
            div.innerHTML = `
                <div class="date">${new Date(conversation.id).toLocaleDateString()}</div>
                <div>${conversation.messages[0].content.substring(0, 50)}...</div>
            `;
            div.addEventListener('click', () => this.loadConversation(conversation.id));
            conversationList.appendChild(div);
        });

        // 更新情绪图表
        Charts.updateEmotionChart(conversations);
    },

    // 加载特定对话
    loadConversation(conversationId) {
        const conversation = Storage.getConversation(conversationId);
        if (!conversation) return;

        this.currentConversationId = conversationId;
        const container = document.getElementById('currentConversation');
        container.innerHTML = '';

        conversation.messages.forEach(message => {
            this.appendMessage(message);
        });

        // 滚动到底部
        container.scrollTop = container.scrollHeight;
    },

    // 发送消息
    async sendMessage() {
        const input = document.getElementById('userInput');
        const content = input.value.trim();
        if (!content) return;

        // 创建用户消息
        const userMessage = {
            type: 'user',
            content: content,
            emotion: this.selectedEmotion,
            timestamp: new Date().toISOString()
        };

        // 如果是新对话
        if (!this.currentConversationId) {
            const newConversation = {
                id: new Date().toISOString(),
                messages: [userMessage]
            };
            Storage.saveConversation(newConversation);
            this.currentConversationId = newConversation.id;
        } else {
            // 添加到现有对话
            const conversation = Storage.getConversation(this.currentConversationId);
            conversation.messages.push(userMessage);
            Storage.updateConversation(this.currentConversationId, conversation);
        }

        // 清空输入框并显示消息
        input.value = '';
        this.appendMessage(userMessage);

        // 显示思考状态
        const thinkingMessage = this.showThinkingMessage();

        try {
            // 获取AI响应
            const conversation = Storage.getConversation(this.currentConversationId);
            const aiResponse = await AI.sendMessage(content, conversation);

            // 移除思考状态
            this.removeThinkingMessage();

            // 创建AI消息
            const aiMessage = {
                type: 'assistant',
                content: aiResponse,
                timestamp: new Date().toISOString()
            };

            // 保存AI响应
            conversation.messages.push(aiMessage);
            Storage.updateConversation(this.currentConversationId, conversation);

            // 显示AI响应
            this.appendMessage(aiMessage);
        } catch (error) {
            // 移除思考状态
            this.removeThinkingMessage();

            // 显示错误消息
            const errorMessage = {
                type: 'assistant',
                content: '抱歉，我遇到了一些问题，请稍后再试。',
                timestamp: new Date().toISOString()
            };
            this.appendMessage(errorMessage);
            console.error('Error:', error);
        }

        // 更新对话列表和图表
        this.loadConversations();
    },

    // 新建对话
    startNewChat() {
        // 清空当前对话ID
        this.currentConversationId = null;

        // 清空对话显示区域
        document.getElementById('currentConversation').innerHTML = '';

        // 清空输入框
        document.getElementById('userInput').value = '';

        // 重置情绪选择
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector('[data-emotion="neutral"]').classList.add('selected');
        this.selectedEmotion = 'neutral';
    },

    // 添加消息到显示区域
    appendMessage(message) {
        const container = document.getElementById('currentConversation');
        const div = document.createElement('div');
        div.className = `message ${message.type}-message`;

        const header = document.createElement('div');
        header.className = 'message-header';
        header.innerHTML = `
            <span>${message.type === 'user' ? '你' : 'AI教练'}</span>
            <span>${new Date(message.timestamp).toLocaleTimeString()}</span>
            ${message.emotion ? `<span>情绪: ${message.emotion}</span>` : ''}
            ${message.type === 'user' ? '<span class="edit-icon">✎</span>' : ''}
        `;

        const content = document.createElement('div');
        content.className = 'message-content';
        const formattedContent = message.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
        content.innerHTML = formattedContent;

        div.appendChild(header);
        div.appendChild(content);
        container.appendChild(div);

        // 为用户消息添加编辑功能
        if (message.type === 'user') {
            const editIcon = header.querySelector('.edit-icon');
            const messageIndex = container.children.length - 1;
            editIcon.addEventListener('click', () => {
                this.enterEditMode(div, messageIndex);
            });
        }

        // 如果消息有编辑历史，添加已编辑标记
        if (message.editHistory && message.editHistory.length > 0) {
            div.classList.add('edited');
        }

        // 滚动到底部
        container.scrollTop = container.scrollHeight;
    },

    // 进入编辑模式
    enterEditMode(messageElement, messageIndex) {
        const content = messageElement.querySelector('.message-content');
        // 将 <br> 转换回换行符
        const originalText = content.innerHTML
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&');

        // 创建编辑框
        content.innerHTML = `
            <textarea class="edit-textarea">${originalText}</textarea>
            <div class="edit-buttons">
                <button class="save-btn">保存</button>
                <button class="cancel-btn">取消</button>
            </div>
        `;

        // 自动聚焦并选中文本
        const textarea = content.querySelector('.edit-textarea');
        textarea.focus();
        textarea.select();

        // 绑定保存和取消按钮事件
        this.bindEditButtons(messageElement, messageIndex, originalText);
    },

    // 绑定编辑按钮事件
    bindEditButtons(messageElement, messageIndex, originalText) {
        const content = messageElement.querySelector('.message-content');
        const textarea = content.querySelector('.edit-textarea');

        // 保存按钮
        content.querySelector('.save-btn').addEventListener('click', async () => {
            const newText = textarea.value.trim();
            if (newText === originalText) {
                this.exitEditMode(messageElement, originalText);
                return;
            }

            if (confirm('修改消息将会影响后续的对话内容，是否继续？')) {
                // 更新消息
                const updatedMessage = {
                    ...Storage.getMessage(this.currentConversationId, messageIndex),
                    content: newText,
                    lastEdited: new Date().toISOString()
                };

                // 保存到存储
                const updatedConversation = Storage.updateMessage(
                    this.currentConversationId,
                    messageIndex,
                    updatedMessage
                );

                // 更新界面
                this.exitEditMode(messageElement, newText);
                messageElement.classList.add('edited');

                // 删除界面上该消息后的所有消息
                const container = document.getElementById('currentConversation');
                const messages = Array.from(container.children);
                messages.slice(messageIndex + 1).forEach(msg => container.removeChild(msg));

                // 重新获取 AI 回复
                const aiResponse = await AI.sendMessage(newText, {
                    messages: updatedConversation.messages
                });

                // 添加新的 AI 回复
                const aiMessage = {
                    type: 'assistant',
                    content: aiResponse,
                    timestamp: new Date().toISOString()
                };
                updatedConversation.messages.push(aiMessage);
                Storage.updateConversation(
                    this.currentConversationId,
                    updatedConversation
                );

                // 显示新的 AI 回复
                this.appendMessage(aiMessage);
            }
        });

        // 取消按钮
        content.querySelector('.cancel-btn').addEventListener('click', () => {
            this.exitEditMode(messageElement, originalText);
        });
    },

    // 退出编辑模式
    exitEditMode(messageElement, text) {
        const content = messageElement.querySelector('.message-content');
        content.innerHTML = text.replace(/\n/g, '<br>');
    },

    // 添加思考状态消息
    showThinkingMessage() {
        const container = document.getElementById('currentConversation');
        const div = document.createElement('div');
        div.className = 'message assistant-message thinking-message';

        const header = document.createElement('div');
        header.className = 'message-header';
        header.innerHTML = `<span>AI教练</span>`;

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `思考中<span class="thinking-dots"></span>`;

        div.appendChild(header);
        div.appendChild(content);
        container.appendChild(div);

        // 滚动到底部
        container.scrollTop = container.scrollHeight;

        return div;
    },

    // 移除思考状态消息
    removeThinkingMessage() {
        const container = document.getElementById('currentConversation');
        const thinkingMessage = container.querySelector('.thinking-message');
        if (thinkingMessage) {
            container.removeChild(thinkingMessage);
        }
    },

    // 检查并生成周报
    async checkAndGenerateWeeklyReport() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hours = now.getHours();

        // 每周日晚上生成报告
        if (dayOfWeek === 0 && hours >= 20) {
            const lastReport = Storage.getLatestWeeklyReport();
            if (!lastReport || new Date(lastReport.date) < now.setHours(0, 0, 0, 0)) {
                const conversations = Storage.getConversations();
                const weeklyReport = await AI.generateWeeklyReport(conversations);

                Storage.saveWeeklyReport({
                    date: now.toISOString(),
                    content: weeklyReport
                });

                this.updateWeeklyReportDisplay();
            }
        }
    },

    // 更新周报显示
    updateWeeklyReportDisplay() {
        const report = Storage.getLatestWeeklyReport();
        if (report) {
            document.getElementById('weeklyReport').innerHTML = `
                <h3>生成时间：${new Date(report.date).toLocaleDateString()}</h3>
                <div class="report-content">${report.content}</div>
            `;
        }
    },

    // 获取本周对话
    getThisWeekConversations() {
        const conversations = Storage.getConversations();
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        monday.setHours(0, 0, 0, 0);

        return conversations.filter(c => new Date(c.id) >= monday);
    },

    // 格式化 Markdown 内容
    formatMarkdown(content) {
        if (!content) return '';

        return content
            // 处理标题
            .replace(/^### (.*)/gm, '<h3>$1</h3>')
            .replace(/^## (.*)/gm, '<h2>$2</h2>')
            .replace(/^# (.*)/gm, '<h1>$1</h1>')

            // 处理列表
            .replace(/^\d+\. (.*)/gm, '<li class="numbered">$1</li>')
            .replace(/^- (.*)/gm, '<li>$1</li>')
            .replace(/(<li.*>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`)

            // 处理强调
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            
            // 处理段落
            .replace(/^(?!<[hul])(.*$)/gm, '<p>$1</p>')
            
            // 处理换行
            .replace(/\n{2,}/g, '<br>');
    },

    // 更新分析部分
    updateInsightSection(elementId, content, defaultText) {
        const element = document.getElementById(elementId);
        if (!content || content.trim().length === 0) {
            element.innerHTML = `<div class="empty-message">${defaultText}</div>`;
            return;
        }

        element.innerHTML = this.formatMarkdown(content);
    },

    // 更新 UI 状态
    updateUIState(state, message = '') {
        this.currentUIState = state;
        const statusIndicators = {
            [this.UIState.IDLE]: '',
            [this.UIState.LOADING]: '<div class="loading">分析中...</div>',
            [this.UIState.UPDATING]: '<div class="loading">更新中...</div>',
            [this.UIState.ERROR]: `<div class="error-message">${message}</div>`
        };

        ['topicInsight', 'emotionInsight', 'keywordsInsight', 'aiInsight'].forEach(id => {
            const element = document.getElementById(id);
            if (element.innerHTML.includes('loading')) {
                element.innerHTML = statusIndicators[state] || '';
            }
        });

        // 更新刷新按钮状态
        const refreshBtn = document.getElementById('refreshInsight');
        if (refreshBtn) {
            refreshBtn.disabled = state === this.UIState.LOADING || state === this.UIState.UPDATING;
            refreshBtn.innerHTML = state === this.UIState.LOADING || state === this.UIState.UPDATING ? 
                '<i class="icon">🔄</i> 更新中...' : '<i class="icon">🔄</i> 刷新分析';
        }
    },

    // 编辑对话
    async editConversation(conversation) {
        try {
            // 保存编辑
            Storage.saveConversation(conversation);
            
            // 更新 UI 状态
            this.updateUIState(this.UIState.UPDATING);
            
            // 触发分析更新
            await this.updateWeeklyInsight();
            
            // 恢复空闲状态
            this.updateUIState(this.UIState.IDLE);
        } catch (error) {
            console.error('编辑对话时出错:', error);
            this.updateUIState(this.UIState.ERROR, '更新失败，请重试');
        }
    },

    // 更新周报分析
    async updateWeeklyInsight() {
        try {
            console.log('开始更新周报分析...');
            
            // 更新 UI 状态
            this.updateUIState(this.UIState.LOADING);

            // 获取本周对话
            const conversations = this.getThisWeekConversations();
            console.log('本周对话:', conversations);
            
            if (!conversations || conversations.length === 0) {
                console.log('本周没有对话记录');
                this.showNoDataMessage();
                this.updateUIState(this.UIState.IDLE);
                return;
            }

            // 获取分析结果
            const analysis = await AI.analyzeWeekInsight(conversations);
            console.log('收到AI分析结果:', analysis);

            if (!analysis) {
                throw new Error('未收到有效的分析结果');
            }

            // 解析分析结果
            const sections = AI.parseInsightResponse(analysis);
            console.log('解析后的分析结果:', sections);

            if (!sections) {
                throw new Error('解析分析结果失败');
            }

            // 更新各个部分
            const sectionConfig = {
                'topicInsight': ['topics', '暂无主题分析'],
                'emotionInsight': ['emotions', '暂无情绪分析'],
                'keywordsInsight': ['keywords', '暂无关键词'],
                'aiInsight': ['insights', '暂无AI洞察']
            };

            Object.entries(sectionConfig).forEach(([elementId, [sectionKey, defaultText]]) => {
                const content = sections[sectionKey];
                if (!content || content === '解析错误') {
                    document.getElementById(elementId).innerHTML = 
                        `<div class="error-message">${defaultText}</div>`;
                } else {
                    this.updateInsightSection(elementId, content, defaultText);
                }
            });

            // 更新最后更新时间
            document.getElementById('lastUpdateTime').textContent = 
                new Date().toLocaleString();

            // 恢复空闲状态
            this.updateUIState(this.UIState.IDLE);

        } catch (error) {
            console.error('更新周报分析错误:', error);
            this.updateUIState(this.UIState.ERROR, `更新失败: ${error.message}`);
        }
    },

    // 保存对话内容
    saveConversationContent(conversationId, content) {
        const conversation = Storage.getConversation(conversationId);
        if (conversation) {
            conversation.messages[0].content = content;
            Storage.saveConversation(conversation);
            
            // 触发分析更新
            this.editConversation(conversation);
        }
    },

    // 显示无数据消息
    showNoDataMessage() {
        const message = `
            <div style="text-align: center; color: #666; padding: 20px;">
                <p>本周还没有对话记录</p>
                <p>开始新的对话，分析将自动更新</p>
            </div>
        `;
        
        ['topicInsight', 'emotionInsight', 'keywordsInsight', 'aiInsight'].forEach(id => {
            document.getElementById(id).innerHTML = message;
        });
        
        document.getElementById('lastUpdateTime').textContent = new Date().toLocaleString();
    },

    // 显示错误消息
    showErrorMessage(error) {
        const message = `
            <div style="text-align: center; color: #dc3545; padding: 20px;">
                <p>分析更新失败</p>
                <p>${error}</p>
                <p>请稍后重试</p>
            </div>
        `;
        
        ['topicInsight', 'emotionInsight', 'keywordsInsight', 'aiInsight'].forEach(id => {
            document.getElementById(id).innerHTML = message;
        });
    },
};

// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', () => App.init());
