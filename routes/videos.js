const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

function serialize(v) {
  return { id:v.id,title:v.title,description:v.description,url:v.url,thumbnailUrl:v.thumbnail_url||'',
    categoryKey:v.category_key||'',sourceId:v.source_id||null,articleId:v.article_id||null,
    publishedAt:v.published_at };
}
router.get('/', optionalAuth, async (req,res,next)=>{
  try {
    const limit=Math.min(parseInt(req.query.limit)||50,100), offset=parseInt(req.query.offset)||0;
    const args=[]; const where=[];
    if(req.query.category){where.push('v.category_key=?');args.push(req.query.category);}
    if(req.query.search){where.push('(v.title LIKE ? OR v.description LIKE ?)');args.push(`%${req.query.search}%`,`%${req.query.search}%`);}
    const rows=await db.all(`SELECT v.* FROM videos v ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY v.published_at DESC LIMIT ? OFFSET ?`,[...args,limit,offset]);
    res.json({videos:rows.map(serialize)});
  } catch(e){next(e)}
});
router.get('/:id', optionalAuth, async(req,res,next)=>{
  try { const v=await db.get('SELECT * FROM videos WHERE id=?',[req.params.id]); if(!v)return res.status(404).json({error:'الفيديو غير موجود'}); res.json({video:serialize(v)}); } catch(e){next(e)}
});
module.exports=router;
