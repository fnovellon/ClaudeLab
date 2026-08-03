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
  { key: "rank", label: "Escouade / Rang", type: "numeric" },
  { key: "powerType", label: "Pouvoir", type: "exact" },
  { key: "bankaiOrResurreccion", label: "Bankai / Resurrección", type: "exact" },
  { key: "height", label: "Taille (cm)", type: "numeric" },
  { key: "firstArc", label: "Premier arc", type: "arc" },
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

function compareArc(guessVal, targetVal) {
  if (guessVal === targetVal) return { state: "correct" };
  const gi = ARC_ORDER.indexOf(guessVal);
  const ti = ARC_ORDER.indexOf(targetVal);
  return { state: "incorrect", direction: ti > gi ? "up" : "down" };
}

function compareAttribute(attr, guessChar, targetChar) {
  const guessVal = guessChar[attr.key];
  const targetVal = targetChar[attr.key];
  switch (attr.type) {
    case "array":
      return compareArray(guessVal, targetVal);
    case "numeric":
      return compareNumeric(guessVal, targetVal);
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

// --- UI ---

const target = getDailyCharacter();
let state = loadState();

const guessInput = document.getElementById("guessInput");
const suggestionsEl = document.getElementById("suggestions");
const resultsBody = document.getElementById("resultsBody");
const attemptsLeftEl = document.getElementById("attemptsLeft");
const messageEl = document.getElementById("message");
const headerRow = document.getElementById("headerRow");

function buildHeader() {
  const nameTh = document.createElement("th");
  nameTh.textContent = "Personnage";
  headerRow.appendChild(nameTh);
  for (const attr of ATTRIBUTES) {
    const th = document.createElement("th");
    th.textContent = attr.label;
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

function endGame(won) {
  state.finished = true;
  state.won = won;
  saveState(state);
  guessInput.disabled = true;
  messageEl.className = won ? "message win" : "message lose";
  messageEl.textContent = won
    ? `Bravo ! Le personnage était bien ${target.name}.`
    : `Perdu ! Le personnage à trouver était ${target.name}.`;
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
  } else {
    saveState(state);
  }

  guessInput.value = "";
  suggestionsEl.innerHTML = "";
  suggestionsEl.hidden = true;
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

buildHeader();
replayState();
