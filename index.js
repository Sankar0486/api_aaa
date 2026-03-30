// backend/index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth');
const childRoutes = require('./routes/children');
const syncRoutes = require('./routes/sync');
const inventoryRoutes = require('./routes/inventory');
const maternalRoutes = require('./routes/maternal');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const vaccinationRoutes = require('./routes/vaccinations');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] } });

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
  socket.on('join_center', (centerId) => socket.join(centerId));
});
app.set('socketio', io);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/maternal', maternalRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vaccinations', vaccinationRoutes);

async function initDb() {
  try {
    console.log('Initializing database...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    for (const s of schema.split(';').filter(x => x.trim())) await pool.query(s);

    const seed = fs.readFileSync(path.join(__dirname, 'seed_data.sql'), 'utf8');
    for (const s of seed.split(';').filter(x => x.trim())) {
      if (!s.toLowerCase().includes('insert into users')) await pool.query(s);
    }

    // Add some default vaccinations if none exist
    const [existingVac] = await pool.query('SELECT COUNT(*) as count FROM vaccinations');
    if (existingVac[0].count === 0) {
        console.log('Seeding default vaccinations...');
        // Seed for children (IDs 1, 2 typically from seed_data)
        await pool.query("INSERT INTO vaccinations (childId, vaccineName, dueDate) VALUES (1, 'BCG', '2025-01-01'), (1, 'OPV-1', '2025-02-01'), (2, 'Hepatitis B', '2025-01-15')");
        // Seed for pregnant women (ID 1)
        await pool.query("INSERT INTO vaccinations (womanId, vaccineName, dueDate) VALUES (1, 'TT-1', '2025-03-01'), (1, 'TT-2', '2025-04-01')");
    }

    const users = [
      { id: 'u1', email: 'staff@example.com',  pass: 'password123', name: 'Sarah Johnson', role: 'staff',  center: 'CENTER01' },
      { id: 'u2', email: 'admin@example.com',  pass: 'admin123',    name: 'Admin User',   role: 'admin',  center: 'CENTER01' },
      { id: 'u3', email: 'parent@example.com', pass: 'parent123',   name: 'Parent User',  role: 'parent', center: 'CENTER01' },
    ];
    for (const u of users) {
      const hashed = await bcrypt.hash(u.pass, 10);
      await pool.query('DELETE FROM users WHERE email=?', [u.email]);
      await pool.query(
        'INSERT INTO users (id, email, password, name, role, centerId) VALUES (?,?,?,?,?,?)',
        [u.id, u.email, hashed, u.name, u.role, u.center]
      );
    }

    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM children');
    console.log(`\n✅ Database ready — ${count} children\n`);
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

initDb();
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
