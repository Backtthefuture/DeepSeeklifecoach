const { Ark } = require('@volcengine/openapi');

// API 配置
const config = {
    apiKey: '23aeb5da-793c-4eda-a122-8eec47a001dd',
    model: 'ep-20250213080209-dq25s',
    timeout: 30000  // 30秒超时
};

// 初始化 Ark 客户端
const client = new Ark({
    apiKey: config.apiKey,
    timeout: config.timeout
});

module.exports = async (req, res) => {
    try {
        // 设置 SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 解析消息
        const messages = req.body?.messages || [];
        if (!Array.isArray(messages)) {
            throw new Error('消息格式不正确');
        }

        // 创建流式请求
        const response = await client.chat.completions.create({
            model: config.model,
            messages: messages,
            stream: true,
            max_tokens: 4000
        });

        // 处理流式响应
        for await (const chunk of response) {
            if (chunk.choices?.[0]?.delta?.content) {
                const content = chunk.choices[0].delta.content;
                // 检查是否有推理内容
                if (chunk.choices[0].delta.reasoning_content) {
                    const reasoning = chunk.choices[0].delta.reasoning_content;
                    res.write(`data: ${JSON.stringify({choices: [{delta: {content, reasoning_content: reasoning}}]})}\n\n`);
                } else {
                    res.write(`data: ${JSON.stringify({choices: [{delta: {content}}]})}\n\n`);
                }
            }
        }

        res.write('event: done\ndata: {}\n\n');
        res.end();

    } catch (error) {
        console.error('API 错误:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            res.write(`event: error\ndata: ${JSON.stringify({error: error.message})}\n\n`);
            res.end();
        }
    }
};
