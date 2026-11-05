from dataclasses import dataclass, field
from typing import Dict, List, Optional
from .enums import Faction, GamePhase
from .board import Board
from .factions import FactionState, PatriotsFaction, BritishFaction, FrenchFaction, IndiansFaction

@dataclass
class GameState:
    turn: int = 1
    phase: GamePhase = GamePhase.CARD_PLAY
    board: Board = field(default_factory=Board)
    factions: Dict[Faction, FactionState] = field(default_factory=dict)
    current_card: Optional[str] = None
    initiative_order: List[Faction] = field(default_factory=list)

    # Marqueurs de victoire globaux
    support_track: int = 0  # Position sur la piste de support (0-50)
    opposition_track: int = 0  # Position sur la piste d'opposition (0-50)
    british_casualties: int = 0  # Pertes britanniques cumulées (0-50)
    rebellion_casualties: int = 0  # Pertes rebelles cumulées (0-50)
    
    def __post_init__(self):
        # Initialiser les factions
        self.factions[Faction.PATRIOTS] = PatriotsFaction()
        self.factions[Faction.BRITISH] = BritishFaction()
        self.factions[Faction.FRENCH] = FrenchFaction()
        self.factions[Faction.INDIANS] = IndiansFaction()
        
        # Ordre d'initiative initial
        self.initiative_order = [Faction.PATRIOTS, Faction.BRITISH, Faction.INDIANS, Faction.FRENCH]
    
    def get_faction(self, faction: Faction) -> FactionState:
        return self.factions[faction]
    
    def check_victory_conditions(self) -> Optional[Faction]:
        # Vérification simplifiée des conditions de victoire
        patriots = self.factions[Faction.PATRIOTS]
        british = self.factions[Faction.BRITISH]
        
        # Patriots gagnent si ils contrôlent assez de régions
        patriot_controlled = len(self.board.get_controlled_regions(Faction.PATRIOTS))
        if patriot_controlled >= 7:  # Seuil simplifié
            return Faction.PATRIOTS
        
        # British gagnent si ils maintiennent le contrôle
        british_controlled = len(self.board.get_controlled_regions(Faction.BRITISH))
        if british_controlled >= 8:  # Seuil simplifié
            return Faction.BRITISH
        
        return None
    
    def next_turn(self):
        self.turn += 1
        self.phase = GamePhase.CARD_PLAY
        
        # Réinitialisation pour le nouveau tour
        for faction_state in self.factions.values():
            for unit in faction_state.units:
                unit.is_active = True
    
    def get_game_summary(self) -> Dict:
        return {
            "turn": self.turn,
            "phase": self.phase.name,
            "factions": {
                faction.name: {
                    "resources": state.resources,
                    "victory_points": state.victory_points,
                    "unit_count": len(state.units),
                    "controlled_regions": len(self.board.get_controlled_regions(faction))
                }
                for faction, state in self.factions.items()
            }
        }