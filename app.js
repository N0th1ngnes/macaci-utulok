const shelterData = {
  cats: [],
  adoptions: [],
  veterinarians: [],
  inventory: [],
  stats: {cats:0, adoptions:0, vets:0, inventory:0}
};

const featuredRoot = document.querySelector('#featured-cats');
const catalogRoot = document.querySelector('#cat-grid');
const adoptionRoot = document.querySelector('#adoption-list');
const vetRoot = document.querySelector('#vet-grid');
const inventoryRoot = document.querySelector('#inventory-list');
const dialog = document.querySelector('#cat-dialog');
const dialogContent = document.querySelector('#dialog-content');
const toast = document.querySelector('#toast');
let toastTimer;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', {month:'short', day:'numeric', year:'numeric'}).format(date);
}

function imageUrl(type, id) {
  const prefix = type === 'vet' ? 'vet' : 'cat';
  const folder = prefix === 'vet' ? 'vets' : 'cats';
  const numericId = Number(id);
  const imageId = Number.isInteger(numericId) && numericId > 0 ? numericId : 4;
  return `/images/${folder}/${prefix}-${imageId}.jpg`;
}

function catCard(cat) {
  return `<article class="cat-card">
    <div class="cat-card-image"><img src="${cat.image}" onerror="this.onerror=null;this.src='${imageUrl('cat', 4)}'" alt="${escapeHtml(cat.name)}, an adoptable ${escapeHtml(cat.breed)}" loading="lazy"><span class="cat-badge">${escapeHtml(cat.tag)}</span><button class="favorite-btn" aria-label="Save ${escapeHtml(cat.name)} as a favorite" aria-pressed="false">♡</button></div>
    <div class="cat-card-body"><div class="cat-card-top"><h3>${escapeHtml(cat.name)}</h3><span class="cat-age">${escapeHtml(cat.ageLabel)}</span></div>
      <div class="cat-card-meta"><span class="meta-pill">${escapeHtml(cat.gender)}</span><span class="meta-pill">${escapeHtml(cat.breed)}</span></div>
      <div class="health-line"><span class="health-dot"></span>${escapeHtml(cat.health)}</div>
      <a class="card-link" href="#cat-${Number(cat.id)}" data-cat-id="${Number(cat.id)}" aria-label="View details about ${escapeHtml(cat.name)}">Get to know ${escapeHtml(cat.name)}<span aria-hidden="true">→</span></a>
    </div>
  </article>`;
}

function renderFeatured() {
  featuredRoot.innerHTML = shelterData.cats.slice(0, 3).map(cat => catCard(cat)).join('');
}

function renderCatalog() {
  const query = document.querySelector('#cat-search').value.trim().toLowerCase();
  const age = document.querySelector('#age-filter').value;
  const fit = document.querySelector('#fit-filter').value;
  const cats = shelterData.cats.filter(cat => {
    const textMatch = `${cat.name} ${cat.breed} ${cat.health} ${cat.character} ${cat.recommendations}`.toLowerCase().includes(query);
    const ageMatch = age === 'all' || (age === 'kitten' && cat.age < 1) || (age === 'young' && cat.age >= 1 && cat.age < 5) || (age === 'adult' && cat.age >= 5);
    const profile = `${cat.character} ${cat.recommendations}`.toLowerCase();
    const fitTerms = {quiet:['quiet','calm','peaceful','gentle'], family:['family','children','child','kids','busy home'], pets:['other pet','other cat','cat friend','cats','pets']};
    const fitMatch = fit === 'all' || fitTerms[fit].some(term => profile.includes(term));
    return textMatch && ageMatch && fitMatch;
  });
  catalogRoot.innerHTML = cats.map(cat => catCard(cat)).join('');
  document.querySelector('#result-count').textContent = `${cats.length} ${cats.length === 1 ? 'cat' : 'cats'}`;
  document.querySelector('#empty-state').hidden = cats.length > 0;
}

function renderAdoptions() {
  adoptionRoot.innerHTML = shelterData.adoptions.map(item => `<div class="adoption-row"><div class="adoption-avatar"><img src="${imageUrl('cat', item.catID)}" onerror="this.onerror=null;this.src='${imageUrl('cat', 4)}'" alt="" loading="lazy"></div><div class="adoption-info"><strong>${escapeHtml(item.cat)}</strong><span>${escapeHtml(item.person)}</span></div><span class="adoption-date">${escapeHtml(item.date)}</span></div>`).join('');
}

function renderVets() {
  vetRoot.innerHTML = shelterData.veterinarians.map(vet => `<article class="vet-card"><div class="vet-avatar"><img src="${imageUrl('vet', vet.id)}" onerror="this.onerror=null;this.src='${imageUrl('vet', 4)}'" alt="${escapeHtml(vet.name)}" loading="lazy"></div><span class="vet-specialty" aria-hidden="true">✳</span><h3>${escapeHtml(vet.name)}</h3><p class="vet-role">Shelter veterinarian</p><div class="vet-divider"></div><div class="vet-facts"><span><strong>${escapeHtml(vet.age)}</strong>years old</span><span><strong>${escapeHtml(vet.experience)}</strong>experience</span></div><p class="vet-patients"><strong>In their care:</strong> ${escapeHtml(vet.patients)}</p></article>`).join('');
}

