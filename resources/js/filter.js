// filter.js — handles openSheet modal and NUP search
const SHEETS = [
  {name: 'Data PC', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/gviz/tq?tqx=out:json&gid=1252164346'},
  {name: 'Data Oprasional (Laptop)', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/gviz/tq?tqx=out:json&gid=1884258302'},
  {name: 'Data Keseluruhan (Laptop)', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/gviz/tq?tqx=out:json&gid=0'},
  {name: 'Data Printer', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/gviz/tq?tqx=out:json&gid=813621373'},
  {name: 'Data Kursi', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/gviz/tq?tqx=out:json&gid=976396197'},
  {name: 'Data Tablet', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/gviz/tq?tqx=out:json&gid=1684694910'},
  {name: 'Data CSV', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxXvKLpnJh6yATgGdX_QZShGbR-N53jUqOSTvuT1DTmvsnbgGY2Q1XHwXtR70Gtc_uYezJT9QjXP1h/pub?output=csv'}

];

function getModalElements(){
  const modal = document.getElementById('dataModal');
  const content = document.getElementById('modalContent');
  const title = document.getElementById('modalTitle');
  return {modal, content, title};
}

// Simple CSV parser (handles quoted fields)
function parseCSV(text){
  const lines = text.replace(/\r/g,'').split('\n').filter(l=>l.trim() !== '');
  if(lines.length === 0) throw new Error('Empty CSV');
  const parseLine = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for(let i=0;i<line.length;i++){
      const ch = line[i];
      if(ch === '"'){
        if(inQuotes && line[i+1] === '"'){ cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if(ch === ',' && !inQuotes){ out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map(v => v === undefined ? '' : v.trim());
  }
  const cols = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return {cols, rows};
}

// Parse GViz-wrapped response to JSON object
function parseGViz(text){
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if(firstBrace === -1 || lastBrace === -1) throw new Error('Invalid GViz response');
  const jsonText = text.substring(firstBrace, lastBrace + 1);
  return JSON.parse(jsonText);
}

async function openSheet(gvizUrl, title){
  const {modal, content, title: titleEl} = getModalElements();
  if(!modal) return alert('Modal not found');
  titleEl.textContent = title || 'Data';
  modal.style.display = 'flex';
  content.innerHTML = '<p style="color:#94a3b8">Memuat data...</p>';

  try{
    const res = await fetch(gvizUrl);
    const text = await res.text();
    let cols = [];
    let rows = [];
    try{
      const json = parseGViz(text);
      cols = (json.table.cols || []).map(c => c.label || '');
      rows = (json.table.rows || []).map(r => (r.c || []).map(cell => cell ? cell.v : ''));
    }catch(pe){
      // try CSV fallback (useful for pub?output=csv links)
      try{
        const parsed = parseCSV(text);
        cols = parsed.cols;
        rows = parsed.rows;
      }catch(csvErr){
        throw pe; // rethrow original parse error to fallback iframe
      }
    }

    let html = '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">';
    html += '<thead><tr>' + cols.map(h=>`<th style="text-align:left;padding:8px;border-bottom:1px solid #e6eef8;background:#f8fafc">${h}</th>`).join('') + '</tr></thead>';
    html += '<tbody>' + rows.map(r=>'<tr>'+r.map(c=>`<td style="padding:8px;border-bottom:1px solid #f1f5f9;vertical-align:top">${String(c)}</td>`).join('')+'</tr>').join('') + '</tbody>';
    html += '</table></div>';

    content.innerHTML = html;
  }catch(err){
    console.error('openSheet error:', err);
    // fallback to iframe embedding
    try{
      const u = new URL(gvizUrl);
      const gid = u.searchParams.get('gid') || '';
      const base = gvizUrl.split('/gviz/')[0];
      const pub = `${base}/pubhtml?gid=${encodeURIComponent(gid)}&single=true`;
      content.innerHTML = `<div style="width:100%;height:70vh;"><iframe src="${pub}" style="width:100%;height:100%;border:0;border-radius:8px"></iframe></div>`;
    }catch(e){
      console.error('fallback iframe error', e);
      content.innerHTML = '<p style="color:#b91c1c">Gagal memuat data. Buka spreadsheet di tab baru.</p>';
    }
  }
}

function closeModal(){
  const modal = document.getElementById('dataModal');
  if(modal) modal.style.display = 'none';
}

// NUP search implementation
async function searchNUP(nup){
  const {modal, content, title} = getModalElements();
  if(!modal) return alert('Modal not found');
  title.textContent = `Hasil pencarian: ${nup}`;
  modal.style.display = 'flex';
  content.innerHTML = '<p style="color:#94a3b8">Mencari di semua sheet...</p>';

  const termRaw = String(nup).trim();
  const termNorm = (s)=>String(s||'').toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'');
  const termNum = Number(termRaw);
  const results = [];
  const debugInfo = [];

  // prioritize any sheet named 'all' or containing 'all' (case-insensitive)
  const ordered = [...SHEETS].sort((a,b)=>{
    const aAll = /all|keseluruhan/i.test(a.name);
    const bAll = /all|keseluruhan/i.test(b.name);
    if(aAll && !bAll) return -1;
    if(bAll && !aAll) return 1;
    return 0;
  });

  for(const s of ordered){
    try{
      const res = await fetch(s.url);
      const statusInfo = {status: res.status, ok: res.ok};
      const text = await res.text();
      let cols = [];
      let rows = [];
      let parseNote = '';
      try{
        const json = parseGViz(text);
        cols = (json.table.cols || []).map(c => c.label || '');
        rows = (json.table.rows || []).map(r => (r.c || []).map(cell => cell ? cell.v : ''));
      }catch(pe){
        // try csv fallback
        try{
          const parsed = parseCSV(text);
          cols = parsed.cols;
          rows = parsed.rows;
          parseNote = 'csv_fallback';
        }catch(csvErr){
          debugInfo.push({sheet: s.name, rows: 0, error: 'parse_error', status: statusInfo, snippet: text.slice(0,400)});
          console.warn('GViz/CSV parse error for', s.name, pe, csvErr);
          continue;
        }
      }
      debugInfo.push({sheet: s.name, rows: rows.length, note: parseNote, status: statusInfo});

      const matched = [];
      // detect primary NUP column index
      function detectPrimaryIndex(cols, rows){
        if(!cols || cols.length === 0) return -1;
        const headerMatch = cols.map(c => String(c||''));
        // prefer headers containing 'nup' or 'nomor'
        for(let i=0;i<headerMatch.length;i++){
          if(/\bnup\b|\bno\b|\bnomor\b|nup_no|no_nup/i.test(headerMatch[i])) return i;
        }
        for(let i=0;i<headerMatch.length;i++){
          if(/nup|nomor|no/i.test(headerMatch[i])) return i;
        }
        // fallback: choose column with most numeric values
        let bestIdx = -1; let bestCount = 0;
        for(let i=0;i<cols.length;i++){
          let count = 0;
          for(const r of rows){
            const v = String((r[i]===undefined||r[i]===null)?'':r[i]).trim();
            if(v && /[0-9]/.test(v)) count++;
          }
          if(count > bestCount){ bestCount = count; bestIdx = i; }
        }
        return bestIdx;
      }

      const primaryIdx = detectPrimaryIndex(cols, rows);
      debugInfo[debugInfo.length-1].primaryIdx = primaryIdx;

      rows.forEach((row, idx)=>{
        const tryCells = [];
        if(primaryIdx !== -1) tryCells.push(row[primaryIdx]);
        else tryCells.push(...row);
        // also include fallback to all cells if primary fails
        let found = false;
        for(const cell of tryCells){
          if(cell === null || cell === undefined) continue;
          const cs = String(cell).trim();
          if(cs === '') continue;
          const cellDigits = cs.replace(/[^0-9.-]/g,'');
          const cellNum = Number(cellDigits);
          if(!isNaN(termNum) && !isNaN(cellNum) && termNum === cellNum){ matched.push({row, index:idx}); found = true; break; }
          if(termNorm(cs).includes(termNorm(termRaw))){ matched.push({row, index:idx}); found = true; break; }
        }
        if(!found){
          // fallback: search entire row
          for(const cell of row){
            if(cell === null || cell === undefined) continue;
            const cs = String(cell).trim();
            if(cs === '') continue;
            if(termNorm(cs).includes(termNorm(termRaw))){ matched.push({row, index:idx}); break; }
          }
        }
      });

      if(matched.length) results.push({sheet: s.name, cols, matched});
    }catch(err){
      console.error('searchNUP error for', s.name, err);
      debugInfo.push({sheet:s.name, rows:0, error: String(err)});
    }
  }

  if(results.length === 0){
    let dbg = `<div><p style="color:#b91c1c">Tidak ditemukan NUP '${nup}' di semua sheet.</p>`;
    dbg += '<h4 style="margin-top:8px">Status sheet (jumlah baris yang diambil):</h4><ul>' + debugInfo.map(d=>{
      const status = d.status ? ` (status: ${d.status.status})` : '';
      const err = d.error ? ` — ${d.error}` : '';
      const snippet = d.snippet ? `<div style="background:#f8fafc;padding:8px;margin-top:6px;border-radius:6px;max-height:80px;overflow:auto;font-size:12px;color:#334155">Snippet: ${d.snippet.replace(/</g,'&lt;')}</div>` : '';
      return `<li><strong>${d.sheet}:</strong> ${d.rows || 0}${status}${err}${snippet}</li>`;
    }).join('') + '</ul>';
    dbg += '<p style="color:#64748b">Jika semua row = 0, pastikan sheet sudah dipublish (File → Publish to web) dan URL GViz benar. Lihat juga console untuk pesan fetch/parse.</p></div>';
    content.innerHTML = dbg;
    console.log('search debug:', debugInfo);
    return;
  }

  let html = '';
  for(const group of results){
    html += `<div style="margin-bottom:18px"><h4 style="margin:6px 0">${group.sheet} — ${group.matched.length} hasil</h4>`;
    html += '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">';
    html += '<thead><tr>' + group.cols.map(h=>`<th style="text-align:left;padding:8px;border-bottom:1px solid #e6eef8;background:#f8fafc">${h}</th>`).join('') + '</tr></thead>';
    html += '<tbody>' + group.matched.map(m=>'<tr>'+m.row.map(c=>`<td style="padding:8px;border-bottom:1px solid #f1f5f9;vertical-align:top">${String(c)}</td>`).join('')+'</tr>').join('') + '</tbody>';
    html += '</table></div></div>';
  }

  content.innerHTML = html;
  console.log('search results', results);
}

// Wire up DOM events when loaded
function init(){
  const closeBtn = document.getElementById('closeModal');
  if(closeBtn) closeBtn.addEventListener('click', closeModal);

  const searchBtn = document.getElementById('searchBtn');
  if(searchBtn) searchBtn.addEventListener('click', ()=>{
    const val = document.getElementById('searchNUP').value.trim();
    if(!val) return alert('Masukkan nomor NUP untuk mencari.');
    searchNUP(val);
  });

  const searchInput = document.getElementById('searchNUP');
  if(searchInput) searchInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      const val = document.getElementById('searchNUP').value.trim();
      if(!val) return;
      searchNUP(val);
    }
  });

  // expose functions globally so inline onclick handlers can call openSheet(...)
  window.openSheet = openSheet;
  window.searchNUP = searchNUP;
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

export { openSheet, searchNUP };
