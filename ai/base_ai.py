from abc import ABC, abstractmethod
from typing import List, Dict, Any
from core.game_state import GameState
from core.enums import Faction

class BaseAI(ABC):
    def __init__(self, faction: Faction):
        self.faction = faction
    
    @abstractmethod
    def decide_action(self, game_state: GameState) -> Dict[str, Any]:
        """
        Décide de l'action à prendre basée sur l'état du jeu
        Retourne un dictionnaire décrivant l'action
        """
        pass
    
    @abstractmethod
    def get_priority_targets(self, game_state: GameState) -> List[str]:
        """
        Retourne une liste de régions prioritaires pour cette faction
        """
        pass
    
    def evaluate_region_value(self, region_name: str, game_state: GameState) -> float:
        """
        Évalue la valeur stratégique d'une région pour cette faction
        """
        region = game_state.board.get_region(region_name)
        if not region:
            return 0.0
        
        value = 0.0
        
        # Population base
        value += region.population * 10
        
        # Bonus pour les villes
        if region.is_city:
            value += 20
        
        # Bonus pour les régions côtières
        if region.is_coastal:
            value += 10
        
        # Malus si contrôlé par l'ennemi
        if region.controlling_faction and region.controlling_faction != self.faction:
            value -= 15
        
        return value
    
    def can_afford_action(self, cost: int, game_state: GameState) -> bool:
        """
        Vérifie si la faction peut se permettre une action
        """
        faction_state = game_state.get_faction(self.faction)
        return faction_state.resources >= cost
    
    def get_enemy_factions(self) -> List[Faction]:
        """
        Retourne les factions ennemies
        """
        all_factions = [Faction.PATRIOTS, Faction.BRITISH, Faction.FRENCH, Faction.INDIANS]
        return [f for f in all_factions if f != self.faction]