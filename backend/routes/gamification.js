const express = require('express');
const router = express.Router();
const db = require('../db/database');

// XP-beräkning
function calculateXP({ score, max_score, difficulty = 1, streak = 0 }) {
  if (!max_score || max_score === 0) return 0;

  const base = score * 10;
  const perfectBonus = score === max_score ? Math.round(base * 0.5) : 0;
  const difficultyMult = 1 + (difficulty - 1) * 0.25; // 1.0 → 2.0

  let streakMult = 1.0;
  if (streak >= 30) streakMult = 3.0;
  else if (streak >= 7) streakMult = 2.0;
  else if (streak >= 3) streakMult = 1.5;

  return Math.round((base + perfectBonus) * difficultyMult * streakMult);
}

// Uppdatera streak
function updateStreak(profile_id, stats) {
  if (!stats) return { streak: 1, bonus: false };

  const today = new Date().toISOString().slice(0, 10);
  const last = stats.last_active_date;

  if (last === today) {
    return { streak: stats.streak_current, bonus: false };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = last === yesterday ? stats.streak_current + 1 : 1;

  return { streak: newStreak, bonus: newStreak > stats.streak_current };
}

// Kolla och dela ut badges
function checkBadges(profile_id) {
  const allBadges = db.prepare('SELECT * FROM badges').all();
  const earned = new Set(
    db.prepare('SELECT badge_id FROM profile_badges WHERE profile_id=?')
      .all(profile_id).map(r => r.badge_id)
  );

  const stats = db.prepare('SELECT * FROM profile_stats WHERE profile_id=?').get(profile_id);
  const sessions = db.prepare('SELECT s.*, e.subject FROM sessions s JOIN exercises e ON e.id=s.exercise_id WHERE s.profile_id=?').all(profile_id);

  const newBadges = [];

  for (const badge of allBadges) {
    if (earned.has(badge.id)) continue;

    const criteria = JSON.parse(badge.criteria_json);
    let unlocked = false;

    switch (criteria.type) {
      case 'sessions_total':
        unlocked = sessions.length >= criteria.value;
        break;

      case 'perfect_sessions': {
        const perfects = sessions.filter(s => s.max_score > 0 && s.score === s.max_score).length;
        unlocked = perfects >= criteria.value;
        break;
      }

      case 'perfect_streak': {
        let streak = 0, best = 0;
        for (const s of sessions) {
          if (s.max_score > 0 && s.score === s.max_score) { streak++; best = Math.max(best, streak); }
          else streak = 0;
        }
        unlocked = best >= criteria.value;
        break;
      }

      case 'streak':
        unlocked = (stats?.streak_current || 0) >= criteria.value || (stats?.streak_best || 0) >= criteria.value;
        break;

      case 'correct_in_subject': {
        const correct = sessions
          .filter(s => s.subject === criteria.subject)
          .reduce((sum, s) => sum + s.score, 0);
        unlocked = correct >= criteria.value;
        break;
      }

      case 'subjects_tried': {
        const subjects = new Set(sessions.map(s => s.subject));
        unlocked = subjects.size >= criteria.value;
        break;
      }

      case 'exam_score': {
        // Hanteras vid exam-sessions
        break;
      }

      case 'retry_to_perfect': {
        const exerciseSessions = {};
        for (const s of sessions) {
          if (!exerciseSessions[s.exercise_id]) exerciseSessions[s.exercise_id] = [];
          exerciseSessions[s.exercise_id].push(s);
        }
        unlocked = Object.values(exerciseSessions).some(ss =>
          ss.length > 1 && ss[ss.length - 1].score === ss[ss.length - 1].max_score
        );
        break;
      }
    }

    if (unlocked) {
      db.prepare(
        'INSERT OR IGNORE INTO profile_badges (profile_id, badge_id) VALUES (?, ?)'
      ).run(profile_id, badge.id);
      newBadges.push(badge);
    }
  }

  return newBadges;
}

// GET /api/gamification/leaderboard  (syskon-jämförelse)
router.get('/leaderboard', (req, res) => {
  const profiles = db.prepare(`
    SELECT p.id, p.name, p.avatar_id,
           ps.xp_total, ps.level, ps.streak_current, ps.streak_best
    FROM profiles p
    JOIN profile_stats ps ON ps.profile_id = p.id
    ORDER BY ps.xp_total DESC
  `).all();
  res.json(profiles);
});

// GET /api/gamification/badges
router.get('/badges', (req, res) => {
  res.json(db.prepare('SELECT * FROM badges ORDER BY id').all());
});

module.exports = router;
module.exports.calculateXP = calculateXP;
module.exports.updateStreak = updateStreak;
module.exports.checkBadges = checkBadges;
