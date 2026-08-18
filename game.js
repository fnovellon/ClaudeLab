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

// Note : "label" stocke une clé de traduction (voir i18n.js), pas le texte affiché directement —
// tout usage de attr.label doit passer par t(attr.label).
const ATTRIBUTES = [
  { key: "race", label: "colRace", type: "array" },
  { key: "affiliation", label: "colAffiliation", type: "array" },
  { key: "gender", label: "colGender", type: "exact" },
  { key: "status", label: "colStatus", type: "exact" },
  { key: "location", label: "colLocation", type: "exact" },
  { key: "ageBracket", label: "colAge", type: "ageBracket" },
  { key: "rank", label: "colRank", type: "numeric" },
  { key: "powerType", label: "colPower", type: "exact" },
  { key: "bankaiOrResurreccion", label: "colBankai", type: "exact" },
  { key: "height", label: "colHeight", type: "numeric" },
  { key: "firstArc", label: "colFirstArc", type: "arc" },
  { key: "hairColor", label: "colHair", type: "exact" },
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

function daysSinceEpoch() {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((todayUTC - EPOCH_UTC) / 86400000);
}

function getDailyCharacter() {
  const daysSince = daysSinceEpoch();
  const index = ((daysSince % CHARACTERS.length) + CHARACTERS.length) % CHARACTERS.length;
  return CHARACTERS[index];
}

// Numéro de défi affiché dans le texte de partage, façon Wordle (#1 le jour de l'EPOCH_UTC).
function getDailyPuzzleNumber() {
  return daysSinceEpoch() + 1;
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

// Traduit la valeur affichée pour les champs "génériques" (voir VALUE_TRANSLATIONS dans
// i18n.js) ; les termes propres à l'univers Bleach restent en français quelle que soit la
// langue. N'affecte que l'affichage : la comparaison de guess utilise toujours char[attr.key]
// brut (français), jamais cette fonction.
function formatValue(attr, char) {
  const val = char[attr.key];
  if (val === null || val === undefined) return "N/A";
  if (attr.key === "ageBracket") return translateAgeBracket(val);
  if (Array.isArray(val)) return val.map((v) => translateValue(attr.key, v)).join(" / ");
  return translateValue(attr.key, val);
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

// --- Tirage Illimité reproductible (pour le partage d'un défi) ---
// pickRandomCharacter() utilise un PRNG seedé (mulberry32) plutôt que Math.random() directement,
// afin qu'une même seed produise toujours la même séquence de personnages. La seed elle-même
// (infiniteSeed) n'est écrite dans l'URL qu'au moment où l'utilisateur clique "Partager" (voir
// shareInfiniteURL()) — PAS à chaque partie — pour ne pas casser le comportement existant
// "un F5 en mode Illimité repart sur un tirage totalement aléatoire" pour qui ne partage jamais.
// Une fois qu'un lien a été partagé (ou ouvert via ?duel=...), l'URL contient la seed et un F5
// ultérieur rejoue le même tirage depuis le début — c'est le comportement voulu pour ce cas-là.
const DUEL_URL_PARAM = "duel";
const SESSION_COUNT_URL_PARAM = "count";
const SESSION_TIME_URL_PARAM = "time";

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readSeedFromURL() {
  const raw = new URLSearchParams(window.location.search).get(DUEL_URL_PARAM);
  const n = Number(raw);
  return raw && Number.isFinite(n) && n > 0 ? n : null;
}

// Un lien de session (partagé via shareSessionURL()) ajoute count/time à côté de duel ; un
// lien de simple duel (un seul personnage, shareInfiniteURL()) n'a que duel — d'où null ici,
// ce qui laisse le boot retomber sur le comportement libre existant pour ces anciens liens.
function readSessionParamsFromURL() {
  const params = new URLSearchParams(window.location.search);
  const countRaw = params.get(SESSION_COUNT_URL_PARAM);
  const count = Number(countRaw);
  if (!countRaw || !Number.isFinite(count) || count <= 0) return null;
  const timeRaw = params.get(SESSION_TIME_URL_PARAM);
  const timeSeconds = Number(timeRaw);
  return { count, timeSeconds: Number.isFinite(timeSeconds) && timeSeconds >= 0 ? timeSeconds : 0 };
}

let infiniteSeed = null;
let infiniteRng = Math.random;

// Calculé une seule fois au chargement du script : si le lien ouvert contient une config de
// session (count/time en plus de duel), la toute première entrée en mode Illimité démarre
// directement cette session au lieu d'une partie libre — voir setMode().
let pendingSessionParamsFromURL = readSessionParamsFromURL();

function ensureInfiniteSeed() {
  if (infiniteSeed !== null) return;
  infiniteSeed = readSeedFromURL() ?? Math.floor(Math.random() * 0xffffffff) + 1;
  infiniteRng = mulberry32(infiniteSeed);
}

// N'écrit la seed dans l'URL qu'à l'appel (voir commentaire plus haut) ; renvoie l'URL complète
// à copier dans le presse-papier.
function shareInfiniteURL() {
  const url = new URL(window.location.href);
  url.searchParams.set(DUEL_URL_PARAM, String(infiniteSeed));
  window.history.replaceState(null, "", url);
  return url.toString();
}

// Comme shareInfiniteURL(), mais ajoute aussi le nombre de manches et la limite de temps de la
// session en cours, pour que le lien reproduise la session entière (même seed, même longueur,
// même minuteur) et pas juste un seul personnage.
function shareSessionURL() {
  const url = new URL(window.location.href);
  url.searchParams.set(DUEL_URL_PARAM, String(infiniteSeed));
  url.searchParams.set(SESSION_COUNT_URL_PARAM, String(session.total));
  url.searchParams.set(SESSION_TIME_URL_PARAM, String(sessionConfig.timeSeconds));
  window.history.replaceState(null, "", url);
  return url.toString();
}

function stripDuelParam() {
  if (!window.location.search.includes(DUEL_URL_PARAM)) return;
  const url = new URL(window.location.href);
  url.searchParams.delete(DUEL_URL_PARAM);
  url.searchParams.delete(SESSION_COUNT_URL_PARAM);
  url.searchParams.delete(SESSION_TIME_URL_PARAM);
  window.history.replaceState(null, "", url);
}

function pickRandomCharacter(excludeNames) {
  const excludeSet = new Set(excludeNames || []);
  let pool = CHARACTERS.filter((c) => !excludeSet.has(c.name));
  if (pool.length === 0) pool = CHARACTERS;
  return pool[Math.floor(infiniteRng() * pool.length)];
}

// --- Session Illimité (série de N personnages, chronométrée en option) ---
// Une "session" enchaîne N manches (chacune = une manche Illimité normale, même mécanique de
// jeu/stats/seed) via un bouton "Continuer" plutôt qu'un ré-tirage manuel, avec un score cumulé
// et, en option, un minuteur global qui termine la session dès qu'il expire. C'est une couche
// au-dessus du mode Illimité "libre" existant, pas un remplacement : newGameBtn (partie libre
// instantanée) garde exactement son comportement d'origine, sessionModeBtn ouvre la config pour
// qui veut une série. session === null signifie "pas de session active" (partie libre normale).
const SESSION_COUNT_OPTIONS = [5, 10, 15, 20];
const SESSION_TIME_OPTIONS = [0, 60, 120, 180, 300];
const SESSION_SCORE_PER_GUESS_STEP = 10;

let sessionConfig = { count: 10, timeSeconds: 0 };
let sessionConfigOpen = false;
let session = null;
let sessionTimerInterval = null;

// Score d'une manche : 0 si perdue, sinon dégressif selon le nombre d'essais utilisés
// (MAX_ATTEMPTS+1-essais) * 10 — deviner en 1 essai rapporte le plus de points.
function pointsForRound(won, guessCount) {
  if (!won) return 0;
  return (MAX_ATTEMPTS + 1 - guessCount) * SESSION_SCORE_PER_GUESS_STEP;
}

function stopSessionTimer() {
  if (sessionTimerInterval !== null) {
    window.clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
}

function resetInfiniteSession() {
  stopSessionTimer();
  session = null;
  sessionConfigOpen = false;
}

function formatSessionTime(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function updateSessionTimerDisplay() {
  if (!session || !session.deadline || !sessionTimerTextEl) return;
  sessionTimerTextEl.hidden = false;
  sessionTimerTextEl.textContent = `⏱ ${formatSessionTime((session.deadline - Date.now()) / 1000)}`;
}

function startSessionTimer() {
  stopSessionTimer();
  updateSessionTimerDisplay();
  sessionTimerInterval = window.setInterval(() => {
    if (!session || !session.deadline) {
      stopSessionTimer();
      return;
    }
    if (Date.now() >= session.deadline) {
      session.timedOut = true;
      stopSessionTimer();
      finishSession();
      return;
    }
    updateSessionTimerDisplay();
  }, 250);
}

function renderSessionProgress() {
  if (!session || !sessionProgressTextEl) return;
  const currentRound = session.phase === "roundEnd" ? session.results.length : session.results.length + 1;
  sessionProgressTextEl.textContent = t("sessionProgressText", { current: currentRound, total: session.total });
  sessionScoreTextEl.textContent = t("sessionScoreText", { score: session.score });
  if (session.deadline) {
    updateSessionTimerDisplay();
  } else if (sessionTimerTextEl) {
    sessionTimerTextEl.hidden = true;
  }
}

function renderSessionResults() {
  if (!session || !sessionResultsGridEl) return;
  const found = session.results.filter((r) => r.won).length;
  if (sessionResultsTimeoutNoteEl) sessionResultsTimeoutNoteEl.hidden = !session.timedOut;
  if (sessionResultsFoundEl) sessionResultsFoundEl.textContent = t("sessionResultsFound", { found, total: session.results.length });
  if (sessionResultsScoreEl) sessionResultsScoreEl.textContent = t("sessionResultsScore", { score: session.score });
  sessionResultsGridEl.innerHTML = "";
  session.results.forEach((r, i) => {
    const badge = document.createElement("span");
    badge.className = `session-round-badge ${r.won ? "won" : "lost"}`;
    badge.textContent = r.won ? "✓" : "✕";
    badge.title = `#${i + 1}`;
    sessionResultsGridEl.appendChild(badge);
  });
}

function startSessionRound() {
  ensureInfiniteSeed();
  target = pickRandomCharacter(recentInfiniteNames);
  recentInfiniteNames.push(target.name);
  if (recentInfiniteNames.length > INFINITE_NO_REPEAT_WINDOW) {
    recentInfiniteNames = recentInfiniteNames.slice(-INFINITE_NO_REPEAT_WINDOW);
  }
  state = { guesses: [], finished: false, won: false };
  session.phase = "playing";
  resetBoard();
  updateAttemptsLeft();
  renderSessionProgress();
}

function beginSession(count, timeSeconds) {
  sessionConfig = { count, timeSeconds };
  sessionConfigOpen = false;
  // Réinitialise le flux du PRNG à la position 0 pour la seed courante : si le joueur a déjà
  // joué en libre avant de lancer une session (le tout premier tirage d'Illimité en consomme
  // déjà une valeur), la session doit repartir de zéro pour que la seed partagée corresponde
  // bien à la manche 1 côté destinataire, quel que soit l'historique du partageur avant de
  // démarrer sa session.
  ensureInfiniteSeed();
  infiniteRng = mulberry32(infiniteSeed);
  recentInfiniteNames = [];
  session = {
    total: count,
    score: 0,
    results: [],
    deadline: timeSeconds > 0 ? Date.now() + timeSeconds * 1000 : null,
    timedOut: false,
    phase: "playing",
  };
  if (session.deadline) startSessionTimer();
  startSessionRound();
}

// Appelé depuis endGame() quand une manche de session se termine (gagnée ou perdue) : cumule le
// score, passe à la manche suivante (bouton Continuer) ou termine la session si c'était la
// dernière manche prévue.
function onSessionRoundResolved() {
  if (!session) return;
  session.score += pointsForRound(state.won, state.guesses.length);
  session.results.push({ won: state.won, guesses: state.guesses.length });
  if (session.results.length >= session.total) {
    finishSession();
  } else {
    session.phase = "roundEnd";
    syncInfiniteUI();
    renderSessionProgress();
    if (sessionContinueBtn) sessionContinueBtn.focus();
  }
}

function finishSession() {
  stopSessionTimer();
  if (session) session.phase = "results";
  syncGameControls();
  syncInfiniteUI();
  renderSessionResults();
}

// Bascule la visibilité de tout ce qui est spécifique au mode Illimité "session" (config, barre
// de progression/score/minuteur, bouton Continuer, écran de résultats) en fonction de l'état
// courant (sessionConfigOpen / session), et masque le plateau de jeu normal (champ de recherche,
// tableau, essais/message) pendant la config et l'écran de résultats puisqu'aucune manche n'est
// alors en cours.
function syncInfiniteUI() {
  if (!sessionConfigPanel) return;
  if (mode !== "infinite") {
    sessionConfigPanel.hidden = true;
    sessionProgressEl.hidden = true;
    sessionContinueBtn.hidden = true;
    sessionResultsPanel.hidden = true;
    if (searchBoxEl) searchBoxEl.hidden = false;
    if (tableWrapperEl) tableWrapperEl.hidden = false;
    attemptsLeftEl.hidden = false;
    messageEl.hidden = false;
    syncGameControls();
    return;
  }

  const inSession = session !== null;
  const showFreeButtons = !sessionConfigOpen && !inSession;
  if (newGameBtn) newGameBtn.hidden = !showFreeButtons;
  if (sessionModeBtn) sessionModeBtn.hidden = !showFreeButtons;
  sessionConfigPanel.hidden = !sessionConfigOpen;

  const playingPhase = inSession && session.phase === "playing";
  const roundEndPhase = inSession && session.phase === "roundEnd";
  const resultsPhase = inSession && session.phase === "results";

  sessionProgressEl.hidden = !(playingPhase || roundEndPhase);
  sessionContinueBtn.hidden = !roundEndPhase;
  sessionResultsPanel.hidden = !resultsPhase;

  const hideBoard = sessionConfigOpen || resultsPhase;
  if (searchBoxEl) searchBoxEl.hidden = hideBoard;
  if (tableWrapperEl) tableWrapperEl.hidden = hideBoard;
  attemptsLeftEl.hidden = hideBoard;
  messageEl.hidden = hideBoard;
  syncGameControls();
}

function syncSessionPills() {
  if (!sessionCountPills) return;
  sessionCountPills.querySelectorAll(".session-pill").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.count) === sessionConfig.count);
  });
  sessionTimePills.querySelectorAll(".session-pill").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.seconds) === sessionConfig.timeSeconds);
  });
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
const statsToggleBtn = document.getElementById("statsToggleBtn");
const shareBtn = document.getElementById("shareBtn");
const shareFeedbackEl = document.getElementById("shareFeedback");
const encyclopediaBtn = document.getElementById("encyclopediaBtn");
const encyclopediaModal = document.getElementById("encyclopediaModal");
const encyclopediaCloseBtn = document.getElementById("encyclopediaCloseBtn");
const encyclopediaSearchInput = document.getElementById("encyclopediaSearch");
const encyclopediaCountEl = document.getElementById("encyclopediaCount");
const encyclopediaHeaderRow = document.getElementById("encyclopediaHeaderRow");
const encyclopediaBody = document.getElementById("encyclopediaBody");
const langSwitcherEl = document.getElementById("langSwitcher");
const encyclopediaTitleEl = document.getElementById("encyclopediaTitle");
const statPlayedLabelEl = document.getElementById("statPlayedLabel");
const statWinRateLabelEl = document.getElementById("statWinRateLabel");
const statStreakLabelEl = document.getElementById("statStreakLabel");
const statMaxStreakLabelEl = document.getElementById("statMaxStreakLabel");
const distributionTitleEl = document.getElementById("distributionTitle");
const legendCorrectEl = document.getElementById("legendCorrect");
const legendPartialEl = document.getElementById("legendPartial");
const legendIncorrectEl = document.getElementById("legendIncorrect");
const legendArrowEl = document.getElementById("legendArrow");
const legendAgeEl = document.getElementById("legendAge");
const searchBoxEl = document.querySelector(".search-box");
const tableWrapperEl = document.querySelector(".table-wrapper");
const sessionModeBtn = document.getElementById("sessionModeBtn");
const sessionConfigPanel = document.getElementById("sessionConfigPanel");
const sessionConfigTitleEl = document.getElementById("sessionConfigTitle");
const sessionCountLabelEl = document.getElementById("sessionCountLabel");
const sessionTimeLabelEl = document.getElementById("sessionTimeLabel");
const sessionCountPills = document.getElementById("sessionCountPills");
const sessionTimePills = document.getElementById("sessionTimePills");
const sessionStartBtn = document.getElementById("sessionStartBtn");
const sessionCancelBtn = document.getElementById("sessionCancelBtn");
const sessionProgressEl = document.getElementById("sessionProgress");
const sessionProgressTextEl = document.getElementById("sessionProgressText");
const sessionScoreTextEl = document.getElementById("sessionScoreText");
const sessionTimerTextEl = document.getElementById("sessionTimerText");
const sessionQuitBtn = document.getElementById("sessionQuitBtn");
const sessionContinueBtn = document.getElementById("sessionContinueBtn");
const sessionResultsPanel = document.getElementById("sessionResultsPanel");
const sessionResultsTitleEl = document.getElementById("sessionResultsTitle");
const sessionResultsTimeoutNoteEl = document.getElementById("sessionResultsTimeoutNote");
const sessionResultsFoundEl = document.getElementById("sessionResultsFound");
const sessionResultsScoreEl = document.getElementById("sessionResultsScore");
const sessionResultsGridEl = document.getElementById("sessionResultsGrid");
const sessionShareBtn = document.getElementById("sessionShareBtn");
const sessionRestartBtn = document.getElementById("sessionRestartBtn");

