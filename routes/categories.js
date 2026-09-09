const express = require('express');
const db = require('../db/database');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const rows = await db.all('SELECT * FROM categories ORDER BY sort_order ASC');
    res.json({
      categories: rows.map(c => ({ id: c.id, name: c.name, icon: c.icon, color: c.color })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
