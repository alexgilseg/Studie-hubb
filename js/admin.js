/**
 * admin.js — Adminpanel (admin.html)
 * Hanterar inloggning, övningslistning och övningsredigering.
 */

// ── Tillstånd ──────────────────────────────────────────────────
let editingId   = null;   // null = ny övning, annars befintlig id
let questions   = [];     // frågorna i aktuell redigering

// ── DOM ────────────────────────────────────────────────────────
const loginView    = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');

const pwInput     = document.getElementById('pw-input');
const loginBtn    = document.getElementById('login-btn');
const loginError  = document.getElementById('login-error');
const logoutBtn   = document.getElementById('logout-btn');

const tabExercisesBtn = document.getElementById('tab-exercises');
const tabSettingsBtn  = document.getElementById('tab-settings');
const tabExercisesPanel = document.getElementById('tab-exercises-panel');
const tabSettingsPanel  = document.getElementById('tab-settings-panel');

const filterSubject  = document.getElementById('filter-subject');
const filterAge      = document.getElementById('filter-age');
const exerciseList   = document.getElementById('admin-exercise-list');
const adminNoEx      = document.getElementById('admin-no-exercises');
const newExerciseBtn = document.getElementById('new-exercise-btn');

const editorOverlay    = document.getElementById('editor-overlay');
const editorTitle      = document.getElementById('editor-title');
const closeEditorBtn   = document.getElementById('close-editor');
const cancelEditorBtn  = document.getElementById('cancel-editor-btn');
const saveExerciseBtn  = document.getElementById('save-exercise-btn');

const exTitle       = document.getElementById('ex-title');
const exSubject     = document.getElementById('ex-subject');
const exDescription = document.getElementById('ex-description');
const ageCheckboxes = document.querySelectorAll('input[name="age"]');
const questionsList = document.getElementById('questions-list');
const noQuestionsMsg = document.getElementById('no-questions-msg');

const addMcBtn   = document.getElementById('add-mc-btn');
const addTextBtn = document.getElementById('add-text-btn');

const newPw1       = document.getElementById('new-pw1');
const newPw2       = document.getElementById('new-pw2');
const changePwBtn  = document.getElementById('change-pw-btn');
const pwChangeMsg  = document.getElementById('pw-change-msg');

// ── Inloggning ─────────────────────────────────────────────────
loginBtn.addEventListener('click', attemptLogin);
pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });

function attemptLogin() {
  if (checkPassword(pwInput.value)) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    loginError.classList.add('hidden');
    renderExerciseList();
  } else {
    loginError.classList.remove('hidden');
    pwInput.value = '';
    pwInput.focus();
  }
}

logoutBtn.addEventListener('click', () => {
  dashboardView.classList.add('hidden');
  loginView.classList.remove('hidden');
  pwInput.value = '';
});

// ── Flikar ─────────────────────────────────────────────────────
tabExercisesBtn.addEventListener('click', () => {
  tabExercisesBtn.classList.add('active');
  tabSettingsBtn.classList.remove('active');
  tabExercisesPanel.classList.remove('hidden');
  tabSettingsPanel.classList.add('hidden');
});

tabSettingsBtn.addEventListener('click', () => {
  tabSettingsBtn.classList.add('active');
  tabExercisesBtn.classList.remove('active');
  tabSettingsPanel.classList.remove('hidden');
  tabExercisesPanel.classList.add('hidden');
});

// ── Filtrera lista ─────────────────────────────────────────────
filterSubject.addEventListener('change', renderExerciseList);
filterAge.addEventListener('change', renderExerciseList);

// ── Rendera övningslista ───────────────────────────────────────
function renderExerciseList() {
  const subjectFilter = filterSubject.value;
  const ageFilter     = filterAge.value;

  let all = getExercises().filter(ex => {
    const subOk = subjectFilter === 'all' || ex.subject === subjectFilter;
    const ageOk = ageFilter === 'all' || ex.ageGroups.includes(Number(ageFilter));
    return subOk && ageOk;
  });

  exerciseList.innerHTML = '';

  if (all.length === 0) {
    adminNoEx.classList.remove('hidden');
    return;
  }
  adminNoEx.classList.add('hidden');

  all.forEach(ex => {
    const sub      = SUBJECTS[ex.subject] || { label: ex.subject, icon: '📚', color: 'var(--primary)' };
    const ageLabel = ex.ageGroups.sort().map(a => a + ' år').join(', ');
    const qCount   = ex.questions ? ex.questions.length : 0;

    const item = document.createElement('div');
    item.className = 'admin-exercise-item';
    item.innerHTML = `
      <span class="subject-dot" style="background:${sub.color}"></span>
      <div class="item-info">
        <div class="item-title">${escapeHtml(ex.title)}</div>
        <div class="item-meta">${sub.icon} ${sub.label} &middot; ${ageLabel} &middot; ${qCount} frågor</div>
      </div>
      <div class="item-actions">
        <button class="btn-edit"   data-id="${ex.id}">&#9998; Redigera</button>
        <button class="btn-delete" data-id="${ex.id}">&#128465; Ta bort</button>
      </div>
    `;

    item.querySelector('.btn-edit').addEventListener('click', () => openEditor(ex.id));
    item.querySelector('.btn-delete').addEventListener('click', () => confirmDelete(ex.id, ex.title));

    exerciseList.appendChild(item);
  });
}

