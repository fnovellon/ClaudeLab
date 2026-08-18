// Dictionnaire de traductions pour l'interface de Bleachdle (FR/EN/ES/DE).
// Portée volontairement limitée à l'UI : les valeurs des personnages (race, affiliation,
// pouvoir, lieux, etc.) restent en français dans les 4 langues, comme le font la plupart des
// communautés Bleach avec la terminologie originale (Shinigami, Zanpakutō, Espada, Gotei 13...).
// Voir CLAUDE.md pour la décision complète. Chargé avant game.js ; expose t()/setLang()/currentLang.

const TRANSLATIONS = {
  fr: {
    subtitleDaily: "Devine le personnage Bleach du jour.",
    subtitleInfinite: "Devine le personnage Bleach — partie illimitée.",
    modeDaily: "Défi du jour",
    modeInfinite: "Illimité",
    statsToggle: "📊 Statistiques",
    encyclopediaBtn: "📖 Encyclopédie",
    searchPlaceholder: "Nom d'un personnage...",
    newGame: "Nouvelle partie",
    shareBtn: "📋 Partager mon résultat",
    shareBtnInfinite: "📋 Partager le défi",
    shareFeedback: "Copié dans le presse-papier !",
    attemptsLeft: "Essais restants : {n}",
    winMessage: "Bravo ! Le personnage était bien {name}.",
    loseMessage: "Perdu ! Le personnage à trouver était {name}.",
    statsTitleDaily: "Statistiques — Défi du jour",
    statsTitleInfinite: "Statistiques — Illimité",
    statsNoteInfinite: "Session en cours uniquement : remises à zéro au rechargement de la page.",
    statPlayed: "Parties",
    statWinRate: "Victoires",
    statStreak: "Série actuelle",
    statMaxStreak: "Meilleure série",
    distributionTitle: "Répartition des essais",
    legendCorrect: "Identique",
    legendPartial: "Partiel",
    legendIncorrect: "Différent",
    legendArrow: "▲ / ▼ = indice plus haut / plus bas",
    legendAge: "Âge = tranche (10-20, 20-50, 50-100, 100-150, 150-1000, 1000+ ans)",
    colName: "Personnage",
    colRace: "Race",
    colAffiliation: "Affiliation",
    colGender: "Genre",
    colStatus: "Statut",
    colLocation: "Lieu",
    colAge: "Âge",
    colRank: "Escouade / Rang",
    colPower: "Pouvoir",
    colBankai: "Bankai/Rés.",
    colHeight: "Taille",
    colFirstArc: "1er arc",
    colHair: "Cheveux",
    encyclopediaTitle: "Encyclopédie",
    encyclopediaClose: "Fermer",
    encyclopediaSearchPlaceholder: "Rechercher un personnage...",
    encyclopediaCountSingular: "{n} personnage",
    encyclopediaCountPlural: "{n} personnages",
    encyclopediaLockedTitle: "Termine la partie en cours pour consulter l'encyclopédie.",
    shareTitle: "Bleachdle #{n}",
    shareResultWin: "Trouvé en {n}/{max} essais ✅",
    shareResultLose: "Perdu ({max}/{max}) ❌",
    sharePrompt: "À toi de jouer : {url}",
    shareInfiniteTitle: "Bleachdle — Illimité",
    shareInfiniteInvite: "Même tirage de personnages que moi, à toi de jouer : {url}",
  },
  en: {
    subtitleDaily: "Guess today's Bleach character.",
    subtitleInfinite: "Guess a Bleach character — endless mode.",
    modeDaily: "Daily Challenge",
    modeInfinite: "Endless",
    statsToggle: "📊 Stats",
    encyclopediaBtn: "📖 Encyclopedia",
    searchPlaceholder: "Character name...",
    newGame: "New game",
    shareBtn: "📋 Share my result",
    shareBtnInfinite: "📋 Share the challenge",
    shareFeedback: "Copied to clipboard!",
    attemptsLeft: "Attempts left: {n}",
    winMessage: "Well done! The character was indeed {name}.",
    loseMessage: "Lost! The character to find was {name}.",
    statsTitleDaily: "Stats — Daily Challenge",
    statsTitleInfinite: "Stats — Endless",
    statsNoteInfinite: "Current session only: resets when the page reloads.",
    statPlayed: "Played",
    statWinRate: "Win rate",
    statStreak: "Current streak",
    statMaxStreak: "Best streak",
    distributionTitle: "Guess distribution",
    legendCorrect: "Match",
    legendPartial: "Partial",
    legendIncorrect: "Different",
    legendArrow: "▲ / ▼ = higher / lower hint",
    legendAge: "Age = bracket (10-20, 20-50, 50-100, 100-150, 150-1000, 1000+ years)",
    colName: "Character",
    colRace: "Race",
    colAffiliation: "Affiliation",
    colGender: "Gender",
    colStatus: "Status",
    colLocation: "Location",
    colAge: "Age",
    colRank: "Squad / Rank",
    colPower: "Power",
    colBankai: "Bankai/Res.",
    colHeight: "Height",
    colFirstArc: "First arc",
    colHair: "Hair",
    encyclopediaTitle: "Encyclopedia",
    encyclopediaClose: "Close",
    encyclopediaSearchPlaceholder: "Search a character...",
    encyclopediaCountSingular: "{n} character",
    encyclopediaCountPlural: "{n} characters",
    encyclopediaLockedTitle: "Finish the current game to browse the encyclopedia.",
    shareTitle: "Bleachdle #{n}",
    shareResultWin: "Found in {n}/{max} guesses ✅",
    shareResultLose: "Lost ({max}/{max}) ❌",
    sharePrompt: "Your turn: {url}",
    shareInfiniteTitle: "Bleachdle — Endless",
    shareInfiniteInvite: "Same character draw as me, your turn: {url}",
  },
  es: {
    subtitleDaily: "Adivina el personaje de Bleach del día.",
    subtitleInfinite: "Adivina un personaje de Bleach — modo infinito.",
    modeDaily: "Desafío diario",
    modeInfinite: "Infinito",
    statsToggle: "📊 Estadísticas",
    encyclopediaBtn: "📖 Enciclopedia",
    searchPlaceholder: "Nombre de un personaje...",
    newGame: "Nueva partida",
    shareBtn: "📋 Compartir mi resultado",
    shareBtnInfinite: "📋 Compartir el desafío",
    shareFeedback: "¡Copiado al portapapeles!",
    attemptsLeft: "Intentos restantes: {n}",
    winMessage: "¡Bien hecho! El personaje era {name}.",
    loseMessage: "¡Perdiste! El personaje a adivinar era {name}.",
    statsTitleDaily: "Estadísticas — Desafío diario",
    statsTitleInfinite: "Estadísticas — Infinito",
    statsNoteInfinite: "Solo la sesión actual: se reinicia al recargar la página.",
    statPlayed: "Partidas",
    statWinRate: "Victorias",
    statStreak: "Racha actual",
    statMaxStreak: "Mejor racha",
    distributionTitle: "Distribución de intentos",
    legendCorrect: "Idéntico",
    legendPartial: "Parcial",
    legendIncorrect: "Diferente",
    legendArrow: "▲ / ▼ = pista más alto / más bajo",
    legendAge: "Edad = franja (10-20, 20-50, 50-100, 100-150, 150-1000, 1000+ años)",
    colName: "Personaje",
    colRace: "Raza",
    colAffiliation: "Afiliación",
    colGender: "Género",
    colStatus: "Estado",
    colLocation: "Lugar",
    colAge: "Edad",
    colRank: "Escuadrón / Rango",
    colPower: "Poder",
    colBankai: "Bankai/Res.",
    colHeight: "Altura",
    colFirstArc: "1er arco",
    colHair: "Cabello",
    encyclopediaTitle: "Enciclopedia",
    encyclopediaClose: "Cerrar",
    encyclopediaSearchPlaceholder: "Buscar un personaje...",
    encyclopediaCountSingular: "{n} personaje",
    encyclopediaCountPlural: "{n} personajes",
    encyclopediaLockedTitle: "Termina la partida en curso para consultar la enciclopedia.",
    shareTitle: "Bleachdle #{n}",
    shareResultWin: "Encontrado en {n}/{max} intentos ✅",
    shareResultLose: "Perdido ({max}/{max}) ❌",
    sharePrompt: "Tu turno: {url}",
    shareInfiniteTitle: "Bleachdle — Infinito",
    shareInfiniteInvite: "Mismo sorteo de personajes que yo, tu turno: {url}",
  },
  de: {
    subtitleDaily: "Errate die heutige Bleach-Figur.",
    subtitleInfinite: "Errate eine Bleach-Figur — Endlosmodus.",
    modeDaily: "Tägliche Challenge",
    modeInfinite: "Endlos",
    statsToggle: "📊 Statistik",
    encyclopediaBtn: "📖 Enzyklopädie",
    searchPlaceholder: "Name einer Figur...",
    newGame: "Neues Spiel",
    shareBtn: "📋 Ergebnis teilen",
    shareBtnInfinite: "📋 Herausforderung teilen",
    shareFeedback: "In die Zwischenablage kopiert!",
    attemptsLeft: "Verbleibende Versuche: {n}",
    winMessage: "Gut gemacht! Die Figur war tatsächlich {name}.",
    loseMessage: "Verloren! Gesucht war {name}.",
    statsTitleDaily: "Statistik — Tägliche Challenge",
    statsTitleInfinite: "Statistik — Endlos",
    statsNoteInfinite: "Nur aktuelle Sitzung: wird beim Neuladen der Seite zurückgesetzt.",
    statPlayed: "Spiele",
    statWinRate: "Siegquote",
    statStreak: "Aktuelle Serie",
    statMaxStreak: "Beste Serie",
    distributionTitle: "Verteilung der Versuche",
    legendCorrect: "Übereinstimmung",
    legendPartial: "Teilweise",
    legendIncorrect: "Unterschiedlich",
    legendArrow: "▲ / ▼ = Hinweis höher / niedriger",
    legendAge: "Alter = Spanne (10-20, 20-50, 50-100, 100-150, 150-1000, 1000+ Jahre)",
    colName: "Figur",
    colRace: "Rasse",
    colAffiliation: "Zugehörigkeit",
    colGender: "Geschlecht",
    colStatus: "Status",
    colLocation: "Ort",
    colAge: "Alter",
    colRank: "Trupp / Rang",
    colPower: "Kraft",
    colBankai: "Bankai/Res.",
    colHeight: "Größe",
    colFirstArc: "1. Arc",
    colHair: "Haare",
    encyclopediaTitle: "Enzyklopädie",
    encyclopediaClose: "Schließen",
    encyclopediaSearchPlaceholder: "Figur suchen...",
    encyclopediaCountSingular: "{n} Figur",
    encyclopediaCountPlural: "{n} Figuren",
    encyclopediaLockedTitle: "Beende die laufende Partie, um die Enzyklopädie zu nutzen.",
    shareTitle: "Bleachdle #{n}",
    shareResultWin: "Gefunden in {n}/{max} Versuchen ✅",
    shareResultLose: "Verloren ({max}/{max}) ❌",
    sharePrompt: "Du bist dran: {url}",
    shareInfiniteTitle: "Bleachdle — Endlos",
    shareInfiniteInvite: "Gleiche Figuren-Ziehung wie ich, du bist dran: {url}",
  },
};

