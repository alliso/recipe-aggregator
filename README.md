This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Servidor MCP

`mcp/server.mjs` expone la API de recetas como herramientas MCP (transporte stdio). Por defecto
apunta al despliegue de producción (`https://recipes.alliso.es`).

Está registrado en `.mcp.json`, así que cualquier cliente MCP que lea la configuración del proyecto
(Claude Code, entre otros) lo detecta al abrir el repo. Herramientas disponibles:

| Herramienta | Qué hace |
| --- | --- |
| `list_recipes` | Lista resumida de recetas, con filtro opcional por texto |
| `get_recipe` | Receta completa con pasos e ingredientes |
| `create_recipe` / `update_recipe` / `delete_recipe` | Alta, edición y borrado de recetas |
| `add_ingredient` / `update_ingredient` / `delete_ingredient` | Gestión de ingredientes |
| `shopping_list` | Suma los ingredientes de varias recetas, escalando por raciones |

Variables de entorno:

- `RECIPES_BASE_URL` — instancia a la que apuntar (por defecto la de producción; usa
  `http://localhost:3000` para desarrollo).
- `RECIPES_API_KEY` — se envía como cabecera `x-api-key`. Opcional, para cuando la API tenga
  autenticación.

Para lanzarlo a mano: `pnpm mcp`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
