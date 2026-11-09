const ADMIN_EMAIL = 'digtialaccessnepal@gmail.com';

function money(n){ return 'Rs. ' + Number(n || 0).toLocaleString(); }
function getOrders(){ return JSON.parse(localStorage.getItem('danOrders') || '[]'); }
function saveOrders(orders){ localStorage.setItem('danOrders', JSON.stringify(orders)); }
function requireAdmin(){
  const session = JSON.parse(localStorage.getItem('danAdminSession') || 'null');
  if(!session || String(session.email || '').toLowerCase() !== ADMIN_EMAIL){
    location.href = 'login.html?admin=1';
  }
}
function renderAdminOrders(){
  const orders = getOrders();
  document.getElementById('statOrders').innerText = orders.length;
  document.getElementById('statPending').innerText = orders.filter(o => String(o.status || '').toLowerCase().includes('pending')).length;
  document.getElementById('statRevenue').innerText = money(orders.reduce((s,o)=>s + Number(o.total || 0), 0));
  const body = document.getElementById('adminOrdersBody');
  if(!orders.length){
    body.innerHTML = '<tr><td colspan="7" class="admin-empty">No orders yet.</td></tr>';
    return;
  }
  body.innerHTML = orders.map((o, i) => `
    <tr>
      <td><strong>${o.id}</strong><small>${new Date(o.createdAt).toLocaleString()}</small></td>
      <td>${o.name || '-'}<small>${o.phone || ''}${o.email ? '<br>'+o.email : ''}</small></td>
      <td>${(o.items || []).map(item => `${item.name} x${item.qty || 1}`).join('<br>')}</td>
      <td><strong>${money(o.total)}</strong></td>
      <td>${o.payment || '-'}</td>
      <td>
        <select class="status-select" onchange="updateStatus(${i}, this.value)">
          ${['Order received','Payment pending','Payment received','Processing','Completed','Cancelled'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button class="small-danger" onclick="deleteOrder(${i})">Delete</button></td>
    </tr>`).join('');
}
function updateStatus(index, status){
  const orders = getOrders();
  if(!orders[index]) return;
  orders[index].status = status;
  orders[index].updatedAt = new Date().toISOString();
  saveOrders(orders);
  renderAdminOrders();
}
function deleteOrder(index){
  if(!confirm('Delete this order from website?')) return;
  const orders = getOrders();
  orders.splice(index, 1);
  saveOrders(orders);
  renderAdminOrders();
}
function exportOrders(){
  const data = JSON.stringify(getOrders(), null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'DigitalAccessNepal-orders.json';
  a.click();
  URL.revokeObjectURL(url);
}
function adminLogout(){
  localStorage.removeItem('danAdminSession');
  location.href = 'login.html';
}
if(window.requireAdminReady){
  window.requireAdminReady(renderAdminOrders);
} else {
  requireAdmin();
  renderAdminOrders();
}
