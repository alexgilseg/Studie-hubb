/**
 * Studie-hubb — Spaced Repetition (SM-2 algoritm)
 *
 * SM-2 beräknar när en fråga ska visas igen baserat på hur bra
 * eleven svarade. Rätt svar → längre paus. Fel svar → kort paus.
 *
 * Kvalitet (q):
 *   5 = perfekt svar, snabbt
 *   4 = korrekt, lite tvekan
 *   3 = korrekt efter svårighet
 *   2 = fel men nära
 *   1 = fel
 *   0 = fel, minnesbortfall
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');

/**
 * SM-2 uppdatering av ease_factor och interval_days.
 * Returnerar { ease_factor, interval_days, next_review_date }
 */
function sm2Update(record, quality) {
  let { ease_factor, interval_days, repetitions } = record;

  if (quality >= 3) {
    // Korrekt svar
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  } else {
    // Fel svar — börja om från början
    repetitions = 0;
    interval_days = 1;
  }

  // Uppdatera ease_factor (EF)
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  // Nästa repetitionsdatum
  const next = new Date();
  next.setDate(next.getDate() + interval_days);
  const next_review_date = next.toISOString().slice(0, 10);

  return { ease_factor, interval_days, repetitions, next_review_date };
}

/**
 * Konvertera svarstid och korrekthet till SM-2 kvalitetsvärde (0–5).
 */
function toQuality(is_correct, time_ms) {
  if (!is_correct) return 1;
  if (time_ms < 5000) return 5;   // rätt + snabbt
  if (time_ms < 12000) return 4;  // rätt + normal tid
  return 3;                         // rätt + lång tid
}

/**
 * Uppdatera spaced repetition-poster för en lista av svar.
 * Anropas efter att en session sparats.
 */
function updateSpacedRepetition(profile_id, answers) {
  const upsert = db.prepare(`
    INSERT INTO spaced_repetition
      (profile_id, question_ref, next_review_date, ease_factor, interval_days, repetitions)
    VALUES (?, ?, ?, 2.5, 1, 0)
    ON CONFLICT(profile_id, question_ref) DO NOTHING
  `);

  const get = db.prepare(`
    SELECT * FROM spaced_repetition
    WHERE profile_id = ? AND question_ref = ?
  `);

  const update = db.prepare(`
    UPDATE spaced_repetition
    SET ease_factor = ?,
        interval_days = ?,
        repetitions = ?,
        next_review_date = ?
    WHERE profile_id = ? AND question_ref = ?
  `);

  const processAll = db.transaction(() => {
    for (const answer of answers) {
      const ref = String(answer.question_ref);
      // Skapa om den inte finns
      upsert.run(profile_id, ref);
      const record = get.get(profile_id, ref);
      const quality = toQuality(answer.is_correct, answer.time_ms || 10000);
      const updated = sm2Update(record, quality);
      update.run(
        updated.ease_factor,
        updated.interval_days,
        updated.repetitions,
        updated.next_review_date,
        profile_id,
        ref
      );
    }
  });

  processAll();
}

// GET /api/spaced-repetition/due?profile_id=&limit=
// Returnerar övningar som har frågor som förfaller idag eller tidigare
router.get('/due', (req, res) => {
  const { profile_id, limit = 20 } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id krävs' });

  const today = new Date().toISOString().slice(0, 10);

  // Hämta förfallna fråge-refs
  const dueItems = db.prepare(`
    SELECT sr.question_ref, sr.next_review_date, sr.ease_factor,
           sr.interval_days, sr.repetitions
    FROM spaced_repetition sr
    WHERE sr.profile_id = ? AND sr.next_review_date <= ?
    ORDER BY sr.next_review_date ASC
    LIMIT ?
  `).all(profile_id, today, Number(limit));

  if (!dueItems.length) {
    return res.json({ due_count: 0, exercises: [] });
  }

  // Gruppera efter övning
  const exerciseMap = new Map();
  for (const item of dueItems) {
    const ref = item.question_ref;
    // question_ref är antingen ett tal (question.id) eller "template_N_..."
    let exerciseId = null;

    if (ref.startsWith('template_')) {
      const parts = ref.split('_');
      // template_{template_id}_{timestamp}  — slå upp exercise via template
      const templateId = parts[1];
      const tmpl = db.prepare('SELECT exercise_id FROM question_templates WHERE id=?').get(templateId);
      if (tmpl) exerciseId = tmpl.exercise_id;
    } else {
      const q = db.prepare('SELECT exercise_id FROM questions WHERE id=?').get(ref);
      if (q) exerciseId = q.exercise_id;
    }

    if (exerciseId && !exerciseMap.has(exerciseId)) {
      exerciseMap.set(exerciseId, { due_questions: 0 });
    }
    if (exerciseId) {
      exerciseMap.get(exerciseId).due_questions++;
    }
  }

  // Hämta övningsdetaljer
  const exercises = [];
  for (const [exId, meta] of exerciseMap) {
    const ex = db.prepare('SELECT id, title, subject, difficulty FROM exercises WHERE id=?').get(exId);
    if (ex) exercises.push({ ...ex, due_questions: meta.due_questions });
  }

  res.json({ due_count: dueItems.length, exercises });
});

// GET /api/spaced-repetition/stats?profile_id=
// Statistik om spaced repetition-status
router.get('/stats', (req, res) => {
  const { profile_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id krävs' });

  const today = new Date().toISOString().slice(0, 10);

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_tracked,
      SUM(CASE WHEN next_review_date <= ? THEN 1 ELSE 0 END) as due_now,
      SUM(CASE WHEN next_review_date > ? THEN 1 ELSE 0 END) as upcoming,
      AVG(ease_factor) as avg_ease,
      AVG(interval_days) as avg_interval
    FROM spaced_repetition
    WHERE profile_id = ?
  `).get(today, today, profile_id);

  res.json(stats);
});

module.exports = router;
module.exports.updateSpacedRepetition = updateSpacedRepetition;
