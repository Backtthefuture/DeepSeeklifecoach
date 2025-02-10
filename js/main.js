// 主应用逻辑
const App = {
    // 当前选中的情绪
    selectedEmotion: 'neutral',
    // 当前对话ID
    currentConversationId: null,

    // 初始化应用
    init() {
        this.bindEvents();
        this.loadConversations();
        Charts.initEmotionChart();
        this.checkAndGenerateWeeklyReport();
    },

    // 绑定事件
    bindEvents() {
        // 情绪选择按钮
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectEmotion(btn.dataset.emotion));
        });

        // 发送按钮
        document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());

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

        // 获取AI响应
        const conversation = Storage.getConversation(this.currentConversationId);
        const aiResponse = await AI.sendMessage(content, conversation);
        
        // 创建AI消息
        const aiMessage = {
            type: 'ai',
            content: aiResponse,
            timestamp: new Date().toISOString()
        };

        // 保存AI响应
        conversation.messages.push(aiMessage);
        Storage.updateConversation(this.currentConversationId, conversation);
        
        // 显示AI响应
        this.appendMessage(aiMessage);

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
        `;

        const content = document.createElement('div');
        content.className = 'message-content';
        // 将换行符转换为 HTML 换行标签，同时进行 HTML 转义
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

        // 滚动到底部
        container.scrollTop = container.scrollHeight;
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
    }
};

// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', () => App.init());
