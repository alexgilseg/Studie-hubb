/* ================================================
   Studie-hubb — Föräldrapanel
   ================================================ */

/* ---- AUTH ---- */
const loginView = document.getElementById('view-login');
const adminView = document.getElementById('view-admin');

document.getElementById('btn-login').addEventListener('click', tryLogin);
document.getElementById('login-password').addEventListener('keydown', e => e.key === 'Enter' && tryLogin());

function tryLogin() {
  const pw = document.getElementById('login-password').value;
  if (pw === API.getStoredPassword()) {
    API.setAdminToken('ok');
    loginView.classList.add('hidden');
    adminView.classList.remove('hidden');
    initAdmin();
  } else {
    document.getElementById('login-error').classList.remove('hidden');
  }
}

document.getElementById('btn-logout').addEventListener('click', () => {
  API.clearAdminToken();
  adminView.classList.add('hidden');
  loginView.classList.remove('hidden');
  document.getElementById('login-password').value = '';
});

// Auto-login om token finns
if (API.getAdminToken()) {
  loginView.classList.add('hidden');
  adminView.classList.remove('hidden');
  document.addEventListener('DOMContentLoaded', initAdmin);
}

/* ---- TABS ---- */
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    ['exercises','exams','profiles','settings'].forEach(id => {
      document.getElementById(`tab-${id}`).classList.add('hidden');
    });
    document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
  });
});

/* ---- SUBJECTS in selects ---- */
function populateSubjectSelect(selectId) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = API.SUBJECTS.map(s =>
    `<option value="${s.id}">${s.icon} ${s.label}</option>`
  ).join('');
}

/* ---- MAIN INIT ---- */
async function initAdmin() {
  populateSubjectSelect('ex-subject');
  populateSubjectSelect('filter-subject');
  populateSubjectSelect('exam-subject');
  buildAvatarPicker('admin-avatar-picker', 'profile-avatar');
  await Promise.all([loadExercises(), loadExams(), loadProfiles(), loadLeaderboard()]);
  populateProfileDropdowns();
  setupPasswordChange();
}

/* ================================================
   EXERCISES
   ================================================ */
let editingExerciseId = null;
let localQuestions    = [];

document.getElementById('btn-new-exercise').addEventListener('click', () => openEditor(null));
document.getElementById('close-editor').addEventListener('click', closeEditor);
document.getElementById('cancel-editor').addEventListener('click', closeEditor);
document.getElementById('save-editor').addEventListener('click', saveExercise);
document.getElementById('add-mc-btn').addEventListener('click', () => addQuestion('multiple_choice'));
document.getElementById('add-text-btn').addEventListener('click', () => addQuestion('text_input'));

document.getElementById('filter-subject').addEventListener('change', loadExercises);
document.getElementById('filter-search').addEventListener('input', loadExercises);

async function loadExercises() {
  const subject = document.getElementById('filter-subject').value;
  const search  = document.getElementById('filter-search').value.toLowerCase();
  const list    = document.getElementById('admin-exercise-list');
  list.innerHTML = '<p class="muted">Laddar...</p>';

  try {
    const params = {};
    if (subject) params.subject = subject;
    let exercises = await API.exercises.list(params);
    if (search) exercises = exercises.filter(e => e.title.toLowerCase().includes(search));

    if (!exercises.length) {
      list.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>Inga övningar hittades</p></div>`;
      return;
    }

    list.innerHTML = exercises.map(e => {
      const subj = API.getSubject(e.subject);
      const stars = '⭐'.repeat(e.difficulty);
      return `
        <div class="admin-exercise-item">
          <div class="subject-dot" style="background:${subj.color}"></div>
          <div class="item-info">
            <div class="item-title">${e.title}</div>
            <div class="item-meta">${subj.icon} ${subj.label} · ${stars} · ${e.question_count} frågor · Ålder ${e.age_min}–${e.age_max}</div>
          </div>
          <div class="item-actions">
            <button class="btn-edit" data-id="${e.id}">Redigera</button>
            <button class="btn-delete" data-id="${e.id}">Ta bort</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.btn-edit').forEach(btn =>
      btn.addEventListener('click', () => openEditor(parseInt(btn.dataset.id)))
    );
    list.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', () => deleteExercise(parseInt(btn.dataset.id)))
    );
  } catch (e) {
    list.innerHTML = `<p class="muted">Fel: ${e.message}</p>`;
  }
}

