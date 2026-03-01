/**
 * app.js — Elevvy (index.html)
 * Hanterar filtrering av övningar och genomförande av frågesporter.
 */

// ── Tillstånd ──────────────────────────────────────────────────
let state = {
  activeAge:     'all',
  activeSubject: 'all',
  currentExercise: null,
  currentQuestion: 0,
  score: 0,
  answered: false,
};

// ── DOM-element ────────────────────────────────────────────────
const startView    = document.getElementById('start-view');
const exerciseView = document.getElementById('exercise-view');
const resultView   = document.getElementById('result-view');

const ageChips     = document.querySelectorAll('.chip-age');
const subjectChips = document.querySelectorAll('.chip-subject');
const grid         = document.getElementById('exercises-grid');
const noExercises  = document.getElementById('no-exercises');

// Exercise view
const backBtn       = document.getElementById('back-btn');
const exerciseTitleEl = document.getElementById('exercise-title');
const progressText  = document.getElementById('progress-text');
const progressBar   = document.getElementById('progress-bar');
const questionText  = document.getElementById('question-text');
const mcOptions     = document.getElementById('mc-options');
const textInputWrap = document.getElementById('text-input-wrap');
const textAnswer    = document.getElementById('text-answer');
const submitText    = document.getElementById('submit-text');
const feedbackEl    = document.getElementById('feedback');
const nextBtn       = document.getElementById('next-btn');

// Result view
const retryBtn    = document.getElementById('retry-btn');
const homeBtn     = document.getElementById('home-btn');

// ── Filter-lyssnare ────────────────────────────────────────────
ageChips.forEach(btn => {
  btn.addEventListener('click', () => {
    ageChips.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeAge = btn.dataset.age;
    renderGrid();
  });
});

subjectChips.forEach(btn => {
  btn.addEventListener('click', () => {
    subjectChips.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeSubject = btn.dataset.subject;
    renderGrid();
  });
});

// ── Rendera övningskort ────────────────────────────────────────
function renderGrid() {
  const all = getExercises();

  const filtered = all.filter(ex => {
    const ageOk = state.activeAge === 'all' || ex.ageGroups.includes(Number(state.activeAge));
    const subOk = state.activeSubject === 'all' || ex.subject === state.activeSubject;
    return ageOk && subOk;
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    noExercises.classList.remove('hidden');
    return;
  }

  noExercises.classList.add('hidden');

  filtered.forEach(ex => {
    const sub = SUBJECTS[ex.subject] || { label: ex.subject, icon: '📚', color: 'var(--primary)' };
    const ageLabel = ex.ageGroups.sort().map(a => a + ' år').join(', ');
    const qCount   = ex.questions ? ex.questions.length : 0;

    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.style.setProperty('--card-color', sub.color);
    card.innerHTML = `
      <div class="card-subject-badge">${sub.icon} ${sub.label}</div>
      <div class="card-title">${escapeHtml(ex.title)}</div>
      <div class="card-description">${escapeHtml(ex.description || '')}</div>
      <div class="card-meta">
        <span class="card-age-tag">&#128100; ${ageLabel}</span>
        <span>&#10067; ${qCount} frågor</span>
      </div>
    `;
    card.addEventListener('click', () => startExercise(ex.id));
    grid.appendChild(card);
  });
}

// ── Starta övning ──────────────────────────────────────────────
function startExercise(id) {
  const ex = getExerciseById(id);
  if (!ex || !ex.questions || ex.questions.length === 0) return;

  state.currentExercise = ex;
  state.currentQuestion = 0;
  state.score           = 0;
  state.answered        = false;

  exerciseTitleEl.textContent = ex.title;

  showView('exercise');
  renderQuestion();
}

function renderQuestion() {
  const ex = state.currentExercise;
  const q  = ex.questions[state.currentQuestion];
  const total = ex.questions.length;

  // Progress
  progressText.textContent = `Fråga ${state.currentQuestion + 1} av ${total}`;
  progressBar.style.width  = `${(state.currentQuestion / total) * 100}%`;

  // Reset
  feedbackEl.classList.add('hidden');
  feedbackEl.className = 'feedback hidden';
  nextBtn.classList.add('hidden');
  mcOptions.innerHTML = '';
  textInputWrap.classList.add('hidden');
  textAnswer.value = '';
  state.answered = false;

  questionText.textContent = q.question;

  if (q.type === 'multiple_choice') {
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'mc-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => answerMC(i, q.correctAnswer));
      mcOptions.appendChild(btn);
    });
  } else {
    textInputWrap.classList.remove('hidden');
    textAnswer.focus();
  }
}

