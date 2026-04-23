# AI Chat Interface

从 [esp32-vibe-coder](https://github.com/wangqioo/esp32-vibe-coder) 提取的独立 AI 接口模块，支持接入各家主流大模型。

## 核心文件

| 文件 | 说明 |
|---|---|
| `src/utils/aiApi.js` | AI API 抽象层，支持流式输出 |
| `src/components/SettingsModal.jsx` | 供应商选择 + API Key 配置面板 |
| `src/components/ChatPanel.jsx` | 完整聊天 UI 组件（含 Markdown / 代码高亮） |

## 支持的供应商

| 供应商 | Base URL |
|---|---|
| OpenAI | `https://api.openai.com/v1` |
| Anthropic | `https://api.anthropic.com` |
| DeepSeek | `https://api.deepseek.com/v1` |
| 阿里云百炼 (Qwen) | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| Groq | `https://api.groq.com/openai/v1` |
| 智谱 (GLM) | `https://open.bigmodel.cn/api/paas/v4` |
| MiniMax | `https://api.minimax.chat/v1` |
| Ollama (本地) | `http://localhost:11434/v1` |

任何兼容 OpenAI `/chat/completions` 接口的服务都可直接使用。Anthropic 原生 API 已单独适配。

## 快速使用

```bash
npm install
npm run dev
```

## 核心 API

```js
import { streamChat, PROVIDER_PRESETS } from './src/utils/aiApi.js'

await streamChat({
  baseUrl: 'https://api.openai.com/v1',  // 或任意兼容接口
  apiKey:  'sk-...',
  model:   'gpt-4o',
  messages: [
    { role: 'system', content: '你是一个助手' },
    { role: 'user',   content: '你好' },
  ],
  onChunk: (text) => process.stdout.write(text),  // 流式回调
  onDone:  ()     => console.log('\n完成'),
  onError: (err)  => console.error(err),
})
```

`PROVIDER_PRESETS` 包含所有供应商的 baseUrl 和推荐模型列表，可直接在 UI 中展示选择。

## 在现有项目中集成

只需复制以下文件：

```
src/utils/aiApi.js
src/components/SettingsModal.jsx + SettingsModal.css
src/components/ChatPanel.jsx + ChatPanel.css   (可选)
```

CSS 变量依赖 `index.css` 中定义的暗色主题变量（`--bg-primary`、`--accent` 等），可按需替换为自己的设计系统。
