const express=require('express');
const crypto=require('crypto');
const db=require('../db/database');
const {requireAuth}=require('../middleware/auth');
const router=express.Router();
router.use(requireAuth);

router.get('/', async(req,res,next)=>{
  try {
    const rows=await db.all(`SELECT n.id,n.title,n.body,n.article_id,n.created_at,COALESCE(un.is_read,0) AS is_read FROM notifications n LEFT JOIN user_notifications un ON un.notification_id=n.id AND un.user_id=? ORDER BY n.created_at DESC LIMIT 100`,[req.user.id]);
    res.json({notifications:rows.map(n=>({id:n.id,title:n.title,body:n.body,articleId:n.article_id||null,isRead:!!n.is_read,createdAt:n.created_at}))});
  } catch(e){next(e)}
});
router.post('/:id/read',async(req,res,next)=>{try{
  const n=await db.get('SELECT id FROM notifications WHERE id=?',[req.params.id]); if(!n)return res.status(404).json({error:'الإشعار غير موجود'});
  await db.run(`INSERT INTO user_notifications(notification_id,user_id,is_read,read_at) VALUES(?,?,1,datetime('now')) ON CONFLICT(notification_id,user_id) DO UPDATE SET is_read=1,read_at=datetime('now')`,[req.params.id,req.user.id]);
  res.json({ok:true});
}catch(e){next(e)}});
module.exports=router;
