import { createHash } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'

const clients = new Map([
  ['claude-desktop', { name: 'Claude Desktop', returnTo: 'claude://' }],
  ['raycast', { name: 'Raycast', returnTo: 'raycast://' }],
])
export const baseUrl = (process.env.BEEPER_DESKTOP_BASE_URL || 'http://127.0.0.1:23373').replace(/\/$/, '')

const args = process.argv.slice(2)
const clientIndex = args.indexOf('--client')
const client = clients.get(clientIndex === -1 ? '' : (args.splice(clientIndex, 2)[1] ?? ''))
export const returnTo = client?.returnTo
if (!/^https?:\/\//.test(args[0] ?? '')) args.unshift(`${baseUrl}/v0/mcp`)

const fetchBlockedPorts = new Set([3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668, 6669, 6679, 6697, 10080])
if (!/^\d+$/.test(args[1] ?? '')) {
  let port = 3335 + (parseInt(createHash('md5').update(args[0]).digest('hex').slice(0, 4), 16) % 45816)
  if (fetchBlockedPorts.has(port)) {
    while (fetchBlockedPorts.has(port)) port++
    args.splice(1, 0, String(port))
  }
}

const metadata = {
  client_name: client?.name ?? 'Unknown MCP Client',
  client_uri: 'https://github.com/beeper/mcp-remote',
  scope: 'read write',
}

process.env.MCP_REMOTE_CONFIG_DIR ||= path.join(os.homedir(), '.beeper-mcp-auth')
process.argv = [
  ...process.argv.slice(0, 2),
  ...args,
  '--transport',
  'http-only',
  '--static-oauth-client-metadata',
  JSON.stringify(metadata),
]

const parent = process.ppid
setInterval(() => {
  try {
    process.kill(parent, 0)
  } catch {
    process.exit(0)
  }
}, 1000).unref()
