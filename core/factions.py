from dataclasses import dataclass, field
from typing import List, Dict
from .enums import Faction, UnitType
from .units import Unit, Leader

@dataclass
class FactionState:
    faction: Faction
    resources: int = 0
    victory_points: int = 0
    units: List[Unit] = field(default_factory=list)
    leaders: List[Leader] = field(default_factory=list)
    
    def add_unit(self, unit_type: UnitType, location: str = None) -> Unit:
        unit = Unit(unit_type=unit_type, faction=self.faction, location=location)
        self.units.append(unit)
        return unit
    
    def remove_unit(self, unit: Unit):
        if unit in self.units:
            self.units.remove(unit)
    
    def get_units_in_region(self, region_name: str) -> List[Unit]:
        return [unit for unit in self.units if unit.location == region_name]
    
    def count_units_by_type(self, unit_type: UnitType) -> int:
        return sum(1 for unit in self.units if unit.unit_type == unit_type)

class PatriotsFaction(FactionState):
    def __init__(self):
        super().__init__(Faction.PATRIOTS)
        self.resources = 5  # Valeur initiale basée sur les règles
        self.setup_initial_leaders()
        self.setup_initial_units()
    
    def setup_initial_leaders(self):
        washington = Leader("Washington", Faction.PATRIOTS, has_brilliant_stroke=True)
        self.leaders.append(washington)
    
    def setup_initial_units(self):
        """Configure les unités patriotes initiales - certaines sur le plateau, d'autres en réserve"""
        # Placer quelques unités sur le plateau dans des régions clés
        initial_placements = [
            ("Massachusetts", UnitType.PATRIOT_MILITIA),
            ("Massachusetts", UnitType.PATRIOT_CONTINENTALS),
            ("Virginia", UnitType.PATRIOT_MILITIA),
            ("Pennsylvania", UnitType.PATRIOT_CONTINENTALS),
        ]
        
        for location, unit_type in initial_placements:
            self.add_unit(unit_type, location)
        
        # Garder des unités en réserve (location = "Available patriot force")
        reserve_units = [
            UnitType.PATRIOT_MILITIA,
            UnitType.PATRIOT_MILITIA,
            UnitType.PATRIOT_CONTINENTALS,
        ]
        
        for unit_type in reserve_units:
            self.add_unit(unit_type, "Available patriot force")
    
    def can_build_fort(self, region_name: str) -> bool:
        # Patriots peuvent construire des forts dans les régions qu'ils contrôlent
        return self.resources >= 1  # Coût simplifié
    
    def get_available_units(self) -> Dict[str, int]:
        """Retourne le nombre d'unités disponibles (en réserve) par type"""
        available_count = {}
        
        # Compter les unités en réserve (location = "Available patriot force")
        for unit in self.units:
            if unit.location == "Available patriot force":
                unit_type_name = unit.unit_type.name
                available_count[unit_type_name] = available_count.get(unit_type_name, 0) + 1
        
        return available_count
    
    def get_units_by_location(self) -> Dict[str, List]:
        """Retourne les unités groupées par localisation"""
        locations = {}
        for unit in self.units:
            location = unit.location or "Sans position"
            if location not in locations:
                locations[location] = []
            locations[location].append(unit)
        return locations
    
    def rabble_rousing_targets(self, board) -> List[str]:
        # Retourne les régions où les Patriots peuvent faire du Rabble-rousing
        return [region.name for region in board.regions.values() 
                if region.support_level.value < 2]

class BritishFaction(FactionState):
    def __init__(self):
        super().__init__(Faction.BRITISH)
        self.resources = 8  # Plus de ressources initiales
        self.setup_initial_leaders()
    
    def setup_initial_leaders(self):
        clinton = Leader("Clinton", Faction.BRITISH, has_brilliant_stroke=True)
        self.leaders.append(clinton)
    
    def can_govern(self, region_name: str) -> bool:
        # British peuvent gouverner dans les régions contrôlées
        return self.resources >= 1

class FrenchFaction(FactionState):
    def __init__(self):
        super().__init__(Faction.FRENCH)
        self.resources = 3  # Entrée progressive
        self.is_active = False  # Pas actifs au début
        self.setup_initial_leaders()
    
    def setup_initial_leaders(self):
        rochambeau = Leader("Rochambeau", Faction.FRENCH, has_brilliant_stroke=True)
        self.leaders.append(rochambeau)
    
    def enter_war(self):
        self.is_active = True
        self.resources = 6  # Augmentation des ressources à l'entrée

class IndiansFaction(FactionState):
    def __init__(self):
        super().__init__(Faction.INDIANS)
        self.resources = 4
        self.setup_initial_leaders()
    
    def setup_initial_leaders(self):
        brant = Leader("Joseph Brant", Faction.INDIANS, has_brilliant_stroke=True)
        self.leaders.append(brant)
    
    def can_raid(self, region_name: str, board) -> bool:
        # Indians peuvent raider les régions avec de l'opposition
        region = board.get_region(region_name)
        return (region and region.support_level.value < 0 and 
                not region.has_raid_marker)