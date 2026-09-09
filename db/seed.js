const db = require('./database');

const categories = [
  { id: 'economy',  name: 'الاقتصاد',     icon: 'trending_up_rounded',      color: '#1565C0' },
  { id: 'politics', name: 'سياسة',        icon: 'account_balance_rounded',  color: '#4A148C' },
  { id: 'sports',   name: 'رياضة',        icon: 'sports_soccer_rounded',    color: '#1B5E20' },
  { id: 'misc',     name: 'منوعات',       icon: 'apps_rounded',             color: '#E65100' },
  { id: 'local',    name: 'محلي',         icon: 'location_on_rounded',      color: '#C62828' },
  { id: 'intl',     name: 'عربي ودولي',   icon: 'language_rounded',         color: '#006064' },
  { id: 'tech',     name: 'تقنية',        icon: 'memory_rounded',           color: '#1A237E' },
  { id: 'health',   name: 'صحة',          icon: 'favorite_rounded',         color: '#AD1457' },
  { id: 'culture',  name: 'ثقافة',        icon: 'menu_book_rounded',        color: '#4E342E' },
  { id: 'video',    name: 'فيديو',        icon: 'play_circle_fill_rounded', color: '#880E4F' },
];

const sources = [
  { id: 's1', name: 'قناة ليبيا الحدث',      type: 'قناة إخبارية', color: '#6A1B9A', initials: 'ح' },
  { id: 's2', name: 'التاسعة الإخبارية',     type: 'قناة إخبارية', color: '#B71C1C', initials: '٩' },
  { id: 's3', name: 'الأولى الإخبارية',      type: 'قناة إخبارية', color: '#1565C0', initials: '١' },
  { id: 's4', name: 'منصة بيان الإخبارية',   type: 'منصة رقمية',   color: '#2E7D32', initials: 'ب' },
  { id: 's5', name: 'الثامنة الإخبارية',     type: 'قناة إخبارية', color: '#0277BD', initials: '٨' },
  { id: 's6', name: 'الحدث Libya24',         type: 'قناة إخبارية', color: '#C62828', initials: '٢٤' },
  { id: 's7', name: 'ليبيا المستقبل',        type: 'منصة رقمية',   color: '#00695C', initials: 'م' },
];

const breakingArticles = [
  ['b1','المركزي الليبي يعلن عن إجراءات جديدة لضبط السوق المصرفية في ليبيا','اقتصاد','economy','https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_center.jpg',1,1],
  ['b2','وزارة النفط: زيادة في إنتاج النفط الخام خلال الشهر الجاري في ليبيا','اقتصاد','economy','https://commons.wikimedia.org/wiki/Special:FilePath/North_Sea_oil_rig.jpg',1,0],
  ['b3','الجيش الليبي يعلن عن عملية أمنية ناجحة في الجنوب الليبي','محلي','local','https://commons.wikimedia.org/wiki/Special:FilePath/Benghazi_city_centre.JPG',1,0],
  ['b4','هيئة الأرصاد: أمطار رعدية على عدة مناطق من ليبيا','حالة الطقس','weather','https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_by_night.jpg',1,0],
  ['b5','وزارة التعليم الليبي تعلن عن بداية الامتحانات النهائية للجامعات','تعليم','education','https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_center.jpg',1,0],
  ['b6','ارتفاع عدد السياح الوافدين إلى ليبيا هذا العام','سياحة','tourism','https://commons.wikimedia.org/wiki/Special:FilePath/Leptis_Magna,_Al-Khums,_Libya.jpg',1,0],
  ['b7','نائب القائد العام صدام حفتر يستقبل عميد بلدية براك الشاطئ في بنغازي','محلي','local','https://commons.wikimedia.org/wiki/Special:FilePath/Benghazi_city_centre.JPG',1,1],
  ['b8','موسى الكوني يستقبل وفدًا من مصراتة لبحث قضايا التوافق الوطني','محلي','local','https://commons.wikimedia.org/wiki/Special:FilePath/Misrata,_Libya.jpg',1,0],
  ['b9','الكتيبة 58 صاعقة تنفذ تدريبات بدنية مكثفة في شوارع بنغازي','أمن','security','https://commons.wikimedia.org/wiki/Special:FilePath/Benghazi_city_centre.JPG',1,0],
  ['b10','نائب القائد العام يهنئ المغرب بالتأهل إلى ربع نهائي كأس العالم','رياضة','sports','https://commons.wikimedia.org/wiki/Special:FilePath/11_June_Stadium_BenTaher.jpg',1,0],
  ['b11','نائب تركي يتهم وزير النقل بإخفاء وثائق تحقيق تحطم طائرة محمد الحداد','عربي ودولي','international','https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_by_night.jpg',1,0],
  ['b12','العائب يواصل مهامه على رأس جهاز المخابرات الليبي رغم قرار الإقالة','سياسة','politics','https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_center.jpg',1,1],
  ['b13','بعثة "إيريني" الأوروبية تشتبه في نقل أسلحة إلى ليبيا عبر 60 رحلة جوية سرية','عربي ودولي','international','https://commons.wikimedia.org/wiki/Special:FilePath/North_Sea_oil_rig.jpg',1,0],
  ['b14','حملة أمنية مشتركة في طرابلس وبنغازي لمداهمة مقار تؤوي مهاجرين غير نظاميين','محلي','local','https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_center.jpg',1,0],
  ['b15','محكمة استئناف سرت تعقد أولى جلساتها القضائية وتباشر اختصاصها رسميًا','محلي','local','https://commons.wikimedia.org/wiki/Special:FilePath/The_Old_Town,_Benghazi,_Libya.jpg',1,0],
  ['b16','تحذير من السباحة على طول الساحل الليبي بسبب اضطراب حركة البحر','حالة الطقس','weather','https://commons.wikimedia.org/wiki/Special:FilePath/Leptis_Magna,_Al-Khums,_Libya.jpg',1,0],
];

