const CONTACT_PHONE = '9829136727';
const CONTACT_PHONE_INTL = '9779829136727';
const FACEBOOK_LINK = 'https://facebook.com/share/1EC65sXvDP/';

const brandLogo = (name) => `${name}.svg`;

const products = [
  {name:'Netflix Premium', category:'Primary OTT', desc:'Premium streaming plan • fast delivery', logoImg:brandLogo('netflix'), cls:'netflix', badge:'Premium Access', plans:[
    {label:'1 Month', price:349},{label:'2 Months', price:599},{label:'3 Months', price:849},{label:'6 Months', price:1749},{label:'12 Months', price:3699}
  ]},
  {name:'Spotify Premium', category:'Primary Music', desc:'Ad-free music premium • fast delivery', logoImg:brandLogo('spotify'), cls:'spotify', badge:'Premium Music', plans:[
    {label:'3 Months', price:1099},{label:'6 Months', price:1949},{label:'12 Months', price:3899}
  ]},
  {name:'CapCut Pro', category:'Primary Design', desc:'Pro editing plan • templates and export tools', logoImg:brandLogo('capcut'), cls:'capcut', badge:'Pro Plan', plans:[
    {label:'1 Month', price:499},{label:'1 Year', price:1999}
  ]},
  {name:'Microsoft Office Key', category:'Primary Software', desc:'1 year license key • productivity apps', logoImg:brandLogo('microsoft'), cls:'microsoft', badge:'License Key', plans:[
    {label:'1 Year Key', price:1999}
  ]},
  {name:'Claude AI Pro', category:'Primary AI', desc:'Your mail AI pro plan • fast setup', logoImg:brandLogo('claude'), cls:'claude', badge:'AI Pro', plans:[
    {label:'1 Month', price:1999}
  ]},
  {name:'ChatGPT Plus Private', category:'Primary AI', desc:'Your mail private plan • secure setup', logoImg:brandLogo('chatgpt'), cls:'chatgpt', badge:'Private Access', plans:[
    {label:'1 Month', price:999},{label:'1 Year', price:4999}
  ]},
  {name:'ChatGPT Pro Sharing Plan', category:'Primary AI', desc:'Shared pro access • budget friendly', logoImg:brandLogo('chatgpt'), cls:'chatgpt', badge:'Sharing Plan', plans:[
    {label:'3 Months', price:1999}
  ]},
  {name:'Perplexity Pro', category:'Primary AI', desc:'AI search and research pro plan', logoImg:brandLogo('perplexity'), cls:'perplexity', badge:'AI Research', plans:[
    {label:'1 Year', price:2999}
  ]},
  {name:'SuperGrok', category:'Primary AI', desc:'Grok premium access • fast delivery', logoImg:brandLogo('grok'), cls:'grok', badge:'AI Premium', plans:[
    {label:'1 Month', price:1499},{label:'1 Year', price:4899}
  ]},
  {name:'YouTube Premium', category:'Primary OTT', desc:'Ad-free video and music plan', logoImg:brandLogo('youtube'), cls:'youtube', badge:'Video Premium', plans:[
    {label:'1 Year', price:2299}
  ]},
  {name:'Prime Video', category:'Primary OTT', desc:'Streaming subscription access', logoImg:brandLogo('primevideo'), cls:'prime', badge:'Streaming', plans:[
    {label:'1 Month', price:99}
  ]},
  {name:'Canva Pro', category:'Primary Design', desc:'Design tools, templates and pro features', logoImg:brandLogo('canva'), cls:'canva', badge:'Design Pro', plans:[
    {label:'1 Month', price:500}
  ]},
  {name:'Grammarly', category:'Primary Software', desc:'Grammar and writing assistant • fast delivery', logoImg:brandLogo('grammarly'), cls:'grammarly', badge:'Writing Tool', plans:[
    {label:'1 Month', price:500}
  ]},
  {name:'Quillbot Premium', category:'Primary Software', desc:'Paraphrasing and writing tool • fast delivery', logoImg:brandLogo('quillbot'), cls:'quillbot', badge:'Writing Tool', plans:[
    {label:'1 Month', price:500}
  ]},
  {name:'Scribd Premium', category:'More Cloud Services', desc:'Books, documents and reading access', logoImg:brandLogo('scribd'), cls:'scribd', badge:'Reading Access', plans:[
    {label:'1 Month', price:1000}
  ]},
  {name:'Windows Activation Key', category:'Primary Software', desc:'Windows activation key • fast delivery', logoImg:brandLogo('windows'), cls:'windows', badge:'Lifetime Key', plans:[
    {label:'Lifetime Key', price:1500}
  ]},
  {name:'Adobe Creative Cloud', category:'Primary Design', desc:'Adobe apps access • creative suite', logoImg:brandLogo('adobe'), cls:'adobe', badge:'Creative Suite', plans:[
    {label:'1 Month', price:2000}
  ]},
  {name:'Beautiful AI', category:'Primary AI', desc:'AI presentation maker • fast delivery', logoImg:brandLogo('beautifulai'), cls:'beautifulai', badge:'Presentation AI', plans:[
    {label:'1 Month', price:2000}
  ]}
];

