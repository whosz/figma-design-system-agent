import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'

const config: NextAuthConfig = {
  providers: [
    {
      id: 'figma',
      name: 'Figma',
      type: 'oauth',
      clientId: process.env.FIGMA_CLIENT_ID!,
      clientSecret: process.env.FIGMA_CLIENT_SECRET!,
      authorization: {
        url: 'https://www.figma.com/oauth',
        params: { scope: 'file_read', response_type: 'code' },
      },
      token: 'https://www.figma.com/api/oauth/token',
      userinfo: 'https://api.figma.com/v1/me',
      profile(profile: { id: string; handle: string; email: string; img_url: string }) {
        return {
          id: profile.id,
          name: profile.handle,
          email: profile.email,
          image: profile.img_url,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.figmaToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      // @ts-expect-error — extend session type
      session.figmaToken = token.figmaToken
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const { handlers } = NextAuth(config)
export const { GET, POST } = handlers
