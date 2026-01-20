import crypto from 'node:crypto'

const SHARE_SECRET = process.env.SHARE_SECRET || 'dev-share-secret'
const TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7일

function b64url(input) {
  return Buffer.from(input).toString('base64url')
}

function hmac(data) {
  return crypto.createHmac('sha256', SHARE_SECRET).update(data).digest('base64url')
}

export function signShareToken({ menuKey, domain }) {
  const payload = {
    menuKey,
    domain,
    exp: Date.now() + TTL_MS,
  }
  const body = b64url(JSON.stringify(payload))
  const sig = hmac(body)
  return `${body}.${sig}`
}

export function verifyShareToken(token) {
  const [body, sig] = String(token || '').split('.')
  if (!body || !sig) return null

  const expected = hmac(body)
  if (sig !== expected) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload?.menuKey || !payload?.domain || !payload?.exp) return null
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}