const SUPPORTED_LANGS = ["fr", "en", "es", "de"];
const LANG_STORAGE_KEY = "bleachdle-lang";

function detectDefaultLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {
    // localStorage indisponible (mode privé strict, etc.) : on retombe sur la détection navigateur.
  }
  const browserLang = (navigator.language || "fr").slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(browserLang) ? browserLang : "fr";
}

let currentLang = detectDefaultLang();

function t(key, vars) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.fr;
  let str = dict[key] ?? TRANSLATIONS.fr[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, v);
    }
  }
  return str;
}

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // localStorage indisponible : la préférence ne survivra pas au rechargement, tant pis.
  }
}

// --- Traduction des valeurs "génériques" du dataset (affichage uniquement) ---
// Contrairement à TRANSLATIONS (chrome d'UI), ceci traduit une partie des VALEURS de
// characters.js à l'affichage, mais seulement les champs qui ne sont pas du jargon Bleach
// (genre, statut, Oui/Non, une partie des lieux/couleurs de cheveux, "Humain" pour la race).
// Les termes propres à l'œuvre (Shinigami, Zanpakutō, Espada, Gotei 13, Soul Society, Hueco
// Mundo, Silbern, les affiliations, les noms d'arcs, les types de pouvoir...) restent en
// français dans les 4 langues, comme documenté dans CLAUDE.md — ne pas les ajouter ici sans
// revalider cette décision avec l'utilisateur. Le dataset lui-même (characters.js) n'est jamais
// modifié : la comparaison de guess (compareAttribute) continue d'opérer sur les valeurs
// françaises brutes, seul l'affichage (formatValue() dans game.js) passe par translateValue().
const VALUE_TRANSLATIONS = {
  gender: {
    Homme: { en: "Male", es: "Hombre", de: "Mann" },
    Femme: { en: "Female", es: "Mujer", de: "Frau" },
  },
  status: {
    Vivant: { en: "Alive", es: "Vivo", de: "Lebendig" },
    Mort: { en: "Dead", es: "Muerto", de: "Tot" },
    Inconnu: { en: "Unknown", es: "Desconocido", de: "Unbekannt" },
  },
  bankaiOrResurreccion: {
    Oui: { en: "Yes", es: "Sí", de: "Ja" },
    Non: { en: "No", es: "No", de: "Nein" },
  },
  race: {
    Humain: { en: "Human", es: "Humano", de: "Mensch" },
  },
  location: {
    "Monde Humain": { en: "Human World", es: "Mundo Humano", de: "Menschenwelt" },
    "Palais Royal": { en: "Royal Palace", es: "Palacio Real", de: "Königspalast" },
  },
  hairColor: {
    Orange: { en: "Orange", es: "Naranja", de: "Orange" },
    Noir: { en: "Black", es: "Negro", de: "Schwarz" },
    Blond: { en: "Blonde", es: "Rubio", de: "Blond" },
    Roux: { en: "Auburn", es: "Pelirrojo", de: "Rotbraun" },
    Rouge: { en: "Red", es: "Rojo", de: "Rot" },
    Argenté: { en: "Silver", es: "Plateado", de: "Silber" },
    Châtain: { en: "Brown", es: "Castaño", de: "Braun" },
    "Châtain clair": { en: "Light brown", es: "Castaño claro", de: "Hellbraun" },
    Vert: { en: "Green", es: "Verde", de: "Grün" },
    "Vert clair": { en: "Light green", es: "Verde claro", de: "Hellgrün" },
    Bleu: { en: "Blue", es: "Azul", de: "Blau" },
    Rose: { en: "Pink", es: "Rosa", de: "Pink" },
    Blanc: { en: "White", es: "Blanco", de: "Weiß" },
    Gris: { en: "Grey", es: "Gris", de: "Grau" },
    Brun: { en: "Brown", es: "Marrón", de: "Braun" },
    Violet: { en: "Purple", es: "Morado", de: "Lila" },
    Aucun: { en: "None", es: "Ninguno", de: "Keine" },
  },
};

function translateValue(fieldKey, value) {
  if (currentLang === "fr") return value;
  const entry = VALUE_TRANSLATIONS[fieldKey]?.[value];
  if (!entry) return value;
  return entry[currentLang] || value;
}

const AGE_UNIT_BY_LANG = { en: "years", es: "años", de: "Jahre" };

function translateAgeBracket(value) {
  if (currentLang === "fr" || !value) return value;
  const unit = AGE_UNIT_BY_LANG[currentLang];
  return unit ? value.replace("ans", unit) : value;
}
