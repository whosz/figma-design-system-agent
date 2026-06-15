import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { apiKey, provider = 'anthropic' } = await req.json()

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'Missing apiKey' }, { status: 400 })
  }

  try {
    if (provider === 'anthropic') {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey: apiKey.trim() })
      await client.models.list()
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw { status: res.status, message: data?.error?.message ?? res.statusText }
      }
    } else if (provider === 'google') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw { status: res.status, message: data?.error?.message ?? res.statusText }
      }
    } else if (provider === 'copilot') {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${apiKey.trim()}`, Accept: 'application/vnd.github+json' },
      })
      if (!res.ok) {
        throw { status: res.status, message: res.statusText }
      }
    }

    return NextResponse.json({ valid: true })
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status ?? 0
    const message = (err as { message?: string })?.message ?? String(err)
    const isAuthErr = status === 401 || status === 403
    return NextResponse.json(
      { error: isAuthErr ? 'Invalid API key' : (message || 'Validation failed') },
      { status: 401 }
    )
  }
}
