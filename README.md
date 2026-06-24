# BooksNexus Local

Frontend estatico/demo de BooksNexus en `Diegocstln/mi-proyecto-bd`, rama `erik`.

La pagina conserva los archivos visuales originales y usa `local-api.js` para responder localmente las rutas del backend. En esta version demo los datos se guardan en el navegador con `localStorage`.

## Links desplegados

- Frontend demo: https://diegocstln.github.io/mi-proyecto-bd/
- Backend Render: https://booksnexus-back.onrender.com
- Health check del backend: https://booksnexus-back.onrender.com/api/health

## GitHub Pages

Este frontend esta preparado para publicarse desde GitHub Pages con esta configuracion:

```txt
Source: Deploy from a branch
Branch: erik
Folder: /root
```

No requiere build ni dependencias de Node; `index.html`, `styles.css`, `app.js`, `admin.js`, `config.js`, `local-api.js` y `src/assets` se sirven directamente desde la rama.

## Abrir localmente

Usa:

```txt
http://127.0.0.1:8765/index.html
```

O abre `index.html` desde esta carpeta.

## Donde se guardan los datos

Los datos se guardan en el navegador, en `localStorage`, bajo estas claves:

- `booksnexus_local_backend_v2`: base local principal.
- `booksnexus_token`: sesion local.
- `booksnexus_user`: usuario activo.
- `booksnexus_saved`: favoritos marcados para la interfaz original.
- `booksnexus_theme`: tema claro/oscuro.

Si existia la base anterior `booksnexus.local.v1` en este mismo origen local, `local-api.js` la migra automaticamente.

## Limitacion del navegador

Un sitio en `127.0.0.1`, GitHub Pages o Render no puede leer automaticamente el `localStorage` que haya quedado guardado en otro origen, porque el navegador separa los datos por dominio. Para mover datos desde otro origen hay que exportarlos/importarlos manualmente.
