import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const OWNER_EMAIL = String(window.DAN_OWNER_EMAIL || "digtialaccessnepal@gmail.com").trim().toLowerCase();
const cfg = window.firebaseConfig || {};
const firebaseReady = cfg.apiKey && !String(cfg.apiKey).includes("PASTE_");
let auth = null;
let app = null;

function localUsers(){ return JSON.parse(localStorage.getItem('danUsers') || '[]'); }
function saveLocalUsers(users){ localStorage.setItem('danUsers', JSON.stringify(users)); }
function cleanEmail(v){ return String(v || '').trim().toLowerCase(); }
function emailHasAt(email){ return String(email || '').includes('@'); }
function basicEmailOk(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim()); }
function isValidUsername(username){
  const u = String(username || '').trim();
  return u.length >= 8 && u.length <= 24 && /^[A-Za-z0-9_.-]+$/.test(u) && !/\s/.test(u);
}
function passcodeErrors(pass){
  const value = String(pass || '');
  const errors = [];
  if(value.length < 6) errors.push("Passcode isn't 6 letters long.");
  if(!/[A-Z]/.test(value)) errors.push('Passcode needs at least 1 uppercase letter.');
  if(!/[^A-Za-z0-9]/.test(value)) errors.push('Passcode needs a special character like @ # !.');
  return errors;
}
function isStrongPasscode(pass){ return passcodeErrors(pass).length === 0; }
function explainPasscode(pass){ return passcodeErrors(pass).join('<br>'); }
function setMsg(id, html){ const el = document.getElementById(id); if(el) el.innerHTML = html; }
function setFieldError(id, message){ const el = document.getElementById(id); if(el) el.innerHTML = message ? '<span>'+message+'</span>' : ''; }
function clearAuthErrors(prefix){
  ['Name','Username','Email','Password','Confirm'].forEach(key => setFieldError(prefix + key + 'Error', ''));
  setMsg(prefix + 'Msg', '');
}
function markInputListeners(){
  document.querySelectorAll('.auth-box input').forEach(input => {
    input.addEventListener('input', () => {
      const err = document.getElementById(input.id + 'Error');
      if(err) err.innerHTML = '';
    });
  });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markInputListeners); else markInputListeners();
function usernameFrom(user){
  if(!user) return '';
  return user.displayName || user.username || (user.email ? user.email.split('@')[0] : 'User');
}
function saveSession(user){
  if(!user) return;
  const email = cleanEmail(user.email);
  const session = {
    email,
    username: usernameFrom(user),
    name: user.displayName || user.name || usernameFrom(user),
    photoURL: user.photoURL || '',
    loginAt: new Date().toISOString(),
    provider: firebaseReady ? 'firebase' : 'local'
  };
  localStorage.setItem('danUserSession', JSON.stringify(session));
  if(email === OWNER_EMAIL){ localStorage.setItem('danAdminSession', JSON.stringify(session)); }
  else { localStorage.removeItem('danAdminSession'); }
  return session;
}
function getSession(){
  try { return JSON.parse(localStorage.getItem('danUserSession') || 'null'); } catch(e){ return null; }
}

function updateHomeAuth(session){
  const card = document.getElementById('homeAuthCard');
  if(!card) return;
  const data = session || getSession();
  if(data && data.email){
    const avatar = data.photoURL ? `<img class="home-auth-avatar" src="${data.photoURL}" alt="${data.username}">` : '<span class="home-auth-avatar empty">👤</span>';
    card.innerHTML = `<div class="home-auth-copy"><strong>Welcome, ${data.username}</strong><span>You are signed in. Your orders will save under ${data.email}.</span></div><div class="home-auth-actions signed">${avatar}<button class="home-google-btn outline" onclick="trackOrder()">View Orders</button><button class="home-google-btn" onclick="logoutUser()">Logout</button></div>`;
  }
}
function showUserNav(user){
  const box = document.getElementById('userNav');
  if(!box) return;
  const session = user ? saveSession(user) : getSession();
  if(session && session.email){
    const avatar = session.photoURL ? `<img class="user-avatar" src="${session.photoURL}" alt="${session.username}">` : '👤';
    box.innerHTML = `<span class="username-pill">${avatar} ${session.username}</span><button class="logout-mini" onclick="logoutUser()">Logout</button>`;
    updateHomeAuth(session);
  } else {
    box.innerHTML = `<button class="top-google-btn" onclick="loginWithGoogle()"><img src="google-logo.svg?v=3" alt="Google"> Sign In</button><button class="top-google-btn signup" onclick="loginWithGoogle()"><img src="google-logo.svg?v=3" alt="Google"> Sign Up</button>`;
  }
}
function revealAdmin(user){
  const link = document.getElementById('adminNavLink');
  const email = cleanEmail(user?.email || getSession()?.email);
  if(link && email === OWNER_EMAIL){
    link.classList.remove('hidden-admin');
    link.style.display = 'inline-flex';
  }
}

