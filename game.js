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

// Tranches d'âge fixes, de la plus jeune à la plus âgée. L'âge réel de la plupart des
// Shinigami/Arrancar/Quincy adultes n'est jamais documenté (leur apparence ne reflète pas leur
// âge réel), donc plutôt qu'un chiffre inventé on classe chacun dans une tranche large. Quand un
// âge minimum est explicitement confirmé dans l'histoire (ex : Yamamoto, Yhwach), le personnage
// est placé dans la tranche correspondante.
const AGE_BRACKET_ORDER = ["10-20 ans", "20-50 ans", "50-100 ans", "100-150 ans", "150-1000 ans", "1000+ ans"];

const ATTRIBUTES = [
  { key: "race", label: "Race", type: "array" },
  { key: "affiliation", label: "Affiliation", type: "array" },
  { key: "gender", label: "Genre", type: "exact" },
  { key: "status", label: "Statut", type: "exact" },
  { key: "location", label: "Lieu", type: "exact" },
  { key: "ageBracket", label: "Âge", type: "ageBracket" },
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

function compareAgeBracket(guessVal, targetVal) {
  return compareOrdinal(guessVal, targetVal, AGE_BRACKET_ORDER);
}

function compareAttribute(attr, guessChar, targetChar) {
  const guessVal = guessChar[attr.key];
  const targetVal = targetChar[attr.key];
  switch (attr.type) {
    case "array":
      return compareArray(guessVal, targetVal);
    case "numeric":
      return compareNumeric(guessVal, targetVal);
    case "ageBracket":
      return compareAgeBracket(guessVal, targetVal);
    case "arc":
      return compareArc(guessVal, targetVal);
    default:
      return compareExact(guessVal, targetVal);
  }
}

function formatValue(attr, char) {
  const val = char[attr.key];
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

// --- Statistiques ---
// Défi du jour : persistées dans localStorage sous une clé globale (pas de date dans la clé)
// afin de cumuler l'historique entre les jours. Illimité : gardées en mémoire uniquement
// (voir infiniteStats plus bas) pour rester cohérent avec startInfiniteMode qui ne touche
// jamais localStorage — un F5 réinitialise donc aussi ces stats-là.

const STATS_KEY = "bleachdle-stats";

function defaultStats() {
  return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, lastResultDate: null, distribution: Array(MAX_ATTEMPTS).fill(0) };
}

function loadStats() {
  const raw = localStorage.getItem(STATS_KEY);
  if (!raw) return defaultStats();
  try {
    const parsed = JSON.parse(raw);
    const distribution =
      Array.isArray(parsed.distribution) && parsed.distribution.length === MAX_ATTEMPTS
        ? parsed.distribution
        : defaultStats().distribution;
    return { ...defaultStats(), ...parsed, distribution };
  } catch {
    return defaultStats();
  }
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function isNextUTCDay(prevDateStr, dateStr) {
  const prev = Date.parse(`${prevDateStr}T00:00:00Z`);
  const cur = Date.parse(`${dateStr}T00:00:00Z`);
  return cur - prev === 86400000;
}

function recordDailyResult(won, guessCount) {
  const stats = loadStats();
  const dateStr = todayUTCDateString();
  stats.played += 1;
  if (won) {
    stats.wins += 1;
    stats.distribution[Math.min(guessCount, MAX_ATTEMPTS) - 1] += 1;
    stats.currentStreak = stats.lastResultDate && isNextUTCDay(stats.lastResultDate, dateStr) ? stats.currentStreak + 1 : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }
  stats.lastResultDate = dateStr;
  saveStats(stats);
}

// --- Statistiques du mode Illimité (en mémoire, non persistées) ---

function defaultInfiniteStats() {
  return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, distribution: Array(MAX_ATTEMPTS).fill(0) };
}

let infiniteStats = defaultInfiniteStats();

function recordInfiniteResult(won, guessCount) {
  infiniteStats.played += 1;
  if (won) {
    infiniteStats.wins += 1;
    infiniteStats.distribution[Math.min(guessCount, MAX_ATTEMPTS) - 1] += 1;
    infiniteStats.currentStreak += 1;
    infiniteStats.maxStreak = Math.max(infiniteStats.maxStreak, infiniteStats.currentStreak);
  } else {
    infiniteStats.currentStreak = 0;
  }
}

// Fenêtre glissante des N derniers personnages tirés en mode Illimité, gardée en mémoire
// (non persistée : un F5 la réinitialise) pour éviter qu'un même personnage revienne trop vite.
const INFINITE_NO_REPEAT_WINDOW = 7;
let recentInfiniteNames = [];

function pickRandomCharacter(excludeNames) {
  const excludeSet = new Set(excludeNames || []);
  let pool = CHARACTERS.filter((c) => !excludeSet.has(c.name));
  if (pool.length === 0) pool = CHARACTERS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// --- UI ---

// Enlève les accents/diacritiques pour que la recherche/le matching de noms les ignore
// (ex : "toshiro" doit matcher "Tōshirō", "genryusai" doit matcher "Genryūsai").
function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

let mode = "daily";
let target = null;
let state = { guesses: [], finished: false, won: false };
let currentSuggestions = [];
let activeSuggestionIndex = -1;

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
const statsPanelEl = document.getElementById("statsPanel");
const statsTitleEl = document.getElementById("statsTitle");
const statsNoteEl = document.getElementById("statsNote");
const statPlayedEl = document.getElementById("statPlayed");
const statWinRateEl = document.getElementById("statWinRate");
const statStreakEl = document.getElementById("statStreak");
const statMaxStreakEl = document.getElementById("statMaxStreak");
const distributionEl = document.getElementById("distribution");

function renderStats() {
  if (!statsPanelEl) return;
  if (!state.finished) {
    statsPanelEl.hidden = true;
    return;
  }

  const stats = mode === "daily" ? loadStats() : infiniteStats;
  if (statsTitleEl) {
    statsTitleEl.textContent = mode === "daily" ? "Statistiques — Défi du jour" : "Statistiques — Illimité";
  }
  if (statsNoteEl) {
    statsNoteEl.hidden = mode !== "infinite";
    if (mode === "infinite") {
      statsNoteEl.textContent = "Session en cours uniquement : remises à zéro au rechargement de la page.";
    }
  }
  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
  statPlayedEl.textContent = String(stats.played);
  statWinRateEl.textContent = `${winRate}%`;
  statStreakEl.textContent = String(stats.currentStreak);
  statMaxStreakEl.textContent = String(stats.maxStreak);

  const maxCount = Math.max(1, ...stats.distribution);
  distributionEl.innerHTML = "";
  stats.distribution.forEach((count, i) => {
    const row = document.createElement("div");
    row.className = "dist-row";

    const label = document.createElement("span");
    label.className = "dist-label";
    label.textContent = String(i + 1);
    row.appendChild(label);

    const barWrap = document.createElement("div");
    barWrap.className = "dist-bar-wrap";
    const bar = document.createElement("div");
    bar.className = "dist-bar";
    if (state.won && state.guesses.length === i + 1) bar.classList.add("current");
    bar.style.width = `${count > 0 ? Math.max((count / maxCount) * 100, 8) : 0}%`;
    bar.textContent = String(count);
    barWrap.appendChild(bar);
    row.appendChild(barWrap);

    distributionEl.appendChild(row);
  });

  statsPanelEl.hidden = false;
}

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
  const target = normalize(name);
  return CHARACTERS.find((c) => normalize(c.name) === target);
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
  if (mode === "daily") {
    if (!state.statsRecorded) {
      recordDailyResult(won, state.guesses.length);
      state.statsRecorded = true;
    }
    saveState(state);
  } else {
    recordInfiniteResult(won, state.guesses.length);
  }
  guessInput.disabled = true;
  messageEl.className = won ? "message win" : "message lose";
  messageEl.textContent = won
    ? `Bravo ! Le personnage était bien ${target.name}.`
    : `Perdu ! Le personnage à trouver était ${target.name}.`;
  if (won) triggerVictoryAnimation();
  renderStats();
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
  currentSuggestions = [];
  activeSuggestionIndex = -1;
  if (!guessInput.disabled) guessInput.focus();
}

function highlightActiveSuggestion() {
  const items = suggestionsEl.querySelectorAll(".suggestion");
  items.forEach((item, i) => {
    item.classList.toggle("active", i === activeSuggestionIndex);
    if (i === activeSuggestionIndex) item.scrollIntoView({ block: "nearest" });
  });
}

function renderSuggestions() {
  const query = normalize(guessInput.value);
  suggestionsEl.innerHTML = "";
  currentSuggestions = [];
  activeSuggestionIndex = -1;
  if (!query) {
    suggestionsEl.hidden = true;
    return;
  }
  const matches = CHARACTERS.filter(
    (c) => normalize(c.name).includes(query) && !state.guesses.includes(c.name)
  ).slice(0, 8);

  if (matches.length === 0) {
    suggestionsEl.hidden = true;
    return;
  }

  currentSuggestions = matches;
  activeSuggestionIndex = 0;

  matches.forEach((c, i) => {
    const item = document.createElement("div");
    item.className = "suggestion";
    item.textContent = c.name;
    item.addEventListener("mouseenter", () => {
      activeSuggestionIndex = i;
      highlightActiveSuggestion();
    });
    item.addEventListener("mousedown", (e) => e.preventDefault());
    item.addEventListener("click", () => submitGuess(c.name));
    suggestionsEl.appendChild(item);
  });
  suggestionsEl.hidden = false;
  highlightActiveSuggestion();
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
    if (mode === "daily" && !state.statsRecorded) {
      recordDailyResult(state.won, state.guesses.length);
      state.statsRecorded = true;
      saveState(state);
    }
    renderStats();
  }
}

