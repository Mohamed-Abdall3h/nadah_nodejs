const express = require('express');
const db = require('../db/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const rows = await db.all('SELECT * FROM sources ORDER BY sort_order ASC');
    let subscribedIds = new Set();
    if (req.user) {
      const subs = await db.all('SELECT source_id FROM user_subscriptions WHERE user_id = ?', [req.user.id]);
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
  } catch (err) {
    next(err);
  }
});

router.post('/:id/subscribe', requireAuth, async (req, res, next) => {
  try {
    const source = await db.get('SELECT id FROM sources WHERE id = ?', [req.params.id]);
    if (!source) return res.status(404).json({ error: 'المصدر غير موجود' });
    await db.run(
      'INSERT OR IGNORE INTO user_subscriptions (user_id, source_id) VALUES (?, ?)',
      [req.user.id, req.params.id]
    );
    res.json({ subscribed: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/subscribe', requireAuth, async (req, res, next) => {
  try {
    await db.run(
      'DELETE FROM user_subscriptions WHERE user_id = ? AND source_id = ?',
      [req.user.id, req.params.id]
    );
    res.json({ subscribed: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
