import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const CART_KEY = 'zest_cart';
const cfg = window.firebaseConfig || {};
const ready = !!cfg.apiKey && !String(cfg.apiKey).includes('PASTE_');
const app = ready ? (getApps().length ? getApps()[0] : initializeApp(cfg)) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current = null, profile = null, lastPushed = null;

// Styles for the header pill
const style = document.createElement('style');
style.textContent = '.authWrap{position:relative;display:inline-block}.authBtn{display:inline-flex;align-items:center;gap:8px;cursor:pointer;border:1px solid #9bdcff;background:#fff;color:#0b6b91;font:inherit;font-weight:800}.authAvatar{width:26px;height:26px;border-radius:50%;object-fit:cover;display:inline-grid;place-items:center;background:#0798c4;color:#fff;font-weight:800;font-size:13px}.authMenu{position:absolute;right:0;top:calc(100% + 8px);min-width:200px;background:#fff;border:1px solid #cfe6f2;border-radius:14px;box-shadow:0 16px 40px rgba(7,40,70,.18);padding:6px;z-index:60}.authMenu[hidden]{display:none}.authMenu a,.authMenu button{display:block;width:100%;text-align:left;padding:10px 12px;border:0;background:none;border-radius:10px;color:#0b3550;text-decoration:none;font:inherit;font-weight:700;cursor:pointer;box-sizing:border-box}.authMenu a:hover,.authMenu button:hover{background:#eef9ff}';
document.head.appendChild(style);


// Sign-in bar shown on every page until the visitor signs in
const barStyle = document.createElement('style');
barStyle.textContent = '#signinBar{position:fixed;left:0;right:0;bottom:0;z-index:998;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;background:#073b66;color:#fff;font:600 14px system-ui,-apple-system,sans-serif;box-shadow:0 -8px 24px rgba(0,0,0,.2)}#signinBar span{flex:1 1 220px}#signinBar .sbBtns{display:flex;align-items:center;gap:10px;flex-wrap:wrap}#signinBar button{background:#fff;color:#073b66;border:0;border-radius:999px;padding:9px 14px;font:800 14px system-ui,sans-serif;cursor:pointer}#signinBar a{color:#9be3ff;font-weight:800;text-decoration:underline}#sbMsg{flex-basis:100%;margin:0;font-size:13px;color:#ffd6d6}#sbMsg:empty{display:none}@media(max-width:700px){#signinBar{bottom:62px}}';
document.head.appendChild(barStyle);
function renderBar() {
  const onLoginPage = location.pathname.endsWith('login.html');
  let bar = document.getElementById('signinBar');
  if (!auth || current || onLoginPage) { if (bar) bar.remove(); return; }
  if (bar) return;
  bar = document.createElement('div');
  bar.id = 'signinBar';
  bar.innerHTML = '<span>Sign in to save your cart and orders on any device.</span><div class="sbBtns"><button type="button" id="sbGoogle">Continue with Google</button><a href="login.html?mode=login">Log in with email</a></div><p id="sbMsg" role="status"></p>';
  document.body.appendChild(bar);
  document.getElementById('sbGoogle').addEventListener('click', async () => {
    const m = document.getElementById('sbMsg');
    m.textContent = 'Opening Google...';
    try { await window.danAuth.google(); m.textContent = ''; }
    catch (e) { m.textContent = e.code === 'auth/unauthorized-domain' ? 'This domain is not allowed for sign-in yet. Add it in Firebase Authentication settings.' : 'Sign-in did not finish. Please try again.'; }
  });
}

