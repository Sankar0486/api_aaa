// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Read from .env, ensure fallback is consistent
const JWT_SECRET = process.env.JWT_SECRET || 'anganwadi_secret_key_2024';

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No authorization token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log(`Login attempt for: ${email}`); // Debug log

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [users] = await pool.query(
      'SELECT u.*, c.name as centerName FROM users u LEFT JOIN centers c ON u.centerId = c.id WHERE u.email = ?',
      [email]
    );

    const user = users[0];
    if (!user) {
      console.log('User not found in database');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role, centerId: user.centerId }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Clean up user object before sending
    const userData = { ...user };
    delete userData.password;
    
    // Ensure dates are stringified correctly for Flutter
    if (userData.createdAt instanceof Date) {
      userData.createdAt = userData.createdAt.toISOString();
    }

    console.log(`Login successful for user: ${user.name} (${user.role})`);
    res.json({ 
      token, 
      user: userData 
    });

  } catch (err) {
    console.error('Database Login error:', err);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// GET /api/auth/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT u.*, c.name as centerName FROM users u LEFT JOIN centers c ON u.centerId = c.id WHERE u.id = ?',
      [req.user.id]
    );
    
    const user = users[0];
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    const userData = { ...user };
    delete userData.password;
    if (userData.createdAt instanceof Date) {
      userData.createdAt = userData.createdAt.toISOString();
    }

    res.json({ user: userData });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

module.exports = router;
