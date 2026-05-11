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
function setMsg(id, html){ const el = document.getElementById(id); if(el) el.innerHTML = html; }
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
    box.innerHTML = `<a href="login.html" id="loginLink">Login</a><a href="signup.html" id="signupLink" class="signup-link">Sign Up</a>`;
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
  const name = document.getElementById('signupName')?.value.trim() || '';
  const username = document.getElementById('signupUsername')?.value.trim() || '';
  const email = cleanEmail(document.getElementById('signupEmail')?.value);
  const password = document.getElementById('signupPassword')?.value || '';
  const confirm = document.getElementById('signupConfirm')?.value || '';
  if(!name || !username || !email || !password){ setMsg('signupMsg','<div class="notice">Please fill full name, username, email, and password.</div>'); return; }
  if(password.length < 6){ setMsg('signupMsg','<div class="notice">Password must be at least 6 characters for Firebase.</div>'); return; }
  if(password !== confirm){ setMsg('signupMsg','<div class="notice">Confirm password does not match.</div>'); return; }
  try{
    if(firebaseReady){
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username, photoURL: '' });
      const session = saveSession({...cred.user, displayName: username});
      setMsg('signupMsg','<div class="success-box"><h3>Official Sign Up Done!</h3><p>Welcome, <strong>'+session.username+'</strong>. You can login next time with Firebase.</p></div>');
      setTimeout(()=>location.href='index.html', 900);
    } else {
      const users = localUsers();
      if(users.some(u => cleanEmail(u.email) === email)){ setMsg('signupMsg','<div class="notice">This email is already signed up. Please login.</div>'); return; }
      users.push({name, username, email, password, createdAt:new Date().toISOString()});
      saveLocalUsers(users);
      saveSession({email, displayName: username});
      setMsg('signupMsg','<div class="success-box"><h3>Official Sign Up Done!</h3><p>Welcome, <strong>'+username+'</strong>. Local signup works now; Firebase starts after config paste.</p></div>');
      setTimeout(()=>location.href='index.html', 900);
    }
  }catch(err){ setMsg('signupMsg','<div class="notice">Sign up error: '+(err.message || err.code)+'</div>'); }
};

window.loginUser = async function(){
  const email = cleanEmail(document.getElementById('loginEmail')?.value);
  const pass = document.getElementById('loginPassword')?.value || '';
  if(!email || !pass){ setMsg('loginMsg','<div class="notice">Please enter email and password.</div>'); return; }
  try{
    if(firebaseReady){
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const session = saveSession(cred.user);
      setMsg('loginMsg','<div class="success-box">Login successful. Welcome, <strong>'+session.username+'</strong>.</div>');
      setTimeout(()=>location.href = cleanEmail(session.email) === OWNER_EMAIL ? 'admin.html' : 'index.html', 650);
    } else {
      const user = localUsers().find(u => cleanEmail(u.email) === email && u.password === pass);
      if(!user){ setMsg('loginMsg','<div class="notice">Account not found or password wrong. Please sign up first.</div>'); return; }
      const session = saveSession({email:user.email, displayName:user.username || user.name});
      setMsg('loginMsg','<div class="success-box">Login successful. Welcome, <strong>'+session.username+'</strong>.</div>');
      setTimeout(()=>location.href = cleanEmail(session.email) === OWNER_EMAIL ? 'admin.html' : 'index.html', 650);
    }
  }catch(err){ setMsg('loginMsg','<div class="notice">Login error: '+(err.message || err.code)+'</div>'); }
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
