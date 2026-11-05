from typing import List, Dict, Any
from .base_ai import BaseAI
from core.game_state import GameState
from core.enums import Faction, UnitType

class BritishAI(BaseAI):
    def __init__(self):
        super().__init__(Faction.BRITISH)
    
    def decide_action(self, game_state: GameState) -> Dict[str, Any]:
        """
        Logigramme British basé sur les règles COIN:
        1. Priorité au contrôle des ports et villes
        2. Gouverner pour maintenir l'ordre
        3. Construire des forts dans les positions stratégiques
        4. Éliminer les milices patriotes
        """
        faction_state = game_state.get_faction(self.faction)
        
        actions = []
        
        # Option 1: Gouverner (Govern)
        govern_targets = self._get_govern_targets(game_state)
        if govern_targets and self.can_afford_action(1, game_state):
            actions.append({
                "type": "govern",
                "targets": govern_targets[:2],
                "priority": self._calculate_govern_priority(govern_targets, game_state),
                "cost": 1
            })
        
        # Option 2: Construire des forts
        fort_targets = self._get_fort_targets(game_state)
        if fort_targets and self.can_afford_action(2, game_state):
            actions.append({
                "type": "build_fort",
                "targets": fort_targets[:1],
                "priority": self._calculate_fort_priority(fort_targets, game_state),
                "cost": 2
            })
        
        # Option 3: Opérations militaires
        military_targets = self._get_military_targets(game_state)
        if military_targets and self.can_afford_action(2, game_state):
            actions.append({
                "type": "military_operation",
                "targets": military_targets[:1],
                "priority": self._calculate_military_priority(military_targets, game_state),
                "cost": 2
            })
        
        # Option 4: Déployer des Regulars
        deploy_targets = self._get_deploy_targets(game_state)
        if deploy_targets and self.can_afford_action(1, game_state):
            actions.append({
                "type": "deploy_regulars",
                "targets": deploy_targets[:1],
                "priority": self._calculate_deploy_priority(deploy_targets, game_state),
                "cost": 1
            })
        
        if actions:
            best_action = max(actions, key=lambda x: x["priority"])
            return best_action
        
        return {"type": "pass", "priority": 0, "cost": 0}
    
    def _get_govern_targets(self, game_state: GameState) -> List[str]:
        """
        Régions où exercer le gouvernement
        """
        targets = []
        for region_name, region in game_state.board.regions.items():
            # Gouverner dans les régions contrôlées avec de l'opposition
            if (region.controlling_faction == self.faction and 
                region.support_level.value < 0):
                targets.append(region_name)
        
        return sorted(targets, key=lambda x: game_state.board.get_region(x).population, reverse=True)
    
    def _get_fort_targets(self, game_state: GameState) -> List[str]:
        """
        Emplacements stratégiques pour les forts
        """
        targets = []
        for region_name, region in game_state.board.regions.items():
            # Construire des forts dans les ports importants
            if (region.is_coastal and region.is_city and 
                not region.has_fort(self.faction)):
                targets.append(region_name)
            # Ou dans les régions frontalières contrôlées
            elif region.controlling_faction == self.faction:
                # Vérifier si adjacent à des régions ennemies
                for connected in region.connected_regions:
                    connected_region = game_state.board.get_region(connected)
                    if (connected_region and 
                        connected_region.controlling_faction == Faction.PATRIOTS):
                        targets.append(region_name)
                        break
        
        return sorted(targets, key=lambda x: self.evaluate_region_value(x, game_state), reverse=True)
    
    def _get_military_targets(self, game_state: GameState) -> List[str]:
        """
        Cibles pour opérations militaires
        """
        targets = []
        for region_name, region in game_state.board.regions.items():
            # Attaquer les concentrations de milices patriotes
            patriot_units = region.get_units_by_faction(Faction.PATRIOTS)
            if len(patriot_units) >= 2:
                targets.append(region_name)
        
        return sorted(targets, key=lambda x: len(game_state.board.get_region(x).get_units_by_faction(Faction.PATRIOTS)), reverse=True)
    
    def _get_deploy_targets(self, game_state: GameState) -> List[str]:
        """
        Régions pour déployer des Regulars
        """
        targets = []
        for region_name, region in game_state.board.regions.items():
            # Déployer dans les ports contrôlés
            if (region.is_coastal and region.controlling_faction == self.faction):
                british_units = region.get_units_by_faction(self.faction)
                if len(british_units) < 3:  # Pas trop d'unités déjà
                    targets.append(region_name)
        
        return sorted(targets, key=lambda x: self.evaluate_region_value(x, game_state), reverse=True)
    
    def _calculate_govern_priority(self, targets: List[str], game_state: GameState) -> float:
        priority = 60.0  # Haute priorité pour maintenir l'ordre
        
        for target in targets[:2]:
            region = game_state.board.get_region(target)
            if region.is_city:
                priority += 25
            priority += abs(region.support_level.value) * 10
        
        return priority
    
    def _calculate_fort_priority(self, targets: List[str], game_state: GameState) -> float:
        priority = 45.0  # Priority modérée-haute
        
        for target in targets:
            region = game_state.board.get_region(target)
            if region.is_coastal and region.is_city:
                priority += 30  # Ports très importants
        
        return priority
    
    def _calculate_military_priority(self, targets: List[str], game_state: GameState) -> float:
        priority = 50.0  # Priority haute pour éliminer la résistance
        
        for target in targets:
            patriot_units = game_state.board.get_region(target).get_units_by_faction(Faction.PATRIOTS)
            priority += len(patriot_units) * 15
        
        return priority
    
    def _calculate_deploy_priority(self, targets: List[str], game_state: GameState) -> float:
        priority = 35.0  # Priority modérée
        
        for target in targets:
            region = game_state.board.get_region(target)
            if region.is_coastal:
                priority += 20
        
        return priority
    
    def get_priority_targets(self, game_state: GameState) -> List[str]:
        priorities = []
        for region_name, region in game_state.board.regions.items():
            value = self.evaluate_region_value(region_name, game_state)
            
            # Bonus spéciaux pour les British
            if region.is_coastal:
                value += 25  # Contrôle naval crucial
            if region.is_city:
                value += 30  # Centres administratifs
            if region.controlling_faction == self.faction:
                value += 15  # Maintenir le contrôle
        
        priorities.append((region_name, value))
        
        return [name for name, _ in sorted(priorities, key=lambda x: x[1], reverse=True)]