#!/usr/bin/env python3

"""
Script de test pour le setup des scénarios Liberty and Death.
"""

from interface.scenario_setup import ScenarioSetupInterface
from core.game_state import GameState

def test_people_numerous_armed():
    """Test du scénario 'A People Numerous and Armed'"""
    print("🧪 TEST: Setup du scénario 'A People Numerous and Armed'")
    print("=" * 60)

    # Créer l'interface de setup
    setup_interface = ScenarioSetupInterface()

    # Créer un état de jeu vide
    game_state = GameState()

    # Appliquer le scénario directement
    success = setup_interface.setup_scenario(game_state, "people_numerous_armed")

    if success:
        print("\n✅ Test réussi!")
        print("\n📊 STATISTIQUES DU SETUP:")

        # Vérifier quelques éléments clés
        regions_with_units = 0
        total_units = 0

        for region in game_state.board.regions.values():
            if region.units:
                regions_with_units += 1
                total_units += len(region.units)

        print(f"  - Régions avec des unités: {regions_with_units}")
        print(f"  - Total d'unités déployées: {total_units}")

        # Vérifier les ressources
        from core.enums import Faction
        print(f"  - Ressources British: {game_state.factions[Faction.BRITISH].resources}")
        print(f"  - Ressources Patriots: {game_state.factions[Faction.PATRIOTS].resources}")
        print(f"  - Ressources French: {game_state.factions[Faction.FRENCH].resources}")
        print(f"  - Ressources Indians: {game_state.factions[Faction.INDIANS].resources}")

        # Vérifier les marqueurs
        print(f"  - Support Track: {game_state.support_track}")
        print(f"  - Opposition Track: {game_state.opposition_track}")

        return True
    else:
        print("\n❌ Test échoué!")
        return False

def test_interactive_setup():
    """Test du setup interactif"""
    print("\n🧪 TEST: Setup interactif")
    print("=" * 60)

    setup_interface = ScenarioSetupInterface()
    game_state = setup_interface.interactive_setup()

    return game_state

def main():
    """Fonction principale de test"""
    print("🎮 LIBERTY AND DEATH - Tests de Setup de Scénarios")
    print("=" * 60)

    # Test automatique
    test_people_numerous_armed()

    # Demander si l'utilisateur veut tester l'interface interactive
    while True:
        choice = input("\nVoulez-vous tester l'interface interactive? (o/n): ").strip().lower()
        if choice in ['o', 'oui', 'y', 'yes']:
            test_interactive_setup()
            break
        elif choice in ['n', 'non', 'no']:
            break
        else:
            print("Répondez par 'o' ou 'n'")

    print("\n🏁 Tests terminés!")

if __name__ == "__main__":
    main()