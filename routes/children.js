// backend/routes/children.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { classifyNutrition, predictGrowth } = require('../ai_engine');

// GET /api/children/:centerId
router.get('/:centerId', async (req, res) => {
  if (['growth'].includes(req.params.centerId)) return res.status(404).json({});
  try {
    const [children] = await pool.query(
      'SELECT * FROM children WHERE centerId = ? ORDER BY name ASC', [req.params.centerId]
    );
    res.json(children);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching children' });
  }
});

// GET /api/children/growth/date/:date
router.get('/growth/date/:date', async (req, res) => {
  try {
    const [entries] = await pool.query(
      'SELECT * FROM growth_entries WHERE DATE(date) = ? ORDER BY childId ASC', [req.params.date]
    );
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching growth entries' });
  }
});

// GET /api/children/:childId/growth
router.get('/:childId/growth', async (req, res) => {
  try {
    const [entries] = await pool.query(
      'SELECT * FROM growth_entries WHERE childId = ? ORDER BY date DESC', [req.params.childId]
    );
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching growth history' });
  }
});

// POST /api/children/growth
router.post('/growth', async (req, res) => {
  const { childId, date, height, weight, present } = req.body;
  if (!childId || !date || height == null || weight == null)
    return res.status(400).json({ message: 'Required fields missing' });

  try {
    // 1. Get Child DOB to calculate age for AI
    const [children] = await pool.query('SELECT dob FROM children WHERE id = ?', [childId]);
    if (children.length === 0) return res.status(404).json({ message: 'Child not found' });
    
    const dob = new Date(children[0].dob);
    const ageInMonths = (new Date().getFullYear() - dob.getFullYear()) * 12 + (new Date().getMonth() - dob.getMonth());

    // 2. RUN AI CLASSIFICATION
    const { status, suggestions } = classifyNutrition(height, weight, ageInMonths);

    // 3. RUN AI PREDICTION (based on history)
    const [history] = await pool.query('SELECT weight, date FROM growth_entries WHERE childId = ? ORDER BY date DESC LIMIT 5', [childId]);
    const prediction = predictGrowth([{ weight, date }, ...history]);

    // 4. SAVE TO DATABASE (Updated schema with status/prediction/suggestions)
    await pool.query(
      `INSERT INTO growth_entries (childId, date, height, weight, present, status, prediction, suggestions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       height=VALUES(height), weight=VALUES(weight), present=VALUES(present), 
       status=VALUES(status), prediction=VALUES(prediction), suggestions=VALUES(suggestions)`,
      [childId, date, height, weight, present ? 1 : 0, status, prediction, suggestions]
    );

    const [rows] = await pool.query(
      'SELECT * FROM growth_entries WHERE childId=? AND date=? LIMIT 1', [childId, date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving growth entry with AI analysis' });
  }
});

module.exports = router;
