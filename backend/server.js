const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

require('dotenv').config();

const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);

app.get('/', (req, res) => {
  res.send('Banana Runner API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});