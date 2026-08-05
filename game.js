// Logique du jeu Bleachdle : défi quotidien façon Wordle.
// Dépend de la constante globale CHARACTERS définie dans characters.js.

const MAX_ATTEMPTS = 8;

// Ordre chronologique des arcs, utilisé pour l'indice haut/bas sur "Premier arc".
const ARC_ORDER = [
  "Agent des Shinigami",
  "Soul Society",
  "Hueco Mundo",
  "Guerre d'Hiver",
  "Pouvoir Perdu",
  "Guerre Sanglante des Mille Ans",
];

const ATTRIBUTES = [
  { key: "race", label: "Race", type: "array" },
  { key: "affiliation", label: "Affiliation", type: "array" },
  { key: "gender", label: "Genre", type: "exact" },
  { key: "status", label: "Statut", type: "exact" },
  { key: "location", label: "Lieu", type: "exact" },
  { key: "age", label: "Âge", type: "ageRange" },
  { key: "rank", label: "Escouade / Rang", type: "numeric" },
  { key: "powerType", label: "Pouvoir", type: "exact" },
  { key: "bankaiOrResurreccion", label: "Bankai/Rés.", type: "exact" },
  { key: "height", label: "Taille", type: "numeric" },
  { key: "firstArc", label: "1er arc", type: "arc" },
  { key: "hairColor", label: "Cheveux", type: "exact" },
];

// Le 1er janvier 2024 (UTC) sert de jour 0 pour dériver le personnage du jour.
const EPOCH_UTC = Date.UTC(2024, 0, 1);

function pad2(n) {
  return String(n).padStart(2, "0");
}