if(firebaseReady){
  app = initializeApp(cfg);
  auth = getAuth(app);
  getRedirectResult(auth).catch(()=>{});
  onAuthStateChanged(auth, (user) => {
    if(user){
      saveSession(user);
      showUserNav(user);
      revealAdmin(user);
      if(document.body.dataset.page === 'admin' && cleanEmail(user.email) !== OWNER_EMAIL){ location.href = 'index.html'; }
    } else {
      showUserNav(null);
      if(document.body.dataset.page === 'admin') location.href = 'login.html?admin=1';
    }
  });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    showUserNav(null);
    revealAdmin(null);
    const firebaseNotice = document.getElementById('firebaseNotice');
    if(firebaseNotice){
      firebaseNotice.innerHTML = '<div class="notice">Firebase is ready in the code. Paste your Firebase config in <strong>firebase-config.js</strong> to enable Google login.</div>';
    }
  });
}

window.loginWithGoogle = async function(){
  if(!firebaseReady){ setMsg('loginMsg','<div class="notice">Paste your Firebase config in firebase-config.js first, then Google login will work.</div>'); return; }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try{
    const result = await signInWithPopup(auth, provider);
    const session = saveSession(result.user);
    setMsg('loginMsg', '<div class="success-box">Google login successful. Welcome, <strong>'+session.username+'</strong>.</div>');
    setTimeout(()=> location.href = cleanEmail(session.email) === OWNER_EMAIL ? 'admin.html' : 'index.html', 650);
  }catch(err){
    if(String(err.code || '').includes('popup')){
      await signInWithRedirect(auth, provider);
    } else {
      setMsg('loginMsg','<div class="notice">Google login error: '+(err.message || err.code)+'</div>');
    }
  }
};

window.signupUser = async function(){
  clearAuthErrors('signup');
  const name = document.getElementById('signupName')?.value.trim() || '';
  const username = document.getElementById('signupUsername')?.value.trim() || '';
  const email = cleanEmail(document.getElementById('signupEmail')?.value);
  const password = document.getElementById('signupPassword')?.value || '';
  const confirm = document.getElementById('signupConfirm')?.value || '';
  let ok = true;
  if(!name){ setMsg('signupMsg','<div class="notice error">Please enter your full name.</div>'); ok = false; }
  if(!username){ setFieldError('signupUsernameError','Username is required.'); ok = false; }
  else if(/\s/.test(username)){ setFieldError('signupUsernameError','Username cannot contain spaces.'); ok = false; }
  else if(username.length < 8){ setFieldError('signupUsernameError','Username must contain at least 8 letters.'); ok = false; }
  else if(!isValidUsername(username)){ setFieldError('signupUsernameError','Use only letters, numbers, dot, dash, or underscore.'); ok = false; }
  if(!email){ setFieldError('signupEmailError','Email address is required.'); ok = false; }
  else if(!emailHasAt(email)){ setFieldError('signupEmailError','@ is missing in your email address.'); ok = false; }
  else if(!basicEmailOk(email)){ setFieldError('signupEmailError','Please enter a valid email address.'); ok = false; }
  const passErrors = passcodeErrors(password);
  if(!password){ setFieldError('signupPasswordError','Passcode is required.'); ok = false; }
  else if(passErrors.length){ setFieldError('signupPasswordError', passErrors.join('<br>')); ok = false; }
  if(!confirm){ setFieldError('signupConfirmError','Please confirm your passcode.'); ok = false; }
  else if(password !== confirm){ setFieldError('signupConfirmError','Confirm passcode does not match.'); ok = false; }
  if(!ok) return;
  try{
    if(firebaseReady){
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if(methods.length){ setFieldError('signupEmailError','This email is already registered. Please sign in.'); return; }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username, photoURL: '' });
      const session = saveSession({...cred.user, displayName: username});
      setMsg('signupMsg','<div class="success-box"><h3>Official Sign Up Done!</h3><p>Welcome, <strong>'+session.username+'</strong>. You can login next time with this email and passcode.</p></div>');
      setTimeout(()=>location.href='index.html', 900);
    } else {
      const users = localUsers();
      if(users.some(u => cleanEmail(u.email) === email)){ setFieldError('signupEmailError','This email is already registered. Please sign in.'); return; }
      users.push({name, username, email, password, createdAt:new Date().toISOString()});
      saveLocalUsers(users);
      saveSession({email, displayName: username});
      setMsg('signupMsg','<div class="success-box"><h3>Official Sign Up Done!</h3><p>Welcome, <strong>'+username+'</strong>. You can login next time with this email and passcode.</p></div>');
      setTimeout(()=>location.href='index.html', 900);
    }
  }catch(err){
    const code = String(err.code || '');
    if(code.includes('email-already-in-use')) setFieldError('signupEmailError','This email is already registered. Please sign in.');
    else if(code.includes('weak-password')) setFieldError('signupPasswordError','Passcode is weak. Use 6+ letters, uppercase, and special character like @ # !.');
    else setMsg('signupMsg','<div class="notice error">Sign up error: '+(err.message || err.code)+'</div>');
  }
};

