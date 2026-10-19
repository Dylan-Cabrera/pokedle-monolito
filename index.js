const express = require('express');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// ------------------------------------------------------------------------------
// BASE DE DATOS
// ------------------------------------------------------------------------------
const dbPath = path.join(__dirname, process.env.DB_FILE || 'pokedex.db');
const db = new DatabaseSync(dbPath);

console.log(`[BD] Conectado exitosamente a la base de datos SQLite en: ${dbPath}`);

// Tablas: Solo usuarios y los IDs descubiertos por cada usuario
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

// Usuario de prueba por defecto
const countUsers = db.prepare('SELECT COUNT(*) as total FROM users').get();
if (countUsers.total === 0) {
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('Entrenador Rojo', '1234');
  console.log('[BD] Usuario de prueba creado: "Entrenador Rojo" (clave: 1234)');
}

console.log("[BD] Tablas 'users' y 'user_pokedex' listas.");


// ------------------------------------------------------------------------------
// DICCIONARIOS Y FUNCIONES AUXILIARES PARA POKEAPI
// ------------------------------------------------------------------------------
// Traducciones simples para mostrar en español en el juego
const traducciones = {
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

const mapaGeneraciones = {
  'generation-i': 1,
  'generation-ii': 2,
  'generation-iii': 3,
  'generation-iv': 4,
  'generation-v': 5
};

// Cache en memoria para que las consultas a la PokeAPI sean instantáneas
const cachePokemons = {};

// Obtiene los datos de un Pokémon desde la PokeAPI y su especie (para color, gen y hábitat)
const getPokemon = async (pokeid) => {
  const clave = String(pokeid).toLowerCase().trim();
  if (cachePokemons[clave]) return cachePokemons[clave];

  try {
    // 1. Datos básicos
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${clave}`);
    if (!res.ok) return null;
    const data = await res.json();

    // 2. Datos de especie (color, hábitat y generación)
    let speciesData = {};
    try {
      const resSpecies = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${data.id}`);
      if (resSpecies.ok) speciesData = await resSpecies.json();
    } catch (e) {
      console.log('No se pudo cargar la especie:', e.message);
    }

    const t1 = data.types[0]?.type?.name || 'normal';
    const t2 = data.types[1]?.type?.name || null;
    const col = speciesData.color?.name || 'desconocido';
    const hab = speciesData.habitat?.name || 'desconocido';
    const gen = mapaGeneraciones[speciesData.generation?.name] || 1;

    const pokemonFormateado = {
      id: data.id,
      name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
      image: data.sprites?.other?.['official-artwork']?.front_default || data.sprites?.front_default || '',
      type1: traducciones[t1] || t1,
      type2: t2 ? (traducciones[t2] || t2) : 'Ninguno',
      color: traducciones[col] || col,
      generation: gen,
      habitat: traducciones[hab] || hab
    };

    // Guardar en cache por ID y por nombre
    cachePokemons[String(data.id)] = pokemonFormateado;
    cachePokemons[data.name.toLowerCase()] = pokemonFormateado;

    return pokemonFormateado;
  } catch (error) {
    console.log('Error en la API:', error.message);
    return null;
  }
};


// ------------------------------------------------------------------------------
// CONFIGURACIÓN DEL SERVIDOR EXPRESS
// ------------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'assets')));


// ------------------------------------------------------------------------------
// RUTAS DE LA API (CRUD Y POKÉDLE)
// ------------------------------------------------------------------------------

// 1. Iniciar Sesión
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const query = db.prepare('SELECT id, username, password FROM users WHERE username = ?');
  const user = query.get(username);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  res.json({ id: user.id, username: user.username });
});

// 2. Registrar Usuario
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const query = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const resultado = query.run(username, password);
    res.status(201).json({ id: Number(resultado.lastInsertRowid), username });
  } catch (error) {
    res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
  }
});

// 3. Catálogo de nombres (Primeros 151 Pokémon para el autocompletado)
app.get('/api/pokemons', async (req, res) => {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
    const data = await response.json();
    const lista = data.results.map((p, index) => ({
      id: index + 1,
      name: p.name.charAt(0).toUpperCase() + p.name.slice(1)
    }));
    res.json(lista);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la lista de Pokémon' });
  }
});

// 4. Obtener un Pokémon específico (por ID o por nombre) con las 5 categorías
app.get('/api/pokemon/:id', async (req, res) => {
  const pokemon = await getPokemon(req.params.id);
  if (!pokemon) {
    return res.status(404).json({ error: 'Pokémon no encontrado' });
  }
  res.json(pokemon);
});

// 5. Obtener un Pokémon aleatorio para el juego
// Considera el switch de excluir capturados si se envía userId
app.get('/api/random-pokemon', async (req, res) => {
  const { userId, excludeCaptured } = req.query;
  const total = 151; // Primera generación

  let excluidos = [];
  if (excludeCaptured === 'true' && userId) {
    const capturados = db.prepare('SELECT pokemon_id FROM user_pokedex WHERE user_id = ?').all(userId);
    excluidos = capturados.map(c => c.pokemon_id);
  }

  // Filtrar los IDs que no están descubiertos
  let disponibles = [];
  for (let i = 1; i <= total; i++) {
    if (!excluidos.includes(i)) disponibles.push(i);
  }

  // Si ya descubrió todos los 151, reiniciar
  if (disponibles.length === 0) {
    for (let i = 1; i <= total; i++) disponibles.push(i);
  }

  const idRandom = disponibles[Math.floor(Math.random() * disponibles.length)];
  const pokemon = await getPokemon(idRandom);
  console.log(`[TEST] Pokémon secreto elegido: ${pokemon.name} (#${pokemon.id})`);
  res.json(pokemon);
});

// 6. Obtener los IDs guardados en la Pokédex del usuario
// Solo devolvemos los IDs; el front hace un fetch por cada ID como pediste
app.get('/api/user-pokedex/:userId', (req, res) => {
  const query = db.prepare('SELECT pokemon_id FROM user_pokedex WHERE user_id = ? ORDER BY pokemon_id ASC');
  const filas = query.all(req.params.userId);
  const ids = filas.map(f => f.pokemon_id);
  res.json(ids);
});

// 7. Guardar el ID de un Pokémon acertado en la Pokédex del usuario
app.post('/api/user-pokedex', (req, res) => {
  const { userId, pokemonId } = req.body;
  if (!userId || !pokemonId) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    db.prepare('INSERT OR IGNORE INTO user_pokedex (user_id, pokemon_id) VALUES (?, ?)').run(userId, pokemonId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al registrar en la Pokédex' });
  }
});


// ------------------------------------------------------------------------------
// INICIO DEL SERVIDOR
// ------------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor Pokédle corriendo en http://localhost:${PORT}`);
});
