# ClaudeLab

## Bleachdle

Un mini-jeu de devinette de personnage Bleach, façon Wordle, avec deux modes :
- **Défi du jour** : un personnage secret différent chaque jour, identique
  pour tout le monde.
- **Illimité** : un personnage aléatoire à chaque partie, rejouable autant
  de fois que voulu via le bouton "Nouvelle partie".

Jusqu'à 8 tentatives pour trouver le personnage, dans les deux modes.

Jouable directement sur GitHub Pages une fois activé pour ce dépôt (Settings
→ Pages → déployer depuis la branche `main`, dossier `/root`), ou en local en
ouvrant `index.html` dans un navigateur (double-clic, ou via un petit
serveur statique, ex. `npx serve .`).

### Comment jouer

1. Choisir le mode "Défi du jour" ou "Illimité" en haut de la page.
2. Taper le nom d'un personnage dans le champ de recherche (les accents sont
   ignorés, ex. "toshiro" trouve "Tōshirō"). Naviguer dans les suggestions
   avec les flèches ↑/↓ ou la souris, puis valider avec Entrée ou un clic —
   Entrée valide la suggestion surlignée même si le texte tapé n'est pas
   exact.
3. Après chaque tentative, chaque attribut du personnage proposé s'affiche :
   - **vert** : identique au personnage à trouver
   - **orange** : partiellement correct (ex : personnages hybrides qui
     partagent une race ou une affiliation avec le personnage secret)
   - **gris** : différent, avec une flèche ▲/▼ pour les attributs numériques
     ou chronologiques (taille, âge, escouade/rang, premier arc) indiquant si
     la bonne réponse est plus grande/petite ou antérieure/postérieure.
4. La partie se termine par une victoire (bon personnage trouvé) ou une
   défaite (8 tentatives épuisées). En mode "Défi du jour", le résultat est
   sauvegardé dans le navigateur (`localStorage`) pour éviter de rejouer
   plusieurs fois le même jour. En mode "Illimité", rien n'est sauvegardé :
   le bouton "Nouvelle partie" relance immédiatement avec un autre
   personnage aléatoire.
5. À la fin de chaque partie, un panneau de statistiques s'affiche (parties
   jouées, % de victoires, série actuelle et record, répartition du nombre
   d'essais utilisés lors des victoires) :
   - En mode "Défi du jour", ces statistiques sont cumulées dans le
     navigateur (`localStorage`) au fil des jours, avec une série basée sur
     des jours consécutifs gagnés.
   - En mode "Illimité", les statistiques sont propres à la session en
     cours (comptées séparément des statistiques du Défi du jour) et
     remises à zéro au rechargement de la page, comme le reste de ce mode.
     La série y correspond simplement aux victoires consécutives.
   - En mode "Illimité" toujours, un même personnage ne peut pas retomber
     pendant les 7 parties suivantes une fois deviné, pour varier les
     personnages proposés ; cette liste des personnages récents n'est pas
     sauvegardée non plus, donc un F5 la réinitialise.

### Détails techniques

- Aucun build ni dépendance : `index.html` charge `version.js`, puis
  `characters.js` (le dataset), puis `game.js` (la logique).
- Le personnage du jour est calculé à partir de la date UTC courante, donc
  identique pour tout le monde le même jour. En mode illimité, le
  personnage est tiré au hasard dans le roster, en excluant les 7 derniers
  personnages déjà tirés dans la session, à chaque nouvelle partie.
- Le numéro de version affiché en bas de page (`version.js`, constante
  `APP_VERSION`) est incrémenté de 1 à chaque commit sur le jeu.
- Le dataset couvre une soixante-dizaine de personnages majeurs de Bleach, avec
  des attributs curés à la main (race, affiliation, genre, statut,
  localisation, âge, escouade/rang, type de pouvoir, Bankai/Resurrección,
  taille, premier arc d'apparition, couleur de cheveux). Vérifié via
  recherche web, puis recoupé avec un export local des infobox du Bleach
  Fandom Wiki (taille, rang/division, Bankai/Resurrección, âge quand
  disponible) — plus fiable que la recherche web seule, mais toujours pas
  une lecture exhaustive du wiki : il peut subsister des approximations,
  notamment sur les quelques entrées où le scrape a renvoyé la fiche d'un
  autre personnage par erreur.
- L'âge est représenté par une **tranche fixe** ("10-20 ans" < "20-50 ans" <
  "50-100 ans" < "100-150 ans" < "150-1000 ans" < "1000+ ans") plutôt qu'un
  chiffre précis : la plupart des Shinigami/Arrancar adultes ont un âge réel
  jamais documenté (leur apparence ne reflète pas leur âge réel), donc
  chacun est classé dans la tranche la plus honnête possible. Deux
  personnages ne matchent sur l'âge que s'ils sont dans la même tranche,
  avec une flèche ▲/▼ indiquant si la bonne réponse est dans une tranche
  plus jeune ou plus âgée.
