// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [[{ totalChildren }]] = await pool.query('SELECT COUNT(*) as totalChildren FROM children');
    const [[{ activeCenters }]] = await pool.query('SELECT COUNT(*) as activeCenters FROM centers WHERE isActive = 1');
    const [[{ totalStaff }]] = await pool.query("SELECT COUNT(*) as totalStaff FROM users WHERE role = 'staff'");
    const [[{ totalMothers }]] = await pool.query('SELECT COUNT(*) as totalMothers FROM pregnant_women');

    const today = new Date().toISOString().slice(0, 10);
    const [[{ presentToday }]] = await pool.query(
      'SELECT COUNT(*) as presentToday FROM attendance WHERE DATE(date) = ? AND isPresentToday = 1', [today]
    );
    const [[{ markedToday }]] = await pool.query(
      'SELECT COUNT(*) as markedToday FROM attendance WHERE DATE(date) = ?', [today]
    );
    const attendanceRate = markedToday > 0 ? Math.round((presentToday / markedToday) * 100) : 0;

    const [lowStockItems] = await pool.query(
      'SELECT i.*, c.name as centerName FROM inventory i JOIN centers c ON i.centerId = c.id WHERE i.currentStock <= i.minThreshold'
    );
    const [centers] = await pool.query(
      `SELECT c.*, COUNT(ch.id) as childCount
       FROM centers c
       LEFT JOIN children ch ON ch.centerId = c.id
       GROUP BY c.id ORDER BY c.name ASC`
    );

    res.json({ totalChildren, activeCenters, totalStaff, totalMothers, attendanceRate, lowStockItems, centers });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// GET /api/admin/growth-analytics
router.get('/growth-analytics', async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT DATE_FORMAT(g.date, '%Y-%m') as month,
              ROUND(AVG(g.weight), 2) as avgWeight,
              ROUND(AVG(g.height), 2) as avgHeight,
              COUNT(DISTINCT g.childId) as childCount
       FROM growth_entries g
       GROUP BY month
       ORDER BY month ASC
       LIMIT 12`
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching growth analytics' });
  }
});

// GET /api/admin/inventory-overview
router.get('/inventory-overview', async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT i.*, c.name as centerName
       FROM inventory i
       JOIN centers c ON i.centerId = c.id
       ORDER BY c.name, i.itemType`
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching inventory overview' });
  }
});

module.exports = router;
