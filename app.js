const apiBaseUrl = window.BOOKSNEXUS_API_BASE_URL || 'http://localhost:3000';

const form = document.querySelector('#search-form');
const input = document.querySelector('#search-input');
const statusElement = document.querySelector('#status');
const grid = document.querySelector('#book-grid');
const resultCount = document.querySelector('#result-count');

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

function renderBooks(books) {
  grid.innerHTML = '';
  resultCount.textContent = `${books.length} ${books.length === 1 ? 'libro' : 'libros'}`;

  books.forEach((book) => {
    const card = document.createElement('article');
    card.className = 'book-card';

    if (book.coverUrl) {
      const image = document.createElement('img');
      image.className = 'cover';
      image.src = book.coverUrl;
      image.alt = `Portada de ${book.title}`;
      image.loading = 'lazy';
      card.appendChild(image);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'cover placeholder';
      placeholder.textContent = 'Sin portada';
      card.appendChild(placeholder);
    }

    const content = document.createElement('div');
    const title = document.createElement('h3');
    const authors = document.createElement('p');
    const year = document.createElement('p');

    title.textContent = book.title;
    authors.textContent = formatAuthors(book.authors);
    year.textContent = book.firstPublishYear || 'Fecha no disponible';

    content.append(title, authors, year);
    card.appendChild(content);

    grid.appendChild(card);
  });
}

async function searchBooks(query) {
  const response = await fetch(`${apiBaseUrl}/api/books/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error('No se pudo consultar el backend');
  }

  return response.json();
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
    renderBooks(result.data || []);
    setStatus(`Busqueda lista desde ${apiBaseUrl}`);
  } catch (error) {
    renderBooks([]);
    setStatus('No se pudo conectar con el backend. Revisa que este encendido.', true);
  } finally {
    button.disabled = false;
  }
});
