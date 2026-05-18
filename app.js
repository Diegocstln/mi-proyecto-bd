const apiBaseUrl = window.BOOKSNEXUS_API_BASE_URL || 'http://localhost:3000';

const state = {
  books: [],
  saved: new Set(),
  filter: 'all',
  minYear: 0,
  token: localStorage.getItem('booksnexus_token') || '',
  user: null,
  library: { reading: [], reviews: [], lists: [] },
  community: { stats: {}, recentReviews: [], popularBooks: [] },
};

const form = document.querySelector('#search-form');
const input = document.querySelector('#search-input');
const statusElement = document.querySelector('#status');
const grid = document.querySelector('#book-grid');
const resultCount = document.querySelector('#result-count');
const totalBooks = document.querySelector('#total-books');
const savedBooks = document.querySelector('#saved-books');
const rankingList = document.querySelector('#ranking-list');
const yearFilter = document.querySelector('#year-filter');
const yearValue = document.querySelector('#year-value');
const filterButtons = document.querySelectorAll('[data-filter]');
const navButtons = document.querySelectorAll('[data-view-target]');
const topbar = document.querySelector('.topbar');
const menuToggle = document.querySelector('.menu-toggle');
const authLinks = document.querySelectorAll('[data-auth-link]');
const profileName = document.querySelector('#profile-name');
const profileUsername = document.querySelector('#profile-username');
const profileEmail = document.querySelector('#profile-email');
const profileAvatar = document.querySelector('#profile-avatar');
const profileStatus = document.querySelector('#profile-status');
const profileFavoritesCount = document.querySelector('#profile-favorites-count');
const profileStatsFavorites = document.querySelector('#profile-stats-favorites');
const profileLastFavorite = document.querySelector('#profile-last-favorite');
const profileLists = document.querySelector('#profile-lists');
const profileReading = document.querySelector('#profile-reading');
const profileFollowers = document.querySelector('#profile-followers');
const profileFollowing = document.querySelector('#profile-following');
const profileView = document.querySelector('#view-perfil');
const profileLock = document.querySelector('#profile-lock');
const communityReviewCount = document.querySelector('#community-review-count');
const communityReaderCount = document.querySelector('#community-reader-count');
const communityReviews = document.querySelector('#community-reviews');
const readerList = document.querySelector('#reader-list');
const communityReaderSearch = document.querySelector('#reader-search');
const logoutButton = document.querySelector('#logout-button');
const detailDialog = document.querySelector('#book-detail-dialog');
const detailTitle = document.querySelector('#detail-title');
const detailBody = document.querySelector('#detail-body');
const detailClose = document.querySelector('#detail-close');
const actionDialog = document.querySelector('#action-dialog');
const actionForm = document.querySelector('#action-form');
const actionTitle = document.querySelector('#action-title');
const actionBody = document.querySelector('#action-body');
const actionPrimary = document.querySelector('#action-primary');
const actionCancel = document.querySelector('#action-cancel');
const actionSecondary = document.querySelector('#action-secondary');
const toastStack = document.querySelector('#toast-stack');
let searchTimer = 0;
let readerSearchTimer = 0;
let activeActionResolver = null;
const readerDialog = document.querySelector('#reader-dialog');
const readerTitle = document.querySelector('#reader-title');
const readerBody = document.querySelector('#reader-body');
const readerClose = document.querySelector('#reader-close');

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
}

function setProfileStatus(message, isError = false) {
  profileStatus.textContent = message;
  profileStatus.classList.toggle('error', isError);
}

function showNotice(message, type = 'info', title = '') {
  const defaults = {
    info: 'Listo',
    success: 'Listo',
    error: 'Algo no salio bien',
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}" aria-hidden="true"></i>
    <div>
      <strong>${escapeHtml(title || defaults[type] || defaults.info)}</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
  toastStack.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add('leaving');
    window.setTimeout(() => toast.remove(), 220);
  }, 3200);
}

function translateError(message) {
  const translations = {
    'Username and password are required': 'Escribe tu usuario y contrasena.',
    'Invalid username or password': 'Usuario o contrasena incorrectos.',
    'Email and password are required': 'Escribe tu correo y contrasena.',
    'Invalid email or password': 'Correo o contrasena incorrectos.',
    'Username or email already exists': 'Ese usuario o correo ya existe.',
    'Name must be at least 2 characters': 'El nombre debe tener al menos 2 caracteres.',
    'Username must be 3-40 characters and use letters, numbers or underscore': 'El usuario debe tener entre 3 y 40 caracteres, solo letras, numeros o guion bajo.',
    'A valid email is required': 'Escribe un correo valido.',
    'Password must be at least 8 characters': 'La contrasena debe tener al menos 8 caracteres.',
    'You cannot follow yourself': 'No puedes seguirte a ti mismo.',
    'Invalid reading status': 'El estado de lectura no es valido.',
    'Rating must be an integer between 1 and 5': 'La calificacion debe ser de 1 a 5.',
    'Review comment must be at least 3 characters': 'La resena necesita al menos 3 caracteres.',
    'List name must be at least 2 characters': 'El nombre de la lista necesita al menos 2 caracteres.',
    'Invalid privacy value': 'La privacidad de la lista no es valida.',
  };

  return translations[message] || message || 'No se pudo completar la accion.';
}

