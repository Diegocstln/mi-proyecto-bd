const apiBaseUrl = window.BOOKSNEXUS_API_BASE_URL || 'http://localhost:3000';

let mode = 'login';

const form = document.querySelector('#auth-form');
const modeButtons = document.querySelectorAll('[data-auth-mode]');
const registerOnlyFields = document.querySelectorAll('.register-only');
const submitButton = document.querySelector('#submit-button');
const submitLabel = submitButton.querySelector('span');
const submitIcon = submitButton.querySelector('i');
const statusElement = document.querySelector('#auth-status');
const toastStack = document.querySelector('#toast-stack');
const nombreInput = document.querySelector('#nombre');
const usernameInput = document.querySelector('#username');
const correoInput = document.querySelector('#correo');
const usuarioInput = document.querySelector('#usuario');
const passwordInput = document.querySelector('#password');

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });
}

function showNotice(message, type = 'info', title = '') {
  const defaults = {
    info: 'Listo',
    success: 'Listo',
    error: 'Algo no salio bien',
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}" aria-hidden="true"></i>
    <div>
      <strong>${escapeHtml(title || defaults[type] || defaults.info)}</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
  toastStack.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add('leaving');
    window.setTimeout(() => toast.remove(), 220);
  }, 3200);
}

function translateError(message) {
  const translations = {
    'Username and password are required': 'Escribe tu usuario y contrasena.',
    'Invalid username or password': 'Usuario o contrasena incorrectos.',
    'Username or email already exists': 'Ese usuario o correo ya existe.',
    'Name must be at least 2 characters': 'El nombre debe tener al menos 2 caracteres.',
    'Username must be 3-40 characters and use letters, numbers or underscore': 'El usuario debe tener entre 3 y 40 caracteres.',
    'A valid email is required': 'Escribe un correo valido.',
    'Password must be at least 8 characters': 'La contrasena debe tener al menos 8 caracteres.',
  };

  return translations[message] || message || 'No se pudo completar el acceso.';
}

function setMode(nextMode) {
  mode = nextMode;

  modeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.authMode === mode);
  });

  registerOnlyFields.forEach((field) => {
    field.hidden = mode !== 'register';
  });

  nombreInput.required = mode === 'register';
  usernameInput.required = mode === 'register';
  correoInput.required = mode === 'register';
  usuarioInput.closest('label').hidden = mode === 'register';
  usuarioInput.required = mode === 'login';
  passwordInput.autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  submitLabel.textContent = mode === 'register' ? 'Crear cuenta' : 'Entrar';
  submitIcon.className = `fa-solid ${mode === 'register' ? 'fa-user-plus' : 'fa-right-to-bracket'}`;
  setStatus(mode === 'register' ? 'Crea una cuenta nueva en BooksNexus.' : 'Listo para entrar con usuario o correo y contrasena.');
}

async function submitAuth(payload) {
  const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo completar el acceso');
  }

  return data;
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.authMode));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    usuario: usuarioInput.value.trim(),
    password: passwordInput.value,
  };

  if (mode === 'register') {
    payload.nombre = nombreInput.value.trim();
    payload.username = usernameInput.value.trim();
    payload.correo = correoInput.value.trim();
    delete payload.usuario;
  }

  submitButton.disabled = true;
  setStatus(mode === 'register' ? 'Creando cuenta...' : 'Validando sesion...');

  try {
    const result = await submitAuth(payload);
    localStorage.setItem('booksnexus_token', result.token);
    localStorage.setItem('booksnexus_user', JSON.stringify(result.user));
    setStatus('Sesion lista. Abriendo tu perfil...');
    showNotice('Te llevamos directo a tu perfil sincronizado.', 'success', 'Sesion iniciada');
    window.location.href = '../../index.html#view-perfil';
  } catch (error) {
    const message = translateError(error.message) || 'No se pudo conectar con BooksNexus.';
    setStatus(message, true);
    showNotice(message, 'error', mode === 'register' ? 'No se pudo crear la cuenta' : 'No se pudo entrar');
  } finally {
    submitButton.disabled = false;
  }
});

setMode('login');
