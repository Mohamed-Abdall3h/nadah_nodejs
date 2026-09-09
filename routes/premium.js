const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const FEATURES = [
  'إزالة الإعلانات بالكامل',
  'محتوى حصري ومميز',
  'الوصول إلى جميع المصادر',
  'تجربة استخدام سلسة وسريعة',
  'تجربة قراءة مميزة',
];

router.get('/plans', (req, res) => {
  const rows = db.prepare('SELECT * FROM premium_plans').all();
  res.json({
    features: FEATURES,
    plans: rows.map(p => ({
      id: p.id,
      period: p.period,
      price: p.price,
      originalPrice: p.original_price,
      savingLabel: p.saving_label,
      isFeatured: !!p.is_featured,
    })),
  });
});

router.post('/subscribe', requireAuth, (req, res) => {
  const { planId } = req.body || {};
  const plan = db.prepare('SELECT * FROM premium_plans WHERE id = ?').get(planId);
  if (!plan) return res.status(404).json({ error: 'الخطة غير موجودة' });

  const expiresAt = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO premium_purchases (user_id, plan_id, price_paid, expires_at) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, plan.id, plan.price, expiresAt);

  db.prepare('UPDATE users SET is_premium = 1, premium_expires_at = ? WHERE id = ?')
    .run(expiresAt, req.user.id);

  res.json({ isPremium: true, premiumExpiresAt: expiresAt, plan: { id: plan.id, period: plan.period, price: plan.price } });
});

module.exports = router;
