# AGENT.md

## Commands

- **Build**: `yarn build` (bundles `dist/proxy.js`, then packs `BeeperDesktop.dxt`)
- **Check**: `yarn check` (prettier and tsc)
- **Format**: `yarn lint-fix`

## Architecture

- `src/setup.ts` is the only logic: it applies Beeper's defaults, rewrites `process.argv`, and watches for the parent process going away.
- `src/proxy.ts` imports `setup` and then upstream's CLI, so everything runs in one process and bun bundles it into one file.
- `src/authorize.ts` is what upstream gets when it imports `open` (aliased in `build.ts`): Beeper authorize URLs are completed over loopback without a browser, everything else goes to the real `open`.
- Upstream is pinned in `devDependencies`; update it by bumping the version and rebuilding.

## Code Style

- Prettier with 140 char width, single quotes, no semicolons
- Strict TypeScript, ES2022 target, bundler module resolution
