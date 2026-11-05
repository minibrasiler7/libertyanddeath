#!/bin/bash
# Double-clique sur ce fichier dans le Finder pour compiler « Palette maths ».
# (Si macOS refuse de l'ouvrir : clic droit → Ouvrir → Ouvrir.)
cd "$(dirname "$0")"
echo "=============================="
echo "  Compilation de Palette maths"
echo "=============================="
echo

if ! xcode-select -p >/dev/null 2>&1 || ! command -v swiftc >/dev/null 2>&1; then
  echo "Les outils de développement Apple ne sont pas installés."
  echo "Une fenêtre d'installation va s'ouvrir : clique sur « Installer », attends la fin,"
  echo "puis double-clique à nouveau sur Compiler.command."
  xcode-select --install 2>/dev/null
  echo
  read -r -p "Appuie sur Entrée pour fermer cette fenêtre."
  exit 0
fi

chmod +x build.sh
if ./build.sh; then
  echo
  echo "Tout s'est bien passé. L'application est dans le dossier « build »."
else
  echo
  echo "La compilation a échoué. Copie le texte ci-dessus et envoie-le à Claude pour correction."
fi
echo
read -r -p "Appuie sur Entrée pour fermer cette fenêtre."
