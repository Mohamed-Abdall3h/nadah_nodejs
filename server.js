require('dotenv').config();
const express = require('express');
const cors = require('cors');

const db = require('./db/database');
const { seedIfEmpty } = require('./db/seed');

const authRoutes = require('./routes/auth');
const articlesRoutes = require('./routes/articles');
const categoriesRoutes = require('./routes/categories');
const sourcesRoutes = require('./routes/sources');
const premiumRoutes = require('./routes/premium');
const favoritesRoutes = require('./routes/favorites');
const savedRoutes = require('./routes/saved');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'نبض ليبيا API' }));

app.use('/api/auth', authRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/saved', savedRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'المسار غير موجود' }));

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

const PORT = process.env.PORT || 3000;

seedIfEmpty()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 نبض ليبيا API running on http://localhost:${PORT}`);
      console.log(`📦 DB: ${process.env.TURSO_DATABASE_URL ? 'Turso (remote, persistent)' : 'local file'}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

