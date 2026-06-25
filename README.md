# BooksNexus


Hay dos enlaces publicados en GitHub Pages:

- Version conectada a Render/Supabase: https://diegocstln.github.io/mi-proyecto-bd/
- Version estatica localStorage: https://diegocstln.github.io/mi-proyecto-bd/?mode=local

La version conectada consume el backend real desplegado en Render mediante `config.js`:

```js
window.BOOKSNEXUS_API_BASE_URL = 'https://booksnexus-back.onrender.com';
```

La version `?mode=local` carga `local-api.js`, intercepta las llamadas a `/api/...` y guarda los datos en el navegador con `localStorage`. No usa Supabase ni la base de datos real.

## Links desplegados

- Frontend con backend real: https://diegocstln.github.io/mi-proyecto-bd/
- Frontend demo localStorage: https://diegocstln.github.io/mi-proyecto-bd/?mode=local
- Backend/API en Render: https://booksnexus-back.onrender.com
- Health check del backend: https://booksnexus-back.onrender.com/api/health

## GitHub Pages

Este frontend esta preparado para publicarse desde GitHub Pages con esta configuracion:

```txt
Source: Deploy from a branch
Branch: erik
Folder: /root
```

No requiere build ni dependencias de Node; `index.html`, `styles.css`, `app.js`, `admin.js`, `config.js`, `local-api.js` y `src/assets` se sirven directamente desde la rama.

## Backend y datos

La version normal usa Render. Render debe tener configurada la misma `DATABASE_URL` de Supabase/Postgres que se quiera usar como base real.

La version `?mode=local` guarda sus datos por dominio en el navegador. Si se borran los datos del navegador, tambien se borra esa demo local.

## Abrir localmente

Usa:

```txt
http://127.0.0.1:8765/index.html
```

Para probar la demo local:

```txt
http://127.0.0.1:8765/index.html?mode=local
```
