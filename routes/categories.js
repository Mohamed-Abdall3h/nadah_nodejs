const express = require('express');
const db = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  res.json({
    categories: rows.map(c => ({ id: c.id, name: c.name, icon: c.icon, color: c.color })),
  });
});

module.exports = router;
