import Anthropic from '@anthropic-ai/sdk'

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
        url: 'https://mcp.figma.com/mcp',
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
