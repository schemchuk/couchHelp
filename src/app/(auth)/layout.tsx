import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex flex-1 items-center justify-center">
        {children}
      </main>
      <footer className="py-4 text-center text-xs text-slate-500">
        <Link href="/privacy" className="hover:text-slate-700 hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </div>
  )
}
