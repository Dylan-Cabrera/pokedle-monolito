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
