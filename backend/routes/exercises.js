const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/exercises  ?subject=&age=&profile_id=
router.get('/', (req, res) => {
  const { subject, age, profile_id } = req.query;
  let sql = 'SELECT * FROM exercises WHERE 1=1';
  const params = [];

  if (subject) { sql += ' AND subject=?'; params.push(subject); }
  if (age)     { sql += ' AND age_min<=? AND age_max>=?'; params.push(age, age); }

  sql += ' ORDER BY subject, difficulty, title';
  const exercises = db.prepare(sql).all(...params);

  // Hämta senaste session per övning för denna profil
  let lastSessionMap = {};
  if (profile_id) {
    const lastSessions = db.prepare(`
      SELECT exercise_id, score, max_score, completed_at
      FROM sessions
      WHERE profile_id = ?
        AND id IN (
          SELECT MAX(id) FROM sessions WHERE profile_id=? GROUP BY exercise_id
        )
    `).all(profile_id, profile_id);
    lastSessionMap = Object.fromEntries(lastSessions.map(s => [s.exercise_id, s]));
  }

  const result = exercises.map(e => ({
    ...e,
    question_count: db.prepare('SELECT COUNT(*) as c FROM questions WHERE exercise_id=?').get(e.id).c
      + db.prepare('SELECT COUNT(*) as c FROM question_templates WHERE exercise_id=?').get(e.id).c,
    last_session: lastSessionMap[e.id] || null
  }));

  res.json(result);
});

// GET /api/exercises/:id  (med frågor)
router.get('/:id', (req, res) => {
  const exercise = db.prepare('SELECT * FROM exercises WHERE id=?').get(req.params.id);
  if (!exercise) return res.status(404).json({ error: 'Övning hittades inte' });

  const questions = db.prepare(
    'SELECT * FROM questions WHERE exercise_id=? ORDER BY sort_order, id'
  ).all(req.params.id);

  const templates = db.prepare(
    'SELECT * FROM question_templates WHERE exercise_id=? ORDER BY id'
  ).all(req.params.id);

  // Generera slumpmässiga frågor från mallar
  const generated = templates.map(t => generateFromTemplate(t));

  res.json({
    ...exercise,
    questions: [
      ...questions.map(q => ({ ...q, options: q.options_json ? JSON.parse(q.options_json) : null })),
      ...generated
    ]
  });
});

// POST /api/exercises
router.post('/', (req, res) => {
  const { title, subject, description='', difficulty=1, is_procedural=0, age_min=6, age_max=12 } = req.body;
  if (!title || !subject) return res.status(400).json({ error: 'title och subject krävs' });

  const result = db.prepare(`
    INSERT INTO exercises (title, subject, description, difficulty, is_procedural, age_min, age_max)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, subject, description, difficulty, is_procedural, age_min, age_max);

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/exercises/:id
router.put('/:id', (req, res) => {
  const { title, subject, description, difficulty, age_min, age_max } = req.body;
  db.prepare(`
    UPDATE exercises
    SET title=?, subject=?, description=?, difficulty=?, age_min=?, age_max=?,
        updated_at=datetime('now')
    WHERE id=?
  `).run(title, subject, description, difficulty, age_min, age_max, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/exercises/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM exercises WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/exercises/:id/questions
router.post('/:id/questions', (req, res) => {
  const { type, question_text, options, correct_answer, sort_order=0 } = req.body;
  const options_json = options ? JSON.stringify(options) : null;

  const result = db.prepare(`
    INSERT INTO questions (exercise_id, type, question_text, options_json, correct_answer, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, type, question_text, options_json, String(correct_answer), sort_order);

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/exercises/:id/questions/:qid
router.put('/:id/questions/:qid', (req, res) => {
  const { type, question_text, options, correct_answer, sort_order } = req.body;
  const options_json = options ? JSON.stringify(options) : null;
  db.prepare(`
    UPDATE questions
    SET type=?, question_text=?, options_json=?, correct_answer=?, sort_order=?
    WHERE id=? AND exercise_id=?
  `).run(type, question_text, options_json, String(correct_answer), sort_order, req.params.qid, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/exercises/:id/questions/:qid
router.delete('/:id/questions/:qid', (req, res) => {
  db.prepare('DELETE FROM questions WHERE id=? AND exercise_id=?').run(req.params.qid, req.params.id);
  res.json({ ok: true });
});

// POST /api/exercises/:id/templates  (slumpmässiga mattemallar)
router.post('/:id/templates', (req, res) => {
  const { template_text, variables, answer_formula, difficulty=1 } = req.body;
  const result = db.prepare(`
    INSERT INTO question_templates (exercise_id, template_text, variables_json, answer_formula, difficulty)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, template_text, JSON.stringify(variables), answer_formula, difficulty);
  res.status(201).json({ id: result.lastInsertRowid });
});

function generateFromTemplate(template) {
  const vars = JSON.parse(template.variables_json);
  const values = {};

  for (const [key, range] of Object.entries(vars)) {
    if (Array.isArray(range)) {
      values[key] = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
    } else {
      values[key] = range;
    }
  }

  // Ersätt {variabel} i mallen
  let questionText = template.template_text;
  for (const [key, val] of Object.entries(values)) {
    questionText = questionText.replaceAll(`{${key}}`, val);
  }

  // Evaluera svarsformel säkert
  let correctAnswer;
  try {
    // Bygg ett säkert uttryck med kända variabler
    const fn = new Function(...Object.keys(values), `return ${template.answer_formula}`);
    correctAnswer = String(fn(...Object.values(values)));
  } catch {
    correctAnswer = '?';
  }

  return {
    id: `template_${template.id}_${Date.now()}`,
    exercise_id: template.exercise_id,
    type: 'text_input',
    question_text: questionText,
    options: null,
    correct_answer: correctAnswer,
    is_generated: true
  };
}

module.exports = router;
