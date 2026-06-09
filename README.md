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

# 📚 Documentación BOOKSNEXUS
---
## Descripción de la problematica

Actualmente, existen múltiples plataformas para consultar información sobre libros, pero pocas permiten integrar la búsqueda de libros con una experiencia social entre lectores. Los usuarios pueden ver información básica de los libros, pero no pueden interactuar, compartir opiniones ni organizar sus lecturas de forma estructurada.

Esto provoca que muchos lectores gestionen sus libros leídos, pendientes o favoritos de manera desorganizada, utilizando notas, aplicaciones externas o redes sociales no especializadas, dificultando el seguimiento de su historial de lectura y la obtención de recomendaciones personalizadas.

Por esta razón surge la necesidad de una plataforma tipo red social de libros, donde los usuarios puedan buscar libros mediante la API de Open Library, registrar reseñas, calificar libros, crear listas personalizadas, guardar favoritos y llevar un historial de lectura organizado.

**BooksNexus** es una plataforma tipo red social orientada a lectores que combina la consulta de información bibliográfica con la interacción social entre usuarios. A diferencia de las aplicaciones tradicionales de gestión de libros, permite buscar obras mediante la API de Open Library, registrar reseñas y calificaciones, crear listas personalizadas, administrar favoritos y llevar un historial detallado de lectura.

---
## Objetivos

* Centralizar la gestión de información de libros y lectores.
* Facilitar la interacción social entre usuarios mediante reseñas y seguimiento de perfiles.
* Permitir la creación de listas personalizadas y favoritos.
* Llevar un control del progreso y estado de lectura de cada libro.
* Generar recomendaciones y estadísticas basadas en la actividad de los usuarios.
---

## 🗣️ Entrevista simulada (requerimientos)

**Consultor:** ¿Qué funcionalidades considera importantes para la plataforma?  
**Cliente:** Que los usuarios puedan buscar libros usando Open Library y guardarlos en su perfil.

**Consultor:** ¿Qué información debe almacenarse de los libros?  
**Cliente:** Título, autor, descripción, ISBN, fecha de publicación, portada y categorías.

**Consultor:** ¿Los usuarios interactuarán entre sí?  
**Cliente:** Sí, queremos una red social donde puedan seguirse, ver reseñas y descubrir libros.

**Consultor:** ¿Qué acciones puede hacer un usuario sobre un libro?  
**Cliente:** Calificar, reseñar, agregar a favoritos y crear listas como “Por leer” o “Favoritos”.

**Consultor:** ¿Se llevará control de lectura?  
**Cliente:** Sí, con estados como pendiente, leyendo o terminado.

**Consultor:** ¿Qué reportes se necesitan?  
**Cliente:** Libros mejor calificados, más populares, estadísticas de usuario y recomendaciones.

---
## 📋 Requerimientos del sistema

### 🗂️ Requerimientos de datos
- Usuarios registrados
- Libros desde Open Library
- Autores y categorías
- Reseñas y calificaciones
- Listas personalizadas
- Favoritos
- Historial de lectura
- Relaciones entre usuarios (seguimiento)
- Estadísticas de libros (promedio y número de reseñas)

---
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
<details>
<summary>🖼️ Modelo ERR Y RELACIONAL</summary>

| |
|---|
| <img loading = "lazy" width="800" src= "https://github.com/user-attachments/assets/73a56bd1-f394-4fb7-ad19-557c7d01933a" /> |
| <img loading="lazy" src="https://github.com/user-attachments/assets/30b1f2d7-19cf-4f52-800e-8856b40f06a6" width="800"/> | 

 
</details>

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
## Modelo EER (Entidad-Relación Extendido)

Durante la segunda etapa del diseño se amplió el modelo E-R tradicional utilizando conceptos avanzados del Modelo Entidad-Relación Extendido (EER).

### Mejoras incorporadas

