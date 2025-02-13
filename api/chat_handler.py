import os
from volcenginesdkarkruntime import Ark
from flask import Flask, request, Response, stream_with_context, send_from_directory
import json

# 获取项目根目录的绝对路径
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__, static_folder=ROOT_DIR, static_url_path='')

# API 配置
config = {
    'api_key': '23aeb5da-793c-4eda-a122-8eec47a001dd',
    'model': 'ep-20250213080209-dq25s',
    'timeout': 30000  # 30秒超时
}

# 初始化 Ark 客户端
client = Ark(
    api_key=config['api_key'],
    timeout=config['timeout']
)

@app.route('/')
def index():
    return send_from_directory(ROOT_DIR, 'index.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(ROOT_DIR, 'favicon.ico')

@app.route('/api/chat', methods=['GET', 'POST'])
def handle_chat_request():
    try:
        # 设置 SSE headers
        headers = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }

        # 解析消息
        if request.method == 'POST':
            messages = request.json.get('messages', [])
        else:
            messages = json.loads(request.args.get('messages', '[]'))

        if not isinstance(messages, list):
            raise ValueError('消息格式不正确')

        def generate():
            try:
                # 发送请求到火山方舟
                response = client.chat.completions.create(
                    model=config['model'],
                    messages=messages,
                    stream=True,
                    max_tokens=4000
                )

                # 处理流式响应
                for chunk in response:
                    if hasattr(chunk.choices[0].delta, 'content'):
                        content = chunk.choices[0].delta.content
                        # 检查是否有推理内容
                        if hasattr(chunk.choices[0].delta, 'reasoning_content'):
                            reasoning = chunk.choices[0].delta.reasoning_content
                            yield f"data: {json.dumps({'choices': [{'delta': {'content': content, 'reasoning_content': reasoning}}]})}\n\n"
                        else:
                            yield f"data: {json.dumps({'choices': [{'delta': {'content': content}}]})}\n\n"

                yield "event: done\ndata: {}\n\n"

            except Exception as e:
                error_msg = f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
                yield error_msg

        return Response(stream_with_context(generate()), headers=headers)

    except Exception as e:
        return {'error': str(e)}, 500

if __name__ == '__main__':
    print(f'服务器运行在 http://localhost:3002')
    app.run(port=3002, debug=True)
