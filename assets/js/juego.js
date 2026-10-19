// ------------------------------------------------------------------------------
// JUEGO POKÉDLE
// ------------------------------------------------------------------------------

// Iniciar nueva ronda
async function nuevaPartida() {
  estado.juegoTerminado = false;
  estado.intentos = [];
  guessesList.innerHTML = '';
  victoryCard.classList.add('hidden');
  guessInput.value = '';
  guessInput.disabled = false;
  document.getElementById('btnSubmitGuess').disabled = false;

  gameStatusText.textContent = 'Buscando Pokémon misterioso...';
  estado.pokemonSecreto = await apiObtenerRandom();

  if (estado.pokemonSecreto) {
    console.log('[TEST] Pokémon secreto para adivinar:', estado.pokemonSecreto.name, estado.pokemonSecreto);
    gameStatusText.textContent = '¡Adivina el Pokémon misterioso! Escribe su nombre.';
  } else {
    gameStatusText.textContent = 'No hay Pokémon disponibles. Revisa la conexión o el switch.';
  }
}

// Compara el intento con el secreto en las 5 categorías
function compararConSecreto(intento, secreto) {
  const tipo1 = intento.type1.toLowerCase() === secreto.type1.toLowerCase();
  const tipo2 = intento.type2.toLowerCase() === secreto.type2.toLowerCase();
  const color = intento.color.toLowerCase() === secreto.color.toLowerCase();
  const etapa = Number(intento.stage) === Number(secreto.stage);
  const habitat = intento.habitat.toLowerCase() === secreto.habitat.toLowerCase();

  // Pista de etapa evolutiva (flecha arriba/abajo si es menor/mayor)
  let pistaEtapa = '';
  if (!etapa) {
    pistaEtapa = Number(intento.stage) < Number(secreto.stage) ? ' ↑' : ' ↓';
  }

  return { tipo1, tipo2, color, etapa, habitat, pistaEtapa };
}

// Agrega la fila del intento al tablero
function mostrarIntento(intento, aciertos) {
  const clase = (acierto) => (acierto ? 'match-correct' : 'match-wrong');

  const fila = document.createElement('div');
  fila.className = 'guess-row';
  fila.innerHTML = `
    <div class="guess-cell guess-cell-pokemon">
      <img src="${intento.image}" alt="${intento.name}">
      <span>${intento.name}</span>
    </div>
    <div class="guess-cell ${clase(aciertos.tipo1)}">${intento.type1}</div>
    <div class="guess-cell ${clase(aciertos.tipo2)}">${intento.type2}</div>
    <div class="guess-cell ${clase(aciertos.color)}">${intento.color}</div>
    <div class="guess-cell ${clase(aciertos.etapa)}">${intento.stage}${aciertos.pistaEtapa}</div>
    <div class="guess-cell ${clase(aciertos.habitat)}">${intento.habitat}</div>
  `;
  guessesList.prepend(fila);
}

// Cierra la ronda, muestra el cartel y guarda en la Pokédex si hay sesión
async function ganarPartida(secreto) {
  estado.juegoTerminado = true;
  guessInput.disabled = true;
  document.getElementById('btnSubmitGuess').disabled = true;

  victoryImg.src = secreto.image;
  victoryName.textContent = secreto.name;
  victoryCard.classList.remove('hidden');
  gameStatusText.textContent = `¡Felicitaciones! Adivinaste a ${secreto.name} en ${estado.intentos.length} intento(s).`;

  if (estado.usuarioActual) {
    await apiGuardarEnPokedex(estado.usuarioActual.id, secreto.id);
    actualizarContadorPokedex();
    victoryNoticeText.innerHTML = `¡Este Pokémon se ha registrado en la Pokédex de <strong>${estado.usuarioActual.username}</strong>!`;
  } else {
    victoryNoticeText.innerHTML = `¡Inicia sesión o regístrate para que se guarde en tu <strong>Pokédex personal</strong>!`;
  }
}

// Procesar el intento del usuario
async function adivinarPokemon(e) {
  e.preventDefault();
  if (estado.juegoTerminado || !estado.pokemonSecreto) return;

  const texto = guessInput.value.trim().toLowerCase();
  if (!texto) return;

  const intento = await apiObtenerPokemon(texto);
  if (!intento) {
    alert('Pokémon no encontrado. Verifica el nombre.');
    return;
  }

  if (estado.intentos.includes(intento.id)) {
    alert('Ya intentaste con ese Pokémon.');
    return;
  }

  estado.intentos.push(intento.id);
  guessInput.value = '';

  const secreto = estado.pokemonSecreto;
  mostrarIntento(intento, compararConSecreto(intento, secreto));

  if (intento.id === secreto.id) {
    await ganarPartida(secreto);
  }
}
