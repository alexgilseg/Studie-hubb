# Studie-hubb — CLAUDE.md

A study tool for Swedish children aged 8–10. Parents create exercises via an admin panel; children practise with gamification (XP, streaks, badges).

---

## How to run

```bash
# Easiest
./start.sh

# Manual
cd backend && npm install && node server.js

# Dev (auto-reload)
cd backend && npm run dev
```

App runs at **http://localhost:3000**
Admin panel: http://localhost:3000/admin.html
Default admin password: `studie123`

---

## Project structure

```
Studie-hubb/
├── backend/
│   ├── server.js           # Express entry point (port 3000)
│   ├── db/database.js      # SQLite schema + seeding (better-sqlite3)
│   └── routes/
│       ├── profiles.js     # Child profiles + stats
│       ├── exercises.js    # Exercise CRUD + question management
│       ├── sessions.js     # Session recording + history
│       ├── gamification.js # XP, levels, streaks, badges
│       └── exams.js        # Exam tracking + readiness score
├── frontend/
│   ├── index.html          # Profile selector (home)
│   ├── dashboard.html      # Student dashboard
│   ├── exercises.html      # Exercise list with filters
│   ├── exercise.html       # Exercise player
│   ├── history.html        # History + badges (3 tabs)
│   ├── exam-prep.html      # Exam preparation
│   ├── admin.html          # Parent admin panel
│   ├── css/style.css       # Global styles (CSS variables)
│   └── js/
│       ├── api.js          # Fetch client + shared helpers
│       ├── home.js         # Profile selection
│       ├── dashboard.js    # Dashboard rendering
│       ├── exercises.js    # Exercise list + filtering
│       ├── exercise.js     # Exercise player logic
│       ├── history.js      # History tabs + pagination
│       ├── exam-prep.js    # Exam list + detail
│       └── admin.js        # Admin CRUD operations
└── start.sh
```

---

## Tech stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Node.js, Express 4                  |
| Database | SQLite via better-sqlite3 (sync)    |
| Frontend | Vanilla HTML/CSS/JavaScript (no framework) |
| Styling  | CSS variables, mobile-first         |

---

## Database schema (11 tables)

| Table               | Purpose                                      |
|---------------------|----------------------------------------------|
| `profiles`          | Child profiles (name, birthdate, avatar)     |
| `profile_stats`     | XP, level, streak per child                  |
| `exercises`         | Exercise definitions                         |
| `questions`         | Static questions (MC or text)                |
| `question_templates`| Procedural math templates with variable ranges |
| `sessions`          | Completed exercise sessions                  |
| `session_answers`   | Per-question answer records                  |
| `exams`             | Upcoming exams                               |
| `exam_exercises`    | Exam ↔ exercise junction                     |
| `badges`            | 14 pre-seeded badge definitions              |
| `profile_badges`    | Earned badges per child                      |

---

## API endpoints

### Profiles — `/api/profiles`
| Method | Path                       | Description               |
|--------|----------------------------|---------------------------|
| GET    | `/api/profiles`            | List all profiles         |
| POST   | `/api/profiles`            | Create profile            |
| PUT    | `/api/profiles/:id`        | Update profile            |
| DELETE | `/api/profiles/:id`        | Delete profile            |
| GET    | `/api/profiles/:id/stats`  | Stats, badges, history    |

### Exercises — `/api/exercises`
| Method | Path                                   | Description              |
|--------|----------------------------------------|--------------------------|
| GET    | `/api/exercises`                       | List (filter: subject, age, profile_id) |
| GET    | `/api/exercises/:id`                   | Exercise + questions     |
| POST   | `/api/exercises`                       | Create exercise          |
| PUT    | `/api/exercises/:id`                   | Update exercise          |
| DELETE | `/api/exercises/:id`                   | Delete exercise          |
| POST   | `/api/exercises/:id/questions`         | Add question             |
| PUT    | `/api/exercises/:id/questions/:qid`    | Update question          |
| DELETE | `/api/exercises/:id/questions/:qid`    | Delete question          |
| POST   | `/api/exercises/:id/templates`         | Add procedural template  |

