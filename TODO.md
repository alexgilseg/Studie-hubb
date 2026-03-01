# TODO — Studie-hubb

Future plans and improvements, roughly grouped by category and priority.

---

## High priority

### Audio & accessibility
- [ ] Read questions aloud using Web Speech API (TTS) — important for younger/struggling readers
- [ ] Sound effects on correct/wrong answer and badge unlock
- [ ] Keyboard navigation support throughout the app

### Mobile experience
- [ ] Proper touch targets (buttons large enough for fingers)
- [ ] Swipe between questions in the exercise player
- [ ] PWA (Progressive Web App) manifest + service worker for offline use and "Add to home screen" on mobile

### Exercise content
- [ ] Import exercises from CSV/JSON file in admin panel
- [ ] Export all exercises as a backup file
- [ ] Duplicate an existing exercise (copy template)
- [ ] Sort/reorder questions inside an exercise via drag-and-drop
- [ ] Image support — attach an image to a question (e.g. geometry problems)

---

## Gamification & motivation

- [ ] Activate and implement the `spaced_repetition` table already in the schema — schedule exercise repetitions based on past performance
- [ ] Weekly challenge — a new featured exercise every week
- [ ] Daily goals — e.g. "Complete 3 exercises today" with bonus XP
- [ ] Trophies / milestone rewards displayed prominently on the dashboard
- [ ] Animated confetti or celebration screen on badge unlock
- [ ] Avatar customisation — let children unlock and choose new avatars with XP

---

## Parent / admin panel

- [ ] Per-subject progress report as a printable/PDF summary for parent-teacher meetings
- [ ] Email or push notification when a child completes an exam-prep exercise
- [ ] Multiple admin accounts / PIN per child to prevent siblings from accessing each other's profiles
- [ ] Admin: drag-and-drop reordering of exercises in exam
- [ ] Admin: bulk-assign exercises to multiple exams at once
- [ ] View individual session answers in admin — see which specific questions a child got wrong

---

## Statistics & history

- [ ] Charts / graphs on the history page (line chart of XP over time, bar chart per subject)
- [ ] "Best score" tracking per exercise (not just latest)
- [ ] Show time spent per session more prominently
- [ ] Heatmap calendar (like GitHub's contribution graph) showing active study days

---

## Exam preparation

- [ ] Push notification / reminder when an exam is < 3 days away
- [ ] "Cram mode" — auto-select exercises linked to a near exam and queue them
- [ ] Mark exam as completed and show final readiness achieved

---

## Technical & code quality

- [ ] Server-side input validation (currently minimal)
- [ ] Rate limiting on API endpoints
- [ ] Proper admin authentication (hashed password server-side instead of localStorage)
- [ ] Unit tests for XP calculation and badge logic (backend)
- [ ] End-to-end tests for the exercise player flow (e.g. Playwright)
- [ ] Environment variable support (`.env`) for port, DB path, admin password
- [ ] Docker / docker-compose setup for easier self-hosting
- [ ] Structured logging (e.g. timestamps, request IDs)

---

## Deployment & sharing

- [ ] One-click deploy to Fly.io, Railway, or Render for families without a home server
- [ ] Optional cloud sync — back up the SQLite database to Google Drive or similar
- [ ] Multi-language support (app UI currently Swedish-only)
- [ ] Share a specific exercise via a link (read-only, no account needed)

---

## Nice-to-have / ideas

- [ ] Teacher mode — let a teacher manage multiple class groups
- [ ] Multiplayer / race mode — two children compete on the same exercise in real time
- [ ] AI-generated questions from a topic prompt (using an LLM API)
- [ ] Flashcard mode as an alternative to quiz mode (flip cards, spaced repetition)
- [ ] Dark mode toggle
