const SUPABASE_URL = 'https://bmntbeiasyxdxvqjdkpv.supabase.co';
const HEADERS = { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };

let activeTab = 'pending';
let lists = { pending: [], playing: [], done: [] };
let searchedGames = []; 

async function loadGames() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Games?select=*`, { headers: HEADERS });
    const data = await res.json();
    lists = { pending: [], playing: [], done: [] };
    data.forEach(g => {
      lists[g.status].push({
        id: g.game_id,
        db_id: g.id,
        name: g.game_name,
        background_image: g.game_image,
        released: g.game_year,
        rating: g.game_rating,
        genres: g.game_genres ? g.game_genres.split(',').map(n => ({ name: n })) : []
      });
    });
    updateCounts();
    renderList();
  } catch (e) {
    console.error("Error cargando juegos:", e);
  }
}

async function addGame(game, status) {
  
  if (Object.values(lists).flat().find(g => g.id === game.id)) {
    console.log("El juego ya está en una de las listas.");
    return;
  }

  
  const body = {
    game_id: game.id,
    game_name: game.name,
    game_image: game.background_image || '',
    game_year: game.released ? game.released.slice(0, 4) : '',
    game_rating: game.rating || 0,
    game_genres: game.genres ? game.genres.slice(0, 2).map(x => x.name).join(',') : '',
    status: status
  };

  try {
    
    const postHeaders = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation' 
    };

    console.log("Intentando guardar juego:", body.game_name);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/Games`, {
      method: 'POST',
      headers: postHeaders,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Error de Supabase: ${JSON.stringify(errorData)}`);
    }

    console.log("¡Juego guardado con éxito!");
    
    await loadGames();

  } catch (error) {
    console.error("Error al añadir el juego:", error);
    setMsg(`No se pudo añadir el juego: ${error.message}`, 'error');
  }
}

function addGameById(id, status) {
  const game = searchedGames.find(g => g.id === id);
  if (game) {
    addGame(game, status);
  }
}

async function removeGame(dbId) {
  await fetch(`${SUPABASE_URL}/rest/v1/Games?id=eq.${dbId}`, {
    method: 'DELETE',
    headers: HEADERS
  });
  loadGames();
}

function setMsg(text, type) {
  const box = document.getElementById('msgBox');
  if (!text) { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="msg ${type}">${text}</div>`;
}

function setTab(tab, el) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderList();
}

async function searchGames() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  const grid = document.getElementById('resultsGrid');
  const sec = document.getElementById('resultsSection');
  grid.innerHTML = '<div style="color:#555;font-size:13px;padding:1rem;">Buscando...</div>';
  sec.style.display = 'block';
  setMsg('', '');
  try {
    const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(q)}&page_size=8`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.detail) throw new Error(data.detail);
    
    searchedGames = data.results || [];
    renderResults(searchedGames);
  } catch(e) {
    grid.innerHTML = '';
    sec.style.display = 'none';
    setMsg(`Error al buscar: ${e.message}`, 'error');
  }
}

function renderResults(games) {
  const grid = document.getElementById('resultsGrid');
  if (!games.length) { grid.innerHTML = '<div style="color:#555;font-size:13px;">Sin resultados.</div>'; return; }
  grid.innerHTML = games.map(g => `
    <div class="game-card">
      <img src="${g.background_image || ''}" onerror="this.style.background='#222'" />
      <div class="info">
        <div class="name" title="${g.name}">${g.name}</div>
        <div class="meta">${g.released ? g.released.slice(0,4) : '—'} · ⭐ ${g.rating ? g.rating.toFixed(1) : '—'}</div>
      </div>
      <div class="add-btns">
        <button class="btn-pending" onclick="addGameById(${g.id}, 'pending')">+ Pend.</button>
        <button class="btn-playing" onclick="addGameById(${g.id}, 'playing')">▶ Play</button>
        <button class="btn-done" onclick="addGameById(${g.id}, 'done')">✓ Done</button>
      </div>
    </div>
  `).join('');
}

function updateCounts() {
  ['pending','playing','done'].forEach(k => {
    document.getElementById(`cnt-${k}`).textContent = lists[k].length;
  });
}

function renderList() {
  const el = document.getElementById('gameList');
  const games = lists[activeTab];
  const dotClass = { pending: 'dot-pending', playing: 'dot-playing', done: 'dot-done' };
  if (!games.length) {
    el.innerHTML = `<div class="empty">No hay juegos aquí todavía.</div>`;
    return;
  }
  el.innerHTML = games.map(g => `
    <div class="list-item">
      <div class="status-dot ${dotClass[activeTab]}"></div>
      <img src="${g.background_image || ''}" onerror="this.style.background='#222'" />
      <div style="flex:1;min-width:0;">
        <div class="name">${g.name}</div>
        <div class="genre">${g.game_year || ''} ${g.genres && g.genres.length ? '· ' + g.genres.slice(0,2).map(x=>x.name).join(', ') : ''}</div>
      </div>
      <button class="remove" onclick="removeGame(${g.db_id})">✕</button>
    </div>
  `).join('');
}

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchGames();
});

loadGames();