// Bascule manuelle indépendante de la fin de partie (voir statsToggleBtn) : permet de
// consulter les stats à tout moment, en plus de l'affichage automatique en fin de partie.
let statsOpen = false;

function renderStatsContent() {
  if (!statsPanelEl) return;

  const stats = mode === "daily" ? loadStats() : infiniteStats;
  if (statsTitleEl) {
    statsTitleEl.textContent = mode === "daily" ? t("statsTitleDaily") : t("statsTitleInfinite");
  }
  if (statsNoteEl) {
    statsNoteEl.hidden = mode !== "infinite";
    if (mode === "infinite") {
      statsNoteEl.textContent = t("statsNoteInfinite");
    }
  }
  if (statPlayedLabelEl) statPlayedLabelEl.textContent = t("statPlayed");
  if (statWinRateLabelEl) statWinRateLabelEl.textContent = t("statWinRate");
  if (statStreakLabelEl) statStreakLabelEl.textContent = t("statStreak");
  if (statMaxStreakLabelEl) statMaxStreakLabelEl.textContent = t("statMaxStreak");
  if (distributionTitleEl) distributionTitleEl.textContent = t("distributionTitle");
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
}

function updateStatsVisibility() {
  if (!statsPanelEl) return;
  const shouldShow = statsOpen || state.finished;
  if (shouldShow) renderStatsContent();
  statsPanelEl.hidden = !shouldShow;
  if (statsToggleBtn) statsToggleBtn.classList.toggle("active", statsOpen);
}

