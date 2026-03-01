/* ================================================
   Studie-hubb — Övningslista
   ================================================ */

const params    = new URLSearchParams(location.search);
const profileId = params.get('pid') || API.getActiveProfile()?.id;
const initSubject = params.get('subject') || '';

if (!profileId) location.href = 'index.html';

document.getElementById('back-to-dash').href = `dashboard.html?pid=${profileId}`;

let activeSubject    = initSubject;
let activeDifficulty = '';
let allExercises     = [];
let dueExerciseIds   = new Set(); // övningar med repetitionsfrågor

const initMode = params.get('mode') || '';

async function init() {
  buildSubjectChips();
  await Promise.all([loadExercises(), loadDueExercises()]);
  document.getElementById('difficulty-filter').addEventListener('change', e => {
    activeDifficulty = e.target.value;
    renderExercises();
  });
}

async function loadDueExercises() {
  try {
    const data = await fetch(`http://localhost:3000/api/spaced-repetition/due?profile_id=${profileId}&limit=100`).then(r => r.json());
    if (data.exercises?.length) {
      dueExerciseIds = new Set(data.exercises.map(e => e.id));
    }
  } catch (_) {}
}

function buildSubjectChips() {
  const chips = document.getElementById('subject-chips');
  chips.innerHTML = `<button class="chip ${activeSubject === '' ? 'active' : ''}" data-subject="">Alla ämnen</button>`;

  for (const s of API.SUBJECTS) {
    const btn = document.createElement('button');
    btn.className = `chip chip-subject ${activeSubject === s.id ? 'active' : ''}`;
    btn.dataset.subject = s.id;
    btn.style.setProperty('--chip-color', s.color);
    btn.textContent = `${s.icon} ${s.label}`;
    chips.appendChild(btn);
  }

  chips.addEventListener('click', e => {
    const btn = e.target.closest('[data-subject]');
    if (!btn) return;
    activeSubject = btn.dataset.subject;
    chips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderExercises();
  });
}

async function loadExercises() {
  const grid = document.getElementById('exercises-grid');
  grid.innerHTML = document.getElementById('loading-state').outerHTML;

  try {
    allExercises = await API.exercises.list({ profile_id: profileId });
    renderExercises();
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Kunde inte ladda övningar</p></div>`;
  }
}

function renderExercises() {
  const grid = document.getElementById('exercises-grid');

  let list = allExercises.filter(e => {
    if (activeSubject && e.subject !== activeSubject) return false;
    if (activeDifficulty && e.difficulty !== parseInt(activeDifficulty)) return false;
    if (initMode === 'repetition' && !dueExerciseIds.has(e.id)) return false;
    return true;
  });

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><p>Inga övningar hittades</p></div>`;
    return;
  }

  grid.innerHTML = list.map(e => {
    const subj = API.getSubject(e.subject);
    const last = e.last_session;
    const scoreLabel = last
      ? `${Math.round(last.score / last.max_score * 100)}%`
      : null;
    const scoreCls = last ? API.scoreClass(last.score, last.max_score) : '';
    const stars = '⭐'.repeat(e.difficulty);
    const isDue = dueExerciseIds.has(e.id);

    return `
      <a class="exercise-card" href="exercise.html?id=${e.id}&pid=${profileId}"
         style="--card-color:${subj.color}">
        <div class="card-subject-badge">
          ${subj.icon} ${subj.label}
          ${isDue ? '<span class="sr-due-indicator">🔁 Repetera</span>' : ''}
        </div>
        <div class="card-title">${e.title}</div>
        ${e.description ? `<div class="card-description">${e.description}</div>` : ''}
        <div class="card-meta">
          <span>${stars}</span>
          <span>${e.question_count} frågor</span>
          ${scoreLabel ? `<span class="card-last-score ${scoreCls}">Senast: ${scoreLabel}</span>` : ''}
        </div>
      </a>
    `;
  }).join('');
}

init();
