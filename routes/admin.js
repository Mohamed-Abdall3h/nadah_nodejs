const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();
router.use(requireAdmin);

router.get('/stats', async (req, res, next) => {
  try {
    const [users, articles, premium, favorites, saved, purchases] = await Promise.all([
      db.get('SELECT COUNT(*) AS count FROM users'),
      db.get('SELECT COUNT(*) AS count FROM articles'),
      db.get('SELECT COUNT(*) AS count FROM users WHERE is_premium=1 AND (premium_expires_at IS NULL OR premium_expires_at > datetime(\'now\'))'),
      db.get('SELECT COUNT(*) AS count FROM favorites'),
      db.get('SELECT COUNT(*) AS count FROM saved_articles'),
      db.get('SELECT COALESCE(SUM(price_paid),0) AS total FROM premium_purchases'),
    ]);
    res.json({ users: users.count, articles: articles.count, premiumUsers: premium.count, favorites: favorites.count, saved: saved.count, revenue: purchases.total });
  } catch (e) { next(e); }
});

router.get('/users', async (req,res,next)=>{
  try {
    const rows = await db.all('SELECT id,name,email,role,is_premium,premium_expires_at,created_at FROM users ORDER BY created_at DESC');
    res.json({users: rows.map(u=>({...u,isPremium:!!u.is_premium}))});
  } catch(e){next(e)}
});

router.patch('/users/:id', async(req,res,next)=>{
  try {
    const { isPremium, role } = req.body || {};
    const sets=[], args=[];
    if (isPremium !== undefined) { sets.push('is_premium=?'); args.push(isPremium?1:0); if (!isPremium) {sets.push('premium_expires_at=NULL')} }
    if (role && ['user','admin'].includes(role)) { sets.push('role=?'); args.push(role); }
    if (!sets.length) return res.status(400).json({error:'لا توجد تغييرات'});
    args.push(req.params.id);
    await db.run(`UPDATE users SET ${sets.join(', ')} WHERE id=?`,args);
    res.json({ok:true});
  } catch(e){next(e)}
});

router.delete('/users/:id', async(req,res,next)=>{
  try { await db.run('DELETE FROM users WHERE id=? AND role != \'admin\'',[req.params.id]); res.json({ok:true}); } catch(e){next(e)}
});

router.get('/articles', async(req,res,next)=>{
  try {
    const rows=await db.all(`SELECT a.*, s.name AS source_name FROM articles a LEFT JOIN sources s ON s.id=a.source_id ORDER BY a.published_at DESC`);
    res.json({articles:rows.map(a=>({...a,isBreaking:!!a.is_breaking,isFeatured:!!a.is_featured,source:a.source_name||null}))});
  } catch(e){next(e)}
});

router.post('/articles', async(req,res,next)=>{
  try {
    const {title,body,categoryKey,categoryName,sourceId,imageUrl,isBreaking,isFeatured}=req.body||{};
    if(!title||!categoryKey||!categoryName) return res.status(400).json({error:'العنوان والتصنيف مطلوبان'});
    const id=crypto.randomUUID();
    await db.run(`INSERT INTO articles (id,title,body,category_key,category_name,source_id,image_url,is_breaking,is_featured) VALUES (?,?,?,?,?,?,?,?,?)`,[id,title,body||'',categoryKey,categoryName,sourceId||null,imageUrl||'',isBreaking?1:0,isFeatured?1:0]);
    res.status(201).json({id});
  } catch(e){next(e)}
});

router.patch('/articles/:id', async(req,res,next)=>{
  try {
    const map={title:'title',body:'body',categoryKey:'category_key',categoryName:'category_name',sourceId:'source_id',imageUrl:'image_url',isBreaking:'is_breaking',isFeatured:'is_featured'};
    const sets=[],args=[];
    for(const [k,col] of Object.entries(map)) if(req.body[k]!==undefined){sets.push(`${col}=?`);args.push(['isBreaking','isFeatured'].includes(k)?(req.body[k]?1:0):req.body[k]);}
    if(!sets.length)return res.status(400).json({error:'لا توجد تغييرات'});
    args.push(req.params.id); await db.run(`UPDATE articles SET ${sets.join(', ')} WHERE id=?`,args); res.json({ok:true});
  }catch(e){next(e)}
});

router.delete('/articles/:id', async(req,res,next)=>{try{await db.run('DELETE FROM articles WHERE id=?',[req.params.id]);res.json({ok:true})}catch(e){next(e)}});

