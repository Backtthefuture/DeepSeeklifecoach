// 系统提示词
const systemPrompt = {
    role: "system",
    content: `你是一位拥有20年丰富经验的生活教练。你的任务是帮助用户解决生活中的各种问题，包括但不限于：
    - 个人成长和发展
    - 时间管理和目标设定
    - 人际关系和沟通技巧
    - 压力管理和情绪调节
    - 职业规划和发展
    - 健康生活方式的建立

    请记住：
    1. 始终保持专业、耐心和同理心
    2. 提供具体、可行的建议
    3. 鼓励用户独立思考和行动
    4. 保持对话的连贯性和上下文理解
    5. 适时使用提问来引导用户深入思考

    用简单易懂的语言与用户交流，避免使用专业术语。`
};

// 保存对话历史
let messageHistory = [systemPrompt];

// AI 交互管理
const AI = {
    // 火山方舟 API 配置
    config: {
        endpoint: 'Deepseek-r1', // 火山方舟 DeepSeek-R1 模型 endpoint
        apiKey: '23aeb5da-793c-4eda-a122-8eec47a001dd',
    },

    // 创建流式请求
    async *createStreamRequest(messages) {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ messages })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.choices?.[0]?.delta?.content) {
                                    yield data.choices[0].delta.content;
                                }
                            } catch (error) {
                                console.warn('解析消息时出错:', error);
                            }
                        }
                    }
                }
                return;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    throw new Error(`请求失败，已重试 ${maxRetries} 次: ${error.message}`);
                }
                console.warn(`请求失败，正在进行第 ${retryCount} 次重试...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
        }
    },

    // 发送普通对话消息
    async *sendMessage(message) {
        try {
            // 构建消息历史
            const messages = [
                systemPrompt,
                {
                    role: 'user',
                    content: message
                }
            ];

            // 发送请求并处理响应
            for await (const chunk of this.createStreamRequest(messages)) {
                yield chunk;
            }

        } catch (error) {
            console.error('发送消息时出错:', error);
            throw error;
        }
    },

    // 发送分析请求
    async sendAnalysisRequest(prompt) {
        try {
            const messages = [
                systemPrompt,
                {
                    role: 'user',
                    content: prompt
                }
            ];

            let fullResponse = '';
            for await (const chunk of this.createStreamRequest(messages)) {
                fullResponse += chunk;
            }

            return fullResponse;
        } catch (error) {
            console.error('发送分析请求时出错:', error);
            throw error;
        }
    },

    // 分析周报数据
    async analyzeWeekInsight(conversations) {
        try {
            console.log('开始分析周报数据...');
            
            // 构建分析提示词
            const prompt = `请分析以下对话内容，提供以下四个方面的见解：
            1. 主要讨论的话题和主题
            2. 整体情绪倾向
            3. 关键词汇
            4. AI 洞察和建议

            对话内容：
            ${conversations.map(conv => `
            时间：${new Date(conv.timestamp).toLocaleString()}
            内容：${conv.content}
            `).join('\n')}

            请按以下 JSON 格式返回分析结果：
            {
                "topics": "主题分析内容",
                "emotions": "情绪分析内容",
                "keywords": "关键词列表",
                "insights": "AI 洞察和建议"
            }`;

            // 发送分析请求
            const response = await this.sendAnalysisRequest(prompt);
            if (!response) {
                throw new Error('分析请求失败');
            }

            return response;
        } catch (error) {
            console.error('分析周报数据出错:', error);
            throw error;
        }
    },

    // 解析分析响应
    parseInsightResponse(response) {
        try {
            if (!response) {
                throw new Error('分析响应为空');
            }

            // 尝试解析 JSON
            let jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('未找到有效的 JSON 数据');
            }

            const jsonStr = jsonMatch[0];
            const parsed = JSON.parse(jsonStr);

            // 验证必要的字段
            const result = {
                topics: parsed.topics || '解析错误',
                emotions: parsed.emotions || '解析错误',
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords.join('、') : parsed.keywords || '解析错误',
                insights: parsed.insights || '解析错误'
            };

            // 确保所有字段都有值
            Object.entries(result).forEach(([key, value]) => {
                if (!value || value.trim() === '') {
                    result[key] = '解析错误';
                }
            });

            return result;

        } catch (error) {
            console.error('解析分析响应出错:', error);
            // 返回默认错误结果
            return {
                topics: '解析错误',
                emotions: '解析错误',
                keywords: '解析错误',
                insights: '解析错误'
            };
        }
    },

    // 分析情绪
    analyzeEmotion(text) {
        // 这里可以实现更复杂的情绪分析逻辑
        const emotions = {
            '开心': ['高兴', '快乐', '兴奋', '开心', '喜悦', '满意'],
            '悲伤': ['难过', '伤心', '痛苦', '失望', '沮丧', '郁闷'],
            '愤怒': ['生气', '愤怒', '恼火', '烦躁', '不满', '讨厌'],
            '焦虑': ['担心', '焦虑', '紧张', '害怕', '恐惧', '忧虑'],
            '平静': ['平静', '平和', '安宁', '放松', '淡定', '从容']
        };

        let maxCount = 0;
        let dominantEmotion = '平静';

        for (const [emotion, keywords] of Object.entries(emotions)) {
            const count = keywords.reduce((acc, keyword) => {
                return acc + (text.includes(keyword) ? 1 : 0);
            }, 0);

            if (count > maxCount) {
                maxCount = count;
                dominantEmotion = emotion;
            }
        }

        return dominantEmotion;
    }
};