async function openEditor(id) {
  editingExerciseId = id;
  localQuestions    = [];

  document.getElementById('editor-title').textContent = id ? 'Redigera övning' : 'Ny övning';
  document.getElementById('ex-title').value       = '';
  document.getElementById('ex-description').value = '';
  document.getElementById('ex-difficulty').value  = '3';
  document.getElementById('ex-age-min').value     = '7';
  document.getElementById('ex-age-max').value     = '12';
  document.getElementById('questions-list').innerHTML = '';

  if (id) {
    try {
      const ex = await API.exercises.get(id);
      document.getElementById('ex-title').value       = ex.title;
      document.getElementById('ex-subject').value     = ex.subject;
      document.getElementById('ex-description').value = ex.description || '';
      document.getElementById('ex-difficulty').value  = ex.difficulty;
      document.getElementById('ex-age-min').value     = ex.age_min;
      document.getElementById('ex-age-max').value     = ex.age_max;

      localQuestions = ex.questions
        .filter(q => !q.is_generated)
        .map(q => ({
          id: q.id,
          type: q.type,
          question_text: q.question_text,
          options: q.options || [],
          correct_answer: q.correct_answer
        }));
      renderQuestions();
    } catch (e) {
      showToast('Kunde inte ladda övning: ' + e.message, 'error');
    }
  }

  document.getElementById('exercise-overlay').classList.remove('hidden');
  document.getElementById('ex-title').focus();
}

function closeEditor() {
  document.getElementById('exercise-overlay').classList.add('hidden');
  editingExerciseId = null;
  localQuestions    = [];
}

async function saveExercise() {
  const title       = document.getElementById('ex-title').value.trim();
  const subject     = document.getElementById('ex-subject').value;
  const description = document.getElementById('ex-description').value.trim();
  const difficulty  = parseInt(document.getElementById('ex-difficulty').value);
  const age_min     = parseInt(document.getElementById('ex-age-min').value);
  const age_max     = parseInt(document.getElementById('ex-age-max').value);

  if (!title) { showToast('Titel krävs', 'error'); return; }

  collectQuestionsFromDOM();

  try {
    let exId = editingExerciseId;

    if (exId) {
      await API.exercises.update(exId, { title, subject, description, difficulty, age_min, age_max });
    } else {
      const res = await API.exercises.create({ title, subject, description, difficulty, age_min, age_max });
      exId = res.id;
    }

    // Synka frågor (ta bort och lägg till på nytt om redigerar)
    if (editingExerciseId) {
      const existing = await API.exercises.get(exId);
      for (const q of existing.questions.filter(q => !q.is_generated)) {
        await API.exercises.deleteQuestion(exId, q.id);
      }
    }

    for (const q of localQuestions) {
      await API.exercises.addQuestion(exId, {
        type: q.type,
        question_text: q.question_text,
        options: q.type === 'multiple_choice' ? q.options : null,
        correct_answer: q.correct_answer
      });
    }

    showToast(editingExerciseId ? 'Övning sparad!' : 'Övning skapad! 🎉', 'success');
    closeEditor();
    loadExercises();
  } catch (e) {
    showToast('Fel vid sparning: ' + e.message, 'error');
  }
}

async function deleteExercise(id) {
  if (!confirm('Är du säker på att du vill ta bort denna övning?')) return;
  try {
    await API.exercises.delete(id);
    showToast('Övning borttagen', 'success');
    loadExercises();
  } catch (e) {
    showToast('Fel: ' + e.message, 'error');
  }
}

/* Questions DOM */
function addQuestion(type) {
  localQuestions.push({
    type,
    question_text: '',
    options: type === 'multiple_choice' ? ['', ''] : [],
    correct_answer: type === 'multiple_choice' ? '0' : ''
  });
  renderQuestions();
  document.querySelector('.question-item:last-child input')?.focus();
}

