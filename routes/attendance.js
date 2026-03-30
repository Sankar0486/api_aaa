const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get attendance for a specific date (all children)
router.get('/date/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM attendance WHERE date = ? ORDER BY childId ASC',
      [date]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching attendance by date', err);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

// Get attendance history for a specific child
router.get('/child/:childId', async (req, res) => {
  const { childId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM attendance WHERE childId = ? ORDER BY date DESC',
      [childId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching attendance for child', err);
    res.status(500).json({ message: 'Error fetching child attendance' });
  }
});

// Mark / update attendance for a child on a given date
router.post('/', async (req, res) => {
  const { childId, date, isPresentToday, notes } = req.body;
  if (!childId || !date) {
    return res.status(400).json({ message: 'childId and date are required' });
  }

  try {
    await pool.query(
      'INSERT INTO attendance (childId, date, isPresentToday, notes) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE isPresentToday = VALUES(isPresentToday), notes = VALUES(notes)',
      [childId, date, isPresentToday ? 1 : 0, notes || null]
    );

    const [rows] = await pool.query(
      'SELECT * FROM attendance WHERE childId = ? AND DATE(date) = DATE(?) LIMIT 1',
      [childId, date]
    );

    const io = req.app.get('socketio');
    if (io) {
      io.to('CENTER01').emit('attendance_updated', { childId, date, isPresentToday });
    }

    res.status(200).json(rows[0] || { success: true });
  } catch (err) {
    console.error('Error marking attendance', err);
    res.status(500).json({ message: 'Error saving attendance' });
  }
});

module.exports = router;