function readCart() {
  try { const v = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}
function displayName() {
  if (!current) return '';
  return (profile && profile.username) || current.displayName || (current.email || '').split('@')[0] || 'Account';
}

function renderPill() {
  const el = document.getElementById('authPill');
  if (!el) { renderBar(); return; }
  if (!current) { el.innerHTML = '<a class="pill outline" href="login.html">LOGIN / SIGN UP</a>'; return; }
  const photo = current.photoURL || (profile && profile.photo) || '';
  const name = displayName();
  const avatar = photo
    ? '<img src="' + esc(photo) + '" alt="" referrerpolicy="no-referrer" class="authAvatar">'
    : '<span class="authAvatar">' + esc(name.charAt(0).toUpperCase()) + '</span>';
  el.innerHTML = '<div class="authWrap"><button type="button" class="pill authBtn" id="authToggle" aria-expanded="false">' + avatar + '<span>' + esc(name) + '</span></button>'
    + '<div class="authMenu" id="authMenu" hidden><a href="login.html">My profile</a><a href="orders.html">My orders</a><a href="cart.html">My cart</a><button type="button" id="authLogout">Log out</button></div></div>';
  document.getElementById('authToggle').addEventListener('click', e => {
    e.stopPropagation();
    const m = document.getElementById('authMenu');
    m.hidden = !m.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!m.hidden));
  });
  document.getElementById('authLogout').addEventListener('click', () => signOut(auth));
  renderBar();
}
document.addEventListener('click', () => { const m = document.getElementById('authMenu'); if (m) m.hidden = true; });

// Load the user's profile and merge carts from all devices
async function loadProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const remote = Array.isArray(data.cart) ? data.cart : [];
  const local = readCart();
  const seen = new Set(), merged = [];
  for (const item of [...remote, ...local]) {
    const k = JSON.stringify(item);
    if (!seen.has(k)) { seen.add(k); merged.push(item); }
  }
  const changed = JSON.stringify(merged) !== JSON.stringify(local);
  localStorage.setItem(CART_KEY, JSON.stringify(merged));
  profile = { username: data.username || '', photo: data.photo || user.photoURL || '' };
  await setDoc(ref, {
    email: user.email || '', name: user.displayName || '', photo: user.photoURL || '',
    username: profile.username, cart: merged, updatedAt: Date.now()
  }, { merge: true });
  lastPushed = JSON.stringify(merged);
  return changed;
}

// Save cart changes to the account every few seconds
setInterval(async () => {
  if (!current || !db) return;
  const s = JSON.stringify(readCart());
  if (s === lastPushed) return;
  lastPushed = s;
  try { await setDoc(doc(db, 'users', current.uid), { cart: readCart(), updatedAt: Date.now() }, { merge: true }); } catch (e) {}
}, 3000);

if (auth) {
  getRedirectResult(auth).catch(() => {});
  onAuthStateChanged(auth, async user => {
    current = user;
    let cartChanged = false;
    if (user) {
      try { cartChanged = await loadProfile(user); } catch (e) { profile = null; }
    } else {
      profile = null; lastPushed = null;
    }
    renderPill();
    document.dispatchEvent(new CustomEvent('dan-auth', { detail: { user, profile } }));
    // Reload once so the cart count shows the merged cart
    if (cartChanged && !sessionStorage.getItem('dan-reloaded')) { sessionStorage.setItem('dan-reloaded', '1'); location.reload(); }
  });
} else {
  document.addEventListener('DOMContentLoaded', () => { renderPill(); renderBar(); });
  renderPill();
}

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

window.danAuth = {
  ready: !!auth,
  async google() {
    try { return await signInWithPopup(auth, provider); }
    catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
        return signInWithRedirect(auth, provider);
      }
      throw e;
    }
  },
  signIn(email, password) { return signInWithEmailAndPassword(auth, email, password); },
  async signUp(name, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return cred;
  },
  async saveUsername(name) {
    if (!current) throw new Error('Not logged in');
    await setDoc(doc(db, 'users', current.uid), { username: name }, { merge: true });
    profile = { ...(profile || {}), username: name };
    renderPill();
    document.dispatchEvent(new CustomEvent('dan-auth', { detail: { user: current, profile } }));
  },
  logout() { return signOut(auth); }
};
