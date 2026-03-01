const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'studie-hubb.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrate() {
  db.exec(`
    -- Barnprofiler
    CREATE TABLE IF NOT EXISTS profiles (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL,
      birthdate TEXT    NOT NULL,
      avatar_id INTEGER NOT NULL DEFAULT 1,
      created_at TEXT   NOT NULL DEFAULT (datetime('now'))
    );

    -- Gamification-status per barn
    CREATE TABLE IF NOT EXISTS profile_stats (
      profile_id       INTEGER PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      xp_total         INTEGER NOT NULL DEFAULT 0,
      level            INTEGER NOT NULL DEFAULT 1,
      streak_current   INTEGER NOT NULL DEFAULT 0,
      streak_best      INTEGER NOT NULL DEFAULT 0,
      last_active_date TEXT
    );

    -- Övningar
    CREATE TABLE IF NOT EXISTS exercises (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    NOT NULL,
      subject       TEXT    NOT NULL,
      description   TEXT    NOT NULL DEFAULT '',
      difficulty    INTEGER NOT NULL DEFAULT 1 CHECK(difficulty BETWEEN 1 AND 5),
      is_procedural INTEGER NOT NULL DEFAULT 0,
      age_min       INTEGER NOT NULL DEFAULT 6,
      age_max       INTEGER NOT NULL DEFAULT 12,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Statiska frågor
    CREATE TABLE IF NOT EXISTS questions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id    INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      type           TEXT    NOT NULL CHECK(type IN ('multiple_choice','text_input')),
      question_text  TEXT    NOT NULL,
      options_json   TEXT,
      correct_answer TEXT    NOT NULL,
      sort_order     INTEGER NOT NULL DEFAULT 0
    );

    -- Mallar för slumpmässiga mattefrågor
    CREATE TABLE IF NOT EXISTS question_templates (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id    INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      template_text  TEXT    NOT NULL,
      variables_json TEXT    NOT NULL,
      answer_formula TEXT    NOT NULL,
      difficulty     INTEGER NOT NULL DEFAULT 1
    );

    -- Genomförda sessioner
    CREATE TABLE IF NOT EXISTS sessions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id       INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      exercise_id      INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      score            INTEGER NOT NULL DEFAULT 0,
      max_score        INTEGER NOT NULL DEFAULT 0,
      xp_earned        INTEGER NOT NULL DEFAULT 0,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      completed_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Svar per session
    CREATE TABLE IF NOT EXISTS session_answers (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id   INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      question_ref TEXT    NOT NULL,
      answer_given TEXT    NOT NULL,
      is_correct   INTEGER NOT NULL DEFAULT 0,
      time_ms      INTEGER NOT NULL DEFAULT 0
    );

    -- Kommande prov
    CREATE TABLE IF NOT EXISTS exams (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      subject    TEXT    NOT NULL,
      exam_date  TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Övningar kopplade till prov
    CREATE TABLE IF NOT EXISTS exam_exercises (
      exam_id     INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      PRIMARY KEY (exam_id, exercise_id)
    );

    -- Badge-definitioner
    CREATE TABLE IF NOT EXISTS badges (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      key         TEXT    NOT NULL UNIQUE,
      name        TEXT    NOT NULL,
      description TEXT    NOT NULL,
      icon        TEXT    NOT NULL,
      criteria_json TEXT  NOT NULL
    );

    -- Upplåsta badges per barn
    CREATE TABLE IF NOT EXISTS profile_badges (
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      badge_id   INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
      earned_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (profile_id, badge_id)
    );

    -- Spaced repetition
    CREATE TABLE IF NOT EXISTS spaced_repetition (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id       INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      question_ref     TEXT    NOT NULL,
      next_review_date TEXT    NOT NULL,
      ease_factor      REAL    NOT NULL DEFAULT 2.5,
      interval_days    INTEGER NOT NULL DEFAULT 1,
      repetitions      INTEGER NOT NULL DEFAULT 0,
      UNIQUE(profile_id, question_ref)
    );
  `);

  seedBadges();
  // Content seed is called after module export is set up (see bottom of file)
}

function seedBadges() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM badges').get();
  if (existing.c > 0) return;

  const insert = db.prepare(`
    INSERT INTO badges (key, name, description, icon, criteria_json)
    VALUES (?, ?, ?, ?, ?)
  `);

  const badges = [
    ['first_exercise',   'Första steget',      'Genomför din första övning',                     '🌱', JSON.stringify({type:'sessions_total', value:1})],
    ['perfect_score',    'Perfektionist',       'Få 100% på en övning',                           '💎', JSON.stringify({type:'perfect_sessions', value:1})],
    ['perfect_trio',     'Tre i rad',           'Få 100% på tre övningar i följd',                '🎯', JSON.stringify({type:'perfect_streak', value:3})],
    ['streak_3',         'Tre dagars streak',   'Öva tre dagar i rad',                            '🔥', JSON.stringify({type:'streak', value:3})],
    ['streak_7',         'Veckohjälten',        'Öva sju dagar i rad',                            '⚡', JSON.stringify({type:'streak', value:7})],
    ['streak_30',        'Månadshjälten',       'Öva 30 dagar i rad',                             '🏅', JSON.stringify({type:'streak', value:30})],
    ['math_master',      'Mattegeni',           'Svara rätt på 50 mattefrågor',                   '📐', JSON.stringify({type:'correct_in_subject', subject:'matematik', value:50})],
    ['swedish_master',   'Ordmästare',          'Svara rätt på 50 svenskafrågor',                 '📝', JSON.stringify({type:'correct_in_subject', subject:'svenska', value:50})],
    ['explorer',         'Utforskaren',         'Gör din första övning i ett nytt ämne',          '🗺️', JSON.stringify({type:'subjects_tried', value:3})],
    ['allround',         'Allround-stjärna',    'Gör övningar i alla 6 ämnen',                    '⭐', JSON.stringify({type:'subjects_tried', value:6})],
    ['exam_ready',       'Provredo',            'Klara ett prov-mode med 90% eller mer',          '🏆', JSON.stringify({type:'exam_score', value:90})],
    ['stubborn',         'Envis',               'Gör om en övning tills du får 100%',             '💪', JSON.stringify({type:'retry_to_perfect', value:1})],
    ['sessions_10',      'Ivrig elev',          'Genomför 10 övningar totalt',                    '📚', JSON.stringify({type:'sessions_total', value:10})],
    ['sessions_50',      'Studiehjälten',       'Genomför 50 övningar totalt',                    '🎖️', JSON.stringify({type:'sessions_total', value:50})],
  ];

  const insertAll = db.transaction(() => {
    for (const b of badges) insert.run(...b);
  });
  insertAll();
}

migrate();

module.exports = db;

// Seed starter content after export is defined (avoids circular require issues)
const { seedContent } = require('./seed-content');
seedContent();
