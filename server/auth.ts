import { randomBytes, createHash } from 'crypto';
import { db } from './db.js';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context } from 'hono';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(c: Context, userId: string) {
  const sessionId = randomBytes(32).toString('hex');
  const idHash = hashToken(sessionId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  db.prepare(`
    INSERT INTO sessions (id_hash, user_id, expires_at, ip, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).run(idHash, userId, expiresAt.toISOString(), c.req.header('x-forwarded-for') || '', c.req.header('user-agent') || '');

  setCookie(c, 'session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    expires: expiresAt,
    path: '/',
  });
}

export function revokeSession(c: Context) {
  const sessionId = getCookie(c, 'session_id');
  if (sessionId) {
    const idHash = hashToken(sessionId);
    db.prepare(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id_hash = ?`).run(idHash);
    deleteCookie(c, 'session_id');
  }
}

export function getSessionUser(c: Context) {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) return null;

  const idHash = hashToken(sessionId);
  const session = db.prepare(`
    SELECT sessions.*, users.id as uid, users.email, users.name, users.role, users.status
    FROM sessions
    JOIN users ON sessions.user_id = users.id
    WHERE sessions.id_hash = ? AND sessions.revoked_at IS NULL AND sessions.expires_at > CURRENT_TIMESTAMP
  `).get(idHash) as any;

  if (!session || session.status === 'disabled') {
    return null;
  }

  // Sliding expiration (update if less than 3 days left)
  const expiresAt = new Date(session.expires_at);
  if (expiresAt.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000) {
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    db.prepare(`UPDATE sessions SET expires_at = ? WHERE id_hash = ?`).run(newExpiresAt.toISOString(), idHash);
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      expires: newExpiresAt,
      path: '/',
    });
  }

  return {
    id: session.uid,
    email: session.email,
    name: session.name,
    role: session.role,
    status: session.status
  };
}

export function requireAuth(c: Context, next: () => Promise<void>) {
  const user = getSessionUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('user', user);
  return next();
}

export function requireAdmin(c: Context, next: () => Promise<void>) {
  const user = getSessionUser(c);
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  c.set('user', user);
  return next();
}
