const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/vaccinations?childId=1 OR ?womanId=2
router.get('/', async (req, res) => {
  const { childId, womanId } = req.query;
  try {
    let query = 'SELECT * FROM vaccinations WHERE 1=1';
    let params = [];
    if (childId) {
      query += ' AND childId = ?';
      params.push(childId);
    } else if (womanId) {
      query += ' AND womanId = ?';
      params.push(womanId);
    } else {
        return res.status(400).json({ message: 'childId or womanId required' });
    }
    const [rows] = await pool.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching vaccinations' });
  }
});

// PUT /api/vaccinations/:id
router.put('/:id', async (req, res) => {
  const { isCompleted, completionDate } = req.body;
  try {
    await pool.query(
      'UPDATE vaccinations SET isCompleted = ?, completionDate = ? WHERE id = ?',
      [isCompleted ? 1 : 0, completionDate, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating vaccination' });
  }
});

module.exports = router;