// ── Svara flerval ──────────────────────────────────────────────
function answerMC(selectedIndex, correctIndex) {
  if (state.answered) return;
  state.answered = true;

  const buttons = mcOptions.querySelectorAll('.mc-option');
  buttons.forEach(b => (b.disabled = true));

  const isCorrect = selectedIndex === correctIndex;
  buttons[correctIndex].classList.add('correct');

  if (isCorrect) {
    state.score++;
    showFeedback(true, '&#10004; Rätt!');
  } else {
    buttons[selectedIndex].classList.add('wrong');
    showFeedback(false, `&#10008; Fel. Rätt svar var: "${state.currentExercise.questions[state.currentQuestion].options[correctIndex]}"`);
  }

  showNext();
}

// ── Svara fritext ──────────────────────────────────────────────
submitText.addEventListener('click', answerText);
textAnswer.addEventListener('keydown', e => { if (e.key === 'Enter') answerText(); });

function answerText() {
  if (state.answered) return;
  const q = state.currentExercise.questions[state.currentQuestion];
  const userAns = textAnswer.value.trim().toLowerCase();
  const correct  = String(q.correctAnswer).trim().toLowerCase();

  state.answered = true;
  textAnswer.disabled = true;
  submitText.disabled = true;

  if (userAns === correct) {
    state.score++;
    showFeedback(true, '&#10004; Rätt!');
  } else {
    showFeedback(false, `&#10008; Fel. Rätt svar var: "${q.correctAnswer}"`);
  }

  showNext();
}

function showFeedback(correct, msg) {
  feedbackEl.classList.remove('hidden', 'correct', 'wrong');
  feedbackEl.classList.add(correct ? 'correct' : 'wrong');
  feedbackEl.innerHTML = msg;
}

function showNext() {
  const isLast = state.currentQuestion >= state.currentExercise.questions.length - 1;
  nextBtn.classList.remove('hidden');
  nextBtn.textContent = isLast ? '&#127937; Visa resultat' : 'Nästa fråga →';
  // Re-attach once (clean listener)
  nextBtn.replaceWith(nextBtn.cloneNode(true));
  document.getElementById('next-btn').addEventListener('click', isLast ? showResult : goNextQuestion);
  // re-grab reference after cloneNode
}

function goNextQuestion() {
  state.currentQuestion++;
  renderQuestion();
}

// ── Resultat ───────────────────────────────────────────────────
function showResult() {
  const total = state.currentExercise.questions.length;
  const pct   = Math.round((state.score / total) * 100);

  document.getElementById('result-score').textContent = `${state.score} av ${total} rätt (${pct}%)`;

  let icon, title, msg;
  if (pct === 100) {
    icon  = '🏆'; title = 'Perfekt!';           msg = 'Du fick alla rätt! Fantastiskt bra jobbat!';
  } else if (pct >= 80) {
    icon  = '⭐'; title = 'Jättefint!';          msg = 'Riktigt bra! Du kan det här!';
  } else if (pct >= 50) {
    icon  = '👍'; title = 'Bra jobbat!';         msg = 'Du är på rätt väg! Öva lite till så fixar du det!';
  } else {
    icon  = '💪'; title = 'Ge inte upp!';        msg = 'Det är okej – öva igen och du blir bättre!';
  }

  document.getElementById('result-icon').textContent  = icon;
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-msg').textContent   = msg;
  progressBar.style.width = `${pct}%`;

  showView('result');
}

// ── Knappar i result-vy ────────────────────────────────────────
retryBtn.addEventListener('click', () => startExercise(state.currentExercise.id));
homeBtn.addEventListener('click', () => {
  showView('start');
  renderGrid();
});

// ── Tillbaka-knapp ─────────────────────────────────────────────
backBtn.addEventListener('click', () => {
  showView('start');
  renderGrid();
});

// ── Visa/göm vyer ─────────────────────────────────────────────
function showView(name) {
  startView.classList.add('hidden');
  exerciseView.classList.add('hidden');
  resultView.classList.add('hidden');

  if (name === 'start')    startView.classList.remove('hidden');
  if (name === 'exercise') exerciseView.classList.remove('hidden');
  if (name === 'result')   resultView.classList.remove('hidden');
}

// ── Verktyg ────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Initiera ───────────────────────────────────────────────────
renderGrid();
