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

router.get('/plans', async (req, res, next) => {
  try {
    const rows = await db.all('SELECT * FROM premium_plans');
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
  } catch (err) {
    next(err);
  }
});

router.post('/subscribe', requireAuth, async (req, res, next) => {
  try {
    const { planId } = req.body || {};
    const plan = await db.get('SELECT * FROM premium_plans WHERE id = ?', [planId]);
    if (!plan) return res.status(404).json({ error: 'الخطة غير موجودة' });

    const expiresAt = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();

    await db.run(
      'INSERT INTO premium_purchases (user_id, plan_id, price_paid, expires_at) VALUES (?, ?, ?, ?)',
      [req.user.id, plan.id, plan.price, expiresAt]
    );

    await db.run(
      'UPDATE users SET is_premium = 1, premium_expires_at = ? WHERE id = ?',
      [expiresAt, req.user.id]
    );

    res.json({ isPremium: true, premiumExpiresAt: expiresAt, plan: { id: plan.id, period: plan.period, price: plan.price } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
