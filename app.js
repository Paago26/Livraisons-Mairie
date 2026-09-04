const STORAGE_KEY = 'rdlp-tournee-v1';
const GEOCODE_CACHE_KEY = 'rdlp-geocode-cache-v1';
const state = loadState();
let lastPlan = null;

const el = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

function defaultState() {
  const today = new Date();
  const iso = new Date(today.getTime() - today.getTimezoneOffset()*60000).toISOString().slice(0,10);
  return {
    date: iso,
    depotAddress: 'Roquefort-les-Pins 06330, France',
    capacity: { tables: 30, chairs: 180, tents: 4 },
    stops: []
  };
}

function loadState() {
  try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return defaultState(); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
function n(v) { return Math.max(0, parseInt(v || 0, 10) || 0); }
function quantities(s) { return { tables: n(s.tables), chairs: n(s.chairs), tents: n(s.tents) }; }
function qText(q) { return `${q.tables} table${q.tables>1?'s':''} · ${q.chairs} chaise${q.chairs>1?'s':''} · ${q.tents} barnum${q.tents>1?'s':''}`; }

function syncInputsFromState() {
  el('tourDate').value = state.date;
  el('depotAddress').value = state.depotAddress || '';
  el('capTables').value = state.capacity.tables;
  el('capChairs').value = state.capacity.chairs;
  el('capTents').value = state.capacity.tents;
}
function syncSettingsToState() {
  state.date = el('tourDate').value;
  state.depotAddress = el('depotAddress').value.trim();
  state.capacity = { tables:n(el('capTables').value), chairs:n(el('capChairs').value), tents:n(el('capTents').value) };
  saveState();
}

function renderStops() {
  el('emptyStops').classList.toggle('hidden', state.stops.length > 0);
  el('stopsList').innerHTML = '';
  for (const s of state.stops) {
    const card = document.createElement('div');
    card.className = `stop-card ${s.type}`;
    card.innerHTML = `
      <div class="type-badge">${s.type==='pickup'?'↥':'↧'}</div>
      <div>
        <strong>${escapeHtml(s.name || (s.type==='pickup'?'Récupération':'Livraison'))}</strong>
        <p>${escapeHtml(s.address)}</p>
        <div class="materials">${qText(quantities(s))}</div>
        ${s.notes ? `<p>📝 ${escapeHtml(s.notes)}</p>` : ''}
      </div>
      <div class="card-actions">
        <button data-edit="${s.id}">Modifier</button>
        <button data-delete="${s.id}">Supprimer</button>
      </div>`;
    el('stopsList').appendChild(card);
  }
  document.querySelectorAll('[data-delete]').forEach(b => b.onclick = () => deleteStop(b.dataset.delete));
  document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openEdit(b.dataset.edit));
}

function escapeHtml(str='') { return str.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }

el('stopForm').addEventListener('submit', e => {
  e.preventDefault();
  const type = new FormData(e.currentTarget).get('type');
  const stop = {
    id: uid(), type,
    name: el('name').value.trim(), phone: el('phone').value.trim(), address: el('address').value.trim(),
    tables:n(el('tables').value), chairs:n(el('chairs').value), tents:n(el('tents').value), notes:el('notes').value.trim()
  };
  if (!stop.address) return;
  if (stop.tables + stop.chairs + stop.tents === 0) { alert('Indique au moins une quantité de matériel.'); return; }
  state.stops.push(stop); saveState(); renderStops();
  e.currentTarget.reset();
  e.currentTarget.querySelector('input[name="type"][value="pickup"]').checked = true;
  el('tables').value=0; el('chairs').value=0; el('tents').value=0;
  lastPlan=null; el('resultsSection').classList.add('hidden');
});

['tourDate','depotAddress','capTables','capChairs','capTents'].forEach(id => el(id).addEventListener('change', syncSettingsToState));

