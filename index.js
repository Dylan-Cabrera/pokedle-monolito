const express = require('express');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');


// ==============================================================================
// 1. CONFIGURACIÓN
// ==============================================================================
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, process.env.DB_FILE || 'pokedex.db');
const POKEAPI_URL = 'https://pokeapi.co/api/v2';
const TOTAL_POKEMONS = 151; // Primera generación

// Traducciones simples para mostrar en español en el juego
const TRADUCCIONES = {
  // Tipos
  normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta',
  electric: 'Eléctrico', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
  ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', steel: 'Acero', fairy: 'Hada',
  // Colores
  black: 'Negro', blue: 'Azul', brown: 'Marrón', gray: 'Gris',
  green: 'Verde', pink: 'Rosa', purple: 'Morado', red: 'Rojo',
  white: 'Blanco', yellow: 'Amarillo',
  // Hábitats
  cave: 'Cueva', forest: 'Bosque', grassland: 'Pradera', mountain: 'Montaña',
  rare: 'Raro', 'rough-terrain': 'Montañoso', sea: 'Mar', urban: 'Urbano',
  'waters-edge': 'Costa'
};


// ==============================================================================
// 2. BASE DE DATOS (esquema y consultas)
// ==============================================================================
const db = new DatabaseSync(DB_PATH);

// Tablas: solo usuarios y los IDs descubiertos por cada usuario
const crearTablas = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_pokedex (
      user_id INTEGER NOT NULL,
      pokemon_id INTEGER NOT NULL,
      discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, pokemon_id)
    );
  `);
};

// Consultas sobre usuarios
const buscarUsuario = (username) =>
  db.prepare('SELECT id, username, password FROM users WHERE username = ?').get(username);

const insertarUsuario = (username, password) =>
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, password);

const contarUsuarios = () =>
  db.prepare('SELECT COUNT(*) as total FROM users').get().total;

// Consultas sobre la pokédex de cada usuario (solo IDs)
const idsDescubiertos = (userId) =>
  db.prepare('SELECT pokemon_id FROM user_pokedex WHERE user_id = ? ORDER BY pokemon_id ASC')
    .all(userId)
    .map(f => f.pokemon_id);

const guardarDescubierto = (userId, pokemonId) =>
  db.prepare('INSERT OR IGNORE INTO user_pokedex (user_id, pokemon_id) VALUES (?, ?)').run(userId, pokemonId);

const iniciarBaseDeDatos = () => {
  crearTablas();
  console.log(`[BD] Conectado exitosamente a la base de datos SQLite en: ${DB_PATH}`);

  // Usuario de prueba por defecto
  if (contarUsuarios() === 0) {
    insertarUsuario('Entrenador Rojo', '1234');
    console.log('[BD] Usuario de prueba creado: "Entrenador Rojo" (clave: 1234)');
  }
  console.log("[BD] Tablas 'users' y 'user_pokedex' listas.");
};


// ==============================================================================
// 3. POKEAPI (consulta y formateo de Pokémon)
// ==============================================================================

// Cache en memoria para que las consultas a la PokeAPI sean instantáneas
const cachePokemons = {};

const traducir = (valor) => TRADUCCIONES[valor] || valor;
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// Calcula la etapa evolutiva (1, 2 o 3) buscando la especie dentro de su cadena de evolución
const getEtapaEvolutiva = async (speciesData) => {
  try {
    const urlCadena = speciesData.evolution_chain?.url;
    if (!urlCadena) return 1;
    const res = await fetch(urlCadena);
    if (!res.ok) return 1;
    const { chain } = await res.json();

    const buscar = (nodo, nivel) => {
      if (nodo.species.name === speciesData.name) return nivel;
      for (const siguiente of nodo.evolves_to) {
        const r = buscar(siguiente, nivel + 1);
        if (r) return r;
      }
      return 0;
    };
    return buscar(chain, 1) || 1;
  } catch (e) {
    console.log('No se pudo cargar la cadena evolutiva:', e.message);
    return 1;
  }
};

// Datos de especie (color, hábitat y cadena evolutiva); si falla devuelve un objeto vacío
const getEspecie = async (id) => {
  try {
    const res = await fetch(`${POKEAPI_URL}/pokemon-species/${id}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.log('No se pudo cargar la especie:', e.message);
  }
  return {};
};