function buildHeader() {
  headerRow.innerHTML = "";
  const nameTh = document.createElement("th");
  nameTh.textContent = t("colName");
  headerRow.appendChild(nameTh);
  for (const attr of ATTRIBUTES) {
    const th = document.createElement("th");
    th.textContent = t(attr.label);
    if (attr.title) th.title = attr.title;
    headerRow.appendChild(th);
  }
}

// --- Encyclopédie ---
// Tableau consultable de tous les CHARACTERS, colonnes triables, recherche par nom
// (accent-insensitive via normalize()). Volontairement bloquée pendant une partie en cours
// (state.finished === false) pour ne pas servir de antisèche sur le personnage à deviner —
// voir syncGameControls() qui désactive encyclopediaBtn en conséquence.

let encyclopediaSort = { key: "name", dir: "asc" };
const ENCYCLOPEDIA_COLUMNS = [{ key: "name", label: "colName" }, ...ATTRIBUTES];

function encyclopediaCompare(key, charA, charB) {
  if (key === "name") return charA.name.localeCompare(charB.name, "fr");
  const attr = ATTRIBUTES.find((a) => a.key === key);
  const av = charA[key];
  const bv = charB[key];
  if (attr.type === "array") {
    return (av || []).join(", ").localeCompare((bv || []).join(", "), "fr");
  }
  if (attr.type === "numeric") {
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return av - bv;
  }
  if (attr.type === "ageBracket") return AGE_BRACKET_ORDER.indexOf(av) - AGE_BRACKET_ORDER.indexOf(bv);
  if (attr.type === "arc") return ARC_ORDER.indexOf(av) - ARC_ORDER.indexOf(bv);
  return String(av).localeCompare(String(bv), "fr");
}

