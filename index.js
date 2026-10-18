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