* Cardinalidades mínimas y máximas para representar reglas de negocio específicas.
* Identificación de entidades con dependencia de existencia.
* Especialización de usuarios mediante herencia.
* Restricciones de participación total y parcial.
* Representación más precisa de las relaciones entre entidades.

### Jerarquía de especialización

La entidad **Usuario** fue modelada como supertipo y se especializó en:

#### Administrador

Encargado de la gestión general de la plataforma.

#### Lector

Representa a los usuarios que interactúan con los libros y la comunidad.

Atributos específicos:

La especialización fue definida como:

* **Disjunta (d):** un usuario solo puede pertenecer a un subtipo.
* **Parcial (p):** pueden existir usuarios sin pertenecer a un subtipo específico.

---

## Transformación al Modelo Relacional

A partir del modelo EER se realizó la transformación al modelo relacional, definiendo las tablas, claves primarias y claves foráneas necesarias para la implementación física de la base de datos.

### Tablas principales

* usuario
* libro
* autor
* categoria
* lista

### Tablas asociativas

* resena
* historial_lectura
* favorito

### Tablas para relaciones N:M

* libro_autor
* libro_categoria
* lista_libro
* seguimiento

### Características del modelo relacional

* Integridad referencial mediante claves foráneas.
* Restricciones de unicidad para evitar duplicados.
* Relaciones uno a muchos y muchos a muchos correctamente normalizadas.
* Preparación para implementación física en PostgreSQL.

---

### Características implementadas

#### Restricciones de dominio

* NOT NULL
* UNIQUE
* DEFAULT
* CHECK

#### Integridad referencial

Se implementaron claves foráneas con acciones referenciales utilizando:

```sql
ON DELETE CASCADE
ON UPDATE CASCADE
```

para mantener la consistencia de la información.

#### Índices

Se crearon índices para optimizar consultas frecuentes:

* idx_libro_titulo
* idx_resena_libro
* idx_historial_usuario
* idx_lista_usuario
* idx_seguimiento_seguido

---

## Seguridad y Control de Acceso

Se diseñó una estrategia de seguridad basada en roles.

### Roles definidos

| Rol                | Descripción                        |
| ------------------ | ---------------------------------- |
| Administrador      | Control total del sistema          |
| Usuario Registrado | Administración de contenido propio |
| Invitado           | Consulta de información pública    |

### Matriz de permisos

| Rol                | SELECT | INSERT | UPDATE | DELETE |
| ------------------ | ------ | ------ | ------ | ------ |
| Administrador      | ✅      | ✅      | ✅      | ✅      |
| Usuario Registrado | ✅      | ✅      | ✅      | ❌      |
| Invitado           | ✅      | ❌      | ❌      | ❌      |

---

## Validación e Integridad de Datos

Se realizaron pruebas para verificar el correcto funcionamiento de las restricciones y relaciones de la base de datos.

### Casos evaluados

* Inserción de calificaciones fuera del rango permitido.
* Inserción de correos duplicados.
* Estados de lectura inválidos.
* Eliminación de registros relacionados mediante CASCADE.
* Restricciones de seguimiento entre usuarios.
* Verificación de claves foráneas.
* Validación de permisos por rol.

Estas pruebas permitieron garantizar la consistencia, seguridad e integridad de la información almacenada en BooksNexus.

---

## Tecnologías Utilizadas

* **Backend:** Node.js con Express.js
* **Base de Datos:** PostgreSQL (Supabase)
* **Frontend: HTML:** CSS y JavaScript vanilla (Fetch API)
* **API Externa:** Open Library API
* **Despliegue:** Render y GitHub pages

## Resultados Esperados

BooksNexus proporciona una solución integral para la gestión de lecturas y la interacción entre lectores, permitiendo mantener un historial organizado, compartir experiencias de lectura y descubrir nuevos libros mediante recomendaciones personalizadas.

## Enlace a repositorio central
https://github.com/gabrielhuav/DB-Coursework-2026-2



