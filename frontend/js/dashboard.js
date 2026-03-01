/* ================================================
   Studie-hubb — Dashboard
   ================================================ */

const params    = new URLSearchParams(location.search);
const profileId = params.get('pid') || API.getActiveProfile()?.id;

if (!profileId) { location.href = 'index.html'; }

// Sätt länkar med pid
['history-link','exam-link','badges-link','exercises-link','back-to-dash'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.href = el.href.split('?')[0] + `?pid=${profileId}`;
});

async function init() {
  try {
    const data = await API.profiles.stats(profileId);
    renderHeader(data);
    renderStats(data);
    renderSubjects(data);
    renderRecentSessions(data.recentSessions);
    renderBadges(data.badges);
    loadExams();
  } catch (e) {
    showToast('Kunde inte ladda profil: ' + e.message, 'error');
  }
}

function renderHeader(data) {
  const { profile, stats } = data;
  const avatar  = API.AVATARS[(profile.avatar_id - 1) % API.AVATARS.length] || '🦊';
  const lvInfo  = API.getLevelInfo(stats?.xp_total || 0);
  const streak  = stats?.streak_current || 0;

  document.getElementById('header-avatar').textContent = avatar;
  document.getElementById('header-name').textContent   = profile.name;
  document.getElementById('header-meta').textContent   = `Nivå ${lvInfo.level} · ${lvInfo.xp} XP · ${profile.age} år`;

  document.getElementById('level-label-current').textContent = `Nivå ${lvInfo.level}`;
  document.getElementById('level-label-next').textContent    = `${lvInfo.xpToNext} XP till nästa`;
  document.getElementById('level-bar-fill').style.width      = `${lvInfo.progress}%`;

  document.getElementById('streak-number').textContent = streak;
  if (streak === 0) document.querySelector('.streak-icon').textContent = '💤';
  else if (streak >= 7) document.querySelector('.streak-icon').textContent = '⚡';
}

function renderStats(data) {
  const stats    = data.stats || {};
  const sessions = data.recentSessions?.length || 0;
  const badges   = data.badges?.length || 0;

  document.getElementById('stat-xp').textContent       = stats.xp_total || 0;
  document.getElementById('stat-sessions').textContent = stats.xp_total > 0 ? '...' : 0;
  document.getElementById('stat-badges').textContent   = badges;

  // Total sessions (hämta asynkront)
  API.sessions.list({ profile_id: profileId, limit: 1 }).then(r => {
    document.getElementById('stat-sessions').textContent = r.total || 0;
  }).catch(() => {});
}

function renderSubjects(data) {
  const subjectStats = data.subjectStats || [];
  const grid = document.getElementById('subject-grid');
  grid.innerHTML = '';

  const statsMap = Object.fromEntries(subjectStats.map(s => [s.subject, s]));

  for (const subj of API.SUBJECTS) {
    const s = statsMap[subj.id];
    const avg = s ? Math.round(s.avg_score || 0) : 0;

    const card = document.createElement('a');
    card.className = 'subject-card';
    card.href = `exercises.html?pid=${profileId}&subject=${subj.id}`;
    card.style.setProperty('--card-color', subj.color);
    card.innerHTML = `
      <div class="subject-card-icon">${subj.icon}</div>
      <div class="subject-card-name">${subj.label}</div>
      <div class="subject-progress-bar">
        <div class="subject-progress-fill" style="width:${avg}%"></div>
      </div>
      <div style="font-size:0.75rem;color:var(--muted)">${s ? `${Math.round(s.avg_score)}% snitt · ${s.sessions_count} pass` : 'Inga övningar ännu'}</div>
    `;
    grid.appendChild(card);
  }
}

function renderRecentSessions(sessions = []) {
  const list = document.getElementById('recent-sessions');
  if (!sessions.length) {
    list.innerHTML = `<div class="empty-state" style="padding:30px 0"><span class="empty-icon">📝</span><p>Inga övningar ännu — dags att börja!</p></div>`;
    return;
  }

  list.innerHTML = sessions.slice(0, 5).map(s => {
    const subj  = API.getSubject(s.subject);
    const pct   = s.max_score > 0 ? Math.round((s.score / s.max_score) * 100) : 0;
    const cls   = API.scoreClass(s.score, s.max_score);
    return `
      <div class="session-item" style="--card-color:${subj.color}">
        <div class="session-subject">${subj.icon}</div>
        <div class="session-info">
          <div class="session-title">${s.title}</div>
          <div class="session-date">${API.formatDateShort(s.completed_at)}</div>
        </div>
        <div class="session-score ${cls}">${s.score}/${s.max_score} (${pct}%)</div>
        <div class="session-xp">+${s.xp_earned} XP</div>
      </div>
    `;
  }).join('');
}

function renderBadges(badges = []) {
  const list = document.getElementById('recent-badges');
  if (!badges.length) {
    list.innerHTML = `<p class="muted" style="font-size:0.85rem">Inga badges ännu — fortsätt öva!</p>`;
    return;
  }
  list.innerHTML = badges.slice(0, 3).map(b => `
    <div class="badge-row">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-info">
        <div class="badge-name">${b.name}</div>
        <div class="badge-desc">${b.description}</div>
      </div>
    </div>
  `).join('');
}

async function loadExams() {
  const container = document.getElementById('upcoming-exams');
  try {
    const exams = await API.exams.list(profileId);
    const upcoming = exams
      .filter(e => e.days_until >= 0)
      .slice(0, 3);

    if (!upcoming.length) {
      container.innerHTML = `<p class="muted" style="font-size:0.85rem">Inga kommande prov</p>`;
      return;
    }

    container.innerHTML = upcoming.map(e => {
      const days = Math.ceil(e.days_until);
      const urgency = days <= 3 ? 'urgent' : days <= 7 ? 'soon' : 'ok';
      const r = e.readiness || { score: 0, color: 'red' };
      return `
        <div class="exam-item">
          <div class="exam-name">${e.name}</div>
          <div class="exam-date">${API.formatDate(e.exam_date)}</div>
          <div class="exam-countdown ${urgency}">${days === 0 ? 'Idag!' : `Om ${days} dag${days !== 1 ? 'ar' : ''}`}</div>
          <div class="readiness-bar-wrap">
            <div class="readiness-label">Beredskap: ${r.score}%</div>
            <div class="readiness-bar">
              <div class="readiness-fill ${r.color}" style="width:${r.score}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch {
    container.innerHTML = `<p class="muted" style="font-size:0.85rem">Kunde inte ladda prov</p>`;
  }
}

init();
