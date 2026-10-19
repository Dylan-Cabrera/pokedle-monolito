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
