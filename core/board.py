from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from .enums import Faction, SupportLevel
from .units import Unit, Leader

@dataclass
class Region:
    name: str
    is_coastal: bool = False
    is_city: bool = False
    population: int = 0
    support_level: SupportLevel = SupportLevel.NEUTRAL
    controlling_faction: Optional[Faction] = None
    units: List[Unit] = field(default_factory=list)
    leaders: List[Leader] = field(default_factory=list)
    connected_regions: Set[str] = field(default_factory=set)
    has_raid_marker: bool = False
    
    def add_unit(self, unit: Unit):
        unit.location = self.name
        self.units.append(unit)
    
    def remove_unit(self, unit: Unit):
        if unit in self.units:
            self.units.remove(unit)
            unit.location = None
    
    def get_units_by_faction(self, faction: Faction) -> List[Unit]:
        return [unit for unit in self.units if unit.faction == faction]
    
    def has_fort(self, faction: Optional[Faction] = None) -> bool:
        fort_units = [unit for unit in self.units if unit.is_structure]
        if faction:
            fort_units = [unit for unit in fort_units if unit.faction == faction]
        return len(fort_units) > 0

class Board:
    def __init__(self):
        self.regions: Dict[str, Region] = {}
        self._setup_regions()
    
    def _setup_regions(self):
        # Liste des régions principales basée sur la carte et les scénarios
        regions_data = [
            # États américains
            ("New Hampshire", False, False, 1),
            ("Massachusetts", True, True, 3),
            ("Rhode Island", True, False, 1),
            ("Connecticut", False, False, 2),
            ("Connecticut-RI", True, False, 2),  # Région combinée
            ("New York", True, True, 3),
            ("New Jersey", False, False, 2),
            ("Pennsylvania", False, True, 3),
            ("Delaware", True, False, 1),
            ("Maryland", True, False, 2),
            ("Maryland-Delaware", True, False, 2),  # Région combinée
            ("Virginia", True, True, 3),
            ("North Carolina", True, False, 2),
            ("South Carolina", True, True, 2),
            ("Georgia", True, False, 1),

            # Villes importantes
            ("Boston", True, True, 3),
            ("New York City", True, True, 4),
            ("Philadelphia", True, True, 3),
            ("Norfolk", True, True, 1),
            ("Charles Town", True, True, 2),
            ("Savannah", True, True, 1),
            ("Quebec City", False, True, 2),

            # Territoires britanniques et autres
            ("Canada", False, False, 1),
            ("Quebec", False, True, 2),
            ("West Florida", True, False, 1),
            ("East Florida", True, False, 1),
            ("Florida", True, False, 1),  # Région générale

            # Territoires indiens
            ("Northwest", False, False, 0),
            ("Southwest", False, False, 0),

            # Zones spéciales
            ("West Indies", True, False, 0)
        ]
        
        for name, is_coastal, is_city, population in regions_data:
            self.regions[name] = Region(
                name=name,
                is_coastal=is_coastal,
                is_city=is_city,
                population=population
            )
        
        # Connexions entre régions (simplifié)
        self._setup_connections()
    
    def _setup_connections(self):
        connections = [
            ("New Hampshire", "Massachusetts"),
            ("Massachusetts", "Rhode Island"),
            ("Massachusetts", "Connecticut"),
            ("Connecticut", "New York"),
            ("New York", "New Jersey"),
            ("New Jersey", "Pennsylvania"),
            ("Pennsylvania", "Delaware"),
            ("Pennsylvania", "Maryland"),
            ("Maryland", "Virginia"),
            ("Virginia", "North Carolina"),
            ("North Carolina", "South Carolina"),
            ("South Carolina", "Georgia"),
            ("New York", "Canada"),
            ("Canada", "Quebec"),
            ("Georgia", "East Florida"),
            ("East Florida", "West Florida")
        ]
        
        for region1, region2 in connections:
            if region1 in self.regions and region2 in self.regions:
                self.regions[region1].connected_regions.add(region2)
                self.regions[region2].connected_regions.add(region1)
    
    def get_region(self, name: str) -> Optional[Region]:
        return self.regions.get(name)
    
    def get_coastal_regions(self) -> List[Region]:
        return [region for region in self.regions.values() if region.is_coastal]
    
    def get_controlled_regions(self, faction: Faction) -> List[Region]:
        return [region for region in self.regions.values() 
                if region.controlling_faction == faction]
