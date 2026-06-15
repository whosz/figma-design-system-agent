import fs from 'fs'
import path from 'path'

const SKILLS_DIR = path.resolve(process.cwd(), '..', 'skills')

export function buildSystemPrompt(skillName: string): string {
  const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md')
  if (!fs.existsSync(skillPath)) {
    throw new Error(`Skill not found: ${skillName}`)
  }
  return fs.readFileSync(skillPath, 'utf-8')
}

export function buildUserMessage(skillName: string, inputs: Record<string, unknown>): string {
  const parts: string[] = []

  if (inputs.figmaFileUrl) {
    parts.push(`Figma file URL: ${inputs.figmaFileUrl}`)
  }
  if (inputs.profile) {
    parts.push(`Target profile: ${JSON.stringify(inputs.profile, null, 2)}`)
  }
  if (inputs.component) {
    parts.push(`Component to generate: ${inputs.component}`)
  }
  if (inputs.query) {
    parts.push(`Query: ${inputs.query}`)
  }

  if (parts.length === 0) {
    parts.push(`Run the ${skillName} skill.`)
  }

  return parts.join('\n\n')
}
