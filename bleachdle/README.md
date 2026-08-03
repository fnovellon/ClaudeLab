# Bleachdle

Un mini-jeu de devinette de personnage Bleach, façon Wordle : un personnage
secret différent chaque jour, et jusqu'à 8 tentatives pour le trouver.

## Comment jouer

1. Ouvrir `index.html` dans un navigateur (double-clic, ou via un petit
   serveur statique, ex. `npx serve .` depuis ce dossier).
2. Taper le nom d'un personnage dans le champ de recherche et choisir une
   suggestion (ou valider avec Entrée si le nom est exact).
3. Après chaque tentative, chaque attribut du personnage proposé s'affiche :
   - **vert** : identique au personnage à trouver
   - **orange** : partiellement correct (ex : personnages hybrides qui
     partagent une race ou une affiliation avec le personnage secret)
   - **gris** : différent, avec une flèche ▲/▼ pour les attributs numériques
     ou chronologiques (taille, escouade/rang, premier arc) indiquant si la
     bonne réponse est plus grande/petite ou antérieure/postérieure.
4. La partie se termine par une victoire (bon personnage trouvé) ou une
   défaite (8 tentatives épuisées) ; le résultat du jour est sauvegardé dans
   le navigateur (`localStorage`) pour éviter de rejouer plusieurs fois le
   même jour.

## Détails techniques

- Aucun build ni dépendance : `index.html` charge simplement
  `characters.js` (le dataset) puis `game.js` (la logique).
- Le personnage du jour est calculé à partir de la date UTC courante, donc
  identique pour tout le monde le même jour.
- Le dataset couvre une quarantaine de personnages majeurs de Bleach, avec
  des attributs curés à la main (race, affiliation, genre, statut, escouade/
  rang, type de pouvoir, Bankai/Resurrección, taille, premier arc
  d'apparition, couleur de cheveux).
