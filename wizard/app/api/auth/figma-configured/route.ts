import { NextResponse } from 'next/server'

export async function GET() {
  const configured =
    Boolean(process.env.FIGMA_CLIENT_ID) &&
    Boolean(process.env.FIGMA_CLIENT_SECRET) &&
    Boolean(process.env.NEXTAUTH_SECRET)

  return NextResponse.json({ configured })
}
