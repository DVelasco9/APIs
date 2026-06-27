let currentSubreddit = 'programming';
let currentSort = 'hot';

// Calcula el tiempo transcurrido desde la publicación
function timeAgo(dateString) {
  const date = new Date(dateString);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// Extrae la imagen del contenido HTML si existe (ya que el RSS la esconde ahí)
function extractImage(htmlContent) {
  const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
}

// Renderiza la tarjeta del post usando los datos del RSS
function renderPost(item, sub) {
  const thumb = item.thumbnail || extractImage(item.content);
  
  return `
    <div class="post-card">
      <div class="vote-col">
        ▲
        <span>•</span>
        ▼
      </div>
      <div class="post-body">
        <div class="post-meta">
          <a href="https://reddit.com/r/${sub}" target="_blank">r/${sub}</a>
          · u/${item.author || 'Anónimo'} · ${timeAgo(item.pubDate)}
        </div>
        
        <div class="post-image-wrap">
          <div style="flex:1; min-width:0;">
            <a class="post-title" href="${item.link}" target="_blank">${item.title}</a>
            <div class="post-actions">
              <span>🔗 <a href="${item.link}" target="_blank" style="color:inherit;text-decoration:none">Ver en Reddit</a></span>
            </div>
          </div>
          ${thumb ? `<img class="post-thumbnail" src="${thumb}" alt="thumbnail" onerror="this.style.display='none'"/>` : ''}
        </div>
      </div>
    </div>
  `;
}

// Función principal usando la puerta trasera (RSS -> JSON)
// social.js - Versión optimizada para saltar bloqueos de Reddit

async function loadSubreddit() {
  const input = document.getElementById('subredditInput').value.trim();
  const sort = document.getElementById('sortSelect').value;
  const output = document.getElementById('output');
  const subreddit = input || 'programming';

  output.innerHTML = '<div class="loading">Conectando con Reddit...</div>';

  // Usamos una API de lectura (rss2json) que convierte el feed de Reddit 
  // en un formato JSON limpio que sí permite CORS.
  const rssUrl = `https://www.reddit.com/r/${subreddit}/${sort}.rss`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error('No se pudo obtener el contenido');
    }

    // Renderizamos el resultado
    output.innerHTML = `<h3>r/${subreddit} - ${sort}</h3>`;
    data.items.forEach(post => {
      output.insertAdjacentHTML('beforeend', `
        <div class="post-card">
          <h4>${post.title}</h4>
          <a href="${post.link}" target="_blank">Leer en Reddit</a>
        </div>
      `);
    });

  } catch (e) {
    output.innerHTML = `<div class="error">❌ No pudimos conectar con Reddit. Por favor, revisa el nombre del subreddit.</div>`;
  }
}

// Escuchador para el botón Buscar
document.getElementById('buscarBtn').addEventListener('click', loadSubreddit);

// --- ESCUCHADORES DE EVENTOS ---

document.getElementById('subredditInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') loadSubreddit();
});

document.getElementById('sortSelect').addEventListener('change', () => {
  loadSubreddit();
});

// Carga inicial automática
loadSubreddit();