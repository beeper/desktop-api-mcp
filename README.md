# `@beeper/mcp-remote`

Beeper Desktop's MCP server speaks Streamable HTTP with OAuth. Claude Desktop and other clients that only launch local stdio servers reach it through this package, which is also what the Beeper Desktop extension (`BeeperDesktop.dxt`) runs.

It is a thin layer over the upstream [`mcp-remote`](https://github.com/geelen/mcp-remote) proxy, bundled at build time. `src/setup.ts` fills in the Beeper defaults and exits the moment the client that launched it is gone, so a stuck sign-in cannot leave a proxy behind holding the OAuth callback port; `src/proxy.ts` then runs upstream in the same process. `src/authorize.ts` replaces upstream's browser opener: Beeper's sign-in is completed over loopback, so the only thing the user sees is Beeper's own approval dialog, and afterwards the client is brought back to the front.

## Usage

```json
{
  "mcpServers": {
    "beeper": {
      "command": "npx",
      "args": ["-y", "@beeper/mcp-remote", "--client", "claude-desktop"]
    }
  }
}
```

- The first argument may be the MCP URL. Without one, `BEEPER_DESKTOP_BASE_URL` (default `http://127.0.0.1:23373`) plus `/v0/mcp` is used.
- `--client claude-desktop` or `--client raycast` sets the name Beeper shows on the approval dialog.
- `MCP_REMOTE_CONFIG_DIR` (default `~/.beeper-mcp-auth`) is where sign-ins are stored.
- Every other flag is passed to upstream unchanged; see its README for `--debug`, `--header`, `--ignore-tool` and the rest.

## Updating upstream

Bump `mcp-remote` in `devDependencies` and rebuild. Nothing else in this repo tracks upstream's internals.

## Building

`yarn build` produces `dist/proxy.js` and `BeeperDesktop.dxt`.
