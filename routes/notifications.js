const express=require('express');
const db=require('../db/database');
const {requireAuth}=require('../middleware/auth');
const router=express.Router();
router.use(requireAuth);
router.get('/',async(req,res,next)=>{
 try{
  const rows=await db.all(`SELECT n.*, CASE WHEN nr.user_id IS NULL THEN 0 ELSE 1 END AS is_read
   FROM notifications n LEFT JOIN notification_reads nr ON nr.notification_id=n.id AND nr.user_id=?
   ORDER BY n.created_at DESC LIMIT 100`,[req.user.id]);
  res.json({notifications:rows.map(n=>({id:n.id,title:n.title,body:n.body,articleId:n.article_id||null,createdAt:n.created_at,isRead:!!n.is_read}))});
 }catch(e){next(e)}
});
router.post('/:id/read',async(req,res,next)=>{try{await db.run('INSERT OR IGNORE INTO notification_reads(notification_id,user_id) VALUES(?,?)',[req.params.id,req.user.id]);res.json({ok:true})}catch(e){next(e)}});
router.post('/read-all',async(req,res,next)=>{try{await db.run(`INSERT OR IGNORE INTO notification_reads(notification_id,user_id) SELECT id,? FROM notifications`,[req.user.id]);res.json({ok:true})}catch(e){next(e)}});
module.exports=router;
