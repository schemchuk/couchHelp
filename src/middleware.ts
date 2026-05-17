import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/whatsapp(.*)',
  '/api/webhooks/test',
  '/api/keepalive(.*)',
  '/api/inbox/messages',
  '/api/inbox/thread',
])

export default clerkMiddleware(async (auth, request) => {
  // Повністю пропускаємо webhook-запити — Clerk не має до них лізти
  if (request.nextUrl.pathname.startsWith('/api/webhooks')) {
    return
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api(?!/webhooks)|trpc)(.*)',
  ],
}
