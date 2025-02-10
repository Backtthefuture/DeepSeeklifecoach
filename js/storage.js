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
    }
};

// 初始化存储
Storage.init();
