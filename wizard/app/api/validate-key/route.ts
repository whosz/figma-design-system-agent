import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { apiKey, provider = 'anthropic' } = await req.json()

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'Missing apiKey' }, { status: 400 })
  }

  try {
    if (provider === 'anthropic') {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey })
      await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      })
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (!res.ok) throw new Error('401')
    } else if (provider === 'google') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      )
      if (!res.ok) throw new Error('401')
    } else if (provider === 'copilot') {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/vnd.github+json' },
      })
      if (!res.ok) throw new Error('401')
    }

    return NextResponse.json({ valid: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    const isAuthErr = msg.includes('401') || msg.includes('invalid') || msg.includes('authentication') || msg.includes('Unauthorized')
    return NextResponse.json({ error: isAuthErr ? 'Invalid API key' : msg }, { status: 401 })
  }
}
