// AI 交互管理
const AI = {
    // 硅基流动 API 配置
    config: {
        endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
        apiKey: 'sk-hulbdhzsumzmgdbpvatqddgckvluborenwaqsmlivayzagop',
        model: 'Pro/deepseek-ai/DeepSeek-R1'
    },

    // 生成系统提示词
    generateSystemPrompt(conversation) {
        return `你是一位专业的生活教练，擅长倾听、共情和提供建议。
当前对话主题：${conversation.topic || '未指定'}
用户情绪状态：${conversation.messages[conversation.messages.length - 1].emotion}
请基于用户的输入和历史记录，提供温暖、专业的回应。并适当提出问题，引导用户思考`;
    },

    // 发送消息到硅基流动 API
    async sendMessage(message, conversation) {
        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [
                        {
                            role: 'system',
                            content: this.generateSystemPrompt(conversation)
                        },
                        ...conversation.messages.map(msg => ({
                            role: msg.type === 'user' ? 'user' : 'assistant',
                            content: msg.content
                        }))
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error('API 请求失败');
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI 响应错误:', error);
            return '抱歉，我现在无法回应，请稍后再试。';
        }
    },

    // 分析情绪
    analyzeEmotion(text) {
        // 这里可以实现更复杂的情绪分析逻辑
        const emotions = {
            happy: ['开心', '快乐', '高兴', '喜悦', '兴奋'],
            sad: ['难过', '伤心', '痛苦', '失落', '悲伤'],
            angry: ['生气', '愤怒', '恼火', '烦躁', '不满'],
            anxious: ['焦虑', '担心', '紧张', '不安', '害怕'],
            neutral: ['平静', '普通', '一般', '正常']
        };

        // 简单的关键词匹配
        for (let [emotion, keywords] of Object.entries(emotions)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return emotion;
            }
        }
        return 'neutral';
    },

    // 生成周报
    async generateWeeklyReport(conversations) {
        try {
            const weeklyPrompt = `请根据以下对话记录生成本周总结报告：
${conversations.map(c => `
日期：${new Date(c.id).toLocaleDateString()}
情绪：${c.messages[0].emotion}
内容：${c.messages[0].content}
`).join('\n')}

请包含以下内容：
1. 本周情绪趋势分析
2. 主要话题概述
3. 建议和洞察
`;

            const response = await this.sendMessage(weeklyPrompt, { messages: [] });
            return response;
        } catch (error) {
            console.error('生成周报错误:', error);
            return '无法生成本周报告，请稍后再试。';
        }
    }
};
