const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { calculateXP, updateStreak, checkBadges } = require('./gamification');

// POST /api/sessions  — spara ett genomfört pass
router.post('/', (req, res) => {
  const { profile_id, exercise_id, score, max_score, duration_seconds, answers = [] } = req.body;
  if (!profile_id || !exercise_id) return res.status(400).json({ error: 'profile_id och exercise_id krävs' });

  const stats = db.prepare('SELECT * FROM profile_stats WHERE profile_id=?').get(profile_id);
  const exercise = db.prepare('SELECT * FROM exercises WHERE id=?').get(exercise_id);
  if (!exercise) return res.status(404).json({ error: 'Övning hittades inte' });

  // Beräkna XP
  const xp = calculateXP({ score, max_score, difficulty: exercise.difficulty, streak: stats?.streak_current || 0 });

  // Spara session
  const sessionResult = db.prepare(`
    INSERT INTO sessions (profile_id, exercise_id, score, max_score, xp_earned, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(profile_id, exercise_id, score, max_score, xp, duration_seconds || 0);

  const sessionId = sessionResult.lastInsertRowid;

  // Spara svar
  if (answers.length > 0) {
    const insertAnswer = db.prepare(`
      INSERT INTO session_answers (session_id, question_ref, answer_given, is_correct, time_ms)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertAll = db.transaction(() => {
      for (const a of answers) {
        insertAnswer.run(sessionId, String(a.question_ref), String(a.answer_given), a.is_correct ? 1 : 0, a.time_ms || 0);
      }
    });
    insertAll();
  }

  // Uppdatera streak och XP
  const streakResult = updateStreak(profile_id, stats);
  db.prepare(`
    UPDATE profile_stats
    SET xp_total       = xp_total + ?,
        level          = ?,
        streak_current = ?,
        streak_best    = MAX(streak_best, ?),
        last_active_date = date('now')
    WHERE profile_id = ?
  `).run(xp, calculateLevel(stats.xp_total + xp), streakResult.streak, streakResult.streak, profile_id);

  // Kolla och dela ut badges
  const newBadges = checkBadges(profile_id);

  res.status(201).json({
    session_id: sessionId,
    xp_earned: xp,
    streak: streakResult.streak,
    streak_bonus: streakResult.bonus,
    new_level: calculateLevel(stats.xp_total + xp),
    new_badges: newBadges
  });
});

// GET /api/sessions?profile_id=&subject=&limit=
router.get('/', (req, res) => {
  const { profile_id, subject, limit = 50, offset = 0 } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id krävs' });

  let sql = `
    SELECT s.*, e.title, e.subject, e.difficulty
    FROM sessions s
    JOIN exercises e ON e.id = s.exercise_id
    WHERE s.profile_id = ?
  `;
  const params = [profile_id];

  if (subject) { sql += ' AND e.subject=?'; params.push(subject); }

  sql += ' ORDER BY s.completed_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const sessions = db.prepare(sql).all(...params);
  const total = db.prepare(
    'SELECT COUNT(*) as c FROM sessions WHERE profile_id=?' + (subject ? ' AND exercise_id IN (SELECT id FROM exercises WHERE subject=?)' : '')
  ).get(...(subject ? [profile_id, subject] : [profile_id]));

  res.json({ sessions, total: total.c });
});

// GET /api/sessions/history/:profileId  — historik för grafer
router.get('/history/:profileId', (req, res) => {
  const { days = 30 } = req.query;

  const daily = db.prepare(`
    SELECT date(completed_at) as date,
           COUNT(*) as sessions,
           SUM(score) as correct,
           SUM(max_score) as total,
           SUM(xp_earned) as xp
    FROM sessions
    WHERE profile_id = ? AND completed_at >= date('now', ?)
    GROUP BY date(completed_at)
    ORDER BY date
  `).all(req.params.profileId, `-${days} days`);

  const bySubject = db.prepare(`
    SELECT e.subject,
           COUNT(*) as sessions,
           AVG(CAST(s.score AS REAL)/s.max_score*100) as avg_score,
           SUM(s.xp_earned) as xp
    FROM sessions s
    JOIN exercises e ON e.id = s.exercise_id
    WHERE s.profile_id = ? AND s.max_score > 0
    GROUP BY e.subject
  `).all(req.params.profileId);

  res.json({ daily, bySubject });
});

function calculateLevel(xp) {
  const thresholds = [0, 150, 400, 800, 1400, 2000, 3500, 5500, 8000, 12000];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
  }
  return level;
}

module.exports = router;
