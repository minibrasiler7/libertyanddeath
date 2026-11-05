#!/bin/bash
# Compile « Palette maths » en application macOS (binaire universel Intel + Apple Silicon).
# Prérequis : les outils de développement Apple (gratuits) :  xcode-select --install
# Usage :  ./build.sh
set -e
cd "$(dirname "$0")"
SRC="$(pwd)"

# On construit dans un dossier temporaire « propre » (hors Finder / iCloud / dossiers synchronisés),
# ce qui évite les attributs étendus qui font échouer la signature.
TMP="$(mktemp -d /tmp/palette-maths.XXXXXX)"
APP="$TMP/Palette maths.app"
MACOS="$APP/Contents/MacOS"
RES="$APP/Contents/Resources"

echo "→ Préparation du bundle"
mkdir -p "$MACOS" "$RES"
cat "$SRC/main.swift" > "$TMP/main.swift"
cat "$SRC/Info.plist" > "$APP/Contents/Info.plist"
printf 'APPL????' > "$APP/Contents/PkgInfo"

echo "→ Compilation (Apple Silicon)"
swiftc -O -target arm64-apple-macos13.0 -o "$TMP/PaletteMaths-arm64" "$TMP/main.swift"
echo "→ Compilation (Intel)"
swiftc -O -target x86_64-apple-macos13.0 -o "$TMP/PaletteMaths-x86_64" "$TMP/main.swift"
echo "→ Fusion en binaire universel"
lipo -create "$TMP/PaletteMaths-arm64" "$TMP/PaletteMaths-x86_64" -output "$MACOS/PaletteMaths"

if [ -f "$SRC/icon.png" ]; then
  echo "→ Icône"
  cat "$SRC/icon.png" > "$TMP/icon.png"
  ICONSET="$TMP/AppIcon.iconset"
  mkdir -p "$ICONSET"
  for s in 16 32 128 256 512; do
    sips -z $s $s "$TMP/icon.png" --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
    d=$((s*2))
    sips -z $d $d "$TMP/icon.png" --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
  done
  iconutil -c icns "$ICONSET" -o "$RES/AppIcon.icns"
fi

echo "→ Nettoyage"
find "$APP" -name "._*" -delete
xattr -cr "$APP" 2>/dev/null || true

echo "→ Signature ad hoc"
if ! codesign --force --deep --sign - "$APP"; then
  echo
  echo "La signature a échoué. Attributs présents dans le bundle :"
  xattr -lr "$APP" || true
  exit 1
fi

echo "→ Réinitialisation de l'ancienne autorisation d'accessibilité"
tccutil reset Accessibility ch.palettemaths.app >/dev/null 2>&1 || true

echo "→ Copie dans le dossier build"
rm -rf "$SRC/build"
mkdir -p "$SRC/build"
ditto "$APP" "$SRC/build/Palette maths.app"
rm -rf "$TMP"

echo
echo "✔ Terminé : build/Palette maths.app"
echo "  Au prochain lancement, macOS redemandera l'autorisation d'accessibilité : c'est normal."
echo "  Pour la distribuer : clic droit sur « Palette maths.app » → Compresser."
open "$SRC/build"