function openActionDialog({ title, body, primaryLabel = 'Guardar' }) {
  actionTitle.textContent = title;
  actionBody.innerHTML = body;
  actionPrimary.textContent = primaryLabel;
  actionForm.reset();
  actionDialog.showModal();

  return new Promise((resolve) => {
    activeActionResolver = resolve;
  });
}

function closeActionDialog(value = null) {
  actionDialog.close();

  if (activeActionResolver) {
    activeActionResolver(value);
    activeActionResolver = null;
  }
}

function formatAuthors(authors) {
  if (!authors || authors.length === 0) {
    return 'Autor desconocido';
  }

  return authors.slice(0, 3).join(', ');
}

function getInitials(title) {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });
}

function normalizeBook(book, index) {
  const title = book.title || 'Titulo no disponible';
  const firstPublishYear = Number(book.firstPublishYear) || 0;
  const id = String(book.openLibraryKey || book.id || book.key || `book-${index}`);

  return {
    id,
    workKey: id.replace('/works/', ''),
    title,
    authors: book.authors || [],
    firstPublishYear,
    coverUrl: book.coverUrl || '',
  };
}

function getFilteredBooks() {
  return state.books.filter((book) => {
    const matchesSaved = state.filter === 'all' || state.saved.has(String(book.id));
    const matchesYear = !state.minYear || book.firstPublishYear >= state.minYear;

    return matchesSaved && matchesYear;
  });
}

function persistSavedBooks() {
  localStorage.setItem('booksnexus_saved', JSON.stringify([...state.saved]));
}

function updateMetrics(books) {
  totalBooks.textContent = String(books.length);
  savedBooks.textContent = String(state.saved.size);
  resultCount.textContent = `${books.length} ${books.length === 1 ? 'libro' : 'libros'}`;
  profileFavoritesCount.textContent = `${state.saved.size} ${state.saved.size === 1 ? 'libro' : 'libros'}`;
  profileStatsFavorites.textContent = String(state.saved.size);
}

function renderCover(book) {
  if (book.coverUrl) {
    return `<img class="book-cover" src="${escapeHtml(book.coverUrl)}" alt="Portada de ${escapeHtml(book.title)}" loading="lazy" />`;
  }

  return `<div class="book-cover placeholder" aria-hidden="true">${escapeHtml(getInitials(book.title))}</div>`;
}

function renderBooks() {
  const books = getFilteredBooks();
  updateMetrics(books);

  if (!books.length) {
    grid.innerHTML = `
      <article class="book-card empty-card">
        <div class="book-content">
          <h3>No hay resultados todavia</h3>
          <p>Busca por titulo o autor para consultar libros desde la API.</p>
        </div>
      </article>
    `;
    renderRanking();
    return;
  }

  grid.innerHTML = books
    .map((book) => {
      const isSaved = state.saved.has(String(book.id));
      const author = escapeHtml(formatAuthors(book.authors));
      const title = escapeHtml(book.title);
      const year = escapeHtml(book.firstPublishYear || 'Fecha no disponible');
      const bookId = escapeHtml(book.id);

      return `
        <article class="book-card">
          ${renderCover(book)}
          <div class="book-content">
            <span class="book-meta">${author}</span>
            <h3>${title}</h3>
            <div class="tag-row">
              <span class="tag">${year}</span>
              <span class="tag">${isSaved ? 'Guardado' : 'Catalogo'}</span>
            </div>
            <p>Resultado conectado al catalogo externo de BooksNexus.</p>
          </div>
          <div class="book-actions">
            <button class="book-action ${isSaved ? 'saved' : ''}" type="button" data-save="${bookId}">
              <i class="fa-solid ${isSaved ? 'fa-check' : 'fa-plus'}" aria-hidden="true"></i>
              <span>${isSaved ? 'Quitar' : 'Favorito'}</span>
            </button>
            <button class="book-action" type="button" data-reading="${bookId}">
              <i class="fa-solid fa-book-open" aria-hidden="true"></i>
              <span>Leyendo</span>
            </button>
            <button class="book-action compact" type="button" data-detail="${bookId}" aria-label="Ver detalle de ${title}" title="Ver detalle">
              <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
              <span>Detalle</span>
            </button>
            <button class="book-action compact" type="button" data-review="${bookId}">
              <i class="fa-solid fa-star" aria-hidden="true"></i>
              <span>Resena</span>
            </button>
            <button class="book-action compact" type="button" data-list-book="${bookId}">
              <i class="fa-solid fa-list" aria-hidden="true"></i>
              <span>Lista</span>
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  renderRanking();
}

function renderRanking() {
  const rankedBooks = [...state.books]
    .filter((book) => book.firstPublishYear)
    .sort((first, second) => second.firstPublishYear - first.firstPublishYear)
    .slice(0, 5);

  rankingList.innerHTML = rankedBooks.length
    ? rankedBooks
        .map((book) => `<li><strong>${escapeHtml(book.title)}</strong><br><span>${escapeHtml(formatAuthors(book.authors))} - ${book.firstPublishYear}</span></li>`)
        .join('')
    : '<li><strong>Sin busquedas todavia</strong><br><span>El ranking se llena con los resultados consultados.</span></li>';
}

async function searchBooks(query) {
  const response = await fetch(`${apiBaseUrl}/api/books/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error('No se pudo consultar el backend');
  }

  return response.json();
}

async function getBookDetail(workKey) {
  const response = await fetch(`${apiBaseUrl}/api/books/${encodeURIComponent(workKey)}`);

  if (!response.ok) {
    throw new Error('No se pudo cargar el detalle');
  }

  return response.json();
}

async function getCurrentUser() {
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Sesion no valida');
  }

  return response.json();
}

