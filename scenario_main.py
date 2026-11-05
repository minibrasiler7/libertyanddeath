#!/usr/bin/env python3

"""
Script principal pour la configuration et lancement de scénarios Liberty and Death.
"""

from interface.scenario_setup import ScenarioSetupInterface
from interface.game_interface import GameInterface
import json
import os

def save_game_state(game_state, filename="current_scenario.json"):
    """Sauvegarde l'état du jeu en JSON"""
    try:
        # Convertir l'état de jeu en dictionnaire
        state_dict = {
            "turn": game_state.turn,
            "phase": game_state.phase.name,
            "support_track": game_state.support_track,
            "opposition_track": game_state.opposition_track,
            "british_casualties": game_state.british_casualties,
            "rebellion_casualties": game_state.rebellion_casualties,
            "factions": {},
            "territories": {}
        }

        # Sauvegarder les ressources des factions
        for faction, faction_state in game_state.factions.items():
            state_dict["factions"][faction.value] = {
                "resources": faction_state.resources,
                "units_count": len(faction_state.units),
                "leaders": [leader.name for leader in faction_state.leaders]
            }

        # Sauvegarder l'état des territoires
        for region_name, region in game_state.board.regions.items():
            if region.controlling_faction or region.units or region.support_level.value != 0:
                state_dict["territories"][region_name] = {
                    "controlling_faction": region.controlling_faction.value if region.controlling_faction else None,
                    "support_level": region.support_level.value,
                    "units_count": len(region.units),
                    "units": [
                        {
                            "type": unit.unit_type.name,
                            "faction": unit.faction.value
                        } for unit in region.units
                    ],
                    "leaders": [leader.name for leader in region.leaders]
                }

        # Écrire le fichier
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(state_dict, f, indent=2, ensure_ascii=False)

        print(f"✅ État de jeu sauvegardé dans '{filename}'")
        return True

    except Exception as e:
        print(f"❌ Erreur lors de la sauvegarde: {e}")
        return False

def main():
    """Fonction principale"""
    print("🎮 LIBERTY AND DEATH - Configuration de Scénario")
    print("=" * 60)

    # Créer l'interface de setup
    setup_interface = ScenarioSetupInterface()

    # Configuration interactive du scénario
    game_state = setup_interface.interactive_setup()

    # Proposer de sauvegarder
    while True:
        choice = input("\nVoulez-vous sauvegarder cet état de jeu? (o/n): ").strip().lower()
        if choice in ['o', 'oui', 'y', 'yes']:
            filename = input("Nom du fichier (appuyez sur Entrée pour 'current_scenario.json'): ").strip()
            if not filename:
                filename = "current_scenario.json"
            if not filename.endswith('.json'):
                filename += '.json'

            save_game_state(game_state, filename)
            break
        elif choice in ['n', 'non', 'no']:
            break
        else:
            print("Répondez par 'o' ou 'n'")

    # Proposer de continuer avec le simulateur
    while True:
        choice = input("\nVoulez-vous lancer le simulateur IA sur ce scénario? (o/n): ").strip().lower()
        if choice in ['o', 'oui', 'y', 'yes']:
            print("\n🤖 Lancement du simulateur IA...")

            # Créer l'interface de jeu traditionnelle avec l'état configuré
            game_interface = GameInterface()
            game_interface.game_state = game_state

            print("\n=== ÉTAT INITIAL DU SCÉNARIO ===")
            game_interface.display_game_state()

            print("\n=== SIMULATION ===")
            for turn in range(3):
                print(f"\n--- Tour {turn + 1} ---")
                winner = game_interface.run_simulation_turn()
                if winner:
                    break
                game_interface.display_game_state()

            print("\n🏁 Simulation terminée!")
            break
        elif choice in ['n', 'non', 'no']:
            break
        else:
            print("Répondez par 'o' ou 'n'")

    print("\n👋 Merci d'avoir joué à Liberty and Death!")

if __name__ == "__main__":
    main()