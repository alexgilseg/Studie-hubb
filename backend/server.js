const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serva frontend-filer
app.use(express.static(path.join(__dirname, '../frontend')));

// API-routes
app.use('/api/profiles',      require('./routes/profiles'));
app.use('/api/exercises',     require('./routes/exercises'));
app.use('/api/sessions',      require('./routes/sessions'));
app.use('/api/gamification',  require('./routes/gamification'));
app.use('/api/exams',         require('./routes/exams'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '2.0.0' }));

// Alla andra routes serveras av frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎓 Studie-hubb kör på http://localhost:${PORT}\n`);
});
