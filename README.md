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

## الخطوة القادمة
بعد التأكد من أن التطبيق يعمل بالكامل عبر هذا الباك اند، الخطوة التالية هي بناء
**لوحة تحكم (Dashboard)** لإدارة المقالات والمصادر والمستخدمين والاشتراكات من متصفح الويب.
