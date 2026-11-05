#!/usr/bin/env python3

"""
Définisseur de zones simplifié sans interface graphique.

Ce script vous guide pour définir manuellement les coordonnées des zones
en vous donnant des informations sur la carte.
"""

import json
import os
from typing import Dict, List, Tuple

class SimpleZoneDefiner:
    def __init__(self):
        self.zones_data = {}
        self.regions = [
            "Massachusetts", "New York", "Virginia", "Pennsylvania", 
            "North Carolina", "South Carolina", "Georgia", "New Hampshire",
            "Rhode Island", "Connecticut", "New Jersey", "Delaware", 
            "Maryland", "Quebec", "Canada", "East Florida", "West Florida"
        ]
        
        # Informations approximatives sur la carte (basées sur l'analyse visuelle)
        self.map_info = {
            "width": 1200,  # Largeur approximative redimensionnée
            "height": 800,  # Hauteur approximative redimensionnée
        }
        
        # Positions approximatives des régions (estimées visuellement)
        self.region_positions = {
            "Massachusetts": {"center": (850, 200), "description": "Nord-est, près de Boston"},
            "New York": {"center": (700, 280), "description": "Centre-nord, région de NYC/Albany"},
            "Virginia": {"center": (600, 400), "description": "Centre, région de Richmond"},
            "Pennsylvania": {"center": (650, 320), "description": "Centre-nord, région de Philadelphie"},
            "North Carolina": {"center": (550, 500), "description": "Sud-est, côte atlantique"},
            "South Carolina": {"center": (500, 550), "description": "Sud-est, région de Charleston"},
            "Georgia": {"center": (450, 600), "description": "Sud-est, proche de la Floride"},
            "New Hampshire": {"center": (850, 150), "description": "Nord-est, au-dessus du Massachusetts"},
            "Rhode Island": {"center": (870, 220), "description": "Petit état côtier près du Massachusetts"},
            "Connecticut": {"center": (800, 250), "description": "Entre New York et Massachusetts"},
            "New Jersey": {"center": (720, 340), "description": "Entre New York et Pennsylvanie"},
            "Delaware": {"center": (680, 370), "description": "Petit état entre Pennsylvanie et Maryland"},
            "Maryland": {"center": (630, 380), "description": "Centre-est, près de la baie de Chesapeake"},
            "Quebec": {"center": (700, 50), "description": "Nord du Canada"},
            "Canada": {"center": (650, 80), "description": "Nord, région des Grands Lacs"},
            "East Florida": {"center": (400, 700), "description": "Sud-est, péninsule de Floride"},
            "West Florida": {"center": (250, 650), "description": "Sud-ouest, côte du Golfe"}
        }
    
    def display_region_info(self, region_name: str):
        """Affiche les informations sur une région"""
        if region_name in self.region_positions:
            info = self.region_positions[region_name]
            print(f"\n📍 {region_name}:")
            print(f"   Position approximative: {info['center']}")
            print(f"   Description: {info['description']}")
            print(f"   Suggestions de zones (ajustez selon vos besoins):")
            
            cx, cy = info["center"]
            
            # Suggestions basées sur la position
            suggestions = {
                "armies": {
                    "x1": cx - 40, "y1": cy - 20,
                    "x2": cx + 40, "y2": cy + 20,
                    "description": "Zone centrale pour les unités"
                },
                "support": {
                    "x1": cx - 60, "y1": cy - 40,
                    "x2": cx - 20, "y2": cy - 10,
                    "description": "Coin supérieur gauche pour support/opposition"
                },
                "control": {
                    "x1": cx + 20, "y1": cy - 40,
                    "x2": cx + 60, "y2": cy - 10,
                    "description": "Coin supérieur droit pour contrôle"
                }
            }
            
            for zone_type, suggestion in suggestions.items():
                print(f"   • {zone_type.upper()}: ({suggestion['x1']}, {suggestion['y1']}) → ({suggestion['x2']}, {suggestion['y2']})")
                print(f"     {suggestion['description']}")
    
    def input_zone_coordinates(self, region_name: str, zone_type: str) -> Dict:
        """Demande les coordonnées d'une zone"""
        print(f"\n🎯 Définition de la zone '{zone_type}' pour '{region_name}'")
        print("Entrez les coordonnées du rectangle (x1, y1, x2, y2)")
        print("Format: x1,y1,x2,y2  (ex: 100,150,200,250)")
        print("Ou tapez 'skip' pour ignorer, 'auto' pour utiliser la suggestion")
        
        while True:
            user_input = input("Coordonnées: ").strip()
            
            if user_input.lower() == 'skip':
                return None
            
            if user_input.lower() == 'auto':
                # Utiliser les coordonnées suggérées
                if region_name in self.region_positions:
                    cx, cy = self.region_positions[region_name]["center"]
                    if zone_type == "armies":
                        return {"x1": cx - 40, "y1": cy - 20, "x2": cx + 40, "y2": cy + 20}
                    elif zone_type == "support":
                        return {"x1": cx - 60, "y1": cy - 40, "x2": cx - 20, "y2": cy - 10}
                    elif zone_type == "control":
                        return {"x1": cx + 20, "y1": cy - 40, "x2": cx + 60, "y2": cy - 10}
                return None
            
            try:
                coords = [float(x.strip()) for x in user_input.split(',')]
                if len(coords) == 4:
                    x1, y1, x2, y2 = coords
                    # S'assurer que x1,y1 est le coin supérieur gauche
                    return {
                        "x1": min(x1, x2), "y1": min(y1, y2),
                        "x2": max(x1, x2), "y2": max(y1, y2)
                    }
                else:
                    print("❌ Veuillez entrer exactement 4 coordonnées")
            except ValueError:
                print("❌ Format invalide. Utilisez: x1,y1,x2,y2")
    
    def define_region_zones(self, region_name: str):
        """Définit toutes les zones pour une région"""
        print(f"\n{'='*50}")
        print(f"DÉFINITION DES ZONES POUR: {region_name.upper()}")
        print(f"{'='*50}")
        
        self.display_region_info(region_name)
        
        if region_name not in self.zones_data:
            self.zones_data[region_name] = {}
        
        zone_types = ["armies", "support", "control"]
        zone_descriptions = {
            "armies": "🔴 ARMÉES/UNITÉS (cubes, forts, villages)",
            "support": "🔵 SUPPORT/OPPOSITION (jetons +/-)",
            "control": "🟢 CONTRÔLE (drapeaux faction)"
        }
        
        for zone_type in zone_types:
            print(f"\n{zone_descriptions[zone_type]}")
            
            # Vérifier si déjà défini
            if zone_type in self.zones_data[region_name]:
                current = self.zones_data[region_name][zone_type]
                print(f"Zone déjà définie: ({current['x1']}, {current['y1']}) → ({current['x2']}, {current['y2']})")
                
                response = input("Redéfinir ? (o/n): ").strip().lower()
                if response != 'o' and response != 'oui':
                    continue
            
            zone_coords = self.input_zone_coordinates(region_name, zone_type)
            if zone_coords:
                self.zones_data[region_name][zone_type] = zone_coords
                print(f"✅ Zone {zone_type} définie: ({zone_coords['x1']}, {zone_coords['y1']}) → ({zone_coords['x2']}, {zone_coords['y2']})")
            else:
                print(f"⏭ Zone {zone_type} ignorée")
    
    def show_progress(self):
        """Affiche le progrès de définition"""
        print(f"\n{'='*60}")
        print("📊 PROGRÈS DE DÉFINITION DES ZONES")
        print(f"{'='*60}")
        
        total_zones = 0
        defined_zones = 0
        
        for region in self.regions:
            if region in self.zones_data:
                region_zones = len(self.zones_data[region])
                total_zones += 3  # 3 types de zones par région
                defined_zones += region_zones
                
                status_symbols = []
                for zone_type in ["armies", "support", "control"]:
                    if zone_type in self.zones_data[region]:
                        status_symbols.append("✅")
                    else:
                        status_symbols.append("❌")
                
                print(f"{region:15} │ {' '.join(status_symbols)} │ {region_zones}/3")
            else:
                total_zones += 3
                print(f"{region:15} │ ❌ ❌ ❌ │ 0/3")
        
        print(f"{'='*60}")
        print(f"TOTAL: {defined_zones}/{total_zones} zones définies ({defined_zones/total_zones*100:.1f}%)")
        print(f"Légende: ✅ Défini  ❌ Manquant")
        print(f"Types: 🔴 Armées  🔵 Support  🟢 Contrôle")
    
    def save_zones(self, filename: str = "map_zones.json"):
        """Sauvegarde les zones en JSON"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.zones_data, f, indent=2, ensure_ascii=False)
            print(f"✅ Zones sauvegardées dans: {filename}")
        except Exception as e:
            print(f"❌ Erreur lors de la sauvegarde: {e}")
    
    def load_zones(self, filename: str = "map_zones.json"):
        """Charge les zones depuis un JSON"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                self.zones_data = json.load(f)
            print(f"✅ Zones chargées depuis: {filename}")
        except FileNotFoundError:
            print(f"📁 Fichier {filename} non trouvé - démarrage avec des zones vides")
        except Exception as e:
            print(f"❌ Erreur lors du chargement: {e}")
    
    def run_interactive(self):
        """Lance le mode interactif"""
        print("🎮 LIBERTY AND DEATH - DÉFINISSEUR DE ZONES INTERACTIF")
        print("="*60)
        
        # Charger les zones existantes
        self.load_zones()
        
        while True:
            print(f"\n{'='*40}")
            print("MENU PRINCIPAL")
            print(f"{'='*40}")
            print("1. Définir zones pour une région")
            print("2. Voir le progrès")
            print("3. Sauvegarder")
            print("4. Charger")
            print("5. Quitter")
            
            choice = input("\nChoix (1-5): ").strip()
            
            if choice == '1':
                self.show_progress()
                print(f"\nRégions disponibles:")
                for i, region in enumerate(self.regions, 1):
                    status = "✅" if region in self.zones_data and len(self.zones_data[region]) == 3 else "❌"
                    print(f"{i:2d}. {status} {region}")
                
                try:
                    region_choice = input("\nChoisir région (numéro ou nom): ").strip()
                    
                    # Par numéro
                    if region_choice.isdigit():
                        region_idx = int(region_choice) - 1
                        if 0 <= region_idx < len(self.regions):
                            self.define_region_zones(self.regions[region_idx])
                    # Par nom
                    else:
                        matching_regions = [r for r in self.regions if region_choice.lower() in r.lower()]
                        if len(matching_regions) == 1:
                            self.define_region_zones(matching_regions[0])
                        elif len(matching_regions) > 1:
                            print(f"❌ Plusieurs régions correspondent: {matching_regions}")
                        else:
                            print(f"❌ Région '{region_choice}' non trouvée")
                
                except ValueError:
                    print("❌ Choix invalide")
            
            elif choice == '2':
                self.show_progress()
            
            elif choice == '3':
                filename = input("Nom du fichier (défaut: map_zones.json): ").strip()
                if not filename:
                    filename = "map_zones.json"
                self.save_zones(filename)
            
            elif choice == '4':
                filename = input("Nom du fichier (défaut: map_zones.json): ").strip()
                if not filename:
                    filename = "map_zones.json"
                self.load_zones(filename)
            
            elif choice == '5':
                print("👋 Au revoir!")
                break
            
            else:
                print("❌ Choix invalide")

def main():
    definer = SimpleZoneDefiner()
    definer.run_interactive()

if __name__ == "__main__":
    main()