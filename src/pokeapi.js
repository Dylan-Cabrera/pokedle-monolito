const { POKEAPI_URL, TOTAL_POKEMONS, TRADUCCIONES } = require('./config');

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

module.exports = { getPokemon, getCatalogo };
