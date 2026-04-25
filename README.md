# Clock Spots Open

An open, independently implemented clock-position logic puzzle inspired by Clock Spots and MMO raid planning.

This app is a static Vite+/React site. It includes deterministic daily puzzles, a tutorial puzzle, archive navigation, local stats, backup/import codes, easy mode, blind prog, share text, and a privacy page. It intentionally does not copy the original Clock Spots source code or image assets.

The board vendors FF14-style job, role, marker, and arena images from the local `xivplan/public` asset set into `public/assets/xivplan`. Final Fantasy XIV assets are © SQUARE ENIX CO., LTD.

## Development

Use Node.js 24.15.0. The repo includes `.node-version` and `.nvmrc` so Cloudflare Workers Builds, GitHub Actions, and local version managers can use the same runtime.

```bash
npm ci
npm run dev
```

## Check

```bash
npm run check
```

## Build

```bash
npm run build
```

The production output is written to `dist`.

## Cloudflare Workers Hosting

Recommended deployment target:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Non-production branch deploy command: `npx wrangler versions upload`
- Root directory: leave blank
- Production branch: `main`

Cloudflare Workers serves this Vite+/React app as static assets from `dist`. The `wrangler.toml` file configures Workers Static Assets and SPA fallback routing, and `.node-version` pins Cloudflare's build runtime to Node.js 24.15.0. Do not add a Pages-style `public/_redirects` SPA fallback; Workers handles that through `assets.not_found_handling`.

### Dashboard Deployment

1. Go to Cloudflare Dashboard > Workers & Pages.
2. Create a new application and connect the `RuXxar/clock-spots-open` GitHub repository.
3. Keep the project name as `clock-spots-open`.
4. Enter the build settings above.
5. Deploy.

### Wrangler Deployment

```bash
npm ci
npm run deploy:cloudflare
```

The first Wrangler deploy will ask you to authenticate with Cloudflare if you are not already logged in.

GitHub Actions currently runs the production build on pushes to `main` and pull requests.
