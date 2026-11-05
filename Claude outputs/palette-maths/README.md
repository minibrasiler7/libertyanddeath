# Palette maths

Petite fenêtre flottante pour Mac. Elle reste toujours au premier plan et ne vole jamais le curseur. Un clic sur un symbole l'écrit directement dans Word, Pages ou n'importe quel traitement de texte.

Trois onglets en haut : **Universel** (symboles simples qui marchent partout), **Word** (fractions, racines, puissances au format de l'éditeur d'équations de Word) et **Pages** (même chose au format de l'éditeur d'équations de Pages).

---

## Partie 1 — Pour l'enseignant : compiler l'application

À faire une seule fois, sur ton Mac.

1. Installe les outils de développement Apple (gratuits) si ce n'est pas déjà fait. Dans le Terminal :
   `xcode-select --install`
   puis accepte l'installation (quelques minutes).
2. Place ce dossier où tu veux, ouvre le Terminal dans ce dossier et lance :
   `./build.sh`
3. Le Finder s'ouvre sur le dossier `build` qui contient **Palette maths.app**.
4. Clic droit sur `Palette maths.app` → **Compresser**. Tu obtiens `Palette maths.zip` : c'est ce fichier que tu donnes à l'élève (AirDrop, clé USB, mail, Teams…).

Pour modifier la palette plus tard (ajouter un symbole, changer un texte) : édite `main.swift` dans la partie `Catalogue`, relance `./build.sh`, redistribue le zip.

---

## Partie 2 — Pour l'élève : installer la palette

1. Double-clique sur `Palette maths.zip`. Glisse **Palette maths** dans le dossier **Applications**.
2. Première ouverture : double-clique sur l'app. macOS affiche un message disant qu'elle ne peut pas être ouverte (elle n'est pas enregistrée chez Apple, c'est normal). Clique sur **Terminé**, puis ouvre **Réglages Système → Confidentialité et sécurité**, descends en bas de la page et clique sur **Ouvrir quand même** à côté de « Palette maths ». Confirme avec ton mot de passe.
   *Variante sur les Mac plus anciens : clic droit sur l'app → Ouvrir → Ouvrir.*
3. La palette demande alors une autorisation d'**accessibilité**. C'est obligatoire : c'est ce qui lui permet d'écrire les symboles à ta place. Clique sur **Ouvrir les réglages**, active l'interrupteur à côté de **Palette maths**, puis quitte la palette (⌘Q) et relance-la.
4. C'est fini. La palette s'ouvre à droite de l'écran. Elle est aussi accessible par l'icône **ƒ** dans la barre de menus en haut à droite (un clic l'affiche ou la masque).

---

## Partie 3 — Utiliser la palette pendant un test

Ouvre ton document, mets le curseur là où tu veux écrire, puis clique sur les symboles. Le texte apparaît comme si tu l'avais tapé.

**Onglets Universel / Word / Pages** (en haut). Choisis « Word » si tu écris dans Word, « Pages » si tu écris dans Pages : la palette pourra alors écrire de vraies fractions, racines et angles avec chapeau, grâce à l'éditeur d'équations du logiciel. « Universel » marche dans n'importe quelle application (Notes, TextEdit, un navigateur…) avec des caractères simples : ³⁄₄, x², ∠ABC.

**Les boutons qui ouvrent un petit formulaire** (a/b, xⁿ, x₁, √, [AB], (AB), [AB), ÂBC, AB⃗) : clique, remplis les cases dans la palette, puis appuie sur Entrée ou sur « Insérer dans le document ». La ligne « Sera inséré » te montre le résultat avant de valider. Exemple : a/b → 3 et 4 → la fraction ¾ apparaît dans le document (jolie fraction dans Word ou Pages, ³⁄₄ ailleurs).

**Les fractions toutes faites** (½, ⅓, ¼, ⅕, ¾) et les carrés/cubes s'écrivent d'un clic.

**Lexique du chapitre** (en bas) : choisis le chapitre dans le menu, et les mots importants s'insèrent d'un clic (parallèle, médiatrice, numérateur…).

**Roue dentée** : boutons plus grands ou plus petits. Si dans une application les symboles n'apparaissent pas, coche « Insérer via le presse-papiers ».

La palette mémorise sa position, sa taille, l'onglet et le chapitre choisis.

---

## En cas de problème

- **Rien ne s'écrit quand je clique** : l'autorisation d'accessibilité n'est pas effective. Réglages Système → Confidentialité et sécurité → Accessibilité : si « Palette maths » est déjà dans la liste, retire-la (bouton –) puis rajoute-la (bouton +). Quitter et relancer la palette. (Pour l'enseignant : après chaque recompilation, macOS considère l'app comme nouvelle ; le script efface l'ancienne autorisation, il faut la redonner.)
- **Le bouton « Nouvelle équation » ne fait rien dans Word** : utilise le menu Insertion → Équation de Word, ou le raccourci ⌃= (sur certains claviers, ⌃ + la touche =). Le reste de la palette fonctionne quand même.
- **Les symboles sortent dans le désordre ou avec des caractères bizarres** : cocher « Insérer via le presse-papiers » dans la roue dentée.
- **L'app refuse de s'ouvrir même après « Ouvrir quand même »** : dans le Terminal, `xattr -dr com.apple.quarantine "/Applications/Palette maths.app"` puis réessayer.
