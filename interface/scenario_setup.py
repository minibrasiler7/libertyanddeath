from typing import Optional
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.game_state import GameState
from core.scenarios import ScenarioManager

class ScenarioSetupInterface:
    """Interface pour la configuration des scénarios"""

    def __init__(self):
        self.scenario_manager = ScenarioManager()

    def display_available_scenarios(self):
        """Affiche la liste des scénarios disponibles"""
        print("=== SCÉNARIOS DISPONIBLES ===")
        print()

        scenarios = self.scenario_manager.list_scenarios()
        for i, (scenario_id, name) in enumerate(scenarios, 1):
            scenario = self.scenario_manager.get_scenario(scenario_id)
            status = "✅ Disponible" if scenario else "⏳ En développement"
            print(f"{i}. {name}")
            if scenario:
                print(f"   Description: {scenario.description}")
            print(f"   Statut: {status}")
            print()

    def select_scenario(self) -> Optional[str]:
        """Permet à l'utilisateur de sélectionner un scénario"""
        self.display_available_scenarios()

        while True:
            try:
                choice = input("Choisissez un scénario (numéro ou 'q' pour quitter): ").strip()

                if choice.lower() == 'q':
                    return None

                choice_num = int(choice)
                scenarios = self.scenario_manager.list_scenarios()

                if 1 <= choice_num <= len(scenarios):
                    scenario_id, name = scenarios[choice_num - 1]
                    scenario = self.scenario_manager.get_scenario(scenario_id)

                    if scenario:
                        print(f"✅ Scénario sélectionné: {name}")
                        return scenario_id
                    else:
                        print("❌ Ce scénario n'est pas encore disponible")
                        continue
                else:
                    print("❌ Choix invalide")
                    continue

            except ValueError:
                print("❌ Veuillez entrer un numéro valide")
                continue

    def setup_scenario(self, game_state: GameState, scenario_id: Optional[str] = None) -> bool:
        """Configure un scénario sur l'état de jeu"""

        if scenario_id is None:
            scenario_id = self.select_scenario()

        if scenario_id is None:
            return False

        print(f"🎮 Application du scénario '{scenario_id}'...")

        success = self.scenario_manager.apply_scenario(game_state, scenario_id)

        if success:
            print("✅ Scénario appliqué avec succès!")
            self.display_scenario_summary(game_state, scenario_id)
            return True
        else:
            print("❌ Erreur lors de l'application du scénario")
            return False

    def display_scenario_summary(self, game_state: GameState, scenario_id: str):
        """Affiche un résumé de l'état du jeu après application du scénario"""
        scenario = self.scenario_manager.get_scenario(scenario_id)
        if not scenario:
            return

        print("\n=== RÉSUMÉ DU SETUP ===")
        print(f"Scénario: {scenario.name}")
        print()

        # Ressources des factions
        print("💰 RESSOURCES DES FACTIONS:")
        for faction, faction_state in game_state.factions.items():
            print(f"  {faction.value.title()}: {faction_state.resources}")
        print()

        # Marqueurs de victoire
        print("🎯 MARQUEURS DE VICTOIRE:")
        print(f"  Support: {game_state.support_track}/50")
        print(f"  Opposition: {game_state.opposition_track}/50")
        print(f"  Pertes britanniques: {game_state.british_casualties}/50")
        print(f"  Pertes rebelles: {game_state.rebellion_casualties}/50")
        print()

        # Contrôle des territoires
        print("🏛️ CONTRÔLE DES TERRITOIRES:")
        faction_territories = {}
        for region in game_state.board.regions.values():
            if region.controlling_faction:
                faction = region.controlling_faction.value.title()
                if faction not in faction_territories:
                    faction_territories[faction] = []
                faction_territories[faction].append(region.name)

        for faction, territories in faction_territories.items():
            print(f"  {faction}: {len(territories)} territoires")
            for territory in sorted(territories):
                print(f"    - {territory}")
        print()

        # Unités par faction
        print("⚔️ UNITÉS DÉPLOYÉES:")
        for faction, faction_state in game_state.factions.items():
            deployed_units = [unit for unit in faction_state.units if unit.location and unit.location != "Available"]
            if deployed_units:
                print(f"  {faction.value.title()}: {len(deployed_units)} unités")

                # Compter par type
                unit_counts = {}
                for unit in deployed_units:
                    unit_type = unit.unit_type.name
                    unit_counts[unit_type] = unit_counts.get(unit_type, 0) + 1

                for unit_type, count in sorted(unit_counts.items()):
                    print(f"    - {unit_type}: {count}")
        print()

    def interactive_setup(self) -> GameState:
        """Configuration interactive complète d'un scénario"""
        print("🎮 LIBERTY AND DEATH - Configuration de Scénario")
        print("=" * 60)

        # Créer un nouvel état de jeu
        game_state = GameState()

        # Sélectionner et appliquer un scénario
        if self.setup_scenario(game_state):
            print("\n✅ Configuration terminée!")
            return game_state
        else:
            print("\n❌ Configuration annulée")
            return game_state