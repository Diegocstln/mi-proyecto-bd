const apiBaseUrl = window.BOOKSNEXUS_API_BASE_URL || 'http://localhost:3000';

const state = {
  books: [],
  favorites: [],
  saved: new Set(),
  filter: 'all',
  authorFilter: '',
  authors: [],
  category: '',
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
const authorFilter = document.querySelector('#author-filter');
const categoryButtons = document.querySelectorAll('[data-category]');
const filterButtons = document.querySelectorAll('[data-filter]');
const navButtons = document.querySelectorAll('[data-view-target]');
const topbar = document.querySelector('.topbar');
const menuToggle = document.querySelector('.menu-toggle');
const authLinks = document.querySelectorAll('[data-auth-link]');
const profileName = document.querySelector('#profile-name');
const profileUsername = document.querySelector('#profile-username');
const profileEmail = document.querySelector('#profile-email');
const profileSummary = document.querySelector('#profile-summary');
const profileAvatar = document.querySelector('#profile-avatar');
const profileSocialCounts = document.querySelector('#profile-social-counts');
const profileFollowersCount = document.querySelector('#profile-followers-count');
const profileFollowingCount = document.querySelector('#profile-following-count');
const profileStatus = document.querySelector('#profile-status');
const profileFavoritesCount = document.querySelector('#profile-favorites-count');
const profileStatsFavorites = document.querySelector('#profile-stats-favorites');
const profileLastFavorite = document.querySelector('#profile-last-favorite');
const profileLists = document.querySelector('#profile-lists');
const profileFavorites = document.querySelector('#profile-favorites');
const profileReading = document.querySelector('#profile-reading');
const profileReviews = document.querySelector('#profile-reviews');
const profileView = document.querySelector('#view-perfil');
const profileLock = document.querySelector('#profile-lock');
const profileEditButton = document.querySelector('#profile-edit-button');
const profileDeleteButton = document.querySelector('#profile-delete-button');
const listCreateButton = document.querySelector('#list-create-button');
const favoriteAddButton = document.querySelector('#favorite-add-button');
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
    'Biography must be 500 characters or less': 'La biografia debe tener 500 caracteres o menos.',
    'Avatar URL must be a valid URL': 'La URL del avatar debe ser valida.',
    'List description must be 500 characters or less': 'La descripcion de la lista debe tener 500 caracteres o menos.',
    'List not found': 'No encontramos esa lista.',
    'Book not found in list': 'Ese libro ya no esta en la lista.',
    'Review not found': 'No encontramos esa resena.',
  };

  return translations[message] || message || 'No se pudo completar la accion.';
}

