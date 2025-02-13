const fetch = require('node-fetch');

async function testBotChat() {
    const botId = 'bot-20250213105504-cw59n';
    try {
        const response = await fetch(`https://ark.cn-beijing.volces.com/api/v2/bots/${botId}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 23aeb5da-793c-4eda-a122-8eec47a001dd'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: '你是一位专业的生活教练，请帮我回答问题，可以通过联网搜索获取最新信息。'
                    },
                    {
                        role: 'user',
                        content: '最近的人工智能领域有什么重要进展？'
                    }
                ],
                stream: true,
                extra: {
                    "emit_intention_signal_extra": "true"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const reader = response.body;
        reader.on('data', chunk => {
            console.log('Received chunk:', chunk.toString());
        });

        reader.on('end', () => {
            console.log('Stream ended');
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

testBotChat();
