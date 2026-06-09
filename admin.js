/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         BOOKSNEXUS — MODO ADMINISTRADOR 🍫               ║
 * ║  Panel de control de chocolate: todos los cambios son    ║
 * ║  efímeros. Al recargar la página, todo vuelve a normal.  ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Activación: Ctrl + Shift + A  (o botón oculto en el footer)
 */

;(function BooksNexusAdmin() {
  'use strict';

  /* ─── Configuración ─────────────────────────────────────── */
  const API = window.BOOKSNEXUS_API_BASE_URL || 'https://booksnexus-back.onrender.com';
  const ADMIN_PASSWORD = 'booksnexus2026'; // ← cambia esto cuando quieras
  let adminAuthenticated = false;           // solo vive en memoria de sesión
  let adminActive = false;
  let adminIdCounter = 9000;
  let currentSection = 'inicio';

  /* ─── Estado local en memoria (de chocolate 🍫) ─────────── */
  const store = {
    usuarios:  [],   // copia mutable de usuarios del backend
    resenas:   [],   // copia mutable de reseñas de la comunidad
    libros:    [],   // libros cargados del estado global de app.js
    loading:   false,
    loaded:    false,
  };

  /* ─── Helpers ───────────────────────────────────────────── */
  function nextId() { return ++adminIdCounter; }

  function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function toast(msg, type = 'chocolate') {
    const el = document.createElement('div');
    el.className = `admin-toast admin-toast--${type}`;
    el.innerHTML = `
      <i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : type === 'chocolate' ? 'fa-cookie-bite' : 'fa-circle-check'}"></i>
      <span>${escHtml(msg)}</span>
    `;
    document.getElementById('admin-toast-area')?.appendChild(el);
    setTimeout(() => { el.classList.add('admin-toast--out'); setTimeout(() => el.remove(), 300); }, 3000);
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  }

  /* ─── Carga de datos reales (sólo GET) ──────────────────── */
  async function loadData() {
    if (store.loading) return;
    store.loading = true;
    setAdminContent('<div class="admin-loader"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Cargando datos reales...</p></div>');

    try {
      // Cargar usuarios (búsqueda vacía devuelve todos)
      const usersRes = await fetch(`${API}/api/library/users?q=`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        store.usuarios = (usersData.data || []).map(u => ({ ...u, _adminId: u.id_usuario }));
      }

      // Cargar comunidad (reseñas + libros populares)
      const commRes = await fetch(`${API}/api/library/community`);
      if (commRes.ok) {
        const commData = await commRes.json();
        store.resenas = (commData.data?.recentReviews || []).map(r => ({ ...r, _adminId: r.id_resena }));
      }

      store.loaded = true;
      toast('Datos reales cargados. Recuerda: los cambios son de chocolate 🍫');
    } catch (err) {
      toast('No se pudieron cargar todos los datos. ¿El backend está encendido?', 'error');
    } finally {
      store.loading = false;
    }

    renderSection(currentSection);
  }

  /* ─── Render del panel principal ────────────────────────── */
  function setAdminContent(html) {
    const el = document.getElementById('admin-content');
    if (el) el.innerHTML = html;
  }

  function renderSection(section) {
    currentSection = section;

    // Actualizar nav activo
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === section);
    });

    if (!store.loaded && section !== 'inicio') {
      loadData();
      return;
    }

    switch (section) {
      case 'inicio':     return renderHome();
      case 'usuarios':   return renderUsuarios();
      case 'resenas':    return renderResenas();
      case 'libros':     return renderLibros();
      default:           return renderHome();
    }
  }

  /* ─── Sección: Inicio ───────────────────────────────────── */
  function renderHome() {
    setAdminContent(`
      <div class="admin-home">
        <div class="admin-hero-badge">
          <i class="fa-solid fa-cookie-bite"></i>
          <span>Modo de chocolate activo</span>
        </div>
        <h2>Bienvenido al panel de control</h2>
        <p class="admin-subtitle">
          Aquí puedes crear, editar y eliminar usuarios, reseñas y libros.<br>
          <strong>Todos los cambios son temporales</strong> — al recargar la página todo vuelve al estado real.
        </p>

        <div class="admin-stat-grid">
          <div class="admin-stat-card">
            <i class="fa-solid fa-users"></i>
            <strong>${store.usuarios.length}</strong>
            <span>Usuarios</span>
          </div>
          <div class="admin-stat-card">
            <i class="fa-solid fa-star"></i>
            <strong>${store.resenas.length}</strong>
            <span>Reseñas visibles</span>
          </div>
          <div class="admin-stat-card">
            <i class="fa-solid fa-book"></i>
            <strong>${(window.__adminState?.books || []).length || '—'}</strong>
            <span>Libros en sesión</span>
          </div>
          <div class="admin-stat-card">
            <i class="fa-solid fa-cookie-bite"></i>
            <strong>100%</strong>
            <span>Chocolate</span>
          </div>
        </div>

        <div class="admin-info-box">
          <i class="fa-solid fa-circle-info"></i>
          <div>
            <strong>¿Cómo funciona?</strong>
            <p>Los datos se leen del backend real. Las operaciones (crear, editar, borrar) modifican solo la copia en memoria de este panel. El backend real no se toca.</p>
          </div>
        </div>

        <div class="admin-quick-actions">
          <button class="admin-btn admin-btn--primary" onclick="window.__adminPanel.goTo('usuarios')">
            <i class="fa-solid fa-users"></i> Gestionar usuarios
          </button>
          <button class="admin-btn admin-btn--secondary" onclick="window.__adminPanel.goTo('resenas')">
            <i class="fa-solid fa-star"></i> Gestionar reseñas
          </button>
        </div>
      </div>
    `);
  }

  /* ─── Sección: Usuarios ─────────────────────────────────── */
  function renderUsuarios() {
    const rows = store.usuarios.length
      ? store.usuarios.map(u => `
          <tr data-user-id="${u._adminId || u.id_usuario}">
            <td>${escHtml(u.id_usuario ?? u._adminId)}</td>
            <td>
              <div class="admin-user-cell">
                <div class="admin-mini-avatar">${escHtml((u.nombre || u.username || 'U')[0]).toUpperCase()}</div>
                <div>
                  <strong>${escHtml(u.nombre || '—')}</strong>
                  <span>@${escHtml(u.username)}</span>
                </div>
              </div>
            </td>
            <td>${escHtml(u.correo || '—')}</td>
            <td>
              <span class="admin-badge admin-badge--blue">
                ${escHtml(u.total_resenas ?? 0)} reseñas
              </span>
            </td>
            <td>
              <span class="admin-badge admin-badge--green">
                ${escHtml(u.total_favoritos ?? 0)} favs
              </span>
            </td>
            <td class="admin-actions-cell">
              <button class="admin-icon-btn admin-icon-btn--edit" title="Editar" onclick="window.__adminPanel.editUsuario(${u._adminId || u.id_usuario})">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="admin-icon-btn admin-icon-btn--delete" title="Eliminar" onclick="window.__adminPanel.deleteUsuario(${u._adminId || u.id_usuario})">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="6" class="admin-empty">Sin usuarios cargados. <button class="admin-link" onclick="window.__adminPanel.reload()">Recargar datos</button></td></tr>`;

    setAdminContent(`
      <div class="admin-section-header">
        <div>
          <h2><i class="fa-solid fa-users"></i> Usuarios</h2>
          <p>${store.usuarios.length} usuarios en memoria</p>
        </div>
        <button class="admin-btn admin-btn--primary" onclick="window.__adminPanel.createUsuario()">
          <i class="fa-solid fa-plus"></i> Nuevo usuario
        </button>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Reseñas</th>
              <th>Favs</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `);
  }

  /* ─── Sección: Reseñas ──────────────────────────────────── */
  function renderResenas() {
    const rows = store.resenas.length
      ? store.resenas.map(r => `
          <tr data-review-id="${r._adminId || r.id_resena}">
            <td>${escHtml(r.id_resena ?? r._adminId)}</td>
            <td>
              <div class="admin-user-cell">
                <div class="admin-mini-avatar" style="background:var(--admin-accent2)">${escHtml((r.nombre || r.username || 'U')[0]).toUpperCase()}</div>
                <span>@${escHtml(r.username || '—')}</span>
              </div>
            </td>
            <td><strong>${escHtml(r.titulo || '—')}</strong></td>
            <td>
              <div class="admin-stars">
                ${'★'.repeat(Number(r.calificacion) || 0)}${'☆'.repeat(5 - (Number(r.calificacion) || 0))}
                <span>${escHtml(r.calificacion)}/5</span>
              </div>
            </td>
            <td class="admin-comment-cell">${escHtml((r.comentario || '').slice(0, 60))}${(r.comentario || '').length > 60 ? '…' : ''}</td>
            <td class="admin-actions-cell">
              <button class="admin-icon-btn admin-icon-btn--edit" title="Editar" onclick="window.__adminPanel.editResena(${r._adminId || r.id_resena})">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="admin-icon-btn admin-icon-btn--delete" title="Eliminar" onclick="window.__adminPanel.deleteResena(${r._adminId || r.id_resena})">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="6" class="admin-empty">Sin reseñas cargadas. <button class="admin-link" onclick="window.__adminPanel.reload()">Recargar datos</button></td></tr>`;

    setAdminContent(`
      <div class="admin-section-header">
        <div>
          <h2><i class="fa-solid fa-star"></i> Reseñas</h2>
          <p>${store.resenas.length} reseñas en memoria</p>
        </div>
        <button class="admin-btn admin-btn--primary" onclick="window.__adminPanel.createResena()">
          <i class="fa-solid fa-plus"></i> Nueva reseña
        </button>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Libro</th>
              <th>Calificación</th>
              <th>Comentario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `);
  }

  /* ─── Sección: Libros (del estado global de app.js) ─────── */
  function renderLibros() {
    const libros = window.__adminState?.books || [];

    const rows = libros.length
      ? libros.map((b, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>
              <div class="admin-user-cell">
                ${b.coverUrl
                  ? `<img src="${escHtml(b.coverUrl)}" alt="" class="admin-book-thumb">`
                  : `<div class="admin-book-thumb-placeholder">${escHtml((b.title || 'L')[0])}</div>`
                }
                <strong>${escHtml(b.title || '—')}</strong>
              </div>
            </td>
            <td>${escHtml((b.authors || []).join(', ') || '—')}</td>
            <td>${escHtml(b.firstPublishYear || '—')}</td>
            <td><span class="admin-badge admin-badge--purple">${escHtml(b.id || '—')}</span></td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" class="admin-empty">Primero busca libros en el catálogo principal para verlos aquí.</td></tr>`;

    setAdminContent(`
      <div class="admin-section-header">
        <div>
          <h2><i class="fa-solid fa-book"></i> Libros en sesión</h2>
          <p>${libros.length} libros del último resultado de búsqueda</p>
        </div>
      </div>

      <div class="admin-info-box admin-info-box--warning">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>Esta sección muestra los libros cargados desde la búsqueda. Para ver más, regresa al catálogo y busca títulos.</div>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Título</th>
              <th>Autores</th>
              <th>Año</th>
              <th>OpenLibrary Key</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `);
  }

  /* ─── Modal genérico ────────────────────────────────────── */
  function showModal({ title, body, onConfirm }) {
    const existing = document.getElementById('admin-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'admin-modal';
    modal.className = 'admin-modal-backdrop';
    modal.innerHTML = `
      <div class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
        <div class="admin-modal-header">
          <h3 id="admin-modal-title">${escHtml(title)}</h3>
          <button class="admin-modal-close" id="admin-modal-close" aria-label="Cerrar">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="admin-modal-body">${body}</div>
        <div class="admin-modal-footer">
          <button class="admin-btn admin-btn--ghost" id="admin-modal-cancel">Cancelar</button>
          <button class="admin-btn admin-btn--primary" id="admin-modal-confirm">
            <i class="fa-solid fa-check"></i> Confirmar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#admin-modal-close').onclick = () => modal.remove();
    modal.querySelector('#admin-modal-cancel').onclick = () => modal.remove();
    modal.querySelector('#admin-modal-confirm').onclick = () => {
      const form = modal.querySelector('#admin-modal-form');
      const data = form ? Object.fromEntries(new FormData(form)) : null;
      onConfirm(data);
      modal.remove();
    };
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  }

  function showConfirm({ title, message, onConfirm }) {
    const existing = document.getElementById('admin-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'admin-modal';
    modal.className = 'admin-modal-backdrop';
    modal.innerHTML = `
      <div class="admin-modal admin-modal--compact" role="dialog" aria-modal="true">
        <div class="admin-modal-header">
          <h3>${escHtml(title)}</h3>
          <button class="admin-modal-close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="admin-modal-body"><p>${escHtml(message)}</p></div>
        <div class="admin-modal-footer">
          <button class="admin-btn admin-btn--ghost" id="adm-no">Cancelar</button>
          <button class="admin-btn admin-btn--danger" id="adm-yes">
            <i class="fa-solid fa-trash"></i> Eliminar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.admin-modal-close').onclick = () => modal.remove();
    modal.querySelector('#adm-no').onclick = () => modal.remove();
    modal.querySelector('#adm-yes').onclick = () => { onConfirm(); modal.remove(); };
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  }

  /* ─── CRUD Usuarios (en memoria) ───────────────────────── */
  function createUsuario() {
    showModal({
      title: '➕ Crear usuario (chocolate)',
      body: `
        <form id="admin-modal-form">
          <label>Nombre completo
            <input name="nombre" type="text" placeholder="Juan Pérez" maxlength="100" required>
          </label>
          <label>Username
            <input name="username" type="text" placeholder="juan_perez" maxlength="40" required>
          </label>
          <label>Correo
            <input name="correo" type="email" placeholder="juan@ejemplo.com" maxlength="120" required>
          </label>
          <label>Biografía
            <textarea name="biografia" placeholder="Amante de los libros..." maxlength="500" rows="3"></textarea>
          </label>
        </form>
      `,
      onConfirm: (data) => {
        const newId = nextId();
        const user = {
          id_usuario: `🍫${newId}`,
          _adminId: newId,
          nombre: data.nombre,
          username: data.username,
          correo: data.correo,
          biografia: data.biografia || '',
          total_resenas: 0,
          total_favoritos: 0,
          _createdByAdmin: true,
        };
        store.usuarios.unshift(user);
        renderUsuarios();
        toast(`Usuario @${data.username} creado (solo en este panel 🍫)`);
      }
    });
  }

  function editUsuario(id) {
    const user = store.usuarios.find(u => (u._adminId || u.id_usuario) == id);
    if (!user) { toast('Usuario no encontrado', 'error'); return; }

    showModal({
      title: `✏️ Editar @${user.username}`,
      body: `
        <form id="admin-modal-form">
          <label>Nombre completo
            <input name="nombre" type="text" value="${escHtml(user.nombre || '')}" maxlength="100" required>
          </label>
          <label>Username
            <input name="username" type="text" value="${escHtml(user.username || '')}" maxlength="40" required>
          </label>
          <label>Correo
            <input name="correo" type="email" value="${escHtml(user.correo || '')}" maxlength="120" required>
          </label>
          <label>Biografía
            <textarea name="biografia" maxlength="500" rows="3">${escHtml(user.biografia || '')}</textarea>
          </label>
        </form>
      `,
      onConfirm: (data) => {
        Object.assign(user, { nombre: data.nombre, username: data.username, correo: data.correo, biografia: data.biografia });
        renderUsuarios();
        toast(`@${data.username} actualizado (solo en memoria 🍫)`);
      }
    });
  }

  function deleteUsuario(id) {
    const user = store.usuarios.find(u => (u._adminId || u.id_usuario) == id);
    if (!user) { toast('Usuario no encontrado', 'error'); return; }

    showConfirm({
      title: '🗑️ Eliminar usuario',
      message: `¿Eliminar a @${user.username}? Recuerda: solo se borra de este panel, no del backend real.`,
      onConfirm: () => {
        store.usuarios = store.usuarios.filter(u => (u._adminId || u.id_usuario) != id);
        renderUsuarios();
        toast(`@${user.username} eliminado del panel (el backend sigue igual 🍫)`, 'success');
      }
    });
  }

  /* ─── CRUD Reseñas (en memoria) ────────────────────────── */
  function createResena() {
    const userOptions = store.usuarios.slice(0, 20).map(u =>
      `<option value="${escHtml(u.username)}">${escHtml(u.nombre)} (@${escHtml(u.username)})</option>`
    ).join('');

    showModal({
      title: '➕ Crear reseña (chocolate)',
      body: `
        <form id="admin-modal-form">
          <label>Usuario
            <select name="username" required>
              <option value="">— Seleccionar —</option>
              ${userOptions}
            </select>
          </label>
          <label>Título del libro
            <input name="titulo" type="text" placeholder="El nombre del viento..." maxlength="255" required>
          </label>
          <label>Calificación (1-5)
            <input name="calificacion" type="number" min="1" max="5" value="5" required>
          </label>
          <label>Comentario
            <textarea name="comentario" placeholder="Me pareció increíble porque..." maxlength="1000" rows="4" required></textarea>
          </label>
        </form>
      `,
      onConfirm: (data) => {
        const id = nextId();
        store.resenas.unshift({
          id_resena: `🍫${id}`,
          _adminId: id,
          username: data.username,
          nombre: data.username,
          titulo: data.titulo,
          calificacion: Number(data.calificacion),
          comentario: data.comentario,
          _createdByAdmin: true,
        });
        renderResenas();
        toast(`Reseña creada para "${data.titulo}" (solo en este panel 🍫)`);
      }
    });
  }

  function editResena(id) {
    const r = store.resenas.find(x => (x._adminId || x.id_resena) == id);
    if (!r) { toast('Reseña no encontrada', 'error'); return; }

    showModal({
      title: `✏️ Editar reseña de "${r.titulo}"`,
      body: `
        <form id="admin-modal-form">
          <label>Título del libro
            <input name="titulo" type="text" value="${escHtml(r.titulo || '')}" maxlength="255" required>
          </label>
          <label>Calificación (1-5)
            <input name="calificacion" type="number" min="1" max="5" value="${escHtml(r.calificacion || 5)}" required>
          </label>
          <label>Comentario
            <textarea name="comentario" maxlength="1000" rows="4" required>${escHtml(r.comentario || '')}</textarea>
          </label>
        </form>
      `,
      onConfirm: (data) => {
        Object.assign(r, { titulo: data.titulo, calificacion: Number(data.calificacion), comentario: data.comentario });
        renderResenas();
        toast(`Reseña actualizada (solo en memoria 🍫)`);
      }
    });
  }

  function deleteResena(id) {
    const r = store.resenas.find(x => (x._adminId || x.id_resena) == id);
    if (!r) { toast('Reseña no encontrada', 'error'); return; }

    showConfirm({
      title: '🗑️ Eliminar reseña',
      message: `¿Eliminar la reseña de "${r.titulo}" por @${r.username}? Solo se borra del panel.`,
      onConfirm: () => {
        store.resenas = store.resenas.filter(x => (x._adminId || x.id_resena) != id);
        renderResenas();
        toast(`Reseña eliminada del panel 🍫`, 'success');
      }
    });
  }

  /* ─── Construir el panel HTML ───────────────────────────── */
  function buildPanel() {
    if (document.getElementById('admin-panel')) return;

    // Inyectar CSS
    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.textContent = getAdminStyles();
    document.head.appendChild(style);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'admin-panel';
    panel.setAttribute('aria-label', 'Panel de administración');
    panel.innerHTML = `
      <aside class="admin-sidebar">
        <div class="admin-brand">
          <i class="fa-solid fa-cookie-bite"></i>
          <div>
            <strong>Admin Panel</strong>
            <span>Modo chocolate 🍫</span>
          </div>
        </div>

        <nav class="admin-nav">
          <button class="admin-nav-item active" data-section="inicio">
            <i class="fa-solid fa-gauge-high"></i> Inicio
          </button>
          <button class="admin-nav-item" data-section="usuarios">
            <i class="fa-solid fa-users"></i> Usuarios
          </button>
          <button class="admin-nav-item" data-section="resenas">
            <i class="fa-solid fa-star"></i> Reseñas
          </button>
          <button class="admin-nav-item" data-section="libros">
            <i class="fa-solid fa-book"></i> Libros
          </button>
        </nav>

        <div class="admin-sidebar-footer">
          <div class="admin-choco-badge">
            <i class="fa-solid fa-triangle-exclamation"></i>
            Los cambios son temporales
          </div>
          <button class="admin-btn admin-btn--ghost admin-reload-btn" onclick="window.__adminPanel.reload()">
            <i class="fa-solid fa-rotate"></i> Recargar datos
          </button>
          <button class="admin-btn admin-btn--danger-outline admin-close-btn" onclick="window.__adminPanel.close()">
            <i class="fa-solid fa-xmark"></i> Cerrar panel
          </button>
        </div>
      </aside>

      <main class="admin-main">
        <div class="admin-topbar">
          <div class="admin-topbar-left">
            <span class="admin-mode-chip">
              <i class="fa-solid fa-cookie-bite"></i>
              Modo Administrador Chocolate — los cambios no se guardan al recargar
            </span>
          </div>
          <div class="admin-topbar-right">
            <span id="admin-toast-area"></span>
          </div>
        </div>

        <div id="admin-content" class="admin-content">
          <!-- contenido dinámico -->
        </div>
      </main>
    `;
    document.body.appendChild(panel);

    // Event delegation para nav
    panel.querySelector('.admin-nav').addEventListener('click', e => {
      const btn = e.target.closest('.admin-nav-item');
      if (btn) renderSection(btn.dataset.section);
    });
  }

  /* ─── Login de administrador ────────────────────────────── */
  function showLoginModal() {
    if (document.getElementById('admin-login-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'admin-login-modal';
    modal.innerHTML = `
      <div class="adm-login-bg" aria-hidden="true"></div>
      <div class="adm-login-card" role="dialog" aria-modal="true" aria-labelledby="adm-login-title">
        <div class="adm-login-icon">
          <i class="fa-solid fa-lock" id="adm-lock-icon"></i>
        </div>
        <h2 id="adm-login-title">Panel de administración</h2>
        <p>Introduce la contraseña para continuar.</p>

        <form id="adm-login-form" autocomplete="off">
          <div class="adm-login-field">
            <input
              id="adm-login-input"
              type="password"
              placeholder="Contraseña"
              maxlength="100"
              autocomplete="current-password"
              required
            />
            <button type="button" id="adm-toggle-pw" aria-label="Mostrar contraseña" tabindex="-1">
              <i class="fa-solid fa-eye" id="adm-eye-icon"></i>
            </button>
          </div>
          <p class="adm-login-error" id="adm-login-error" hidden>Contraseña incorrecta. Intenta de nuevo.</p>
          <button class="adm-login-btn" type="submit" id="adm-login-submit">
            <i class="fa-solid fa-right-to-bracket"></i>
            Acceder al panel
          </button>
        </form>

        <button class="adm-login-cancel" type="button" id="adm-login-cancel">
          Cancelar
        </button>
      </div>
    `;

    // Inyectar estilos de login
    if (!document.getElementById('admin-login-styles')) {
      const s = document.createElement('style');
      s.id = 'admin-login-styles';
      s.textContent = getLoginStyles();
      document.head.appendChild(s);
    }

    document.body.appendChild(modal);

    const input   = modal.querySelector('#adm-login-input');
    const form    = modal.querySelector('#adm-login-form');
    const errMsg  = modal.querySelector('#adm-login-error');
    const cancelBtn = modal.querySelector('#adm-login-cancel');
    const togglePw  = modal.querySelector('#adm-toggle-pw');
    const eyeIcon   = modal.querySelector('#adm-eye-icon');
    const lockIcon  = modal.querySelector('#adm-lock-icon');
    const submitBtn = modal.querySelector('#adm-login-submit');

    // Foco automático
    setTimeout(() => input.focus(), 80);

    // Mostrar/ocultar contraseña
    togglePw.addEventListener('click', () => {
      const isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';
      eyeIcon.className = `fa-solid ${isPw ? 'fa-eye-slash' : 'fa-eye'}`;
    });

    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value;

      if (value === ADMIN_PASSWORD) {
        // Animación de desbloqueo
        adminAuthenticated = true;
        lockIcon.className = 'fa-solid fa-lock-open';
        modal.querySelector('.adm-login-card').classList.add('adm-login-success');
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Acceso concedido';
        submitBtn.disabled = true;

        setTimeout(() => {
          modal.remove();
          openPanel();
        }, 700);
      } else {
        // Animación de error (shake)
        modal.querySelector('.adm-login-card').classList.add('adm-shake');
        errMsg.hidden = false;
        input.value = '';
        input.focus();
        setTimeout(() => modal.querySelector('.adm-login-card').classList.remove('adm-shake'), 500);
      }
    });

    cancelBtn.addEventListener('click', () => modal.remove());
    modal.querySelector('.adm-login-bg').addEventListener('click', () => modal.remove());
  }

  function getLoginStyles() {
    return `
      #admin-login-modal {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      }

      .adm-login-bg {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        animation: adm-fade-in 0.25s ease;
      }

      .adm-login-card {
        position: relative;
        z-index: 1;
        background: #13151d;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px;
        padding: 40px 36px 32px;
        width: 100%;
        max-width: 380px;
        text-align: center;
        box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(192,132,252,0.08);
        animation: adm-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1);
        color: #e2e8f0;
      }

      .adm-login-icon {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(147,51,234,0.2), rgba(99,102,241,0.15));
        border: 1px solid rgba(192,132,252,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        font-size: 26px;
        color: #c084fc;
        transition: all 0.4s ease;
      }

      .adm-login-success .adm-login-icon {
        background: linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.15));
        border-color: rgba(52,211,153,0.4);
        color: #34d399;
        transform: scale(1.1);
        box-shadow: 0 0 30px rgba(52,211,153,0.3);
      }

      .adm-login-card h2 {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 700;
        color: #f1f5f9;
      }

      .adm-login-card > p {
        margin: 0 0 28px;
        font-size: 13px;
        color: #64748b;
        line-height: 1.5;
      }

      .adm-login-field {
        position: relative;
        margin-bottom: 10px;
      }

      #adm-login-input {
        width: 100%;
        background: #1e2230;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        color: #e2e8f0;
        font-size: 15px;
        padding: 13px 46px 13px 16px;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.2s, box-shadow 0.2s;
        font-family: inherit;
        letter-spacing: 0.05em;
      }
      #adm-login-input:focus {
        border-color: #9333ea;
        box-shadow: 0 0 0 3px rgba(147,51,234,0.15);
      }

      #adm-toggle-pw {
        all: unset;
        cursor: pointer;
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #475569;
        font-size: 15px;
        transition: color 0.15s;
      }
      #adm-toggle-pw:hover { color: #94a3b8; }

      .adm-login-error {
        margin: 0 0 14px;
        font-size: 12px;
        color: #f87171;
        animation: adm-fade-in 0.2s ease;
      }

      .adm-login-btn {
        all: unset;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
        padding: 13px;
        background: linear-gradient(135deg, #9333ea, #6366f1);
        color: white;
        font-size: 14px;
        font-weight: 700;
        border-radius: 10px;
        transition: all 0.2s;
        box-shadow: 0 4px 20px rgba(147,51,234,0.35);
        margin-bottom: 14px;
      }
      .adm-login-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(147,51,234,0.45); }
      .adm-login-btn:disabled { opacity: 0.7; cursor: default; }

      .adm-login-cancel {
        all: unset;
        cursor: pointer;
        font-size: 13px;
        color: #475569;
        transition: color 0.15s;
      }
      .adm-login-cancel:hover { color: #94a3b8; }

      @keyframes adm-fade-in  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes adm-slide-up { from { opacity: 0; transform: scale(0.92) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes adm-shake {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-8px); }
        40%      { transform: translateX(8px); }
        60%      { transform: translateX(-6px); }
        80%      { transform: translateX(6px); }
      }
      .adm-shake { animation: adm-shake 0.45s ease; }
    `;
  }

  /* ─── Activar / desactivar panel ────────────────────────── */
  function openPanel() {
    if (adminActive) return;
    adminActive = true;
    buildPanel();
    document.body.classList.add('admin-open');
    renderHome();
    toast('Panel abierto 🍫 Ctrl+Shift+A para cerrar', 'chocolate');
  }

  function open() {
    if (adminActive) return;
    if (adminAuthenticated) {
      openPanel();
    } else {
      showLoginModal();
    }
  }

  function close() {
    adminActive = false;
    document.body.classList.remove('admin-open');
    const panel = document.getElementById('admin-panel');
    if (panel) panel.remove();
    const style = document.getElementById('admin-styles');
    if (style) style.remove();
  }

  function toggle() {
    adminActive ? close() : open();
  }

  function goTo(section) {
    if (!adminActive) open();
    if (!store.loaded) {
      renderSection(section);
    } else {
      renderSection(section);
    }
  }

  function reload() {
    store.loaded = false;
    store.usuarios = [];
    store.resenas = [];
    loadData();
  }

  /* ─── API pública ───────────────────────────────────────── */
  window.__adminPanel = { open, close, toggle, goTo, reload, editUsuario, deleteUsuario, createUsuario, editResena, deleteResena, createResena };

  /* ─── Expose state global para que el admin pueda leer libros ── */
  // Se engancha al state de app.js cuando está disponible
  function exposeState() {
    if (typeof state !== 'undefined') {
      window.__adminState = state;
    } else {
      setTimeout(exposeState, 500);
    }
  }
  exposeState();

  /* ─── Atajo de teclado Ctrl+Shift+A ─────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      toggle();
    }
  });

  /* ─── Botón oculto en el footer ─────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    const footer = document.querySelector('.footer');
    if (footer) {
      const trigger = document.createElement('button');
      trigger.id = 'admin-footer-trigger';
      trigger.title = 'Panel de administración';
      trigger.setAttribute('aria-label', 'Activar modo administrador');
      trigger.innerHTML = '<i class="fa-solid fa-cookie-bite"></i>';
      trigger.addEventListener('click', toggle);
      footer.appendChild(trigger);
    }
  });

  /* ─── Estilos CSS del panel ─────────────────────────────── */
  function getAdminStyles() {
    return `
      /* ═══ Admin Panel Global ════════════════════════════ */
      :root {
        --admin-bg:        #0d0f14;
        --admin-sidebar:   #111318;
        --admin-surface:   #181b23;
        --admin-surface2:  #1e2230;
        --admin-border:    rgba(255,255,255,0.07);
        --admin-accent:    #c084fc;
        --admin-accent2:   #60a5fa;
        --admin-accent3:   #34d399;
        --admin-choco:     #d97706;
        --admin-danger:    #f87171;
        --admin-text:      #e2e8f0;
        --admin-text-muted:#8892a0;
        --admin-radius:    12px;
        --admin-sidebar-w: 250px;
      }

      body.admin-open {
        overflow: hidden;
      }

      #admin-panel {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        font-size: 14px;
        color: var(--admin-text);
        background: var(--admin-bg);
        animation: adminSlideIn 0.28s cubic-bezier(0.4,0,0.2,1);
      }

      @keyframes adminSlideIn {
        from { opacity: 0; transform: translateX(30px); }
        to   { opacity: 1; transform: translateX(0); }
      }

      /* ═══ Sidebar ═══════════════════════════════════════ */
      .admin-sidebar {
        width: var(--admin-sidebar-w);
        min-width: var(--admin-sidebar-w);
        background: var(--admin-sidebar);
        border-right: 1px solid var(--admin-border);
        display: flex;
        flex-direction: column;
        padding: 0;
        overflow-y: auto;
      }

      .admin-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 22px 20px 18px;
        border-bottom: 1px solid var(--admin-border);
      }
      .admin-brand > i {
        font-size: 24px;
        color: var(--admin-choco);
        filter: drop-shadow(0 0 8px rgba(217,119,6,0.5));
      }
      .admin-brand strong { display: block; font-size: 14px; color: var(--admin-text); }
      .admin-brand span   { font-size: 11px; color: var(--admin-text-muted); }

      .admin-nav {
        flex: 1;
        padding: 12px 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .admin-nav-item {
        all: unset;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 8px;
        color: var(--admin-text-muted);
        font-size: 13.5px;
        transition: all 0.15s;
      }
      .admin-nav-item:hover   { background: var(--admin-surface2); color: var(--admin-text); }
      .admin-nav-item.active  {
        background: linear-gradient(135deg, rgba(192,132,252,0.15), rgba(96,165,250,0.1));
        color: var(--admin-accent);
        font-weight: 600;
      }
      .admin-nav-item i { width: 16px; text-align: center; }

      .admin-sidebar-footer {
        padding: 16px;
        border-top: 1px solid var(--admin-border);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .admin-choco-badge {
        font-size: 11px;
        color: var(--admin-choco);
        background: rgba(217,119,6,0.1);
        border: 1px solid rgba(217,119,6,0.25);
        border-radius: 6px;
        padding: 6px 10px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      /* ═══ Main content ══════════════════════════════════ */
      .admin-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--admin-bg);
      }

      .admin-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 24px;
        background: var(--admin-sidebar);
        border-bottom: 1px solid var(--admin-border);
        position: relative;
        z-index: 1;
      }

      .admin-mode-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--admin-choco);
        background: rgba(217,119,6,0.12);
        border: 1px solid rgba(217,119,6,0.3);
        border-radius: 100px;
        padding: 5px 14px;
        font-weight: 600;
        letter-spacing: 0.02em;
      }

      #admin-toast-area {
        position: fixed;
        bottom: 24px;
        right: 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 10010;
      }

      .admin-toast {
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--admin-surface2);
        border: 1px solid var(--admin-border);
        border-radius: 10px;
        padding: 10px 16px;
        font-size: 13px;
        color: var(--admin-text);
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        animation: adminToastIn 0.25s ease;
        transition: opacity 0.3s, transform 0.3s;
      }
      .admin-toast--chocolate i { color: var(--admin-choco); }
      .admin-toast--success  i  { color: var(--admin-accent3); }
      .admin-toast--error    i  { color: var(--admin-danger); }
      .admin-toast--out { opacity: 0; transform: translateX(20px); }

      @keyframes adminToastIn {
        from { opacity: 0; transform: translateX(20px); }
        to   { opacity: 1; transform: translateX(0); }
      }

      .admin-content {
        flex: 1;
        overflow-y: auto;
        padding: 28px 32px;
        scrollbar-width: thin;
        scrollbar-color: var(--admin-surface2) transparent;
      }

      /* ═══ Loader ════════════════════════════════════════ */
      .admin-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        height: 300px;
        color: var(--admin-text-muted);
        font-size: 15px;
      }
      .admin-loader i { font-size: 36px; color: var(--admin-accent); }

      /* ═══ Home ══════════════════════════════════════════ */
      .admin-home h2 { font-size: 26px; margin: 0 0 8px; color: var(--admin-text); }
      .admin-subtitle { color: var(--admin-text-muted); margin: 0 0 28px; line-height: 1.6; }

      .admin-hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, rgba(217,119,6,0.2), rgba(192,132,252,0.15));
        border: 1px solid rgba(217,119,6,0.3);
        border-radius: 100px;
        padding: 6px 16px;
        font-size: 13px;
        font-weight: 600;
        color: var(--admin-choco);
        margin-bottom: 16px;
      }

      .admin-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .admin-stat-card {
        background: var(--admin-surface);
        border: 1px solid var(--admin-border);
        border-radius: var(--admin-radius);
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        text-align: center;
        transition: border-color 0.2s, transform 0.2s;
      }
      .admin-stat-card:hover { border-color: var(--admin-accent); transform: translateY(-2px); }
      .admin-stat-card i      { font-size: 22px; color: var(--admin-accent); }
      .admin-stat-card strong { font-size: 28px; color: var(--admin-text); }
      .admin-stat-card span   { font-size: 12px; color: var(--admin-text-muted); }

      .admin-info-box {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: rgba(96,165,250,0.08);
        border: 1px solid rgba(96,165,250,0.2);
        border-radius: var(--admin-radius);
        padding: 16px;
        color: var(--admin-text-muted);
        font-size: 13px;
        margin-bottom: 24px;
        line-height: 1.5;
      }
      .admin-info-box > i { font-size: 18px; color: var(--admin-accent2); margin-top: 2px; flex-shrink: 0; }
      .admin-info-box strong { display: block; color: var(--admin-text); margin-bottom: 4px; }
      .admin-info-box--warning { background: rgba(217,119,6,0.08); border-color: rgba(217,119,6,0.2); }
      .admin-info-box--warning > i { color: var(--admin-choco); }

      .admin-quick-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      /* ═══ Section header ════════════════════════════════ */
      .admin-section-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 20px;
        gap: 16px;
      }
      .admin-section-header h2 {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 22px;
        margin: 0 0 4px;
        color: var(--admin-text);
      }
      .admin-section-header h2 i { color: var(--admin-accent); }
      .admin-section-header p   { margin: 0; font-size: 13px; color: var(--admin-text-muted); }

      /* ═══ Table ═════════════════════════════════════════ */
      .admin-table-wrap {
        background: var(--admin-surface);
        border: 1px solid var(--admin-border);
        border-radius: var(--admin-radius);
        overflow: hidden;
      }

      .admin-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .admin-table thead {
        background: var(--admin-surface2);
      }
      .admin-table th {
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--admin-text-muted);
        border-bottom: 1px solid var(--admin-border);
      }

      .admin-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--admin-border);
        color: var(--admin-text);
        vertical-align: middle;
      }
      .admin-table tr:last-child td { border-bottom: none; }
      .admin-table tbody tr:hover { background: rgba(255,255,255,0.025); }

      .admin-empty {
        text-align: center;
        color: var(--admin-text-muted);
        padding: 40px !important;
      }
      .admin-comment-cell { color: var(--admin-text-muted); max-width: 200px; }

      .admin-user-cell {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .admin-user-cell strong { display: block; font-size: 13px; color: var(--admin-text); }
      .admin-user-cell span   { font-size: 11px; color: var(--admin-text-muted); }

      .admin-mini-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--admin-accent), var(--admin-accent2));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        color: white;
        flex-shrink: 0;
      }

      .admin-book-thumb {
        width: 32px;
        height: 44px;
        object-fit: cover;
        border-radius: 4px;
        flex-shrink: 0;
      }
      .admin-book-thumb-placeholder {
        width: 32px;
        height: 44px;
        border-radius: 4px;
        background: var(--admin-surface2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        color: var(--admin-accent);
        flex-shrink: 0;
      }

      .admin-actions-cell {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .admin-stars {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #fbbf24;
        font-size: 14px;
      }
      .admin-stars span { font-size: 12px; color: var(--admin-text-muted); }

      /* ═══ Badges ════════════════════════════════════════ */
      .admin-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 100px;
        font-size: 11px;
        font-weight: 600;
      }
      .admin-badge--blue   { background: rgba(96,165,250,0.15); color: var(--admin-accent2); }
      .admin-badge--green  { background: rgba(52,211,153,0.15); color: var(--admin-accent3); }
      .admin-badge--purple { background: rgba(192,132,252,0.15); color: var(--admin-accent); }

      /* ═══ Buttons ═══════════════════════════════════════ */
      .admin-btn {
        all: unset;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 9px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .admin-btn--primary {
        background: linear-gradient(135deg, #9333ea, #6366f1);
        color: white;
        box-shadow: 0 4px 14px rgba(147,51,234,0.3);
      }
      .admin-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(147,51,234,0.4); }

      .admin-btn--secondary {
        background: rgba(96,165,250,0.12);
        border: 1px solid rgba(96,165,250,0.3);
        color: var(--admin-accent2);
      }
      .admin-btn--secondary:hover { background: rgba(96,165,250,0.2); }

      .admin-btn--ghost {
        background: var(--admin-surface2);
        color: var(--admin-text-muted);
        border: 1px solid var(--admin-border);
      }
      .admin-btn--ghost:hover { color: var(--admin-text); background: rgba(255,255,255,0.06); }

      .admin-btn--danger {
        background: var(--admin-danger);
        color: white;
      }
      .admin-btn--danger:hover { background: #ef4444; }

      .admin-btn--danger-outline {
        background: transparent;
        color: var(--admin-danger);
        border: 1px solid rgba(248,113,113,0.3);
      }
      .admin-btn--danger-outline:hover { background: rgba(248,113,113,0.1); }

      .admin-icon-btn {
        all: unset;
        cursor: pointer;
        width: 30px;
        height: 30px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        transition: all 0.15s;
      }
      .admin-icon-btn--edit   { background: rgba(192,132,252,0.1); color: var(--admin-accent); }
      .admin-icon-btn--edit:hover   { background: rgba(192,132,252,0.25); }
      .admin-icon-btn--delete { background: rgba(248,113,113,0.1); color: var(--admin-danger); }
      .admin-icon-btn--delete:hover { background: rgba(248,113,113,0.25); }

      .admin-link {
        all: unset;
        cursor: pointer;
        color: var(--admin-accent);
        text-decoration: underline;
        font-size: 13px;
      }

      /* ═══ Modal ═════════════════════════════════════════ */
      .admin-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10005;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: adminFadeIn 0.18s ease;
      }

      @keyframes adminFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      .admin-modal {
        background: var(--admin-surface);
        border: 1px solid var(--admin-border);
        border-radius: 16px;
        width: 100%;
        max-width: 500px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.7);
        animation: adminModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
      }
      .admin-modal--compact { max-width: 380px; }

      @keyframes adminModalIn {
        from { opacity: 0; transform: scale(0.9) translateY(10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }

      .admin-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px 0;
      }
      .admin-modal-header h3 { margin: 0; font-size: 17px; color: var(--admin-text); }

      .admin-modal-close {
        all: unset;
        cursor: pointer;
        width: 30px;
        height: 30px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--admin-text-muted);
        transition: all 0.15s;
      }
      .admin-modal-close:hover { background: var(--admin-surface2); color: var(--admin-text); }

      .admin-modal-body {
        padding: 20px 24px;
      }
      .admin-modal-body p { margin: 0; color: var(--admin-text-muted); line-height: 1.5; }

      .admin-modal-body form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .admin-modal-body label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: var(--admin-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .admin-modal-body input,
      .admin-modal-body select,
      .admin-modal-body textarea {
        background: var(--admin-surface2);
        border: 1px solid var(--admin-border);
        border-radius: 8px;
        color: var(--admin-text);
        font-size: 14px;
        padding: 10px 12px;
        outline: none;
        transition: border-color 0.15s;
        font-family: inherit;
        resize: vertical;
      }
      .admin-modal-body input:focus,
      .admin-modal-body select:focus,
      .admin-modal-body textarea:focus {
        border-color: var(--admin-accent);
      }
      .admin-modal-body select option { background: var(--admin-surface2); }

      .admin-modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        padding: 0 24px 20px;
        border-top: 1px solid var(--admin-border);
        padding-top: 16px;
        margin-top: 0;
      }

      /* ═══ Footer trigger ════════════════════════════════ */
      #admin-footer-trigger {
        all: unset;
        cursor: pointer;
        margin-left: 10px;
        font-size: 13px;
        color: var(--admin-text-muted, #8892a0);
        opacity: 0.3;
        transition: opacity 0.2s;
        vertical-align: middle;
      }
      #admin-footer-trigger:hover { opacity: 1; }

      /* ═══ Reload / close btn ════════════════════════════ */
      .admin-reload-btn,
      .admin-close-btn {
        width: 100%;
        justify-content: center;
      }

      @media (max-width: 700px) {
        .admin-sidebar { width: 200px; min-width: 200px; }
        .admin-stat-grid { grid-template-columns: repeat(2, 1fr); }
        .admin-content { padding: 16px; }
      }
    `;
  }

})();
