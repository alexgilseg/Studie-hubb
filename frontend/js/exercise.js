/* ================================================
   Studie-hubb — Övningsspelaren
   ================================================ */

const params     = new URLSearchParams(location.search);
const exerciseId = params.get('id');
const profileId  = params.get('pid') || API.getActiveProfile()?.id;

if (!exerciseId || !profileId) location.href = 'index.html';

document.getElementById('btn-back').addEventListener('click', () => {
  history.back();
});

let exercise  = null;
let questions = [];
let current   = 0;
let score     = 0;
let answers   = [];
let startTime = null;
let qStartTime = null;

async function init() {
  try {
    exercise  = await API.exercises.get(exerciseId);
    questions = exercise.questions || [];

    if (!questions.length) {
      document.getElementById('question-text').textContent = 'Övningen har inga frågor ännu.';
      return;
    }

    document.getElementById('exercise-title').textContent = exercise.title;
    startTime = Date.now();
    showQuestion(0);
  } catch (e) {
    document.getElementById('exercise-title').textContent = 'Kunde inte ladda övning';
    showToast('Fel: ' + e.message, 'error');
  }
}

function showQuestion(index) {
  current   = index;
  qStartTime = Date.now();
  const q   = questions[index];
  const total = questions.length;

  document.getElementById('progress-text').textContent  = `${index + 1} / ${total}`;
  document.getElementById('progress-bar').style.width   = `${(index / total) * 100}%`;
  document.getElementById('question-text').textContent  = q.question_text;
  document.getElementById('feedback').classList.add('hidden');
  document.getElementById('btn-next').classList.add('hidden');

  const inputEl = document.getElementById('question-input');
  inputEl.innerHTML = '';

  if (q.type === 'multiple_choice') {
    const opts = q.options || [];
    const wrap = document.createElement('div');
    wrap.className = 'mc-options';
    opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'mc-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleMCAnswer(i, String(q.correct_answer), opts));
      wrap.appendChild(btn);
    });
    inputEl.appendChild(wrap);
  } else {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.gap = '10px';

    const input = document.createElement('input');
    input.className = 'input-field text-answer';
    input.type = 'text';
    input.placeholder = 'Skriv ditt svar...';
    input.autocomplete = 'off';

    const submit = document.createElement('button');
    submit.className = 'btn btn-primary';
    submit.textContent = 'Svara';
    submit.addEventListener('click', () => handleTextAnswer(input.value, q.correct_answer));
    input.addEventListener('keydown', e => e.key === 'Enter' && handleTextAnswer(input.value, q.correct_answer));

    wrap.appendChild(input);
    wrap.appendChild(submit);
    inputEl.appendChild(wrap);
    input.focus();
  }
}

function handleMCAnswer(selectedIdx, correctIdx, opts) {
  const timeTaken = Date.now() - qStartTime;
  const isCorrect = String(selectedIdx) === String(correctIdx);
  if (isCorrect) score++;

  answers.push({
    question_ref: questions[current].id,
    answer_given: String(selectedIdx),
    is_correct:   isCorrect,
    time_ms:      timeTaken
  });

  // Visa feedback på knapparna
  const buttons = document.querySelectorAll('.mc-option');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === parseInt(correctIdx)) btn.classList.add('correct');
    else if (i === selectedIdx && !isCorrect) btn.classList.add('wrong');
  });

  showFeedback(isCorrect, opts[correctIdx]);
}

function handleTextAnswer(value, correctAnswer) {
  const timeTaken = Date.now() - qStartTime;
  const given     = value.trim().toLowerCase();
  const expected  = String(correctAnswer).trim().toLowerCase();
  const isCorrect = given === expected;
  if (isCorrect) score++;

  answers.push({
    question_ref: questions[current].id,
    answer_given: value.trim(),
    is_correct:   isCorrect,
    time_ms:      timeTaken
  });

  // Lås input
  const input  = document.querySelector('.text-answer');
  const submit = document.querySelector('.btn-primary');
  if (input)  { input.disabled = true; input.style.borderColor = isCorrect ? 'var(--success)' : 'var(--danger)'; }
  if (submit) submit.disabled = true;

  showFeedback(isCorrect, correctAnswer);
}

function showFeedback(isCorrect, correctAnswer) {
  const fb = document.getElementById('feedback');
  fb.className = `feedback ${isCorrect ? 'correct' : 'wrong'}`;
  fb.textContent = isCorrect
    ? '✓ Rätt! Bra jobbat!'
    : `✗ Fel. Rätt svar: ${correctAnswer}`;
  fb.classList.remove('hidden');

  const next = document.getElementById('btn-next');
  next.classList.remove('hidden');
  const isLast = current === questions.length - 1;
  next.textContent = isLast ? 'Se resultat →' : 'Nästa →';
  next.onclick = isLast ? finishExercise : () => showQuestion(current + 1);
}

async function finishExercise() {
  const duration = Math.round((Date.now() - startTime) / 1000);
  const max      = questions.length;

  document.getElementById('view-exercise').classList.add('hidden');
  document.getElementById('view-result').classList.remove('hidden');

  // Visa score direkt
  const pct = Math.round((score / max) * 100);
  let icon, heading, msg;

  if (pct === 100)     { icon = '🏆'; heading = 'Perfekt!';       msg = 'Fantastiskt bra jobbat! Fullpoäng!'; }
  else if (pct >= 80)  { icon = '⭐'; heading = 'Jättefint!';     msg = 'Nästan perfekt – du är på rätt väg!'; }
  else if (pct >= 50)  { icon = '👍'; heading = 'Bra jobbat!';    msg = 'Mer än hälften rätt – fortsätt öva!'; }
  else                 { icon = '💪'; heading = 'Ge inte upp!';   msg = 'Försök igen – du lär dig för varje gång!'; }

  document.getElementById('result-icon').textContent    = icon;
  document.getElementById('result-heading').textContent = heading;
  document.getElementById('result-score').textContent   = `${score} av ${max} rätt (${pct}%)`;
  document.getElementById('result-msg').textContent     = msg;
  document.getElementById('result-xp').textContent      = 'Beräknar XP...';

  // Spara session
  try {
    const result = await API.sessions.save({
      profile_id:       parseInt(profileId),
      exercise_id:      parseInt(exerciseId),
      score,
      max_score:        max,
      duration_seconds: duration,
      answers
    });

    document.getElementById('result-xp').textContent = `+${result.xp_earned} XP`;

    if (result.streak_bonus) showToast(`🔥 ${result.streak} dagars streak!`, 'success');

    if (result.new_badges?.length) {
      const badgesSection = document.getElementById('result-new-badges');
      const badgesList    = document.getElementById('new-badges-list');
      badgesSection.classList.remove('hidden');
      badgesList.innerHTML = result.new_badges.map(b =>
        `<div class="new-badge-row">${b.icon} <strong>${b.name}</strong> — ${b.description}</div>`
      ).join('');
    }
  } catch (e) {
    document.getElementById('result-xp').textContent = '+0 XP';
    showToast('Kunde inte spara resultat: ' + e.message, 'error');
  }
}

document.getElementById('btn-retry').addEventListener('click', () => {
  score   = 0;
  answers = [];
  document.getElementById('view-result').classList.add('hidden');
  document.getElementById('view-exercise').classList.remove('hidden');
  // Hämta nya slumpmässiga frågor
  API.exercises.get(exerciseId).then(ex => {
    exercise  = ex;
    questions = ex.questions;
    startTime = Date.now();
    showQuestion(0);
  });
});

document.getElementById('btn-home').addEventListener('click', () => {
  location.href = `exercises.html?pid=${profileId}`;
});

init();
