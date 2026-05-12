import { UserButton } from '@clerk/nextjs'

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div />
      <UserButton />
    </header>
  )
}
