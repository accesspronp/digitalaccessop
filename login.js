const q = new URLSearchParams(location.search);
let mode = q.get('mode') === 'signup' ? 'signup' : 'login';
const guestView = document.getElementById('guestView');
const userView = document.getElementById('userView');
const guestMsg = document.getElementById('guestMsg');
const userMsg = document.getElementById('userMsg');
const nameField = document.querySelector('.nameField');
const nameInput = nameField.querySelector('input');
const emailSubmit = document.getElementById('emailSubmit');

function setMode(m) {
  mode = m;
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  nameField.hidden = m !== 'signup';
  nameInput.required = m === 'signup';
  emailSubmit.textContent = m === 'signup' ? 'Create account' : 'Log in';
  guestMsg.textContent = '';
}
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
setMode(mode);

function explain(e) {
  const map = {
    'auth/invalid-credential': 'Email or password is wrong.',
    'auth/wrong-password': 'Email or password is wrong.',
    'auth/user-not-found': 'No account with this email. Create an account first.',
    'auth/email-already-in-use': 'This email already has an account. Log in instead.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed.',
    'auth/unauthorized-domain': 'This domain is not allowed for sign-in yet. Add it in Firebase Authentication settings.'
  };
  return map[e.code] || ('Something went wrong. Please try again. (' + (e.code || e.message) + ')');
}
function notReady() {
  if (window.danAuth && window.danAuth.ready) return false;
  guestMsg.textContent = 'Sign-in is not available right now. Please try again later.';
  return true;
}

document.getElementById('googleBtn').addEventListener('click', async () => {
  if (notReady()) return;
  guestMsg.textContent = 'Opening Google...';
  try { await window.danAuth.google(); guestMsg.textContent = ''; }
  catch (e) { guestMsg.textContent = explain(e); }
});

document.getElementById('emailForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (notReady()) return;
  const f = new FormData(e.target);
  const email = String(f.get('email') || '').trim();
  const pass = String(f.get('password') || '');
  const name = String(f.get('name') || '').trim();
  if (mode === 'signup' && !name) { guestMsg.textContent = 'Enter your name.'; return; }
  guestMsg.textContent = 'Please wait...';
  try {
    if (mode === 'signup') await window.danAuth.signUp(name, email, pass);
    else await window.danAuth.signIn(email, pass);
    guestMsg.textContent = '';
    e.target.reset();
  } catch (err) { guestMsg.textContent = explain(err); }
});

document.addEventListener('dan-auth', e => {
  const u = e.detail.user, p = e.detail.profile || {};
  guestView.hidden = !!u;
  userView.hidden = !u;
  if (!u) return;
  document.getElementById('uName').textContent = p.username || u.displayName || (u.email || '').split('@')[0];
  document.getElementById('uEmail').textContent = u.email || '';
  document.getElementById('uAvatar').src = u.photoURL || p.photo || 'favicon.png';
  document.querySelector('#usernameForm input').value = p.username || '';
});

document.getElementById('usernameForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = String(new FormData(e.target).get('username') || '').trim();
  if (!name) return;
  userMsg.textContent = 'Saving...';
  try { await window.danAuth.saveUsername(name); userMsg.textContent = 'Username saved.'; }
  catch (err) { userMsg.textContent = 'Could not save. Check that Firestore is set up. (' + (err.code || err.message) + ')'; }
});
document.getElementById('logoutBtn').addEventListener('click', () => window.danAuth.logout());
