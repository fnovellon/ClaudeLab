// Dataset des personnages Bleach pour Bleachdle.
// Chargé comme script classique (pas de build) : expose la constante globale CHARACTERS.
//
// Champs de chaque personnage :
//   name                  : nom affiché (aussi utilisé pour l'autocomplete)
//   race                  : string[] (comparaison tri-state : vert / orange / rouge)
//   affiliation           : string[] (comparaison tri-state : vert / orange / rouge)
//   gender                : "Homme" | "Femme"
//   status                : "Vivant" | "Mort" | "Inconnu"
//   rank                  : number | null — numéro d'escouade (Gotei 13) ou d'Espada, sinon null
//   powerType             : type de pouvoir/arme
//   bankaiOrResurreccion  : "Oui" | "Non" | "N/A"
//   height                : taille en cm
//   firstArc              : arc de première apparition (voir ARC_ORDER dans game.js)
//   hairColor             : couleur de cheveux

const CHARACTERS = [
  { name: "Ichigo Kurosaki", race: ["Humain", "Shinigami", "Hollow", "Quincy"], affiliation: ["Groupe de Karakura"], gender: "Homme", status: "Vivant", rank: null, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 174, firstArc: "Agent des Shinigami", hairColor: "Orange" },
  { name: "Rukia Kuchiki", race: ["Shinigami"], affiliation: ["Gotei 13", "Clan Kuchiki"], gender: "Femme", status: "Vivant", rank: 13, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 144, firstArc: "Agent des Shinigami", hairColor: "Noir" },
  { name: "Renji Abarai", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Vivant", rank: 3, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 188, firstArc: "Soul Society", hairColor: "Rouge" },
  { name: "Orihime Inoue", race: ["Humain"], affiliation: ["Groupe de Karakura"], gender: "Femme", status: "Vivant", rank: null, powerType: "Shun Shun Rikka", bankaiOrResurreccion: "N/A", height: 160, firstArc: "Agent des Shinigami", hairColor: "Roux" },
  { name: "Yasutora Sado", race: ["Humain", "Fullbringer"], affiliation: ["Groupe de Karakura"], gender: "Homme", status: "Vivant", rank: null, powerType: "Fullbring", bankaiOrResurreccion: "N/A", height: 192, firstArc: "Agent des Shinigami", hairColor: "Brun" },
  { name: "Uryū Ishida", race: ["Humain", "Quincy"], affiliation: ["Quincy", "Sternritter"], gender: "Homme", status: "Vivant", rank: null, powerType: "Arc Quincy", bankaiOrResurreccion: "N/A", height: 176, firstArc: "Agent des Shinigami", hairColor: "Noir" },
  { name: "Kisuke Urahara", race: ["Humain", "Shinigami"], affiliation: ["Magasin Urahara", "Gotei 13"], gender: "Homme", status: "Vivant", rank: 12, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 179, firstArc: "Agent des Shinigami", hairColor: "Blond" },
  { name: "Yoruichi Shihōin", race: ["Shinigami"], affiliation: ["Onmitsukidō", "Gotei 13"], gender: "Femme", status: "Vivant", rank: 2, powerType: "Hakuda", bankaiOrResurreccion: "N/A", height: 165, firstArc: "Agent des Shinigami", hairColor: "Violet" },
  { name: "Kenpachi Zaraki", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Vivant", rank: 11, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 202, firstArc: "Soul Society", hairColor: "Noir" },
  { name: "Byakuya Kuchiki", race: ["Shinigami"], affiliation: ["Gotei 13", "Clan Kuchiki"], gender: "Homme", status: "Vivant", rank: 6, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 180, firstArc: "Soul Society", hairColor: "Noir" },
  { name: "Tōshirō Hitsugaya", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Vivant", rank: 10, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 133, firstArc: "Soul Society", hairColor: "Blanc" },
  { name: "Rangiku Matsumoto", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Femme", status: "Vivant", rank: 10, powerType: "Zanpakutō", bankaiOrResurreccion: "Non", height: 172, firstArc: "Soul Society", hairColor: "Blond" },
  { name: "Ikkaku Madarame", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Vivant", rank: 11, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 175, firstArc: "Soul Society", hairColor: "Aucun" },
  { name: "Yumichika Ayasegawa", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Vivant", rank: 11, powerType: "Zanpakutō", bankaiOrResurreccion: "Non", height: 167, firstArc: "Soul Society", hairColor: "Noir" },
  { name: "Jūshirō Ukitake", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Mort", rank: 13, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 191, firstArc: "Soul Society", hairColor: "Blanc" },
  { name: "Shunsui Kyōraku", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Vivant", rank: 1, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 186, firstArc: "Soul Society", hairColor: "Châtain" },
  { name: "Genryūsai Yamamoto", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Mort", rank: 1, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 175, firstArc: "Soul Society", hairColor: "Blanc" },
  { name: "Sōsuke Aizen", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Vivant", rank: 5, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 186, firstArc: "Soul Society", hairColor: "Brun" },
  { name: "Gin Ichimaru", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Mort", rank: 3, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 185, firstArc: "Soul Society", hairColor: "Argenté" },
  { name: "Kaname Tōsen", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Mort", rank: 9, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 179, firstArc: "Soul Society", hairColor: "Noir" },
  { name: "Grimmjow Jaegerjaquez", race: ["Arrancar"], affiliation: ["Espada"], gender: "Homme", status: "Vivant", rank: 6, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 190, firstArc: "Hueco Mundo", hairColor: "Bleu" },
  { name: "Ulquiorra Cifer", race: ["Arrancar"], affiliation: ["Espada"], gender: "Homme", status: "Mort", rank: 4, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 176, firstArc: "Hueco Mundo", hairColor: "Noir" },
  { name: "Nnoitra Gilga", race: ["Arrancar"], affiliation: ["Espada"], gender: "Homme", status: "Mort", rank: 5, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 200, firstArc: "Hueco Mundo", hairColor: "Noir" },
  { name: "Nelliel Tu Odelschwanck", race: ["Arrancar"], affiliation: ["Espada"], gender: "Femme", status: "Vivant", rank: 3, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 158, firstArc: "Hueco Mundo", hairColor: "Vert" },
  { name: "Coyote Starrk", race: ["Arrancar"], affiliation: ["Espada"], gender: "Homme", status: "Mort", rank: 1, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 189, firstArc: "Hueco Mundo", hairColor: "Brun" },
  { name: "Tier Halibel", race: ["Arrancar"], affiliation: ["Espada"], gender: "Femme", status: "Vivant", rank: 3, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 176, firstArc: "Hueco Mundo", hairColor: "Blond" },
  { name: "Kensei Muguruma", race: ["Shinigami"], affiliation: ["Gotei 13", "Vizards"], gender: "Homme", status: "Vivant", rank: 9, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 175, firstArc: "Hueco Mundo", hairColor: "Gris" },
  { name: "Shinji Hirako", race: ["Shinigami"], affiliation: ["Gotei 13", "Vizards"], gender: "Homme", status: "Vivant", rank: 5, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 169, firstArc: "Hueco Mundo", hairColor: "Blond" },
  { name: "Love Aikawa", race: ["Shinigami"], affiliation: ["Vizards"], gender: "Homme", status: "Vivant", rank: null, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 190, firstArc: "Hueco Mundo", hairColor: "Noir" },
  { name: "Hiyori Sarugaki", race: ["Shinigami"], affiliation: ["Vizards"], gender: "Femme", status: "Vivant", rank: null, powerType: "Zanpakutō", bankaiOrResurreccion: "Non", height: 148, firstArc: "Hueco Mundo", hairColor: "Blond" },
  { name: "Sajin Komamura", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Mort", rank: 7, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 260, firstArc: "Soul Society", hairColor: "Brun" },
  { name: "Retsu Unohana", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Femme", status: "Mort", rank: 4, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 165, firstArc: "Soul Society", hairColor: "Noir" },
  { name: "Isane Kotetsu", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Femme", status: "Vivant", rank: 4, powerType: "Zanpakutō", bankaiOrResurreccion: "Non", height: 175, firstArc: "Soul Society", hairColor: "Argenté" },
  { name: "Mayuri Kurotsuchi", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Homme", status: "Vivant", rank: 12, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 168, firstArc: "Soul Society", hairColor: "Multicolore" },
  { name: "Nemu Kurotsuchi", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Femme", status: "Vivant", rank: 12, powerType: "Zanpakutō", bankaiOrResurreccion: "Non", height: 165, firstArc: "Soul Society", hairColor: "Noir" },
  { name: "Sui-Feng", race: ["Shinigami"], affiliation: ["Gotei 13", "Onmitsukidō"], gender: "Femme", status: "Vivant", rank: 2, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 150, firstArc: "Soul Society", hairColor: "Noir" },
  { name: "Yhwach", race: ["Quincy"], affiliation: ["Sternritter"], gender: "Homme", status: "Mort", rank: null, powerType: "Pouvoir du Roi Quincy", bankaiOrResurreccion: "N/A", height: 195, firstArc: "Guerre Sanglante des Mille Ans", hairColor: "Blanc" },
  { name: "Jugram Haschwalth", race: ["Quincy"], affiliation: ["Sternritter"], gender: "Homme", status: "Vivant", rank: null, powerType: "Arc Quincy", bankaiOrResurreccion: "N/A", height: 187, firstArc: "Guerre Sanglante des Mille Ans", hairColor: "Blanc" },
  { name: "Bazz-B", race: ["Quincy"], affiliation: ["Sternritter"], gender: "Homme", status: "Mort", rank: null, powerType: "Arc Quincy", bankaiOrResurreccion: "N/A", height: 187, firstArc: "Guerre Sanglante des Mille Ans", hairColor: "Roux" },
  { name: "Momo Hinamori", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Femme", status: "Vivant", rank: 5, powerType: "Zanpakutō", bankaiOrResurreccion: "Non", height: 145, firstArc: "Soul Society", hairColor: "Noir" },
  { name: "Yachiru Kusajishi", race: ["Shinigami"], affiliation: ["Gotei 13"], gender: "Femme", status: "Vivant", rank: 11, powerType: "Zanpakutō", bankaiOrResurreccion: "Non", height: 104, firstArc: "Soul Society", hairColor: "Rose" },
  { name: "Kūkaku Shiba", race: ["Shinigami"], affiliation: ["Clan Shiba"], gender: "Femme", status: "Vivant", rank: null, powerType: "Kidō explosif", bankaiOrResurreccion: "N/A", height: 172, firstArc: "Soul Society", hairColor: "Noir" },
  { name: "Isshin Kurosaki", race: ["Humain", "Shinigami"], affiliation: ["Groupe de Karakura", "Gotei 13"], gender: "Homme", status: "Vivant", rank: 10, powerType: "Zanpakutō", bankaiOrResurreccion: "Oui", height: 182, firstArc: "Agent des Shinigami", hairColor: "Noir" },
  { name: "Ryūken Ishida", race: ["Humain", "Quincy"], affiliation: ["Quincy"], gender: "Homme", status: "Vivant", rank: null, powerType: "Arc Quincy", bankaiOrResurreccion: "N/A", height: 189, firstArc: "Guerre d'Hiver", hairColor: "Bleu-noir" },
  { name: "Kūgo Ginjō", race: ["Humain", "Fullbringer"], affiliation: ["Xcution"], gender: "Homme", status: "Mort", rank: null, powerType: "Fullbring", bankaiOrResurreccion: "N/A", height: 184, firstArc: "Pouvoir Perdu", hairColor: "Noir" },
  { name: "Riruka Dokugamine", race: ["Humain", "Fullbringer"], affiliation: ["Xcution"], gender: "Femme", status: "Vivant", rank: null, powerType: "Fullbring", bankaiOrResurreccion: "N/A", height: 149, firstArc: "Pouvoir Perdu", hairColor: "Rose" },
];
