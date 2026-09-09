const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const rows = await db.all(`
      SELECT a.*, s.name AS source_name
      FROM favorites f
      JOIN articles a ON a.id = f.article_id
      LEFT JOIN sources s ON s.id = a.source_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    res.json({
      articles: rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category_name,
        categoryKey: r.category_key,
        imageUrl: r.image_url,
        source: r.source_name || null,
        isBreaking: !!r.is_breaking,
        isFeatured: !!r.is_featured,
        isFavorite: true,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:articleId', async (req, res, next) => {
  try {
    const article = await db.get('SELECT id FROM articles WHERE id = ?', [req.params.articleId]);
    if (!article) return res.status(404).json({ error: 'المقال غير موجود' });
    await db.run(
      'INSERT OR IGNORE INTO favorites (user_id, article_id) VALUES (?, ?)',
      [req.user.id, req.params.articleId]
    );
    res.json({ isFavorite: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:articleId', async (req, res, next) => {
  try {
    await db.run(
      'DELETE FROM favorites WHERE user_id = ? AND article_id = ?',
      [req.user.id, req.params.articleId]
    );
    res.json({ isFavorite: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
