import { Hono } from 'hono';
import { db } from './db.js';
import { createSession, revokeSession, getSessionUser, requireAuth } from './auth.js';
import * as argon2 from '@node-rs/argon2';
import { randomUUID } from 'crypto';
import { getRegistrationOptions, verifyRegistration, getAuthOptions, verifyAuth } from './webauthn.js';

export const authRouter = new Hono();

// In-memory challenge store (in production use Redis or DB)
const challengeStore = new Map<string, string>();

authRouter.post('/login/password', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email and password required' }, 400);

  // Note: For admins, password login is disabled per spec.
  const user = db.prepare(`SELECT * FROM users WHERE email = ? AND status = 'active'`).get(email.toLowerCase()) as any;
  if (!user || user.role === 'admin') {
    return c.json({ error: 'Invalid credentials or method not allowed' }, 401);
  }

  if (!user.password_hash) {
    return c.json({ error: 'Account does not have a password set' }, 401);
  }

  const valid = await argon2.verify(user.password_hash, password);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  createSession(c, user.id);
  return c.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// PASSKEY ENDPOINTS

authRouter.post('/passkeys/register-options', async (c) => {
  // Can be called by an authenticated user OR by someone with ADMIN_SETUP_TOKEN
  const { adminSetupToken, email } = await c.req.json().catch(() => ({ adminSetupToken: '', email: '' }));
  
  let user = getSessionUser(c);
  
  // If not authenticated, check if it's admin setup
  if (!user) {
    if (adminSetupToken && adminSetupToken === process.env.ADMIN_SETUP_TOKEN) {
      if (!email) return c.json({ error: 'Email required for admin setup' }, 400);
      user = db.prepare(`SELECT * FROM users WHERE email = ? AND role = 'admin'`).get(email.toLowerCase()) as any;
      if (!user) {
        // Create the admin user on the fly since they have the setup token
        const id = randomUUID();
        db.prepare(`
          INSERT INTO users (id, email, name, role, status)
          VALUES (?, ?, 'Admin', 'admin', 'active')
        `).run(id, email.toLowerCase());
        user = { id, email: email.toLowerCase(), name: 'Admin', role: 'admin' };
      }
    } else {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }

  const options = await getRegistrationOptions(user);
  challengeStore.set(`reg_${user.email}`, options.challenge);

  return c.json(options);
});

authRouter.post('/passkeys/register-verify', async (c) => {
  const { response, adminSetupToken, email } = await c.req.json();
  
  let user = getSessionUser(c);
  if (!user) {
    if (adminSetupToken && adminSetupToken === process.env.ADMIN_SETUP_TOKEN && email) {
      user = db.prepare(`SELECT * FROM users WHERE email = ? AND role = 'admin'`).get(email.toLowerCase()) as any;
    }
  }

  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const expectedChallenge = challengeStore.get(`reg_${user.email}`);
  if (!expectedChallenge) return c.json({ error: 'No active challenge' }, 400);

  let verification;
  try {
    verification = await verifyRegistration(user, response, expectedChallenge);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }

  if (verification.verified && verification.registrationInfo) {
    const { id: credentialID, publicKey: credentialPublicKey, counter } = verification.registrationInfo.credential;
    const pkBase64 = Buffer.from(credentialPublicKey).toString('base64');
    
    db.prepare(`
      INSERT INTO passkeys (id, user_id, credential_id, public_key, counter, transports)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(), 
      user.id, 
      credentialID, // this is already a base64url string in v14 
      pkBase64, 
      counter,
      response.response.transports ? response.response.transports.join(',') : null
    );

    challengeStore.delete(`reg_${user.email}`);
    
    // Log them in if they weren't already
    if (!getSessionUser(c)) {
      createSession(c, user.id);
    }

    return c.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }

  return c.json({ error: 'Verification failed' }, 400);
});

authRouter.post('/passkeys/login-options', async (c) => {
  const { email } = await c.req.json().catch(() => ({ email: '' }));
  if (!email) return c.json({ error: 'Email required' }, 400);

  const options = await getAuthOptions(email);
  challengeStore.set(`auth_${email.toLowerCase()}`, options.challenge);

  return c.json(options);
});

authRouter.post('/passkeys/login-verify', async (c) => {
  const { email, response } = await c.req.json();
  if (!email || !response) return c.json({ error: 'Email and response required' }, 400);

  const expectedChallenge = challengeStore.get(`auth_${email.toLowerCase()}`);
  if (!expectedChallenge) return c.json({ error: 'No active challenge' }, 400);

  const user = db.prepare(`SELECT * FROM users WHERE email = ? AND status = 'active'`).get(email.toLowerCase()) as any;
  if (!user) return c.json({ error: 'User not found' }, 404);

  // When verifying, we lookup by the id provided by the client (which is base64url)
  const passkey = db.prepare(`SELECT * FROM passkeys WHERE credential_id = ? AND user_id = ?`).get(response.id, user.id) as any;
  if (!passkey) return c.json({ error: 'Passkey not found' }, 404);

  let verification;
  try {
    verification = await verifyAuth(response, expectedChallenge, passkey);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }

  if (verification.verified && verification.authenticationInfo) {
    const { newCounter } = verification.authenticationInfo;
    db.prepare(`UPDATE passkeys SET counter = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newCounter, passkey.id);
    challengeStore.delete(`auth_${email.toLowerCase()}`);

    createSession(c, user.id);
    return c.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }

  return c.json({ error: 'Verification failed' }, 400);
});

authRouter.post('/signup/password', async (c) => {
  const { email, password, name } = await c.req.json();
  if (!email || !password || !name) return c.json({ error: 'Email, password, and name required' }, 400);

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email.toLowerCase());
  if (existing) return c.json({ error: 'Email already registered' }, 400);

  const hash = await argon2.hash(password);
  const id = randomUUID();
  
  db.prepare(`
    INSERT INTO users (id, email, name, role, status, password_hash)
    VALUES (?, ?, ?, 'student', 'active', ?)
  `).run(id, email.toLowerCase(), name, hash);

  createSession(c, id);
  return c.json({ success: true, user: { id, email: email.toLowerCase(), name, role: 'student' } });
});

// LOGOUT & ME

authRouter.post('/logout', (c) => {
  revokeSession(c);
  return c.json({ success: true });
});

authRouter.post('/logout-all', requireAuth, (c) => {
  const user = c.get('user');
  db.prepare(`UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ?`).run(user.id);
  revokeSession(c);
  return c.json({ success: true });
});

authRouter.get('/me', (c) => {
  const user = getSessionUser(c);
  return c.json({ user });
});
