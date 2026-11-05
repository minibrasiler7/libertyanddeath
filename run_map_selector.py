#!/usr/bin/env python3

"""
Script pour lancer le sélecteur de zones de carte.

Ce script vous permettra de définir visuellement les zones sur la carte pour:
1. Les emplacements des armées/unités
2. Les zones de support/opposition 
3. Les zones de contrôle

Instructions:
1. Sélectionnez une région dans la liste déroulante
2. Choisissez le type de zone (Armées, Support, ou Contrôle)
3. Cliquez et glissez sur la carte pour définir une zone rectangulaire
4. Répétez pour toutes les régions et tous les types de zones
5. Sauvegardez le fichier JSON final

Contrôles:
- Clic + glisser: Définir une zone
- Bouton "Effacer Zone": Supprimer la zone actuelle
- Bouton "Sauvegarder": Exporter les zones en JSON
- Bouton "Charger": Importer des zones depuis un JSON
"""

import sys
import os

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from tools.map_zone_selector import MapZoneSelector
    
    def main():
        print("=== Liberty and Death - Sélecteur de Zones ===")
        print(__doc__)
        
        try:
            app = MapZoneSelector()
            app.run()
        except Exception as e:
            print(f"Erreur lors du lancement de l'application: {e}")
            print("Assurez-vous d'avoir installé les dépendances:")
            print("pip install tkinter pillow")
    
    if __name__ == "__main__":
        main()

except ImportError as e:
    print(f"Erreur d'import: {e}")
    print("Veuillez installer les dépendances requises:")
    print("pip install pillow")
    print("Note: tkinter devrait être inclus avec Python")