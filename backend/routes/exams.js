const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/exams?profile_id=
router.get('/', (req, res) => {
  const { profile_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id krävs' });

  const exams = db.prepare(`
    SELECT e.*,
           (SELECT COUNT(*) FROM exam_exercises ee WHERE ee.exam_id = e.id) as exercise_count,
           julianday(e.exam_date) - julianday('now') as days_until
    FROM exams e
    WHERE e.profile_id = ?
    ORDER BY e.exam_date ASC
  `).all(profile_id);

  // Beräkna beredskapspoäng för varje prov
  const examsWithReadiness = exams.map(exam => ({
    ...exam,
    readiness: calculateReadiness(exam.id, profile_id)
  }));

  res.json(examsWithReadiness);
});

// POST /api/exams
router.post('/', (req, res) => {
  const { profile_id, name, subject, exam_date, exercise_ids = [] } = req.body;
  if (!profile_id || !name || !subject || !exam_date) {
    return res.status(400).json({ error: 'profile_id, name, subject och exam_date krävs' });
  }

  const result = db.prepare(
    'INSERT INTO exams (profile_id, name, subject, exam_date) VALUES (?, ?, ?, ?)'
  ).run(profile_id, name, subject, exam_date);

  const examId = result.lastInsertRowid;

  if (exercise_ids.length > 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO exam_exercises (exam_id, exercise_id) VALUES (?, ?)');
    db.transaction(() => exercise_ids.forEach(eid => insert.run(examId, eid)))();
  }

  res.status(201).json({ id: examId });
});

// PUT /api/exams/:id
router.put('/:id', (req, res) => {
  const { name, subject, exam_date } = req.body;
  db.prepare(
    'UPDATE exams SET name=?, subject=?, exam_date=? WHERE id=?'
  ).run(name, subject, exam_date, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/exams/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM exams WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// PUT /api/exams/:id/exercises  — uppdatera kopplade övningar
router.put('/:id/exercises', (req, res) => {
  const { exercise_ids = [] } = req.body;
  db.prepare('DELETE FROM exam_exercises WHERE exam_id=?').run(req.params.id);
  if (exercise_ids.length > 0) {
    const insert = db.prepare('INSERT INTO exam_exercises (exam_id, exercise_id) VALUES (?, ?)');
    db.transaction(() => exercise_ids.forEach(eid => insert.run(req.params.id, eid)))();
  }
  res.json({ ok: true });
});

// GET /api/exams/:id  — prov med övningar och beredskap
router.get('/:id', (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id=?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Prov hittades inte' });

  const exercises = db.prepare(`
    SELECT ex.*
    FROM exercises ex
    JOIN exam_exercises ee ON ee.exercise_id = ex.id
    WHERE ee.exam_id = ?
  `).all(req.params.id);

  const readiness = calculateReadiness(req.params.id, exam.profile_id);

  res.json({ ...exam, exercises, readiness });
});

function calculateReadiness(exam_id, profile_id) {
  const exercises = db.prepare(`
    SELECT ex.id FROM exercises ex
    JOIN exam_exercises ee ON ee.exercise_id = ex.id
    WHERE ee.exam_id = ?
  `).all(exam_id);

  if (exercises.length === 0) return { score: 0, label: 'Inga övningar', color: 'gray' };

  let totalScore = 0;

  for (const ex of exercises) {
    // Senaste 3 sessioner för denna övning
    const sessions = db.prepare(`
      SELECT score, max_score FROM sessions
      WHERE profile_id=? AND exercise_id=? AND max_score > 0
      ORDER BY completed_at DESC LIMIT 3
    `).all(profile_id, ex.id);

    if (sessions.length === 0) {
      // Övning ej gjord — 0%
    } else {
      const avg = sessions.reduce((s, r) => s + (r.score / r.max_score), 0) / sessions.length;
      totalScore += avg;
    }
  }

  const pct = Math.round((totalScore / exercises.length) * 100);
  let label, color;

  if (pct >= 80)      { label = 'Redo!';      color = 'green'; }
  else if (pct >= 50) { label = 'Öva mer';    color = 'yellow'; }
  else                { label = 'Kritisk';    color = 'red'; }

  return { score: pct, label, color };
}

module.exports = router;
