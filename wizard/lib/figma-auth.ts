import { cookies } from 'next/headers'

export async function getFigmaToken(): Promise<string | null> {
  const jar = await cookies()
  // Try session cookie set by NextAuth (PAT or OAuth token stored there)
  return jar.get('figma_token')?.value ?? null
}

export function setFigmaTokenCookie(token: string) {
  // Called by API route after OAuth callback or PAT validation
  // The token is stored server-side in an httpOnly cookie
  return { name: 'figma_token', value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 }
}