function collectQuestionsFromDOM() {
  const items = document.querySelectorAll('.question-item');
  localQuestions = Array.from(items).map(item => {
    const type = item.dataset.type;
    const q_text = item.querySelector('.q-text')?.value.trim() || '';

    if (type === 'multiple_choice') {
      const optInputs = item.querySelectorAll('.opt-input');
      const options   = Array.from(optInputs).map(i => i.value.trim());
      const correctEl = item.querySelector('input[type="radio"]:checked');
      const correct   = correctEl ? correctEl.value : '0';
      return { type, question_text: q_text, options, correct_answer: correct };
    } else {
      const correct = item.querySelector('.q-answer')?.value.trim() || '';
      return { type, question_text: q_text, options: [], correct_answer: correct };
    }
  });
}

function renderQuestions() {
  const list = document.getElementById('questions-list');
  list.innerHTML = localQuestions.map((q, idx) => {
    if (q.type === 'multiple_choice') {
      const opts = q.options.map((opt, oi) => `
        <div class="mc-option-row">
          <input type="radio" name="correct-${idx}" value="${oi}" ${String(q.correct_answer) === String(oi) ? 'checked' : ''}>
          <input class="input-field opt-input" type="text" value="${opt}" placeholder="Alternativ ${oi + 1}">
          ${q.options.length > 2 ? `<button type="button" class="remove-option-btn" data-qi="${idx}" data-oi="${oi}">✕</button>` : ''}
        </div>
      `).join('');

      return `
        <div class="question-item" data-qi="${idx}" data-type="multiple_choice">
          <div class="question-item-header">
            <div class="question-number">${idx + 1}</div>
            <div class="question-type-badge">Flerval</div>
            <button type="button" class="remove-question-btn" data-qi="${idx}">✕</button>
          </div>
          <input class="input-field q-text" type="text" value="${q.question_text}" placeholder="Frågetext...">
          <div class="mc-options-editor">${opts}</div>
          <p class="correct-hint">Markera rätt svar med radio-knappen</p>
          ${q.options.length < 6 ? `<button type="button" class="add-option-btn" data-qi="${idx}">+ Lägg till alternativ</button>` : ''}
        </div>
      `;
    } else {
      return `
        <div class="question-item" data-qi="${idx}" data-type="text_input">
          <div class="question-item-header">
            <div class="question-number">${idx + 1}</div>
            <div class="question-type-badge">Fritext</div>
            <button type="button" class="remove-question-btn" data-qi="${idx}">✕</button>
          </div>
          <input class="input-field q-text" type="text" value="${q.question_text}" placeholder="Frågetext...">
          <input class="input-field q-answer" type="text" value="${q.correct_answer}" placeholder="Rätt svar (exakt)">
        </div>
      `;
    }
  }).join('');

  // Event listeners
  list.querySelectorAll('.remove-question-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      collectQuestionsFromDOM();
      localQuestions.splice(parseInt(btn.dataset.qi), 1);
      renderQuestions();
    })
  );
  list.querySelectorAll('.add-option-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      collectQuestionsFromDOM();
      localQuestions[parseInt(btn.dataset.qi)].options.push('');
      renderQuestions();
    })
  );
  list.querySelectorAll('.remove-option-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      collectQuestionsFromDOM();
      const qi = parseInt(btn.dataset.qi);
      const oi = parseInt(btn.dataset.oi);
      localQuestions[qi].options.splice(oi, 1);
      if (parseInt(localQuestions[qi].correct_answer) >= localQuestions[qi].options.length) {
        localQuestions[qi].correct_answer = '0';
      }
      renderQuestions();
    })
  );
}

/* ================================================
   EXAMS
   ================================================ */
let editingExamId = null;

document.getElementById('btn-new-exam').addEventListener('click', () => openExamEditor(null));
document.getElementById('close-exam-editor').addEventListener('click', closeExamEditor);
document.getElementById('cancel-exam-editor').addEventListener('click', closeExamEditor);
document.getElementById('save-exam-editor').addEventListener('click', saveExam);