function deleteStop(id) {
  const i=state.stops.findIndex(s=>s.id===id); if(i<0) return;
  state.stops.splice(i,1); saveState(); renderStops(); lastPlan=null; el('resultsSection').classList.add('hidden');
}
function openEdit(id) {
  const s=state.stops.find(x=>x.id===id); if(!s) return;
  el('editId').value=s.id;
  document.querySelector(`input[name="editType"][value="${s.type}"]`).checked=true;
  el('editName').value=s.name; el('editPhone').value=s.phone; el('editAddress').value=s.address;
  el('editTables').value=s.tables; el('editChairs').value=s.chairs; el('editTents').value=s.tents; el('editNotes').value=s.notes;
  el('editDialog').showModal();
}
el('saveEditBtn').addEventListener('click', e => {
  const id=el('editId').value, s=state.stops.find(x=>x.id===id); if(!s) return;
  const data=new FormData(el('editForm'));
  Object.assign(s,{type:data.get('editType'),name:el('editName').value.trim(),phone:el('editPhone').value.trim(),address:el('editAddress').value.trim(),tables:n(el('editTables').value),chairs:n(el('editChairs').value),tents:n(el('editTents').value),notes:el('editNotes').value.trim()});
  if(!s.address || s.tables+s.chairs+s.tents===0){e.preventDefault();alert('Vérifie l’adresse et les quantités.');return;}
  saveState(); renderStops(); lastPlan=null; el('resultsSection').classList.add('hidden');
});

el('resetDayBtn').onclick = () => {
  if (!confirm('Effacer toutes les interventions de cette journée ?')) return;
  state.stops=[]; saveState(); renderStops(); lastPlan=null; el('resultsSection').classList.add('hidden');
};

el('demoBtn').onclick = () => {
  state.depotAddress='Roquefort-les-Pins 06330, France';
  state.stops=[
    {id:uid(),type:'pickup',name:'Exemple — Famille A',phone:'',address:'Chemin du Clos, 06330 Roquefort-les-Pins, France',tables:5,chairs:30,tents:1,notes:''},
    {id:uid(),type:'delivery',name:'Exemple — Famille B',phone:'',address:'Route de Valbonne, 06330 Roquefort-les-Pins, France',tables:4,chairs:20,tents:1,notes:''},
    {id:uid(),type:'pickup',name:'Exemple — Famille C',phone:'',address:'Chemin de Beaume Granet, 06330 Roquefort-les-Pins, France',tables:8,chairs:50,tents:0,notes:''},
    {id:uid(),type:'delivery',name:'Exemple — Famille D',phone:'',address:'Chemin du Puits, 06330 Roquefort-les-Pins, France',tables:6,chairs:40,tents:0,notes:''}
  ];
  saveState(); syncInputsFromState(); renderStops(); lastPlan=null; el('resultsSection').classList.add('hidden');
};

