# BooksNexus Local

Copia local del frontend `Diegocstln/mi-proyecto-bd`.

No modifica GitHub, Supabase, Render ni PostgreSQL. La pagina conserva los archivos visuales originales y usa `local-api.js` para responder localmente las rutas del backend.

## Abrir

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

Un sitio en `127.0.0.1` no puede leer automaticamente el `localStorage` que haya quedado guardado en GitHub Pages, porque el navegador separa los datos por origen. Para mover datos desde otro origen hay que exportarlos/importarlos manualmente.
