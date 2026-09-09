const express = require('express');
const db = require('../db/database');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

function serialize(r) {
  return { id: r.id, title: r.title, description: r.description || '', url: r.url,
    thumbnailUrl: r.thumbnail_url || '', category: r.category_name || r.category_key || 'فيديو',
    source: r.source_name || null, articleId: r.article_id || null, publishedAt: r.published_at };
}

router.get('/', optionalAuth, async (req,res,next)=>{
  try {
    const rows=await db.all(`SELECT v.*, c.name AS category_name, s.name AS source_name FROM videos v LEFT JOIN categories c ON c.id=v.category_key LEFT JOIN sources s ON s.id=v.source_id ORDER BY v.published_at DESC`);
    res.json({videos: rows.map(serialize)});
  } catch(e){next(e)}
});

router.get('/:id', optionalAuth, async (req,res,next)=>{
  try { const r=await db.get(`SELECT v.*, c.name AS category_name, s.name AS source_name FROM videos v LEFT JOIN categories c ON c.id=v.category_key LEFT JOIN sources s ON s.id=v.source_id WHERE v.id=?`,[req.params.id]);
    if(!r)return res.status(404).json({error:'الفيديو غير موجود'}); res.json({video:serialize(r)});
  } catch(e){next(e)}
});
module.exports=router;
