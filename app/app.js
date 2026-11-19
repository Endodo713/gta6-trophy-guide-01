// GTA VI trophy guide & tracker: 55 trophies, checklist in localStorage,
// export/import, filters, spoiler mode, roadmap. Fully offline.
// URL params (for reproducible screenshots): ?filter=story|side|collectibles|
// activities|combat|money|missable|remaining, ?grade=, ?q=, ?trophy=<id> (detail),
// ?view=roadmap, ?demo=1 (pre-tick 14 trophies in memory only), ?spoiler=1, ?scroll=<px>.
const KEY = 'gta6-trophy-checklist-v1';
const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

const DEMO_IDS = new Set([2, 3, 5, 8, 15, 16, 20, 21, 33, 35, 44, 46, 52, 53]);
let earned = new Set();
try { earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]').filter((n) => trophies.some((t) => t.name === n))); } catch { earned = new Set(); }
if (params.get('demo') === '1') earned = new Set(trophies.filter((t) => DEMO_IDS.has(t.id)).map((t) => t.name));

const CAT_LABEL = { story: 'Story', side: 'Side missions', collectibles: 'Collectibles', activities: 'Activities', combat: 'Combat & heists', money: 'Money & misc', platinum: 'Platinum' };
const $ = (id) => document.getElementById(id);
const listEl = $('list'), detailEl = $('detail');
let filter = params.get('filter') || 'all';
let grade = params.get('grade') || 'all';
let query = params.get('q') || '';
let spoiler = params.get('spoiler') === '1';
let earnedOnly = false;

function save() { if (params.get('demo') !== '1') localStorage.setItem(KEY, JSON.stringify([...earned])); }

function visible(t) {
  if (grade !== 'all' && t.grade !== grade) return false;
  if (earnedOnly && !earned.has(t.name)) return false;
  if (filter === 'missable' && !t.missable) return false;
  if (filter === 'remaining' && earned.has(t.name)) return false;
  if (filter !== 'all' && filter !== 'missable' && filter !== 'remaining' && t.category !== filter) return false;
  if (query) {
    const hay = `${t.name} ${t.description} ${t.guide} ${t.source}`.toLowerCase();
    if (!hay.includes(query.toLowerCase())) return false;
  }
  return true;
}

function renderProgress() {
  const n = earned.size, total = trophies.length;
  const pct = Math.round((n / total) * 100);
  $('progressText').textContent = `${n} of ${total} earned — ${pct}%`;
  $('toPlat').textContent = n === total ? 'PLATINUM EARNED' : `${total - n} to platinum`;
  $('barFill').style.width = `${pct}%`;
  const counts = {};
  for (const t of trophies) { counts[t.grade] = counts[t.grade] || [0, 0]; counts[t.grade][1]++; if (earned.has(t.name)) counts[t.grade][0]++; }
  $('gradeChips').replaceChildren(...['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const c = document.createElement('span');
    c.className = 'chip';
    c.textContent = `${g}: ${counts[g][0]}/${counts[g][1]}`;
    return c;
  }));
}

function card(t) {
  const isEarned = earned.has(t.name);
  const hidden = spoiler && t.spoiler && !isEarned;
  const el = document.createElement('article');
  el.className = `card ${t.grade}${isEarned ? ' earned' : ''}`;
  el.id = `t-${t.id}`;
  const head = document.createElement('div');
  head.className = 'card-head';
  const box = document.createElement('input');
  box.type = 'checkbox'; box.checked = isEarned; box.setAttribute('aria-label', `Earned: ${t.name}`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name); else earned.delete(t.name);
    save(); render();
  });
  box.addEventListener('click', (e) => e.stopPropagation());
  const title = document.createElement('div');
  const h = document.createElement('h3');
  h.textContent = hidden ? 'Hidden story trophy — earn it to reveal' : t.name;
  const badges = document.createElement('div');
  const g = document.createElement('span'); g.className = `grade ${t.grade}`; g.textContent = t.grade;
  const c = document.createElement('span'); c.className = 'cat'; c.textContent = CAT_LABEL[t.category] || t.category;
  badges.append(g, c);
  if (t.missable) { const w = document.createElement('span'); w.className = 'warn'; w.textContent = '⚠ POSSIBLY MISSABLE'; badges.append(w); }
  if (isEarned) { const w = document.createElement('span'); w.className = 'warn'; w.style.background = '#c8e6c9'; w.style.color = '#1b5e20'; w.textContent = '✓ EARNED'; badges.append(w); }
  title.append(h, badges);
  head.append(box, title);
  el.append(head);
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = hidden ? 'Story details hidden by spoiler mode.' : `“${t.description}”`;
  el.append(desc);
  if (!hidden) {
    const guide = document.createElement('p');
    guide.className = 'guide'; guide.textContent = t.guide;
    const src = document.createElement('p');
    src.className = 'src';
    src.innerHTML = '';
    src.textContent = `Source: ${t.source}`;
    el.append(guide, src);
  } else {
    const m = document.createElement('p'); m.className = 'masked'; m.textContent = 'Guide hidden until earned (spoiler mode on).'; el.append(m);
  }
  el.addEventListener('click', () => showDetail(t));
  return el;
}

