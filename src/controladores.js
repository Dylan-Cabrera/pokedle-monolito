const { buscarUsuario, insertarUsuario, idsDescubiertos, guardarDescubierto } = require('./db');
const { getPokemon, getCatalogo } = require('./pokeapi');
const { elegirIdRandom } = require('./juego');

// Iniciar sesión
const login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const user = buscarUsuario(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  res.json({ id: user.id, username: user.username });
};

// Registrar usuario
const register = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const resultado = insertarUsuario(username, password);
    res.status(201).json({ id: Number(resultado.lastInsertRowid), username });
  } catch (error) {
    res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
  }
};

// Catálogo de nombres (primeros 151 Pokémon para el autocompletado)
const listarPokemons = async (req, res) => {
  try {
    res.json(await getCatalogo());
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la lista de Pokémon' });
  }
};

// Un Pokémon específico (por ID o por nombre) con las 5 categorías
const obtenerPokemon = async (req, res) => {
  const pokemon = await getPokemon(req.params.id);
  if (!pokemon) {
    return res.status(404).json({ error: 'Pokémon no encontrado' });
  }
  res.json(pokemon);
};

// Pokémon aleatorio para el juego; si se envía userId puede excluir los ya capturados
const pokemonRandom = async (req, res) => {
  const { userId, excludeCaptured } = req.query;

  const excluidos = (excludeCaptured === 'true' && userId) ? idsDescubiertos(userId) : [];
  const pokemon = await getPokemon(elegirIdRandom(excluidos));

  console.log(`[TEST] Pokémon secreto elegido: ${pokemon.name} (#${pokemon.id})`);
  res.json(pokemon);
};

// IDs guardados en la Pokédex del usuario (el front hace un fetch por cada ID)
const obtenerPokedexUsuario = (req, res) => {
  res.json(idsDescubiertos(req.params.userId));
};

// Guardar el ID de un Pokémon acertado en la Pokédex del usuario
const guardarEnPokedex = (req, res) => {
  const { userId, pokemonId } = req.body;
  if (!userId || !pokemonId) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    guardarDescubierto(userId, pokemonId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al registrar en la Pokédex' });
  }
};

module.exports = {
  login, register, listarPokemons, obtenerPokemon, pokemonRandom, obtenerPokedexUsuario, guardarEnPokedex
};
