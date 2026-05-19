# BooksNexus Frontend

Frontend publico del proyecto BooksNexus para GitHub Pages.

## Objetivo

BooksNexus es una red social de libros. Este frontend consume la API privada del backend `booksnexus-back`.

## Pantallas conectadas

- Exploracion de libros con `GET /api/books/search`.
- Detalle de libro con `GET /api/books/:workKey`.
- Registro e inicio de sesion con `POST /api/auth/register` y `POST /api/auth/login`.
- Perfil autenticado con `GET /api/auth/me`.
- Edicion y eliminacion de perfil con `PATCH /api/auth/me` y `DELETE /api/auth/me`.
- CRUD de listas con `POST`, `GET`, `PATCH` y `DELETE /api/library/lists`.

## Desarrollo local

Abre `index.html` en el navegador o sirve la carpeta con cualquier servidor estatico.

La URL del backend se configura en `config.js`:

```js
window.BOOKSNEXUS_API_BASE_URL = 'https://booksnexus-back.onrender.com';
```

Cuando el backend este desplegado, cambia ese valor por la URL publica de la API.
