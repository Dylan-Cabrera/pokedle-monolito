const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, '..', process.env.DB_FILE || 'pokedex.db');
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

module.exports = { PORT, DB_PATH, POKEAPI_URL, TOTAL_POKEMONS, TRADUCCIONES };
