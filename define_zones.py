#!/usr/bin/env python3

"""
Script pour définir facilement les zones de la carte.
Ce script vous guide étape par étape pour définir les zones importantes.
"""

import json
from tools.simple_zone_definer import SimpleZoneDefiner

def quick_demo():
    """Démonstration rapide avec quelques régions pré-définies"""
    
    print("🎮 LIBERTY AND DEATH - DÉFINITION DES ZONES")
    print("="*50)
    print()
    print("💡 CONCEPT:")
    print("Pour chaque région importante, nous devons définir 3 zones rectangulaires:")
    print("🔴 ARMÉES    : Où placer cubes, forts, villages")
    print("🔵 SUPPORT   : Où placer jetons support/opposition") 
    print("🟢 CONTRÔLE  : Où placer marqueurs de contrôle")
    print()
    
    # Créer quelques zones de démonstration
    demo_zones = {
        "Massachusetts": {
            "armies": {"x1": 810, "y1": 180, "x2": 890, "y2": 220},
            "support": {"x1": 790, "y1": 160, "x2": 830, "y2": 190},
            "control": {"x1": 870, "y1": 160, "x2": 910, "y2": 190}
        },
        "New York": {
            "armies": {"x1": 660, "y1": 260, "x2": 740, "y2": 300},
            "support": {"x1": 640, "y1": 240, "x2": 680, "y2": 270},
            "control": {"x1": 720, "y1": 240, "x2": 760, "y2": 270}
        },
        "Virginia": {
            "armies": {"x1": 560, "y1": 380, "x2": 640, "y2": 420},
            "support": {"x1": 540, "y1": 360, "x2": 580, "y2": 390},
            "control": {"x1": 620, "y1": 360, "x2": 660, "y2": 390}
        }
    }
    
    print("📍 EXEMPLES DE ZONES DÉFINIES:")
    print("-" * 60)
    
    for region, zones in demo_zones.items():
        print(f"\n{region}:")
        for zone_type, coords in zones.items():
            symbol = {"armies": "🔴", "support": "🔵", "control": "🟢"}[zone_type]
            print(f"  {symbol} {zone_type:8} : ({coords['x1']:3.0f},{coords['y1']:3.0f}) → ({coords['x2']:3.0f},{coords['y2']:3.0f})")
    
    print(f"\n{'='*50}")
    print("💾 SAUVEGARDE DE LA DÉMONSTRATION")
    print(f"{'='*50}")
    
    # Sauvegarder les zones de démo
    with open("demo_zones.json", 'w', encoding='utf-8') as f:
        json.dump(demo_zones, f, indent=2, ensure_ascii=False)
    
    print("✅ Zones de démonstration sauvegardées dans 'demo_zones.json'")
    print()
    print("🎯 PROCHAINES ÉTAPES:")
    print("1. Examinez le fichier demo_zones.json pour comprendre le format")
    print("2. Lancez 'python3 define_zones.py --interactive' pour définir toutes les régions")
    print("3. Ou modifiez manuellement le fichier JSON avec vos coordonnées")
    
    return demo_zones

def interactive_mode():
    """Mode interactif complet"""
    definer = SimpleZoneDefiner()
    
    print("🎯 MODE INTERACTIF - DÉFINITION COMPLÈTE")
    print("="*50)
    print()
    print("Instructions:")
    print("• Je vais vous proposer chaque région une par une")
    print("• Pour chaque région, définissez 3 zones (armées, support, contrôle)")
    print("• Utilisez les coordonnées suggérées ou entrez les vôtres")
    print("• Format: x1,y1,x2,y2 (coin haut-gauche → coin bas-droite)")
    print()
    
    # Régions prioritaires en premier
    priority_regions = [
        "Massachusetts", "New York", "Virginia", "Pennsylvania",
        "North Carolina", "South Carolina", "Georgia"
    ]
    
    print("🎯 RÉGIONS PRIORITAIRES (7/17):")
    for region in priority_regions:
        print(f"  • {region}")
    
    choice = input(f"\nCommencer par les régions prioritaires ? (o/n): ").strip().lower()
    
    if choice in ['o', 'oui', 'y', 'yes', '']:
        regions_to_process = priority_regions
    else:
        regions_to_process = definer.regions
    
    # Traiter chaque région
    for i, region in enumerate(regions_to_process, 1):
        print(f"\n📍 RÉGION {i}/{len(regions_to_process)}: {region}")
        
        proceed = input(f"Définir les zones pour {region} ? (o/n/q pour quitter): ").strip().lower()
        
        if proceed == 'q':
            break
        elif proceed in ['o', 'oui', 'y', 'yes', '']:
            definer.define_region_zones(region)
        else:
            print(f"⏭ {region} ignorée")
        
        # Sauvegarder périodiquement
        if i % 3 == 0:
            definer.save_zones(f"zones_progress_{i}.json")
            print(f"💾 Progrès sauvegardé dans zones_progress_{i}.json")
    
    # Sauvegarde finale
    definer.save_zones("map_zones_final.json")
    definer.show_progress()
    
    print(f"\n🎉 TERMINÉ!")
    print(f"📁 Fichier final: map_zones_final.json")

def manual_edit_helper():
    """Aide pour édition manuelle"""
    print("✏️ AIDE POUR ÉDITION MANUELLE")
    print("="*50)
    print()
    print("Format JSON attendu:")
    print("""
{
  "NomRegion": {
    "armies": {"x1": 100, "y1": 100, "x2": 200, "y2": 150},
    "support": {"x1": 50, "y1": 80, "x2": 120, "y2": 110},
    "control": {"x1": 180, "y1": 80, "x2": 250, "y2": 110}
  }
}
    """)
    
    print("💡 CONSEILS:")
    print("• x1,y1 = coin supérieur gauche")
    print("• x2,y2 = coin inférieur droit") 
    print("• Carte approximative: 1200x800 pixels")
    print("• Zones armies = 80x40 pixels typiques")
    print("• Zones support/control = 60x30 pixels typiques")
    print()
    print("📏 POSITIONS APPROXIMATIVES (centre des régions):")
    
    definer = SimpleZoneDefiner()
    for region, info in definer.region_positions.items():
        print(f"  {region:15} : {info['center']} - {info['description']}")

def main():
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == '--interactive' or sys.argv[1] == '-i':
            interactive_mode()
        elif sys.argv[1] == '--manual' or sys.argv[1] == '-m':
            manual_edit_helper()
        else:
            print("Usage: python3 define_zones.py [--interactive | --manual]")
    else:
        # Mode démo par défaut
        quick_demo()

if __name__ == "__main__":
    main()