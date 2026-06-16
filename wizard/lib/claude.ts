import Anthropic from '@anthropic-ai/sdk'
import type { AiProvider } from './wizard-store'

const FIGMA_MCP_URL = process.env.FIGMA_MCP_URL ?? 'https://mcp.figma.com/mcp'

export async function* streamSkill(
  systemPrompt: string,
  userMessage: string,
  figmaToken: string,
  apiKey: string,
  model = 'claude-sonnet-4-6'
): AsyncGenerator<string> {
  const client = new Anthropic({ apiKey })

  const stream = await client.messages.stream({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    // @ts-expect-error — mcp_servers not yet in SDK typedefs but supported at runtime
    mcp_servers: [
      {
        type: 'url',
        url: FIGMA_MCP_URL,
        authorization_token: figmaToken,
      },
    ],
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}

export async function* streamSkillRest(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string,
  provider: AiProvider
): AsyncGenerator<string> {
  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey })
    const stream = await client.messages.stream({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
    return
  }

  if (provider === 'openai' || provider === 'copilot') {
    const baseURL = provider === 'copilot'
      ? 'https://api.githubcopilot.com'
      : 'https://api.openai.com/v1'
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    })
    if (!res.ok || !res.body) throw new Error(`API error: ${res.status}`)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        try {
          const json = JSON.parse(data)
          const text = json.choices?.[0]?.delta?.content
          if (text) yield text
        } catch { /* ignore malformed chunks */ }
      }
    }
    return
  }

  if (provider === 'google') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        }),
      }
    )
    if (!res.ok || !res.body) throw new Error(`Google API error: ${res.status}`)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const json = JSON.parse(line.slice(6))
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) yield text
        } catch { /* ignore malformed chunks */ }
      }
    }
  }
}
