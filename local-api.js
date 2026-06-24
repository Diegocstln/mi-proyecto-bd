;(function BooksNexusLocalApi() {
  'use strict';

  const API_ORIGIN = 'https://booksnexus-back.onrender.com';
  const DB_KEY = 'booksnexus_local_backend_v2';
  const LEGACY_DB_KEY = 'booksnexus.local.v1';

  const realFetch = window.fetch.bind(window);

  const seedBooks = [
    {
      openLibraryKey: 'OL82563W',
      title: "Harry Potter and the Philosopher's Stone",
      authors: ['J. K. Rowling'],
      firstPublishYear: 1997,
      coverUrl: 'https://covers.openlibrary.org/b/id/10521270-M.jpg',
      categories: ['fantasy', 'young_adult'],
      description: 'Una historia de magia, amistad y descubrimiento.',
    },
    {
      openLibraryKey: 'OL27448W',
      title: 'The Hobbit',
      authors: ['J. R. R. Tolkien'],
      firstPublishYear: 1937,
      coverUrl: 'https://covers.openlibrary.org/b/id/6979861-M.jpg',
      categories: ['fantasy', 'adventure'],
      description: 'Bilbo Baggins sale de la Comarca hacia una aventura inesperada.',
    },
    {
      openLibraryKey: 'OL1168007W',
      title: 'Dune',
      authors: ['Frank Herbert'],
      firstPublishYear: 1965,
      coverUrl: 'https://covers.openlibrary.org/b/id/8100927-M.jpg',
      categories: ['science_fiction', 'politics'],
      description: 'Poder, ecologia y destino en el planeta Arrakis.',
    },
    {
      openLibraryKey: 'OL362427W',
      title: 'Fahrenheit 451',
      authors: ['Ray Bradbury'],
      firstPublishYear: 1953,
      coverUrl: 'https://covers.openlibrary.org/b/id/12749852-M.jpg',
      categories: ['science_fiction', 'dystopia'],
      description: 'Una sociedad donde los libros arden y la memoria resiste.',
    },
    {
      openLibraryKey: 'OL45804W',
      title: 'The Name of the Rose',
      authors: ['Umberto Eco'],
      firstPublishYear: 1980,
      coverUrl: 'https://covers.openlibrary.org/b/id/8231990-M.jpg',
      categories: ['mystery', 'history'],
      description: 'Un misterio medieval dentro de una abadia llena de secretos.',
    },
    {
      openLibraryKey: 'OL15358691W',
      title: 'Pride and Prejudice',
      authors: ['Jane Austen'],
      firstPublishYear: 1813,
      coverUrl: 'https://covers.openlibrary.org/b/id/8231856-M.jpg',
      categories: ['romance', 'classic'],
      description: 'Orgullo, prejuicio y una mirada aguda a las relaciones sociales.',
    },
  ];

  window.fetch = async function localFetch(input, init = {}) {
    const urlText = typeof input === 'string' ? input : input?.url;
    const url = new URL(urlText, window.location.href);

    if (url.origin !== API_ORIGIN || !url.pathname.startsWith('/api/')) {
      return realFetch(input, init);
    }

    try {
      const db = loadDb();
      const result = await routeRequest(db, url, init || {});
      saveDb(db);
      return jsonResponse(result.body, result.status || 200);
    } catch (error) {
      return jsonResponse({ error: error.message || 'Local API error' }, error.status || 500);
    }
  };

  function loadDb() {
    const stored = readJson(DB_KEY);
    const db = stored && stored.version === 2 ? stored : createDb();
    migratePreviousLocalDb(db);
    migrateSessionUser(db);
    seedBooks.forEach((book) => upsertBook(db, book));
    saveDb(db);
    return db;
  }

  function createDb() {
    return {
      version: 2,
      counters: {
        user: 2,
        favorite: 0,
        reading: 0,
        review: 2,
        list: 0,
        follow: 0,
      },
      users: [
        {
          id_usuario: 1,
          nombre: 'Ana Torres',
          username: 'ana_lee',
          correo: 'ana.local@booksnexus.test',
          passwordHash: '',
          biografia: 'Lectora de fantasia y misterio.',
          avatar_url: '',
          created_at: new Date('2026-01-12T10:00:00.000Z').toISOString(),
          sample: true,
        },
        {
          id_usuario: 2,
          nombre: 'Luis Mendoza',
          username: 'luislibros',
          correo: 'luis.local@booksnexus.test',
          passwordHash: '',
          biografia: 'Ciencia ficcion, clasicos y cafe.',
          avatar_url: '',
          created_at: new Date('2026-02-18T10:00:00.000Z').toISOString(),
          sample: true,
        },
      ],
      books: {},
      favorites: [],
      reading: [],
      reviews: [
        {
          id_resena: 1,
          id_usuario: 1,
          openLibraryKey: 'OL27448W',
          comentario: 'Aventura compacta, calida y muy facil de recomendar.',
          calificacion: 5,
          created_at: new Date('2026-05-04T16:00:00.000Z').toISOString(),
        },
        {
          id_resena: 2,
          id_usuario: 2,
          openLibraryKey: 'OL1168007W',
          comentario: 'La construccion politica y ecologica sigue sintiendose enorme.',
          calificacion: 5,
          created_at: new Date('2026-05-18T16:00:00.000Z').toISOString(),
        },
      ],
      lists: [],
      listBooks: [],
      follows: [],
    };
  }

  function migratePreviousLocalDb(db) {
    const legacy = readJson(LEGACY_DB_KEY);
    if (!legacy || legacy.__migratedToBackendV2) {
      return;
    }

    const userIdMap = new Map();
    (legacy.users || []).forEach((oldUser) => {
      let user = db.users.find((item) => item.username === oldUser.username || item.correo === oldUser.email);
      if (!user) {
        user = {
          id_usuario: nextId(db, 'user'),
          nombre: oldUser.nombre || oldUser.username || 'Usuario local',
          username: oldUser.username || `usuario_${Date.now()}`,
          correo: oldUser.email || `${oldUser.username || 'usuario'}@local.test`,
          passwordHash: oldUser.passwordHash || '',
          biografia: oldUser.biografia || '',
          avatar_url: oldUser.avatarUrl || '',
          created_at: oldUser.createdAt || new Date().toISOString(),
          sample: false,
        };
        db.users.push(user);
      }
      userIdMap.set(oldUser.id, user.id_usuario);
    });

    Object.values(legacy.books || {}).forEach((book) => {
      upsertBook(db, legacyBookToBook(book));
    });

    (legacy.favorites || []).forEach((favorite) => {
      const idUsuario = userIdMap.get(favorite.userId);
      if (!idUsuario) return;
      addFavorite(db, idUsuario, favorite.bookKey);
    });

    (legacy.reading || []).forEach((reading) => {
      const idUsuario = userIdMap.get(reading.userId);
      if (!idUsuario) return;
      upsertReading(db, idUsuario, reading.bookKey, {
        estadoLectura: reading.estado || 'leyendo',
        progresoPaginas: 0,
      });
    });

    (legacy.reviews || []).forEach((review) => {
      const idUsuario = userIdMap.get(review.userId);
      if (!idUsuario) return;
      upsertReview(db, idUsuario, review.bookKey, {
        comentario: review.comentario || 'Resena local',
        calificacion: Number(review.calificacion) || 5,
      });
    });

    const listIdMap = new Map();
    (legacy.lists || []).forEach((oldList) => {
      const idUsuario = userIdMap.get(oldList.userId);
      if (!idUsuario) return;
      const list = {
        id_lista: nextId(db, 'list'),
        id_usuario: idUsuario,
        nombre_lista: oldList.nombre || 'Lista local',
        descripcion: oldList.descripcion || '',
        privacidad: oldList.publica === false ? 'privada' : 'publica',
        created_at: oldList.createdAt || new Date().toISOString(),
      };
      db.lists.push(list);
      listIdMap.set(oldList.id, list.id_lista);
    });

    (legacy.listBooks || []).forEach((item) => {
      const idLista = listIdMap.get(item.listId);
      if (!idLista) return;
      addBookToList(db, idLista, item.bookKey);
    });

    (legacy.follows || []).forEach((follow) => {
      const followerId = userIdMap.get(follow.followerId);
      const followingId = userIdMap.get(follow.followingId);
      if (followerId && followingId && followerId !== followingId) {
        addFollow(db, followerId, followingId);
      }
    });

    legacy.__migratedToBackendV2 = true;
    localStorage.setItem(LEGACY_DB_KEY, JSON.stringify(legacy));
  }

  function migrateSessionUser(db) {
    const storedUser = readJson('booksnexus_user');
    if (!storedUser || !storedUser.username) {
      return;
    }

    const existing = db.users.find((user) => user.username === storedUser.username || user.correo === storedUser.correo);
    if (!existing) {
      db.users.push({
        id_usuario: Number(storedUser.id_usuario) || nextId(db, 'user'),
        nombre: storedUser.nombre || storedUser.username,
        username: storedUser.username,
        correo: storedUser.correo || storedUser.email || `${storedUser.username}@local.test`,
        passwordHash: storedUser.passwordHash || '',
        biografia: storedUser.biografia || '',
        avatar_url: storedUser.avatar_url || storedUser.avatarUrl || '',
        created_at: new Date().toISOString(),
        sample: false,
      });
    }
  }

  async function routeRequest(db, url, init) {
    const method = (init.method || 'GET').toUpperCase();
    const path = url.pathname;
    const body = await parseBody(init);
    const user = getUserFromRequest(db, init);

    if (path === '/api/auth/register' && method === 'POST') {
      return register(db, body);
    }
    if (path === '/api/auth/login' && method === 'POST') {
      return login(db, body);
    }
    if (path === '/api/auth/me') {
      requireUser(user);
      if (method === 'GET') return ok({ user: publicUser(db, user) });
      if (method === 'PATCH') return updateMe(db, user, body);
      if (method === 'DELETE') return deleteMe(db, user);
    }

    if (path === '/api/books/search' && method === 'GET') {
      return searchBooks(db, url);
    }
    if (path === '/api/books/authors' && method === 'GET') {
      return ok({ data: listAuthors(db) });
    }
    if (path.startsWith('/api/books/') && method === 'GET') {
      const key = decodeURIComponent(path.replace('/api/books/', ''));
      return ok({ data: getBookDetail(db, key) });
    }

    if (path === '/api/favorites') {
      requireUser(user);
      if (method === 'GET') return ok({ data: favoritesForUser(db, user.id_usuario) });
      if (method === 'POST') {
        const book = normalizePayloadBook(body);
        upsertBook(db, book);
        addFavorite(db, user.id_usuario, book.openLibraryKey);
        return ok({ data: favoritesForUser(db, user.id_usuario) });
      }
    }
    if (path.startsWith('/api/favorites/') && method === 'DELETE') {
      requireUser(user);
      const key = decodeURIComponent(path.replace('/api/favorites/', ''));
      db.favorites = db.favorites.filter((favorite) => {
        return !(favorite.id_usuario === user.id_usuario && cleanKey(favorite.openLibraryKey) === cleanKey(key));
      });
      return ok({ data: favoritesForUser(db, user.id_usuario) });
    }

    if (path === '/api/library/me' && method === 'GET') {
      requireUser(user);
      return ok({ data: libraryForUser(db, user.id_usuario) });
    }
    if (path === '/api/library/community' && method === 'GET') {
      return ok({ data: communityData(db) });
    }
    if (path === '/api/library/users' && method === 'GET') {
      return ok({ data: searchUsers(db, url.searchParams.get('q') || '') });
    }
    if (path.match(/^\/api\/library\/users\/[^/]+$/) && method === 'GET') {
      const idUsuario = Number(path.split('/').pop());
      return ok({ data: publicProfile(db, idUsuario, user?.id_usuario) });
    }
    if (path.match(/^\/api\/library\/users\/[^/]+\/follow$/)) {
      requireUser(user);
      const idUsuario = Number(path.split('/').at(-2));
      if (method === 'POST') addFollow(db, user.id_usuario, idUsuario);
      if (method === 'DELETE') removeFollow(db, user.id_usuario, idUsuario);
      return ok({ data: publicProfile(db, idUsuario, user.id_usuario) });
    }
    if (path.match(/^\/api\/library\/users\/[^/]+\/follower$/) && method === 'DELETE') {
      requireUser(user);
      const idUsuario = Number(path.split('/').at(-2));
      removeFollow(db, idUsuario, user.id_usuario);
      return ok({ data: libraryForUser(db, user.id_usuario) });
    }

    if (path === '/api/library/reading' && method === 'POST') {
      requireUser(user);
      const book = normalizePayloadBook(body.book);
      upsertBook(db, book);
      upsertReading(db, user.id_usuario, book.openLibraryKey, body);
      return ok({ data: libraryForUser(db, user.id_usuario) });
    }
    if (path.startsWith('/api/library/reading/') && (method === 'PATCH' || method === 'DELETE')) {
      requireUser(user);
      const target = decodeURIComponent(path.replace('/api/library/reading/', '').replace(/^books\//, ''));
      if (method === 'PATCH') updateReading(db, user.id_usuario, target, body);
      if (method === 'DELETE') deleteReading(db, user.id_usuario, target);
      return ok({ data: libraryForUser(db, user.id_usuario) });
    }

    if (path === '/api/library/reviews' && method === 'POST') {
      requireUser(user);
      const book = normalizePayloadBook(body.book);
      upsertBook(db, book);
      upsertReview(db, user.id_usuario, book.openLibraryKey, body);
      return ok({ data: libraryForUser(db, user.id_usuario) });
    }
    if (path.match(/^\/api\/library\/reviews\/[^/]+$/) && (method === 'PATCH' || method === 'DELETE')) {
      requireUser(user);
      const idResena = Number(path.split('/').pop());
      if (method === 'PATCH') updateReview(db, user.id_usuario, idResena, body);
      if (method === 'DELETE') deleteReview(db, user.id_usuario, idResena);
      return ok({ data: libraryForUser(db, user.id_usuario) });
    }

    if (path === '/api/library/lists' && method === 'POST') {
      requireUser(user);
      createList(db, user.id_usuario, body);
      return ok({ data: libraryForUser(db, user.id_usuario) });
    }
    if (path.match(/^\/api\/library\/lists\/[^/]+$/) && (method === 'PATCH' || method === 'DELETE')) {
      requireUser(user);
      const idLista = Number(path.split('/').pop());
      if (method === 'PATCH') updateList(db, user.id_usuario, idLista, body);
      if (method === 'DELETE') deleteList(db, user.id_usuario, idLista);
      return ok({ data: libraryForUser(db, user.id_usuario) });
    }
    if (path.match(/^\/api\/library\/lists\/[^/]+\/books$/) && method === 'POST') {
      requireUser(user);
      const idLista = Number(path.split('/').at(-2));
      const book = normalizePayloadBook(body.book);
      upsertBook(db, book);
      addBookToList(db, idLista, book.openLibraryKey, user.id_usuario);
      return ok({ data: libraryForUser(db, user.id_usuario) });
    }
    if (path.match(/^\/api\/library\/lists\/[^/]+\/books\/.+$/) && method === 'DELETE') {
      requireUser(user);
      const parts = path.split('/');
      const idLista = Number(parts.at(-3));
      const key = decodeURIComponent(parts.at(-1));
      removeBookFromList(db, idLista, key, user.id_usuario);
      return ok({ data: libraryForUser(db, user.id_usuario) });
    }

    throw httpError('Ruta local no implementada: ' + path, 404);
  }

  async function register(db, payload) {
    const nombre = stripText(payload.nombre, 100);
    const username = stripText(payload.username, 40).toLowerCase();
    const correo = stripText(payload.correo, 120).toLowerCase();
    const password = String(payload.password || '');

    if (nombre.length < 2) throw httpError('Name must be at least 2 characters', 400);
    if (!/^[a-z0-9_]{3,40}$/.test(username)) {
      throw httpError('Username must be 3-40 characters and use letters, numbers or underscore', 400);
    }
    if (!correo.includes('@')) throw httpError('A valid email is required', 400);
    if (password.length < 8) throw httpError('Password must be at least 8 characters', 400);
    if (db.users.some((user) => user.username === username || user.correo === correo)) {
      throw httpError('Username or email already exists', 409);
    }

    const user = {
      id_usuario: nextId(db, 'user'),
      nombre,
      username,
      correo,
      passwordHash: await hashPassword(password),
      biografia: '',
      avatar_url: '',
      created_at: new Date().toISOString(),
      sample: false,
    };
    db.users.push(user);
    return ok(authPayload(db, user));
  }

  async function login(db, payload) {
    const identity = stripText(payload.usuario, 120).toLowerCase();
    const passwordHash = await hashPassword(payload.password || '');
    const user = db.users.find((item) => {
      const matchesIdentity = item.username === identity || item.correo === identity;
      const matchesPassword = item.passwordHash ? item.passwordHash === passwordHash : item.sample;
      return matchesIdentity && matchesPassword;
    });

    if (!user) {
      throw httpError('Invalid username or password', 401);
    }

    return ok(authPayload(db, user));
  }

  function updateMe(db, user, payload) {
    const username = stripText(payload.username, 40).toLowerCase();
    const correo = stripText(payload.correo, 120).toLowerCase();
    const taken = db.users.some((item) => {
      return item.id_usuario !== user.id_usuario && (item.username === username || item.correo === correo);
    });
    if (taken) throw httpError('Username or email already exists', 409);

    Object.assign(user, {
      nombre: stripText(payload.nombre, 100),
      username,
      correo,
      biografia: stripText(payload.biografia, 500),
      avatar_url: stripText(payload.avatarUrl, 300),
    });
    return ok(authPayload(db, user));
  }

  function deleteMe(db, user) {
    const idUsuario = user.id_usuario;
    db.users = db.users.filter((item) => item.id_usuario !== idUsuario);
    db.favorites = db.favorites.filter((item) => item.id_usuario !== idUsuario);
    db.reading = db.reading.filter((item) => item.id_usuario !== idUsuario);
    db.reviews = db.reviews.filter((item) => item.id_usuario !== idUsuario);
    const listIds = db.lists.filter((item) => item.id_usuario === idUsuario).map((item) => item.id_lista);
    db.lists = db.lists.filter((item) => item.id_usuario !== idUsuario);
    db.listBooks = db.listBooks.filter((item) => !listIds.includes(item.id_lista));
    db.follows = db.follows.filter((item) => item.follower_id !== idUsuario && item.following_id !== idUsuario);
    return ok({ ok: true });
  }

  async function searchBooks(db, url) {
    const query = stripText(url.searchParams.get('q') || '', 120);
    const subject = stripText(url.searchParams.get('subject') || url.searchParams.get('category') || '', 80);
    let books = [];

    if (query || subject) {
      try {
        const params = new URLSearchParams({ q: query || subject || 'books', limit: '20' });
        if (subject) params.set('subject', subject);
        const response = await realFetch(`https://openlibrary.org/search.json?${params.toString()}`);
        const payload = await response.json();
        books = (payload.docs || []).slice(0, 18).map(openLibraryToBook).filter(Boolean);
      } catch (error) {
        books = [];
      }
    }

    if (!books.length) {
      const term = `${query} ${subject}`.trim().toLowerCase();
      books = Object.values(db.books).filter((book) => {
        const haystack = `${book.title} ${(book.authors || []).join(' ')} ${(book.categories || []).join(' ')}`.toLowerCase();
        return !term || haystack.includes(term);
      });
    }

    books.forEach((book) => upsertBook(db, book));
    return ok({ data: books.slice(0, 18) });
  }

  function openLibraryToBook(doc) {
    const key = String(doc.key || '').replace('/works/', '');
    if (!key || !doc.title) return null;
    return {
      openLibraryKey: key,
      title: doc.title,
      authors: (doc.author_name || ['Autor desconocido']).slice(0, 3),
      firstPublishYear: Number(doc.first_publish_year) || 0,
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
      categories: (doc.subject || []).slice(0, 6),
      description: (doc.first_sentence || [])[0] || 'Detalle guardado localmente.',
    };
  }

  function getBookDetail(db, key) {
    const book = db.books[cleanKey(key)] || seedBooks.find((item) => cleanKey(item.openLibraryKey) === cleanKey(key));
    return {
      title: book?.title || 'Libro',
      description: book?.description || 'Detalle disponible en la base local.',
      subjects: book?.categories || [],
      firstPublishDate: book?.firstPublishYear || '',
    };
  }

  function normalizePayloadBook(book = {}) {
    return {
      openLibraryKey: cleanKey(book.openLibraryKey || book.id || book.key || book.workKey),
      title: book.title || book.titulo || 'Libro sin titulo',
      authors: Array.isArray(book.authors) ? book.authors : toArray(book.author || book.autores),
      firstPublishYear: Number(book.firstPublishYear || book.year || book.anio) || 0,
      coverUrl: book.coverUrl || book.cover_url || '',
      categories: toArray(book.categories || book.subjects || book.categorias),
      description: book.description || '',
    };
  }

  function legacyBookToBook(book = {}) {
    return normalizePayloadBook({
      openLibraryKey: book.key,
      title: book.title,
      authors: book.author ? [book.author] : book.authors,
      firstPublishYear: book.year,
      coverUrl: book.coverId ? `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg` : book.coverUrl,
      categories: book.subjects,
      description: book.description,
    });
  }

  function upsertBook(db, rawBook) {
    const book = normalizePayloadBook(rawBook);
    if (!book.openLibraryKey) return null;
    db.books[cleanKey(book.openLibraryKey)] = {
      ...(db.books[cleanKey(book.openLibraryKey)] || {}),
      ...book,
      openLibraryKey: cleanKey(book.openLibraryKey),
    };
    return db.books[cleanKey(book.openLibraryKey)];
  }

  function addFavorite(db, idUsuario, key) {
    const clean = cleanKey(key);
    if (!db.favorites.some((item) => item.id_usuario === idUsuario && cleanKey(item.openLibraryKey) === clean)) {
      db.favorites.unshift({
        id_favorito: nextId(db, 'favorite'),
        id_usuario: idUsuario,
        openLibraryKey: clean,
        created_at: new Date().toISOString(),
      });
    }
  }

  function favoritesForUser(db, idUsuario) {
    return db.favorites
      .filter((favorite) => favorite.id_usuario === idUsuario)
      .map((favorite) => bookForView(db, favorite.openLibraryKey))
      .filter(Boolean);
  }

  function upsertReading(db, idUsuario, key, payload) {
    const clean = cleanKey(key);
    const existing = db.reading.find((item) => item.id_usuario === idUsuario && cleanKey(item.openLibraryKey) === clean);
    if (existing) {
      existing.estado_lectura = payload.estadoLectura || existing.estado_lectura;
      existing.progreso_paginas = Number(payload.progresoPaginas || 0);
      existing.updated_at = new Date().toISOString();
      return;
    }
    db.reading.unshift({
      id_historial: nextId(db, 'reading'),
      id_usuario: idUsuario,
      openLibraryKey: clean,
      estado_lectura: payload.estadoLectura || 'leyendo',
      progreso_paginas: Number(payload.progresoPaginas || 0),
      created_at: new Date().toISOString(),
    });
  }

  function updateReading(db, idUsuario, target, payload) {
    const reading = db.reading.find((item) => {
      return item.id_usuario === idUsuario && (String(item.id_historial) === String(target) || cleanKey(item.openLibraryKey) === cleanKey(target));
    });
    if (!reading) throw httpError('Reading entry not found', 404);
    reading.estado_lectura = payload.estadoLectura || reading.estado_lectura;
    reading.progreso_paginas = Number(payload.progresoPaginas || 0);
    reading.updated_at = new Date().toISOString();
  }

  function deleteReading(db, idUsuario, target) {
    db.reading = db.reading.filter((item) => {
      return !(item.id_usuario === idUsuario && (String(item.id_historial) === String(target) || cleanKey(item.openLibraryKey) === cleanKey(target)));
    });
  }

  function upsertReview(db, idUsuario, key, payload) {
    const clean = cleanKey(key);
    const existing = db.reviews.find((item) => item.id_usuario === idUsuario && cleanKey(item.openLibraryKey) === clean);
    if (existing) {
      existing.comentario = stripText(payload.comentario, 1000);
      existing.calificacion = Number(payload.calificacion) || 5;
      existing.updated_at = new Date().toISOString();
      return;
    }
    db.reviews.unshift({
      id_resena: nextId(db, 'review'),
      id_usuario: idUsuario,
      openLibraryKey: clean,
      comentario: stripText(payload.comentario, 1000),
      calificacion: Number(payload.calificacion) || 5,
      created_at: new Date().toISOString(),
    });
  }

  function updateReview(db, idUsuario, idResena, payload) {
    const review = db.reviews.find((item) => item.id_usuario === idUsuario && item.id_resena === idResena);
    if (!review) throw httpError('Review not found', 404);
    review.comentario = stripText(payload.comentario, 1000);
    review.calificacion = Number(payload.calificacion) || 5;
    review.updated_at = new Date().toISOString();
  }

  function deleteReview(db, idUsuario, idResena) {
    db.reviews = db.reviews.filter((item) => !(item.id_usuario === idUsuario && item.id_resena === idResena));
  }

  function createList(db, idUsuario, payload) {
    db.lists.unshift({
      id_lista: nextId(db, 'list'),
      id_usuario: idUsuario,
      nombre_lista: stripText(payload.nombreLista, 100),
      descripcion: stripText(payload.descripcion, 500),
      privacidad: payload.privacidad === 'privada' ? 'privada' : 'publica',
      created_at: new Date().toISOString(),
    });
  }

  function updateList(db, idUsuario, idLista, payload) {
    const list = db.lists.find((item) => item.id_usuario === idUsuario && item.id_lista === idLista);
    if (!list) throw httpError('List not found', 404);
    list.nombre_lista = stripText(payload.nombreLista, 100);
    list.descripcion = stripText(payload.descripcion, 500);
    list.privacidad = payload.privacidad === 'privada' ? 'privada' : 'publica';
  }

  function deleteList(db, idUsuario, idLista) {
    db.lists = db.lists.filter((item) => !(item.id_usuario === idUsuario && item.id_lista === idLista));
    db.listBooks = db.listBooks.filter((item) => item.id_lista !== idLista);
  }

  function addBookToList(db, idLista, key, idUsuario = null) {
    const list = db.lists.find((item) => item.id_lista === idLista && (!idUsuario || item.id_usuario === idUsuario));
    if (!list) throw httpError('List not found', 404);
    const clean = cleanKey(key);
    if (!db.listBooks.some((item) => item.id_lista === idLista && cleanKey(item.openLibraryKey) === clean)) {
      db.listBooks.push({ id_lista: idLista, openLibraryKey: clean, created_at: new Date().toISOString() });
    }
  }

  function removeBookFromList(db, idLista, key, idUsuario) {
    const list = db.lists.find((item) => item.id_lista === idLista && item.id_usuario === idUsuario);
    if (!list) throw httpError('List not found', 404);
    db.listBooks = db.listBooks.filter((item) => !(item.id_lista === idLista && cleanKey(item.openLibraryKey) === cleanKey(key)));
  }

  function libraryForUser(db, idUsuario) {
    const reading = db.reading
      .filter((item) => item.id_usuario === idUsuario)
      .map((item) => ({ ...item, ...bookNameFields(db, item.openLibraryKey), openlibrary_key: item.openLibraryKey }));
    const reviews = db.reviews
      .filter((item) => item.id_usuario === idUsuario)
      .map((item) => ({ ...item, ...bookNameFields(db, item.openLibraryKey), openlibrary_key: item.openLibraryKey }));
    const lists = db.lists
      .filter((item) => item.id_usuario === idUsuario)
      .map((list) => listForView(db, list));
    const followers = db.follows
      .filter((follow) => follow.following_id === idUsuario)
      .map((follow) => userStats(db, follow.follower_id));
    const following = db.follows
      .filter((follow) => follow.follower_id === idUsuario)
      .map((follow) => userStats(db, follow.following_id));
    return { reading, reviews, lists, followers, following };
  }

  function communityData(db) {
    const recentReviews = db.reviews
      .slice()
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
      .slice(0, 12)
      .map((review) => ({ ...review, ...bookNameFields(db, review.openLibraryKey), ...userStats(db, review.id_usuario) }));
    const activeUsers = db.users.map((user) => userStats(db, user.id_usuario));
    const popularBooks = Object.values(db.books)
      .map((book) => ({
        titulo: book.title,
        total_resenas: db.reviews.filter((review) => cleanKey(review.openLibraryKey) === cleanKey(book.openLibraryKey)).length,
        total_favoritos: db.favorites.filter((favorite) => cleanKey(favorite.openLibraryKey) === cleanKey(book.openLibraryKey)).length,
      }))
      .sort((a, b) => (b.total_resenas + b.total_favoritos) - (a.total_resenas + a.total_favoritos))
      .slice(0, 5);
    return {
      stats: {
        total_resenas: db.reviews.length,
        lectores_activos: activeUsers.length,
      },
      recentReviews,
      popularBooks,
      activeUsers,
    };
  }

  function searchUsers(db, query) {
    const term = stripText(query, 80).toLowerCase();
    return db.users
      .filter((user) => {
        const text = `${user.nombre} ${user.username} ${user.correo}`.toLowerCase();
        return !term || text.includes(term);
      })
      .map((user) => userStats(db, user.id_usuario));
  }

  function publicProfile(db, idUsuario, viewerId) {
    const user = db.users.find((item) => item.id_usuario === idUsuario);
    if (!user) throw httpError('User not found', 404);
    const library = libraryForUser(db, idUsuario);
    const following = db.follows.some((follow) => follow.follower_id === viewerId && follow.following_id === idUsuario);
    return {
      user: {
        ...publicUser(db, user),
        ...userStats(db, idUsuario),
        is_following: following,
      },
      lists: library.lists.filter((list) => list.privacidad === 'publica'),
      reading: library.reading,
      reviews: library.reviews,
      followers: library.followers,
      following: library.following,
    };
  }

  function listForView(db, list) {
    const books = db.listBooks
      .filter((item) => item.id_lista === list.id_lista)
      .map((item) => bookForView(db, item.openLibraryKey))
      .filter(Boolean);
    return {
      ...list,
      total_libros: books.length,
      books,
    };
  }

  function bookForView(db, key) {
    const book = db.books[cleanKey(key)];
    if (!book) return null;
    return {
      openLibraryKey: book.openLibraryKey,
      title: book.title,
      titulo: book.title,
      authors: book.authors || [],
      firstPublishYear: book.firstPublishYear || 0,
      coverUrl: book.coverUrl || '',
      categories: book.categories || [],
    };
  }

  function bookNameFields(db, key) {
    const book = bookForView(db, key) || {};
    return {
      titulo: book.title || 'Libro sin titulo',
      title: book.title || 'Libro sin titulo',
      authors: book.authors || [],
      coverUrl: book.coverUrl || '',
      firstPublishYear: book.firstPublishYear || 0,
    };
  }

  function userStats(db, idUsuario) {
    const user = db.users.find((item) => item.id_usuario === idUsuario);
    if (!user) return {};
    return {
      ...publicUser(db, user),
      total_resenas: db.reviews.filter((review) => review.id_usuario === idUsuario).length,
      total_favoritos: db.favorites.filter((favorite) => favorite.id_usuario === idUsuario).length,
      public_lists: db.lists.filter((list) => list.id_usuario === idUsuario && list.privacidad === 'publica').length,
      followers: db.follows.filter((follow) => follow.following_id === idUsuario).length,
      following: db.follows.filter((follow) => follow.follower_id === idUsuario).length,
    };
  }

  function publicUser(db, user) {
    return {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      username: user.username,
      correo: user.correo,
      biografia: user.biografia || '',
      avatar_url: user.avatar_url || '',
      followers: db.follows.filter((follow) => follow.following_id === user.id_usuario).length,
      following: db.follows.filter((follow) => follow.follower_id === user.id_usuario).length,
    };
  }

  function authPayload(db, user) {
    const publicData = publicUser(db, user);
    localStorage.setItem('booksnexus_user', JSON.stringify(publicData));
    localStorage.setItem('booksnexus_token', tokenFor(user));
    return {
      token: tokenFor(user),
      user: publicData,
    };
  }

  function getUserFromRequest(db, init) {
    const headers = new Headers(init.headers || {});
    const token = (headers.get('Authorization') || '').replace(/^Bearer\s+/i, '') || localStorage.getItem('booksnexus_token') || '';
    const match = token.match(/^local-token-(\d+)$/);
    if (!match) return null;
    return db.users.find((user) => user.id_usuario === Number(match[1])) || null;
  }

  function requireUser(user) {
    if (!user) throw httpError('Sesion no valida', 401);
  }

  function tokenFor(user) {
    return `local-token-${user.id_usuario}`;
  }

  function addFollow(db, followerId, followingId) {
    if (followerId === followingId) throw httpError('You cannot follow yourself', 400);
    if (!db.users.some((user) => user.id_usuario === followingId)) throw httpError('User not found', 404);
    if (!db.follows.some((follow) => follow.follower_id === followerId && follow.following_id === followingId)) {
      db.follows.push({ id_seguimiento: nextId(db, 'follow'), follower_id: followerId, following_id: followingId });
    }
  }

  function removeFollow(db, followerId, followingId) {
    db.follows = db.follows.filter((follow) => !(follow.follower_id === followerId && follow.following_id === followingId));
  }

  function listAuthors(db) {
    return [...new Set(Object.values(db.books).flatMap((book) => book.authors || []))].sort();
  }

  async function parseBody(init) {
    if (!init.body) return {};
    if (typeof init.body === 'string') return JSON.parse(init.body || '{}');
    return init.body;
  }

  async function hashPassword(password) {
    const source = `booksnexus:${password}`;
    if (window.crypto?.subtle) {
      const encoded = new TextEncoder().encode(source);
      const digest = await window.crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return `fallback-${(hash >>> 0).toString(16)}`;
  }

  function nextId(db, counter) {
    db.counters[counter] = Number(db.counters[counter] || 0) + 1;
    return db.counters[counter];
  }

  function cleanKey(key) {
    return String(key || '').replace('/works/', '');
  }

  function toArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  function stripText(value, maxLength) {
    return String(value || '')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, maxLength);
  }

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {
      return null;
    }
  }

  function saveDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function ok(body) {
    return { status: 200, body };
  }

  function httpError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  function jsonResponse(body, status) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
})();
