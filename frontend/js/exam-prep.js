/* ================================================
   Studie-hubb — Provberedskap
   ================================================ */

const params    = new URLSearchParams(location.search);
const profileId = params.get('pid') || API.getActiveProfile()?.id;

if (!profileId) location.href = 'index.html';

document.getElementById('back-link').href = `dashboard.html?pid=${profileId}`;

async function init() {
  const container = document.getElementById('exams-container');

  try {
    const exams = await API.exams.list(profileId);

    if (!exams.length) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📝</span>
          <p>Inga prov inlagda ännu.</p>
          <p class="muted" style="margin-top:8px">Be din förälder lägga till prov i föräldrapanelen.</p>
        </div>
      `;
      return;
    }

    const upcoming = exams.filter(e => e.days_until >= 0);
    const past     = exams.filter(e => e.days_until < 0);

    container.innerHTML = '';

    if (upcoming.length) {
      container.insertAdjacentHTML('beforeend', `<div class="section-title" style="margin-bottom:16px">Kommande prov</div>`);
      container.insertAdjacentHTML('beforeend', upcoming.map(e => examCard(e)).join(''));
    }

    if (past.length) {
      container.insertAdjacentHTML('beforeend', `<div class="section-title" style="margin-top:32px;margin-bottom:16px">Tidigare prov</div>`);
      container.insertAdjacentHTML('beforeend', past.map(e => examCard(e, true)).join(''));
    }

    // Click handlers
    container.querySelectorAll('[data-exam-id]').forEach(el => {
      el.addEventListener('click', () => openExamDetail(parseInt(el.dataset.examId)));
    });
    container.querySelectorAll('[data-exercise-link]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        location.href = `exercise.html?id=${el.dataset.exerciseLink}&pid=${profileId}`;
      });
    });

  } catch (e) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Fel: ${e.message}</p></div>`;
  }
}

function examCard(e, past = false) {
  const subj  = API.getSubject(e.subject);
  const days  = Math.ceil(e.days_until);
  const r     = e.readiness || { score: 0, color: 'red', label: 'Redo' };
  const urgency = days <= 3 ? 'urgent' : days <= 7 ? 'soon' : 'ok';

  return `
    <div class="exam-card" data-exam-id="${e.id}"
         style="--card-color:${subj.color};cursor:pointer;margin-bottom:16px">
      <div style="display:flex;align-items:flex-start;gap:16px">
        <div class="readiness-circle ${r.color}">
          <span style="font-size:1rem;font-weight:800">${r.score}%</span>
          <span>${r.label}</span>
        </div>
        <div style="flex:1">
          <div class="exam-card-title">${e.name}</div>
          <div class="exam-card-meta">${subj.icon} ${subj.label} · ${API.formatDate(e.exam_date)}</div>
          ${!past
            ? `<div class="exam-countdown ${urgency}" style="margin-top:8px">${days === 0 ? 'Idag!' : `Om ${days} dag${days !== 1 ? 'ar' : ''}`}</div>`
            : `<div class="exam-countdown ok" style="margin-top:8px">Genomfört</div>`
          }
        </div>
        <div style="font-size:0.82rem;color:var(--muted);white-space:nowrap">${e.exercise_count} övning${e.exercise_count !== 1 ? 'ar' : ''}</div>
      </div>
      <div class="readiness-bar-wrap" style="margin-top:8px">
        <div class="readiness-bar">
          <div class="readiness-fill ${r.color}" style="width:${r.score}%"></div>
        </div>
      </div>
    </div>
  `;
}

async function openExamDetail(examId) {
  const overlay = document.getElementById('exam-detail-overlay');
  try {
    const exam = await API.exams.get(examId);
    const subj = API.getSubject(exam.subject);
    const r    = exam.readiness || { score: 0, color: 'red', label: 'Redo' };
    const days = Math.ceil(
      (new Date(exam.exam_date) - new Date()) / (24 * 60 * 60 * 1000)
    );

    document.getElementById('exam-detail-title').textContent = exam.name;
    document.getElementById('detail-readiness-pct').textContent = r.score + '%';
    document.getElementById('detail-readiness-label').textContent = r.label;
    document.getElementById('detail-readiness-circle').className = `readiness-circle ${r.color}`;
    document.getElementById('detail-exam-date').textContent = `${subj.icon} ${subj.label} · ${API.formatDate(exam.exam_date)}`;
    document.getElementById('detail-days-until').textContent =
      days >= 0 ? `Om ${days} dag${days !== 1 ? 'ar' : ''}` : 'Genomfört';

    const exGrid = document.getElementById('exam-detail-exercises');
    if (exam.exercises?.length) {
      exGrid.innerHTML = exam.exercises.map(ex => {
        const s = API.getSubject(ex.subject);
        return `
          <div class="exercise-card" data-exercise-link="${ex.id}"
               style="--card-color:${s.color};cursor:pointer">
            <div class="card-subject-badge">${s.icon} ${s.label}</div>
            <div class="card-title">${ex.title}</div>
            <div class="card-meta">Öva nu →</div>
          </div>
        `;
      }).join('');
      exGrid.querySelectorAll('[data-exercise-link]').forEach(el => {
        el.addEventListener('click', () => {
          location.href = `exercise.html?id=${el.dataset.exerciseLink}&pid=${profileId}`;
        });
      });
    } else {
      exGrid.innerHTML = `<p class="muted">Inga övningar kopplade till detta prov.</p>`;
    }

    overlay.classList.remove('hidden');
  } catch (e) {
    showToast('Kunde inte ladda prov: ' + e.message, 'error');
  }
}

document.getElementById('close-exam-detail').addEventListener('click', () => {
  document.getElementById('exam-detail-overlay').classList.add('hidden');
});
document.getElementById('close-exam-detail-btn').addEventListener('click', () => {
  document.getElementById('exam-detail-overlay').classList.add('hidden');
});

init();
