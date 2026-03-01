/* ================================================
   Studie-hubb — API-klient
   ================================================ */

const API = (() => {
  const BASE = 'http://localhost:3000/api';

  async function request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  }

  const get    = (p)    => request('GET',    p);
  const post   = (p, b) => request('POST',   p, b);
  const put    = (p, b) => request('PUT',    p, b);
  const del    = (p)    => request('DELETE', p);

  // Subjects config (shared client-side)
  const SUBJECTS = [
    { id: 'matematik', label: 'Matematik', icon: '📐', color: '#3B82F6' },
    { id: 'svenska',   label: 'Svenska',   icon: '📝', color: '#F59E0B' },
    { id: 'engelska',  label: 'Engelska',  icon: '🇬🇧', color: '#10B981' },
    { id: 'no',        label: 'NO',        icon: '🔬', color: '#8B5CF6' },
    { id: 'so',        label: 'SO',        icon: '🌍', color: '#EF4444' },
    { id: 'teknik',    label: 'Teknik',    icon: '⚙️', color: '#0891B2' },
  ];

  const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🦄', '🐉', '🌟', '🚀', '🎨', '🎵'];

  const LEVEL_THRESHOLDS = [0, 150, 400, 800, 1400, 2000, 3500, 5500, 8000, 12000];

  function getSubject(id) {
    return SUBJECTS.find(s => s.id === id) || { id, label: id, icon: '📚', color: '#6366F1' };
  }

  function getLevelInfo(xp) {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    }
    const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextThreshold     = LEVEL_THRESHOLDS[level]    || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const progress = nextThreshold > currentThreshold
      ? ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
      : 100;
    return {
      level,
      xp,
      currentThreshold,
      nextThreshold,
      progress: Math.min(100, Math.round(progress)),
      xpToNext: Math.max(0, nextThreshold - xp)
    };
  }

  function getAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    return Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
  }

  function formatDate(isoStr) {
    return new Date(isoStr).toLocaleDateString('sv-SE', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  function formatDateShort(isoStr) {
    return new Date(isoStr).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
  }

  function scoreClass(score, max) {
    if (!max) return '';
    const pct = score / max;
    if (pct >= 0.8) return '';
    if (pct >= 0.5) return 'mid';
    return 'low';
  }

  // Session storage för vald profil
  function getActiveProfile() {
    try { return JSON.parse(sessionStorage.getItem('active_profile')); }
    catch { return null; }
  }
  function setActiveProfile(profile) {
    sessionStorage.setItem('active_profile', JSON.stringify(profile));
  }

  // Admin auth (localStorage)
  function getAdminToken() { return localStorage.getItem('admin_token'); }
  function setAdminToken(t) { localStorage.setItem('admin_token', t); }
  function clearAdminToken() { localStorage.removeItem('admin_token'); }

  // Admin password (stored in localStorage as simple hash)
  const DEFAULT_ADMIN_PASSWORD = 'studie123';
  function getStoredPassword() { return localStorage.getItem('admin_password') || DEFAULT_ADMIN_PASSWORD; }
  function setStoredPassword(p) { localStorage.setItem('admin_password', p); }

  return {
    // Profiles
    profiles:    {
      list:   ()       => get('/profiles'),
      create: (data)   => post('/profiles', data),
      update: (id, d)  => put(`/profiles/${id}`, d),
      delete: (id)     => del(`/profiles/${id}`),
      stats:  (id)     => get(`/profiles/${id}/stats`),
    },
    // Exercises
    exercises: {
      list:           (params = {}) => get('/exercises?' + new URLSearchParams(params)),
      get:            (id)          => get(`/exercises/${id}`),
      create:         (data)        => post('/exercises', data),
      update:         (id, data)    => put(`/exercises/${id}`, data),
      delete:         (id)          => del(`/exercises/${id}`),
      addQuestion:    (id, data)    => post(`/exercises/${id}/questions`, data),
      updateQuestion: (id, qid, d)  => put(`/exercises/${id}/questions/${qid}`, d),
      deleteQuestion: (id, qid)     => del(`/exercises/${id}/questions/${qid}`),
      addTemplate:    (id, data)    => post(`/exercises/${id}/templates`, data),
    },
    // Sessions
    sessions: {
      save:    (data)   => post('/sessions', data),
      list:    (params) => get('/sessions?' + new URLSearchParams(params)),
      history: (pid, days) => get(`/sessions/history/${pid}?days=${days || 30}`),
    },
    // Gamification
    gamification: {
      leaderboard: () => get('/gamification/leaderboard'),
      badges:      () => get('/gamification/badges'),
    },
    // Exams
    exams: {
      list:            (pid)    => get(`/exams?profile_id=${pid}`),
      get:             (id)     => get(`/exams/${id}`),
      create:          (data)   => post('/exams', data),
      update:          (id, d)  => put(`/exams/${id}`, d),
      delete:          (id)     => del(`/exams/${id}`),
      updateExercises: (id, ids) => put(`/exams/${id}/exercises`, { exercise_ids: ids }),
    },
    // Helpers
    SUBJECTS, AVATARS, LEVEL_THRESHOLDS,
    getSubject, getLevelInfo, getAge, formatDate, formatDateShort, scoreClass,
    getActiveProfile, setActiveProfile,
    getAdminToken, setAdminToken, clearAdminToken,
    getStoredPassword, setStoredPassword,
  };
})();

// Toast-notifieringar
function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
