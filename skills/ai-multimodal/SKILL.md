---
name: ck:ai-multimodal
description: >
  AI/multimodal integration patterns. OpenAI, Anthropic, Gemini, image generation,
  vision, transcription, embeddings. Pattern guidance only — no SDK bundled.
triggers:
  - openai
  - anthropic
  - gemini
  - image generation
  - vision
  - transcribe
  - embedding
  - chatbot
  - AI integration
  - multimodal
non_triggers:
  - deploy only
  - database only
  - auth only
examples:
  - "integrate OpenAI chat API"
  - "thêm image generation với DALL-E"
  - "setup voice transcription"
metadata:
  author: forgekit
  version: "1.0.0"
---

# AI Multimodal

AI/multimodal integration patterns — OpenAI, Anthropic, Gemini. Pattern guidance, không bundle SDK.

## Khi nào load

- User yêu cầu AI chat/generation/vision/transcription
- Cần tích hợp LLM API
- Embedding/RAG pattern
- Image generation, voice transcription

## Không dùng khi

- Chỉ cần deploy AI service (→ deploy)
- Chỉ cần auth cho AI API (→ auth)

## Core Patterns

### Chat Completion
```
POST /v1/chat/completions
- model: gpt-4o / claude-3.5 / gemini-pro
- messages: [{role, content}]
- temperature, max_tokens
```

Key rules:
- API key qua env var (OPENAI_API_KEY, ANTHROPIC_API_KEY)
- Stream response cho UX tốt hơn
- Rate limit handling: exponential backoff
- Token counting trước khi gửi

### Vision / Image Understanding
- Gửi image URL hoặc base64 trong content
- OpenAI: `image_url` type trong message
- Anthropic: `image` type trong content block

### Embedding / RAG
1. Chunk documents (512-1024 tokens)
2. Generate embeddings qua API
3. Store trong vector DB (pgvector, Pinecone)
4. Query: embed question → cosine similarity → top-k → context
5. Gửi context + question tới LLM

### Transcription
- OpenAI Whisper API: `POST /v1/audio/transcriptions`
- Format: mp3, mp4, wav (max 25MB)
- Dùng ffmpeg split cho file lớn

### Image Generation
- OpenAI: DALL-E 3 API
- Prompt engineering: specific > vague
- Size options: 1024x1024, 1792x1024, 1024x1792

## Error Handling

- 429 Rate Limit → backoff + retry
- 400 Bad Request → check message format
- 401 Unauthorized → check API key env var
- Timeout → reduce max_tokens hoặc chunk input

## Cost Awareness

- GPT-4o: ~$2.50/1M input tokens
- Claude 3.5 Sonnet: ~$3/1M input tokens
- Gemini Pro: ~$1.25/1M input tokens
- Luôn set max_tokens để tránh overspend
