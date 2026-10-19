const express = require('express');
const path = require('path');
const { PORT } = require('./src/config');
const { iniciarBaseDeDatos } = require('./src/db');
const c = require('./src/controladores');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'assets')));

// Usuarios
app.post('/api/login', c.login);
app.post('/api/register', c.register);

// Pokémon y Pokédle
app.get('/api/pokemons', c.listarPokemons);
app.get('/api/pokemon/:id', c.obtenerPokemon);
app.get('/api/random-pokemon', c.pokemonRandom);

// Pokédex del usuario
app.get('/api/user-pokedex/:userId', c.obtenerPokedexUsuario);
app.post('/api/user-pokedex', c.guardarEnPokedex);

iniciarBaseDeDatos();

app.listen(PORT, () => {
  console.log(`Servidor Pokédle corriendo en http://localhost:${PORT}`);
});
