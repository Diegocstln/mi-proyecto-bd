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

# 📚 Documentación

## Descripción del Proyecto

**BooksNexus** es una plataforma tipo red social orientada a lectores que combina la consulta de información bibliográfica con la interacción social entre usuarios. A diferencia de las aplicaciones tradicionales de gestión de libros, permite buscar obras mediante la API de Open Library, registrar reseñas y calificaciones, crear listas personalizadas, administrar favoritos y llevar un historial detallado de lectura.

El proyecto surge de la necesidad de ofrecer un espacio donde los lectores puedan organizar sus libros, compartir opiniones y descubrir nuevas lecturas a través de recomendaciones y la actividad de otros usuarios.

## Objetivos

* Centralizar la gestión de información de libros y lectores.
* Facilitar la interacción social entre usuarios mediante reseñas y seguimiento de perfiles.
* Permitir la creación de listas personalizadas y favoritos.
* Llevar un control del progreso y estado de lectura de cada libro.
* Generar recomendaciones y estadísticas basadas en la actividad de los usuarios.

## Funcionalidades Principales

* Registro e inicio de sesión de usuarios.
* Búsqueda de libros mediante la API de Open Library.
* Gestión de perfiles de usuario.
* Publicación de reseñas y calificaciones.
* Creación y administración de listas personalizadas.
* Sistema de favoritos.
* Seguimiento del progreso de lectura.
* Relación de seguimiento entre usuarios.
* Consulta de libros populares y mejor valorados.
* Generación de recomendaciones basadas en preferencias de lectura.

## Modelo de Datos

La base de datos fue diseñada utilizando el modelo Entidad-Relación y posteriormente transformada a un esquema relacional en PostgreSQL.

### Entidades principales

* Usuario
* Libro
* Autor
* Categoría
* Lista
* Reseña
* Historial de Lectura
* Favorito
* Seguimiento

### Relaciones destacadas

* Libro ↔ Autor (N:M)
* Libro ↔ Categoría (N:M)
* Usuario ↔ Libro mediante Reseñas
* Usuario ↔ Libro mediante Historial de Lectura
* Usuario ↔ Libro mediante Favoritos
* Lista ↔ Libro (N:M)
* Usuario ↔ Usuario mediante Seguimiento (N:M)

## Tecnologías Utilizadas

* **Backend:** FastAPI
* **Base de Datos:** PostgreSQL
* **ORM:** SQLAlchemy
* **API Externa:** Open Library API

## Resultados Esperados

BooksNexus proporciona una solución integral para la gestión de lecturas y la interacción entre lectores, permitiendo mantener un historial organizado, compartir experiencias de lectura y descubrir nuevos libros mediante recomendaciones personalizadas.