function renderInventory() {
  inventoryRoot.innerHTML = `<div class="inventory-row inventory-head"><span>ITEM</span><span class="inventory-type">TYPE</span><span>ON HAND</span><span>UNIT</span><span>STATUS</span></div>` + shelterData.inventory.map(item => {
    const low = Number(item.quantity) <= 10;
    return `<div class="inventory-row"><span class="inventory-name"><span class="supply-icon" aria-hidden="true">◒</span>${escapeHtml(item.name)}</span><span class="inventory-type">${escapeHtml(item.type)}</span><span class="quantity">${escapeHtml(item.quantity)}</span><span>${escapeHtml(item.unit)}</span><span class="stock-status ${low ? 'low' : ''}">${low ? 'Running low' : 'In good shape'}</span></div>`;
  }).join('');
}

function openCat(id) {
  const cat = shelterData.cats.find(item => item.id === Number(id));
  if (!cat) return;
  dialogContent.innerHTML = `<div class="dialog-layout"><div class="dialog-photo"><img src="${cat.image}" onerror="this.onerror=null;this.src='${imageUrl('cat', 4)}'" alt="${escapeHtml(cat.name)}"></div><div class="dialog-info"><p class="eyebrow">A LITTLE ABOUT ME</p><h2 id="dialog-name">${escapeHtml(cat.name)}</h2><div class="cat-card-meta"><span class="meta-pill">${escapeHtml(cat.ageLabel)}</span><span class="meta-pill">${escapeHtml(cat.gender)}</span><span class="meta-pill">${escapeHtml(cat.breed)}</span></div><dl><div class="detail-list"><dt>Health</dt><dd>${escapeHtml(cat.health)}</dd></div><div class="detail-list"><dt>My character</dt><dd>${escapeHtml(cat.character)}</dd></div><div class="detail-list"><dt>My kind of home</dt><dd>${escapeHtml(cat.recommendations)}</dd></div><div class="detail-list"><dt>I arrived</dt><dd>${escapeHtml(cat.arrival)}</dd></div></dl><button class="button button-dark interest-button" data-interest="${Number(cat.id)}">Ask about ${escapeHtml(cat.name)} <span aria-hidden="true">↗</span></button></div></div>`;
  dialog.showModal();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

function toggleFavorite(button) {
  const active = button.classList.toggle('is-favorite');
  button.setAttribute('aria-pressed', String(active));
  button.textContent = active ? '♥' : '♡';
}

function renderShelter() {
  renderFeatured();
  renderCatalog();
  renderAdoptions();
  renderVets();
  renderInventory();
  document.querySelector('[data-stat="cats"]').textContent = shelterData.stats.cats;
  document.querySelector('[data-stat="adoptions"]').textContent = shelterData.stats.adoptions;
  document.querySelector('[data-stat="vets"]').textContent = shelterData.stats.vets;
  document.querySelector('[data-stat="inventory"]').textContent = shelterData.stats.inventory;
}

async function loadShelter() {
  try {
    const response = await fetch('/api/shelter');
    if (!response.ok) throw new Error(`Shelter API returned ${response.status}`);
    const data = await response.json();
    shelterData.cats = data.cats.map((cat, index) => ({
      ...cat,
      gender: cat.gender === 'female' ? 'Girl' : 'Boy',
      ageLabel: `${cat.age} ${Number(cat.age) === 1 ? 'year' : 'years'}`,
      character: cat.cat_character || '',
      arrival: formatDate(cat.arrival),
      image: imageUrl('cat', cat.id),
      tag: cat.breed || 'READY TO MEET YOU',
      featured: index < 3
    }));
    shelterData.adoptions = data.adoptions.map(item => ({
      ...item,
      cat: item.cat_name,
      person: `${item.first_name} ${item.last_name}`.trim(),
      date: formatDate(item.adoption_date)
    }));
    shelterData.veterinarians = data.veterinarians.map(vet => ({
      ...vet,
      experience: vet.work_duration,
      patients: vet.cats || 'Not listed'
    }));
    shelterData.inventory = data.inventory;
    shelterData.stats = data.stats;
    renderShelter();
  } catch (error) {
    console.error('Could not load shelter data:', error);
    showToast('Shelter data is unavailable. Check the server and database connection.');
  }
}

loadShelter();

document.querySelector('#cat-search').addEventListener('input', renderCatalog);
document.querySelector('#age-filter').addEventListener('change', renderCatalog);
document.querySelector('#fit-filter').addEventListener('change', renderCatalog);
document.addEventListener('click', event => {
  const catLink = event.target.closest('[data-cat-id]');
  if (catLink) {
    event.preventDefault();
    openCat(catLink.dataset.catId);
  }
  const favorite = event.target.closest('.favorite-btn');
  if (favorite) toggleFavorite(favorite);
  const interest = event.target.closest('[data-interest]');
  if (interest) {
    const cat = shelterData.cats.find(item => item.id === Number(interest.dataset.interest));
    dialog.close();
    if (cat) showToast(`Thanks for asking about ${cat.name}! Our adoption team will be in touch.`);
  }
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  nav.classList.toggle('is-open', !expanded);
});
nav.addEventListener('click', event => {
  if (event.target.closest('a')) {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
  }
});
const navLinks = [...document.querySelectorAll('.nav-link')];
const navSections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const active = navLinks.find(link => link.getAttribute('href') === `#${entry.target.id}`);
      if (active) {
        navLinks.forEach(link => link.classList.toggle('active', link === active));
      }
    }
  });
}, {rootMargin:'-28% 0px -63% 0px'});
navSections.forEach(section => sectionObserver.observe(section));
