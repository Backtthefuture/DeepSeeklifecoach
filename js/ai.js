// AI 交互管理
const AI = {
    // 火山方舟 API 配置
    config: {
        // 根据环境自动选择API端点
        get endpoint() {
            // 检测当前环境
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            // 本地环境使用完整URL，云端环境使用相对路径
            return isLocalhost ? 'http://localhost:8888/api/proxy' : '/api/proxy';
        },
        apiKey: 'a411daf6-b1bf-49c3-a8a9-cdedf38b6173',
        model: 'deepseek-r1-250120'
    },

    // 发送消息到火山方舟 API
    async sendMessage(message, conversation = null, onStream = null) {
        let retries = 3; // 最大重试次数
        let lastError = null;
        
        while (retries > 0) {
            try {
                console.log('准备发送请求到 API:', {
                    endpoint: this.config.endpoint,
                    message: message
                });

                const requestBody = {
                    model: this.config.model,
                    messages: [{
                        role: 'user',
                        content: message
                    }],
                    temperature: 0.6,
                    max_tokens: 2000,
                    stream: Boolean(onStream)
                };

                console.log('发送请求体:', JSON.stringify(requestBody, null, 2));

                const response = await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.apiKey}`
                    },
                    body: JSON.stringify(requestBody)
                });

                console.log('收到响应状态:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API错误响应:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorText,
                        endpoint: this.config.endpoint
                    });
                    throw new Error(`API请求失败: ${response.status} - ${errorText}`);
                }

                // 如果是流式响应
                if (onStream && response.body) {
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    
                    // 处理流式响应
                    const processStream = async () => {
                        try {
                            while (true) {
                                const { done, value } = await reader.read();
                                
                                if (done) {
                                    // 处理缓冲区中剩余的数据
                                    if (buffer.trim()) {
                                        try {
                                            const lines = buffer.split('\n');
                                            for (const line of lines) {
                                                if (line.trim() && line.startsWith('data: ')) {
                                                    const jsonStr = line.substring(6);
                                                    if (jsonStr === '[DONE]') continue;
                                                    const json = JSON.parse(jsonStr);
                                                    const content = json.choices[0]?.delta?.content || '';
                                                    if (content) onStream(content);
                                                }
                                            }
                                        } catch (e) {
                                            console.error('解析流式响应错误:', e, buffer);
                                        }
                                    }
                                    break;
                                }
                                
                                // 将新数据添加到缓冲区
                                const chunk = decoder.decode(value, { stream: true });
                                buffer += chunk;
                                
                                // 处理缓冲区中的完整行
                                const lines = buffer.split('\n');
                                buffer = lines.pop() || ''; // 最后一行可能不完整，保留到缓冲区
                                
                                for (const line of lines) {
                                    if (line.trim() && line.startsWith('data: ')) {
                                        try {
                                            const jsonStr = line.substring(6);
                                            if (jsonStr === '[DONE]') continue;
                                            const json = JSON.parse(jsonStr);
                                            const content = json.choices[0]?.delta?.content || '';
                                            if (content) onStream(content);
                                        } catch (e) {
                                            console.error('解析流式响应错误:', e, line);
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('流式处理错误:', error);
                            throw error;
                        }
                    };
                    
                    await processStream();
                    return 'STREAM_PROCESSED';
                } else {
                    // 非流式响应
                    const data = await response.json();
                    return data.choices[0].message.content;
                }
            } catch (error) {
                console.error('API请求错误:', error, '剩余重试次数:', retries - 1);
                lastError = error;
                
                // 如果是网络错误且还有重试次数，则重试
                if ((error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) && retries > 1) {
                    retries--;
                    // 等待一段时间后重试，使用指数退避策略
                    const waitTime = Math.pow(2, 3 - retries) * 1000;
                    console.log(`等待 ${waitTime}ms 后重试...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                
                // 没有重试次数或非网络错误，抛出异常
                throw lastError;
            }
            
            // 如果成功，跳出循环
            break;
        }
    },

    // 生成系统提示词
    generateSystemPrompt(conversation) {
        if (!conversation || !conversation.messages || conversation.messages.length === 0) {
            return '你是一位专业的生活教练，擅长倾听、共情和提供建议。请基于用户的输入提供温暖、专业的回应。';
        }

        const lastMessage = conversation.messages[conversation.messages.length - 1];
        return `你是一位专业的生活教练，擅长倾听、共情和提供建议。
当前对话主题：${conversation.topic || '未指定'}
用户情绪状态：${lastMessage.emotion || '未知'}
请基于用户的输入和历史记录，提供温暖、专业的回应。并适当提出问题，引导用户思考。使用通俗易懂的语言。`;
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
日期：${new Date(parseInt(c.id)).toLocaleString('zh-CN')}
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
    },

    // 分析本周对话
    async analyzeWeekInsight(conversations) {
        try {
            // 构建分析提示
            const prompt = `请分析以下对话记录，并按以下格式提供分析结果：

# 情绪变化
- 分析情绪变化趋势
- 指出情绪波动的关键点

# AI 洞察
- 基于对话内容提供建设性的建议
- 指出可能需要关注的方面

对话记录：
${conversations.map(c => {
    const firstMsg = c.messages[0];
    return `时间：${new Date(parseInt(c.id)).toLocaleString('zh-CN')}
情绪：${firstMsg.emotion || '未知'}
内容：${firstMsg.content}
---`;
}).join('\n\n')}`;

            // 发送分析请求
            console.log('发送分析请求，提示词：', prompt);
            const response = await this.sendMessage(prompt);
            console.log('收到分析响应：', response);
            return response;

        } catch (error) {
            console.error('分析周报错误：', error);
            throw new Error('生成分析报告失败：' + error.message);
        }
    },

    // 解析 AI 响应
    parseInsightResponse(response) {
        if (!response || typeof response !== 'string') {
            console.error('无效的响应格式：', response);
            return {
                topics: '',
                emotions: '',
                keywords: '',
                insights: ''
            };
        }

        const sections = {
            topics: [],    // 主题
            emotions: [],  // 情绪
            keywords: [], // 关键词
            insights: []  // 洞察
        };

        // 识别当前正在处理的部分
        let currentSection = null;
        const sectionMap = {
            '主要话题': 'topics',
            '情绪变化': 'emotions',
            '关键词': 'keywords',
            'AI 洞察': 'insights',
            'AI洞察': 'insights'
        };

        try {
            // 按行处理响应
            response.split('\n').forEach(line => {
                // 去除行首尾空格
                line = line.trim();
                if (!line) return;

                // 检查是否是新的部分标题
                if (line.startsWith('#')) {
                    const title = line.replace(/^#+\s*/, '').trim();
                    currentSection = sectionMap[title];
                    return;
                }

                // 如果在有效部分内，添加内容
                if (currentSection && sections[currentSection] !== undefined) {
                    // 移除 Markdown 列表标记，但保留缩进
                    const content = line.replace(/^[*-]\s+/, '').trim();
                    if (content) {
                        sections[currentSection].push(content);
                    }
                }
            });

            // 格式化每个部分的内容
            return {
                topics: this.formatSection(sections.topics, '主要话题'),
                emotions: this.formatSection(sections.emotions, '情绪变化'),
                keywords: this.formatSection(sections.keywords, '关键词'),
                insights: this.formatSection(sections.insights, 'AI 洞察')
            };
        } catch (error) {
            console.error('解析响应时出错：', error);
            return {
                topics: '解析错误',
                emotions: '解析错误',
                keywords: '解析错误',
                insights: '解析错误'
            };
        }
    },

    // 格式化部分内容
    formatSection(lines, title) {
        if (!lines || lines.length === 0) return '';

        // 构建 Markdown 格式的内容
        let markdown = `### ${title}\n\n`;
        
        lines.forEach(line => {
            // 如果行包含序号（如 1. 2. 等），保持序号格式
            if (/^\d+\./.test(line)) {
                markdown += `${line}\n`;
            } else {
                // 否则添加列表标记
                markdown += `- ${line}\n`;
            }
        });

        return markdown;
    },
};
