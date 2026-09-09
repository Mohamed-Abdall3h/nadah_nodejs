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

function getUserSets(userId) {
  if (!userId) return { favoriteIds: new Set(), savedIds: new Set() };
  const favs = db.prepare('SELECT article_id FROM favorites WHERE user_id = ?').all(userId);
  const saved = db.prepare('SELECT article_id FROM saved_articles WHERE user_id = ?').all(userId);
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
router.get('/', optionalAuth, (req, res) => {
  const { category, breaking, featured, search } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  const clauses = [];
  const params = {};
  if (category) { clauses.push('a.category_key = @category'); params.category = category; }
  if (breaking !== undefined) { clauses.push('a.is_breaking = @breaking'); params.breaking = breaking === 'true' ? 1 : 0; }
  if (featured !== undefined) { clauses.push('a.is_featured = @featured'); params.featured = featured === 'true' ? 1 : 0; }
  if (search) { clauses.push('a.title LIKE @search'); params.search = `%${search}%`; }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(`${BASE_QUERY} ${where} ORDER BY a.published_at DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });

  const { favoriteIds, savedIds } = getUserSets(req.user && req.user.id);
  res.json({ articles: rows.map(r => serializeArticle(r, favoriteIds, savedIds)) });
});

router.get('/breaking', optionalAuth, (req, res) => {
  const rows = db.prepare(`${BASE_QUERY} WHERE a.is_breaking = 1 ORDER BY a.published_at DESC`).all();
  const { favoriteIds, savedIds } = getUserSets(req.user && req.user.id);
  res.json({ articles: rows.map(r => serializeArticle(r, favoriteIds, savedIds)) });
});

router.get('/home', optionalAuth, (req, res) => {
  const rows = db.prepare(`${BASE_QUERY} WHERE a.is_breaking = 0 ORDER BY a.published_at DESC`).all();
  const { favoriteIds, savedIds } = getUserSets(req.user && req.user.id);
  res.json({ articles: rows.map(r => serializeArticle(r, favoriteIds, savedIds)) });
});

router.get('/:id', optionalAuth, (req, res) => {
  const row = db.prepare(`${BASE_QUERY} WHERE a.id = @id`).get({ id: req.params.id });
  if (!row) return res.status(404).json({ error: 'المقال غير موجود' });
  const { favoriteIds, savedIds } = getUserSets(req.user && req.user.id);
  res.json({ article: serializeArticle(row, favoriteIds, savedIds) });
});

module.exports = router;
