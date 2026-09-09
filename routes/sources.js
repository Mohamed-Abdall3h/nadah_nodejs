const express = require('express');
const db = require('../db/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM sources ORDER BY sort_order ASC').all();
  let subscribedIds = new Set();
  if (req.user) {
    const subs = db.prepare('SELECT source_id FROM user_subscriptions WHERE user_id = ?').all(req.user.id);
    subscribedIds = new Set(subs.map(s => s.source_id));
  }
  res.json({
    sources: rows.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      color: s.color,
      initials: s.initials,
      isSubscribed: subscribedIds.has(s.id),
    })),
  });
});

router.post('/:id/subscribe', requireAuth, (req, res) => {
  const source = db.prepare('SELECT id FROM sources WHERE id = ?').get(req.params.id);
  if (!source) return res.status(404).json({ error: 'المصدر غير موجود' });
  db.prepare('INSERT OR IGNORE INTO user_subscriptions (user_id, source_id) VALUES (?, ?)')
    .run(req.user.id, req.params.id);
  res.json({ subscribed: true });
});

router.delete('/:id/subscribe', requireAuth, (req, res) => {
  db.prepare('DELETE FROM user_subscriptions WHERE user_id = ? AND source_id = ?')
    .run(req.user.id, req.params.id);
  res.json({ subscribed: false });
});

module.exports = router;
