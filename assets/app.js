// Estado del juego
let estado = {
  usuarioActual: null,
  pokemonSecreto: null,
  todosLosPokemons: [],
  intentos: [],
  juegoTerminado: false,
  modoAuth: 'login'
};

// Referencias del DOM
const userLoggedInView = document.getElementById('userLoggedInView');
const userLoggedOutView = document.getElementById('userLoggedOutView');
const loggedUsername = document.getElementById('loggedUsername');
const btnLogout = document.getElementById('btnLogout');
const btnOpenAuth = document.getElementById('btnOpenAuth');

// Modal de Login/Registro
const authModal = document.getElementById('authModal');
const btnCloseAuth = document.getElementById('btnCloseAuth');
const authModalTitle = document.getElementById('authModalTitle');
const tabAuthLogin = document.getElementById('tabAuthLogin');
const tabAuthRegister = document.getElementById('tabAuthRegister');
const authForm = document.getElementById('authForm');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const authErrorMsg = document.getElementById('authErrorMsg');
const btnSubmitAuth = document.getElementById('btnSubmitAuth');

// Pestañas
const tabPokedle = document.getElementById('tabPokedle');
const tabPokedex = document.getElementById('tabPokedex');
const pokedexBadge = document.getElementById('pokedexBadge');
const viewPokedle = document.getElementById('viewPokedle');
const viewPokedex = document.getElementById('viewPokedex');

// Pokédle
const toggleExcludeCaptured = document.getElementById('toggleExcludeCaptured');
const btnNewRandom = document.getElementById('btnNewRandom');
const gameStatusText = document.getElementById('gameStatusText');
const guessForm = document.getElementById('guessForm');
const guessInput = document.getElementById('guessInput');
const pokemonDatalist = document.getElementById('pokemonDatalist');
const guessesList = document.getElementById('guessesList');

// Victoria
const victoryCard = document.getElementById('victoryCard');
const victoryImg = document.getElementById('victoryImg');
const victoryName = document.getElementById('victoryName');
const btnPlayAgain = document.getElementById('btnPlayAgain');
const victoryNoticeText = document.getElementById('victoryNoticeText');

// Pokédex personal
const pokedexUserTitle = document.getElementById('pokedexUserTitle');
const pokedexCountText = document.getElementById('pokedexCountText');
const userPokedexGrid = document.getElementById('userPokedexGrid');
const btnPokedexBackToGame = document.getElementById('btnPokedexBackToGame');


// ------------------------------------------------------------------------------
// PETICIONES AL SERVIDOR (FETCH)
// ------------------------------------------------------------------------------

// Iniciar sesión
async function apiLogin(username, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Usuario o contraseña incorrectos');
  }
  return await res.json();
}

// Registrar usuario
async function apiRegister(username, password) {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Error al registrar usuario');
  }
  return await res.json();
}

// Obtener lista de Pokémon para sugerencias
async function apiObtenerListaPokemons() {
  try {
    const res = await fetch('/api/pokemons');
    return await res.json();
  } catch {
    return [];
  }
}

// Obtener Pokémon random (considera el switch de excluir descubiertos)
async function apiObtenerRandom() {
  const excluir = toggleExcludeCaptured.checked;
  const userId = estado.usuarioActual ? estado.usuarioActual.id : '';
  const res = await fetch(`/api/random-pokemon?excludeCaptured=${excluir}&userId=${userId}`);
  return await res.json();
}

// Obtener detalles de un Pokémon por nombre o ID
async function apiObtenerPokemon(nombreOId) {
  const res = await fetch(`/api/pokemon/${encodeURIComponent(nombreOId)}`);
  if (!res.ok) return null;
  return await res.json();
}

// Obtener los IDs descubiertos por el usuario
async function apiObtenerIdsPokedex(userId) {
  const res = await fetch(`/api/user-pokedex/${userId}`);
  return await res.json();
}

// Guardar un ID en la Pokédex del usuario
async function apiGuardarEnPokedex(userId, pokemonId) {
  await fetch('/api/user-pokedex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, pokemonId })
  });
}


// ------------------------------------------------------------------------------
// JUEGO POKÉDLE
// ------------------------------------------------------------------------------

// Iniciar nueva ronda
async function nuevaPartida() {
  estado.juegoTerminado = false;
  estado.intentos = [];
  guessesList.innerHTML = '';
  victoryCard.classList.add('hidden');
  guessInput.value = '';
  guessInput.disabled = false;
  document.getElementById('btnSubmitGuess').disabled = false;

  gameStatusText.textContent = 'Buscando Pokémon misterioso...';
  estado.pokemonSecreto = await apiObtenerRandom();

  if (estado.pokemonSecreto) {
    console.log('[TEST] Pokémon secreto para adivinar:', estado.pokemonSecreto.name, estado.pokemonSecreto);
    gameStatusText.textContent = '¡Adivina el Pokémon misterioso! Escribe su nombre.';
  } else {
    gameStatusText.textContent = 'No hay Pokémon disponibles. Revisa la conexión o el switch.';
  }
}