async function loadExams() {
  const list = document.getElementById('admin-exam-list');
  const profileFilter = document.getElementById('exam-filter-profile').value;
  list.innerHTML = '<p class="muted">Laddar...</p>';

  try {
    const profiles = await API.profiles.list();
    const allExams = [];

    for (const p of profiles) {
      if (profileFilter && String(p.id) !== profileFilter) continue;
      const exams = await API.exams.list(p.id);
      allExams.push(...exams.map(e => ({ ...e, profile: p })));
    }

    allExams.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

    if (!allExams.length) {
      list.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>Inga prov inlagda</p></div>`;
      return;
    }

    list.innerHTML = allExams.map(e => {
      const subj = API.getSubject(e.subject);
      const r    = e.readiness || { score: 0, color: 'gray', label: '–' };
      const days = Math.ceil(e.days_until);
      return `
        <div class="admin-exam-item">
          <div class="subject-dot" style="background:${subj.color}"></div>
          <div class="item-info">
            <div class="item-title">${e.name}</div>
            <div class="item-meta">
              ${subj.icon} ${subj.label} · ${API.formatDate(e.exam_date)}
              ${days >= 0 ? ` · Om ${days} dag${days !== 1 ? 'ar' : ''}` : ' · Genomfört'}
              · ${e.exercise_count} övning${e.exercise_count !== 1 ? 'ar' : ''}
            </div>
          </div>
          <span class="exam-profile-chip">${e.profile.name}</span>
          <div style="font-size:0.82rem;font-weight:700;color:var(--${r.color === 'green' ? 'success' : r.color === 'yellow' ? 'warning' : 'danger'})">${r.score}%</div>
          <div class="item-actions">
            <button class="btn-edit" data-id="${e.id}">Redigera</button>
            <button class="btn-delete" data-id="${e.id}">Ta bort</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.btn-edit').forEach(btn =>
      btn.addEventListener('click', () => openExamEditor(parseInt(btn.dataset.id)))
    );
    list.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', () => deleteExam(parseInt(btn.dataset.id)))
    );
  } catch (e) {
    list.innerHTML = `<p class="muted">Fel: ${e.message}</p>`;
  }
}

document.getElementById('exam-filter-profile').addEventListener('change', loadExams);

async function openExamEditor(id) {
  editingExamId = id;
  document.getElementById('exam-editor-title').textContent = id ? 'Redigera prov' : 'Nytt prov';
  document.getElementById('exam-name').value = '';
  document.getElementById('exam-date').value = '';

  // Fyll profil-dropdown
  const profiles = await API.profiles.list();
  const profSel  = document.getElementById('exam-profile');
  profSel.innerHTML = profiles.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  // Fyll ämne
  populateSubjectSelect('exam-subject');

  // Ladda övningar i picker
  await loadExamExercisePicker([], profiles[0]?.id);
  profSel.addEventListener('change', () => {
    const selectedExIds = getSelectedExerciseIds();
    loadExamExercisePicker(selectedExIds, parseInt(profSel.value));
  });

  if (id) {
    const exam = await API.exams.get(id);
    document.getElementById('exam-name').value    = exam.name;
    document.getElementById('exam-date').value    = exam.exam_date;
    document.getElementById('exam-subject').value = exam.subject;
    profSel.value = exam.profile_id;
    const selectedIds = (exam.exercises || []).map(e => e.id);
    await loadExamExercisePicker(selectedIds, exam.profile_id);
  }

  document.getElementById('exam-overlay').classList.remove('hidden');
}

async function loadExamExercisePicker(selectedIds = [], profileId) {
  const picker = document.getElementById('exam-exercise-picker');
  const exercises = await API.exercises.list();
  picker.innerHTML = exercises.map(e => {
    const subj = API.getSubject(e.subject);
    const checked = selectedIds.includes(e.id) ? 'checked' : '';
    return `
      <label style="display:flex;align-items:center;gap:8px;padding:8px;border:2px solid var(--border);border-radius:8px;cursor:pointer;transition:border-color 0.2s">
        <input type="checkbox" value="${e.id}" ${checked} style="width:16px;height:16px;accent-color:var(--primary)">
        <span>${subj.icon} ${e.title}</span>
        <span style="margin-left:auto;font-size:0.75rem;color:var(--muted)">${subj.label}</span>
      </label>
    `;
  }).join('');
}

function getSelectedExerciseIds() {
  return Array.from(document.querySelectorAll('#exam-exercise-picker input:checked'))
    .map(cb => parseInt(cb.value));
}

