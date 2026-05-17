const apiBaseUrl = window.BOOKSNEXUS_API_BASE_URL || 'http://localhost:3000';

const state = {
  books: [],
  saved: new Set(),
  filter: 'all',
  minYear: 0,
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

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
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
  const title = book.title || 'Título no disponible';
  const firstPublishYear = Number(book.firstPublishYear) || 0;

  return {
    id: String(book.id || book.key || `book-${index}`),
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

function updateMetrics(books) {
  totalBooks.textContent = String(books.length);
  savedBooks.textContent = String(state.saved.size);
  resultCount.textContent = `${books.length} ${books.length === 1 ? 'libro' : 'libros'}`;
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
          <h3>No hay resultados todavía</h3>
          <p>Busca por título o autor para consultar libros desde la API.</p>
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
              <span class="tag">${isSaved ? 'Guardado' : 'Catálogo'}</span>
            </div>
            <p>Resultado conectado al catálogo externo de BooksNexus.</p>
          </div>
          <div class="book-actions">
            <span class="rating"><i class="fa-solid fa-bookmark" aria-hidden="true"></i></span>
            <button class="ghost-button ${isSaved ? 'saved' : ''}" type="button" data-save="${bookId}">
              <i class="fa-solid ${isSaved ? 'fa-check' : 'fa-plus'}" aria-hidden="true"></i>
              <span>${isSaved ? 'Guardado' : 'Guardar'}</span>
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
    : '<li><strong>Sin búsquedas todavía</strong><br><span>El ranking se llena con los resultados consultados.</span></li>';
}

async function searchBooks(query) {
  const response = await fetch(`${apiBaseUrl}/api/books/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error('No se pudo consultar el backend');
  }

  return response.json();
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

  menuToggle.addEventListener('click', () => {
    const isOpen = topbar.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
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
    setStatus(`Búsqueda lista desde ${apiBaseUrl}`);
  } catch (error) {
    state.books = [];
    renderBooks();
    setStatus('No se pudo conectar con el backend. Revisa que esté encendido.', true);
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
  yearValue.textContent = state.minYear ? `Desde ${state.minYear}` : 'Cualquier año';
  renderBooks();
});

grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-save]');

  if (!button) {
    return;
  }

  const bookId = String(button.dataset.save);

  if (state.saved.has(bookId)) {
    state.saved.delete(bookId);
  } else {
    state.saved.add(bookId);
  }

  renderBooks();
});

bindNavigation();
renderBooks();
