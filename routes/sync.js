const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/push', async (req, res) => {
  const { userId, centerId, data } = req.body;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Sync Children
    if (data.children && data.children.length > 0) {
      for (const child of data.children) {
        await connection.query(
          'INSERT INTO children (id, centerId, name, dob) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, dob=?',
          [child.id, centerId, child.name, child.dob, child.name, child.dob]
        );
      }
    }

    // Sync Growth Entries
    if (data.growth_entries && data.growth_entries.length > 0) {
      for (const entry of data.growth_entries) {
        await connection.query(
          'INSERT INTO growth_entries (childId, date, height, weight, present) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE height=?, weight=?, present=?',
          [entry.childId, entry.date, entry.height, entry.weight, entry.present, entry.height, entry.weight, entry.present]
        );
      }
    }

    // Sync Attendance
    if (data.attendance && data.attendance.length > 0) {
      for (const att of data.attendance) {
        await connection.query(
          'INSERT INTO attendance (childId, date, isPresentToday, notes) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE isPresentToday=?, notes=?',
          [att.childId, att.date, att.isPresentToday, att.notes, att.isPresentToday, att.notes]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Sync successful' });
  } catch (err) {
    await connection.rollback();
    console.error('Sync error:', err);
    res.status(500).json({ success: false, message: 'Sync failed' });
  } finally {
    connection.release();
  }
});

router.get('/pull/:centerId', async (req, res) => {
    const { centerId } = req.params;
    try {
        const [children] = await pool.query('SELECT * FROM children WHERE centerId = ?', [centerId]);
        const [growth] = await pool.query('SELECT g.* FROM growth_entries g JOIN children c ON g.childId = c.id WHERE c.centerId = ?', [centerId]);
        const [attendance] = await pool.query('SELECT a.* FROM attendance a JOIN children c ON a.childId = c.id WHERE c.centerId = ?', [centerId]);
        const [inventory] = await pool.query('SELECT * FROM inventory WHERE centerId = ?', [centerId]);
        const [maternal] = await pool.query('SELECT * FROM pregnant_women WHERE centerId = ?', [centerId]);

        res.json({
            children,
            growth_entries: growth,
            attendance,
            inventory,
            pregnant_women: maternal
        });
    } catch (err) {
        res.status(500).json({ message: 'Pull failed' });
    }
});

module.exports = router;