### Sessions — `/api/sessions`
| Method | Path                              | Description                  |
|--------|-----------------------------------|------------------------------|
| POST   | `/api/sessions`                   | Save completed session       |
| GET    | `/api/sessions`                   | List sessions (with filters) |
| GET    | `/api/sessions/history/:profileId`| Daily + subject stats        |

### Gamification — `/api/gamification`
| Method | Path                          | Description            |
|--------|-------------------------------|------------------------|
| GET    | `/api/gamification/leaderboard` | All profiles by XP   |
| GET    | `/api/gamification/badges`    | All badge definitions  |

### Exams — `/api/exams`
| Method | Path                        | Description                |
|--------|-----------------------------|----------------------------|
| GET    | `/api/exams`                | List exams + readiness     |
| POST   | `/api/exams`                | Create exam                |
| PUT    | `/api/exams/:id`            | Update exam                |
| DELETE | `/api/exams/:id`            | Delete exam                |
| GET    | `/api/exams/:id`            | Exam detail + readiness    |
| PUT    | `/api/exams/:id/exercises`  | Link exercises to exam     |

---

## Gamification system

### XP formula
```
base_xp        = score × 10
perfect_bonus  = (score == max_score) ? base × 0.5 : 0
difficulty_mult = 1.0 + (difficulty - 1) × 0.25   // range 1.0–2.0
streak_mult    = 1.0 | 1.5 (3+ days) | 2.0 (7+) | 3.0 (30+)
final_xp       = round((base + perfect_bonus) × difficulty_mult × streak_mult)
```

### Levels (10 total)
1 → 0 XP · 2 → 150 · 3 → 400 · 4 → 800 · 5 → 1 400
6 → 2 000 · 7 → 3 500 · 8 → 5 500 · 9 → 8 000 · 10 → 12 000

### Badges (14 pre-seeded)
First exercise, Perfectionist, Three in a row, 3/7/30-day streak, Math master, Word master, Explorer (3 subjects), All-rounder (6 subjects), Exam ready (90%+), Stubborn (retry to 100%), Eager student (10+ exercises), Study hero (50+).

---

## Question types

| Type              | Storage                            | Matching              |
|-------------------|------------------------------------|-----------------------|
| `multiple_choice` | `options_json` (JSON array)        | Index comparison      |
| `text_input`      | `correct_answer` (plain text)      | Case-insensitive trim |
| Procedural (math) | `question_templates` table         | Formula via `new Function()` |

---

## Exam readiness

Calculated from the **last 3 sessions** per linked exercise, then averaged across all exercises for the exam.

| Score  | Status    | Colour |
|--------|-----------|--------|
| 0–49%  | Kritisk   | Red    |
| 50–79% | Öva mer   | Yellow |
| 80–100%| Redo!     | Green  |

---

## Frontend shared helpers (`js/api.js`)

- `API.get/post/put/del(path, body)` — fetch wrapper
- `getSubject(id)` — subject name, icon, colour
- `getLevelInfo(xp)` — current level + progress %
- `getAge(birthdate)` — age in years
- `formatDate(str)` / `formatDateShort(str)` — Swedish-format dates
- `scoreClass(pct)` — CSS class for colour coding scores
- Session storage: active profile
- LocalStorage: admin token + password

---

## Subjects

| ID          | Name       | Icon |
|-------------|------------|------|
| `matematik` | Matematik  | 📐   |
| `svenska`   | Svenska    | 📝   |
| `engelska`  | Engelska   | 🇬🇧  |
| `no`        | NO         | 🔬   |
| `so`        | SO         | 🌍   |
| `teknik`    | Teknik     | ⚙️   |

---

## Notes

- Database file: `backend/db/studie-hubb.db` (gitignored)
- WAL mode enabled; foreign keys enforced
- CORS is open (designed for local single-household use)
- Admin auth is localStorage-only — not suitable for public hosting
- `spaced_repetition` table exists in schema but is not yet used
