// 数据存储管理
const Storage = {
    // 存储键名
    keys: {
        conversations: 'lifecoach_conversations',
        weeklyReports: 'lifecoach_weekly_reports'
    },

    // 初始化存储
    init() {
        if (!localStorage.getItem(this.keys.conversations)) {
            localStorage.setItem(this.keys.conversations, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.keys.weeklyReports)) {
            localStorage.setItem(this.keys.weeklyReports, JSON.stringify([]));
        }
    },

    // 保存新对话
    saveConversation(conversation) {
        const conversations = this.getConversations();
        conversations.push(conversation);
        localStorage.setItem(this.keys.conversations, JSON.stringify(conversations));
    },

    // 更新现有对话
    updateConversation(conversationId, updatedConversation) {
        const conversations = this.getConversations();
        const index = conversations.findIndex(c => c.id === conversationId);
        if (index !== -1) {
            conversations[index] = updatedConversation;
            localStorage.setItem(this.keys.conversations, JSON.stringify(conversations));
        }
    },

    // 获取所有对话
    getConversations() {
        return JSON.parse(localStorage.getItem(this.keys.conversations) || '[]');
    },

    // 获取单个对话
    getConversation(conversationId) {
        const conversations = this.getConversations();
        return conversations.find(c => c.id === conversationId);
    },

    // 获取单条消息
    getMessage(conversationId, messageIndex) {
        const conversation = this.getConversation(conversationId);
        return conversation.messages[messageIndex];
    },

    // 更新单条消息
    updateMessage(conversationId, messageIndex, updatedMessage) {
        const conversation = this.getConversation(conversationId);
        
        // 保存原始内容到编辑历史
        if (!updatedMessage.editHistory) {
            updatedMessage.editHistory = [];
        }
        updatedMessage.editHistory.push({
            content: conversation.messages[messageIndex].content,
            timestamp: new Date().toISOString()
        });

        // 更新消息
        conversation.messages[messageIndex] = updatedMessage;
        
        // 删除该消息之后的所有 AI 回复
        conversation.messages = conversation.messages.slice(0, messageIndex + 1);
        
        // 保存更新后的对话
        this.updateConversation(conversationId, conversation);
        
        return conversation;
    },

    // 删除对话
    deleteConversation(id) {
        try {
            // 获取当前对话列表
            let conversations = this.getConversations();
            
            // 找到要删除的对话索引
            const index = conversations.findIndex(c => c.id === id);
            if (index === -1) {
                throw new Error('对话不存在');
            }
            
            // 删除对话
            conversations.splice(index, 1);
            
            // 保存更新后的对话列表
            localStorage.setItem(this.keys.conversations, JSON.stringify(conversations));
            
            // 返回更新后的对话列表
            return conversations;
        } catch (error) {
            console.error('删除对话失败:', error);
            throw error;
        }
    },

    // 保存周报
    saveWeeklyReport(report) {
        const reports = this.getWeeklyReports();
        reports.push(report);
        localStorage.setItem(this.keys.weeklyReports, JSON.stringify(reports));
    },

    // 获取所有周报
    getWeeklyReports() {
        return JSON.parse(localStorage.getItem(this.keys.weeklyReports) || '[]');
    },

    // 获取最新的周报
    getLatestWeeklyReport() {
        const reports = this.getWeeklyReports();
        return reports[reports.length - 1];
    },

    // 导出所有数据
    exportData() {
        return {
            conversations: this.getConversations(),
            weeklyReports: this.getWeeklyReports(),
            exportDate: new Date().toISOString()
        };
    },

    // 清除所有数据
    clearAll() {
        localStorage.removeItem(this.keys.conversations);
        localStorage.removeItem(this.keys.weeklyReports);
        this.init();
    },

    // 数据迁移：确保所有对话数据格式正确
    migrateData() {
        try {
            const conversations = this.getConversations();
            const migratedConversations = conversations.map(conversation => {
                // 确保每条消息都有 timestamp
                conversation.messages = conversation.messages.map(message => {
                    if (!message.timestamp) {
                        // 如果没有 timestamp，使用 id 创建一个
                        const date = new Date(parseInt(conversation.id));
                        message.timestamp = date.toISOString();
                    }
                    return message;
                });
                return conversation;
            });
            
            // 保存迁移后的数据
            localStorage.setItem(this.keys.conversations, JSON.stringify(migratedConversations));
            console.log('数据迁移完成');
            return migratedConversations;
        } catch (error) {
            console.error('数据迁移失败:', error);
            throw error;
        }
    }
};

// 初始化存储
Storage.init();
