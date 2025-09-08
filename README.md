# `@beeper/mcp-remote`

This package provides an `stdio` proxy for Beeper MCP's Streamable HTTP endpoint and the Claude Desktop Extension that uses it. Built on top of the amazing [`mcp-remote`](https://github.com/geelen/mcp-remote) project with Beeper-specific tweaks and default configuration.

`@beeper/mcp-remote` acts as a bridge, allowing Claude Desktop and other MCP clients that only support local (stdio) servers to connect securely to remote MCP servers with OAuth authentication.

For more details on the upstream project and its capabilities, see the [`mcp-remote` GitHub repository](https://github.com/geelen/mcp-remote).
https://github.com/geelen/mcp-remote