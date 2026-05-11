let checkout = JSON.parse(localStorage.getItem('danCheckout') || '[]');
let paymentMethod = 'Khalti';

const params = new URLSearchParams(location.search);
if(params.get('product') && params.get('price')){
  checkout = [{name: params.get('product'), price: Number(params.get('price')), qty: 1}];
  localStorage.setItem('danCheckout', JSON.stringify(checkout));
}
if(!Array.isArray(checkout) || checkout.length === 0){ checkout = [{name:'Netflix Premium', price:349, qty:1}]; }

function money(n){ return 'Rs. ' + Number(n).toLocaleString(); }
function total(){ return checkout.reduce((s,i)=>s + Number(i.price)*Number(i.qty || 1), 0); }

function renderOrder(){
  document.getElementById('orderItems').innerHTML = checkout.map(i => `
    <div class="checkout-item">
      <div><strong>${i.name}</strong><p>Quantity: ${i.qty || 1}</p></div>
      <span>${money(Number(i.price) * Number(i.qty || 1))}</span>
    </div>`).join('');
  document.getElementById('subtotal').innerText = money(total());
  document.getElementById('total').innerText = money(total());
}

function showQR(type){
  const qr = document.getElementById('mainQR');
  const dl = document.getElementById('downloadQR');
  const label = document.getElementById('selectedMethod');
  paymentMethod = type === 'esewa' ? 'eSewa' : 'Khalti';
  if(type === 'esewa'){
    qr.src = 'esewa.png';
    dl.href = 'esewa.png';
    dl.download = 'DigitalAccessNepal-eSewa-QR.png';
    label.innerText = 'eSewa Selected';
  } else {
    qr.src = 'khalti.png';
    dl.href = 'khalti.png';
    dl.download = 'DigitalAccessNepal-Khalti-QR.png';
    label.innerText = 'Khalti Selected';
  }
  document.querySelectorAll('.paybtns button').forEach(b => b.classList.remove('active'));
  document.getElementById(type + 'Btn').classList.add('active');
}

function completeOrder(){
  const name = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  if(!name || !phone){ alert('Please enter full name and phone number.'); return; }

  const id = 'DAN-' + Math.floor(100000 + Math.random() * 900000);
  const order = {
    id, name, phone,
    email: document.getElementById('email').value.trim(),
    note: document.getElementById('note').value.trim(),
    items: checkout,
    total: total(),
    payment: paymentMethod,
    status: 'Order received',
    createdAt: new Date().toISOString(),
    justPlaced: true
  };
  const orders = JSON.parse(localStorage.getItem('danOrders') || '[]');
  orders.unshift(order);
  localStorage.setItem('danOrders', JSON.stringify(orders));
  localStorage.removeItem('danCart');

  document.getElementById('orderMessage').innerHTML = `<div class="success-box"><h3>Place Order Done!</h3><p>Your Order ID is <strong>${id}</strong></p><p>Status: ${order.status}</p><p>Your order is now saved directly on the website.</p></div>`;
  setTimeout(()=>{ location.href = 'index.html#orders'; }, 900);
}

renderOrder();
showQR('khalti');


function revealAdminLink(){
  try{
    const session = JSON.parse(localStorage.getItem('danAdminSession') || 'null');
    const link = document.getElementById('adminNavLink');
    if(link && session && String(session.email || '').toLowerCase() === 'digtialaccessnepal@gmail.com'){
      link.classList.remove('hidden-admin');
      link.style.display = 'inline-flex';
    }
  }catch(e){}
}
revealAdminLink();

function getUserSession(){
  try{ return JSON.parse(localStorage.getItem('danUserSession') || 'null'); }catch(e){ return null; }
}
function logoutUser(){
  localStorage.removeItem('danUserSession');
  localStorage.removeItem('danAdminSession');
  location.href='index.html';
}
function renderUserNav(){
  const box = document.getElementById('userNav');
  if(!box) return;
  const user = getUserSession();
  if(user && user.username){
    box.innerHTML = `<span class="username-pill">👤 ${user.username}</span><button class="logout-mini" onclick="logoutUser()">Logout</button>`;
  } else {
    box.innerHTML = `<a href="login.html" id="loginLink">Login</a><a href="signup.html" id="signupLink" class="signup-link">Sign Up</a>`;
  }
}
function prefillCustomerFromUser(){
  const user = getUserSession();
  if(!user) return;
  const fullName = document.getElementById('fullName');
  const email = document.getElementById('email');
  if(fullName && !fullName.value) fullName.value = user.name || user.username || '';
  if(email && !email.value) email.value = user.email || '';
}
renderUserNav();
prefillCustomerFromUser();