function openActionDialog({ title, body, primaryLabel = 'Guardar' }) {
  actionTitle.textContent = title;
  actionForm.reset();
  actionBody.innerHTML = body;
  actionPrimary.textContent = primaryLabel;
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

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function isFollowingValue(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function getFollowingIds() {
  return new Set((state.library.following || []).map((person) => String(person.id_usuario)));
}

function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getBookCategories(book) {
  const rawCategories = [
    ...toArray(book.categories),
    ...toArray(book.subjects),
    ...(book.subject ? [book.subject] : []),
    ...(book.categoria ? [book.categoria] : []),
  ];
  const categories = rawCategories
    .map((category) => String(category || '').trim())
    .filter(Boolean);

  if (book.firstPublishYear) {
    categories.unshift(String(book.firstPublishYear));
  }

  return [...new Set(categories)].slice(0, 4);
}

function getCategoryClass(category) {
  const value = normalizeText(category).replace(/\s+/g, '_');

  if (value.includes('fantasy') || value.includes('fantasia')) return 'fantasy';
  if (value.includes('romance')) return 'romance';
  if (value.includes('mystery') || value.includes('misterio')) return 'mystery';
  if (value.includes('science') || value.includes('ciencia')) return 'scifi';
  if (value.includes('history') || value.includes('historia')) return 'history';
  if (value.includes('young')) return 'young';
  if (value.includes('bio')) return 'bio';
  if (value.includes('fiction') || value.includes('ficcion')) return 'fiction';

  return 'neutral';
}

function renderCategoryTags(categories) {
  return categories
    .map((category) => `
      <span class="category-chip ${getCategoryClass(category)}" title="${escapeHtml(category)}">
        ${escapeHtml(category)}
      </span>
    `)
    .join('');
}

function getSpanishDescription(detail) {
  return (
    detail.descripcion ||
    detail.description_es ||
    detail.descriptionEs ||
    detail.resumen ||
    detail.sinopsis ||
    detail.description ||
    'El catalogo no tiene descripcion en espanol para este libro.'
  );
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

function getAvatarUrl(user) {
  return user?.avatar_url || user?.avatarUrl || user?.avatar || '';
}

function renderAvatar(user, className = 'avatar') {
  const name = escapeHtml(user?.nombre || user?.username || 'BooksNexus');
  const avatarUrl = getAvatarUrl(user);

  if (avatarUrl) {
    return `<img class="${className} image-avatar" src="${escapeHtml(avatarUrl)}" alt="${name}" loading="lazy" />`;
  }

  return `<div class="${className}" aria-hidden="true">${escapeHtml(getInitialsFromUser(user))}</div>`;
}

function paintAvatar(element, user) {
  if (!element) {
    return;
  }

  const avatarUrl = getAvatarUrl(user);
  element.innerHTML = avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(user?.nombre || user?.username || 'Perfil')}" />` : escapeHtml(getInitialsFromUser(user));
  element.classList.toggle('has-image', Boolean(avatarUrl));
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
    categories: toArray(book.categories || book.subjects || book.subject || book.categorias),
  };
}

function getFilteredBooks() {
  const authorQuery = normalizeText(state.authorFilter);

  return state.books.filter((book) => {
    const matchesSaved = state.filter === 'all' || state.saved.has(String(book.id));
    const matchesAuthor =
      !authorQuery ||
      (book.authors || []).some((author) => normalizeText(author) === authorQuery || normalizeText(author).includes(authorQuery));

    return matchesSaved && matchesAuthor;
  });
}

function updateAuthorOptions(extraAuthors = []) {
  if (!authorFilter) {
    return;
  }

  const selected = state.authorFilter;
  const authors = [...new Set([selected, ...state.authors, ...extraAuthors, ...state.books.flatMap((book) => book.authors || [])].filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, 'es'));

  authorFilter.innerHTML = `
    <option value="">Todos los autores</option>
    ${authors.map((author) => `<option value="${escapeHtml(author)}">${escapeHtml(author)}</option>`).join('')}
  `;

  authorFilter.value = selected;
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
      const bookId = escapeHtml(book.id);
      const categories = getBookCategories(book);

      return `
        <article class="book-card">
          ${renderCover(book)}
          <div class="book-content">
            <span class="book-meta">${author}</span>
            <h3>${title}</h3>
            <div class="tag-row book-category-row">
              ${renderCategoryTags(categories.length ? categories : ['Catalogo'])}
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
  const params = new URLSearchParams({ q: query });

  if (state.authorFilter) {
    params.set('author', state.authorFilter);
    params.set('autor', state.authorFilter);
  }

  if (state.category) {
    params.set('subject', state.category);
    params.set('category', state.category);
    params.set('categoria', state.category);
  }

  params.set('lang', 'es');
  params.set('language', 'spa');

  const response = await fetch(`${apiBaseUrl}/api/books/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error('No se pudo consultar el backend');
  }

  return response.json();
}

async function getAuthors() {
  const response = await fetch(`${apiBaseUrl}/api/books/authors`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar autores');
  }

  return response.json();
}

async function getBookDetail(workKey) {
  const params = new URLSearchParams({ lang: 'es', language: 'spa' });
  const response = await fetch(`${apiBaseUrl}/api/books/${encodeURIComponent(workKey)}?${params.toString()}`);

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

async function updateProfile(payload) {
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo actualizar el perfil');
  }

  return data;
}

async function deleteProfile() {
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo eliminar el perfil');
  }
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

