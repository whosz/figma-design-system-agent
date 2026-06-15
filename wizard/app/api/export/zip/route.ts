import { NextRequest } from 'next/server'
import { buildZip } from '@/lib/export/zip'

export async function POST(req: NextRequest) {
  const { showcaseHtml, tokenOverrides, components } = await req.json()

  const bytes = await buildZip({ showcaseHtml: showcaseHtml ?? '', tokenOverrides: tokenOverrides ?? {}, components: components ?? [] })
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/zip' })

  return new Response(blob, {
    headers: {
      'Content-Disposition': 'attachment; filename="design-system.zip"',
    },
  })
}