function buildEncyclopediaHeader() {
  if (!encyclopediaHeaderRow) return;
  encyclopediaHeaderRow.innerHTML = "";
  for (const col of ENCYCLOPEDIA_COLUMNS) {
    const th = document.createElement("th");
    th.textContent = t(col.label);
    if (encyclopediaSort.key === col.key) {
      const arrow = document.createElement("span");
      arrow.className = "sort-arrow";
      arrow.textContent = encyclopediaSort.dir === "asc" ? " ▲" : " ▼";
      th.appendChild(arrow);
    }
    th.addEventListener("click", () => {
      if (encyclopediaSort.key === col.key) {
        encyclopediaSort.dir = encyclopediaSort.dir === "asc" ? "desc" : "asc";
      } else {
        encyclopediaSort = { key: col.key, dir: "asc" };
      }
      buildEncyclopediaHeader();
      renderEncyclopediaTable();
    });
    encyclopediaHeaderRow.appendChild(th);
  }
}

function renderEncyclopediaTable() {
  if (!encyclopediaBody) return;
  const query = normalize(encyclopediaSearchInput ? encyclopediaSearchInput.value : "");
  const rows = CHARACTERS.filter((c) => normalize(c.name).includes(query)).sort((a, b) => {
    const cmp = encyclopediaCompare(encyclopediaSort.key, a, b);
    return encyclopediaSort.dir === "asc" ? cmp : -cmp;
  });

  encyclopediaBody.innerHTML = "";
  for (const c of rows) {
    const tr = document.createElement("tr");
    const nameTd = document.createElement("td");
    nameTd.textContent = c.name;
    tr.appendChild(nameTd);
    for (const attr of ATTRIBUTES) {
      const td = document.createElement("td");
      td.textContent = formatValue(attr, c);
      tr.appendChild(td);
    }
    encyclopediaBody.appendChild(tr);
  }

  if (encyclopediaCountEl) {
    encyclopediaCountEl.textContent =
      rows.length === 1
        ? t("encyclopediaCountSingular", { n: rows.length })
        : t("encyclopediaCountPlural", { n: rows.length });
  }
}

