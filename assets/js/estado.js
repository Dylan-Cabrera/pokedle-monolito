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
