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
        this.loadConversations();
        this.setupEventListeners();
        // 移除初始加载周报分析
        // this.updateWeeklyInsight();
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
        document.getElementById('newChat').addEventListener('click', () => {
            this.startNewChat();
            // 移除自动更新分析
            // this.updateWeeklyInsight();
        });

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
        // 渲染对话列表
        this.renderConversationList();
        
        // 更新情绪图表
        const conversations = Storage.getConversations();
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
                id: Date.now().toString(), // 使用时间戳作为ID
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
            
            // 创建AI消息元素
            const aiMessage = {
                type: 'assistant',
                content: '',
                timestamp: new Date().toISOString()
            };
            this.appendMessage(aiMessage);
            const messageElement = document.querySelector('#currentConversation .message:last-child .message-content');
            
            // 确保 AI 消息内容区域有 markdown 类
            messageElement.classList.add('markdown');
            
            // 移除思考状态
            this.removeThinkingMessage();
            
            // 使用流式输出
            const aiResponse = await AI.sendMessage(content, conversation, (chunk) => {
                aiMessage.content += chunk;
                messageElement.innerHTML = this.formatMarkdown(aiMessage.content);
            });
            
            // 保存完整的AI响应
            conversation.messages.push(aiMessage);
            Storage.updateConversation(this.currentConversationId, conversation);
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
        div.className = `message ${message.type === 'user' ? 'user' : 'ai'}`;

        // 创建消息内容
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // 根据消息类型处理内容
        if (message.type === 'assistant') {
            // 对 AI 消息应用 Markdown 格式化
            content.className += ' markdown';
            content.innerHTML = this.formatMarkdown(message.content);
        } else {
            // 用户消息只进行基本的转义和换行处理
            const formattedContent = message.content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/\n/g, '<br>');
            content.innerHTML = formattedContent;
        }
        
        // 添加时间和情绪标签
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        
        let timeText = new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        if (message.emotion && message.type === 'user') {
            const emotionIcons = {
                'happy': '😊',
                'sad': '😔',
                'angry': '😡',
                'anxious': '😨',
                'neutral': '😐'
            };
            const emotionIcon = emotionIcons[message.emotion] || '';
            timeText += ` · ${emotionIcon} ${message.emotion}`;
        }
        
        timeElement.textContent = timeText;
        
        // 添加编辑按钮（仅用户消息）
        if (message.type === 'user') {
            const editButton = document.createElement('button');
            editButton.className = 'edit-button';
            editButton.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            timeElement.appendChild(editButton);
        }
        
        div.appendChild(content);
        div.appendChild(timeElement);
        container.appendChild(div);

        // 为用户消息添加编辑功能
        if (message.type === 'user') {
            const editIcon = timeElement.querySelector('.edit-button');
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
        div.className = 'thinking';

        div.innerHTML = `
            <div class="avatar">AI</div>
            <div class="dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        
        container.appendChild(div);

        // 滚动到底部
        container.scrollTop = container.scrollHeight;

        return div;
    },

    // 移除思考状态消息
    removeThinkingMessage() {
        const container = document.getElementById('currentConversation');
        const thinkingMessage = container.querySelector('.thinking');
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

        return conversations.filter(c => {
            // 确保正确解析时间戳
            const timestamp = parseInt(c.id);
            if (isNaN(timestamp)) {
                console.error('无效的对话ID:', c.id);
                return false;
            }
            const convDate = new Date(timestamp);
            console.log('对话日期:', convDate, '本周一:', monday, '是否本周:', convDate >= monday);
            return convDate >= monday;
        });
    },

    // 格式化 Markdown 内容
    formatMarkdown(content) {
        if (!content) return '';

        return content
            // 处理水平分割线
            .replace(/^---+$/gm, '<hr>')
            
            // 处理标题
            .replace(/^### (.*)/gm, '<h3>$1</h3>')
            .replace(/^## (.*)/gm, '<h2>$1</h2>')
            .replace(/^# (.*)/gm, '<h1>$1</h1>')

            // 处理引用块
            .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')
            
            // 处理有序列表
            .replace(/^\d+\.\s+(.*)/gm, '<li class="numbered">$1</li>')
            
            // 处理无序列表（支持多种符号）
            .replace(/^[\*\-•]\s+(.*)/gm, '<li>$1</li>')
            
            // 将连续的列表项包装在 ul 或 ol 中
            .replace(/(<li class="numbered">.*<\/li>\n?)+/g, match => `<ol>${match}</ol>`)
            .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`)

            // 处理代码块
            .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
            
            // 处理行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            
            // 处理强调和加粗
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            
            // 处理删除线
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            
            // 处理链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            
            // 处理段落（不转换已有的HTML标签）
            .replace(/^(?!<[hbuloiapce])(.*$)/gm, '<p>$1</p>')
            
            // 处理换行
            .replace(/\n{2,}/g, '<br>');
    },

    // 格式化日期显示
    formatDate(timestamp) {
        // 尝试解析时间戳或ISO字符串
        let date;
        if (/^\d+$/.test(timestamp)) {
            // 如果是纯数字（时间戳），直接解析
            date = new Date(parseInt(timestamp));
        } else {
            // 如果是ISO字符串，直接创建Date对象
            date = new Date(timestamp);
        }
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
            return '未知日期';
        }
        
        // 使用更友好的日期格式
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const isThisYear = date.getFullYear() === today.getFullYear();
        
        if (isToday) {
            return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else if (isThisYear) {
            return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) + ' ' + 
                   date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
        }
    },

    // 更新分析部分
    updateInsightSection(elementId, content, defaultText) {
        const element = document.getElementById(elementId);
        if (!element) return; // 如果元素不存在，直接返回
        
        if (!content || content.trim().length === 0) {
            element.innerHTML = `<div class="empty-state">${defaultText}</div>`;
            return;
        }
        
        // 添加 markdown 类并使用 formatMarkdown 处理内容
        element.className = 'card-content markdown';
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

        // 更新各个分析面板的状态
        ['emotionInsight', 'aiInsight'].forEach(id => {
            const element = document.getElementById(id);
            if (!element) return; // 如果元素不存在，跳过

            switch (state) {
                case 'loading':
                    element.innerHTML = `<div class="loading-spinner"></div>`;
                    break;
                case 'error':
                    element.innerHTML = `<div class="error-message">${message}</div>`;
                    break;
                case 'empty':
                    element.innerHTML = `<div class="empty-state">暂无数据</div>`;
                    break;
                case 'ready':
                    // ready状态不做特殊处理，由各自的更新函数处理
                    break;
            }
        });

        // 更新刷新按钮状态
        const refreshBtn = document.getElementById('refreshInsight');
        if (refreshBtn) {
            refreshBtn.disabled = state === this.UIState.LOADING || state === this.UIState.UPDATING;
            refreshBtn.innerHTML = (state === this.UIState.LOADING || state === this.UIState.UPDATING) ? 
                '<i class="icon">🔄</i> 分析中...' : '<i class="icon">🔄</i> 开始分析';
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
            console.log('开始更新对话分析...');
            
            // 更新 UI 状态
            this.updateUIState(this.UIState.LOADING);

            // 获取所有对话
            const conversations = Storage.getConversations();
            console.log('所有对话:', conversations);
            
            if (!conversations || conversations.length === 0) {
                console.log('没有对话记录');
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
                'emotionInsight': ['emotions', '暂无情绪分析'],
                'aiInsight': ['insights', '暂无AI洞察']
            };

            Object.entries(sectionConfig).forEach(([elementId, [sectionKey, defaultText]]) => {
                const element = document.getElementById(elementId);
                if (!element) return; // 如果元素不存在，跳过
                
                const content = sections[sectionKey];
                if (!content || content === '解析错误') {
                    element.innerHTML = `<div class="error-message">${defaultText}</div>`;
                } else {
                    this.updateInsightSection(elementId, content, defaultText);
                }
            });

            // 更新情绪图表
            this.updateEmotionChart(sections.emotions);

            // 更新最后更新时间
            const lastUpdateTime = document.getElementById('lastUpdateTime');
            if (lastUpdateTime) {
                const now = new Date();
                lastUpdateTime.textContent = now.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

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
            <div class="empty-state">
                <p>没有对话记录</p>
                <p>开始新的对话，分析将自动更新</p>
            </div>
        `;
        
        // 更新分析面板
        ['emotionInsight', 'aiInsight'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = message;
            }
        });
        
        // 更新情绪图表，显示空状态
        try {
            const emotionChartCanvas = document.getElementById('emotionChart');
            if (!emotionChartCanvas) return;
            
            // 确保销毁所有已存在的图表实例
            if (window.chartInstances && window.chartInstances.emotionChart) {
                window.chartInstances.emotionChart.destroy();
                window.chartInstances.emotionChart = null;
            }
            
            const ctx = emotionChartCanvas.getContext('2d');
            
            // 创建空的图表
            const newChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '情绪变化',
                        data: [],
                        borderColor: '#ccc',
                        backgroundColor: 'rgba(200, 200, 200, 0.1)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            
            // 保存图表实例到全局对象
            if (!window.chartInstances) window.chartInstances = {};
            window.chartInstances.emotionChart = newChart;
            
            // 更新最后更新时间
            const lastUpdateTime = document.getElementById('lastUpdateTime');
            if (lastUpdateTime) {
                lastUpdateTime.textContent = '-';
            }
        } catch (error) {
            console.error('创建空图表失败:', error);
        }
    },

    // 显示错误消息
    showErrorMessage(error) {
        const message = `
            <div class="empty-state error">
                <p>分析更新失败</p>
                <p>${error}</p>
                <p>请稍后重试</p>
            </div>
        `;
        
        // 更新分析面板
        ['emotionInsight', 'aiInsight'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = message;
            }
        });
        
        // 更新情绪图表，显示错误状态
        try {
            const emotionChartCanvas = document.getElementById('emotionChart');
            if (!emotionChartCanvas) return;
            
            // 确保销毁所有已存在的图表实例
            if (window.chartInstances && window.chartInstances.emotionChart) {
                window.chartInstances.emotionChart.destroy();
                window.chartInstances.emotionChart = null;
            }
            
            const ctx = emotionChartCanvas.getContext('2d');
            
            // 创建错误状态图表
            const newChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['错误'],
                    datasets: [{
                        label: '情绪变化',
                        data: [50],
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            
            // 保存图表实例到全局对象
            if (!window.chartInstances) window.chartInstances = {};
            window.chartInstances.emotionChart = newChart;
            
            // 更新最后更新时间
            const lastUpdateTime = document.getElementById('lastUpdateTime');
            if (lastUpdateTime) {
                lastUpdateTime.textContent = '更新失败';
            }
        } catch (error) {
            console.error('创建错误图表失败:', error);
        }
    },

    // 删除对话
    async deleteConversation(id) {
        try {
            // 删除对话
            const conversations = Storage.deleteConversation(id);
            
            // 如果删除的是当前对话，清空对话内容并重置当前对话ID
            if (id === this.currentConversationId) {
                this.currentConversationId = null;
                document.getElementById('currentConversation').innerHTML = '';
                
                // 如果还有其他对话，选择第一个
                if (conversations.length > 0) {
                    this.loadConversation(conversations[0].id);
                }
            }
            
            // 更新对话列表
            this.renderConversationList();
            
            // 更新周报分析
            await this.updateWeeklyInsight();
            
            this.showToast('对话已删除');
            
        } catch (error) {
            console.error('删除对话失败:', error);
            this.showToast('删除失败，请重试');
        }
    },

    // 渲染对话列表
    renderConversationList() {
        const conversations = Storage.getConversations();
        const listHtml = conversations.map(conv => {
            const date = this.formatDate(conv.id);
            const preview = conv.messages[0]?.content.substring(0, 30) + '...' || '';
            const activeClass = conv.id === this.currentConversationId ? 'active' : '';
            
            return `
                <div class="conversation-item ${activeClass}" data-id="${conv.id}">
                    <div class="conversation-title">${date}</div>
                    <div class="conversation-preview">${preview}</div>
                    <div class="conversation-actions">
                        <svg class="delete-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
            `;
        }).join('');
        
        document.getElementById('conversationList').innerHTML = listHtml || `
            <div class="empty-state">
                <p>没有历史对话</p>
                <p>点击"新对话"按钮开始聊天</p>
            </div>
        `;
        
        // 添加事件监听
        document.querySelectorAll('.conversation-item').forEach(item => {
            const id = item.dataset.id;
            
            // 对话点击事件
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-icon')) {
                    this.loadConversation(id);
                }
            });
            
            // 删除图标点击事件
            const deleteIcon = item.querySelector('.delete-icon');
            if (deleteIcon) {
                deleteIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showDeleteConfirm(id);
                });
            }
        });
    },

    // 显示删除确认对话框
    showDeleteConfirm(id) {
        // 使用已有的删除确认弹窗
        const deleteModal = document.getElementById('deleteModal');
        const confirmDeleteBtn = document.getElementById('confirmDelete');
        const cancelDeleteBtn = document.getElementById('cancelDelete');
        
        // 移除之前可能存在的事件监听器
        const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
        const newCancelBtn = cancelDeleteBtn.cloneNode(true);
        
        confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);
        cancelDeleteBtn.parentNode.replaceChild(newCancelBtn, cancelDeleteBtn);
        
        // 添加新的事件监听器
        newConfirmBtn.addEventListener('click', async () => {
            // 先关闭弹窗
            Modal.closeModal('deleteModal');
            // 然后异步删除对话
            await this.deleteConversation(id);
        });
        
        newCancelBtn.addEventListener('click', () => {
            Modal.closeModal('deleteModal');
        });
        
        // 显示弹窗
        Modal.openModal('deleteModal');
    },

    // 显示提示消息
    showToast(message, duration = 2000) {
        // 移除已存在的toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 添加淡入效果
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });
        
        // 定时移除
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // 更新情绪图表
    updateEmotionChart(emotionsData) {
        try {
            const emotionChartCanvas = document.getElementById('emotionChart');
            if (!emotionChartCanvas) return;
            
            // 确保销毁所有已存在的图表实例
            if (window.chartInstances && window.chartInstances.emotionChart) {
                window.chartInstances.emotionChart.destroy();
                window.chartInstances.emotionChart = null;
            }
            
            const ctx = emotionChartCanvas.getContext('2d');
            
            // 解析情绪数据
            let labels = [];
            let data = [];
            
            // 尝试解析情绪数据
            if (typeof emotionsData === 'string' && emotionsData.trim() !== '') {
                // 假设数据格式是：日期1: 值1, 日期2: 值2, ...
                const pairs = emotionsData.split(',').map(pair => pair.trim());
                
                pairs.forEach(pair => {
                    const [date, value] = pair.split(':').map(item => item.trim());
                    if (date && value) {
                        labels.push(date);
                        // 将情绪值转换为0-100的数值
                        const numValue = parseFloat(value);
                        data.push(isNaN(numValue) ? 50 : numValue);
                    }
                });
            }
            
            // 如果没有数据，使用默认值
            if (labels.length === 0) {
                const today = new Date();
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    labels.push(date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }));
                    data.push(50); // 默认中性情绪值
                }
            }
            
            // 创建图表
            const newChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '情绪变化',
                        data: data,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    if (value === 0) return '低落';
                                    if (value === 50) return '平静';
                                    if (value === 100) return '开心';
                                    return '';
                                }
                            }
                        }
                    }
                }
            });
            
            // 保存图表实例到全局对象
            if (!window.chartInstances) window.chartInstances = {};
            window.chartInstances.emotionChart = newChart;
            
        } catch (error) {
            console.error('更新情绪图表错误:', error);
            // 创建一个空图表，确保之前的实例被销毁
            try {
                const emotionChartCanvas = document.getElementById('emotionChart');
                if (!emotionChartCanvas) return;
                
                // 确保销毁所有已存在的图表实例
                if (window.chartInstances && window.chartInstances.emotionChart) {
                    window.chartInstances.emotionChart.destroy();
                    window.chartInstances.emotionChart = null;
                }
                
                const ctx = emotionChartCanvas.getContext('2d');
                
                const newChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: '情绪变化',
                            data: [],
                            borderColor: '#ccc',
                            backgroundColor: 'rgba(200, 200, 200, 0.1)',
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
                
                // 保存图表实例到全局对象
                if (!window.chartInstances) window.chartInstances = {};
                window.chartInstances.emotionChart = newChart;
            } catch (innerError) {
                console.error('创建空图表失败:', innerError);
            }
        }
    },
};

// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，开始初始化...');
    App.init();
    console.log('应用初始化完成');
});
