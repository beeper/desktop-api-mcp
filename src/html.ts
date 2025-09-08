import { ClientOption } from './lib/types'

export function renderHTML({ title = 'Beeper', body }: { title?: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="color-scheme" content="light dark">
  <style>
    :root {
      --color-base-white: rgb(255, 255, 255);
      --color-base-white-rgb: from var(--color-base-white) r g b;
      --color-base-black: rgb(0, 0, 0);
      --color-base-black-rgb: from var(--color-base-black) r g b;
      --color-base-gray-120: rgb(23, 23, 23);
      --color-base-gray-120-rgb: from var(--color-base-gray-120) r g b;

      --color-background-app: var(--color-base-white);
      --color-text-neutrals: var(--color-base-gray-120);
      --color-border-translucent: rgba(var(--color-base-black-rgb) / 0.1);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --color-base-gray-10: rgb(22, 22, 22);
        --color-base-gray-10-rgb: from var(--color-base-gray-10) r g b;
        --color-base-gray-120: rgb(237, 237, 237);
        --color-base-gray-120-rgb: from var(--color-base-gray-120) r g b;

        --color-background-app: var(--color-base-gray-10);
        --color-border-translucent: rgba(var(--color-base-white-rgb) / 0.1);
      }
    }
    * { box-sizing: border-box }
    html, body { height: 100% }
    body {
      margin: 0;
      background: var(--color-background-app);
      color: var(--color-text-neutrals);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif, 'Noto Color Emoji';
      display: grid;
      place-items: center;
    }
    .main { text-align: center; padding: 24px; }
    .message { font-size: 16px; }
    .hint { font-size: 13px; opacity: 0.7; margin-top: 8px; }
    .error { color: #f44336; }
  </style>
</head>
<body>
  <div class="main">${body}</div>
</body>
</html>`
}

export function createOAuthErrorHTML(message: string): string {
  return renderHTML({
    title: 'Invalid Request',
    body: `<h1>Invalid Request</h1><p>${message}</p>`,
  })
}

export function renderConnectionSuccess(client?: ClientOption): string {
  const scheme = client === 'claude-desktop' ? 'claude://' : client === 'raycast' ? 'raycast://' : undefined
  const clientDisplay = client === 'claude-desktop' ? 'Claude Desktop' : client === 'raycast' ? 'Raycast' : 'the MCP client'

  const redirectMeta = scheme ? `<meta http-equiv="refresh" content="0;url=${scheme}">` : ''
  const redirectScript = scheme ? `\n<script>\n  window.location.href = '${scheme}';\n  window.close();\n</script>` : ''
  const clientLink = scheme ? `<a href="${scheme}">${clientDisplay}</a>` : clientDisplay

  const body = `${redirectMeta}
<div class="message">
  <a href="beeper://">Beeper Desktop</a> is connected. You can now go back to ${clientLink}.
</div>${redirectScript}`

  return renderHTML({ title: 'Connection successful', body })
}