// ── Radera övning ──────────────────────────────────────────────
function confirmDelete(id, title) {
  if (confirm(`Ta bort övningen "${title}"? Detta kan inte ångras.`)) {
    deleteExercise(id);
    renderExerciseList();
  }
}

// ── Öppna editor ───────────────────────────────────────────────
newExerciseBtn.addEventListener('click', () => openEditor(null));

function openEditor(id) {
  editingId = id;
  questions = [];

  if (id) {
    // Redigera befintlig
    const ex = getExerciseById(id);
    if (!ex) return;
    editorTitle.textContent   = 'Redigera övning';
    exTitle.value             = ex.title;
    exSubject.value           = ex.subject;
    exDescription.value       = ex.description || '';
    ageCheckboxes.forEach(cb => { cb.checked = ex.ageGroups.includes(Number(cb.value)); });
    questions = ex.questions ? JSON.parse(JSON.stringify(ex.questions)) : [];
  } else {
    // Ny övning
    editorTitle.textContent = 'Ny övning';
    exTitle.value           = '';
    exSubject.value         = '';
    exDescription.value     = '';
    ageCheckboxes.forEach(cb => { cb.checked = false; });
    questions = [];
  }

  renderQuestionsList();
  editorOverlay.classList.remove('hidden');
}

function closeEditor() {
  editorOverlay.classList.add('hidden');
}
closeEditorBtn.addEventListener('click', closeEditor);
cancelEditorBtn.addEventListener('click', closeEditor);
editorOverlay.addEventListener('click', e => { if (e.target === editorOverlay) closeEditor(); });

// ── Spara övning ───────────────────────────────────────────────
saveExerciseBtn.addEventListener('click', () => {
  const title   = exTitle.value.trim();
  const subject = exSubject.value;
  const ageGroups = [...ageCheckboxes].filter(cb => cb.checked).map(cb => Number(cb.value));
  const description = exDescription.value.trim();

  // Validering
  if (!title)           return alert('Ange en titel.');
  if (!subject)         return alert('Välj ett ämne.');
  if (ageGroups.length === 0) return alert('Välj minst en åldersgrupp.');
  if (questions.length === 0) return alert('Lägg till minst en fråga.');

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question.trim()) return alert(`Fråga ${i + 1} saknar frågetext.`);
    if (q.type === 'multiple_choice') {
      const opts = q.options.filter(o => o.trim());
      if (opts.length < 2) return alert(`Fråga ${i + 1}: Lägg till minst 2 svarsalternativ.`);
      if (q.correctAnswer === null || q.correctAnswer === undefined)
        return alert(`Fråga ${i + 1}: Markera vilket alternativ som är rätt.`);
    } else {
      if (!String(q.correctAnswer).trim()) return alert(`Fråga ${i + 1}: Ange rätt svar.`);
    }
  }

  const exercise = {
    id:          editingId || generateId(),
    title,
    subject,
    ageGroups,
    description,
    questions:   questions.map(q => ({ ...q, options: q.options ? q.options.filter(o => o.trim()) : undefined })),
    updatedAt:   new Date().toISOString(),
  };
  if (!editingId) exercise.createdAt = exercise.updatedAt;

  saveExercise(exercise);
  closeEditor();
  renderExerciseList();
});

// ── Frågolista i editor ────────────────────────────────────────
addMcBtn.addEventListener('click',   () => addQuestion('multiple_choice'));
addTextBtn.addEventListener('click', () => addQuestion('text_input'));

function addQuestion(type) {
  questions.push({
    id:            generateId(),
    type,
    question:      '',
    options:       type === 'multiple_choice' ? ['', '', '', ''] : undefined,
    correctAnswer: type === 'multiple_choice' ? null : '',
  });
  renderQuestionsList();
}

