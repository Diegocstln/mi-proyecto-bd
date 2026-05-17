# BooksNexus Frontend

Frontend publico del proyecto BooksNexus para GitHub Pages.

## Objetivo

BooksNexus es una red social de libros. Este frontend consume la API privada del backend `booksnexus-back`.

## Desarrollo local

Abre `index.html` en el navegador o sirve la carpeta con cualquier servidor estatico.

La URL del backend se configura en `config.js`:

```js
window.BOOKSNEXUS_API_BASE_URL = 'http://localhost:3000';
```

Cuando el backend este desplegado, cambia ese valor por la URL publica de la API.
