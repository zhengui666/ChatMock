<div align="center">
  <h1>ChatMock
  <div align="center">
<a href="https://github.com/RayBytes/ChatMock/stargazers"><img src="https://img.shields.io/github/stars/RayBytes/ChatMock" alt="Stars Badge"/></a>
<a href="https://github.com/RayBytes/ChatMock/network/members"><img src="https://img.shields.io/github/forks/RayBytes/ChatMock" alt="Forks Badge"/></a>
<a href="https://github.com/RayBytes/ChatMock/pulls"><img src="https://img.shields.io/github/issues-pr/RayBytes/ChatMock" alt="Pull Requests Badge"/></a>
<a href="https://github.com/RayBytes/ChatMock/issues"><img src="https://img.shields.io/github/issues/RayBytes/ChatMock" alt="Issues Badge"/></a>
<a href="https://github.com/RayBytes/ChatMock/graphs/contributors"><img alt="GitHub contributors" src="https://img.shields.io/github/contributors/RayBytes/ChatMock?color=2b9348"></a>
<a href="https://github.com/RayBytes/ChatMock/blob/master/LICENSE"><img src="https://img.shields.io/github/license/RayBytes/ChatMock?color=2b9348" alt="License Badge"/></a>
</div>
  </h1>

  <p>
    <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/RayBytes/ChatMock">
      <img src="https://deploy.workers.cloudflare.com/button" alt="一键部署到 Cloudflare" />
    </a>
  </p>

  <p>中文 | <a href="README.md">English</a></p>

  <p><b>使用你的 ChatGPT 账号提供 OpenAI 与 Ollama 兼容的 API。</b></p>
  <p>利用 ChatGPT Plus/Pro 登录信息，直接从代码或其它聊天界面调用 GPT-5 系列模型。</p>
  <br>
</div>

## 它能做什么

ChatMock 会启动一个本地服务器，提供 OpenAI/Ollama 兼容接口，然后通过你的 ChatGPT 授权调用后端 Responses API，免去 API Key 需求。支持 GPT-5、GPT-5-Codex 等模型，需要付费的 ChatGPT 账号。

## 快速开始

### 一键部署到 Cloudflare Workers

点击上方或下方的按钮即可创建 Cloudflare Workers 项目。部署完成后在 Cloudflare 仪表盘添加下列 Secrets：

- `CHATGPT_ACCESS_TOKEN`：你的 ChatGPT Web 访问令牌。
- `CHATGPT_ACCOUNT_ID`：从 ChatGPT ID Token 中解析出的 `chatgpt_account_id`。
- （可选）`BASE_INSTRUCTIONS`：默认的系统提示词。

Worker 会开启 `/v1/chat/completions` 流式接口，并提供 `/health` 健康检查。

<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/RayBytes/ChatMock">
  <img src="https://deploy.workers.cloudflare.com/button" alt="一键部署到 Cloudflare" />
</a>

### macOS

#### 图形界面

前往 [GitHub Releases](https://github.com/RayBytes/ChatMock/releases) 下载 macOS 应用。

> 由于应用未签名，首次打开可能需要在终端运行：
>
> ```bash
> xattr -dr com.apple.quarantine /Applications/ChatMock.app
> ```

#### 命令行（Homebrew）

```bash
brew tap RayBytes/chatmock
brew install chatmock
```

### Python 运行

1. 克隆仓库后执行登录：

```bash
python chatmock.py login
```

2. 登录成功后启动服务：

```bash
python chatmock.py serve
```

默认地址是 `http://127.0.0.1:8000`，作为 OpenAI 兼容端点时别忘了在末尾加上 `/v1/`。

### Docker

参考 [DOCKER.md](https://github.com/RayBytes/ChatMock/blob/main/DOCKER.md)。

## 示例

### Python

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8000/v1",
    api_key="key"  # 会被忽略
)

resp = client.chat.completions.create(
    model="gpt-5",
    messages=[{"role": "user", "content": "hello world"}]
)

print(resp.choices[0].message.content)
```

### curl

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Authorization: Bearer key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5",
    "messages": [{"role":"user","content":"hello world"}]
  }'
```

## 支持的模型（节选）
- `gpt-5`
- `gpt-5.1`
- `gpt-5.2`
- `gpt-5-codex`
- `gpt-5.1-codex-max`
- `codex-mini`

## 配置提示
- `--reasoning-effort`：控制思考强度（minimal/low/medium/high/xhigh）。
- `--reasoning-summary`：控制思考摘要（auto/concise/detailed/none）。
- `--enable-web-search`：启用 OpenAI Web Search 工具。
- `--expose-reasoning-models`：将不同思考强度暴露为独立模型名。

需要最快速度时，可设置 `--reasoning-effort=low`、`--reasoning-summary=none`。更多参数请查看 `python chatmock.py serve --h`。
