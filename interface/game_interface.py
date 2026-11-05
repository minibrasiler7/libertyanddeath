from typing import Dict, List, Optional
from core.game_state import GameState
from core.enums import Faction, SupportLevel
from ai.patriots_ai import PatriotsAI
from ai.british_ai import BritishAI

class GameInterface:
    def __init__(self):
        self.game_state = GameState()
        self.ais = {
            Faction.PATRIOTS: PatriotsAI(),
            Faction.BRITISH: BritishAI(),
            # Faction.FRENCH: FrenchAI(),    # À implémenter
            # Faction.INDIANS: IndiansAI()   # À implémenter
        }
    
    def display_game_state(self):
        """Affiche l'état actuel du jeu"""
        print(f"\n=== TOUR {self.game_state.turn} - {self.game_state.phase.name} ===")
        
        # Afficher les factions
        for faction, state in self.game_state.factions.items():
            print(f"\n{faction.name}:")
            print(f"  Ressources: {state.resources}")
            print(f"  Unités totales: {len(state.units)}")
            controlled = len(self.game_state.board.get_controlled_regions(faction))
            print(f"  Régions contrôlées: {controlled}")
            
            # Afficher les positions des unités pour les Patriots
            if faction == Faction.PATRIOTS and hasattr(state, 'get_units_by_location'):
                locations = state.get_units_by_location()
                print(f"  Positions des unités:")
                for location, units in locations.items():
                    unit_types = {}
                    for unit in units:
                        unit_name = unit.unit_type.name
                        unit_types[unit_name] = unit_types.get(unit_name, 0) + 1
                    
                    unit_summary = ", ".join([f"{count} {unit_type}" for unit_type, count in unit_types.items()])
                    print(f"    {location}: {unit_summary}")
                
                # Afficher spécifiquement les unités disponibles
                if hasattr(state, 'get_available_units'):
                    available = state.get_available_units()
                    if available:
                        available_summary = ", ".join([f"{count} {unit_type}" for unit_type, count in available.items()])
                        print(f"  Unités disponibles en réserve: {available_summary}")
                    else:
                        print(f"  Unités disponibles en réserve: Aucune")
        
        # Afficher quelques régions importantes
        print(f"\n=== RÉGIONS CLÉS ===")
        important_regions = ["Massachusetts", "New York", "Virginia", "Pennsylvania"]
        for region_name in important_regions:
            region = self.game_state.board.get_region(region_name)
            if region:
                print(f"{region_name}: Support={region.support_level.name}, "
                      f"Contrôle={region.controlling_faction.name if region.controlling_faction else 'Neutre'}")
    
    def update_region_state(self, region_name: str, support_level: int, 
                          controlling_faction: str = None):
        """Met à jour l'état d'une région basé sur l'input utilisateur"""
        region = self.game_state.board.get_region(region_name)
        if not region:
            print(f"Région '{region_name}' non trouvée")
            return
        
        # Mettre à jour le support
        if -2 <= support_level <= 2:
            region.support_level = SupportLevel(support_level)
        
        # Mettre à jour le contrôle
        if controlling_faction:
            try:
                faction = Faction(controlling_faction.lower())
                region.controlling_faction = faction
            except ValueError:
                region.controlling_faction = None
    
    def run_ai_turn(self, faction: Faction):
        """Exécute le tour d'une IA"""
        if faction not in self.ais:
            print(f"IA non implémentée pour {faction.name}")
            return
        
        ai = self.ais[faction]
        action = ai.decide_action(self.game_state)
        
        print(f"\n--- TOUR DE {faction.name} ---")
        self._execute_ai_action(faction, action)
        
        return action
    
    def _execute_ai_action(self, faction: Faction, action: Dict):
        """Exécute une action décidée par l'IA et affiche les changements"""
        if action["type"] == "pass":
            print(f"{faction.name} passe son tour (ressources insuffisantes)")
            return
        
        faction_state = self.game_state.get_faction(faction)
        
        print(f"{faction.name} choisit: {action['type'].upper()}")
        print(f"Cibles: {', '.join(action.get('targets', []))}")
        print(f"Coût: {action['cost']} ressources")
        
        # Déduire le coût
        faction_state.resources -= action["cost"]
        
        # Simuler les effets de l'action
        if action["type"] == "rabble_rousing":
            self._simulate_rabble_rousing(action["targets"])
        elif action["type"] == "build_militia":
            self._simulate_build_militia(faction, action["targets"])
        elif action["type"] == "govern":
            self._simulate_govern(action["targets"])
        elif action["type"] == "build_fort":
            self._simulate_build_fort(faction, action["targets"])
        
        print(f"Ressources restantes: {faction_state.resources}")
    
    def _simulate_rabble_rousing(self, targets: List[str]):
        """Simule l'effet du Rabble-rousing"""
        for target in targets:
            region = self.game_state.board.get_region(target)
            if region and region.support_level.value < 2:
                old_level = region.support_level
                region.support_level = SupportLevel(min(2, region.support_level.value + 1))
                print(f"  {target}: Support {old_level.name} → {region.support_level.name}")
    
    def _simulate_build_militia(self, faction: Faction, targets: List[str]):
        """Simule la construction de milices"""
        from core.units import Unit
        from core.enums import UnitType
        
        for target in targets:
            region = self.game_state.board.get_region(target)
            if region:
                unit = Unit(UnitType.PATRIOT_MILITIA, faction, target)
                region.add_unit(unit)
                self.game_state.get_faction(faction).units.append(unit)
                print(f"  Milice construite à {target}")
    
    def _simulate_govern(self, targets: List[str]):
        """Simule l'action de gouverner"""
        for target in targets:
            region = self.game_state.board.get_region(target)
            if region and region.support_level.value < 0:
                old_level = region.support_level
                region.support_level = SupportLevel(min(0, region.support_level.value + 1))
                print(f"  {target}: Opposition réduite {old_level.name} → {region.support_level.name}")
    
    def _simulate_build_fort(self, faction: Faction, targets: List[str]):
        """Simule la construction de forts"""
        from core.units import Unit
        from core.enums import UnitType
        
        for target in targets:
            region = self.game_state.board.get_region(target)
            if region:
                fort_type = UnitType.PATRIOT_FORT if faction == Faction.PATRIOTS else UnitType.BRITISH_FORT
                unit = Unit(fort_type, faction, target)
                region.add_unit(unit)
                self.game_state.get_faction(faction).units.append(unit)
                print(f"  Fort construit à {target}")
    
    def run_simulation_turn(self):
        """Exécute un tour complet avec toutes les IAs"""
        print(f"\n{'='*50}")
        print(f"DÉBUT DU TOUR {self.game_state.turn}")
        print(f"{'='*50}")
        
        # Faire jouer chaque IA dans l'ordre d'initiative
        for faction in self.game_state.initiative_order:
            if faction in self.ais:
                self.run_ai_turn(faction)
        
        # Passer au tour suivant
        self.game_state.next_turn()
        
        # Vérifier les conditions de victoire
        winner = self.game_state.check_victory_conditions()
        if winner:
            print(f"\n🎉 VICTOIRE DE {winner.name}! 🎉")
            return winner
        
        return None