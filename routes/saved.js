const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, s.name AS source_name
    FROM saved_articles sv
    JOIN articles a ON a.id = sv.article_id
    LEFT JOIN sources s ON s.id = a.source_id
    WHERE sv.user_id = ?
    ORDER BY sv.created_at DESC
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
      isSaved: true,
    })),
  });
});

router.post('/:articleId', (req, res) => {
  const article = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.articleId);
  if (!article) return res.status(404).json({ error: 'المقال غير موجود' });
  db.prepare('INSERT OR IGNORE INTO saved_articles (user_id, article_id) VALUES (?, ?)')
    .run(req.user.id, req.params.articleId);
  res.json({ isSaved: true });
});

router.delete('/:articleId', (req, res) => {
  db.prepare('DELETE FROM saved_articles WHERE user_id = ? AND article_id = ?')
    .run(req.user.id, req.params.articleId);
  res.json({ isSaved: false });
});

module.exports = router;
