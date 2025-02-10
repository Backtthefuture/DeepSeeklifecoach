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
            .sort((a, b) => new Date(a.id) - new Date(b.id));

        const labels = recentConversations.map(c => 
            new Date(c.id).toLocaleDateString()
        );

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
