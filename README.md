# نبض ليبيا — Backend API

باك اند Node.js + Express + SQLite لتطبيق "نبض ليبيا" الإخباري (Flutter).

## المحتويات
- تسجيل دخول / تسجيل حساب بـ JWT (bcrypt لتشفير كلمة المرور)
- مقالات: عاجل، رئيسية، حسب القسم، بحث
- الأقسام (categories)
- المصادر الإخبارية + اشتراك/إلغاء اشتراك لكل مستخدم
- خطط بريميوم + شراء اشتراك
- المفضلة (favorites) والمحفوظات (saved) لكل مستخدم
- قاعدة بيانات SQLite محلية (ملف واحد، بدون سيرفر خارجي)

## التشغيل

```bash
cd backend
npm install
cp .env.example .env      # عدّل JWT_SECRET قبل الإنتاج
npm run seed               # يملأ القاعدة بنفس بيانات AppData في التطبيق
npm start                  # يشغل السيرفر على http://localhost:3000
```

للتطوير مع إعادة تشغيل تلقائية عند التعديل:
```bash
npm run dev
```

## نقاط النهاية (Endpoints)

كل الروابط تبدأ بـ `/api`.

### Auth
| Method | Path | وصف |
|---|---|---|
| POST | /auth/register | `{name, email, password}` → `{token, user}` |
| POST | /auth/login | `{email, password}` → `{token, user}` |
| GET  | /auth/me | يتطلب توكن، يرجع بيانات المستخدم الحالي |

### Articles
| Method | Path | وصف |
|---|---|---|
| GET | /articles/home | مقالات الشاشة الرئيسية |
| GET | /articles/breaking | الأخبار العاجلة |
| GET | /articles?category=&breaking=&featured=&search=&limit=&offset= | فلترة عامة |
| GET | /articles/:id | مقال واحد |

### Categories / Sources / Premium
| Method | Path | وصف |
|---|---|---|
| GET | /categories | كل الأقسام |
| GET | /sources | كل المصادر (يظهر isSubscribed لو مسجل دخول) |
| POST | /sources/:id/subscribe | اشتراك (يتطلب توكن) |
| DELETE | /sources/:id/subscribe | إلغاء اشتراك (يتطلب توكن) |
| GET | /premium/plans | خطط بريميوم + المزايا |
| POST | /premium/subscribe | `{planId}` شراء اشتراك (يتطلب توكن) |

### Favorites / Saved (تتطلب توكن)
| Method | Path |
|---|---|
| GET/POST/DELETE | /favorites, /favorites/:articleId |
| GET/POST/DELETE | /saved, /saved/:articleId |

التوكن يُرسل في الهيدر: `Authorization: Bearer <token>`

## الربط مع تطبيق Flutter

في `lib/services/api_client.dart` غيّر `ApiConfig.baseUrl` حسب بيئة التشغيل:
- محاكي أندرويد ← `http://10.0.2.2:3000/api`
- iOS Simulator / ويب / ديسكتوب على نفس الجهاز ← `http://localhost:3000/api`
- جهاز حقيقي على نفس الشبكة ← `http://<IP الجهاز الذي يشغّل الباك اند>:3000/api`
- إنتاج ← رابط الدومين الحقيقي بعد الرفع (Railway / Render / VPS...)

## الرفع مجانًا (Render + Turso)

الكومبينيشن دي مجانية 100% وبيانات دايمة (مش بتتصفّر):
- **Render** يشغّل السيرفر (Node.js) مجانًا، بس بينام بعد 15 دقيقة بدون استخدام
  ويستنى حوالي 50 ثانية أول ريكوست بعد النوم — عادي جدًا لمرحلة التجربة.
- **Turso** قاعدة بيانات SQLite مستضافة، فيها Free Tier سخي (100 قاعدة بيانات،
  5 GB تخزين) والبيانات فيها **دايمة** ومتأثرش بنوم أو إعادة نشر Render، لأنها
  مش على قرص السيرفر نفسه.

الكود دلوقتي بيستخدم مكتبة `@libsql/client`، فهي شغالة محليًا كملف SQLite
عادي، وبنفس الكود بالظبط تشتغل مع Turso لما تحط بيانات الاتصال في متغيرات
البيئة.

### الخطوات (كله من المتصفح، من غير Terminal خالص)

**1) اعمل قاعدة بيانات مجانية على Turso**
1. روح على turso.tech واعمل حساب مجاني (تقدر تسجل بحساب GitHub بضغطة واحدة)
2. من الداشبورد: Create Database → اختار اسم زي `nabdh-libya` → Create
3. هتظهرلك صفحة فيها:
   - **Database URL** (شكلها `libsql://nabdh-libya-xxxx.turso.io`)
   - لازم كمان تعمل **Create Token** عشان تاخد الـ Auth Token
   - احفظ الاتنين، هتحتاجهم بعد شوية

**2) ارفع مجلد `backend` على GitHub**
1. اعمل حساب مجاني على github.com لو معندكش
2. New Repository → اسمه أي حاجة زي `nabdh-libya-backend` → Create
3. من صفحة الريبو: "uploading an existing file" → اسحب مجلد `backend` كله
   (أو الملفات اللي جواه) وارفعه → Commit changes
   (معلش، مفيش حاجة اسمها Git أو Terminal في الخطوة دي — كله سحب وإفلات)

**3) شغّل السيرفر مجانًا على Render**
1. اعمل حساب مجاني على render.com (تقدر تسجل بـ GitHub برضه)
2. New → Web Service → اختار الريبو اللي عملته
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Instance Type: **Free**
7. تحت Environment Variables ضيف:
   - `JWT_SECRET` = أي نص عشوائي طويل (اكتب أي حاجة زي `mySecretKey12345!@#`)
   - `TURSO_DATABASE_URL` = اللي نسخته من الخطوة 1
   - `TURSO_AUTH_TOKEN` = اللي نسخته من الخطوة 1
8. Create Web Service

**وخلاص.** أول ما السيرفر يشتغل، هو نفسه هيلاحظ إن قاعدة البيانات فاضية
وهيملاها تلقائيًا بالمقالات والأقسام (نفس البيانات اللي كانت في التطبيق) —
مفيش أي خطوة يدوية زيادة، ومفيش حاجة اسمها `npm run seed` في الإنتاج.

Render هيديك رابط زي:
`https://nabdh-libya-backend.onrender.com`

**4) اربط تطبيق Flutter بالرابط الجديد**
في `lib/services/api_client.dart`:
```dart
static const String baseUrl = 'https://nabdh-libya-backend.onrender.com/api';
```

> ملحوظة: السيرفر المجاني في Render بينام بعد 15 دقيقة من غير استخدام،
> وأول طلب بعد النوم بياخد حوالي 50 ثانية لحد ما يصحى. طبيعي جدًا في مرحلة
> التجربة، ولو حبيت تمنع النوم ده لازم تترقّى لخطة مدفوعة ($7/شهر).

ملف `render.yaml` موجود في المشروع لو حبيت تستخدم "Blueprint" في Render
عشان يظبط الإعدادات دي تلقائيًا (هيسألك بس تدخل قيم الـ 3 متغيرات).

## الخطوة القادمة
بعد التأكد من أن التطبيق يعمل بالكامل عبر هذا الباك اند، الخطوة التالية هي بناء
**لوحة تحكم (Dashboard)** لإدارة المقالات والمصادر والمستخدمين والاشتراكات من متصفح الويب.