async function saveExam() {
  const name        = document.getElementById('exam-name').value.trim();
  const profile_id  = parseInt(document.getElementById('exam-profile').value);
  const subject     = document.getElementById('exam-subject').value;
  const exam_date   = document.getElementById('exam-date').value;
  const exercise_ids = getSelectedExerciseIds();

  if (!name || !exam_date) { showToast('Namn och datum krävs', 'error'); return; }

  try {
    if (editingExamId) {
      await API.exams.update(editingExamId, { name, subject, exam_date });
      await API.exams.updateExercises(editingExamId, exercise_ids);
    } else {
      await API.exams.create({ profile_id, name, subject, exam_date, exercise_ids });
    }
    showToast(editingExamId ? 'Prov uppdaterat!' : 'Prov skapat! 🎉', 'success');
    closeExamEditor();
    loadExams();
  } catch (e) {
    showToast('Fel: ' + e.message, 'error');
  }
}

async function deleteExam(id) {
  if (!confirm('Ta bort provet?')) return;
  await API.exams.delete(id);
  showToast('Prov borttaget', 'success');
  loadExams();
}

function closeExamEditor() {
  document.getElementById('exam-overlay').classList.add('hidden');
  editingExamId = null;
}

/* ================================================
   PROFILES
   ================================================ */
let editingProfileId = null;

document.getElementById('btn-new-profile').addEventListener('click', () => openProfileEditor(null));
document.getElementById('close-profile-editor').addEventListener('click', closeProfileEditor);
document.getElementById('cancel-profile-editor').addEventListener('click', closeProfileEditor);
document.getElementById('save-profile-editor').addEventListener('click', saveProfile);