const homeArticles = [
  ['h1','مجلس النواب يخصص جلسة استثنائية لمناقشة ميزانية ليبيا لعام 2024','رئيسية','main',null,'https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_center.jpg',1],
  ['h2','المؤسسة الوطنية للنفط تعلن عن زيادة في معدلات الإنتاج','اقتصاد','economy','s1','https://commons.wikimedia.org/wiki/Special:FilePath/North_Sea_oil_rig.jpg',0],
  ['h3','منتخب ليبيا يتأهل إلى الدور النهائي من تصفيات كأس أفريقيا','رياضة','sports','s2','https://commons.wikimedia.org/wiki/Special:FilePath/11_June_Stadium_BenTaher.jpg',0],
  ['h4','طقس اليوم: أجواء مشمسة في معظم المناطق وارتفاع في درجات الحرارة','حالة الطقس','weather',null,'https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_by_night.jpg',0],
  ['h5','افتتاح مشروع تحلية المياه الجديد في بنغازي بحضور المسؤولين','محلي','local',null,'https://commons.wikimedia.org/wiki/Special:FilePath/The_Old_Town,_Benghazi,_Libya.jpg',0],
  ['h6','السفارة الأمريكية في طرابلس تصدر بيانات بشأن الوضع الأمني','عربي ودولي','international','s4','https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_by_night.jpg',0],
  ['h7','رئيس المخابرات الليبية يبحث مع نظيره المالطي التعاون الأمني المشترك','عربي ودولي','international',null,'https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_center.jpg',0],
  ['h8','مصادر: الدبيبة يبدي استياءه عقب إلغاء لقائه المرتقب مع أمير قطر','سياسة','politics','s1','https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_by_night.jpg',0],
  ['h9','نائب القائد العام يلتقي رئيس جهاز مكافحة المخدرات في بنغازي','محلي','local',null,'https://commons.wikimedia.org/wiki/Special:FilePath/Benghazi_city_centre.JPG',0],
  ['h10','عضو الحوار المهيكل: لقاءات دولية متتالية تعكس تحولًا في تعاطي المجتمع الدولي مع الملف الليبي','سياسة','politics','s2','https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_center.jpg',0],
  ['h11','مصر تبحث هاتفيًا مع الموفد الأمريكي مسعد بولس تطورات الأزمة الليبية','عربي ودولي','international','s4','https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_by_night.jpg',0],
  ['h12','رحلات جوية يومية مرتقبة قريبًا لربط مدينتي بنغازي وسبها','اقتصاد','economy',null,'https://commons.wikimedia.org/wiki/Special:FilePath/Benghazi_city_centre.JPG',0],
  ['h13','موسى الكوني لوفد مصراتة: يجب تغليب المصلحة الوطنية على الحسابات الضيقة','سياسة','politics',null,'https://commons.wikimedia.org/wiki/Special:FilePath/Misrata,_Libya.jpg',0],
  ['h14','عبدالعاطي لبولس: التسوية السياسية الشاملة تتطلب مسارًا ليبيًا-ليبيًا خالصًا','عربي ودولي','international',null,'https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_by_night.jpg',0],
  ['h15','الدبيبة يوجه بحل عاجل لأزمة انقطاع الكهرباء المتكررة في عدة مناطق','اقتصاد','economy',null,'https://commons.wikimedia.org/wiki/Special:FilePath/Tripoli_center.jpg',0],
  ['h16','رسميًا: موعد ثأري يجمع المغرب وفرنسا في أولى مواجهات ربع نهائي مونديال 2026','رياضة','sports',null,'https://commons.wikimedia.org/wiki/Special:FilePath/11_June_Stadium_BenTaher.jpg',0],
];

