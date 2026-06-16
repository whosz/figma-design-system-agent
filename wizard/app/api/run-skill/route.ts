import { NextRequest } from 'next/server'
import { buildSystemPrompt, buildUserMessage } from '@/lib/skill-prompts'
import { streamSkill, streamSkillRest } from '@/lib/claude'
import { extractFileKey, fetchFigmaContext } from '@/lib/figma-rest'
import type { AiProvider } from '@/lib/wizard-store'

const MCP_ONLY_SKILLS = new Set(['code-to-figma', 'code-connect-sync'])

export async function POST(req: NextRequest) {
  const { skill, inputs, figmaToken, aiApiKey, aiProvider, aiModel, figmaDataMode } = await req.json()

  const apiKey = aiApiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) return new Response('Missing AI API key', { status: 401 })

  const useRest =
    figmaDataMode === 'rest' ||
    (figmaDataMode !== 'mcp' && aiProvider && aiProvider !== 'anthropic')

  if (!useRest && !figmaToken) {
    return new Response('Missing figmaToken', { status: 401 })
  }

  if (useRest && MCP_ONLY_SKILLS.has(skill)) {
    return new Response(
      `The **${skill}** skill requires Figma MCP write access and is not available in REST API mode.\n\nTo use this skill, switch to Anthropic + MCP mode in Step 1.`,
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    )
  }

  let systemPrompt: string
  try {
    systemPrompt = buildSystemPrompt(skill)
  } catch {
    return new Response(`Unknown skill: ${skill}`, { status: 400 })
  }

  const model = (aiModel as string) || 'claude-sonnet-4-6'
  const provider = (aiProvider as AiProvider) || 'anthropic'

  const encoder = new TextEncoder()

  if (useRest) {
    const figmaUrl = inputs?.figmaFileUrl as string | undefined
    const fileKey = figmaUrl ? extractFileKey(figmaUrl) : null

    let userMessage: string
    if (fileKey && figmaToken) {
      try {
        const figmaContext = await fetchFigmaContext(fileKey, figmaToken, 'full')
        userMessage = buildUserMessage(skill, inputs, figmaContext)
      } catch {
        userMessage = buildUserMessage(skill, inputs)
      }
    } else {
      userMessage = buildUserMessage(skill, inputs)
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamSkillRest(systemPrompt, userMessage, apiKey, model, provider)) {
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
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Figma-Mode': 'rest',
      },
    })
  }

  const userMessage = buildUserMessage(skill, inputs)

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
