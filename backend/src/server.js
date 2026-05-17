import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import connectDB  from './db/db.js';
import authRoutes     from './routes/auth.js';
import adminRoutes    from './routes/admin.js';
import paymentRoutes  from './routes/payments.js';
import memberRoutes        from './routes/member.js';
import announcementRoutes from './routes/announcements.js';
import familyRoutes   from './routes/familyTree.js';

// ── Connect to MongoDB ───────────────────────────────────────
connectDB();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  
  origin: true,   // allow ALL origins — works for any device, any network
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}]  ${req.method}  ${req.path}`);
  next();
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/member',        memberRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/family-tree',  familyRoutes);

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:  'ok',
    service: 'MUS Welfare API',
    time:    new Date().toISOString(),
  });
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ── Global Error Handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  🟢  MUS Welfare API is running`);
  console.log(`  ➜   http://localhost:${PORT}`);
  console.log(`  ➜   Health: http://localhost:${PORT}/api/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
export default app;