const premiumPlans = [
  { id: 'monthly',   period: 'شهرياً', price: 19,  original_price: null, saving_label: null,       is_featured: 0, duration_days: 30 },
  { id: 'yearly',    period: 'سنوياً', price: 199, original_price: 300,  saving_label: 'وفر %33',  is_featured: 1, duration_days: 365 },
  { id: 'quarterly', period: '3 أشهر', price: 49,  original_price: null, saving_label: null,       is_featured: 0, duration_days: 90 },
];

async function seed() {
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    await db.run(
      `INSERT OR REPLACE INTO categories (id,name,icon,color,sort_order) VALUES (?,?,?,?,?)`,
      [c.id, c.name, c.icon, c.color, i]
    );
  }

  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    await db.run(
      `INSERT OR REPLACE INTO sources (id,name,type,color,initials,sort_order) VALUES (?,?,?,?,?,?)`,
      [s.id, s.name, s.type, s.color, s.initials, i]
    );
  }

  for (const [id, title, categoryName, categoryKey, imageUrl, isBreaking, isFeatured] of breakingArticles) {
    await db.run(
      `INSERT OR REPLACE INTO articles (id,title,category_name,category_key,source_id,image_url,is_breaking,is_featured) VALUES (?,?,?,?,?,?,?,?)`,
      [id, title, categoryName, categoryKey, null, imageUrl, isBreaking, isFeatured]
    );
  }

  for (const [id, title, categoryName, categoryKey, sourceId, imageUrl, isFeatured] of homeArticles) {
    await db.run(
      `INSERT OR REPLACE INTO articles (id,title,category_name,category_key,source_id,image_url,is_breaking,is_featured) VALUES (?,?,?,?,?,?,?,?)`,
      [id, title, categoryName, categoryKey, sourceId, imageUrl, 0, isFeatured]
    );
  }

  for (const p of premiumPlans) {
    await db.run(
      `INSERT OR REPLACE INTO premium_plans (id,period,price,original_price,saving_label,is_featured,duration_days) VALUES (?,?,?,?,?,?,?)`,
      [p.id, p.period, p.price, p.original_price, p.saving_label, p.is_featured, p.duration_days]
    );
  }

  return {
    categories: categories.length,
    sources: sources.length,
    articles: breakingArticles.length + homeArticles.length,
    plans: premiumPlans.length,
  };
}

/// Seeds the database ONLY if it's empty (checked via the categories table).
/// Safe to call every time the server boots: on a fresh/empty database
/// (first deploy) it fills it in automatically; on a database that
/// already has data (including any edits made later from a dashboard),
/// it does nothing.
async function seedIfEmpty() {
  await db.init();
  const row = await db.get('SELECT COUNT(*) AS count FROM categories');
  const count = Number(row?.count ?? 0);
  if (count > 0) {
    console.log(`ℹ️  Database already has data (${count} categories) — skipping seed.`);
    return null;
  }
  console.log('🌱 Empty database detected — seeding initial data...');
  const summary = await seed();
  console.log('✅ Seed complete:', summary);
  return summary;
}

module.exports = { seed, seedIfEmpty };

// Allows `npm run seed` to still work as a manual one-off command.
if (require.main === module) {
  db.init()
    .then(seed)
    .then(summary => {
      console.log('✅ Seed complete:', summary);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}



async function seedVideos() {
  const exists = await db.get('SELECT id FROM videos LIMIT 1');
  if (exists) return;
  await db.run(`INSERT INTO videos(id,title,description,url,thumbnail_url,category_key,source_id) VALUES (?,?,?,?,?,?,?)`,[
    'demo-youtube-1','فيديو تجريبي - آخر أخبار ليبيا','فيديو تجريبي لاختبار تشغيل YouTube داخل التطبيق.','https://www.youtube.com/watch?v=dQw4w9WgXcQ','https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg','video','s1'
  ]);
}

async function ensureAdmin() {
  const bcrypt = require('bcryptjs');
  const email = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const password = process.env.ADMIN_PASSWORD || '123456';
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  const hash = bcrypt.hashSync(password, 10);
  if (existing) {
    await db.run("UPDATE users SET role='admin', password_hash=? WHERE id=?", [hash, existing.id]);
  } else {
    await db.run("INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,'admin')", ['Admin', email, hash]);
  }
}

module.exports.ensureAdmin = ensureAdmin;
module.exports.seedVideos = seedVideos;
