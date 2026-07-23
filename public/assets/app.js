const $ = (s) => document.querySelector(s);
const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

$('#baseUrl').value = location.origin;
function renderPayload(){
  const base = $('#baseUrl').value.replace(/\/$/, '');
  const campaign = $('#campaign').value.trim();
  const type = $('#type').value;
  $('#payload').textContent = `<script>fetch('${base}/api/collect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({campaign:'${campaign}',type:'${type}',page:location.href,referrer:document.referrer})}).catch(()=>{});<\/script>`;
}
['input','change'].forEach(evt => { $('#campaign').addEventListener(evt,renderPayload); $('#type').addEventListener(evt,renderPayload); $('#baseUrl').addEventListener(evt,renderPayload); });
renderPayload();
$('#copy').onclick = async () => { await navigator.clipboard.writeText($('#payload').textContent); $('#copy').textContent='COPIED'; setTimeout(()=>$('#copy').textContent='COPY CALLBACK',900); };

async function loadEvents(){
  const token = $('#token').value;
  const res = await fetch('/api/events',{headers:{'x-dashboard-token':token}});
  const data = await res.json();
  if(!res.ok){ alert(data.error || 'load failed'); return; }
  const events = data.events || [];
  $('#count').textContent = events.length;
  $('#last').textContent = events[0]?.receivedAt ? new Date(events[0].receivedAt).toLocaleString() : '-';
  $('#campaignCount').textContent = new Set(events.map(e=>e.campaign)).size;
  $('#eventRows').innerHTML = events.length ? events.map(e=>`<tr><td>${esc(new Date(e.receivedAt).toLocaleString())}</td><td>${esc(e.campaign)}</td><td>${esc(e.type)}</td><td class="page" title="${esc(e.page)}">${esc(e.page)}</td><td class="page" title="${esc(e.referrer)}">${esc(e.referrer)}</td><td class="page" title="${esc(e.userAgent)}">${esc(e.userAgent)}</td></tr>`).join('') : '<tr><td colspan="6" class="muted">No events</td></tr>';
}
$('#load').onclick = loadEvents;
$('#clear').onclick = async()=>{ if(!confirm('모든 이벤트를 삭제할까요?'))return; const res=await fetch('/api/clear',{method:'DELETE',headers:{'x-dashboard-token':$('#token').value}}); const data=await res.json(); if(!res.ok){alert(data.error||'clear failed');return;} await loadEvents(); };
