const apiBaseUrl = window.BOOKSNEXUS_API_BASE_URL || 'http://localhost:3000';

let mode = 'login';

const form = document.querySelector('#auth-form');
const modeButtons = document.querySelectorAll('[data-auth-mode]');
const registerOnlyFields = document.querySelectorAll('.register-only');
const submitButton = document.querySelector('#submit-button');
const submitLabel = submitButton.querySelector('span');
const submitIcon = submitButton.querySelector('i');
const statusElement = document.querySelector('#auth-status');
const nombreInput = document.querySelector('#nombre');
const usernameInput = document.querySelector('#username');
const correoInput = document.querySelector('#correo');
const passwordInput = document.querySelector('#password');

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
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
  passwordInput.autocomplete = mode === 'register' ? 'new-password' : 'current-password';
  submitLabel.textContent = mode === 'register' ? 'Crear cuenta' : 'Entrar';
  submitIcon.className = `fa-solid ${mode === 'register' ? 'fa-user-plus' : 'fa-right-to-bracket'}`;
  setStatus(mode === 'register' ? 'Crea una cuenta nueva en BooksNexus.' : `Conectando con ${apiBaseUrl}.`);
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
    correo: correoInput.value.trim(),
    password: passwordInput.value,
  };

  if (mode === 'register') {
    payload.nombre = nombreInput.value.trim();
    payload.username = usernameInput.value.trim();
  }

  submitButton.disabled = true;
  setStatus(mode === 'register' ? 'Creando cuenta...' : 'Validando sesion...');

  try {
    const result = await submitAuth(payload);
    localStorage.setItem('booksnexus_token', result.token);
    localStorage.setItem('booksnexus_user', JSON.stringify(result.user));
    setStatus('Sesion lista. Abriendo tu perfil...');
    window.location.href = '../../index.html#view-perfil';
  } catch (error) {
    setStatus(error.message || 'No se pudo conectar con el backend.', true);
  } finally {
    submitButton.disabled = false;
  }
});

setMode('login');
