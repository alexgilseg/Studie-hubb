/**
 * storage.js — Gemensam datalagring (localStorage)
 * Används av både app.js och admin.js
 */

const STORAGE_KEY     = 'studiehub_v1';
const DEFAULT_PASSWORD = 'studie123';

// ── Hjälpfunktioner ────────────────────────────────────────────

function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function initDataIfNeeded() {
  if (!getData()) {
    saveData({ password: DEFAULT_PASSWORD, exercises: [] });
  }
}

// ── Övningar ───────────────────────────────────────────────────

function getExercises() {
  initDataIfNeeded();
  return getData().exercises || [];
}

function getExerciseById(id) {
  return getExercises().find(e => e.id === id) || null;
}

function saveExercise(exercise) {
  const data = getData();
  const idx = data.exercises.findIndex(e => e.id === exercise.id);
  if (idx >= 0) {
    data.exercises[idx] = exercise;
  } else {
    data.exercises.push(exercise);
  }
  saveData(data);
}

function deleteExercise(id) {
  const data = getData();
  data.exercises = data.exercises.filter(e => e.id !== id);
  saveData(data);
}

// ── Lösenord ───────────────────────────────────────────────────

function checkPassword(pw) {
  initDataIfNeeded();
  return getData().password === pw;
}

function changePassword(newPw) {
  const data = getData();
  data.password = newPw;
  saveData(data);
}

// ── Verktyg ────────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Returnerar visningsnamn och CSS-variabel för ett ämne */
const SUBJECTS = {
  matematik: { label: 'Matematik', icon: '📐', color: 'var(--c-matematik)' },
  svenska:   { label: 'Svenska',   icon: '📝', color: 'var(--c-svenska)'   },
  engelska:  { label: 'Engelska',  icon: '🇬🇧', color: 'var(--c-engelska)'  },
  no:        { label: 'NO',        icon: '🔬', color: 'var(--c-no)'        },
  so:        { label: 'SO',        icon: '🌍', color: 'var(--c-so)'        },
  teknik:    { label: 'Teknik',    icon: '⚙️', color: 'var(--c-teknik)'    },
};

// Initiera direkt
initDataIfNeeded();