// Compara el intento con el secreto en las 5 categorías
function compararConSecreto(intento, secreto) {
  const tipo1 = intento.type1.toLowerCase() === secreto.type1.toLowerCase();
  const tipo2 = intento.type2.toLowerCase() === secreto.type2.toLowerCase();
  const color = intento.color.toLowerCase() === secreto.color.toLowerCase();
  const etapa = Number(intento.stage) === Number(secreto.stage);
  const habitat = intento.habitat.toLowerCase() === secreto.habitat.toLowerCase();

  // Pista de etapa evolutiva (flecha arriba/abajo si es menor/mayor)
  let pistaEtapa = '';
  if (!etapa) {
    pistaEtapa = Number(intento.stage) < Number(secreto.stage) ? ' ↑' : ' ↓';
  }

  return { tipo1, tipo2, color, etapa, habitat, pistaEtapa };
}

// Agrega la fila del intento al tablero
function mostrarIntento(intento, aciertos) {
  const clase = (acierto) => (acierto ? 'match-correct' : 'match-wrong');

  const fila = document.createElement('div');
  fila.className = 'guess-row';
  fila.innerHTML = `
    <div class="guess-cell guess-cell-pokemon">
      <img src="${intento.image}" alt="${intento.name}">
      <span>${intento.name}</span>
    </div>
    <div class="guess-cell ${clase(aciertos.tipo1)}">${intento.type1}</div>
    <div class="guess-cell ${clase(aciertos.tipo2)}">${intento.type2}</div>
    <div class="guess-cell ${clase(aciertos.color)}">${intento.color}</div>
    <div class="guess-cell ${clase(aciertos.etapa)}">${intento.stage}${aciertos.pistaEtapa}</div>
    <div class="guess-cell ${clase(aciertos.habitat)}">${intento.habitat}</div>
  `;
  guessesList.prepend(fila);
}

// Cierra la ronda, muestra el cartel y guarda en la Pokédex si hay sesión
async function ganarPartida(secreto) {
  estado.juegoTerminado = true;
  guessInput.disabled = true;
  document.getElementById('btnSubmitGuess').disabled = true;

  victoryImg.src = secreto.image;
  victoryName.textContent = secreto.name;
  victoryCard.classList.remove('hidden');
  gameStatusText.textContent = `¡Felicitaciones! Adivinaste a ${secreto.name} en ${estado.intentos.length} intento(s).`;

  if (estado.usuarioActual) {
    await apiGuardarEnPokedex(estado.usuarioActual.id, secreto.id);
    actualizarContadorPokedex();
    victoryNoticeText.innerHTML = `¡Este Pokémon se ha registrado en la Pokédex de <strong>${estado.usuarioActual.username}</strong>!`;
  } else {
    victoryNoticeText.innerHTML = `¡Inicia sesión o regístrate para que se guarde en tu <strong>Pokédex personal</strong>!`;
  }
}

// Procesar el intento del usuario
async function adivinarPokemon(e) {
  e.preventDefault();
  if (estado.juegoTerminado || !estado.pokemonSecreto) return;

  const texto = guessInput.value.trim().toLowerCase();
  if (!texto) return;

  const intento = await apiObtenerPokemon(texto);
  if (!intento) {
    alert('Pokémon no encontrado. Verifica el nombre.');
    return;
  }

  if (estado.intentos.includes(intento.id)) {
    alert('Ya intentaste con ese Pokémon.');
    return;
  }

  estado.intentos.push(intento.id);
  guessInput.value = '';

  const secreto = estado.pokemonSecreto;
  mostrarIntento(intento, compararConSecreto(intento, secreto));

  if (intento.id === secreto.id) {
    await ganarPartida(secreto);
  }
}


// ------------------------------------------------------------------------------
// VISTA: MI POKÉDEX (FETCH DE CADA ID)
// ------------------------------------------------------------------------------

async function actualizarContadorPokedex() {
  if (!estado.usuarioActual) {
    pokedexBadge.textContent = '0';
    return;
  }
  const ids = await apiObtenerIdsPokedex(estado.usuarioActual.id);
  pokedexBadge.textContent = ids.length;
}

