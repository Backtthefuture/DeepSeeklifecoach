// 图表管理
const Charts = {
    // 情绪图表实例
    emotionChart: null,

    // 情绪映射
    emotionMap: {
        happy: { label: '开心', color: '#4CAF50' },
        sad: { label: '低落', color: '#2196F3' },
        angry: { label: '愤怒', color: '#F44336' },
        anxious: { label: '焦虑', color: '#FFC107' },
        neutral: { label: '平静', color: '#9E9E9E' }
    },

    // 格式化对话日期显示
    formatConversationDate(id) {
        try {
            let timestamp;
            // 处理不同长度的时间戳
            if (id.length >= 13) {
                // 毫秒级时间戳
                timestamp = parseInt(id);
            } else if (id.length >= 10) {
                // 秒级时间戳
                timestamp = parseInt(id) * 1000;
            } else {
                console.error('无效的时间戳格式:', id);
                return '无效日期';
            }

            const date = new Date(timestamp);
            
            // 检查日期是否有效且在合理范围内
            if (isNaN(date.getTime()) || date.getFullYear() < 2024 || date.getFullYear() > 2026) {
                console.error('日期超出有效范围:', date);
                return '无效日期';
            }
            
            // 格式化为中文友好的日期格式
            return date.toLocaleDateString('zh-CN', {
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            console.error('日期格式化错误:', error);
            return '无效日期';
        }
    },

    // 初始化情绪图表
    initEmotionChart() {
        const ctx = document.getElementById('emotionChart').getContext('2d');
        this.emotionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '情绪变化',
                    data: [],
                    borderColor: '#4CAF50',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            callback: function(value) {
                                const emotions = ['', '低落', '焦虑', '平静', '开心', ''];
                                return emotions[value] || '';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const emotions = ['低落', '焦虑', '平静', '开心'];
                                return `情绪: ${emotions[context.raw - 1]}`;
                            }
                        }
                    }
                }
            }
        });
    },

    // 更新情绪图表数据
    updateEmotionChart(conversations) {
        if (!this.emotionChart) {
            this.initEmotionChart();
        }

        // 获取最近7天的数据
        const recentConversations = conversations
            .slice(-7)
            .sort((a, b) => parseInt(a.id) - parseInt(b.id));

        const labels = recentConversations.map(c => this.formatConversationDate(c.id));

        const emotionValues = recentConversations.map(c => {
            const emotion = c.messages[0].emotion;
            switch(emotion) {
                case 'happy': return 4;
                case 'neutral': return 3;
                case 'anxious': return 2;
                case 'sad': return 1;
                default: return 3;
            }
        });

        this.emotionChart.data.labels = labels;
        this.emotionChart.data.datasets[0].data = emotionValues;
        this.emotionChart.update();
    },

    // 生成情绪分布饼图数据
    generateEmotionDistribution(conversations) {
        const distribution = {
            happy: 0,
            sad: 0,
            angry: 0,
            anxious: 0,
            neutral: 0
        };

        conversations.forEach(conversation => {
            const emotion = conversation.messages[0].emotion;
            if (distribution.hasOwnProperty(emotion)) {
                distribution[emotion]++;
            }
        });

        return {
            labels: Object.keys(distribution).map(key => this.emotionMap[key].label),
            data: Object.values(distribution),
            colors: Object.keys(distribution).map(key => this.emotionMap[key].color)
        };
    }
};
