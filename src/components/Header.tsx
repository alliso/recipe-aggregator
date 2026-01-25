'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'

export default function Header() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const navItems = [
    { href: '/', label: 'Recetas' },
    { href: '/settings', label: 'Ajustes' }
  ]

  return (
    <header style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--card-border)' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Recipe Manager
          </Link>
          <div className="flex items-center gap-4">
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
            <button
              onClick={toggleTheme}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: theme === 'dark' ? 'var(--accent-blue)' : 'var(--card-border)' }}
              aria-label="Cambiar tema"
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full transition-all flex items-center justify-center text-xs"
                style={{
                  left: theme === 'dark' ? '28px' : '4px',
                  background: 'var(--card-bg)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