// Carga la Pokédex haciendo un fetch individual por cada ID
async function cargarPokedexVista() {
  if (!estado.usuarioActual) {
    pokedexBadge.textContent = '0';
    pokedexUserTitle.textContent = 'Pokédex de Visitante';
    pokedexCountText.textContent = 'Inicia sesión para ver tu colección.';
    userPokedexGrid.innerHTML = `
      <div class="empty-state">
        <p>Inicia sesión con tu usuario y contraseña para desbloquear tu Pokédex.</p>
        <button class="retro-btn btn-primary" onclick="abrirAuth('login')">Iniciar Sesión</button>
      </div>
    `;
    return;
  }

  pokedexUserTitle.textContent = `Pokédex de ${estado.usuarioActual.username}`;
  userPokedexGrid.innerHTML = '<p class="empty-notice">Cargando Pokémon descubiertos...</p>';

  // 1. Obtenemos solo los IDs desde la base de datos
  const ids = await apiObtenerIdsPokedex(estado.usuarioActual.id);
  pokedexBadge.textContent = ids.length;
  pokedexCountText.textContent = `Descubiertos: ${ids.length} / 151 Pokémon`;

  if (ids.length === 0) {
    userPokedexGrid.innerHTML = `
      <div class="empty-state">
        <p>Aún no descubriste ningún Pokémon.</p>
        <button class="retro-btn btn-primary" onclick="cambiarVista('pokedle')">¡Jugar al Pokédle!</button>
      </div>
    `;
    return;
  }

  // 2. Hacemos un fetch por cada ID
  const listaPokemons = [];
  for (const id of ids) {
    const poke = await apiObtenerPokemon(id);
    if (poke) listaPokemons.push(poke);
  }

  // 3. Renderizamos las tarjetas
  userPokedexGrid.innerHTML = '';
  listaPokemons.forEach(poke => {
    const card = document.createElement('div');
    card.className = 'pokedex-card';
    card.innerHTML = `
      <div class="card-top">
        <img src="${poke.image}" alt="${poke.name}">
        <div class="card-title">
          <h4>#${String(poke.id).padStart(3, '0')} ${poke.name}</h4>
          <span class="badge-count">${poke.type1}</span>
          ${poke.type2 && poke.type2 !== 'Ninguno' ? `<span class="badge-count">${poke.type2}</span>` : ''}
        </div>
      </div>
      <div class="card-attrs">
        <div class="card-attr-item"><strong>Color:</strong> ${poke.color}</div>
        <div class="card-attr-item"><strong>Etapa:</strong> ${poke.stage}</div>
        <div class="card-attr-item"><strong>Hábitat:</strong> ${poke.habitat}</div>
      </div>
    `;
    userPokedexGrid.appendChild(card);
  });
}


// ------------------------------------------------------------------------------
// NAVEGACIÓN Y VISTAS
// ------------------------------------------------------------------------------

function cambiarVista(vista) {
  if (vista === 'pokedle') {
    tabPokedle.classList.add('active');
    tabPokedex.classList.remove('active');
    viewPokedle.classList.remove('hidden');
    viewPokedex.classList.add('hidden');
  } else if (vista === 'pokedex') {
    tabPokedex.classList.add('active');
    tabPokedle.classList.remove('active');
    viewPokedex.classList.remove('hidden');
    viewPokedle.classList.add('hidden');
    cargarPokedexVista();
  }
}


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


// ------------------------------------------------------------------------------
// INICIALIZACIÓN
// ------------------------------------------------------------------------------

async function iniciar() {
  // Cargar lista de 151 Pokémon en el datalist para que sugiera nombres al escribir
  const lista = await apiObtenerListaPokemons();
  estado.todosLosPokemons = lista;
  pokemonDatalist.innerHTML = '';
  lista.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    pokemonDatalist.appendChild(opt);
  });

  // Restaurar usuario guardado si existe, o dejar sin sesión por defecto
  const guardado = localStorage.getItem('pokedle_user');
  if (guardado) {
    try {
      setUsuario(JSON.parse(guardado));
    } catch {
      setUsuario(null);
    }
  } else {
    setUsuario(null);
  }
}

// Event Listeners
tabPokedle.addEventListener('click', () => cambiarVista('pokedle'));
tabPokedex.addEventListener('click', () => cambiarVista('pokedex'));
btnPokedexBackToGame.addEventListener('click', () => cambiarVista('pokedle'));

guessForm.addEventListener('submit', adivinarPokemon);
btnNewRandom.addEventListener('click', nuevaPartida);
btnPlayAgain.addEventListener('click', nuevaPartida);
toggleExcludeCaptured.addEventListener('change', nuevaPartida);

btnOpenAuth.addEventListener('click', () => abrirAuth('login'));
btnCloseAuth.addEventListener('click', cerrarAuth);
tabAuthLogin.addEventListener('click', () => abrirAuth('login'));
tabAuthRegister.addEventListener('click', () => abrirAuth('register'));
authForm.addEventListener('submit', procesarAuth);
btnLogout.addEventListener('click', cerrarSesion);

document.addEventListener('DOMContentLoaded', iniciar);
