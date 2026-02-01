#!/usr/bin/env node
import './setup'

/**
 * MCP Proxy with OAuth support
 * A bidirectional proxy between a local STDIO MCP server and a remote SSE server with OAuth authentication.
 *
 * Run with: npx tsx proxy.ts https://example.remote/server [callback-port]
 *
 * If callback-port is not specified, an available port will be automatically selected.
 */

import { EventEmitter } from 'events'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  connectToRemoteServer,
  log,
  mcpProxy,
  parseCommandLineArgs,
  setupSignalHandlers,
  getServerUrlHash,
  TransportStrategy,
} from './lib/utils'
import { StaticOAuthClientInformationFull, StaticOAuthClientMetadata } from './lib/types'
import { NodeOAuthClientProvider } from './lib/node-oauth-client-provider'
import { createLazyAuthCoordinator } from './lib/coordination'

/**
 * Main function to run the proxy
 */
async function runProxy(
  serverUrl: string,
  callbackPort: number,
  headers: Record<string, string>,
  transportStrategy: TransportStrategy = 'http-only',
  host: string,
  client: 'claude-desktop' | 'raycast' | undefined,
  staticOAuthClientMetadata: StaticOAuthClientMetadata,
  staticOAuthClientInfo: StaticOAuthClientInformationFull,
  authorizeResource: string,
  ignoredTools: string[],
  authTimeoutMs: number,
) {
  // Set up event emitter for auth flow
  const events = new EventEmitter()

  // Get the server URL hash for lockfile operations
  const serverUrlHash = getServerUrlHash(serverUrl)

  // Create a lazy auth coordinator
  const authCoordinator = createLazyAuthCoordinator(serverUrlHash, callbackPort, events, authTimeoutMs, client)

  // Map client to human-readable client name
  const clientName = client === 'claude-desktop' ? 'Claude Desktop' : client === 'raycast' ? 'Raycast' : 'Unknown MCP Client'

  // Create the OAuth client provider
  const authProvider = new NodeOAuthClientProvider({
    serverUrl,
    callbackPort,
    host,
    clientName,
    clientUri: 'https://github.com/beeper/mcp-remote',
    staticOAuthClientMetadata,
    staticOAuthClientInfo,
    authorizeResource,
  })

  // Create the STDIO transport for local connections
  const localTransport = new StdioServerTransport()

  // Keep track of the server instance for cleanup
  let server: any = null

  // Define an auth initializer function
  const authInitializer = async () => {
    const authState = await authCoordinator.initializeAuth()

    // Store server in outer scope for cleanup
    server = authState.server

    // If auth was completed by another instance, just log that we'll use the auth from disk
    if (authState.skipBrowserAuth) {
      log('Authentication was completed by another instance - will use tokens from disk')
    }

    return {
      waitForAuthCode: authState.waitForAuthCode,
      skipBrowserAuth: authState.skipBrowserAuth,
    }
  }

  try {
    // Connect to remote server with lazy authentication
    const remoteTransport = await connectToRemoteServer(
      null,
      serverUrl,
      authProvider,
      headers,
      authInitializer,
      transportStrategy,
      authTimeoutMs,
    )

    // Set up bidirectional proxy between local and remote transports
    mcpProxy({
      transportToClient: localTransport,
      transportToServer: remoteTransport,
      ignoredTools,
    })

    // Start the local STDIO server
    await localTransport.start()
    log('Local STDIO server running')
    log(`Proxy established successfully between local STDIO and remote ${remoteTransport.constructor.name}`)
    log('Press Ctrl+C to exit')

    // Setup cleanup handler
    const cleanup = async () => {
      await remoteTransport.close()
      await localTransport.close()
      // Only close the server if it was initialized
      if (server) {
        server.close()
      }
    }
    setupSignalHandlers(cleanup)
  } catch (error) {
    log('Fatal error:', error)
    if (error instanceof Error && error.message.includes('self-signed certificate in certificate chain')) {
      log(`You may be behind a VPN!

If you are behind a VPN, you can try setting the NODE_EXTRA_CA_CERTS environment variable to point
to the CA certificate file. If using claude_desktop_config.json, this might look like:

{
  "mcpServers": {
    "\${mcpServerName}": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://remote.mcp.server/sse"
      ],
      "env": {
        "NODE_EXTRA_CA_CERTS": "\${your CA certificate file path}.pem"
      }
    }
  }
}
        `)
    }
    // Only close the server if it was initialized
    if (server) {
      server.close()
    }
    process.exit(1)
  }
}

// Parse command-line arguments and run the proxy with sensible defaults
const userArgs = process.argv.slice(2)

// Default URL: ${BEEPER_DESKTOP_BASE_URL ?? http://localhost:23373}/v0/mcp
const baseUrl = (process.env.BEEPER_DESKTOP_BASE_URL || 'http://localhost:23373').replace(/\/$/, '')
const defaultServerUrl = `${baseUrl}/v0/mcp`

// If no server URL is provided (or first arg is a flag), inject the default URL as the first arg
const firstArg = userArgs[0]
const needsDefaultUrl = !firstArg || firstArg.startsWith('-') || !(firstArg.startsWith('http://') || firstArg.startsWith('https://'))
const processedArgs = needsDefaultUrl ? [defaultServerUrl, ...userArgs] : userArgs

parseCommandLineArgs(processedArgs, 'Usage: npx tsx proxy.ts <https://server-url> [callback-port] [--debug]')
  .then(
    ({
      serverUrl,
      callbackPort,
      headers,
      transportStrategy,
      host,
      debug,
      staticOAuthClientMetadata,
      staticOAuthClientInfo,
      authorizeResource,
      ignoredTools,
      authTimeoutMs,
      client,
      userSpecifiedTransport,
      userSpecifiedStaticOAuthClientMetadata,
    }) => {
      // Defaults only when not explicitly provided
      const effectiveTransportStrategy = userSpecifiedTransport ? transportStrategy : ('http-only' as TransportStrategy)
      const effectiveStaticOAuthClientMetadata: StaticOAuthClientMetadata =
        userSpecifiedStaticOAuthClientMetadata || staticOAuthClientMetadata
          ? staticOAuthClientMetadata
          : ({ scope: 'read write' } as StaticOAuthClientMetadata)

      return runProxy(
        serverUrl,
        callbackPort,
        headers,
        effectiveTransportStrategy,
        host,
        client,
        effectiveStaticOAuthClientMetadata,
        staticOAuthClientInfo,
        authorizeResource,
        ignoredTools,
        authTimeoutMs,
      )
    },
  )
  .catch((error) => {
    log('Fatal error:', error)
    process.exit(1)
  })
