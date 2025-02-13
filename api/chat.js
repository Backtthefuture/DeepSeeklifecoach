const fetch = require('node-fetch');

// API 配置
const config = {
    apiKey: '23aeb5da-793c-4eda-a122-8eec47a001dd',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'ep-20250213080209-dq25s',
    timeout: 30000  // 30秒超时
};

// 处理聊天请求
async function handleChatRequest(req, res) {
    // 设置 SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const handleError = (error, status = 500) => {
        console.error('处理聊天请求出错:', error);
        res.write(`event: error\ndata: ${JSON.stringify({ 
            error: error.message,
            status 
        })}\n\n`);
        res.end();
    };

    try {
        // 解析消息
        const messages = req.method === 'POST' 
            ? req.body.messages 
            : JSON.parse(req.query.messages);

        if (!Array.isArray(messages)) {
            throw new Error('消息格式不正确');
        }

        console.log('收到聊天请求:', { messages });

        // 创建请求参数
        const requestBody = {
            model: config.model,
            messages,
            stream: true,
            max_tokens: 4000
        };

        // 创建 AbortController 用于超时控制
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
        }, config.timeout);

        // 发送请求到火山方舟 API
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API错误响应:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers),
                body: errorText
            });
            return handleError(new Error(`API请求失败: ${response.status} - ${errorText}`), response.status);
        }

        // 处理流式响应
        const reader = response.body;
        let buffer = '';

        reader.on('data', chunk => {
            try {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        if (data.choices?.[0]?.delta?.content) {
                            res.write(`data: ${JSON.stringify({
                                choices: [{
                                    delta: { content: data.choices[0].delta.content }
                                }]
                            })}\n\n`);
                        }
                    }
                }
            } catch (error) {
                console.warn('处理数据块出错:', error);
            }
        });

        reader.on('end', () => {
            console.log('流式请求完成');
            if (buffer) {
                try {
                    const line = buffer.trim();
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        if (data.choices?.[0]?.delta?.content) {
                            res.write(`data: ${JSON.stringify({
                                choices: [{
                                    delta: { content: data.choices[0].delta.content }
                                }]
                            })}\n\n`);
                        }
                    }
                } catch (error) {
                    console.warn('处理最后的数据块出错:', error);
                }
            }
            res.write('event: done\ndata: {}\n\n');
            res.end();
        });

        reader.on('error', error => {
            console.error('流式请求出错:', error);
            handleError(error);
        });

    } catch (error) {
        handleError(error);
    }
}

module.exports = handleChatRequest;
