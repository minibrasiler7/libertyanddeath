from enum import Enum, auto

class Faction(Enum):
    PATRIOTS = "patriots"
    BRITISH = "british"
    FRENCH = "french"
    INDIANS = "indians"

class UnitType(Enum):
    # Regular units
    PATRIOT_CONTINENTALS = auto()
    CONTINENTAL = auto()  # Alias pour PATRIOT_CONTINENTALS
    BRITISH_REGULARS = auto()
    FRENCH_REGULARS = auto()

    # Irregular units
    PATRIOT_MILITIA = auto()
    BRITISH_TORIES = auto()
    INDIAN_WAR_PARTIES = auto()

    # Naval units
    FRENCH_SQUADRONS = auto()

    # Structures
    PATRIOT_FORT = auto()
    BRITISH_FORT = auto()
    INDIAN_VILLAGE = auto()

class SupportLevel(Enum):
    ACTIVE_OPPOSITION = -2
    PASSIVE_OPPOSITION = -1
    NEUTRAL = 0
    PASSIVE_SUPPORT = 1
    ACTIVE_SUPPORT = 2

class GamePhase(Enum):
    CARD_PLAY = auto()
    WINTER_QUARTERS = auto()
    VICTORY_CHECK = auto()