function resetBoard() {
  resultsBody.innerHTML = "";
  guessInput.value = "";
  guessInput.disabled = false;
  messageEl.className = "message";
  messageEl.textContent = "";
  suggestionsEl.hidden = true;
  if (statsPanelEl) statsPanelEl.hidden = true;
}

function startDailyMode() {
  target = getDailyCharacter();
  state = loadState();
  resetBoard();
  replayState();
}

function startInfiniteMode() {
  target = pickRandomCharacter(recentInfiniteNames);
  recentInfiniteNames.push(target.name);
  if (recentInfiniteNames.length > INFINITE_NO_REPEAT_WINDOW) {
    recentInfiniteNames = recentInfiniteNames.slice(-INFINITE_NO_REPEAT_WINDOW);
  }
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
  const suggestionsVisible = !suggestionsEl.hidden && currentSuggestions.length > 0;

  if (e.key === "ArrowDown") {
    if (!suggestionsVisible) return;
    e.preventDefault();
    activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, currentSuggestions.length - 1);
    highlightActiveSuggestion();
  } else if (e.key === "ArrowUp") {
    if (!suggestionsVisible) return;
    e.preventDefault();
    activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, 0);
    highlightActiveSuggestion();
  } else if (e.key === "Enter") {
    if (suggestionsVisible && activeSuggestionIndex >= 0) {
      submitGuess(currentSuggestions[activeSuggestionIndex].name);
      return;
    }
    const exact = findCharacterByName(guessInput.value);
    if (exact) submitGuess(exact.name);
  } else if (e.key === "Escape") {
    suggestionsEl.hidden = true;
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