async function getFavorites() {
  const response = await fetch(`${apiBaseUrl}/api/favorites`, {
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudieron cargar los favoritos');
  }

  return response.json();
}

async function getLibrary() {
  const response = await fetch(`${apiBaseUrl}/api/library/me`, {
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo cargar la biblioteca');
  }

  return response.json();
}

async function getCommunity() {
  const response = await fetch(`${apiBaseUrl}/api/library/community`);

  if (!response.ok) {
    throw new Error('No se pudo cargar comunidad');
  }

  return response.json();
}

async function searchReaders(query = '') {
  const response = await fetch(`${apiBaseUrl}/api/library/users?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar lectores');
  }

  return response.json();
}

async function getReaderProfile(idUsuario) {
  const headers = state.token ? { Authorization: `Bearer ${state.token}` } : {};
  const response = await fetch(`${apiBaseUrl}/api/library/users/${idUsuario}`, { headers });

  if (!response.ok) {
    throw new Error('No se pudo cargar el perfil');
  }

  return response.json();
}

async function followReader(idUsuario, isFollowing) {
  const response = await fetch(`${apiBaseUrl}/api/library/users/${idUsuario}/follow`, {
    method: isFollowing ? 'DELETE' : 'POST',
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo actualizar el seguimiento');
  }

  return response.json();
}

async function saveFavorite(book) {
  const response = await fetch(`${apiBaseUrl}/api/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify({
      openLibraryKey: book.id,
      title: book.title,
      authors: book.authors,
      firstPublishYear: book.firstPublishYear || null,
      coverUrl: book.coverUrl || null,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo guardar el favorito');
  }

  return response.json();
}

async function removeFavorite(book) {
  const response = await fetch(`${apiBaseUrl}/api/favorites/${encodeURIComponent(book.workKey)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo quitar el favorito');
  }

  return response.json();
}

async function markReading(book, estadoLectura = 'leyendo') {
  const response = await fetch(`${apiBaseUrl}/api/library/reading`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify({
      estadoLectura,
      book: {
        openLibraryKey: book.id,
        title: book.title,
        authors: book.authors,
        firstPublishYear: book.firstPublishYear || null,
        coverUrl: book.coverUrl || null,
      },
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo guardar el historial');
  }

  return response.json();
}

async function saveReview(book, comentario, calificacion) {
  const response = await fetch(`${apiBaseUrl}/api/library/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify({
      comentario,
      calificacion,
      book: {
        openLibraryKey: book.id,
        title: book.title,
        authors: book.authors,
        firstPublishYear: book.firstPublishYear || null,
        coverUrl: book.coverUrl || null,
      },
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo guardar la resena');
  }

  return response.json();
}

async function createList(nombreLista) {
  const response = await fetch(`${apiBaseUrl}/api/library/lists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify({ nombreLista, privacidad: 'publica' }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo crear la lista');
  }

  return response.json();
}

async function addBookToList(idLista, book) {
  const response = await fetch(`${apiBaseUrl}/api/library/lists/${idLista}/books`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify({
      book: {
        openLibraryKey: book.id,
        title: book.title,
        authors: book.authors,
        firstPublishYear: book.firstPublishYear || null,
        coverUrl: book.coverUrl || null,
      },
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo agregar el libro a la lista');
  }

  return response.json();
}

function syncSavedFromFavorites(favorites) {
  state.saved = new Set((favorites || []).map((book) => String(book.openLibraryKey)));
  const lastFavorite = favorites?.[0];

  profileLastFavorite.textContent = lastFavorite ? 'Favorito reciente' : 'Sin actividad';
  profileLastFavorite.parentElement.lastChild.textContent = lastFavorite
    ? ` ${lastFavorite.title}`
    : ' Guarda un libro para verlo aqui.';

  persistSavedBooks();
}

function renderPeopleList(people, emptyText) {
  return people?.length
    ? people
        .map((person) => `
          <div class="list-card">
            <span>@${escapeHtml(person.username)}</span>
            <strong>${escapeHtml(person.nombre)}</strong>
          </div>
        `)
        .join('')
    : `<p class="status">${emptyText}</p>`;
}

function formatCount(value, singular, plural) {
  const number = Number(value) || 0;
  return `${number} ${number === 1 ? singular : plural}`;
}

function renderReaderMeta(user) {
  if ('total_resenas' in user || 'total_favoritos' in user) {
    return `${formatCount(user.total_resenas, 'resena', 'resenas')} &middot; ${formatCount(user.total_favoritos, 'favorito', 'favoritos')}`;
  }

  return `${formatCount(user.public_lists, 'lista publica', 'listas publicas')} &middot; ${formatCount(user.followers, 'seguidor', 'seguidores')}`;
}

function renderLibrary() {
  const lists = state.library.lists || [];
  const reading = state.library.reading || [];
  const followers = state.library.followers || [];
  const following = state.library.following || [];

  profileLists.innerHTML = lists.length
    ? lists
        .map((list) => `
          <div class="list-card">
            <span>${escapeHtml(list.nombre_lista)}</span>
            <strong>${list.total_libros} ${list.total_libros === 1 ? 'libro' : 'libros'}</strong>
          </div>
        `)
        .join('')
    : '<div class="list-card"><span>Sin listas todavia</span><strong>0 libros</strong></div>';

  profileReading.innerHTML = reading.length
    ? reading
        .slice(0, 4)
        .map((item) => `
          <div class="timeline-item">
            <span class="dot"></span>
            <p><strong>${escapeHtml(item.estado_lectura)}</strong> ${escapeHtml(item.titulo)}</p>
          </div>
        `)
        .join('')
    : '';
  profileFollowers.innerHTML = renderPeopleList(followers, 'Todavia nadie te sigue.');
  profileFollowing.innerHTML = renderPeopleList(following, 'Todavia no sigues a ningun lector.');
}

function renderCommunity() {
  const stats = state.community.stats || {};
  const reviews = state.community.recentReviews || [];
  const popularBooks = state.community.popularBooks || [];
  const activeUsers = state.community.activeUsers || [];

  communityReviewCount.textContent = String(stats.total_resenas || 0);
  communityReaderCount.textContent = String(stats.lectores_activos || 0);
  communityReviews.innerHTML = reviews.length
    ? reviews
        .map((review) => `
          <div class="review">
            <strong>${escapeHtml(review.nombre || review.username)}</strong>
            <span>califico "${escapeHtml(review.titulo)}" con ${escapeHtml(review.calificacion)} estrellas</span>
            <p>${escapeHtml(review.comentario)}</p>
          </div>
        `)
        .join('')
    : `
      <div class="review">
        <strong>Sin resenas todavia</strong>
        <span>Las publicaciones apareceran cuando alguien resene un libro.</span>
        <p>Busca un libro, inicia sesion y usa el boton de estrella para crear la primera.</p>
      </div>
    `;

  rankingList.innerHTML = popularBooks.length
    ? popularBooks
        .map((book) => `
          <li>
            <strong>${escapeHtml(book.titulo)}</strong><br>
            <span>${book.total_resenas} resenas · ${book.total_favoritos} favoritos</span>
          </li>
        `)
        .join('')
    : rankingList.innerHTML;

  readerList.innerHTML = activeUsers.length
    ? activeUsers
        .map((user) => `
          <li>
            <strong>@${escapeHtml(user.username)}</strong><br>
            <span>${escapeHtml(user.nombre)} · ${user.total_resenas} resenas · ${user.total_favoritos} favoritos</span><br>
            <button class="ghost-button" type="button" data-reader="${user.id_usuario}">Ver perfil</button>
          </li>
        `)
        .join('')
    : '<li><strong>Sin lectores todavia</strong><br><span>Crea usuarios y actividad para llenar esta lista.</span></li>';

  renderReaders(activeUsers, 'Crea usuarios y actividad para llenar esta lista.');
}

function renderReaders(users, emptyText = 'No encontramos lectores con esa busqueda.') {
  readerList.innerHTML = users.length
    ? users
        .map((user) => `
          <li>
            <strong>@${escapeHtml(user.username)}</strong><br>
            <span>${escapeHtml(user.nombre)} &middot; ${renderReaderMeta(user)}</span><br>
            <button class="ghost-button" type="button" data-reader="${user.id_usuario}">Ver perfil</button>
          </li>
        `)
        .join('')
    : `<li><strong>Sin lectores todavia</strong><br><span>${escapeHtml(emptyText)}</span></li>`;
}

async function refreshLibrary() {
  if (!state.token) {
    state.library = { reading: [], reviews: [], lists: [] };
    renderLibrary();
    return;
  }

  const result = await getLibrary();
  state.library = result.data || { reading: [], reviews: [], lists: [] };
  renderLibrary();
}

async function refreshCommunity() {
  try {
    const result = await getCommunity();
    state.community = result.data || { stats: {}, recentReviews: [], popularBooks: [] };
    renderCommunity();
  } catch (error) {
    renderCommunity();
  }
}

async function performReaderSearch() {
  const query = communityReaderSearch?.value.trim() || '';

  try {
    const result = await searchReaders(query);
    renderReaders(result.data || [], query ? 'Prueba con otro usuario o nombre.' : 'Crea usuarios y actividad para llenar esta lista.');
  } catch (error) {
    renderReaders([], 'No se pudo consultar lectores ahora mismo.');
    showNotice('Revisa que el backend este encendido antes de buscar lectores.', 'error', 'Lectores no disponibles');
  }
}

function renderReaderProfile(profile) {
  const data = profile.data;
  const user = data.user;
  const lists = data.lists || [];
  const reading = data.reading || [];
  const reviews = data.reviews || [];
  const followers = data.followers || [];
  const following = data.following || [];
  const canFollow = state.user && state.user.id_usuario !== user.id_usuario;

  readerTitle.textContent = `@${user.username}`;
  readerBody.innerHTML = `
    <p><strong>${escapeHtml(user.nombre)}</strong></p>
    <p>${user.followers} seguidores · ${user.following} siguiendo</p>
    ${canFollow ? `
      <button class="ghost-button" type="button" data-follow-reader="${user.id_usuario}" data-following="${user.is_following}">
        ${user.is_following ? 'Dejar de seguir' : 'Seguir'}
      </button>
    ` : ''}
    <h3>Le siguen</h3>
    ${renderPeopleList(followers, 'Todavia no tiene seguidores.')}
    <h3>Sigue a</h3>
    ${renderPeopleList(following, 'Todavia no sigue a otros lectores.')}
    <h3>Listas publicas</h3>
    ${lists.length ? lists.map((list) => `
      <div class="list-card">
        <span>${escapeHtml(list.nombre_lista)}</span>
        <strong>${list.books.length} ${list.books.length === 1 ? 'libro' : 'libros'}</strong>
      </div>
    `).join('') : '<p class="status">Este usuario no tiene listas publicas.</p>'}
    <h3>Lectura reciente</h3>
    ${reading.length ? reading.map((item) => `<p><strong>${escapeHtml(item.estado_lectura)}</strong> ${escapeHtml(item.titulo)}</p>`).join('') : '<p class="status">Sin historial publico.</p>'}
    <h3>Resenas</h3>
    ${reviews.length ? reviews.map((review) => `<p><strong>${review.calificacion}/5</strong> ${escapeHtml(review.titulo)}: ${escapeHtml(review.comentario)}</p>`).join('') : '<p class="status">Sin resenas.</p>'}
  `;
}

function renderReaderProfileCard(profile) {
  const data = profile.data;
  const user = data.user;
  const lists = data.lists || [];
  const reading = data.reading || [];
  const reviews = data.reviews || [];
  const followers = data.followers || [];
  const following = data.following || [];
  const canFollow = state.user && state.user.id_usuario !== user.id_usuario;

  readerTitle.textContent = `${user.nombre || user.username}`;
  readerBody.innerHTML = `
    <div class="reader-profile">
      <section class="reader-hero">
        <div class="reader-avatar" aria-hidden="true">${escapeHtml(getInitialsFromUser(user))}</div>
        <div>
          <h3>${escapeHtml(user.nombre || user.username)}</h3>
          <p>@${escapeHtml(user.username)}${user.biografia ? ` &middot; ${escapeHtml(user.biografia)}` : ''}</p>
        </div>
        ${canFollow ? `
          <button class="ghost-button ${user.is_following ? 'saved' : ''}" type="button" data-follow-reader="${user.id_usuario}" data-following="${user.is_following}">
            <i class="fa-solid ${user.is_following ? 'fa-user-check' : 'fa-user-plus'}" aria-hidden="true"></i>
            <span>${user.is_following ? 'Siguiendo' : 'Seguir'}</span>
          </button>
        ` : ''}
      </section>

      <section class="profile-stat-row" aria-label="Actividad publica">
        <div><strong>${formatCount(user.followers, 'seguidor', 'seguidores')}</strong><span>Le siguen</span></div>
        <div><strong>${formatCount(user.following, 'siguiendo', 'siguiendo')}</strong><span>Sigue</span></div>
        <div><strong>${formatCount(lists.length, 'lista', 'listas')}</strong><span>Publicas</span></div>
      </section>

      <section class="reader-section">
        <h3>Listas publicas</h3>
        ${lists.length ? lists.map((list) => `
          <div class="list-card">
            <span>${escapeHtml(list.nombre_lista)}</span>
            <strong>${formatCount(list.books.length, 'libro', 'libros')}</strong>
          </div>
        `).join('') : '<p class="status">Este lector aun no tiene listas publicas.</p>'}
      </section>

      <section class="reader-section">
        <h3>Lectura reciente</h3>
        <div class="reader-book-list">
          ${reading.length ? reading.map((item) => `
            <div class="reader-book-item">
              <strong>${escapeHtml(item.titulo)}</strong>
              <span class="tag">${escapeHtml(item.estado_lectura)}</span>
            </div>
          `).join('') : '<p class="status">Sin historial publico por ahora.</p>'}
        </div>
      </section>

      <section class="reader-section">
        <h3>Resenas</h3>
        <div class="reader-book-list">
          ${reviews.length ? reviews.map((review) => `
            <div class="review">
              <strong>${escapeHtml(review.titulo)}</strong>
              <span>${escapeHtml(review.calificacion)}/5 estrellas</span>
              <p>${escapeHtml(review.comentario)}</p>
            </div>
          `).join('') : '<p class="status">Todavia no ha publicado resenas.</p>'}
        </div>
      </section>

      <section class="reader-section">
        <h3>Red lectora</h3>
        <div>${renderPeopleList(followers, 'Todavia no tiene seguidores.')}</div>
        <div>${renderPeopleList(following, 'Todavia no sigue a otros lectores.')}</div>
      </section>
    </div>
  `;
}

function getInitialsFromUser(user) {
  const source = user?.nombre || user?.username || 'BN';

  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function renderAuthState() {
  const isLoggedIn = Boolean(state.user);

  authLinks.forEach((link) => {
    const label = link.querySelector('span');
    const icon = link.querySelector('i');

    link.href = isLoggedIn ? '#view-perfil' : 'src/login/login.html';
    label.textContent = isLoggedIn ? state.user.username : 'Entrar';
    icon.className = `fa-solid ${isLoggedIn ? 'fa-user-check' : 'fa-right-to-bracket'}`;
  });

  if (!state.user) {
    profileName.textContent = 'Mi perfil';
    profileUsername.textContent = 'Inicia sesion para ver tus datos reales.';
    profileEmail.textContent = 'Sin sesion activa';
    profileAvatar.textContent = 'BN';
    logoutButton.hidden = true;
    profileView.classList.add('locked');
    profileLock.hidden = false;
    setProfileStatus('Tu biblioteca se desbloquea cuando inicias sesion.');
    return;
  }

  profileName.textContent = state.user.nombre || state.user.username;
  profileUsername.textContent = `@${state.user.username}`;
  profileEmail.textContent = state.user.correo;
  profileAvatar.textContent = getInitialsFromUser(state.user);
  logoutButton.hidden = false;
  profileView.classList.remove('locked');
  profileLock.hidden = true;
  setProfileStatus('Sesion activa. Tu biblioteca esta sincronizada.');
}

async function hydrateUser() {
  if (!state.token) {
    state.saved = new Set(JSON.parse(localStorage.getItem('booksnexus_saved') || '[]'));
    renderAuthState();
    renderBooks();
    return;
  }

  try {
    const result = await getCurrentUser();
    state.user = result.user;
    const favorites = await getFavorites();
    syncSavedFromFavorites(favorites.data || []);
    await refreshLibrary();
  } catch (error) {
    state.token = '';
    state.saved = new Set(JSON.parse(localStorage.getItem('booksnexus_saved') || '[]'));
    localStorage.removeItem('booksnexus_token');
  }

  renderAuthState();
  renderBooks();
}

function setActiveView(viewName) {
  document.querySelectorAll('[data-view]').forEach((view) => {
    const isActive = view.dataset.view === viewName;
    view.hidden = !isActive;
    view.classList.toggle('active', isActive);
  });

  navButtons.forEach((button) => {
    const isActive = button.dataset.viewTarget === viewName;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  topbar.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

function bindNavigation() {
  navButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveView(button.dataset.viewTarget));
  });

  authLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!state.user) {
        return;
      }

      event.preventDefault();
      setActiveView('perfil');
    });
  });

  menuToggle.addEventListener('click', () => {
    const isOpen = topbar.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

function initializeViewFromHash() {
  const viewName = window.location.hash.replace('#view-', '');

  if (viewName && document.querySelector(`[data-view="${viewName}"]`)) {
    setActiveView(viewName);
  }
}

async function performSearch() {
  const query = input.value.trim();
  const button = form.querySelector('button');

  window.clearTimeout(searchTimer);

  if (!query) {
    state.books = [];
    renderBooks();
    setStatus('Escribe al menos 3 letras para buscar automaticamente.');
    return;
  }

  if (query.length < 3) {
    setStatus('Escribe al menos 3 letras para iniciar la busqueda.');
    return;
  }

  button.disabled = true;
  setStatus('Buscando libros...');

  try {
    const result = await searchBooks(query);
    state.books = (result.data || []).map(normalizeBook);
    renderBooks();
    setStatus('Busqueda lista.');
  } catch (error) {
    state.books = [];
    renderBooks();
    setStatus('No se pudo conectar con BooksNexus. Revisa que el servicio este encendido.', true);
    showNotice('Revisa que el backend este encendido en el puerto configurado.', 'error', 'BooksNexus no responde');
  } finally {
    button.disabled = false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  performSearch();
});

input.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(performSearch, 450);
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    state.filter = button.dataset.filter;
    renderBooks();
  });
});

yearFilter.addEventListener('input', (event) => {
  state.minYear = Number(event.target.value);
  yearValue.textContent = state.minYear ? `Desde ${state.minYear}` : 'Cualquier ano';
  renderBooks();
});

communityReaderSearch?.addEventListener('input', () => {
  window.clearTimeout(readerSearchTimer);
  readerSearchTimer = window.setTimeout(performReaderSearch, 350);
});

grid.addEventListener('click', async (event) => {
  const detailButton = event.target.closest('[data-detail]');

  if (detailButton) {
    const book = state.books.find((item) => item.id === detailButton.dataset.detail);

    if (!book) {
      return;
    }

    detailTitle.textContent = book.title;
    detailBody.innerHTML = '<p class="status">Cargando detalle desde BooksNexus...</p>';
    detailDialog.showModal();

    getBookDetail(book.workKey)
      .then((result) => {
        const detail = result.data || {};
        const description = detail.description || 'El catalogo no tiene descripcion para este libro.';
        const subjects = (detail.subjects || []).slice(0, 8);

        detailBody.innerHTML = `
          <p>${escapeHtml(description)}</p>
          <div class="tag-row">
            <span class="tag">${escapeHtml(detail.firstPublishDate || book.firstPublishYear || 'Fecha no disponible')}</span>
            ${subjects.map((subject) => `<span class="tag">${escapeHtml(subject)}</span>`).join('')}
          </div>
        `;
      })
      .catch(() => {
        detailBody.innerHTML = '<p class="status error">No se pudo cargar el detalle. Revisa que el servicio este encendido.</p>';
      });

    return;
  }

  const button = event.target.closest('[data-save]');

  const readingButton = event.target.closest('[data-reading]');
  const reviewButton = event.target.closest('[data-review]');
  const listButton = event.target.closest('[data-list-book]');

  if (!button && !readingButton && !reviewButton && !listButton) {
    return;
  }

  const bookId = String(
    button?.dataset.save || readingButton?.dataset.reading || reviewButton?.dataset.review || listButton?.dataset.listBook
  );
  const book = state.books.find((item) => item.id === bookId);

  if (!book) {
    return;
  }

  if (!state.user || !state.token) {
    setStatus('Inicia sesion para actualizar tu biblioteca.', true);
    showNotice('Entra a tu cuenta para guardar favoritos, lecturas, resenas y listas.', 'error', 'Necesitas sesion');
    setActiveView('perfil');
    return;
  }

  const actionButton = button || readingButton || reviewButton || listButton;
  actionButton.disabled = true;

  try {
    if (readingButton) {
      await markReading(book, 'leyendo');
      await refreshLibrary();
      setStatus('Libro marcado como leyendo.');
      showNotice(`"${book.title}" aparece ahora en tu historial.`, 'success', 'Lectura actualizada');
      return;
    }

    if (reviewButton) {
      const reviewData = await openActionDialog({
        title: `Resenar "${book.title}"`,
        body: `
          <label>
            Tu resena
            <textarea name="comentario" rows="4" placeholder="Que te parecio este libro?" required></textarea>
          </label>
          <label>
            Calificacion
            <select name="calificacion" required>
              <option value="5">5 estrellas</option>
              <option value="4">4 estrellas</option>
              <option value="3">3 estrellas</option>
              <option value="2">2 estrellas</option>
              <option value="1">1 estrella</option>
            </select>
          </label>
        `,
        primaryLabel: 'Guardar resena',
      });

      if (!reviewData) {
        setStatus('Resena cancelada.');
        return;
      }

      await saveReview(book, reviewData.comentario, Number(reviewData.calificacion));
      await refreshLibrary();
      await refreshCommunity();
      setStatus('Resena guardada en tu cuenta.');
      showNotice(`Tu resena de "${book.title}" ya se ve en comunidad.`, 'success', 'Resena publicada');
      return;
    }

    if (listButton) {
      let list = null;
      const lists = state.library.lists || [];

      if (lists.length) {
        const listData = await openActionDialog({
          title: `Guardar "${book.title}"`,
          body: `
            <p class="dialog-intro">Elige una lista existente o crea una nueva sin salir del libro.</p>
            <div class="list-picker" role="radiogroup" aria-label="Listas disponibles">
              ${lists.map((item, index) => `
                <label class="list-option">
                  <input type="radio" name="idLista" value="${item.id_lista}" ${index === 0 ? 'checked' : ''} />
                  <span>
                    <strong>${escapeHtml(item.nombre_lista)}</strong>
                    <span>${formatCount(item.total_libros, 'libro guardado', 'libros guardados')}</span>
                  </span>
                  <i class="fa-solid fa-bookmark" aria-hidden="true"></i>
                </label>
              `).join('')}
              <label class="list-option">
                <input type="radio" name="idLista" value="new" />
                <span>
                  <strong>Crear lista nueva</strong>
                  <span>Perfecto para separar pendientes, favoritos o recomendaciones.</span>
                </span>
                <i class="fa-solid fa-plus" aria-hidden="true"></i>
              </label>
            </div>
            <label>
              Nombre si vas a crear una nueva
              <input name="nombreLista" type="text" placeholder="Lecturas para vacaciones" />
            </label>
            <span class="inline-note"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Si eliges una lista existente puedes dejar el nombre vacio.</span>
          `,
          primaryLabel: 'Guardar en lista',
        });

        if (!listData) {
          setStatus('Lista cancelada.');
          return;
        }

        if (listData.idLista !== 'new') {
          list = lists.find((item) => String(item.id_lista) === String(listData.idLista));
        } else if (listData.nombreLista?.trim()) {
          const created = await createList(listData.nombreLista.trim());
          list = created.data;
        } else {
          setStatus('Ponle nombre a tu lista nueva.', true);
          showNotice('Escribe un nombre para crear la lista y guardar el libro.', 'error', 'Falta el nombre');
          return;
        }
      }

      if (!list) {
        const listData = await openActionDialog({
          title: `Primera lista para "${book.title}"`,
          body: `
            <p class="dialog-intro">Aun no tienes listas. Crea una y guardamos el libro ahi mismo.</p>
            <label>
              Nombre de la lista
              <input name="nombreLista" type="text" placeholder="Mis proximas lecturas" required />
            </label>
          `,
          primaryLabel: 'Crear y guardar',
        });

        if (!listData) {
          setStatus('Lista cancelada.');
          return;
        }

        const created = await createList(listData.nombreLista);
        list = created.data;
      }

      const result = await addBookToList(list.id_lista, book);
      state.library = result.data || state.library;
      renderLibrary();
      setStatus(`Libro agregado a "${list.nombre_lista}".`);
      showNotice(`"${book.title}" quedo en "${list.nombre_lista}".`, 'success', 'Guardado en lista');
      return;
    }

    const result = state.saved.has(bookId) ? await removeFavorite(book) : await saveFavorite(book);

    syncSavedFromFavorites(result.data || []);
    renderBooks();
    setStatus(state.saved.has(bookId) ? 'Libro guardado en tu cuenta.' : 'Libro quitado de tus favoritos.');
    showNotice(
      state.saved.has(bookId) ? `"${book.title}" quedo en tus favoritos.` : `"${book.title}" salio de tus favoritos.`,
      'success',
      state.saved.has(bookId) ? 'Favorito guardado' : 'Favorito actualizado'
    );
  } catch (error) {
    const message = translateError(error.message) || 'No se pudo actualizar tu biblioteca.';
    setStatus(message, true);
    showNotice(message, 'error', 'No se pudo guardar');
  } finally {
    actionButton.disabled = false;
  }
});

actionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(actionForm);
  const values = Object.fromEntries(formData.entries());
  closeActionDialog(values);
});

actionCancel.addEventListener('click', () => closeActionDialog(null));
actionSecondary.addEventListener('click', () => closeActionDialog(null));
actionDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeActionDialog(null);
});

logoutButton.addEventListener('click', () => {
  state.user = null;
  state.token = '';
  state.saved = new Set();
  state.library = { reading: [], reviews: [], lists: [] };
  localStorage.removeItem('booksnexus_token');
  localStorage.removeItem('booksnexus_user');
  localStorage.removeItem('booksnexus_saved');
  renderAuthState();
  renderLibrary();
  renderBooks();
});

detailClose.addEventListener('click', () => detailDialog.close());
readerClose.addEventListener('click', () => readerDialog.close());

readerList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-reader]');

  if (!button) {
    return;
  }

  try {
    readerBody.innerHTML = '<p class="status">Cargando perfil...</p>';
    readerDialog.showModal();
    const profile = await getReaderProfile(button.dataset.reader);
    renderReaderProfileCard(profile);
  } catch (error) {
    readerBody.innerHTML = '<p class="status error">No se pudo cargar el perfil.</p>';
  }
});

readerBody.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-follow-reader]');

  if (!button) {
    return;
  }

  if (!state.token) {
    window.location.href = 'src/login/login.html';
    return;
  }

  button.disabled = true;

  try {
    const profile = await followReader(button.dataset.followReader, button.dataset.following === 'true');
    renderReaderProfileCard(profile);
    await refreshCommunity();
    showNotice('Tu red de lectores se actualizo correctamente.', 'success', 'Seguimiento actualizado');
  } catch (error) {
    showNotice(translateError(error.message), 'error', 'No se pudo actualizar');
  } finally {
    button.disabled = false;
  }
});

bindNavigation();
initializeViewFromHash();
hydrateUser();
refreshCommunity();