function openEncyclopedia() {
  if (!isEncyclopediaAllowed() || !encyclopediaModal) return;
  encyclopediaModal.hidden = false;
  if (encyclopediaSearchInput) encyclopediaSearchInput.value = "";
  buildEncyclopediaHeader();
  renderEncyclopediaTable();
  if (encyclopediaSearchInput) encyclopediaSearchInput.focus();
}

function closeEncyclopedia() {
  if (encyclopediaModal) encyclopediaModal.hidden = true;
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
    cell.dataset.label = t(attr.label);
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
  attemptsLeftEl.textContent = t("attemptsLeft", { n: Math.max(remaining, 0) });
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

// L'encyclopédie n'est bloquante que pendant une partie effectivement commencée (au moins une
// tentative soumise) : avant la première tentative, la consulter ne donne aucun avantage puisque
// rien n'a encore été comparé au personnage à deviner.
function isEncyclopediaAllowed() {
  return state.finished || state.guesses.length === 0;
}

// Bouton "Encyclopédie" désactivé tant qu'une partie est en cours ; bouton "Partager" (défi
// simple, une seule cible) visible en Défi du jour seulement une fois la partie finie, et en
// Illimité hors session (partager le tirage/lien ne révèle rien, donc pas besoin d'attendre la
// fin) — masqué pendant une session, qui a son propre bouton de partage en fin de série
// (sessionShareBtn, voir finishSession()). Synchronisés à chaque changement d'état de partie
// (tentative soumise, fin de partie, nouvelle partie, reload).
function syncGameControls() {
  if (shareBtn) {
    const showInfiniteShare = mode === "infinite" && session === null && !sessionConfigOpen;
    shareBtn.hidden = !((mode === "daily" && state.finished) || showInfiniteShare);
    shareBtn.textContent = mode === "daily" ? t("shareBtn") : t("shareBtnInfinite");
  }
  if (encyclopediaBtn) {
    const allowed = isEncyclopediaAllowed();
    encyclopediaBtn.disabled = !allowed;
    encyclopediaBtn.title = allowed ? "" : t("encyclopediaLockedTitle");
  }
}

// Grille d'émojis partagée par buildShareText() (Défi du jour) et buildInfiniteShareText()
// (Illimité) : une ligne par tentative, une colonne par attribut (même ordre que ATTRIBUTES,
// donc que les colonnes du tableau de jeu) — 🟩 identique, 🟨 partiel, ⬜ différent. Reprend
// directement le code couleur déjà utilisé dans le jeu, donc pas besoin de légende séparée.
function buildGuessGridRows() {
  return state.guesses.map((name) => {
    const guessChar = findCharacterByName(name);
    return ATTRIBUTES.map((attr) => {
      const result = compareAttribute(attr, guessChar, target);
      if (result.state === "correct") return "🟩";
      if (result.state === "partial") return "🟨";
      return "⬜";
    }).join("");
  });
}

// Texte de partage façon Wordle pour le Défi du jour : numéro du défi, résultat, grille, lien.
function buildShareText() {
  const puzzleNumber = getDailyPuzzleNumber();
  const resultLine = state.won
    ? t("shareResultWin", { n: state.guesses.length, max: MAX_ATTEMPTS })
    : t("shareResultLose", { max: MAX_ATTEMPTS });
  const rows = buildGuessGridRows();
  const title = `${t("shareTitle", { n: puzzleNumber })} — ${resultLine}`;
  return [title, ...rows, "", t("sharePrompt", { url: window.location.href })].join("\n");
}

// Texte de partage pour le mode Illimité : invite un ami à jouer le même tirage de personnages
// (seed dans l'URL, voir shareInfiniteURL()). Si la partie en cours est terminée, inclut aussi
// son résultat/sa grille ; sinon juste l'invitation, puisque partager en cours de partie ne
// révèle rien (le destinataire commence sa propre partie contre le même personnage).
function buildInfiniteShareText() {
  const url = shareInfiniteURL();
  const invite = t("shareInfiniteInvite", { url });
  if (!state.finished) {
    return [t("shareInfiniteTitle"), "", invite].join("\n");
  }
  const resultLine = state.won
    ? t("shareResultWin", { n: state.guesses.length, max: MAX_ATTEMPTS })
    : t("shareResultLose", { max: MAX_ATTEMPTS });
  const rows = buildGuessGridRows();
  return [`${t("shareInfiniteTitle")} — ${resultLine}`, ...rows, "", invite].join("\n");
}

// Texte de partage d'une session terminée : score, X/N trouvés, une ligne compacte ✅/❌ par
// manche (une grille par-attribut comme buildShareText() serait illisible sur N manches), et un
// lien reproduisant la session entière (seed + nombre de manches + limite de temps).
function buildSessionShareText() {
  const url = shareSessionURL();
  const found = session.results.filter((r) => r.won).length;
  const resultLine = t("shareSessionResult", { found, total: session.results.length, score: session.score });
  const rounds = session.results.map((r) => (r.won ? "✅" : "❌")).join("");
  const invite = t("shareSessionInvite", { total: session.total, url });
  return [`${t("shareSessionTitle")} — ${resultLine}`, rounds, "", invite].join("\n");
}

let shareFeedbackTimeout = null;

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
  if (shareFeedbackEl) {
    shareFeedbackEl.hidden = false;
    window.clearTimeout(shareFeedbackTimeout);
    shareFeedbackTimeout = window.setTimeout(() => {
      shareFeedbackEl.hidden = true;
    }, 2500);
  }
}

