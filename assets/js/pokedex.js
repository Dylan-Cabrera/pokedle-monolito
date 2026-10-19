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
