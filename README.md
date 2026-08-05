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
2. Taper le nom d'un personnage dans le champ de recherche et choisir une
   suggestion (ou valider avec Entrée si le nom est exact).
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

### Détails techniques

- Aucun build ni dépendance : `index.html` charge `version.js`, puis
  `characters.js` (le dataset), puis `game.js` (la logique).
- Le personnage du jour est calculé à partir de la date UTC courante, donc
  identique pour tout le monde le même jour. En mode illimité, le
  personnage est tiré au hasard dans le roster (en évitant de retirer deux
  fois de suite le même) à chaque nouvelle partie.
- Le numéro de version affiché en bas de page (`version.js`, constante
  `APP_VERSION`) est incrémenté de 1 à chaque commit sur le jeu.
- Le dataset couvre une soixantaine de personnages majeurs de Bleach, avec
  des attributs curés à la main (race, affiliation, genre, statut,
  localisation, âge, escouade/rang, type de pouvoir, Bankai/Resurrección,
  taille, premier arc d'apparition, couleur de cheveux). Vérifié via
  recherche web, puis recoupé avec un export local des infobox du Bleach
  Fandom Wiki (taille, rang/division, Bankai/Resurrección, âge quand
  disponible) — plus fiable que la recherche web seule, mais toujours pas
  une lecture exhaustive du wiki : il peut subsister des approximations,
  notamment sur les quelques entrées où le scrape a renvoyé la fiche d'un
  autre personnage par erreur.
- L'âge est soit une valeur exacte confirmée ("15 ans"), soit une valeur
  minimale confirmée sans plafond ("2100+ ans" pour Yamamoto), soit une
  plage estimée honnête ("100-500 ans") quand l'âge réel n'est jamais
  documenté — ce qui est le cas de la plupart des Shinigami/Arrancar
  adultes, dont l'apparence physique ne reflète pas l'âge réel. Deux
  personnages ne matchent sur l'âge que si leur valeur/plage est identique.