async function copyShareText() {
  await copyTextToClipboard(mode === "daily" ? buildShareText() : buildInfiniteShareText());
}

async function copySessionShareText() {
  if (!session) return;
  await copyTextToClipboard(buildSessionShareText());
}

// Rejoue le message de fin de partie à partir de l'état courant, sans effet de bord (pas
// d'enregistrement de stats) — utilisé aussi bien à la fin d'une partie qu'au changement de
// langue, pour que le message reste cohérent avec state.won/target.name.
function renderMessage() {
  if (!state.finished) {
    messageEl.className = "message";
    messageEl.textContent = "";
    return;
  }
  messageEl.className = state.won ? "message win" : "message lose";
  messageEl.textContent = state.won ? t("winMessage", { name: target.name }) : t("loseMessage", { name: target.name });
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
    if (session) onSessionRoundResolved();
  }
  guessInput.disabled = true;
  renderMessage();
  if (won) triggerVictoryAnimation();
  updateStatsVisibility();
  syncGameControls();
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
  syncGameControls();

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

// Reconstruit intégralement le tableau des tentatives à partir de state.guesses — utilisé au
// chargement d'une partie déjà en cours (replayState()) et lors d'un changement de langue, pour
// que les libellés de colonnes en vue mobile (data-label) restent cohérents avec la langue active.
function rerenderResultsBody() {
  resultsBody.innerHTML = "";
  for (const name of state.guesses) {
    const guessChar = findCharacterByName(name);
    if (guessChar) renderGuessRow(guessChar);
  }
}

