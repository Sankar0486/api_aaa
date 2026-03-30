// backend/routes/maternal.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/:centerId', async (req, res) => {
  try {
    const [women] = await pool.query(
      'SELECT * FROM pregnant_women WHERE centerId=? ORDER BY expectedDeliveryDate ASC', [req.params.centerId]);
    res.json(women);
  } catch { res.status(500).json({ message: 'Error fetching maternal records' }); }
});

router.post('/register', async (req, res) => {
  const { name, phone, address, centerId, expectedDeliveryDate, healthStatus } = req.body;
  if (!name || !centerId || !expectedDeliveryDate)
    return res.status(400).json({ message: 'name, centerId, expectedDeliveryDate required' });
  const reg = new Date().toISOString().slice(0, 10);
  try {
    const [result] = await pool.query(
      `INSERT INTO pregnant_women (name,phone,address,centerId,expectedDeliveryDate,healthStatus,registrationDate)
       VALUES (?,?,?,?,?,?,?)`,
      [name, phone||null, address||null, centerId, expectedDeliveryDate, healthStatus||null, reg]
    );
    const [rows] = await pool.query('SELECT * FROM pregnant_women WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ message: 'Error registering' }); }
});

router.put('/:id/distribute', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    await pool.query(
      'UPDATE pregnant_women SET hasReceivedCurrentMonthMix=1, lastDistributionDate=? WHERE id=?',
      [today, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM pregnant_women WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch { res.status(500).json({ message: 'Error updating distribution' }); }
});

router.put('/:id', async (req, res) => {
  const { healthStatus, notes } = req.body;
  try {
    await pool.query('UPDATE pregnant_women SET healthStatus=?, notes=? WHERE id=?',
      [healthStatus||null, notes||null, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM pregnant_women WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch { res.status(500).json({ message: 'Error updating record' }); }
});

module.exports = router;
