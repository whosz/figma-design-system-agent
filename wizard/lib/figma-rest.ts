export interface FigmaRestContext {
  fileKey: string
  fileName: string
  lastModified: string
  variables: FigmaVariable[]
  components: FigmaComponent[]
  styles: FigmaStyle[]
  truncated: boolean
}

interface FigmaVariable {
  id: string
  name: string
  resolvedType: string
  valuesByMode: Record<string, unknown>
}

interface FigmaComponent {
  key: string
  name: string
  description: string
}

interface FigmaStyle {
  key: string
  name: string
  styleType: string
  description: string
}

export function extractFileKey(figmaUrl: string): string | null {
  const match = figmaUrl.match(/figma\.com\/(?:file|design)\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

const MAX_VARIABLES = 500
const MAX_COMPONENTS = 200

export async function fetchFigmaContext(
  fileKey: string,
  pat: string,
  depth: 'summary' | 'full' = 'summary'
): Promise<FigmaRestContext> {
  const headers = { 'X-Figma-Token': pat }

  const [metaRes, varRes, compRes, styleRes] = await Promise.all([
    fetch(`https://api.figma.com/v1/files/${fileKey}?depth=1`, { headers }),
    fetch(`https://api.figma.com/v1/files/${fileKey}/variables/local`, { headers }),
    fetch(`https://api.figma.com/v1/files/${fileKey}/components`, { headers }),
    fetch(`https://api.figma.com/v1/files/${fileKey}/styles`, { headers }),
  ])

  if (!metaRes.ok) {
    const text = await metaRes.text()
    throw new Error(`Figma REST error ${metaRes.status}: ${text}`)
  }

  const meta = await metaRes.json()

  let variables: FigmaVariable[] = []
  let allVariablesCount = 0
  if (varRes.ok) {
    const varData = await varRes.json()
    const raw: FigmaVariable[] = Object.values(varData.meta?.variables ?? {}) as FigmaVariable[]
    allVariablesCount = raw.length
    variables = depth === 'full' ? raw.slice(0, MAX_VARIABLES) : raw.slice(0, 50)
  }

  let components: FigmaComponent[] = []
  let allComponentsCount = 0
  if (compRes.ok) {
    const compData = await compRes.json()
    const raw: FigmaComponent[] = compData.meta?.components ?? []
    allComponentsCount = raw.length
    components = depth === 'full' ? raw.slice(0, MAX_COMPONENTS) : raw.slice(0, 20)
  }

  let styles: FigmaStyle[] = []
  if (styleRes.ok) {
    const styleData = await styleRes.json()
    const raw: FigmaStyle[] = styleData.meta?.styles ?? []
    styles = depth === 'full' ? raw : raw.slice(0, 20)
  }

  const truncated = depth === 'full'
    ? (allVariablesCount > MAX_VARIABLES || allComponentsCount > MAX_COMPONENTS)
    : false

  return {
    fileKey,
    fileName: meta.name ?? fileKey,
    lastModified: meta.lastModified ?? '',
    variables,
    components,
    styles,
    truncated,
  }
}

export function formatFigmaContext(ctx: FigmaRestContext): string {
  const lines: string[] = [
    `## Figma file (REST API mode)`,
    `Name: ${ctx.fileName}`,
    `Key: ${ctx.fileKey}`,
    `Last modified: ${ctx.lastModified}`,
    ``,
  ]

  if (ctx.variables.length > 0) {
    lines.push(`### Variables (${ctx.variables.length})`)
    for (const v of ctx.variables) {
      lines.push(`- [${v.resolvedType}] ${v.name}`)
    }
    lines.push('')
  }

  if (ctx.components.length > 0) {
    lines.push(`### Components (${ctx.components.length})`)
    for (const c of ctx.components) {
      lines.push(`- ${c.name}${c.description ? `: ${c.description}` : ''}`)
    }
    lines.push('')
  }

  if (ctx.styles.length > 0) {
    lines.push(`### Styles (${ctx.styles.length})`)
    for (const s of ctx.styles) {
      lines.push(`- [${s.styleType}] ${s.name}${s.description ? `: ${s.description}` : ''}`)
    }
    lines.push('')
  }

  if (ctx.truncated) {
    lines.push(`_Note: results truncated. Use MCP mode for full dataset._`)
  }

  return lines.join('\n')
}
