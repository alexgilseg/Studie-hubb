/* ================================================
   Studie-hubb — Profilväljare
   ================================================ */

const grid    = document.getElementById('profile-grid');
const loading = document.getElementById('loading-state');

async function init() {
  let profiles = [];
  try {
    profiles = await API.profiles.list();
  } catch {
    loading.querySelector('p').textContent = 'Kunde inte ansluta till servern. Är backend igång?';
    loading.querySelector('.empty-icon').textContent = '⚠️';
    return;
  }

  grid.innerHTML = '';

  for (const p of profiles) {
    const age    = API.getAge(p.birthdate);
    const stats  = await API.profiles.stats(p.id).catch(() => null);
    const xp     = stats?.stats?.xp_total || 0;
    const level  = stats?.stats?.level || 1;
    const streak = stats?.stats?.streak_current || 0;
    const badges = stats?.badges?.length || 0;
    const avatar = API.AVATARS[(p.avatar_id - 1) % API.AVATARS.length] || '🦊';

    const card = document.createElement('a');
    card.className = 'profile-card';
    card.href = '#';
    card.innerHTML = `
      <div class="profile-avatar">${avatar}</div>
      <div class="profile-name">${p.name}</div>
      <div class="profile-age">${age} år · Klass ${getSchoolYear(age)}</div>
      <div class="profile-mini-stats">
        <div class="stat"><strong>Lv ${level}</strong>nivå</div>
        <div class="stat"><strong>🔥 ${streak}</strong>streak</div>
        <div class="stat"><strong>🏅 ${badges}</strong>badges</div>
      </div>
    `;
    card.addEventListener('click', (e) => {
      e.preventDefault();
      API.setActiveProfile(p);
      window.location.href = `dashboard.html?pid=${p.id}`;
    });
    grid.appendChild(card);
  }

  // Knapp: Ny profil
  const addCard = document.createElement('div');
  addCard.className = 'profile-card profile-add-card';
  addCard.innerHTML = `
    <div class="profile-avatar">➕</div>
    <div class="profile-name">Ny profil</div>
    <div class="profile-age">Lägg till ett barn</div>
  `;
  addCard.addEventListener('click', openCreateProfile);
  grid.appendChild(addCard);
}

function getSchoolYear(age) {
  if (age < 7) return 'F';
  return Math.min(9, age - 6);
}

// Skapa profil
const overlay  = document.getElementById('create-profile-overlay');
const nameInput = document.getElementById('new-profile-name');
const bdInput   = document.getElementById('new-profile-birthdate');
const avatarInput = document.getElementById('new-profile-avatar');
const avatarPicker = document.getElementById('avatar-picker');

// Rendera avatar-väljaren
API.AVATARS.forEach((emoji, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = emoji;
  btn.style.cssText = 'font-size:1.8rem;background:var(--bg);border:2px solid var(--border);border-radius:10px;padding:6px 10px;cursor:pointer;transition:border-color 0.2s';
  btn.dataset.idx = i + 1;
  btn.addEventListener('click', () => {
    avatarPicker.querySelectorAll('button').forEach(b => b.style.borderColor = 'var(--border)');
    btn.style.borderColor = 'var(--primary)';
    avatarInput.value = i + 1;
  });
  avatarPicker.appendChild(btn);
});
avatarPicker.firstChild.style.borderColor = 'var(--primary)';

function openCreateProfile() {
  overlay.classList.remove('hidden');
  nameInput.focus();
}

document.getElementById('close-create-profile').addEventListener('click', closeCreate);
document.getElementById('cancel-create-profile').addEventListener('click', closeCreate);
function closeCreate() { overlay.classList.add('hidden'); }

document.getElementById('save-create-profile').addEventListener('click', async () => {
  const name = nameInput.value.trim();
  const birthdate = bdInput.value;
  const avatar_id = parseInt(avatarInput.value);
  if (!name || !birthdate) { showToast('Fyll i namn och födelsedatum', 'error'); return; }

  try {
    await API.profiles.create({ name, birthdate, avatar_id });
    closeCreate();
    showToast(`${name} har lagts till! 🎉`, 'success');
    nameInput.value = '';
    bdInput.value = '';
    init();
  } catch (e) {
    showToast('Kunde inte skapa profil: ' + e.message, 'error');
  }
});

// Enter i lösenordsfält
nameInput.addEventListener('keydown', e => e.key === 'Enter' && bdInput.focus());

init();
