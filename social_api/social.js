let after = null;
let currentSubreddit = 'programming';
let currentSort = 'hot';

const PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.org/?',
  'https://corsproxy.io/?',
];

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n;
}

function timeAgo(utc) {
  const diff = Math.floor((Date.now() / 1000) - utc);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function renderPost(post) {
  const d = post.data;
  const thumb = d.thumbnail && d.thumbnail.startsWith('http') ? d.thumbnail : null;
  const flair = d.link_flair_text ? `<span class="flair">${d.link_flair_text}</span><br>` : '';

  return `
    <div class="post-card">
      <div class="vote-col">
        ▲
        <span>${formatNum(d.score)}</span>
        ▼
      </div>
      <div class="post-body">
        <div class="post-meta">
          <a href="https://reddit.com/r/${d.subreddit}" target="_blank">r/${d.subreddit}</a>
          · u/${d.author} · ${timeAgo(d.created_utc)}
        </div>
        ${flair}
        <div class="post-image-wrap">
          <div style="flex:1">
            <a class="post-title" href="https://reddit.com${d.permalink}" target="_blank">${d.title}</a>
            <div class="post-actions">
              <span>💬 ${formatNum(d.num_comments)} comentarios</span>
              <span>🔗 <a href="${d.url}" target="_blank" style="color:inherit;text-decoration:none">Link</a></span>
              ${!d.is_self ? `<span style="color:#0079d3">↗ ${d.domain}</span>` : ''}
            </div>
          </div>
          ${thumb ? `<img class="post-thumbnail" src="${thumb}" alt="thumbnail" onerror="this.style.display='none'"/>` : ''}
        </div>
      </div>
    </div>
  `;
}

async function fetchWithFallback(redditUrl) {
  for (const proxy of PROXIES) {
    try {
      const url = proxy + encodeURIComponent(redditUrl);
      const res = await fetch(url);
      const text = await res.text();

      if (text.trim().startsWith('<')) continue;

      return JSON.parse(text);
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function loadSubreddit(loadMore = false) {
  const input = document.getElementById('subredditInput').value.trim();
  const sort = document.getElementById('sortSelect').value;
  const output = document.getElementById('output');

  if (!loadMore) {
    currentSubreddit = input;
    currentSort = sort;
    after = null;
    output.innerHTML = '<div class="loading">Cargando posts...</div>';
  }

  let redditUrl = `https://www.reddit.com/r/${currentSubreddit}/${currentSort}.json?limit=25`;
  if (after) redditUrl += `&after=${after}`;

  const json = await fetchWithFallback(redditUrl);

  if (!json) {
    const msg = '<div class="error">❌ No se pudo conectar con Reddit. Intenta de nuevo más tarde.</div>';
    if (!loadMore) output.innerHTML = msg;
    else output.innerHTML += msg;
    return;
  }

  const posts = json.data.children;
  after = json.data.after;

  if (!loadMore) {
    output.innerHTML = `
      <div class="subreddit-info">
        <strong>r/${currentSubreddit}</strong> · ${posts.length} posts · ordenado por <em>${currentSort}</em>
      </div>
    `;
  } else {
    document.getElementById('loadMoreBtn')?.remove();
  }

  posts.forEach(p => {
    output.innerHTML += renderPost(p);
  });

  if (after) {
    output.innerHTML += `<button class="load-more" id="loadMoreBtn" onclick="loadSubreddit(true)">Cargar más posts</button>`;
  }
}

document.getElementById('subredditInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') loadSubreddit();
});

loadSubreddit();