// Convierte las respuestas crudas de la API al formato que usa el juego
const formatearPokemon = (data, especie, etapa) => {
  const t1 = data.types[0]?.type?.name || 'normal';
  const t2 = data.types[1]?.type?.name || null;
  const col = especie.color?.name || 'desconocido';
  const hab = especie.habitat?.name || 'desconocido';

  return {
    id: data.id,
    name: capitalizar(data.name),
    image: data.sprites?.other?.['official-artwork']?.front_default || data.sprites?.front_default || '',
    type1: traducir(t1),
    type2: t2 ? traducir(t2) : 'Ninguno',
    color: traducir(col),
    stage: etapa,
    habitat: traducir(hab)
  };
};

// Obtiene un Pokémon por ID o nombre (con cache)
const getPokemon = async (pokeid) => {
  const clave = String(pokeid).toLowerCase().trim();
  if (cachePokemons[clave]) return cachePokemons[clave];

  try {
    const res = await fetch(`${POKEAPI_URL}/pokemon/${clave}`);
    if (!res.ok) return null;
    const data = await res.json();

    const especie = await getEspecie(data.id);
    const etapa = await getEtapaEvolutiva(especie);
    const pokemon = formatearPokemon(data, especie, etapa);

    // Guardar en cache por ID y por nombre
    cachePokemons[String(data.id)] = pokemon;
    cachePokemons[data.name.toLowerCase()] = pokemon;

    return pokemon;
  } catch (error) {
    console.log('Error en la API:', error.message);
    return null;
  }
};

// Catálogo de nombres para el autocompletado
const getCatalogo = async () => {
  const response = await fetch(`${POKEAPI_URL}/pokemon?limit=${TOTAL_POKEMONS}`);
  const data = await response.json();
  return data.results.map((p, index) => ({ id: index + 1, name: capitalizar(p.name) }));
};


// ==============================================================================
// 4. LÓGICA DEL JUEGO
// ==============================================================================

// Elige un ID al azar entre los que el usuario aún no descubrió
const elegirIdRandom = (excluidos = []) => {
  let disponibles = [];
  for (let i = 1; i <= TOTAL_POKEMONS; i++) {
    if (!excluidos.includes(i)) disponibles.push(i);
  }

  // Si ya descubrió todos los 151, reiniciar
  if (disponibles.length === 0) {
    for (let i = 1; i <= TOTAL_POKEMONS; i++) disponibles.push(i);
  }

  return disponibles[Math.floor(Math.random() * disponibles.length)];
};


// ==============================================================================
// 5. CONTROLADORES (uno por endpoint)
// ==============================================================================

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


// ==============================================================================
// 6. SERVIDOR EXPRESS (middlewares y rutas)
// ==============================================================================
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'assets')));

// Usuarios
app.post('/api/login', login);
app.post('/api/register', register);

// Pokémon y Pokédle
app.get('/api/pokemons', listarPokemons);
app.get('/api/pokemon/:id', obtenerPokemon);
app.get('/api/random-pokemon', pokemonRandom);

// Pokédex del usuario
app.get('/api/user-pokedex/:userId', obtenerPokedexUsuario);
app.post('/api/user-pokedex', guardarEnPokedex);


// ==============================================================================
// 7. INICIO
// ==============================================================================
iniciarBaseDeDatos();

app.listen(PORT, () => {
  console.log(`Servidor Pokédle corriendo en http://localhost:${PORT}`);
});
