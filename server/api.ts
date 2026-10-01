import { Hono } from 'hono';
import { getSessionUser, requireAuth, requireAdmin } from './auth.js';
import { db } from './db.js';
import { randomUUID } from 'crypto';

export const apiRouter = new Hono();

apiRouter.use('*', async (c, next) => {
  const user = getSessionUser(c);
  if (user) c.set('user', user);
  await next();
});

apiRouter.get('/items', (c) => {
  const user = c.get('user');
  const items = db.prepare(`SELECT * FROM items WHERE status != 'removed' ORDER BY created_at DESC`).all() as any[];
  
  const mapped = items.map(i => {
    const isOwner = user && user.id === i.posted_by;
    const isAdmin = user && user.role === 'admin';
    let canSeeContact = isOwner || isAdmin;
    
    // Check if the user has an approved claim for this item
    if (!canSeeContact && user) {
      const claim = db.prepare(`SELECT status FROM claims WHERE item_id = ? AND claimant_id = ? AND status = 'approved'`).get(i.id, user.id) as any;
      if (claim) canSeeContact = true;
    }
    
    return {
      ...i,
      contact_value: canSeeContact ? i.contact_value : null,
      verification_hint: i.verification_hint // Now public, as it acts as the "Questions" for Found items
    };
  });
  
  return c.json({ items: mapped });
});

apiRouter.get('/items/:id', (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const item = db.prepare(`SELECT * FROM items WHERE id = ? AND status != 'removed'`).get(id) as any;
  if (!item) return c.json({ error: 'Not found' }, 404);
  
  let canSeeContact = (user && user.id === item.posted_by) || (user && user.role === 'admin');
  if (!canSeeContact && user) {
    const claim = db.prepare(`SELECT status FROM claims WHERE item_id = ? AND claimant_id = ? AND status = 'approved'`).get(item.id, user.id) as any;
    if (claim) canSeeContact = true;
  }
  
  return c.json({
    ...item,
    contact_value: canSeeContact ? item.contact_value : null
  });
});

apiRouter.post('/items', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  if (user.role === 'student') {
    const maxActive = parseInt(process.env.MAX_ACTIVE_POSTS || '1', 10);
    const count = db.prepare(`SELECT count(*) as count FROM items WHERE posted_by = ? AND status IN ('open', 'pending_claim')`).get(user.id) as { count: number };
    if (count.count >= maxActive) return c.json({ error: 'Post limit reached' }, 403);
  }
  
  const id = randomUUID();
  try {
    db.prepare(`
      INSERT INTO items (id, kind, name, description, category, location, image_url, contact_type, contact_value, verification_hint, posted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, body.kind || body.type, body.name, body.description, body.category, body.location, body.imageUrl || body.image_url, body.contactType || body.contact_type, body.contactValue || body.contactInfo, body.verificationHint || null, user.id
    );
    return c.json({ success: true, id }, 201);
  } catch (err: any) {
    return c.json({ error: 'Invalid data' }, 400);
  }
});

// Admin ONLY Item Edit/Delete
apiRouter.put('/items/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  try {
    db.prepare(`
      UPDATE items SET name=?, description=?, category=?, location=?, image_url=?, status=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(body.name, body.description, body.category, body.location, body.image_url || body.imageUrl, body.status, id);
    return c.json({ success: true });
  } catch {
    return c.json({ error: 'Update failed' }, 400);
  }
});

apiRouter.delete('/items/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  db.prepare(`UPDATE items SET status='removed', updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(id);
  return c.json({ success: true });
});

// Claims System
apiRouter.post('/items/:id/claim', requireAuth, async (c) => {
  const user = c.get('user');
  const itemId = c.req.param('id');
  const body = await c.req.json();
  
  const item = db.prepare(`SELECT * FROM items WHERE id = ? AND status = 'open'`).get(itemId) as any;
  if (!item) return c.json({ error: 'Item not available for claim' }, 400);
  if (item.posted_by === user.id) return c.json({ error: 'Cannot claim your own item' }, 400);

  const existing = db.prepare(`SELECT id FROM claims WHERE item_id = ? AND claimant_id = ? AND status = 'pending'`).get(itemId, user.id);
  if (existing) return c.json({ error: 'Claim already pending' }, 400);

  const claimId = randomUUID();
  try {
    // If it's a 'found' item, the claimant must provide answers_text.
    // If it's a 'lost' item, the claimant must provide evidence_image_url (as base64 or url).
    db.prepare(`
      INSERT INTO claims (id, item_id, claimant_id, answers_text, evidence_text, evidence_image_url, claimant_student_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      claimId, 
      itemId, 
      user.id, 
      body.answers || null, 
      body.evidence_text || 'Submitted via portal', 
      body.evidence_image_url || null, 
      body.student_id || 'UNKNOWN'
    );
    
    // Lock item
    db.prepare(`UPDATE items SET status = 'pending_claim' WHERE id = ?`).run(itemId);
    
    return c.json({ success: true, claimId });
  } catch (err: any) {
    return c.json({ error: 'Failed to create claim' }, 400);
  }
});

apiRouter.get('/claims', requireAuth, (c) => {
  const user = c.get('user');
  let claims;
  
  if (user.role === 'admin') {
    claims = db.prepare(`
      SELECT c.*, i.name as item_name, i.kind as item_kind, i.verification_hint, u.email as claimant_email, u.name as claimant_name 
      FROM claims c 
      JOIN items i ON c.item_id = i.id 
      JOIN users u ON c.claimant_id = u.id
      ORDER BY c.created_at DESC
    `).all();
  } else {
    claims = db.prepare(`
      SELECT c.*, i.name as item_name, i.kind as item_kind 
      FROM claims c 
      JOIN items i ON c.item_id = i.id 
      WHERE c.claimant_id = ? 
      ORDER BY c.created_at DESC
    `).all(user.id);
  }
  return c.json({ claims });
});

apiRouter.post('/claims/:id/resolve', requireAdmin, async (c) => {
  const user = c.get('user');
  const claimId = c.req.param('id');
  const { action, note } = await c.req.json(); // action: 'approve' | 'reject'
  
  const claim = db.prepare(`SELECT * FROM claims WHERE id = ?`).get(claimId) as any;
  if (!claim || claim.status !== 'pending') return c.json({ error: 'Invalid claim' }, 400);

  if (action === 'approve') {
    db.transaction(() => {
      db.prepare(`UPDATE claims SET status = 'approved', reviewed_by = ?, review_note = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(user.id, note || '', claimId);
      db.prepare(`UPDATE items SET status = 'recovered', recovered_at = CURRENT_TIMESTAMP, recovered_claim_id = ? WHERE id = ?`).run(claimId, claim.item_id);
      // Auto-reject other pending claims for this item
      db.prepare(`UPDATE claims SET status = 'rejected', review_note = 'Another claim was approved' WHERE item_id = ? AND id != ? AND status = 'pending'`).run(claim.item_id, claimId);
    })();
  } else if (action === 'reject') {
    db.transaction(() => {
      db.prepare(`UPDATE claims SET status = 'rejected', reviewed_by = ?, review_note = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(user.id, note || '', claimId);
      db.prepare(`UPDATE items SET status = 'open' WHERE id = ?`).run(claim.item_id);
    })();
  } else {
    return c.json({ error: 'Invalid action' }, 400);
  }
  
  return c.json({ success: true });
});
