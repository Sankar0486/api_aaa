// backend/routes/inventory.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/:centerId', async (req, res) => {
  try {
    const [items] = await pool.query(
      'SELECT * FROM inventory WHERE centerId=? ORDER BY itemType', [req.params.centerId]);
    res.json(items);
  } catch (err) { res.status(500).json({ message: 'Error fetching inventory' }); }
});

router.post('/update', async (req, res) => {
  const { centerId, itemType, currentStock, minThreshold, notes } = req.body;
  if (!centerId || !itemType || currentStock == null)
    return res.status(400).json({ message: 'centerId, itemType, currentStock required' });
  try {
    await pool.query(
      `INSERT INTO inventory (centerId, itemType, currentStock, minThreshold, notes)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         currentStock=VALUES(currentStock),
         minThreshold=COALESCE(VALUES(minThreshold), minThreshold),
         notes=VALUES(notes)`,
      [centerId, itemType, currentStock, minThreshold ?? 0, notes || null]
    );
    const [rows] = await pool.query(
      'SELECT * FROM inventory WHERE centerId=? AND itemType=?', [centerId, itemType]);
    const io = req.app.get('socketio');
    if (io) io.to(centerId).emit('inventory_updated', rows[0]);
    res.json(rows[0] || { success: true });
  } catch (err) { res.status(500).json({ message: 'Error updating inventory' }); }
});

module.exports = router;
