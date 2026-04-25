# Clock Spots Open

An open, independently implemented clock-position logic puzzle inspired by Clock Spots and MMO raid planning.

This app is a static Vite/React site. It includes deterministic daily puzzles, a tutorial puzzle, archive navigation, local stats, backup/import codes, easy mode, blind prog, share text, and a privacy page. It intentionally does not copy the original Clock Spots source code or image assets.

The board vendors FF14-style job, role, marker, and arena images from the local `xivplan/public` asset set into `public/assets/xivplan`. Final Fantasy XIV assets are © SQUARE ENIX CO., LTD.

## Development

```bash
npm ci
npm run dev
```

## Build

```bash
npm run build
```

The production output is written to `dist`.

## Cloudflare Pages Hosting

Recommended deployment target:

- Framework preset: `React (Vite)`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: leave blank
- Production branch: `main`

Cloudflare Pages supports Vite React with `npm run build` and `dist`, and the repository includes `wrangler.toml` for Wrangler-based deploys.

### Dashboard Deployment

1. Go to Cloudflare Dashboard > Workers & Pages.
2. Create a new Pages application.
3. Connect the `RuXxar/clock-spots-open` GitHub repository.
4. Select the `React (Vite)` preset or enter the build settings above.
5. Deploy.

### Wrangler Deployment

```bash
npm ci
npm run deploy:cloudflare
```

The first Wrangler deploy will ask you to authenticate with Cloudflare if you are not already logged in.

GitHub Actions currently runs the production build on pushes to `main` and pull requests.
