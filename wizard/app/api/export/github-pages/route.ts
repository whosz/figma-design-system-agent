import { NextRequest, NextResponse } from 'next/server'
import { deployToGitHubPages } from '@/lib/export/github-pages'

export async function POST(req: NextRequest) {
  const { repoName, githubToken, showcaseHtml } = await req.json()

  if (!githubToken || !repoName) {
    return NextResponse.json({ error: 'repoName and githubToken are required' }, { status: 400 })
  }

  const result = await deployToGitHubPages({ githubToken, repoName, showcaseHtml: showcaseHtml ?? '' })
  return NextResponse.json(result)
}