function showDetail(t) {
  detailEl.hidden = false;
  detailEl.replaceChildren();
  const h = document.createElement('h2'); h.textContent = t.name;
  const meta = document.createElement('p'); meta.className = 'meta';
  meta.textContent = `${t.grade.toUpperCase()}  ·  ${CAT_LABEL[t.category] || t.category}${t.missable ? '  ·  ⚠ POSSIBLY MISSABLE' : ''}  ·  Trophy ${t.id} of 55`;
  const d = document.createElement('p'); d.className = 'desc'; d.textContent = `“${t.description}”`;
  const g = document.createElement('p'); g.className = 'guide'; g.textContent = t.guide;
  const s = document.createElement('p'); s.className = 'src'; s.textContent = `Source: ${t.source}`;
  const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Close detail';
  close.addEventListener('click', () => { detailEl.hidden = true; });
  detailEl.append(h, meta, d, g, s, close);
}

function render() {
  renderProgress();
  const shown = trophies.filter(visible);
  listEl.replaceChildren();
  if (!shown.length) {
    const e = document.createElement('p'); e.className = 'empty'; e.textContent = 'No trophies match these filters. Clear the search or pick another filter.';
    listEl.append(e);
  } else {
    for (const t of shown) listEl.append(card(t));
  }
  $('countLine').textContent = `Showing ${shown.length} of 55`;
  document.querySelectorAll('#filters button').forEach((b) => b.classList.toggle('on', b.dataset.filter === filter));
  $('grade').value = grade;
  $('q').value = query;
  $('spoiler').checked = spoiler;
  $('earnedOnly').checked = earnedOnly;
}

// Controls
$('q').addEventListener('input', (e) => { query = e.target.value; render(); });
$('grade').addEventListener('change', (e) => { grade = e.target.value; render(); });
$('spoiler').addEventListener('change', (e) => { spoiler = e.target.checked; render(); });
$('earnedOnly').addEventListener('change', (e) => { earnedOnly = e.target.checked; render(); });
document.querySelectorAll('#filters button').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.filter; render(); }));
$('export').addEventListener('click', () => {
  const payload = { game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...earned] };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json'; a.click();
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    const valid = names.filter((n) => trophies.some((t) => t.name === n));
    if (!valid.length) throw new Error('no matching trophies');
    earned = new Set(valid); save(); render();
  } catch { alert('Import failed: that file is not a trophy-progress export from this guide.'); }
  e.target.value = '';
});
$('reset').addEventListener('click', () => {
  if (confirm('Clear all earned ticks?')) { earned = new Set(); save(); render(); }
});

if (params.get('filter') && params.get('filter') !== 'all') document.body.classList.add('focus-list');
// Deep-link params
const trophyId = Number(params.get('trophy'));
if (trophyId) {
  const t = trophies.find((x) => x.id === trophyId);
  if (t) {
    document.body.classList.add('focus-detail');
    showDetail(t);
    const el = document.getElementById(`t-${t.id}`);
    if (el) el.classList.add('hl');
  }
} else if (params.get('view') === 'roadmap') {
  document.body.classList.add('focus-roadmap');
} else if (params.get('scroll')) {
  setTimeout(() => window.scrollTo(0, Number(params.get('scroll'))), 50);
}
render();
