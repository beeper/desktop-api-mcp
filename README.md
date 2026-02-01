# MCP Remote Monorepo

Monorepo for Beeper MCP tooling.

## Packages

- `packages/mcp-remote` – stdio proxy for Beeper Desktop's Streamable HTTP MCP server
- `packages/desktop-api-mcp` – MCP server package for the Beeper Desktop API

## Requirements

- Node 22+
- Yarn 4.12.0 (via Corepack)
- Bun (for `@beeper/mcp-remote` builds)

## Quick start

```sh
cd mcp-remote
corepack enable

yarn install

# mcp-remote package

yarn workspace @beeper/mcp-remote run check
yarn workspace @beeper/mcp-remote run test:unit
yarn workspace @beeper/mcp-remote run build

# desktop-api-mcp package

yarn workspace @beeper/desktop-api-mcp run test
```

## Notes

- CI is configured in `.github/workflows` for `@beeper/mcp-remote`.
- `dist`, `dist-mcpb`, and `*.mcpb` outputs are gitignored.
