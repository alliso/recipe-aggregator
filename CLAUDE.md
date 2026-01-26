# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Recipe Aggregator is a Next.js 16 app for managing recipes with ingredients and Markdown steps. Tech stack: Next.js 16, React 19, TypeScript, Prisma 5 with SQLite, Tailwind CSS 4.

## Commands

```bash
pnpm install          # Install dependencies
pnpm prisma generate  # Generate Prisma client (required after schema changes)
pnpm prisma migrate dev --name <description>  # Run migrations
pnpm dev              # Start dev server (port 3000)
pnpm build            # Production build
pnpm lint             # Run ESLint
```

## Architecture

### Database (Prisma + SQLite)
- Schema at `prisma/schema.prisma` with three models: Recipe, Ingredient, Settings
- Prisma singleton at `src/lib/db.ts` prevents multiple client instances in dev
- Ingredients have cascade delete when parent recipe is deleted
- Settings uses single-record pattern (always id: 1)

### API Layer (`src/app/api/`)
- RESTful endpoints following Next.js App Router conventions
- Routes: `/api/recipes`, `/api/recipes/[id]`, `/api/ingredients`, `/api/ingredients/[id]`, `/api/settings`
- All handlers return `NextResponse.json()` with appropriate status codes

### Client Pages
- All pages use `'use client'` directive with React hooks for state
- Main page (`page.tsx`): Recipe list with create/delete and ingredient export
- Recipe detail (`recipes/[id]/page.tsx`): Full recipe editing with ingredients and Markdown steps
- Settings (`settings/page.tsx`): Configure export URL

### Theme System
- Context provider at `src/contexts/ThemeContext.tsx`
- Persisted to localStorage
- CSS custom properties in `globals.css` (e.g., `--background`, `--foreground`, `--card-bg`)
- Uses `data-theme` attribute on HTML element

### Styling
- Tailwind CSS 4 with CSS custom properties for theming
- Inline styles using `var(--property-name)` for theme-aware colors
- No component library - custom styled components

## Key Patterns

1. **Form handling**: useState for form data → onChange updates → onSubmit POSTs to API → refetch after mutation
2. **Dynamic routes**: Use `useParams()` hook, params are Promises in App Router (use `await params`)
3. **Recipe icons/colors**: Deterministic assignment via `id % array.length`
4. **Path alias**: `@/*` maps to `./src/*`

## Types

TypeScript interfaces at `src/types/index.ts`: Recipe, Ingredient, Settings, RecipeFormData, IngredientFormData

## UI Language

The UI text is in Spanish.
