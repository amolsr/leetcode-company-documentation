'use strict';
(function(){
  function byId(id){return document.getElementById(id)}
  let listEl, searchEl, contentEl;
  let companies = (window.__COMPANIES__||[]).slice();
  let hasSSRList = false;

  function setActive(name){
    if(!listEl) return;
    listEl.querySelectorAll('a').forEach(a=>{
      const n=(a.getAttribute('data-name')||a.textContent).trim();
      if(n===name){ a.classList.add('active'); }
      else { a.classList.remove('active'); }
    });
  }

  function hydrateFromDOM(){
    const anchors = listEl ? listEl.querySelectorAll('a[data-name], ul#company-list > li > a') : [];
    const temp=[];
    anchors.forEach(a=>{ const name=a.getAttribute('data-name') || a.textContent.trim(); temp.push({ name, url:a.href }); });
    if(temp.length>0){ companies = temp; hasSSRList = true; }
  }

  function bindLinks(){
    if(!listEl) return;
    listEl.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click',function(e){
        e.preventDefault();
        const name = decodeURIComponent((this.getAttribute('data-name') || this.textContent).trim());
        setActive(name);
        loadCompany(name);
        history.replaceState(null,'','#'+encodeURIComponent(name));
      });
    });
  }

  function renderList(items){
    listEl.innerHTML='';
    items.forEach(item=>{
      const li=document.createElement('li');
      const a=document.createElement('a');
      a.href='#'+encodeURIComponent(item.name);
      a.textContent=item.name;
      a.setAttribute('data-name', item.name);
      li.appendChild(a);
      listEl.appendChild(li);
    });
    if(items.length===0){
      const li=document.createElement('li');
      li.textContent='No companies found';
      listEl.appendChild(li);
    }
    bindLinks();
  }

  function filterListDOM(q){
    const term=q.trim().toLowerCase();
    const items = listEl.querySelectorAll('li');
    items.forEach(li=>{
      const a = li.querySelector('a');
      if(!a){ li.style.display=''; return; }
      const name = (a.getAttribute('data-name') || a.textContent).toLowerCase();
      li.style.display = term && !name.includes(term) ? 'none' : '';
    });
  }

  async function ensureCompanies(){
    if(companies.length>0){ companies.sort((a,b)=>a.name.localeCompare(b.name)); return; }
    hydrateFromDOM();
    if(companies.length>0){ companies.sort((a,b)=>a.name.localeCompare(b.name)); return; }
    try{
      const res = await fetch('https://api.github.com/repos/liquidslr/leetcode-company-wise-problems/contents');
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      companies = data.filter(i=>i.type==='dir').map(i=>({name:i.name, url:'https://github.com/liquidslr/leetcode-company-wise-problems/tree/main/'+encodeURIComponent(i.name)}));
      companies.sort((a,b)=>a.name.localeCompare(b.name));
    }catch(e){ companies = []; }
  }

  async function init(){
    listEl = byId('company-list');
    searchEl = byId('company-search');
    contentEl = byId('company-content');
    if(!listEl || !searchEl || !contentEl){ return }

    await ensureCompanies();

    if(hasSSRList && listEl.children.length > 0){ bindLinks(); }
    else { renderList(companies); }

    searchEl.setAttribute('autofocus','autofocus');

    if(location.hash){
      const name=decodeURIComponent(location.hash.slice(1));
      const found=companies.find(c=>c.name===name);
      if(found){ setActive(name); loadCompany(name); }
    }

    function debounce(fn, delay){ let t; return function(){ const args=arguments; clearTimeout(t); t=setTimeout(()=>fn.apply(null,args), delay); } }
    const handler = debounce(e=>{
      const val = e.target.value || '';
      if(hasSSRList){ filterListDOM(val); }
      else {
        const term=val.trim().toLowerCase();
        if(!term){ renderList(companies); }
        else { renderList(companies.filter(c=>c.name.toLowerCase().includes(term))); }
      }
    }, 120);
    searchEl.addEventListener('input', handler);
    searchEl.addEventListener('keyup', handler);
  }

  async function loadCompany(name){
    contentEl.innerHTML = '<p>Loading '+name+'…</p>';
    const encoded=encodeURIComponent(name);
    const url = 'https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/'+encoded+'/5.%20All.csv';
    try{
      const res = await fetch(url);
      if(!res.ok) throw new Error('HTTP '+res.status);
      const text = await res.text();
      const table = csvToTable(text);
      contentEl.innerHTML='';
      const h2=document.createElement('h2');
      h2.textContent=name;
      contentEl.appendChild(h2);
      contentEl.appendChild(table);
    }catch(err){
      contentEl.innerHTML = '<p>Failed to load CSV for '+name+'.</p>';
    }
  }

  function csvToTable(text){
    const rows = parseCSV(text);
    const table=document.createElement('table');
    table.className='table';
    if(rows.length===0) return table;
    const header=rows[0];
    const difficultyIdx = header.findIndex(h=>/difficulty/i.test(h));
    const linkIdx = header.findIndex(h=>/link|url/i.test(h));
    const titleIdx = header.findIndex(h=>/title|problem/i.test(h));

    const thead=document.createElement('thead');
    const trh=document.createElement('tr');
    header.forEach(h=>{const th=document.createElement('th'); th.textContent=h; trh.appendChild(th)});
    thead.appendChild(trh); table.appendChild(thead);

    const tbody=document.createElement('tbody');
    rows.slice(1).forEach(r=>{
      const tr=document.createElement('tr');
      r.forEach((cell, idx)=>{
        const td=document.createElement('td');
        if(idx===difficultyIdx){
          const d = String(cell||'').toLowerCase();
          const span=document.createElement('span');
          span.className='badge '+(d.includes('easy')?'easy':d.includes('medium')?'medium':d.includes('hard')?'hard':'');
          span.textContent=cell; td.appendChild(span);
        } else if(idx===linkIdx && /^https?:\/\//i.test(String(cell||''))){
          const a=document.createElement('a'); a.href=cell; a.target='_blank'; a.rel='noopener'; a.textContent='Open'; td.appendChild(a);
        } else if(idx===titleIdx && linkIdx>-1 && /^https?:\/\//i.test(String(r[linkIdx]||''))){
          const a=document.createElement('a'); a.href=r[linkIdx]; a.target='_blank'; a.rel='noopener'; a.textContent=cell||''; td.appendChild(a);
        } else {
          td.textContent=cell;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  function parseCSV(text){
    const rows=[]; let row=[]; let cur=''; let inQuotes=false; let i=0;
    while(i<text.length){
      const ch=text[i];
      if(inQuotes){
        if(ch==='"'){
          if(text[i+1]==='"'){cur+='"'; i+=2; continue} else {inQuotes=false; i++; continue}
        } else {cur+=ch; i++; continue}
      } else {
        if(ch==='"'){inQuotes=true; i++; continue}
        if(ch===','){row.push(cur); cur=''; i++; continue}
        if(ch==='\n' || ch==='\r'){if(cur!=='' || row.length>0){row.push(cur); rows.push(row); row=[]; cur=''}; i++; continue}
        cur+=ch; i++;
      }
    }
    if(cur!=='' || row.length>0){row.push(cur); rows.push(row)}
    return rows.filter(r=>!(r.length===1 && r[0]===''))
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
