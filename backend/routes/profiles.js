const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/profiles
router.get('/', (req, res) => {
  const profiles = db.prepare('SELECT * FROM profiles ORDER BY name').all();
  res.json(profiles);
});

// POST /api/profiles
router.post('/', (req, res) => {
  const { name, birthdate, avatar_id = 1 } = req.body;
  if (!name || !birthdate) return res.status(400).json({ error: 'name och birthdate krävs' });

  const result = db.prepare(
    'INSERT INTO profiles (name, birthdate, avatar_id) VALUES (?, ?, ?)'
  ).run(name, birthdate, avatar_id);

  db.prepare(
    'INSERT INTO profile_stats (profile_id) VALUES (?)'
  ).run(result.lastInsertRowid);

  res.status(201).json({ id: result.lastInsertRowid, name, birthdate, avatar_id });
});

// PUT /api/profiles/:id
router.put('/:id', (req, res) => {
  const { name, birthdate, avatar_id } = req.body;
  db.prepare(
    'UPDATE profiles SET name=?, birthdate=?, avatar_id=? WHERE id=?'
  ).run(name, birthdate, avatar_id, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/profiles/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM profiles WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/profiles/:id/stats
router.get('/:id/stats', (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE id=?').get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profil hittades inte' });

  const stats = db.prepare('SELECT * FROM profile_stats WHERE profile_id=?').get(req.params.id);
  const badges = db.prepare(`
    SELECT b.*, pb.earned_at
    FROM badges b
    JOIN profile_badges pb ON pb.badge_id = b.id
    WHERE pb.profile_id = ?
    ORDER BY pb.earned_at DESC
  `).all(req.params.id);

  const recentSessions = db.prepare(`
    SELECT s.*, e.title, e.subject
    FROM sessions s
    JOIN exercises e ON e.id = s.exercise_id
    WHERE s.profile_id = ?
    ORDER BY s.completed_at DESC
    LIMIT 10
  `).all(req.params.id);

  const subjectStats = db.prepare(`
    SELECT e.subject,
           COUNT(*) as sessions_count,
           AVG(CAST(s.score AS REAL)/s.max_score*100) as avg_score,
           SUM(s.score) as correct_total
    FROM sessions s
    JOIN exercises e ON e.id = s.exercise_id
    WHERE s.profile_id = ? AND s.max_score > 0
    GROUP BY e.subject
  `).all(req.params.id);

  // Beräkna ålder
  const today = new Date();
  const birth = new Date(profile.birthdate);
  const age = Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));

  res.json({ profile: { ...profile, age }, stats, badges, recentSessions, subjectStats });
});

module.exports = router;
