from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
from .enums import Faction, UnitType, SupportLevel
from .units import Unit, Leader
from .game_state import GameState

@dataclass
class UnitPlacement:
    """Représente le placement d'une unité dans un territoire"""
    unit_type: UnitType
    faction: Faction
    quantity: int = 1
    leader: Optional[str] = None

@dataclass
class TerritorySetup:
    """Configuration d'un territoire pour un scénario"""
    name: str
    controlling_faction: Optional[Faction] = None
    support_level: SupportLevel = SupportLevel.NEUTRAL
    units: List[UnitPlacement] = field(default_factory=list)

@dataclass
class GlobalSetup:
    """Configuration globale pour un scénario"""
    resources: Dict[Faction, int] = field(default_factory=dict)
    victory_track: Dict[str, int] = field(default_factory=dict)  # Support/Opposition/Casualties
    available_units: Dict[Faction, List[UnitPlacement]] = field(default_factory=dict)

@dataclass
class Scenario:
    """Un scénario de jeu complet"""
    name: str
    description: str
    global_setup: GlobalSetup
    territories: List[TerritorySetup]

class ScenarioManager:
    """Gestionnaire des scénarios de Liberty and Death"""

    def __init__(self):
        self.scenarios = {
            "people_numerous_armed": self._create_people_numerous_armed(),
            # Placeholders pour les autres scénarios
            "british_return_ny": None,
            "southern_campaign": None
        }

    def _create_people_numerous_armed(self) -> Scenario:
        """Créé le scénario 'A People Numerous and Armed'"""

        # Configuration globale
        global_setup = GlobalSetup(
            resources={
                Faction.BRITISH: 6,
                Faction.PATRIOTS: 3,
                Faction.FRENCH: 8,
                Faction.INDIANS: 2
            },
            victory_track={
                "support": 17,
                "opposition": 16,
                "british_casualties": 10,
                "rebellion_casualties": 12
            },
            available_units={
                Faction.BRITISH: [
                    UnitPlacement(UnitType.BRITISH_REGULARS, Faction.BRITISH, 7),
                    UnitPlacement(UnitType.BRITISH_TORIES, Faction.BRITISH, 8),
                    UnitPlacement(UnitType.BRITISH_FORT, Faction.BRITISH, 3)
                ],
                Faction.PATRIOTS: [
                    UnitPlacement(UnitType.PATRIOT_CONTINENTALS, Faction.PATRIOTS, 11),
                    UnitPlacement(UnitType.PATRIOT_MILITIA, Faction.PATRIOTS, 1),
                    UnitPlacement(UnitType.PATRIOT_FORT, Faction.PATRIOTS, 2)
                ],
                Faction.FRENCH: [
                    UnitPlacement(UnitType.FRENCH_REGULARS, Faction.FRENCH, 8),
                    UnitPlacement(UnitType.FRENCH_SQUADRONS, Faction.FRENCH, 3)
                ],
                Faction.INDIANS: [
                    UnitPlacement(UnitType.INDIAN_WAR_PARTIES, Faction.INDIANS, 8),
                    UnitPlacement(UnitType.INDIAN_VILLAGE, Faction.INDIANS, 6)
                ]
            }
        )

        # Configuration des territoires
        territories = [
            # Villes principales
            TerritorySetup(
                name="Quebec City",
                controlling_faction=Faction.BRITISH,
                support_level=SupportLevel.ACTIVE_SUPPORT,
                units=[
                    UnitPlacement(UnitType.BRITISH_REGULARS, Faction.BRITISH, 2),
                    UnitPlacement(UnitType.BRITISH_TORIES, Faction.BRITISH, 2)
                ]
            ),
            TerritorySetup(
                name="Boston",
                controlling_faction=Faction.PATRIOTS,
                support_level=SupportLevel.PASSIVE_OPPOSITION,
                units=[
                    UnitPlacement(UnitType.PATRIOT_CONTINENTALS, Faction.PATRIOTS, 2)
                ]
            ),
            TerritorySetup(
                name="New York City",
                controlling_faction=Faction.BRITISH,
                support_level=SupportLevel.ACTIVE_SUPPORT,
                units=[
                    UnitPlacement(UnitType.BRITISH_REGULARS, Faction.BRITISH, 5),
                    UnitPlacement(UnitType.BRITISH_TORIES, Faction.BRITISH, 3),
                    UnitPlacement(UnitType.BRITISH_FORT, Faction.BRITISH, 1),
                    UnitPlacement(UnitType.BRITISH_REGULARS, Faction.BRITISH, 1, "Clinton")
                ]
            ),
            TerritorySetup(
                name="Philadelphia",
                controlling_faction=Faction.BRITISH,
                support_level=SupportLevel.ACTIVE_SUPPORT,
                units=[
                    UnitPlacement(UnitType.BRITISH_REGULARS, Faction.BRITISH, 4),
                    UnitPlacement(UnitType.BRITISH_TORIES, Faction.BRITISH, 2)
                ]
            ),
            TerritorySetup(
                name="Norfolk",
                controlling_faction=Faction.PATRIOTS,
                support_level=SupportLevel.NEUTRAL,
                units=[
                    UnitPlacement(UnitType.PATRIOT_MILITIA, Faction.PATRIOTS, 1)
                ]
            ),
            TerritorySetup(
                name="Charles Town",
                controlling_faction=Faction.PATRIOTS,
                support_level=SupportLevel.ACTIVE_OPPOSITION,
                units=[
                    UnitPlacement(UnitType.PATRIOT_MILITIA, Faction.PATRIOTS, 2),
                    UnitPlacement(UnitType.PATRIOT_FORT, Faction.PATRIOTS, 1)
                ]
            ),
            TerritorySetup(
                name="Savannah",
                controlling_faction=Faction.BRITISH,
                support_level=SupportLevel.PASSIVE_SUPPORT,
                units=[
                    UnitPlacement(UnitType.BRITISH_TORIES, Faction.BRITISH, 2)
                ]
            ),

            # Régions
            TerritorySetup(
                name="Quebec",
                controlling_faction=Faction.BRITISH,
                support_level=SupportLevel.NEUTRAL,
                units=[
                    UnitPlacement(UnitType.BRITISH_REGULARS, Faction.BRITISH, 2),
                    UnitPlacement(UnitType.BRITISH_TORIES, Faction.BRITISH, 2),
                    UnitPlacement(UnitType.BRITISH_FORT, Faction.BRITISH, 1),
                    UnitPlacement(UnitType.INDIAN_WAR_PARTIES, Faction.INDIANS, 1),
                    UnitPlacement(UnitType.INDIAN_VILLAGE, Faction.INDIANS, 1)
                ]
            ),
            TerritorySetup(
                name="Northwest",
                controlling_faction=None,
                support_level=SupportLevel.NEUTRAL,
                units=[
                    UnitPlacement(UnitType.INDIAN_WAR_PARTIES, Faction.INDIANS, 1),
                    UnitPlacement(UnitType.INDIAN_VILLAGE, Faction.INDIANS, 1),
                    UnitPlacement(UnitType.INDIAN_WAR_PARTIES, Faction.INDIANS, 1, "Cornplanter")
                ]
            ),
            TerritorySetup(
                name="Southwest",
                controlling_faction=None,
                support_level=SupportLevel.NEUTRAL,
                units=[
                    UnitPlacement(UnitType.INDIAN_WAR_PARTIES, Faction.INDIANS, 1),
                    UnitPlacement(UnitType.INDIAN_VILLAGE, Faction.INDIANS, 1)
                ]
            ),
            TerritorySetup(
                name="Florida",
                controlling_faction=Faction.BRITISH,
                support_level=SupportLevel.NEUTRAL,
                units=[
                    UnitPlacement(UnitType.BRITISH_REGULARS, Faction.BRITISH, 1),
                    UnitPlacement(UnitType.BRITISH_FORT, Faction.BRITISH, 1),
                    UnitPlacement(UnitType.INDIAN_WAR_PARTIES, Faction.INDIANS, 1),
                    UnitPlacement(UnitType.INDIAN_VILLAGE, Faction.INDIANS, 1)
                ]
            ),
            TerritorySetup(
                name="New Hampshire",
                controlling_faction=Faction.BRITISH,
                support_level=SupportLevel.ACTIVE_SUPPORT,
                units=[
                    UnitPlacement(UnitType.BRITISH_TORIES, Faction.BRITISH, 2)
                ]
            ),
            TerritorySetup(
                name="Massachusetts",
                controlling_faction=Faction.PATRIOTS,
                support_level=SupportLevel.ACTIVE_OPPOSITION,
                units=[
                    UnitPlacement(UnitType.PATRIOT_FORT, Faction.PATRIOTS, 1)
                ]
            ),
            TerritorySetup(
                name="Connecticut-RI",
                controlling_faction=Faction.PATRIOTS,
                support_level=SupportLevel.ACTIVE_OPPOSITION,
                units=[
                    UnitPlacement(UnitType.BRITISH_TORIES, Faction.BRITISH, 2),
                    UnitPlacement(UnitType.PATRIOT_FORT, Faction.PATRIOTS, 1),
                    UnitPlacement(UnitType.FRENCH_REGULARS, Faction.FRENCH, 4),
                    UnitPlacement(UnitType.FRENCH_REGULARS, Faction.FRENCH, 1, "Rochambeau")
                ]
            ),
            TerritorySetup(
                name="New York",
                controlling_faction=Faction.BRITISH,
                support_level=SupportLevel.ACTIVE_SUPPORT,
                units=[
                    UnitPlacement(UnitType.BRITISH_REGULARS, Faction.BRITISH, 4),
                    UnitPlacement(UnitType.BRITISH_TORIES, Faction.BRITISH, 2),
                    UnitPlacement(UnitType.PATRIOT_MILITIA, Faction.PATRIOTS, 1),
                    UnitPlacement(UnitType.INDIAN_WAR_PARTIES, Faction.INDIANS, 1),
                    UnitPlacement(UnitType.INDIAN_VILLAGE, Faction.INDIANS, 1)
                ]
            ),
            TerritorySetup(
                name="New Jersey",
                controlling_faction=Faction.PATRIOTS,
                support_level=SupportLevel.PASSIVE_OPPOSITION,
                units=[
                    UnitPlacement(UnitType.PATRIOT_CONTINENTALS, Faction.PATRIOTS, 2),
                    UnitPlacement(UnitType.PATRIOT_MILITIA, Faction.PATRIOTS, 4)
                ]
            ),
            TerritorySetup(
                name="Pennsylvania",
                controlling_faction=Faction.PATRIOTS,
                support_level=SupportLevel.PASSIVE_OPPOSITION,
                units=[
                    UnitPlacement(UnitType.PATRIOT_CONTINENTALS, Faction.PATRIOTS, 5),
                    UnitPlacement(UnitType.PATRIOT_MILITIA, Faction.PATRIOTS, 2),
                    UnitPlacement(UnitType.PATRIOT_FORT, Faction.PATRIOTS, 1),
                    UnitPlacement(UnitType.PATRIOT_CONTINENTALS, Faction.PATRIOTS, 1, "Washington"),
                    UnitPlacement(UnitType.INDIAN_WAR_PARTIES, Faction.INDIANS, 1)
                ]
            ),
            TerritorySetup(
                name="Maryland-Delaware",
                controlling_faction=None,
                support_level=SupportLevel.PASSIVE_SUPPORT,
                units=[]
            ),
            TerritorySetup(
                name="North Carolina",
                controlling_faction=Faction.PATRIOTS,
                support_level=SupportLevel.PASSIVE_OPPOSITION,
                units=[
                    UnitPlacement(UnitType.PATRIOT_MILITIA, Faction.PATRIOTS, 2)
                ]
            ),
            TerritorySetup(
                name="South Carolina",
                controlling_faction=None,
                support_level=SupportLevel.NEUTRAL,
                units=[
                    UnitPlacement(UnitType.PATRIOT_MILITIA, Faction.PATRIOTS, 2),
                    UnitPlacement(UnitType.INDIAN_WAR_PARTIES, Faction.INDIANS, 1),
                    UnitPlacement(UnitType.INDIAN_VILLAGE, Faction.INDIANS, 1)
                ]
            ),
            TerritorySetup(
                name="West Indies",
                controlling_faction=Faction.PATRIOTS,
                support_level=SupportLevel.NEUTRAL,
                units=[
                    UnitPlacement(UnitType.FRENCH_REGULARS, Faction.FRENCH, 3),
                    UnitPlacement(UnitType.FRENCH_SQUADRONS, Faction.FRENCH, 3)
                ]
            )
        ]

        return Scenario(
            name="A People Numerous and Armed",
            description="La guerre bat son plein avec les Patriots en rébellion active",
            global_setup=global_setup,
            territories=territories
        )

    def get_scenario(self, scenario_id: str) -> Optional[Scenario]:
        """Récupère un scénario par son ID"""
        return self.scenarios.get(scenario_id)

    def list_scenarios(self) -> List[Tuple[str, str]]:
        """Liste tous les scénarios disponibles"""
        return [
            ("people_numerous_armed", "A People Numerous and Armed"),
            ("british_return_ny", "British Return to New York"),
            ("southern_campaign", "The Southern Campaign")
        ]

    def apply_scenario(self, game_state: GameState, scenario_id: str) -> bool:
        """Applique un scénario à l'état de jeu"""
        scenario = self.get_scenario(scenario_id)
        if not scenario:
            return False

        # Réinitialiser l'état du jeu
        self._reset_game_state(game_state)

        # Appliquer la configuration globale
        self._apply_global_setup(game_state, scenario.global_setup)

        # Configurer les territoires
        self._apply_territory_setup(game_state, scenario.territories)

        return True

    def _reset_game_state(self, game_state: GameState):
        """Remet à zéro l'état de jeu"""
        game_state.turn = 1

        # Nettoyer toutes les unités du plateau
        for region in game_state.board.regions.values():
            region.units.clear()
            region.leaders.clear()
            region.controlling_faction = None
            region.support_level = SupportLevel.NEUTRAL

        # Nettoyer les factions
        for faction_state in game_state.factions.values():
            faction_state.units.clear()
            faction_state.leaders.clear()
            faction_state.resources = 0

    def _apply_global_setup(self, game_state: GameState, global_setup: GlobalSetup):
        """Applique la configuration globale"""
        # Ressources des factions
        for faction, resources in global_setup.resources.items():
            if faction in game_state.factions:
                game_state.factions[faction].resources = resources

        # Marqueurs de victoire
        if "support" in global_setup.victory_track:
            game_state.support_track = global_setup.victory_track["support"]
        if "opposition" in global_setup.victory_track:
            game_state.opposition_track = global_setup.victory_track["opposition"]
        if "british_casualties" in global_setup.victory_track:
            game_state.british_casualties = global_setup.victory_track["british_casualties"]
        if "rebellion_casualties" in global_setup.victory_track:
            game_state.rebellion_casualties = global_setup.victory_track["rebellion_casualties"]

    def _apply_territory_setup(self, game_state: GameState, territories: List[TerritorySetup]):
        """Configure les territoires selon le scénario"""
        for territory_setup in territories:
            region = game_state.board.get_region(territory_setup.name)
            if not region:
                print(f"Attention: Région '{territory_setup.name}' non trouvée")
                continue

            # Configuration de base
            region.controlling_faction = territory_setup.controlling_faction
            region.support_level = territory_setup.support_level

            # Placement des unités
            for unit_placement in territory_setup.units:
                for _ in range(unit_placement.quantity):
                    unit = Unit(
                        unit_type=unit_placement.unit_type,
                        faction=unit_placement.faction,
                        location=territory_setup.name
                    )

                    # Ajouter à la région et à la faction
                    region.add_unit(unit)
                    game_state.factions[unit_placement.faction].units.append(unit)

                    # Ajouter le leader si spécifié
                    if unit_placement.leader:
                        leader = Leader(
                            name=unit_placement.leader,
                            faction=unit_placement.faction,
                            location=territory_setup.name
                        )
                        region.leaders.append(leader)
                        game_state.factions[unit_placement.faction].leaders.append(leader)