function replayState() {
  rerenderResultsBody();
  updateAttemptsLeft();
  if (state.finished) {
    guessInput.disabled = true;
    renderMessage();
    if (mode === "daily" && !state.statsRecorded) {
      recordDailyResult(state.won, state.guesses.length);
      state.statsRecorded = true;
      saveState(state);
    }
    updateStatsVisibility();
    syncGameControls();
  }
}

function resetBoard() {
  resultsBody.innerHTML = "";
  guessInput.value = "";
  guessInput.disabled = false;
  messageEl.className = "message";
  messageEl.textContent = "";
  suggestionsEl.hidden = true;
  if (shareFeedbackEl) shareFeedbackEl.hidden = true;
  if (encyclopediaModal) encyclopediaModal.hidden = true;
  updateStatsVisibility();
  syncGameControls();
  syncInfiniteUI();
}

function startDailyMode() {
  resetInfiniteSession();
  stripDuelParam();
  target = getDailyCharacter();
  state = loadState();
  resetBoard();
  replayState();
}

function startInfiniteMode() {
  resetInfiniteSession();
  ensureInfiniteSeed();
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
  subtitleEl.textContent = mode === "daily" ? t("subtitleDaily") : t("subtitleInfinite");
  if (mode === "daily") {
    startDailyMode();
  } else if (pendingSessionParamsFromURL) {
    const params = pendingSessionParamsFromURL;
    pendingSessionParamsFromURL = null;
    resetInfiniteSession();
    beginSession(params.count, params.timeSeconds);
  } else {
    startInfiniteMode();
  }
}

function syncLangButtons() {
  if (!langSwitcherEl) return;
  langSwitcherEl.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });
}

