import { db } from './db.js';
import { randomUUID } from 'crypto';

export function seed() {
  db.prepare(`DELETE FROM items`).run();
  db.prepare(`DELETE FROM users`).run();

  const adminId = randomUUID();
  const student1Id = randomUUID();
  const student2Id = randomUUID();

  const defaultPasswordHash = '$argon2id$v=19$m=19456,t=2,p=1$9eHclClPMTeS/bCIB2JfbQ$6Q2W6kClkQeD4C+SPOKp790tWw/38yYa68TJzTXwH0I';

  // Create Users
  db.prepare(`
    INSERT INTO users (id, email, name, role, status, password_hash) VALUES (?, ?, ?, ?, ?, ?)
  `).run(adminId, 'admin@demo.edu', 'Admin User', 'admin', 'active', defaultPasswordHash);

  db.prepare(`
    INSERT INTO users (id, email, name, role, status, password_hash) VALUES (?, ?, ?, ?, ?, ?)
  `).run(student1Id, 'student1@demo.edu', 'Student One', 'student', 'active', defaultPasswordHash);

  db.prepare(`
    INSERT INTO users (id, email, name, role, status, password_hash) VALUES (?, ?, ?, ?, ?, ?)
  `).run(student2Id, 'student2@demo.edu', 'Student Two', 'student', 'active', defaultPasswordHash);

  // Create Items
  const itemId1 = randomUUID();
  db.prepare(`
    INSERT INTO items (id, kind, name, description, category, location, contact_type, contact_value, status, posted_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(itemId1, 'lost', 'Blue Backpack', 'Contains my laptop and notebooks', 'Bags', 'Library', 'email', 'student1@demo.edu', 'open', student1Id);

  const itemId2 = randomUUID();
  db.prepare(`
    INSERT INTO items (id, kind, name, description, category, location, contact_type, contact_value, verification_hint, status, posted_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(itemId2, 'found', 'AirPods Pro', 'Found near the cafeteria', 'Electronics', 'Cafeteria', 'email', 'student2@demo.edu', 'Serial ends in 1234', 'open', student2Id);

  console.log('Database seeded with demo data.');
  if (process.env.NODE_ENV !== 'production') {
    console.log('Demo Credentials:');
    console.log('Admin: admin@demo.edu');
    console.log('Student 1: student1@demo.edu');
    console.log('Student 2: student2@demo.edu');
  }
}

seed();
