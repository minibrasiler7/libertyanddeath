#!/bin/bash
# Publie le projet sur GitHub. À lancer dans le Terminal, depuis le dossier du projet :
#   cd ~/Desktop/PycharmProjects/libertyanddeath && bash publier_github.sh
# Pré-requis : un dépôt vide créé sur https://github.com/new (nom conseillé : libertyanddeath), et git configuré.
set -e
read -p "Nom d'utilisateur GitHub : " USER
read -p "Nom du dépôt [libertyanddeath] : " REPO; REPO=${REPO:-libertyanddeath}
git init
git symbolic-ref HEAD refs/heads/main 2>/dev/null || git branch -M main
git add .
git commit -m "Liberty or Death — mode solo" || true
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$USER/$REPO.git"
git push -u origin main
echo
echo "Dépôt poussé. Dernière étape (une seule fois) : sur GitHub, Settings → Pages → Source : « Deploy from a branch », Branch : main, dossier : / (root), Save."
echo "Le jeu sera à l'adresse : https://$USER.github.io/$REPO/  (compter 1 à 2 minutes)"
