/**
 * ==============================================================================
 * ARQUITECTURA MONOLÍTICA PURA (SIN MÓDULOS NI CAPAS) - POKÉDLE & POKÉDEX
 * ==============================================================================
 * En un monolito puro:
 * 1. No existen carpetas de capas (controllers, services, repositories/DAOs).
 * 2. No existen divisiones por módulos de dominio.
 * 3. Todo el backend se encuentra centralizado en este único archivo.
 * 4. La base de datos, las rutas y la lógica del Pokédle se resuelven de forma directa.
 * 5. El frontend (HTML, CSS, JS) es servido directamente desde la carpeta assets.
 * ==============================================================================
 */

const express = require('express');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

//-------------
//BASE DE DATOS
// ------------
const dbPath = path.join(__dirname, process.env.DB_FILE || 'pokedex.db');
const db = new DatabaseSync(dbPath);

console.log(`[BD] Conectado exitosamente a la base de datos SQLite en: ${dbPath}`);

// Tablas
db.exec(`
  -- Tabla de usuarios
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Pokedex
  CREATE TABLE IF NOT EXISTS user_pokedex (
    user_id INTEGER NOT NULL,
    pokemon_id INTEGER NOT NULL, --numero de la pokedex
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  );
`);

// Crear un usuario de prueba si no hay ninguno
const countUsers = db.prepare('SELECT COUNT(*) as total FROM users').get();
if (countUsers.total === 0) {
  db.prepare('INSERT INTO users (username) VALUES (?)').run('Entrenador Rojo');
  console.log(`[BD] Usuario de prueba creado: "Entrenador Rojo".`);
}

console.log(`[BD] Tablas 'pokemons', 'users' y 'user_pokedex' listas.`);

// Fetch a la PokeAPI

const getPokemon = async (pokeid) => {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeid}`);
    const data = await res.json();

  } catch (error) {
    console.log("Error en la API")
  }
}

//--------------------------
//Configuración del servidor
//--------------------------

const PORT = process.env.PORT || 3000;

const app = express(); 

app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "assets")))

app.listen(PORT, ()=> {
  console.log(`Servidor corriendo en el puerto ${PORT}`)
})

// ==============================================================================
// 3. RUTAS DEL SERVIDOR / CRUD Y POKÉDLE (A IMPLEMENTAR POR EL USUARIO)
// ==============================================================================

// ------------------------------------------------------------------------------
// GESTIÓN DE USUARIOS
// ------------------------------------------------------------------------------
// TODO: GET /api/users
// - Devolver la lista de todos los usuarios registrados con status 200.
// - SQL: SELECT id, username, created_at FROM users ORDER BY username ASC;

// TODO: POST /api/users
// - Crear un nuevo usuario a partir de req.body.username.
// - SQL: INSERT INTO users (username) VALUES (?);
// - Devolver el usuario creado con status 201.


// ------------------------------------------------------------------------------
// POKÉDLE: OBTENCIÓN DE POKÉMON Y ALEATORIO
// ------------------------------------------------------------------------------
// TODO: GET /api/pokemons
// - Devolver la lista completa de Pokémon (para el selector/autocompletado del juego).
// - SQL: SELECT * FROM pokemons ORDER BY id ASC;

// TODO: GET /api/pokemons/random
// - Obtener un Pokémon aleatorio para adivinar.
// - Soporta query params:
//     - userId: id del usuario activo.
//     - excludeCaptured: 'true' o 'false' (controlado por el switch deslizante).
// - Si excludeCaptured === 'true' y hay userId:
//     SQL: SELECT * FROM pokemons 
//          WHERE id NOT IN (SELECT pokemon_id FROM user_pokedex WHERE user_id = ?) 
//          ORDER BY RANDOM() LIMIT 1;
// - Si excludeCaptured es 'false' o no hay userId:
//     SQL: SELECT * FROM pokemons ORDER BY RANDOM() LIMIT 1;
// - Devolver el Pokémon seleccionado con status 200.


// ------------------------------------------------------------------------------
// POKÉDEX DEL USUARIO: CONSULTA Y REGISTRO DE DESCUBIERTOS
// ------------------------------------------------------------------------------
// TODO: GET /api/users/:id/pokedex
// - Devolver la Pokédex personal del usuario (todos los Pokémon que adivinó).
// - SQL: SELECT p.*, up.discovered_at 
//        FROM pokemons p 
//        INNER JOIN user_pokedex up ON p.id = up.pokemon_id 
//        WHERE up.user_id = ? 
//        ORDER BY p.id ASC;
// - Responder con res.json(pokemons) y status 200.

// TODO: POST /api/users/:id/pokedex
// - Registrar que el usuario adivinó un Pokémon (cuando acierta en el Pokédle).
// - req.body contendrá { pokemonId }.
// - SQL: INSERT OR IGNORE INTO user_pokedex (user_id, pokemon_id) VALUES (?, ?);
// - Responder con mensaje de éxito y status 201 o 200.


// ==============================================================================
// 4. ARRANQUE DEL SERVIDOR
// ==============================================================================

// TODO: Iniciar el servidor escuchando en PORT
// Ejemplo:
// app.listen(PORT, () => {
//   console.log(`[Servidor] Pokédle monolítico corriendo en http://localhost:${PORT}`);
// });
