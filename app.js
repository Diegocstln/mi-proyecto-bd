const apiBaseUrl = window.BOOKSNEXUS_API_BASE_URL || 'http://localhost:3000';

const state = {
  books: [],
  saved: new Set(),
  filter: 'all',
  minYear: 0,
  token: localStorage.getItem('booksnexus_token') || '',
  user: null,
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
const logoutButton = document.querySelector('#logout-button');
const detailDialog = document.querySelector('#book-detail-dialog');
const detailTitle = document.querySelector('#detail-title');
const detailBody = document.querySelector('#detail-body');
const detailClose = document.querySelector('#detail-close');

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
}

function setProfileStatus(message, isError = false) {
  profileStatus.textContent = message;
  profileStatus.classList.toggle('error', isError);
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
            <span class="rating"><i class="fa-solid fa-bookmark" aria-hidden="true"></i></span>
            <button class="ghost-button ${isSaved ? 'saved' : ''}" type="button" data-save="${bookId}">
              <i class="fa-solid ${isSaved ? 'fa-check' : 'fa-plus'}" aria-hidden="true"></i>
              <span>${isSaved ? 'Guardado' : 'Guardar'}</span>
            </button>
            <button class="icon-button" type="button" data-detail="${bookId}" aria-label="Ver detalle de ${title}" title="Ver detalle">
              <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
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

function syncSavedFromFavorites(favorites) {
  state.saved = new Set((favorites || []).map((book) => String(book.openLibraryKey)));
  const lastFavorite = favorites?.[0];

  profileLastFavorite.textContent = lastFavorite ? 'Favorito reciente' : 'Sin actividad';
  profileLastFavorite.parentElement.lastChild.textContent = lastFavorite
    ? ` ${lastFavorite.title}`
    : ' Guarda un libro para verlo aqui.';

  persistSavedBooks();
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
    setProfileStatus('Conecta con tu cuenta desde la pantalla de acceso.');
    return;
  }

  profileName.textContent = state.user.nombre || state.user.username;
  profileUsername.textContent = `@${state.user.username}`;
  profileEmail.textContent = state.user.correo;
  profileAvatar.textContent = getInitialsFromUser(state.user);
  logoutButton.hidden = false;
  setProfileStatus(`Sesion conectada a ${apiBaseUrl}`);
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

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const query = input.value.trim();
  const button = form.querySelector('button');

  if (!query) {
    return;
  }

  button.disabled = true;
  setStatus('Buscando libros...');

  try {
    const result = await searchBooks(query);
    state.books = (result.data || []).map(normalizeBook);
    renderBooks();
    setStatus(`Busqueda lista desde ${apiBaseUrl}`);
  } catch (error) {
    state.books = [];
    renderBooks();
    setStatus('No se pudo conectar con el backend. Revisa que este encendido.', true);
  } finally {
    button.disabled = false;
  }
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
        const description = detail.description || 'Open Library no tiene descripcion para este libro.';
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
        detailBody.innerHTML = '<p class="status error">No se pudo cargar el detalle. Revisa que el backend este encendido.</p>';
      });

    return;
  }

  const button = event.target.closest('[data-save]');

  if (!button) {
    return;
  }

  const bookId = String(button.dataset.save);
  const book = state.books.find((item) => item.id === bookId);

  if (!book) {
    return;
  }

  if (!state.user || !state.token) {
    setStatus('Inicia sesion para guardar libros en tu biblioteca.', true);
    window.location.href = 'src/login/login.html';
    return;
  }

  button.disabled = true;

  try {
    const result = state.saved.has(bookId)
      ? await removeFavorite(book)
      : await saveFavorite(book);

    syncSavedFromFavorites(result.data || []);
    renderBooks();
    setStatus(state.saved.has(bookId) ? 'Libro guardado en tu cuenta.' : 'Libro quitado de tus favoritos.');
  } catch (error) {
    setStatus(error.message || 'No se pudo actualizar tu biblioteca.', true);
  } finally {
    button.disabled = false;
  }
});

logoutButton.addEventListener('click', () => {
  state.user = null;
  state.token = '';
  state.saved = new Set();
  localStorage.removeItem('booksnexus_token');
  localStorage.removeItem('booksnexus_user');
  localStorage.removeItem('booksnexus_saved');
  renderAuthState();
  renderBooks();
});

detailClose.addEventListener('click', () => detailDialog.close());

bindNavigation();
initializeViewFromHash();
hydrateUser();
