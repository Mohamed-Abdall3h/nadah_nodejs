const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, s.name AS source_name
    FROM favorites f
    JOIN articles a ON a.id = f.article_id
    LEFT JOIN sources s ON s.id = a.source_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user.id);

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
});

router.post('/:articleId', (req, res) => {
  const article = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.articleId);
  if (!article) return res.status(404).json({ error: 'المقال غير موجود' });
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, article_id) VALUES (?, ?)')
    .run(req.user.id, req.params.articleId);
  res.json({ isFavorite: true });
});

router.delete('/:articleId', (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND article_id = ?')
    .run(req.user.id, req.params.articleId);
  res.json({ isFavorite: false });
});

module.exports = router;