async function removeFollower(idUsuario) {
  const response = await fetch(`${apiBaseUrl}/api/library/users/${idUsuario}/follower`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo quitar el seguidor');
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

async function updateReview(idResena, payload) {
  const response = await fetch(`${apiBaseUrl}/api/library/reviews/${idResena}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo actualizar la resena');
  }

  return response.json();
}

async function deleteReview(idResena) {
  const response = await fetch(`${apiBaseUrl}/api/library/reviews/${idResena}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo eliminar la resena');
  }

  return response.json();
}

async function createList(nombreLista) {
  return saveList({ nombreLista, privacidad: 'publica' });
}

async function saveList(payload) {
  const response = await fetch(`${apiBaseUrl}/api/library/lists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo crear la lista');
  }

  return response.json();
}

async function updateList(idLista, payload) {
  const response = await fetch(`${apiBaseUrl}/api/library/lists/${idLista}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo actualizar la lista');
  }

  return response.json();
}

async function deleteList(idLista) {
  const response = await fetch(`${apiBaseUrl}/api/library/lists/${idLista}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo eliminar la lista');
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

async function removeBookFromList(idLista, workKey) {
  const cleanKey = String(workKey || '').replace('/works/', '');
  const response = await fetch(`${apiBaseUrl}/api/library/lists/${idLista}/books/${encodeURIComponent(cleanKey)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No se pudo quitar el libro de la lista');
  }

  return response.json();
}

function syncSavedFromFavorites(favorites) {
  state.favorites = favorites || [];
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

function renderConnectionList(people, type) {
  const emptyText = type === 'followers' ? 'Todavia nadie te sigue.' : 'Todavia no sigues a ningun lector.';
  const followingIds = getFollowingIds();

  if (!people?.length) {
    return `<p class="status">${emptyText}</p>`;
  }

  return people
    .map((person) => {
      const isFollowing = isFollowingValue(person.is_following) || followingIds.has(String(person.id_usuario)) || type === 'following';
      const canAct = state.user && Number(state.user.id_usuario) !== Number(person.id_usuario);

      return `
        <div class="connection-card">
          ${renderAvatar(person, 'connection-avatar')}
          <div>
            <strong>${escapeHtml(person.nombre || person.username)}</strong>
            <span>@${escapeHtml(person.username)}</span>
          </div>
          ${canAct ? `
            <div class="connection-actions">
              <button class="ghost-button ${isFollowing ? 'saved' : ''}" type="button" data-follow-reader="${person.id_usuario}" data-following="${isFollowing}">
                <i class="fa-solid ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}" aria-hidden="true"></i>
                <span>${isFollowing ? 'Dejar de seguir' : 'Seguir'}</span>
              </button>
              ${type === 'followers' ? `
                <button class="ghost-button danger-button" type="button" data-remove-follower="${person.id_usuario}">
                  <i class="fa-solid fa-user-minus" aria-hidden="true"></i>
                  <span>Quitar</span>
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    })
    .join('');
}

function updateProfileSocialCounts() {
  const followers = state.library.followers || [];
  const following = state.library.following || [];
  const followerCount = followers.length || Number(state.user?.followers) || 0;
  const followingCount = following.length || Number(state.user?.following) || 0;

  profileFollowersCount.textContent = String(followerCount);
  profileFollowingCount.textContent = String(followingCount);
}

async function openProfileConnections(type) {
  if (!state.user) {
    return;
  }

  readerTitle.textContent = type === 'followers' ? 'Seguidores' : 'Seguidos';
  readerBody.innerHTML = '<p class="status">Cargando lectores...</p>';
  readerDialog.showModal();

  try {
    await refreshLibrary();
    const people = type === 'followers' ? state.library.followers || [] : state.library.following || [];
    readerBody.innerHTML = `
      <section class="reader-section" data-profile-connections="${type}">
        ${renderConnectionList(people, type)}
      </section>
    `;
  } catch (error) {
    readerBody.innerHTML = '<p class="status error">No se pudieron cargar los lectores.</p>';
  }
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

function renderListBooks(list) {
  const books = list.books || [];

  if (!books.length) {
    return '<p class="status compact-status">Sin libros en esta lista.</p>';
  }

  return `
    <div class="list-books">
      ${books.map((book) => `
        <div class="list-book">
          <span>${escapeHtml(book.title || book.titulo || 'Libro sin titulo')}</span>
          <button class="icon-button" type="button" data-list-book-remove="${list.id_lista}" data-work-key="${escapeHtml(book.openLibraryKey || book.openlibrary_key || '')}" aria-label="Quitar ${escapeHtml(book.title || book.titulo || 'libro')} de ${escapeHtml(list.nombre_lista)}" title="Quitar de la lista">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderListPreview(list) {
  const books = (list.books || []).slice(0, 3);

  if (!books.length) {
    return '<div class="list-preview empty">Sin libros todavia</div>';
  }

  return `
    <div class="list-preview">
      ${books.map((book) => `
        <span title="${escapeHtml(book.title || book.titulo || 'Libro')}">${escapeHtml(getInitials(book.title || book.titulo || 'Libro'))}</span>
      `).join('')}
    </div>
  `;
}

function renderFavorites() {
  profileFavorites.innerHTML = state.favorites.length
    ? state.favorites
        .map((book) => `
          <div class="favorite-card">
            ${renderCover({
              title: book.title,
              coverUrl: book.coverUrl,
            })}
            <div>
              <strong>${escapeHtml(book.title)}</strong>
              <span>${escapeHtml(formatAuthors(book.authors))}</span>
            </div>
            <button class="icon-button" type="button" data-profile-favorite-remove="${escapeHtml(book.openLibraryKey)}" aria-label="Quitar ${escapeHtml(book.title)} de favoritos" title="Quitar favorito">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        `)
        .join('')
    : '<p class="status">Aun no tienes favoritos guardados.</p>';
}

function renderProfileSummary() {
  const lists = state.library.lists || [];
  const reading = state.library.reading || [];
  const reviews = state.library.reviews || [];

  profileSummary.innerHTML = `
    <span><strong>${state.favorites.length}</strong> favoritos</span>
    <span><strong>${lists.length}</strong> listas</span>
    <span><strong>${reviews.length}</strong> resenas</span>
    <span><strong>${reading.length}</strong> lecturas</span>
  `;
}

function renderLibrary() {
  const lists = state.library.lists || [];
  const reading = state.library.reading || [];
  const reviews = state.library.reviews || [];

  profileLists.innerHTML = lists.length
    ? lists
        .map((list) => `
          <button class="list-card list-mini" type="button" data-list-open="${list.id_lista}">
            <div>
              <span>${escapeHtml(list.nombre_lista)}</span>
              <strong>${list.total_libros} ${list.total_libros === 1 ? 'libro' : 'libros'} - ${escapeHtml(list.privacidad)}</strong>
              ${list.descripcion ? `<p>${escapeHtml(list.descripcion)}</p>` : ''}
            </div>
            ${renderListPreview(list)}
          </button>
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
  profileReviews.innerHTML = reviews.length
    ? reviews
        .map((review) => `
          <div class="review-card" data-review-id="${review.id_resena}">
            <div>
              <strong>${escapeHtml(review.titulo)}</strong>
              <span>${escapeHtml(review.calificacion)}/5 estrellas</span>
              <p>${escapeHtml(review.comentario)}</p>
            </div>
            <div class="list-actions">
              <button class="icon-button" type="button" data-review-edit="${review.id_resena}" aria-label="Editar resena de ${escapeHtml(review.titulo)}" title="Editar resena">
                <i class="fa-solid fa-pen" aria-hidden="true"></i>
              </button>
              <button class="icon-button" type="button" data-review-delete="${review.id_resena}" aria-label="Eliminar resena de ${escapeHtml(review.titulo)}" title="Eliminar resena">
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        `)
        .join('')
    : '<p class="status">Aun no has escrito resenas.</p>';
  renderFavorites();
  renderProfileSummary();
  updateProfileSocialCounts();
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
          <div class="review" data-community-review="${review.id_resena || ''}">
            <div class="review-head">
              <div class="review-author">
                ${renderAvatar(review, 'reader-avatar mini-avatar')}
                <div>
                <strong>${escapeHtml(review.nombre || review.username)}</strong>
                <span>califico "${escapeHtml(review.titulo)}" con ${escapeHtml(review.calificacion)} estrellas</span>
                </div>
              </div>
              ${state.user && Number(review.id_usuario) === Number(state.user.id_usuario) ? `
                <div class="kebab-actions">
                  <button class="icon-button" type="button" data-community-review-edit="${review.id_resena}" aria-label="Editar resena" title="Editar resena">
                    <i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i>
                  </button>
                  <button class="icon-button danger-button" type="button" data-community-review-delete="${review.id_resena}" aria-label="Eliminar resena" title="Eliminar resena">
                    <i class="fa-solid fa-trash" aria-hidden="true"></i>
                  </button>
                </div>
              ` : ''}
            </div>
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
    : '<li><strong>Sin actividad esta semana</strong><br><span>El ranking se llena con favoritos y resenas de los ultimos 7 dias.</span></li>';

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
            <div class="reader-list-person">
              ${renderAvatar(user, 'reader-avatar mini-avatar')}
              <div>
                <strong>@${escapeHtml(user.username)}</strong><br>
                <span>${escapeHtml(user.nombre)} &middot; ${renderReaderMeta(user)}</span>
              </div>
            </div>
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

async function refreshAuthors() {
  try {
    const result = await getAuthors();
    const authors = result.data || result.authors || [];
    state.authors = authors
      .map((author) => author.nombre || author.name || author.autor || author)
      .filter(Boolean);
    updateAuthorOptions();
  } catch (error) {
    updateAuthorOptions();
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
  const isFollowing = isFollowingValue(user.is_following) || getFollowingIds().has(String(user.id_usuario));

  readerTitle.textContent = `@${user.username}`;
  readerBody.innerHTML = `
    <p><strong>${escapeHtml(user.nombre)}</strong></p>
    <p>${user.followers} seguidores · ${user.following} siguiendo</p>
    ${canFollow ? `
      <button class="ghost-button" type="button" data-follow-reader="${user.id_usuario}" data-following="${isFollowing}">
        ${isFollowing ? 'Dejar de seguir' : 'Seguir'}
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
  const isFollowing = isFollowingValue(user.is_following) || getFollowingIds().has(String(user.id_usuario));

  readerTitle.textContent = `${user.nombre || user.username}`;
  readerBody.innerHTML = `
    <div class="reader-profile">
      <section class="reader-hero">
        ${renderAvatar(user, 'reader-avatar')}
        <div>
          <h3>${escapeHtml(user.nombre || user.username)}</h3>
          <p>@${escapeHtml(user.username)}${user.biografia ? ` &middot; ${escapeHtml(user.biografia)}` : ''}</p>
        </div>
        ${canFollow ? `
          <button class="ghost-button ${isFollowing ? 'saved' : ''}" type="button" data-follow-reader="${user.id_usuario}" data-following="${isFollowing}">
            <i class="fa-solid ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}" aria-hidden="true"></i>
            <span>${isFollowing ? 'Dejar de seguir' : 'Seguir'}</span>
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
    paintAvatar(profileAvatar, null);
    profileSocialCounts.hidden = true;
    logoutButton.hidden = true;
    profileEditButton.hidden = true;
    profileDeleteButton.hidden = true;
    listCreateButton.hidden = true;
    favoriteAddButton.hidden = true;
    profileView.classList.add('locked');
    profileLock.hidden = false;
    profileSummary.innerHTML = '';
    setProfileStatus('Tu biblioteca se desbloquea cuando inicias sesion.');
    return;
  }

  profileName.textContent = state.user.nombre || state.user.username;
  profileUsername.textContent = `@${state.user.username}`;
  profileEmail.textContent = state.user.correo;
  paintAvatar(profileAvatar, state.user);
  profileSocialCounts.hidden = false;
  updateProfileSocialCounts();
  logoutButton.hidden = false;
  profileEditButton.hidden = false;
  profileDeleteButton.hidden = false;
  listCreateButton.hidden = false;
  favoriteAddButton.hidden = false;
  profileView.classList.remove('locked');
  profileLock.hidden = true;
  setProfileStatus(state.user.biografia || 'Sesion activa. Tu biblioteca esta sincronizada.');
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

  if (viewName === 'comunidad') {
    renderCommunity();
  }
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

function clearSession() {
  state.user = null;
  state.token = '';
  state.favorites = [];
  state.saved = new Set();
  state.library = { reading: [], reviews: [], lists: [] };
  localStorage.removeItem('booksnexus_token');
  localStorage.removeItem('booksnexus_user');
  localStorage.removeItem('booksnexus_saved');
  renderAuthState();
  renderLibrary();
  renderBooks();
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
    updateAuthorOptions();
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

authorFilter?.addEventListener('change', (event) => {
  state.authorFilter = event.target.value;
  if (input.value.trim().length >= 3) {
    performSearch();
    return;
  }

  renderBooks();
});

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    categoryButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    state.category = button.dataset.category || '';
    performSearch();
  });
});

communityReaderSearch?.addEventListener('input', () => {
  window.clearTimeout(readerSearchTimer);
  readerSearchTimer = window.setTimeout(performReaderSearch, 350);
});

profileSocialCounts?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-profile-connection]');

  if (!button) {
    return;
  }

  openProfileConnections(button.dataset.profileConnection);
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
        const description = getSpanishDescription(detail);
        const subjects = (detail.subjects || detail.categories || detail.categorias || []).slice(0, 8);
        const dates = [detail.firstPublishDate || book.firstPublishYear || 'Fecha no disponible'];

        detailBody.innerHTML = `
          <p>${escapeHtml(description)}</p>
          <div class="tag-row">
            ${renderCategoryTags([...dates, ...subjects])}
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

profileEditButton.addEventListener('click', async () => {
  if (!state.user) {
    return;
  }

  const profileData = await openActionDialog({
    title: 'Editar perfil',
    body: `
      <label>
        Nombre
        <input name="nombre" type="text" value="${escapeHtml(state.user.nombre || '')}" required />
      </label>
      <label>
        Usuario
        <input name="username" type="text" value="${escapeHtml(state.user.username || '')}" required />
      </label>
      <label>
        Correo
        <input name="correo" type="email" value="${escapeHtml(state.user.correo || '')}" required />
      </label>
      <label>
        Biografia
        <textarea name="biografia" rows="4" maxlength="500" placeholder="Cuenta que te gusta leer.">${escapeHtml(state.user.biografia || '')}</textarea>
      </label>
      <label>
        Avatar URL
        <input name="avatarUrl" type="url" value="${escapeHtml(state.user.avatar_url || '')}" placeholder="https://..." />
      </label>
    `,
    primaryLabel: 'Guardar perfil',
  });

  if (!profileData) {
    return;
  }

  profileEditButton.disabled = true;

  try {
    const result = await updateProfile(profileData);
    state.user = result.user;
    state.token = result.token || state.token;
    localStorage.setItem('booksnexus_token', state.token);
    localStorage.setItem('booksnexus_user', JSON.stringify(state.user));
    renderAuthState();
    await refreshCommunity();
    showNotice('Perfil actualizado.');
  } catch (error) {
    showNotice(translateError(error.message), 'error');
  } finally {
    profileEditButton.disabled = false;
  }
});

profileDeleteButton.addEventListener('click', async () => {
  if (!state.user) {
    return;
  }

  const confirmation = await openActionDialog({
    title: 'Eliminar perfil',
    body: `
      <p class="status error">Esta accion eliminara tu cuenta, favoritos, lecturas, resenas, listas y seguimientos.</p>
      <label>
        Confirmacion
        <select name="confirm" required>
          <option value="">Cancelar</option>
          <option value="delete">Eliminar mi cuenta</option>
        </select>
      </label>
    `,
    primaryLabel: 'Eliminar',
  });

  if (confirmation?.confirm !== 'delete') {
    return;
  }

  profileDeleteButton.disabled = true;

  try {
    await deleteProfile();
    clearSession();
    await refreshCommunity();
    showNotice('Perfil eliminado.');
  } catch (error) {
    showNotice(translateError(error.message), 'error');
  } finally {
    profileDeleteButton.disabled = false;
  }
});

listCreateButton.addEventListener('click', async () => {
  if (!state.user) {
    return;
  }

  const listData = await openActionDialog({
    title: 'Crear lista',
    body: `
      <label>
        Nombre
        <input name="nombreLista" type="text" placeholder="Mis proximas lecturas" required />
      </label>
      <label>
        Descripcion
        <textarea name="descripcion" rows="3" maxlength="500" placeholder="Opcional"></textarea>
      </label>
      <label>
        Privacidad
        <select name="privacidad">
          <option value="publica">Publica</option>
          <option value="privada">Privada</option>
        </select>
      </label>
    `,
    primaryLabel: 'Crear lista',
  });

  if (!listData) {
    return;
  }

  listCreateButton.disabled = true;

  try {
    await saveList(listData);
    await refreshLibrary();
    showNotice('Lista creada.');
  } catch (error) {
    showNotice(translateError(error.message), 'error');
  } finally {
    listCreateButton.disabled = false;
  }
});

favoriteAddButton.addEventListener('click', async () => {
  if (!state.user) {
    return;
  }

  const candidates = state.books.filter((book) => !state.saved.has(String(book.id)));

  if (!candidates.length) {
    setActiveView('explorar');
    showNotice('Busca un libro en Explorar y podras guardarlo desde aqui o desde su tarjeta.', 'info', 'Elige un libro');
    return;
  }

  const favoriteData = await openActionDialog({
    title: 'Agregar favorito',
    body: `
      <p class="dialog-intro">Elige uno de los resultados actuales de Explorar.</p>
      <label>
        Libro
        <select name="bookId" required>
          ${candidates.map((book) => `<option value="${escapeHtml(book.id)}">${escapeHtml(book.title)}</option>`).join('')}
        </select>
      </label>
    `,
    primaryLabel: 'Guardar favorito',
  });

  if (!favoriteData) {
    return;
  }

  const book = candidates.find((item) => item.id === favoriteData.bookId);

  if (!book) {
    return;
  }

  favoriteAddButton.disabled = true;

  try {
    const result = await saveFavorite(book);
    syncSavedFromFavorites(result.data || []);
    renderBooks();
    renderLibrary();
    showNotice(`"${book.title}" quedo en tus favoritos.`, 'success', 'Favorito guardado');
  } catch (error) {
    showNotice(translateError(error.message), 'error', 'No se pudo guardar');
  } finally {
    favoriteAddButton.disabled = false;
  }
});

profileFavorites.addEventListener('click', async (event) => {
  const removeButton = event.target.closest('[data-profile-favorite-remove]');

  if (!removeButton) {
    return;
  }

  const favorite = state.favorites.find((book) => String(book.openLibraryKey) === String(removeButton.dataset.profileFavoriteRemove));

  if (!favorite) {
    return;
  }

  removeButton.disabled = true;

  try {
    const result = await removeFavorite({
      workKey: favorite.openLibraryKey.replace('/works/', ''),
    });
    syncSavedFromFavorites(result.data || []);
    renderBooks();
    renderLibrary();
    showNotice(`"${favorite.title}" salio de tus favoritos.`, 'success', 'Favoritos actualizados');
  } catch (error) {
    showNotice(translateError(error.message), 'error', 'No se pudo quitar');
  } finally {
    removeButton.disabled = false;
  }
});

async function openListManager(list) {
  const favoriteChoices = state.favorites.filter((favorite) => {
    const favoriteKey = String(favorite.openLibraryKey);
    return !(list.books || []).some((book) => String(book.openLibraryKey || book.openlibrary_key) === favoriteKey);
  });
  const books = list.books || [];
  const listData = await openActionDialog({
    title: `Lista: ${list.nombre_lista}`,
    body: `
      <section class="manager-section">
        <strong>Datos de la lista</strong>
        <div class="manager-grid">
          <label>
            Nombre
            <input name="nombreLista" type="text" value="${escapeHtml(list.nombre_lista || '')}" required />
          </label>
          <label>
            Privacidad
            <select name="privacidad">
              <option value="publica" ${list.privacidad === 'publica' ? 'selected' : ''}>Publica</option>
              <option value="privada" ${list.privacidad === 'privada' ? 'selected' : ''}>Privada</option>
            </select>
          </label>
        </div>
        <label>
          Descripcion
          <textarea name="descripcion" rows="3" maxlength="500" placeholder="Opcional">${escapeHtml(list.descripcion || '')}</textarea>
        </label>
      </section>

      <section class="manager-section">
        <strong>Libros guardados</strong>
        ${books.length ? books.map((book) => {
          const title = book.title || book.titulo || 'Libro sin titulo';
          const workKey = book.openLibraryKey || book.openlibrary_key || '';

          return `
            <label class="remove-option">
              <input type="checkbox" name="removeWorkKey" value="${escapeHtml(workKey)}" />
              <span class="remove-book-mark">${escapeHtml(getInitials(title))}</span>
              <span class="remove-book-copy">
                <strong>${escapeHtml(title)}</strong>
                <span>Se queda en la lista</span>
              </span>
              <span class="remove-book-action">
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
                <span>Quitar</span>
              </span>
            </label>
          `;
        }).join('') : '<p class="status compact-status">Sin libros todavia.</p>'}
      </section>

      <div class="manager-section">
        <strong>Agregar libro</strong>
        <p class="dialog-intro">Puedes agregar cualquiera de tus favoritos que todavia no este en esta lista.</p>
        <label>
          Desde favoritos
          <select name="addFavoriteKey">
            <option value="">No agregar ahora</option>
            ${favoriteChoices.map((book) => `<option value="${escapeHtml(book.openLibraryKey)}">${escapeHtml(book.title)}</option>`).join('')}
          </select>
        </label>
      </div>
    `,
    primaryLabel: 'Guardar lista',
  });

  if (!listData) {
    return;
  }

  try {
    let result = await updateList(list.id_lista, listData);
    state.library = result.data || state.library;

    const removals = Array.isArray(listData.removeWorkKey)
      ? listData.removeWorkKey
      : listData.removeWorkKey
        ? [listData.removeWorkKey]
        : [];

    for (const workKey of removals) {
      result = await removeBookFromList(list.id_lista, workKey);
      state.library = result.data || state.library;
    }

    if (listData.addFavoriteKey) {
      const favorite = state.favorites.find((book) => String(book.openLibraryKey) === String(listData.addFavoriteKey));

      if (favorite) {
        result = await addBookToList(list.id_lista, {
          id: favorite.openLibraryKey,
          title: favorite.title,
          authors: favorite.authors,
          firstPublishYear: favorite.firstPublishYear,
          coverUrl: favorite.coverUrl,
        });
        state.library = result.data || state.library;
      }
    }

    renderLibrary();
    showNotice('Lista actualizada.', 'success', 'Cambios guardados');
  } catch (error) {
    showNotice(translateError(error.message), 'error', 'No se pudo guardar');
  }
}

profileLists.addEventListener('click', async (event) => {
  const openButton = event.target.closest('[data-list-open]');

  if (!openButton) {
    return;
  }

  const idLista = Number(openButton.dataset.listOpen);
  const list = (state.library.lists || []).find((item) => Number(item.id_lista) === idLista);

  if (!list) {
    return;
  }

  await openListManager(list);
});

profileReviews.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-review-edit]');
  const deleteButton = event.target.closest('[data-review-delete]');

  if (!editButton && !deleteButton) {
    return;
  }

  const idResena = Number(editButton?.dataset.reviewEdit || deleteButton?.dataset.reviewDelete);
  const review = (state.library.reviews || []).find((item) => Number(item.id_resena) === idResena);

  if (!review) {
    return;
  }

  if (editButton) {
    const reviewData = await openActionDialog({
      title: `Editar resena de "${review.titulo}"`,
      body: `
        <label>
          Tu resena
          <textarea name="comentario" rows="4" required>${escapeHtml(review.comentario || '')}</textarea>
        </label>
        <label>
          Calificacion
          <select name="calificacion" required>
            ${[5, 4, 3, 2, 1].map((value) => `<option value="${value}" ${Number(review.calificacion) === value ? 'selected' : ''}>${value} estrellas</option>`).join('')}
          </select>
        </label>
      `,
      primaryLabel: 'Guardar resena',
    });

    if (!reviewData) {
      return;
    }

    editButton.disabled = true;

    try {
      const result = await updateReview(idResena, {
        comentario: reviewData.comentario,
        calificacion: Number(reviewData.calificacion),
      });
      state.library = result.data || state.library;
      renderLibrary();
      await refreshCommunity();
      showNotice('Tu resena se actualizo.', 'success', 'Resena guardada');
    } catch (error) {
      showNotice(translateError(error.message), 'error', 'No se pudo guardar');
    } finally {
      editButton.disabled = false;
    }

    return;
  }

  const confirmation = await openActionDialog({
    title: 'Eliminar resena',
    body: `<p class="status error">Se eliminara tu resena de "${escapeHtml(review.titulo)}".</p>`,
    primaryLabel: 'Eliminar resena',
  });

  if (!confirmation) {
    return;
  }

  deleteButton.disabled = true;

  try {
    const result = await deleteReview(idResena);
    state.library = result.data || state.library;
    renderLibrary();
    await refreshCommunity();
    showNotice('La resena fue eliminada.', 'success', 'Resena eliminada');
  } catch (error) {
    showNotice(translateError(error.message), 'error', 'No se pudo eliminar');
  } finally {
    deleteButton.disabled = false;
  }
});

communityReviews.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-community-review-edit]');
  const deleteButton = event.target.closest('[data-community-review-delete]');

  if (!editButton && !deleteButton) {
    return;
  }

  const idResena = Number(editButton?.dataset.communityReviewEdit || deleteButton?.dataset.communityReviewDelete);
  const review = (state.library.reviews || []).find((item) => Number(item.id_resena) === idResena);

  if (!review) {
    showNotice('Abre tu perfil para sincronizar tus resenas antes de editarlas.', 'error', 'Resena no disponible');
    return;
  }

  if (editButton) {
    const reviewData = await openActionDialog({
      title: `Editar resena de "${review.titulo}"`,
      body: `
        <label>
          Tu resena
          <textarea name="comentario" rows="4" required>${escapeHtml(review.comentario || '')}</textarea>
        </label>
        <label>
          Calificacion
          <select name="calificacion" required>
            ${[5, 4, 3, 2, 1].map((value) => `<option value="${value}" ${Number(review.calificacion) === value ? 'selected' : ''}>${value} estrellas</option>`).join('')}
          </select>
        </label>
      `,
      primaryLabel: 'Guardar resena',
    });

    if (!reviewData) {
      return;
    }

    try {
      const result = await updateReview(idResena, {
        comentario: reviewData.comentario,
        calificacion: Number(reviewData.calificacion),
      });
      state.library = result.data || state.library;
      renderLibrary();
      await refreshCommunity();
      showNotice('Tu resena se actualizo tambien en comunidad.', 'success', 'Resena guardada');
    } catch (error) {
      showNotice(translateError(error.message), 'error', 'No se pudo guardar');
    }

    return;
  }

  const confirmation = await openActionDialog({
    title: 'Eliminar resena',
    body: `<p class="status error">Se eliminara tu resena de "${escapeHtml(review.titulo)}" tambien de comunidad.</p>`,
    primaryLabel: 'Eliminar resena',
  });

  if (!confirmation) {
    return;
  }

  try {
    const result = await deleteReview(idResena);
    state.library = result.data || state.library;
    renderLibrary();
    await refreshCommunity();
    showNotice('La resena fue eliminada de comunidad.', 'success', 'Resena eliminada');
  } catch (error) {
    showNotice(translateError(error.message), 'error', 'No se pudo eliminar');
  }
});

actionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(actionForm);
  const values = {};

  formData.forEach((value, key) => {
    if (key in values) {
      values[key] = Array.isArray(values[key]) ? [...values[key], value] : [values[key], value];
      return;
    }

    values[key] = value;
  });
  closeActionDialog(values);
});

actionCancel.addEventListener('click', () => closeActionDialog(null));
actionSecondary.addEventListener('click', () => closeActionDialog(null));
actionDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeActionDialog(null);
});

logoutButton.addEventListener('click', () => {
  clearSession();
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
  const removeButton = event.target.closest('[data-remove-follower]');

  if (!button && !removeButton) {
    return;
  }

  if (!state.token) {
    window.location.href = 'src/login/login.html';
    return;
  }

  const actionButton = button || removeButton;
  actionButton.disabled = true;

  try {
    if (removeButton) {
      await removeFollower(removeButton.dataset.removeFollower);
      const type = readerBody.querySelector('[data-profile-connections]')?.dataset.profileConnections || 'followers';
      await refreshLibrary();
      const people = type === 'followers' ? state.library.followers || [] : state.library.following || [];
      readerBody.innerHTML = `
        <section class="reader-section" data-profile-connections="${type}">
          ${renderConnectionList(people, type)}
        </section>
      `;
      await refreshCommunity();
      showNotice('Ese seguidor ya no aparece en tu perfil.', 'success', 'Seguidor quitado');
      return;
    }

    const profile = await followReader(button.dataset.followReader, button.dataset.following === 'true');
    const type = readerBody.querySelector('[data-profile-connections]')?.dataset.profileConnections;

    if (type) {
      await refreshLibrary();
      const people = type === 'followers' ? state.library.followers || [] : state.library.following || [];
      readerBody.innerHTML = `
        <section class="reader-section" data-profile-connections="${type}">
          ${renderConnectionList(people, type)}
        </section>
      `;
    } else {
      await refreshLibrary();
      renderReaderProfileCard(profile);
    }

    await refreshCommunity();
    showNotice('Tu red de lectores se actualizo correctamente.', 'success', 'Seguimiento actualizado');
  } catch (error) {
    showNotice(translateError(error.message), 'error', 'No se pudo actualizar');
  } finally {
    actionButton.disabled = false;
  }
});

bindNavigation();
initializeViewFromHash();
refreshAuthors();
hydrateUser();
refreshCommunity();
