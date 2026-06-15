interface DeployInput {
  githubToken: string
  repoName: string
  showcaseHtml: string
}

interface DeployResult {
  url: string | null
  error?: string
}

async function githubApi(path: string, githubToken: string, method = 'GET', body?: unknown) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok && res.status !== 404) {
    const text = await res.text()
    throw new Error(`GitHub API ${method} ${path}: ${res.status} ${text}`)
  }
  return res.status === 204 ? null : res.json()
}

export async function deployToGitHubPages({ githubToken, repoName, showcaseHtml }: DeployInput): Promise<DeployResult> {
  // Get authenticated user
  const user = await githubApi('/user', githubToken)
  const owner = user.login as string

  // Create repo if not exists
  const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
    headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' },
  })
  if (repoCheck.status === 404) {
    await githubApi('/user/repos', githubToken, 'POST', { name: repoName, auto_init: true })
    await new Promise((r) => setTimeout(r, 2000)) // wait for repo init
  }

  // Upsert index.html
  const existing = await githubApi(`/repos/${owner}/${repoName}/contents/index.html`, githubToken)
  const content = Buffer.from(showcaseHtml).toString('base64')
  await githubApi(`/repos/${owner}/${repoName}/contents/index.html`, githubToken, 'PUT', {
    message: 'Deploy design system showcase',
    content,
    sha: existing?.sha,
  })

  // Enable GitHub Pages from main branch
  try {
    await githubApi(`/repos/${owner}/${repoName}/pages`, githubToken, 'POST', {
      source: { branch: 'main', path: '/' },
    })
  } catch {
    // Pages may already be enabled, ignore
  }

  return { url: `https://${owner}.github.io/${repoName}/` }
}
