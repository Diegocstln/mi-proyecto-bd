const apiBaseUrl = window.BOOKSNEXUS_API_BASE_URL || 'https://booksnexus-back.onrender.com';

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

function stripUnsafeText(value, maxLength = 500) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[<>]/g, '')
    .slice(0, maxLength);
}

function sanitizeUsername(value) {
  return stripUnsafeText(value, 40).toLowerCase().replace(/[^a-z0-9_]/g, '');
}

function applyFieldGuards() {
  [nombreInput, usernameInput, correoInput, usuarioInput].forEach((field) => {
    field.addEventListener('input', () => {
      const maxLength = Number(field.getAttribute('maxlength')) || 120;
      const original = field.value;
      let nextValue = field === usernameInput
        ? sanitizeUsername(original)
        : stripUnsafeText(original, maxLength);

      if (field.type === 'email' || field === usuarioInput) {
        nextValue = nextValue.replace(/\s/g, '');
      }

      if (nextValue !== original) {
        field.value = nextValue;
      }
    });

    field.addEventListener('paste', () => {
      window.setTimeout(() => field.dispatchEvent(new Event('input', { bubbles: true })), 0);
    });
  });
}

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
    error: 'Algo no salió bien',
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
    'Username and password are required': 'Escribe tu usuario y contraseña.',
    'Invalid username or password': 'Usuario o contraseña incorrectos.',
    'Username or email already exists': 'Ese usuario o correo ya existe.',
    'Name must be at least 2 characters': 'El nombre debe tener al menos 2 caracteres.',
    'Name must be 100 characters or less': 'El nombre debe tener 100 caracteres o menos.',
    'Username must be 3-40 characters and use letters, numbers or underscore': 'El usuario debe tener entre 3 y 40 caracteres.',
    'A valid email is required': 'Escribe un correo válido.',
    'Email must be 120 characters or less': 'El correo debe tener 120 caracteres o menos.',
    'Password must be at least 8 characters': 'La contraseña debe tener al menos 8 caracteres.',
    'Password must be 128 characters or less': 'La contraseña debe tener 128 caracteres o menos.',
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
  setStatus(mode === 'register' ? 'Crea una cuenta nueva en BooksNexus.' : 'Listo para entrar con usuario o correo y contraseña.');
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
    payload.nombre = stripUnsafeText(nombreInput.value.trim(), 100);
    payload.username = sanitizeUsername(usernameInput.value.trim());
    payload.correo = stripUnsafeText(correoInput.value.trim(), 120).replace(/\s/g, '');
    delete payload.usuario;
  } else {
    payload.usuario = stripUnsafeText(payload.usuario, 120).replace(/\s/g, '');
  }

  submitButton.disabled = true;
  setStatus(mode === 'register' ? 'Creando cuenta...' : 'Validando sesión...');

  try {
    const result = await submitAuth(payload);
    localStorage.setItem('booksnexus_token', result.token);
    localStorage.setItem('booksnexus_user', JSON.stringify(result.user));
    setStatus('Sesión lista. Abriendo tu perfil...');
    showNotice('Te llevamos directo a tu perfil sincronizado.', 'success', 'Sesión iniciada');
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
applyFieldGuards();
