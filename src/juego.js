const { TOTAL_POKEMONS } = require('./config');

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

module.exports = { elegirIdRandom };