// Applique la langue courante à tout ce qui est affiché : libellés statiques (boutons, légende,
// placeholders), en-têtes de tableaux reconstruits (buildHeader()/buildEncyclopediaHeader()),
// tentatives déjà rendues (rerenderResultsBody(), pour que le data-label mobile suive la langue),
// et contenu dépendant de l'état de partie (message, stats, encyclopédie si ouverte). Appelée au
// démarrage et à chaque changement de langue.
function applyLanguage() {
  document.documentElement.lang = currentLang;
  syncLangButtons();

  guessInput.placeholder = t("searchPlaceholder");
  dailyModeBtn.textContent = t("modeDaily");
  infiniteModeBtn.textContent = t("modeInfinite");
  if (statsToggleBtn) statsToggleBtn.textContent = t("statsToggle");
  if (encyclopediaBtn) encyclopediaBtn.textContent = t("encyclopediaBtn");
  newGameBtn.textContent = t("newGame");
  if (shareFeedbackEl) shareFeedbackEl.textContent = t("shareFeedback");
  subtitleEl.textContent = mode === "daily" ? t("subtitleDaily") : t("subtitleInfinite");

  if (legendCorrectEl) legendCorrectEl.textContent = t("legendCorrect");
  if (legendPartialEl) legendPartialEl.textContent = t("legendPartial");
  if (legendIncorrectEl) legendIncorrectEl.textContent = t("legendIncorrect");
  if (legendArrowEl) legendArrowEl.textContent = t("legendArrow");
  if (legendAgeEl) legendAgeEl.textContent = t("legendAge");

  if (encyclopediaTitleEl) encyclopediaTitleEl.textContent = t("encyclopediaTitle");
  if (encyclopediaCloseBtn) encyclopediaCloseBtn.setAttribute("aria-label", t("encyclopediaClose"));
  if (encyclopediaSearchInput) encyclopediaSearchInput.placeholder = t("encyclopediaSearchPlaceholder");

  if (sessionModeBtn) sessionModeBtn.textContent = t("sessionModeBtn");
  if (sessionConfigTitleEl) sessionConfigTitleEl.textContent = t("sessionConfigTitle");
  if (sessionCountLabelEl) sessionCountLabelEl.textContent = t("sessionCountLabel");
  if (sessionTimeLabelEl) sessionTimeLabelEl.textContent = t("sessionTimeLabel");
  if (sessionStartBtn) sessionStartBtn.textContent = t("sessionStartBtn");
  if (sessionCancelBtn) sessionCancelBtn.textContent = t("sessionCancelBtn");
  if (sessionContinueBtn) sessionContinueBtn.textContent = t("sessionContinueBtn");
  if (sessionQuitBtn) sessionQuitBtn.setAttribute("aria-label", t("sessionQuitBtn"));
  if (sessionResultsTitleEl) sessionResultsTitleEl.textContent = t("sessionResultsTitle");
  if (sessionResultsTimeoutNoteEl) sessionResultsTimeoutNoteEl.textContent = t("sessionResultsTimeout");
  if (sessionShareBtn) sessionShareBtn.textContent = t("sessionShareBtn");
  if (sessionRestartBtn) sessionRestartBtn.textContent = t("sessionRestartBtn");
  if (sessionTimePills) {
    sessionTimePills.querySelectorAll(".session-pill").forEach((btn) => {
      const seconds = Number(btn.dataset.seconds);
      btn.textContent = seconds === 0 ? t("sessionTimeNone") : t("sessionTimeMinutes", { n: seconds / 60 });
    });
  }

  buildHeader();
  rerenderResultsBody();
  updateAttemptsLeft();
  renderMessage();
  syncGameControls();
  updateStatsVisibility();

  if (encyclopediaModal && !encyclopediaModal.hidden) {
    buildEncyclopediaHeader();
    renderEncyclopediaTable();
  }
  if (session) {
    renderSessionProgress();
    if (session.phase === "results") renderSessionResults();
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

if (sessionModeBtn) {
  sessionModeBtn.addEventListener("click", () => {
    sessionConfigOpen = true;
    syncSessionPills();
    syncInfiniteUI();
  });
}
if (sessionCancelBtn) {
  sessionCancelBtn.addEventListener("click", () => {
    sessionConfigOpen = false;
    syncInfiniteUI();
  });
}
if (sessionStartBtn) {
  sessionStartBtn.addEventListener("click", () => {
    beginSession(sessionConfig.count, sessionConfig.timeSeconds);
  });
}
if (sessionContinueBtn) {
  sessionContinueBtn.addEventListener("click", () => {
    if (session) startSessionRound();
  });
}
if (sessionQuitBtn) {
  sessionQuitBtn.addEventListener("click", () => {
    if (session) finishSession();
  });
}
if (sessionRestartBtn) {
  sessionRestartBtn.addEventListener("click", () => {
    session = null;
    sessionConfigOpen = true;
    syncSessionPills();
    syncInfiniteUI();
  });
}
if (sessionCountPills) {
  sessionCountPills.querySelectorAll(".session-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      sessionConfig.count = Number(btn.dataset.count);
      syncSessionPills();
    });
  });
}
if (sessionTimePills) {
  sessionTimePills.querySelectorAll(".session-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      sessionConfig.timeSeconds = Number(btn.dataset.seconds);
      syncSessionPills();
    });
  });
}

if (statsToggleBtn) {
  statsToggleBtn.addEventListener("click", () => {
    statsOpen = !statsOpen;
    updateStatsVisibility();
  });
}

if (shareBtn) {
  shareBtn.addEventListener("click", () => {
    copyShareText();
  });
}

if (sessionShareBtn) {
  sessionShareBtn.addEventListener("click", () => {
    copySessionShareText();
  });
}

if (encyclopediaBtn) encyclopediaBtn.addEventListener("click", openEncyclopedia);
if (encyclopediaCloseBtn) encyclopediaCloseBtn.addEventListener("click", closeEncyclopedia);
if (encyclopediaSearchInput) encyclopediaSearchInput.addEventListener("input", renderEncyclopediaTable);
if (encyclopediaModal) {
  encyclopediaModal.addEventListener("click", (e) => {
    if (e.target === encyclopediaModal) closeEncyclopedia();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && encyclopediaModal && !encyclopediaModal.hidden) closeEncyclopedia();
});

if (langSwitcherEl) {
  langSwitcherEl.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLang(btn.dataset.lang);
      applyLanguage();
    });
  });
}

syncSessionPills();
applyLanguage();
if (versionTagEl) versionTagEl.textContent = `v${APP_VERSION}`;
// Ouvrir un lien de défi (?duel=<seed>) démarre directement en mode Illimité avec ce tirage.
setMode(readSeedFromURL() !== null ? "infinite" : "daily");
