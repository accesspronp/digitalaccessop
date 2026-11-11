// Product reviews (Firestore). Only reviews with approved:true are shown.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const box = document.getElementById('reviewsBox');
if (box) {
  const key = box.dataset.product;
  const cfg = window.firebaseConfig || {};
  const ready = cfg.apiKey && !String(cfg.apiKey).includes('PASTE_');
  const app = ready ? (getApps().length ? getApps()[0] : initializeApp(cfg)) : null;
  const db = app ? getFirestore(app) : null;
  const list = box.querySelector('.revList');
  const msg = box.querySelector('.revMsg');
  const form = box.querySelector('form');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

  async function load() {
    if (!db) { list.innerHTML = '<p>No reviews yet.</p>'; return; }
    try {
      const snap = await getDocs(query(collection(db, 'reviews'), where('productKey', '==', key), where('approved', '==', true)));
      const rows = snap.docs.map(d => d.data()).sort((a, b) => (b.createdMs || 0) - (a.createdMs || 0));
      list.innerHTML = rows.length
        ? rows.map(r => `<div class="revItem"><b>${esc(r.name)}</b> <span class="revStars">${stars(r.rating)}</span><p>${esc(r.text)}</p></div>`).join('')
        : '<p>No reviews yet. Be the first to review this plan.</p>';
    } catch (e) { list.innerHTML = '<p>Reviews could not be loaded right now.</p>'; }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim().slice(0, 40);
    const rating = Number(fd.get('rating'));
    const text = String(fd.get('text') || '').trim().slice(0, 500);
    if (!name || !text || rating < 1 || rating > 5) { msg.textContent = 'Please fill in your name, a rating and your review.'; return; }
    if (!db) { msg.textContent = 'Reviews are not active yet. Please try again later.'; return; }
    try {
      await addDoc(collection(db, 'reviews'), { productKey: key, name, rating, text, approved: false, createdMs: Date.now() });
      form.reset();
      msg.textContent = 'Thank you! Your review will appear after we check it.';
    } catch (err) { msg.textContent = 'Could not send your review. Please try again.'; }
  });

  load();
}
