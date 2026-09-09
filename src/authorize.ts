import { EventEmitter } from 'node:events'
import realOpen from 'open'
import { baseUrl, returnTo } from './setup'

const authorizeInApp = async (url: URL) => {
  const q = url.searchParams
  const scope = q.get('scope') || 'read write'
  const scopes = scope.split(' ').filter(Boolean)
  const state = q.get('state')
  const callback = new URL(q.get('redirect_uri') ?? '')
  if (state) callback.searchParams.set('state', state)
  try {
    const res = await fetch(`${url.origin}/oauth/authorize/callback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'oauth2',
        clientInfo: { clientID: q.get('client_id') },
        scopes: scopes.includes('read') ? scopes : ['read', ...scopes],
        redirectUri: callback.origin + callback.pathname,
        scope,
        ...(state && { state }),
        ...(q.get('code_challenge') && {
          codeChallenge: q.get('code_challenge'),
          codeChallengeMethod: q.get('code_challenge_method') || 'S256',
        }),
        ...(q.get('resource') && { resource: q.get('resource') }),
      }),
    })
    const data = (await res.json()) as { code?: string; error?: string | { message?: string } }
    if (data.code) callback.searchParams.set('code', data.code)
    else callback.searchParams.set('error', typeof data.error === 'string' ? data.error : 'access_denied')
  } catch {
    callback.searchParams.set('error', 'server_error')
  }
  if (callback.protocol === 'http:' || callback.protocol === 'https:') await fetch(callback)
  else await realOpen(callback.toString())
  if (callback.searchParams.has('code') && returnTo) await realOpen(returnTo)
}

export default function open(target: string, options?: Parameters<typeof realOpen>[1]) {
  const url = new URL(target)
  if (url.origin !== new URL(baseUrl).origin || url.pathname !== '/oauth/authorize' || !url.searchParams.get('redirect_uri'))
    return realOpen(target, options)
  const helper = new EventEmitter()
  void authorizeInApp(url)
  setImmediate(() => helper.emit('exit', 0))
  return Promise.resolve(helper as unknown as Awaited<ReturnType<typeof realOpen>>)
}
