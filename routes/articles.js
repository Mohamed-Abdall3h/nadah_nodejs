const express = require('express');
const db = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

function timeAgoLabel(isoDate) {
  const then = new Date(isoDate.includes('T') ? isoDate : isoDate.replace(' ', 'T') + 'Z');
  const diffMs = Date.now() - then.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

function serializeArticle(row, favoriteIds, savedIds) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category_name,
    categoryKey: row.category_key,
    time: timeAgoLabel(row.published_at),
    imageUrl: row.image_url,
    source: row.source_name || null,
    isBreaking: !!row.is_breaking,
    isFeatured: !!row.is_featured,
    isFavorite: favoriteIds ? favoriteIds.has(row.id) : false,
    isSaved: savedIds ? savedIds.has(row.id) : false,
  };
}

async function getUserSets(userId) {
  if (!userId) return { favoriteIds: new Set(), savedIds: new Set() };
  const favs = await db.all('SELECT article_id FROM favorites WHERE user_id = ?', [userId]);
  const saved = await db.all('SELECT article_id FROM saved_articles WHERE user_id = ?', [userId]);
  return {
    favoriteIds: new Set(favs.map(r => r.article_id)),
    savedIds: new Set(saved.map(r => r.article_id)),
  };
}

const BASE_QUERY = `
  SELECT a.*, s.name AS source_name
  FROM articles a
  LEFT JOIN sources s ON s.id = a.source_id
`;

// GET /api/articles?category=&breaking=&featured=&search=&limit=&offset=
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, breaking, featured, search } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const clauses = [];
    const args = [];
    if (category) { clauses.push('a.category_key = ?'); args.push(category); }
    if (breaking !== undefined) { clauses.push('a.is_breaking = ?'); args.push(breaking === 'true' ? 1 : 0); }
    if (featured !== undefined) { clauses.push('a.is_featured = ?'); args.push(featured === 'true' ? 1 : 0); }
    if (search) { clauses.push('a.title LIKE ?'); args.push(`%${search}%`); }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await db.all(
      `${BASE_QUERY} ${where} ORDER BY a.published_at DESC LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    const { favoriteIds, savedIds } = await getUserSets(req.user && req.user.id);
    res.json({ articles: rows.map(r => serializeArticle(r, favoriteIds, savedIds)) });
  } catch (err) {
    next(err);
  }
});

router.get('/breaking', optionalAuth, async (req, res, next) => {
  try {
    const rows = await db.all(`${BASE_QUERY} WHERE a.is_breaking = 1 ORDER BY a.published_at DESC`);
    const { favoriteIds, savedIds } = await getUserSets(req.user && req.user.id);
    res.json({ articles: rows.map(r => serializeArticle(r, favoriteIds, savedIds)) });
  } catch (err) {
    next(err);
  }
});

router.get('/home', optionalAuth, async (req, res, next) => {
  try {
    const rows = await db.all(`${BASE_QUERY} WHERE a.is_breaking = 0 ORDER BY a.published_at DESC`);
    const { favoriteIds, savedIds } = await getUserSets(req.user && req.user.id);
    res.json({ articles: rows.map(r => serializeArticle(r, favoriteIds, savedIds)) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const row = await db.get(`${BASE_QUERY} WHERE a.id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'المقال غير موجود' });
    const { favoriteIds, savedIds } = await getUserSets(req.user && req.user.id);
    res.json({ article: serializeArticle(row, favoriteIds, savedIds) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
