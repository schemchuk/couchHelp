import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // TODO: Блок 02 — генерація AI-чернетки
  return NextResponse.json({ draft: null, message: 'Coming in Block 02' })
}
