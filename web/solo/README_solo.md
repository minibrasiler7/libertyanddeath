# Liberty or Death — mode solo (factions non-joueurs)

Dossier `web/solo/`. Deux pages, à ouvrir directement dans un navigateur (double-clic, aucun serveur nécessaire) :

- **`plateau.html`** — le jeu « comme sur la table » : le plateau seul, les vraies images des pièces, drag & drop des jetons par le joueur, et, quand un ordinateur joue, un panneau qui explique l'action et une animation des déplacements (vitesse réglable, bouton « Passer l'animation »). Les cartes s'affichent depuis `Images/Cartes/`.
- **`solo.html`** — la vue détaillée (tableau de saisie + journal complet), utile pour vérifier ou corriger un état.

Les deux pages partagent le même moteur et la même sauvegarde JSON (export/import), mais chacune garde sa propre sauvegarde automatique dans le navigateur.

### Manipulations sur `plateau.html`
Glisser une pièce d'un espace à un autre la déplace ; vers la case Available de sa faction la retire ; vers Casualties la met en pertes ; depuis Available/Unavailable vers un espace la place. Les Leaders, les cylindres de Ressources (piste), les jetons CBC/CRC, les cylindres d'éligibilité (Eligible ↔ Ineligible) et les Squadrons (Antilles ↔ Ville = Blocus) se glissent aussi. Clic sur le marqueur de Support d'un espace : niveau suivant (clic droit : précédent). Clic sur la case Raid / Propaganda d'un espace : ajoute un marqueur (clic droit : retire). Double-clic sur une Milice ou War Party : Underground ↔ Active. Molette : zoom ; glisser le fond : déplacer la carte. Les valeurs restantes (hivers, TOA, Brilliant Stroke, nom des Leaders) sont dans « ⚙ Partie ».

## Principe

Le joueur joue sur le vrai plateau. Le programme joue les factions « ordinateur » en suivant les flowcharts
du livret de règles (section 8) et lui indique, dans le journal, tout ce qu'elles ont fait : il n'a plus qu'à
reproduire ces actions sur son plateau. L'état du jeu affiché est celui dans lequel le plateau doit se trouver.

Déroulement d'une carte :

1. Le joueur saisit le numéro de la carte jouée (et celui de la carte suivante, utile pour le changement de Leader en hiver).
2. Il clique sur « Jouer cette carte ». Les factions ordinateur agissent dans l'ordre de la carte.
3. Quand c'est à une faction humaine, le programme s'arrête : le joueur joue sur le plateau, reporte ce qu'il a fait dans
   le tableau « État du jeu » (pièces, Support/Opposition, Ressources, marqueurs…), puis indique ce qu'il a fait
   (Événement / Commande + Activité spéciale / Commande seule / Commande limitée / Passer). L'éligibilité est alors
   calculée automatiquement.
   - Case à cocher « appliquer automatiquement l'événement » : le programme exécute lui-même le texte de la carte pour le
     joueur (les choix sont faits selon les priorités non-joueur).
4. Carte Winter Quarters : les phases sont jouées automatiquement pour les ordinateurs ; le programme s'arrête à chaque
   phase où le joueur a une décision (Supply, Support, Leader, Désertion).

Le joueur peut choisir 1 faction (3 ordinateurs) ou un camp entier (2 ordinateurs), ou même 4 ordinateurs pour regarder.

L'état est sauvegardé automatiquement dans le navigateur (localStorage). « Exporter JSON » / « Importer » permettent de
le conserver dans un fichier. L'import accepte aussi l'export JSON du plateau `game-board.html` (bouton d'export de la
maquette) — vérifier ensuite les cases Available / Unavailable / Casualties, les Leaders et l'éligibilité.

« Annuler la dernière carte » restaure l'état d'avant la carte (20 niveaux).

## Fichiers