const categories = ['All','Primary AI','Primary Plans','Primary OTT','Primary Music','Primary Software','Primary Design','More Cloud Services'];
let activeCategory = 'All';
let cart = JSON.parse(localStorage.getItem('danCart') || '[]');

function saveCart(){ localStorage.setItem('danCart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){ const el=document.getElementById('cartCount'); if(el) el.innerText = cart.reduce((s,i)=>s+i.qty,0); }
function scrollToProducts(){ document.getElementById('products').scrollIntoView({behavior:'smooth'}); }
function productCategoryMatches(product){ return activeCategory === 'All' || product.category === activeCategory || (activeCategory === 'Primary Plans' && product.category.startsWith('Primary')); }
function planName(product, plan){ return `${product.name} - ${plan.label}`; }
function getSelectedPlan(index){ const p=products[index]; const sel=document.getElementById('plan-'+index); return p.plans[Number(sel ? sel.value : 0)] || p.plans[0]; }
function buySelected(index){ const p=products[index], plan=getSelectedPlan(index); buyNow(planName(p,plan), plan.price); }
function addSelected(index){ const p=products[index], plan=getSelectedPlan(index); addToCart(planName(p,plan), plan.price); }
function updatePlanPrice(index){ const plan=getSelectedPlan(index); const el=document.getElementById('price-'+index); if(el) el.innerText = 'Rs. ' + plan.price.toLocaleString(); }
function buyNow(name, price){ localStorage.setItem('danCheckout', JSON.stringify([{name, price:Number(price), qty:1}])); location.href = 'buy.html'; }
function addToCart(name, price){ price=Number(price); const found=cart.find(i=>i.name===name); if(found) found.qty+=1; else cart.push({name,price,qty:1}); saveCart(); renderCart(); openCart(); }
function removeFromCart(index){ cart.splice(index,1); saveCart(); renderCart(); }
function changeQty(index, qty){ cart[index].qty = Math.max(1, Number(qty)); saveCart(); renderCart(); }
function clearCart(){ cart=[]; saveCart(); renderCart(); }

function renderCategoryTabs(){
  const tabs = document.getElementById('categoryTabs'); if(!tabs) return;
  tabs.innerHTML = categories.map(c => `<button class="tab-btn ${c===activeCategory?'active':''}" onclick="setCategory('${c}')">${c}</button>`).join('');
}
function setCategory(cat){ activeCategory = cat; renderCategoryTabs(); applyFilters(); }

function applyFilters(){
  const q=(document.getElementById('searchInput')?.value || '').toLowerCase();
  renderProducts(products.filter(p => productCategoryMatches(p) && (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.plans.some(pl=>pl.label.toLowerCase().includes(q)))));
}

function safeImg(img, fallback){ img.outerHTML = `<span class="logo-fallback">${fallback}</span>`; }
function renderProducts(list=products){
  const container=document.getElementById('productCards'); if(!container) return;
  if(!list.length){ container.innerHTML = '<div class="notice full">No products found. Try another search or category.</div>'; return; }
  container.innerHTML = list.map((p)=>{ const index=products.indexOf(p); const first=p.plans[0]; const fallback=p.name.split(' ').map(w=>w[0]).join('').slice(0,3); return `
    <div class="card premium-card">
      <div class="card-top"><div class="logo-box ${p.cls}"><img src="${p.logoImg}" alt="${p.name} logo" onerror="safeImg(this,'${fallback}')"></div><span class="mini-badge">${p.badge}</span></div>
      <h3>${p.name}</h3>
      <p>${p.plans[0].label} • ${p.desc}</p>
      <div class="trust-line">Fresh account • Secure payment • Fast delivery</div>
      <label class="plan-label">Choose plan</label>
      <select class="plan-select" id="plan-${index}" onchange="updatePlanPrice(${index})">
        ${p.plans.map((pl,i)=>`<option value="${i}">${pl.label} - Rs. ${pl.price.toLocaleString()}</option>`).join('')}
      </select>
      <h4 id="price-${index}">Rs. ${first.price.toLocaleString()}</h4>
      <div class="card-actions"><button class="cartbtn" onclick="addSelected(${index})">Add Cart</button><button onclick="buySelected(${index})">Buy Now</button></div>
      <details><summary>About Product</summary><p>${p.name} includes ${p.desc}. Delivery starts after payment verification.</p></details>
    </div>`; }).join('');
}

function renderCart(){
  const container=document.getElementById('cartItems'); if(!container) return;
  container.innerHTML = cart.length ? cart.map((item,index)=>`
    <div class="cart-item"><h4>${item.name}</h4><p>Rs. ${item.price.toLocaleString()} x <input class="qty" type="number" min="1" value="${item.qty}" onchange="changeQty(${index},this.value)"></p><strong>Rs. ${(item.price*item.qty).toLocaleString()}</strong><button class="small-danger" onclick="removeFromCart(${index})">Remove</button></div>`).join('') : '<p class="empty">Your cart is empty.</p>';
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0); const totalEl=document.getElementById('cartTotal'); if(totalEl) totalEl.innerText='Rs. '+total.toLocaleString();
}
function openCart(){ const drawer=document.getElementById('cartDrawer'); if(drawer) drawer.style.right='0'; renderCart(); }
function closeCart(){ const drawer=document.getElementById('cartDrawer'); if(drawer) drawer.style.right='-420px'; }
function goCheckout(){ if(cart.length===0){ alert('Please add an item to cart first.'); return; } localStorage.setItem('danCheckout', JSON.stringify(cart)); location.href='buy.html'; }

function renderOrders(){
  const list=document.getElementById('ordersList'); if(!list) return;
  const orders=JSON.parse(localStorage.getItem('danOrders') || '[]');
  if(!orders.length){ list.innerHTML='<div class="notice">No orders yet. After checkout, your order will show here automatically.</div>'; return; }
  list.innerHTML = orders.map(o=>`<div class="order-card ${o.justPlaced ? 'just-placed' : ''}"><div><strong>${o.id}</strong>${o.justPlaced ? '<small class="fresh-order">Just placed</small>' : ''}<p>${o.items.map(i=>i.name).join(', ')}</p><small>${new Date(o.createdAt).toLocaleString()}</small><p class="customer-line">${o.name || ''} ${o.phone ? '• '+o.phone : ''}</p></div><div><b>Rs. ${Number(o.total).toLocaleString()}</b><span>${o.status}</span><em>${o.payment}</em></div></div>`).join('');
  const cleaned = orders.map(o => ({...o, justPlaced:false}));
  localStorage.setItem('danOrders', JSON.stringify(cleaned));
}
function trackOrder(){ renderOrders(); document.getElementById('orders').scrollIntoView({behavior:'smooth'}); }

const searchInput=document.getElementById('searchInput');
if(searchInput){ searchInput.addEventListener('input', applyFilters); }
renderCategoryTabs(); renderProducts(); updateCartCount(); renderCart(); renderOrders();


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
function renderHomeAuthCard(){
  const card = document.getElementById('homeAuthCard');
  if(!card) return;
  const user = getUserSession();
  if(user && user.email){
    const avatar = user.photoURL ? `<img class="home-auth-avatar" src="${user.photoURL}" alt="${user.username}">` : '<span class="home-auth-avatar empty">👤</span>';
    card.innerHTML = `<div class="home-auth-copy"><strong>Welcome, ${user.username || 'User'}</strong><span>You are signed in. Your orders will save under ${user.email}.</span></div><div class="home-auth-actions signed">${avatar}<button class="home-google-btn outline" onclick="trackOrder()">View Orders</button><button class="home-google-btn" onclick="logoutUser()">Logout</button></div>`;
  }
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
renderUserNav();
renderHomeAuthCard();
