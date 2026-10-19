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
