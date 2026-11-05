from dataclasses import dataclass
from typing import Optional
from .enums import UnitType, Faction

@dataclass
class Unit:
    unit_type: UnitType
    faction: Faction
    location: Optional[str] = None
    is_active: bool = True
    
    @property
    def is_regular(self) -> bool:
        return self.unit_type in [
            UnitType.PATRIOT_CONTINENTALS,
            UnitType.CONTINENTAL,
            UnitType.BRITISH_REGULARS,
            UnitType.FRENCH_REGULARS
        ]
    
    @property
    def is_irregular(self) -> bool:
        return self.unit_type in [
            UnitType.PATRIOT_MILITIA,
            UnitType.BRITISH_TORIES,
            UnitType.INDIAN_WAR_PARTIES
        ]
    
    @property
    def is_structure(self) -> bool:
        return self.unit_type in [
            UnitType.PATRIOT_FORT,
            UnitType.BRITISH_FORT,
            UnitType.INDIAN_VILLAGE
        ]

    @property
    def is_naval(self) -> bool:
        return self.unit_type in [
            UnitType.FRENCH_SQUADRONS
        ]

@dataclass
class Leader:
    name: str
    faction: Faction
    location: Optional[str] = None
    has_brilliant_stroke: bool = False
    capabilities: list = None
    
    def __post_init__(self):
        if self.capabilities is None:
            self.capabilities = []