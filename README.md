# BooksNexus

Frontend estatico de BooksNexus publicado desde `Diegocstln/mi-proyecto-bd`, rama `erik`.

La pagina se sirve con GitHub Pages y consume el backend real desplegado en Render mediante `config.js`:

```js
window.BOOKSNEXUS_API_BASE_URL = 'https://booksnexus-back.onrender.com';
```

## Links desplegados

- Frontend en GitHub Pages: https://diegocstln.github.io/mi-proyecto-bd/
- Backend/API en Render: https://booksnexus-back.onrender.com
- Health check del backend: https://booksnexus-back.onrender.com/api/health

## GitHub Pages

Este frontend esta preparado para publicarse desde GitHub Pages con esta configuracion:

```txt
Source: Deploy from a branch
Branch: erik
Folder: /root
```

No requiere build ni dependencias de Node; `index.html`, `styles.css`, `app.js`, `admin.js`, `config.js` y `src/assets` se sirven directamente desde la rama.

## Backend y datos

Los datos de usuarios, listas, favoritos y comunidad deben venir del backend de Render. Render debe tener configurada la misma `DATABASE_URL` de Supabase/Postgres que se quiera usar como base real.

El archivo `local-api.js` queda en el repositorio solo como respaldo para pruebas locales antiguas, pero no se carga en el HTML publicado.

## Abrir localmente

Usa:

```txt
http://127.0.0.1:8765/index.html
```

O abre `index.html` desde esta carpeta. Para que use datos reales, conserva `config.js` apuntando a `https://booksnexus-back.onrender.com` y no cargues `local-api.js`.
