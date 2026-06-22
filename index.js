const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public'));  // ← ici

const pool = require('./db');
const authRoutes = require('./routes/auth');
const articlesRoutes = require('./routes/articles');

app.use('/api/auth', authRoutes);
app.use('/api/articles', articlesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});