| Fichier | Contenu |
|---|---|
| `engine.js` | État du jeu, carte (espaces, population, adjacences : table `SPACES`), contrôle (1.7), Support/Opposition (1.6), FNI (1.9), placement/retrait des pièces, Leaders (1.10), procédure de bataille (3.6), victoire (7), scénarios (pages 37-39), vérification des totaux de pièces (page 35). |
| `commands.js` | Commandes (3.2 à 3.5) et Activités spéciales (4.2 à 4.5), Win the Day (3.6.8). |
| `bots.js` | Flowcharts non-joueurs : 8.4 Britanniques, 8.5 Patriotes, 8.6 Français, 8.7 Indiens ; décision Événement/Commande/Passe (8.3). |
| `events.js` | Les 96 cartes Événement (texte non ombré et ombré), les 8 cartes Winter Quarters, et l'évaluation « l'événement est-il utile ? » (8.3.3, 8.3.6) faite par simulation. |
| `wq.js` | Winter Quarters (6.0) avec les choix des ordinateurs (8.4.7, 8.5.5, 8.6.7, 8.7.5, désertions, Leaders) ; déroulement d'une carte (2.3) ; Treaty of Alliance et Brilliant Stroke (2.3.8, 8.3.7). |
| `plateau.html` | Interface plateau : rendu des pièces (images de `Images/`), drag & drop, animation des événements émis par le moteur (`Game.events`). |
| `zones.js` | Coordonnées des espaces et cases sur `map.jpg` (issues de `map_zone.json`, `forces_zones.json`, `gameplay_zones.json`, `score_zones.json`, `raid-propaganda-zone.json`, `deck_zone.json`). |
| `assets.js` | Images des pièces, marqueurs, Leaders, dés, encodées en base64. |
| `cards.js` | Transcription exacte des 104 cartes (titre, période, ordre des factions, symboles sabre/mousquet, textes). |
| `tests/sim.js` | `node tests/sim.js <graine> <nombre> [scénario]` : parties complètes à 4 ordinateurs, vérification des invariants (totaux de pièces, empilement, FNI…). |
| `tests/test_events.js` | Exécute les 96 événements (les deux textes, les 4 factions) sur des états variés. |

## Hypothèses et limites (à connaître)

- **Feuille « Non-player Events » absente du PDF** : pour les cartes où la faction a un symbole mousquet, les
  instructions spéciales ne sont pas connues ; la décision suit seulement les conditions générales (8.3, 8.4-8.7).
  Les cartes à symbole sabre sont ignorées par la faction concernée (8.1).
- **Brilliant Stroke (105-108) et Treaty of Alliance (109)** (images dans `Images/Cartes spéciales`) : les conditions pour les jouer sont
  codées (8.1, 8.3.7, 8.4.11, 8.5.8, 8.6.11, 8.7.8). La Treaty of Alliance est appliquée automatiquement (Muster gratuit + Rochambeau, FNI +1,
  3 Regulars français et 3 britanniques aux Antilles, tous Eligible). Pour un ordinateur, le Brilliant Stroke est exécuté comme deux Commandes
  limitées autour du Leader + 1 Activité spéciale (8.3.7).
- **Phase Support du Winter Quarters** : le livret ne dit pas combien un ordinateur dépense en Reward Loyalty /
  Committees. Hypothèse : tout sauf 3 Ressources (`wqReserve`).
- **Table Random Spaces (8.2)** : remplacée par un tirage à chances égales entre candidats (option prévue par les règles).
- **Activation en bataille (3.6.3)** : un ordinateur active ses unités Underground pour maximiser ses dés en gardant
  une unité Underground pour le modificateur +1 ; Indiens défendant avec Village : toutes sauf une (8.7.9).
- Quand un ordinateur joue un événement qui donne une décision au joueur humain (Commande gratuite, choix de pièces…),
  le programme décide selon les priorités non-joueur et le signale ; le joueur peut corriger l'état avant de continuer.
- **Adjacences** (table `SPACES` dans `engine.js`) : établies d'après `territories_config.json` et la carte ; les liaisons
  maritimes Ville-Ville n'y figurent pas (le March britannique de Ville à Ville est géré par la règle 3.2.3).
  Ajouts/corrections par rapport à `territories_config.json` : Florida–Southwest ajoutée, Quebec–Southwest retirée.
- Les dés sont tirés par le programme (graine modifiable) et tous affichés dans le journal.
