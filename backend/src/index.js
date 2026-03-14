const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const journalRoutes = require('./routes/journal');

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per 15 minutes per IP
  message: { error: 'Too many requests, please try again after 15 minutes.' }
});

const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 analyze requests per minute
  message: { error: 'Too many analysis requests, please wait a minute.' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/', limiter);
app.use('/api/journal/analyze', analyzeLimiter);

// Routes
app.use('/api/journal', journalRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'ArvyaX Journal API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});