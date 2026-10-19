const { DatabaseSync } = require('node:sqlite');
const { DB_PATH } = require('./config');

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

module.exports = {
  buscarUsuario, insertarUsuario, idsDescubiertos, guardarDescubierto, iniciarBaseDeDatos
};