async function loadProfiles() {
  const list = document.getElementById('profile-manage-list');
  try {
    const profiles = await API.profiles.list();
    list.innerHTML = profiles.map(p => {
      const age    = API.getAge(p.birthdate);
      const avatar = API.AVATARS[(p.avatar_id - 1) % API.AVATARS.length] || '🦊';
      return `
        <div class="profile-manage-item">
          <div class="profile-manage-avatar">${avatar}</div>
          <div class="profile-manage-info">
            <div class="profile-manage-name">${p.name}</div>
            <div class="profile-manage-meta">${age} år · Född ${API.formatDate(p.birthdate)}</div>
          </div>
          <div class="item-actions">
            <button class="btn-edit" data-id="${p.id}">Redigera</button>
            <button class="btn-delete" data-id="${p.id}">Ta bort</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.btn-edit').forEach(btn =>
      btn.addEventListener('click', () => openProfileEditor(parseInt(btn.dataset.id)))
    );
    list.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', () => deleteProfile(parseInt(btn.dataset.id)))
    );
  } catch (e) {
    list.innerHTML = `<p class="muted">Fel: ${e.message}</p>`;
  }
}

async function loadLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  try {
    const board = await API.gamification.leaderboard();
    list.innerHTML = board.map((p, i) => {
      const avatar = API.AVATARS[(p.avatar_id - 1) % API.AVATARS.length] || '🦊';
      const medal  = ['🥇','🥈','🥉'][i] || `${i+1}.`;
      return `
        <div style="background:var(--white);border-radius:var(--radius-sm);padding:14px 18px;display:flex;align-items:center;gap:14px;box-shadow:var(--shadow)">
          <div style="font-size:1.4rem">${medal}</div>
          <div style="font-size:1.6rem">${avatar}</div>
          <div style="flex:1"><div style="font-weight:700">${p.name}</div>
            <div class="muted">Nivå ${p.level} · 🔥 ${p.streak_current} streak</div></div>
          <div style="font-weight:800;font-size:1.1rem;color:var(--primary)">${p.xp_total} XP</div>
        </div>
      `;
    }).join('');
  } catch {}
}

async function openProfileEditor(id) {
  editingProfileId = id;
  document.getElementById('profile-editor-title').textContent = id ? 'Redigera profil' : 'Ny profil';
  document.getElementById('profile-name').value      = '';
  document.getElementById('profile-birthdate').value = '';
  document.getElementById('profile-avatar').value    = '1';
  resetAvatarPicker('admin-avatar-picker', 'profile-avatar');

  if (id) {
    const profiles = await API.profiles.list();
    const p = profiles.find(p => p.id === id);
    if (p) {
      document.getElementById('profile-name').value      = p.name;
      document.getElementById('profile-birthdate').value = p.birthdate;
      document.getElementById('profile-avatar').value    = p.avatar_id;
      resetAvatarPicker('admin-avatar-picker', 'profile-avatar', p.avatar_id);
    }
  }
  document.getElementById('profile-overlay').classList.remove('hidden');
}

async function saveProfile() {
  const name      = document.getElementById('profile-name').value.trim();
  const birthdate = document.getElementById('profile-birthdate').value;
  const avatar_id = parseInt(document.getElementById('profile-avatar').value);

  if (!name || !birthdate) { showToast('Namn och datum krävs', 'error'); return; }

  try {
    if (editingProfileId) {
      await API.profiles.update(editingProfileId, { name, birthdate, avatar_id });
    } else {
      await API.profiles.create({ name, birthdate, avatar_id });
    }
    showToast('Profil sparad!', 'success');
    closeProfileEditor();
    loadProfiles();
    loadLeaderboard();
    populateProfileDropdowns();
  } catch (e) {
    showToast('Fel: ' + e.message, 'error');
  }
}

async function deleteProfile(id) {
  if (!confirm('Ta bort profilen och ALL data för denna profil?')) return;
  await API.profiles.delete(id);
  showToast('Profil borttagen', 'success');
  loadProfiles();
}

function closeProfileEditor() {
  document.getElementById('profile-overlay').classList.add('hidden');
  editingProfileId = null;
}

async function populateProfileDropdowns() {
  try {
    const profiles = await API.profiles.list();
    const opts = `<option value="">Alla profiler</option>` +
      profiles.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    document.getElementById('filter-profile').innerHTML = opts;
    document.getElementById('exam-filter-profile').innerHTML = opts;
  } catch {}
}

/* ================================================
   AVATAR PICKER
   ================================================ */
function buildAvatarPicker(containerId, inputId) {
  const picker = document.getElementById(containerId);
  picker.innerHTML = '';
  API.AVATARS.forEach((emoji, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = emoji;
    btn.style.cssText = 'font-size:1.8rem;background:var(--bg);border:2px solid var(--border);border-radius:10px;padding:6px 10px;cursor:pointer;transition:border-color 0.2s';
    btn.dataset.idx = i + 1;
    btn.addEventListener('click', () => {
      picker.querySelectorAll('button').forEach(b => b.style.borderColor = 'var(--border)');
      btn.style.borderColor = 'var(--primary)';
      document.getElementById(inputId).value = i + 1;
    });
    picker.appendChild(btn);
  });
  picker.firstChild.style.borderColor = 'var(--primary)';
}

function resetAvatarPicker(containerId, inputId, selectedIdx = 1) {
  const picker = document.getElementById(containerId);
  picker.querySelectorAll('button').forEach(btn => {
    btn.style.borderColor = parseInt(btn.dataset.idx) === selectedIdx ? 'var(--primary)' : 'var(--border)';
  });
  document.getElementById(inputId).value = selectedIdx;
}

/* ================================================
   SETTINGS
   ================================================ */
function setupPasswordChange() {
  document.getElementById('btn-change-password').addEventListener('click', () => {
    const current  = document.getElementById('current-password').value;
    const next     = document.getElementById('new-password').value;
    const confirm  = document.getElementById('confirm-password').value;
    const errEl    = document.getElementById('password-error');

    if (current !== API.getStoredPassword()) { errEl.textContent = 'Fel nuvarande lösenord'; errEl.classList.remove('hidden'); return; }
    if (next.length < 4)                      { errEl.textContent = 'Nytt lösenord för kort (min 4 tecken)'; errEl.classList.remove('hidden'); return; }
    if (next !== confirm)                     { errEl.textContent = 'Lösenorden matchar inte'; errEl.classList.remove('hidden'); return; }

    API.setStoredPassword(next);
    errEl.classList.add('hidden');
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value     = '';
    document.getElementById('confirm-password').value = '';
    showToast('Lösenord ändrat!', 'success');
  });
}