function renderQuestionsList() {
  questionsList.innerHTML = '';

  if (questions.length === 0) {
    questionsList.appendChild(noQuestionsMsg);
    noQuestionsMsg.classList.remove('hidden');
    return;
  }
  noQuestionsMsg.classList.add('hidden');

  questions.forEach((q, qIdx) => {
    const item = document.createElement('div');
    item.className = 'question-item';

    const typeLabel = q.type === 'multiple_choice' ? 'Flerval' : 'Fritext';

    item.innerHTML = `
      <div class="question-item-header">
        <span class="question-number">${qIdx + 1}</span>
        <span class="question-type-badge">${typeLabel}</span>
        <button class="remove-question-btn" data-idx="${qIdx}" title="Ta bort fråga">&#128465;</button>
      </div>
      <div class="field-group">
        <label>Frågetext</label>
        <input type="text" class="input-field q-text" placeholder="Skriv frågan här..." value="${escapeAttr(q.question)}" />
      </div>
      ${q.type === 'multiple_choice' ? renderMCOptions(q, qIdx) : renderTextInput(q)}
    `;

    // Lyssna på frågetext
    item.querySelector('.q-text').addEventListener('input', e => {
      questions[qIdx].question = e.target.value;
    });

    if (q.type === 'multiple_choice') {
      // Svarsalternativ
      item.querySelectorAll('.mc-opt-input').forEach((inp, optIdx) => {
        inp.addEventListener('input', e => {
          questions[qIdx].options[optIdx] = e.target.value;
        });
      });

      // Rätt svar (radio)
      item.querySelectorAll('.mc-correct-radio').forEach(radio => {
        radio.addEventListener('change', e => {
          questions[qIdx].correctAnswer = Number(e.target.value);
        });
      });

      // Ta bort alternativ
      item.querySelectorAll('.remove-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const optIdx = Number(btn.dataset.opt);
          questions[qIdx].options.splice(optIdx, 1);
          if (questions[qIdx].correctAnswer >= questions[qIdx].options.length) {
            questions[qIdx].correctAnswer = null;
          }
          renderQuestionsList();
        });
      });

      // Lägg till alternativ
      const addOptBtn = item.querySelector('.add-option-btn');
      if (addOptBtn) {
        addOptBtn.addEventListener('click', () => {
          questions[qIdx].options.push('');
          renderQuestionsList();
        });
      }

    } else {
      // Fritext rätt svar
      const inp = item.querySelector('.text-correct-input');
      if (inp) {
        inp.addEventListener('input', e => {
          questions[qIdx].correctAnswer = e.target.value;
        });
      }
    }

    // Ta bort fråga
    item.querySelector('.remove-question-btn').addEventListener('click', () => {
      questions.splice(qIdx, 1);
      renderQuestionsList();
    });

    questionsList.appendChild(item);
  });
}

function renderMCOptions(q, qIdx) {
  const optRows = (q.options || []).map((opt, i) => `
    <div class="mc-option-row">
      <input type="radio" name="correct-${qIdx}" class="mc-correct-radio"
        value="${i}" ${q.correctAnswer === i ? 'checked' : ''} title="Markera som rätt svar" />
      <input type="text" class="input-field mc-opt-input" placeholder="Alternativ ${i + 1}"
        value="${escapeAttr(opt)}" />
      <button class="remove-option-btn" data-opt="${i}" title="Ta bort">&#10005;</button>
    </div>
  `).join('');

  return `
    <div class="field-group">
      <label>Svarsalternativ <span class="correct-hint">(klicka på cirkeln för att markera rätt svar)</span></label>
      ${optRows}
      ${q.options.length < 6 ? '<button class="add-option-btn">+ Lägg till alternativ</button>' : ''}
    </div>
  `;
}

function renderTextInput(q) {
  return `
    <div class="field-group">
      <label>Rätt svar</label>
      <input type="text" class="input-field text-correct-input"
        placeholder="Skriv det korrekta svaret..." value="${escapeAttr(String(q.correctAnswer || ''))}" />
    </div>
  `;
}

// ── Ändra lösenord ─────────────────────────────────────────────
changePwBtn.addEventListener('click', () => {
  const p1 = newPw1.value.trim();
  const p2 = newPw2.value.trim();

  pwChangeMsg.classList.remove('hidden');
  pwChangeMsg.style.color = '#EF4444';

  if (!p1)       return (pwChangeMsg.textContent = 'Ange ett nytt lösenord.');
  if (p1 !== p2) return (pwChangeMsg.textContent = 'Lösenorden matchar inte.');
  if (p1.length < 4) return (pwChangeMsg.textContent = 'Lösenordet måste vara minst 4 tecken.');

  changePassword(p1);
  newPw1.value = '';
  newPw2.value = '';
  pwChangeMsg.style.color = '#10B981';
  pwChangeMsg.textContent = '✓ Lösenordet har ändrats!';
});

// ── Verktyg ────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