function todayUTCDateString() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}-${pad2(now.getUTCDate())}`;
}

function getDailyCharacter() {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daysSince = Math.floor((todayUTC - EPOCH_UTC) / 86400000);
  const index = ((daysSince % CHARACTERS.length) + CHARACTERS.length) % CHARACTERS.length;
  return CHARACTERS[index];
}

function compareArray(guessVal, targetVal) {
  const g = new Set(guessVal);
  const t = new Set(targetVal);
  const sameSize = g.size === t.size;
  const isSubset = [...g].every((v) => t.has(v));
  if (sameSize && isSubset) return { state: "correct" };
  const hasOverlap = [...g].some((v) => t.has(v));
  return { state: hasOverlap ? "partial" : "incorrect" };
}

function compareExact(guessVal, targetVal) {
  return { state: guessVal === targetVal ? "correct" : "incorrect" };
}

function compareNumeric(guessVal, targetVal) {
  if (guessVal === null && targetVal === null) return { state: "correct" };
  if (guessVal === null || targetVal === null) return { state: "incorrect" };
  if (guessVal === targetVal) return { state: "correct" };
  return { state: "incorrect", direction: targetVal > guessVal ? "up" : "down" };
}

function compareOrdinal(guessVal, targetVal, order) {
  if (guessVal === targetVal) return { state: "correct" };
  const gi = order.indexOf(guessVal);
  const ti = order.indexOf(targetVal);
  return { state: "incorrect", direction: ti > gi ? "up" : "down" };
}

function compareArc(guessVal, targetVal) {
  return compareOrdinal(guessVal, targetVal, ARC_ORDER);
}

// "age" est { min, max } : min===max pour un âge exact confirmé, max===null pour un âge
// minimum confirmé sans plafond ("2 100+ ans"), sinon une plage estimée ("100-500 ans") quand
// l'âge réel n'est jamais documenté. Deux plages ne matchent que si elles sont identiques ;
// la flèche haut/bas compare les bornes basses (min), un repère raisonnable dans tous les cas.
function compareAgeRange(guessVal, targetVal) {
  if (guessVal.min === targetVal.min && guessVal.max === targetVal.max) {
    return { state: "correct" };
  }
  if (targetVal.min === guessVal.min) return { state: "incorrect" };
  return { state: "incorrect", direction: targetVal.min > guessVal.min ? "up" : "down" };
}

function compareAttribute(attr, guessChar, targetChar) {
  const guessVal = guessChar[attr.key];
  const targetVal = targetChar[attr.key];
  switch (attr.type) {
    case "array":
      return compareArray(guessVal, targetVal);
    case "numeric":
      return compareNumeric(guessVal, targetVal);
    case "ageRange":
      return compareAgeRange(guessVal, targetVal);
    case "arc":
      return compareArc(guessVal, targetVal);
    default:
      return compareExact(guessVal, targetVal);
  }
}

function formatAgeRange(val) {
  if (val.max === null) return `${val.min}+ ans`;
  if (val.min === val.max) return `${val.min} ans`;
  return `${val.min}-${val.max} ans`;
}

function formatValue(attr, char) {
  const val = char[attr.key];
  if (attr.type === "ageRange") return formatAgeRange(val);
  if (val === null || val === undefined) return "N/A";
  if (Array.isArray(val)) return val.join(" / ");
  return String(val);
}

// --- État de partie persisté par jour ---

function storageKey() {
  return `bleachdle-${todayUTCDateString()}`;
}

function loadState() {
  const raw = localStorage.getItem(storageKey());
  if (!raw) return { guesses: [], finished: false, won: false };
  try {
    return JSON.parse(raw);
  } catch {
    return { guesses: [], finished: false, won: false };
  }
}

function saveState(state) {
  localStorage.setItem(storageKey(), JSON.stringify(state));
}

function pickRandomCharacter(excludeName) {
  let pool = CHARACTERS;
  if (excludeName && CHARACTERS.length > 1) {
    pool = CHARACTERS.filter((c) => c.name !== excludeName);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// --- UI ---

let mode = "daily";
let target = null;
let state = { guesses: [], finished: false, won: false };

const guessInput = document.getElementById("guessInput");
const suggestionsEl = document.getElementById("suggestions");
const resultsBody = document.getElementById("resultsBody");
const attemptsLeftEl = document.getElementById("attemptsLeft");
const messageEl = document.getElementById("message");
const headerRow = document.getElementById("headerRow");
const subtitleEl = document.getElementById("subtitle");
const dailyModeBtn = document.getElementById("dailyModeBtn");
const infiniteModeBtn = document.getElementById("infiniteModeBtn");
const newGameBtn = document.getElementById("newGameBtn");
const versionTagEl = document.getElementById("versionTag");

function buildHeader() {
  const nameTh = document.createElement("th");
  nameTh.textContent = "Personnage";
  headerRow.appendChild(nameTh);
  for (const attr of ATTRIBUTES) {
    const th = document.createElement("th");
    th.textContent = attr.label;
    if (attr.title) th.title = attr.title;
    headerRow.appendChild(th);
  }
}

function findCharacterByName(name) {
  return CHARACTERS.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

function renderGuessRow(guessChar) {
  const row = document.createElement("tr");

  const nameCell = document.createElement("td");
  nameCell.textContent = guessChar.name;
  nameCell.className = "name-cell";
  row.appendChild(nameCell);

  for (const attr of ATTRIBUTES) {
    const result = compareAttribute(attr, guessChar, target);
    const cell = document.createElement("td");
    cell.className = `cell ${result.state}`;
    cell.dataset.label = attr.label;
    const valueWrap = document.createElement("span");
    valueWrap.className = "value-wrap";
    const valueSpan = document.createElement("span");
    valueSpan.textContent = formatValue(attr, guessChar);
    valueWrap.appendChild(valueSpan);
    if (result.direction) {
      const arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.textContent = result.direction === "up" ? "▲" : "▼";
      valueWrap.appendChild(arrow);
    }
    cell.appendChild(valueWrap);
    row.appendChild(cell);
  }

  resultsBody.prepend(row);
}

function updateAttemptsLeft() {
  const remaining = MAX_ATTEMPTS - state.guesses.length;
  attemptsLeftEl.textContent = `Essais restants : ${Math.max(remaining, 0)}`;
}

const VICTORY_EMOJIS = ["⚔️", "👺"];
const VICTORY_PARTICLE_COUNT = 24;

function triggerVictoryAnimation() {
  const container = document.getElementById("victoryAnim");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < VICTORY_PARTICLE_COUNT; i++) {
    const span = document.createElement("span");
    span.className = "victory-particle";
    span.textContent = VICTORY_EMOJIS[Math.floor(Math.random() * VICTORY_EMOJIS.length)];
    span.style.left = `${Math.random() * 100}%`;
    span.style.fontSize = `${1.2 + Math.random() * 1.3}rem`;
    span.style.animationDuration = `${1.6 + Math.random() * 1.2}s`;
    span.style.animationDelay = `${Math.random() * 0.5}s`;
    container.appendChild(span);
  }
  window.setTimeout(() => {
    container.innerHTML = "";
  }, 3200);
}

function endGame(won) {
  state.finished = true;
  state.won = won;
  if (mode === "daily") saveState(state);
  guessInput.disabled = true;
  messageEl.className = won ? "message win" : "message lose";
  messageEl.textContent = won
    ? `Bravo ! Le personnage était bien ${target.name}.`
    : `Perdu ! Le personnage à trouver était ${target.name}.`;
  if (won) triggerVictoryAnimation();
}

function submitGuess(name) {
  if (state.finished) return;
  const guessChar = findCharacterByName(name);
  if (!guessChar) return;
  if (state.guesses.includes(guessChar.name)) return;

  state.guesses.push(guessChar.name);
  renderGuessRow(guessChar);
  updateAttemptsLeft();

  if (guessChar.name === target.name) {
    endGame(true);
  } else if (state.guesses.length >= MAX_ATTEMPTS) {
    endGame(false);
  } else if (mode === "daily") {
    saveState(state);
  }

  guessInput.value = "";
  suggestionsEl.innerHTML = "";
  suggestionsEl.hidden = true;
  if (!guessInput.disabled) guessInput.focus();
}

function renderSuggestions() {
  const query = guessInput.value.trim().toLowerCase();
  suggestionsEl.innerHTML = "";
  if (!query) {
    suggestionsEl.hidden = true;
    return;
  }
  const matches = CHARACTERS.filter(
    (c) => c.name.toLowerCase().includes(query) && !state.guesses.includes(c.name)
  ).slice(0, 8);

  if (matches.length === 0) {
    suggestionsEl.hidden = true;
    return;
  }

  for (const c of matches) {
    const item = document.createElement("div");
    item.className = "suggestion";
    item.textContent = c.name;
    item.addEventListener("click", () => submitGuess(c.name));
    suggestionsEl.appendChild(item);
  }
  suggestionsEl.hidden = false;
}

function replayState() {
  for (const name of state.guesses) {
    const guessChar = findCharacterByName(name);
    if (guessChar) renderGuessRow(guessChar);
  }
  updateAttemptsLeft();
  if (state.finished) {
    guessInput.disabled = true;
    messageEl.className = state.won ? "message win" : "message lose";
    messageEl.textContent = state.won
      ? `Bravo ! Le personnage était bien ${target.name}.`
      : `Perdu ! Le personnage à trouver était ${target.name}.`;
  }
}

function resetBoard() {
  resultsBody.innerHTML = "";
  guessInput.value = "";
  guessInput.disabled = false;
  messageEl.className = "message";
  messageEl.textContent = "";
  suggestionsEl.hidden = true;
}

function startDailyMode() {
  target = getDailyCharacter();
  state = loadState();
  resetBoard();
  replayState();
}

function startInfiniteMode() {
  target = pickRandomCharacter(target ? target.name : null);
  state = { guesses: [], finished: false, won: false };
  resetBoard();
  updateAttemptsLeft();
}

function setMode(newMode) {
  mode = newMode;
  dailyModeBtn.classList.toggle("active", mode === "daily");
  infiniteModeBtn.classList.toggle("active", mode === "infinite");
  newGameBtn.hidden = mode !== "infinite";
  subtitleEl.textContent =
    mode === "daily"
      ? "Devine le personnage Bleach du jour."
      : "Devine le personnage Bleach — partie illimitée.";
  if (mode === "daily") {
    startDailyMode();
  } else {
    startInfiniteMode();
  }
}

guessInput.addEventListener("input", renderSuggestions);
guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const query = guessInput.value.trim();
    const exact = findCharacterByName(query);
    if (exact) {
      submitGuess(exact.name);
    }
  }
});
document.addEventListener("click", (e) => {
  if (e.target !== guessInput) suggestionsEl.hidden = true;
});

dailyModeBtn.addEventListener("click", () => setMode("daily"));
infiniteModeBtn.addEventListener("click", () => setMode("infinite"));
newGameBtn.addEventListener("click", () => startInfiniteMode());

buildHeader();
if (versionTagEl) versionTagEl.textContent = `v${APP_VERSION}`;
setMode("daily");