async function geocodeAddress(address) {
  const cache = JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) || '{}');
  const cacheKey = address.trim().toLowerCase();
  if (cache[cacheKey]) return cache[cacheKey];
  const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=fr&q=${encodeURIComponent(address)}`;
  const r=await fetch(url,{headers:{'Accept-Language':'fr'}});
  if(!r.ok) throw new Error('Géocodage indisponible');
  const data=await r.json();
  if(!data.length) throw new Error(`Adresse introuvable : ${address}`);
  const result = {lat:+data[0].lat, lon:+data[0].lon, display:data[0].display_name};
  cache[cacheKey] = result;
  localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  return result;
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function haversine(a,b){
  const R=6371, toRad=x=>x*Math.PI/180, dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon);
  const x=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

function buildDistanceMatrix(points){
  return points.map(a=>points.map(b=>haversine(a,b)));
}

function totalsByType(stops,type){
  return stops.filter(s=>s.type===type).reduce((a,s)=>({tables:a.tables+s.tables,chairs:a.chairs+s.chairs,tents:a.tents+s.tents}),{tables:0,chairs:0,tents:0});
}

function optimizeSequence(stops, matrix, cap) {
  const N=stops.length;
  if(N===0) return null;
  const keys=['tables','chairs','tents'];
  const initialNode = {
    seq:[], mask:0, last:0, dist:0,
    c:{tables:0,chairs:0,tents:0},
    minC:{tables:0,chairs:0,tents:0},
    maxC:{tables:0,chairs:0,tents:0}
  };
  let beam=[initialNode];
  const beamWidth = N <= 10 ? 1200 : N <= 14 ? 600 : 250;
  for(let depth=0; depth<N; depth++){
    const next=[];
    for(const node of beam){
      for(let i=0;i<N;i++){
        if(node.mask & (1<<i)) continue;
        const s=stops[i];
        const c={...node.c}, minC={...node.minC}, maxC={...node.maxC};
        for(const k of keys){
          c[k] += (s.type==='pickup'?1:-1)*s[k];
          minC[k]=Math.min(minC[k],c[k]); maxC[k]=Math.max(maxC[k],c[k]);
        }
        let feasible=true, initialLoad={}, occupancyPenalty=0;
        for(const k of keys){
          initialLoad[k]=Math.max(0,-minC[k]);
          if(initialLoad[k]+maxC[k] > cap[k]) { feasible=false; break; }
          occupancyPenalty += cap[k] ? (initialLoad[k]+c[k])/cap[k] : 0;
        }
        if(!feasible) continue;
        const fromIndex=node.seq.length ? node.last+1 : 0;
        const toIndex=i+1;
        const leg=matrix[fromIndex][toIndex];
        const newDist=node.dist+leg;
        // Prefer short legs, low initial loading, and avoid carrying a very full truck for long.
        const initialPenalty=(initialLoad.tables*0.025)+(initialLoad.chairs*0.003)+(initialLoad.tents*0.08);
        const score=newDist+initialPenalty+occupancyPenalty*0.02;
        next.push({seq:[...node.seq,i],mask:node.mask|(1<<i),last:i,dist:newDist,c,minC,maxC,score});
      }
    }
    if(!next.length) return null;
    next.sort((a,b)=>a.score-b.score);
    beam=next.slice(0,beamWidth);
  }
  for(const node of beam){ node.dist += matrix[node.last+1][0]; node.score += matrix[node.last+1][0]; }
  beam.sort((a,b)=>a.score-b.score);
  const best=beam[0];
  const initialLoad={};
  for(const k of keys) initialLoad[k]=Math.max(0,-best.minC[k]);
  return { sequence:best.seq, initialLoad, distance:best.dist };
}

function computeStocks(sequence, stops, initialLoad){
  const stock={...initialLoad};
  return sequence.map(i=>{
    const s=stops[i];
    for(const k of ['tables','chairs','tents']) stock[k]+=(s.type==='pickup'?1:-1)*s[k];
    return {...stock};
  });
}

el('optimizeBtn').onclick = async () => {
  syncSettingsToState();
  if(state.stops.length<1){alert('Ajoute au moins une intervention.');return;}
  if(!state.depotAddress){alert('Indique l’adresse du local technique.');return;}
  if(state.stops.length>20){alert('Cette V1 est prévue pour 20 interventions maximum par tournée.');return;}
  const btn=el('optimizeBtn'), old=btn.textContent; btn.disabled=true; btn.textContent='Calcul en cours…';
  try{
    const geocoded=[];
    geocoded.push(await geocodeAddress(state.depotAddress));
    for(let i=0;i<state.stops.length;i++){
      btn.textContent=`Adresse ${i+1}/${state.stops.length}…`;
      geocoded.push(await geocodeAddress(state.stops[i].address));
      await sleep(1100); // Respecte la limite publique Nominatim: max. 1 requête/seconde
    }
    const matrix=buildDistanceMatrix(geocoded);
    const plan=optimizeSequence(state.stops,matrix,state.capacity);
    if(!plan) throw new Error('Aucun ordre possible avec les capacités indiquées. Essaie une capacité supérieure ou prévois un retour au dépôt.');
    plan.coords=geocoded;
    plan.stocks=computeStocks(plan.sequence,state.stops,plan.initialLoad);
    lastPlan=plan; renderPlan(plan);
  }catch(err){ alert(err.message || 'Erreur pendant le calcul.'); console.error(err); }
  finally{btn.disabled=false;btn.textContent=old;}
};

function renderPlan(plan){
  const p=totalsByType(state.stops,'pickup'), d=totalsByType(state.stops,'delivery');
  el('totalDeliveryTables').textContent=d.tables; el('totalPickupTables').textContent=p.tables;
  el('totalDeliveryChairs').textContent=d.chairs; el('totalPickupChairs').textContent=p.chairs;
  el('totalDeliveryTents').textContent=d.tents; el('totalPickupTents').textContent=p.tents;
  el('initialLoad').textContent=qText(plan.initialLoad);
  el('distanceSummary').textContent=`≈ ${fmt.format(plan.distance)} km`;
  el('stopsSummary').textContent=state.stops.length;

  const alerts=[];
  const net={tables:d.tables-p.tables,chairs:d.chairs-p.chairs,tents:d.tents-p.tents};
  alerts.push(`<div class="alert good">✓ Ordre compatible avec les capacités du camion renseignées. Le chargement de départ calculé suffit pour suivre cet ordre sans manquer de matériel.</div>`);
  if(net.tables>0||net.chairs>0||net.tents>0) alerts.push(`<div class="alert warn">Sur l’ensemble de la journée, tu livres plus que tu ne récupères pour au moins un matériel. Le stock du local doit donc fournir la différence.</div>`);
  alerts.push(`<div class="alert warn">Distance = estimation à vol d’oiseau majorée par l’ordre des arrêts. Le bouton Navigation ouvre l’itinéraire routier réel dans Plans/Google Maps selon l’appareil.</div>`);
  el('alerts').innerHTML=alerts.join('');

  el('routeList').innerHTML='';
  plan.sequence.forEach((idx,pos)=>{
    const s=state.stops[idx], stock=plan.stocks[pos];
    const div=document.createElement('div'); div.className='route-step';
    const phone=s.phone?`<a href="tel:${escapeHtml(s.phone)}">Appeler</a>`:'';
    const maps=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`;
    div.innerHTML=`
      <div class="route-number">${pos+1}</div>
      <div>
        <strong>${s.type==='pickup'?'Récupération':'Livraison'} — ${escapeHtml(s.name||'Sans nom')}</strong>
        <p>${escapeHtml(s.address)}</p>
        <p>${qText(quantities(s))}</p>
        ${s.notes?`<p>📝 ${escapeHtml(s.notes)}</p>`:''}
        <p class="stock-line">Camion après l’arrêt : ${qText(stock)}</p>
      </div>
      <div class="route-buttons">${phone}<a target="_blank" rel="noopener" href="${maps}">Navigation</a></div>`;
    el('routeList').appendChild(div);
  });
  el('resultsSection').classList.remove('hidden');
  el('resultsSection').scrollIntoView({behavior:'smooth',block:'start'});
}

el('openFullRouteBtn').onclick=()=>{
  if(!lastPlan) return;
  const ordered=lastPlan.sequence.map(i=>state.stops[i].address);
  const origin=state.depotAddress, destination=state.depotAddress;
  const waypoints=ordered.slice(0,-1).join('|');
  const last=ordered[ordered.length-1];
  // Google Maps URLs support a limited number of waypoints on mobile. Use last stop as destination; return depot can be launched separately.
  const url=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(last)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
  window.open(url,'_blank','noopener');
};

syncInputsFromState(); renderStops();
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
