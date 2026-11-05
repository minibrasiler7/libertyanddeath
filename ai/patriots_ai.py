from typing import List, Dict, Any
from .base_ai import BaseAI
from core.game_state import GameState
from core.enums import Faction, UnitType, SupportLevel

class PatriotsAI(BaseAI):
    def __init__(self):
        super().__init__(Faction.PATRIOTS)
    
    def decide_action(self, game_state: GameState) -> Dict[str, Any]:
        """
        Logigramme Patriots basé sur les règles COIN:
        1. Priorité au Rabble-rousing pour gagner le support
        2. Construire des milices dans les régions supportrices
        3. Attaquer les positions britanniques faibles
        """
        faction_state = game_state.get_faction(self.faction)
        
        # Évaluer les options disponibles
        actions = []
        
        # Option 1: Rabble-rousing
        rabble_targets = self._get_rabble_rousing_targets(game_state)
        if rabble_targets and self.can_afford_action(1, game_state):
            actions.append({
                "type": "rabble_rousing",
                "targets": rabble_targets[:2],  # Maximum 2 régions
                "priority": self._calculate_rabble_priority(rabble_targets, game_state),
                "cost": 1
            })
        
        # Option 2: Construire des milices
        militia_targets = self._get_militia_targets(game_state)
        if militia_targets and self.can_afford_action(1, game_state):
            actions.append({
                "type": "build_militia",
                "targets": militia_targets[:1],
                "priority": self._calculate_militia_priority(militia_targets, game_state),
                "cost": 1
            })
        
        # Option 3: Attaquer
        attack_targets = self._get_attack_targets(game_state)
        if attack_targets and self.can_afford_action(2, game_state):
            actions.append({
                "type": "attack",
                "targets": attack_targets[:1],
                "priority": self._calculate_attack_priority(attack_targets, game_state),
                "cost": 2
            })
        
        # Choisir l'action avec la plus haute priorité
        if actions:
            best_action = max(actions, key=lambda x: x["priority"])
            return best_action
        
        # Aucune action possible
        return {"type": "pass", "priority": 0, "cost": 0}
    
    def _get_rabble_rousing_targets(self, game_state: GameState) -> List[str]:
        """
        Trouve les régions où faire du Rabble-rousing
        """
        targets = []
        for region_name, region in game_state.board.regions.items():
            # Peut faire du rabble-rousing dans les régions neutres ou d'opposition
            if region.support_level.value <= 0:
                # Priorité aux régions avec population élevée
                if region.population >= 2:
                    targets.append(region_name)
        
        return sorted(targets, key=lambda x: game_state.board.get_region(x).population, reverse=True)
    
    def _get_militia_targets(self, game_state: GameState) -> List[str]:
        """
        Trouve les régions où construire des milices
        """
        targets = []
        for region_name, region in game_state.board.regions.items():
            # Construire des milices dans les régions avec du support
            if region.support_level.value > 0:
                # Vérifier qu'il n'y a pas déjà trop d'unités
                patriot_units = region.get_units_by_faction(Faction.PATRIOTS)
                if len(patriot_units) < 3:  # Limite arbitraire
                    targets.append(region_name)
        
        return sorted(targets, key=lambda x: self.evaluate_region_value(x, game_state), reverse=True)
    
    def _get_attack_targets(self, game_state: GameState) -> List[str]:
        """
        Trouve les cibles d'attaque viables
        """
        targets = []
        for region_name, region in game_state.board.regions.items():
            # Attaquer les régions contrôlées par les British avec peu de défenses
            if region.controlling_faction == Faction.BRITISH:
                british_units = region.get_units_by_faction(Faction.BRITISH)
                if len(british_units) <= 2:  # Cible faible
                    targets.append(region_name)
        
        return sorted(targets, key=lambda x: self.evaluate_region_value(x, game_state), reverse=True)
    
    def _calculate_rabble_priority(self, targets: List[str], game_state: GameState) -> float:
        """
        Calcule la priorité du Rabble-rousing
        """
        if not targets:
            return 0.0
        
        priority = 50.0  # Base priority pour gagner du support
        
        # Bonus pour les régions importantes
        for target in targets[:2]:
            region = game_state.board.get_region(target)
            if region.is_city:
                priority += 20
            priority += region.population * 5
        
        return priority
    
    def _calculate_militia_priority(self, targets: List[str], game_state: GameState) -> float:
        """
        Calcule la priorité de construction de milices
        """
        if not targets:
            return 0.0
        
        priority = 30.0  # Priority modérée
        
        # Bonus si menacé par les ennemis
        for target in targets:
            region = game_state.board.get_region(target)
            for connected in region.connected_regions:
                connected_region = game_state.board.get_region(connected)
                if connected_region and connected_region.controlling_faction == Faction.BRITISH:
                    priority += 15
                    break
        
        return priority
    
    def _calculate_attack_priority(self, targets: List[str], game_state: GameState) -> float:
        """
        Calcule la priorité d'attaque
        """
        if not targets:
            return 0.0
        
        priority = 40.0  # Priority haute pour prendre du territoire
        
        # Bonus pour les villes importantes
        for target in targets:
            region = game_state.board.get_region(target)
            if region.is_city:
                priority += 25
        
        return priority
    
    def get_priority_targets(self, game_state: GameState) -> List[str]:
        """
        Régions prioritaires pour les Patriots
        """
        priorities = []
        for region_name, region in game_state.board.regions.items():
            value = self.evaluate_region_value(region_name, game_state)
            
            # Bonus spéciaux pour les Patriots
            if region.is_city:
                value += 30  # Les villes sont cruciales
            if region.support_level.value > 0:
                value += 20  # Régions supportrices
        
        priorities.append((region_name, value))
        
        return [name for name, _ in sorted(priorities, key=lambda x: x[1], reverse=True)]