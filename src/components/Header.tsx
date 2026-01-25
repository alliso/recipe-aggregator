'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Recetas' },
    { href: '/settings', label: 'Ajustes' }
  ]

  return (
    <header style={{ background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Recipe Manager
          </Link>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: pathname === item.href ? 'var(--card-border)' : 'transparent',
                  color: pathname === item.href ? 'var(--foreground)' : 'var(--text-muted)'
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
