/* ================================================
   Studie-hubb — Historik
   ================================================ */

const params    = new URLSearchParams(location.search);
const profileId = params.get('pid') || API.getActiveProfile()?.id;

if (!profileId) location.href = 'index.html';

document.getElementById('back-link').href = `dashboard.html?pid=${profileId}`;

let offset = 0;
const LIMIT = 20;
let activeSubjectFilter = '';

// Tabs
document.querySelectorAll('.history-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.history-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    ['sessions','subjects','badges'].forEach(id => {
      document.getElementById(`tab-${id}`).classList.add('hidden');
    });
    document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
    if (tab.dataset.tab === 'subjects') loadSubjectStats();
    if (tab.dataset.tab === 'badges')   loadBadges();
  });
});

// Om URL innehåller #badges, öppna badges-fliken
if (location.hash === '#badges') {
  document.querySelector('[data-tab="badges"]').click();
}

// Ämnesfilter i dropdown
API.SUBJECTS.forEach(s => {
  const opt = document.createElement('option');
  opt.value = s.id;
  opt.textContent = `${s.icon} ${s.label}`;
  document.getElementById('subject-filter').appendChild(opt);
});
document.getElementById('subject-filter').addEventListener('change', e => {
  activeSubjectFilter = e.target.value;
  offset = 0;
  loadSessions(true);
});

// Ladda fler
document.getElementById('load-more').addEventListener('click', () => {
  offset += LIMIT;
  loadSessions(false);
});

async function loadSessions(reset = true) {
  const list = document.getElementById('sessions-list');
  if (reset) {
    list.innerHTML = '';
    offset = 0;
  }

  const params = { profile_id: profileId, limit: LIMIT, offset };
  if (activeSubjectFilter) params.subject = activeSubjectFilter;

  try {
    const { sessions, total } = await API.sessions.list(params);

    document.getElementById('sessions-count').textContent = `${total} sessioner totalt`;

    if (!sessions.length && reset) {
      list.innerHTML = `<div class="empty-state"><span class="empty-icon">📭</span><p>Inga sessioner ännu</p></div>`;
      document.getElementById('load-more').classList.add('hidden');
      return;
    }

    list.insertAdjacentHTML('beforeend', sessions.map(s => {
      const subj = API.getSubject(s.subject);
      const pct  = s.max_score > 0 ? Math.round((s.score / s.max_score) * 100) : 0;
      const cls  = API.scoreClass(s.score, s.max_score);
      const mins = Math.round((s.duration_seconds || 0) / 60);
      return `
        <div class="session-item" style="--card-color:${subj.color}">
          <div class="session-subject">${subj.icon}</div>
          <div class="session-info">
            <div class="session-title">${s.title}</div>
            <div class="session-date">${API.formatDate(s.completed_at)}${mins > 0 ? ` · ${mins} min` : ''}</div>
          </div>
          <div class="session-score ${cls}">${s.score}/${s.max_score} (${pct}%)</div>
          <div class="session-xp">+${s.xp_earned} XP</div>
        </div>
      `;
    }).join(''));

    document.getElementById('load-more').classList.toggle('hidden', sessions.length < LIMIT);
  } catch (e) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>Fel: ${e.message}</p></div>`;
  }
}

async function loadSubjectStats() {
  const grid = document.getElementById('subject-stats-grid');
  grid.innerHTML = '<p class="muted">Laddar...</p>';

  try {
    const { bySubject } = await API.sessions.history(profileId, 365);
    const statsMap = Object.fromEntries((bySubject || []).map(s => [s.subject, s]));

    grid.innerHTML = API.SUBJECTS.map(subj => {
      const s = statsMap[subj.id];
      const avg = s ? Math.round(s.avg_score || 0) : 0;
      const sessions = s?.sessions || 0;
      const xp = s?.xp || 0;

      return `
        <div style="background:var(--white);border-radius:var(--radius);padding:20px;box-shadow:var(--shadow);border-top:5px solid ${subj.color}">
          <div style="font-size:1.8rem;margin-bottom:8px">${subj.icon}</div>
          <div style="font-weight:700;font-size:1.1rem;margin-bottom:12px">${subj.label}</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;font-size:0.88rem">
              <span class="muted">Snittpoäng</span>
              <strong>${avg}%</strong>
            </div>
            <div class="subject-progress-bar" style="height:8px">
              <div class="subject-progress-fill" style="width:${avg}%;background:${subj.color}"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--muted)">
              <span>${sessions} pass</span>
              <span>${xp} XP</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    grid.innerHTML = `<p class="muted">Fel: ${e.message}</p>`;
  }
}

async function loadBadges() {
  const grid = document.getElementById('badges-grid');
  grid.innerHTML = '<p class="muted">Laddar...</p>';

  try {
    const [allBadges, statsData] = await Promise.all([
      API.gamification.badges(),
      API.profiles.stats(profileId)
    ]);

    const earnedIds = new Set((statsData.badges || []).map(b => b.id));
    const earnedMap = Object.fromEntries((statsData.badges || []).map(b => [b.id, b]));

    document.getElementById('badges-summary').textContent =
      `${earnedIds.size} av ${allBadges.length} badges upplåsta`;

    // Sortera: upplåsta först
    const sorted = [...allBadges].sort((a, b) => {
      const ae = earnedIds.has(a.id) ? 0 : 1;
      const be = earnedIds.has(b.id) ? 0 : 1;
      return ae - be;
    });

    grid.innerHTML = sorted.map(b => {
      const earned = earnedIds.has(b.id);
      const earnedBadge = earnedMap[b.id];
      return `
        <div class="badge-card ${earned ? '' : 'locked'}">
          <div class="badge-icon-lg">${b.icon}</div>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.description}</div>
          ${earned ? `<div class="badge-earned">✓ Upplåst ${API.formatDateShort(earnedBadge.earned_at)}</div>` : ''}
        </div>
      `;
    }).join('');
  } catch (e) {
    grid.innerHTML = `<p class="muted">Fel: ${e.message}</p>`;
  }
}

loadSessions();
