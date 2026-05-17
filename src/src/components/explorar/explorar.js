export function initExplorar({ books }) {
  const state = {
    query: "",
    filter: "all",
    genre: "all",
    rating: 0,
    saved: new Set([1, 2, 5]),
  };

  const bookGrid = document.querySelector("#bookGrid");
  const searchForm = document.querySelector("#searchForm");
  const searchInput = document.querySelector("#searchInput");
  const genreFilter = document.querySelector("#genreFilter");
  const ratingFilter = document.querySelector("#ratingFilter");
  const ratingValue = document.querySelector("#ratingValue");
  const filterButtons = document.querySelectorAll("[data-filter]");

  function getInitials(title) {
    return title
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  function getFilteredBooks() {
    return books.filter((book) => {
      const matchesQuery = `${book.title} ${book.author} ${book.genre}`
        .toLowerCase()
        .includes(state.query.toLowerCase());
      const matchesFilter =
        state.filter === "all" ||
        (state.filter === "reading" && book.status === "reading") ||
        (state.filter === "favorite" && book.favorite);
      const matchesGenre = state.genre === "all" || book.genre === state.genre;
      const matchesRating = book.rating >= state.rating;

      return matchesQuery && matchesFilter && matchesGenre && matchesRating;
    });
  }

  function renderBooks() {
    const filteredBooks = getFilteredBooks();

    if (!filteredBooks.length) {
      bookGrid.innerHTML = `
        <article class="book-card">
          <div class="book-content">
            <h3>No encontramos resultados</h3>
            <p>Prueba con otro titulo, autor, genero o calificacion.</p>
          </div>
        </article>
      `;
      return;
    }

    bookGrid.innerHTML = filteredBooks
      .map((book) => {
        const isSaved = state.saved.has(book.id);
        return `
          <article class="book-card">
            <div class="book-cover" aria-hidden="true">${getInitials(book.title)}</div>
            <div class="book-content">
              <span class="book-meta">${book.author}</span>
              <h3>${book.title}</h3>
              <div class="tag-row">
                <span class="tag">${book.genre}</span>
                <span class="tag">${book.status === "reading" ? "Leyendo" : "Guardado"}</span>
              </div>
              <p>${book.description}</p>
            </div>
            <div class="book-actions">
              <span class="rating">${book.rating}/5</span>
              <button class="ghost-button ${isSaved ? "saved" : ""}" type="button" data-save="${book.id}">
                ${isSaved ? "Guardado" : "Guardar"}
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.query = searchInput.value.trim();
    renderBooks();
  });

  genreFilter.addEventListener("change", (event) => {
    state.genre = event.target.value;
    renderBooks();
  });

  ratingFilter.addEventListener("input", (event) => {
    state.rating = Number(event.target.value);
    ratingValue.textContent = `${state.rating} ${state.rating === 1 ? "estrella" : "estrellas"}`;
    renderBooks();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.filter = button.dataset.filter;
      renderBooks();
    });
  });

  bookGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-save]");

    if (!button) {
      return;
    }

    const bookId = Number(button.dataset.save);

    if (state.saved.has(bookId)) {
      state.saved.delete(bookId);
    } else {
      state.saved.add(bookId);
    }

    renderBooks();
  });

  renderBooks();
}
