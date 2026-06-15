import { NextRequest } from 'next/server'
import { buildSystemPrompt, buildUserMessage } from '@/lib/skill-prompts'
import { streamSkill } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const { skill, inputs, figmaToken, aiApiKey, aiProvider, aiModel } = await req.json()

  if (!figmaToken) return new Response('Missing figmaToken', { status: 401 })

  const apiKey = aiApiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) return new Response('Missing AI API key', { status: 401 })

  // Only Anthropic supports Figma MCP natively
  if (aiProvider && aiProvider !== 'anthropic') {
    return new Response(
      `[Note] ${aiProvider} does not support Figma MCP live integration. Switch to Anthropic for full functionality.\n`,
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    )
  }

  let systemPrompt: string
  try {
    systemPrompt = buildSystemPrompt(skill)
  } catch {
    return new Response(`Unknown skill: ${skill}`, { status: 400 })
  }

  const model = aiModel || 'claude-sonnet-4-6'
  const userMessage = buildUserMessage(skill, inputs)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamSkill(systemPrompt, userMessage, figmaToken, apiKey, model)) {
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
  })
}
