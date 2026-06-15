import { NextRequest } from 'next/server'
import { buildAiInstructions } from '@/lib/export/ai-instructions'

export async function POST(req: NextRequest) {
  const { format, tokenOverrides, components } = await req.json()

  const content = buildAiInstructions({
    format: format ?? 'designrules',
    tokenOverrides: tokenOverrides ?? {},
    components: components ?? [],
  })

  return new Response(content, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