router.get('/categories', async(req,res,next)=>{try{res.json({categories:await db.all('SELECT * FROM categories ORDER BY sort_order ASC')})}catch(e){next(e)}});
router.post('/categories', async(req,res,next)=>{try{const {id,name,icon='apps_rounded',color='#1565C0'}=req.body||{};if(!id||!name)return res.status(400).json({error:'المعرف والاسم مطلوبان'});await db.run('INSERT INTO categories (id,name,icon,color,sort_order) VALUES (?,?,?,?,?)',[id,name,icon,color,999]);res.status(201).json({ok:true})}catch(e){next(e)}});
router.patch('/categories/:id', async(req,res,next)=>{try{const {name,icon,color,sortOrder}=req.body||{};await db.run('UPDATE categories SET name=COALESCE(?,name),icon=COALESCE(?,icon),color=COALESCE(?,color),sort_order=COALESCE(?,sort_order) WHERE id=?',[name,icon,color,sortOrder,req.params.id]);res.json({ok:true})}catch(e){next(e)}});
router.delete('/categories/:id', async(req,res,next)=>{try{await db.run('DELETE FROM categories WHERE id=?',[req.params.id]);res.json({ok:true})}catch(e){next(e)}});

router.get('/sources', async(req,res,next)=>{try{res.json({sources:await db.all('SELECT * FROM sources ORDER BY sort_order ASC')})}catch(e){next(e)}});
router.post('/sources', async(req,res,next)=>{try{const {id,name,type='منصة رقمية',color='#1565C0',initials='؟'}=req.body||{};if(!id||!name)return res.status(400).json({error:'المعرف والاسم مطلوبان'});await db.run('INSERT INTO sources (id,name,type,color,initials,sort_order) VALUES (?,?,?,?,?,?)',[id,name,type,color,initials,999]);res.status(201).json({ok:true})}catch(e){next(e)}});
router.patch('/sources/:id', async(req,res,next)=>{try{const {name,type,color,initials,sortOrder}=req.body||{};await db.run('UPDATE sources SET name=COALESCE(?,name),type=COALESCE(?,type),color=COALESCE(?,color),initials=COALESCE(?,initials),sort_order=COALESCE(?,sort_order) WHERE id=?',[name,type,color,initials,sortOrder,req.params.id]);res.json({ok:true})}catch(e){next(e)}});
router.delete('/sources/:id', async(req,res,next)=>{try{await db.run('DELETE FROM sources WHERE id=?',[req.params.id]);res.json({ok:true})}catch(e){next(e)}});


router.get('/videos', async(req,res,next)=>{try{const rows=await db.all('SELECT * FROM videos ORDER BY published_at DESC');res.json({videos:rows})}catch(e){next(e)}});
router.post('/videos', async(req,res,next)=>{
 try{const {title,description,url,thumbnailUrl,categoryKey,sourceId,articleId}=req.body||{};
  if(!title||!url)return res.status(400).json({error:'عنوان الفيديو والرابط مطلوبان'});
  const id=crypto.randomUUID();
  await db.run(`INSERT INTO videos(id,title,description,url,thumbnail_url,category_key,source_id,article_id) VALUES(?,?,?,?,?,?,?,?)`,
   [id,title,description||'',url,thumbnailUrl||'',categoryKey||null,sourceId||null,articleId||null]);
  res.status(201).json({id});
 }catch(e){next(e)}
});
router.patch('/videos/:id',async(req,res,next)=>{try{
 const map={title:'title',description:'description',url:'url',thumbnailUrl:'thumbnail_url',categoryKey:'category_key',sourceId:'source_id',articleId:'article_id'};
 const sets=[],args=[];for(const [k,c] of Object.entries(map))if(req.body[k]!==undefined){sets.push(`${c}=?`);args.push(req.body[k]);}
 if(!sets.length)return res.status(400).json({error:'لا توجد تغييرات'});args.push(req.params.id);
 await db.run(`UPDATE videos SET ${sets.join(', ')} WHERE id=?`,args);res.json({ok:true});
}catch(e){next(e)}});
router.delete('/videos/:id',async(req,res,next)=>{try{await db.run('DELETE FROM videos WHERE id=?',[req.params.id]);res.json({ok:true})}catch(e){next(e)}});

router.get('/notifications',async(req,res,next)=>{try{res.json({notifications:await db.all('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100')})}catch(e){next(e)}});
router.post('/notifications',async(req,res,next)=>{try{
 const {title,body,articleId}=req.body||{}; if(!title||!body)return res.status(400).json({error:'العنوان والنص مطلوبان'});
 const r=await db.run('INSERT INTO notifications(title,body,article_id) VALUES(?,?,?)',[title,body,articleId||null]);
 res.status(201).json({id:r.lastInsertRowid});
}catch(e){next(e)}});
router.delete('/notifications/:id',async(req,res,next)=>{try{await db.run('DELETE FROM notifications WHERE id=?',[req.params.id]);res.json({ok:true})}catch(e){next(e)}});


module.exports = router;