window.loginUser = async function(){
  clearAuthErrors('login');
  const email = cleanEmail(document.getElementById('loginEmail')?.value);
  const pass = document.getElementById('loginPassword')?.value || '';
  let ok = true;
  if(!email){ setFieldError('loginEmailError','Email address is required.'); ok = false; }
  else if(!emailHasAt(email)){ setFieldError('loginEmailError','@ is missing in your email address.'); ok = false; }
  else if(!basicEmailOk(email)){ setFieldError('loginEmailError','Please enter a valid email address.'); ok = false; }
  if(!pass){ setFieldError('loginPasswordError','Passcode is required.'); ok = false; }
  if(!ok) return;
  try{
    if(firebaseReady){
      try{
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if(!methods.length){ setFieldError('loginEmailError','Email isn’t registered. Please sign up first.'); return; }
        if(methods.includes('google.com') && !methods.includes('password')){ setFieldError('loginPasswordError','This email was registered with Google. Please use Continue with Google.'); return; }
      }catch(e){}
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const session = saveSession(cred.user);
      setMsg('loginMsg','<div class="success-box">Login successful. Welcome, <strong>'+session.username+'</strong>.</div>');
      setTimeout(()=>location.href = cleanEmail(session.email) === OWNER_EMAIL ? 'admin.html' : 'index.html', 650);
    } else {
      const users = localUsers();
      const userByEmail = users.find(u => cleanEmail(u.email) === email);
      if(!userByEmail){ setFieldError('loginEmailError','Email isn’t registered. Please sign up first.'); return; }
      if(userByEmail.password !== pass){ setFieldError('loginPasswordError','Passcode is incorrect.'); return; }
      const session = saveSession({email:userByEmail.email, displayName:userByEmail.username || userByEmail.name});
      setMsg('loginMsg','<div class="success-box">Login successful. Welcome, <strong>'+session.username+'</strong>.</div>');
      setTimeout(()=>location.href = cleanEmail(session.email) === OWNER_EMAIL ? 'admin.html' : 'index.html', 650);
    }
  }catch(err){
    const code = String(err.code || '');
    if(code.includes('user-not-found')) setFieldError('loginEmailError','Email isn’t registered. Please sign up first.');
    else if(code.includes('wrong-password') || code.includes('invalid-credential') || code.includes('invalid-login-credentials')) setFieldError('loginPasswordError','Passcode is incorrect.');
    else setMsg('loginMsg','<div class="notice error">Login error: '+(err.message || err.code)+'</div>');
  }
};

window.logoutUser = async function(){
  try{ if(auth) await signOut(auth); }catch(e){}
  localStorage.removeItem('danUserSession');
  localStorage.removeItem('danAdminSession');
  location.href='index.html';
};

window.requireAdminReady = function(cb){
  if(firebaseReady && auth){
    onAuthStateChanged(auth, user => {
      if(!user || cleanEmail(user.email) !== OWNER_EMAIL){ location.href = 'login.html?admin=1'; return; }
      saveSession(user);
      cb && cb();
    });
  } else {
    const s = getSession();
    if(!s || cleanEmail(s.email) !== OWNER_EMAIL){ location.href='login.html?admin=1'; return; }
    cb && cb();
  }
};
