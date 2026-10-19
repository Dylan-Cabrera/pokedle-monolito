// ------------------------------------------------------------------------------
// AUTENTICACIÓN
// ------------------------------------------------------------------------------

function abrirAuth(modo = 'login') {
  estado.modoAuth = modo;
  authUsernameInput.value = '';
  authPasswordInput.value = '';
  authErrorMsg.classList.add('hidden');

  if (modo === 'login') {
    tabAuthLogin.classList.add('active');
    tabAuthRegister.classList.remove('active');
    authModalTitle.textContent = 'Iniciar Sesión';
    btnSubmitAuth.textContent = 'Entrar';
  } else {
    tabAuthRegister.classList.add('active');
    tabAuthLogin.classList.remove('active');
    authModalTitle.textContent = 'Nuevo Entrenador';
    btnSubmitAuth.textContent = 'Registrarse';
  }

  authModal.classList.remove('hidden');
  authUsernameInput.focus();
}

function cerrarAuth() {
  authModal.classList.add('hidden');
}

async function procesarAuth(e) {
  e.preventDefault();
  const u = authUsernameInput.value.trim();
  const p = authPasswordInput.value.trim();

  if (!u || !p) {
    authErrorMsg.textContent = 'Completa todos los campos';
    authErrorMsg.classList.remove('hidden');
    return;
  }

  try {
    let user;
    if (estado.modoAuth === 'login') {
      user = await apiLogin(u, p);
    } else {
      user = await apiRegister(u, p);
    }

    setUsuario(user);
    cerrarAuth();
  } catch (err) {
    authErrorMsg.textContent = err.message;
    authErrorMsg.classList.remove('hidden');
  }
}

function setUsuario(user) {
  estado.usuarioActual = user;
  if (user) {
    localStorage.setItem('pokedle_user', JSON.stringify(user));
    loggedUsername.textContent = user.username;
    userLoggedInView.classList.remove('hidden');
    userLoggedOutView.classList.add('hidden');
  } else {
    localStorage.removeItem('pokedle_user');
    userLoggedInView.classList.add('hidden');
    userLoggedOutView.classList.remove('hidden');
  }
  actualizarContadorPokedex();
  nuevaPartida();
}

function cerrarSesion() {
  setUsuario(null);
}
