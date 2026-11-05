from interface.game_interface import GameInterface

def main():
    # Initialiser l'interface de jeu
    interface = GameInterface()
    
    print("=== LIBERTY AND DEATH - SIMULATEUR IA ===")
    print("Simulation de l'intelligence artificielle pour les factions")
    print()
    
    # Afficher l'état initial
    interface.display_game_state()
    
    # Setup initial - simuler quelques états pour tester les IAs
    print("\n=== SETUP INITIAL ===")
    
    # Donner quelques états initiaux pour tester
    interface.update_region_state("Massachusetts", 1, "patriots")  # Support Patriot
    interface.update_region_state("New York", -1, "british")      # Opposition British
    interface.update_region_state("Virginia", 1, "patriots")      # Support Patriot
    interface.update_region_state("South Carolina", 0, "british") # Neutre British
    
    # Afficher après setup
    interface.display_game_state()
    
    # Simuler quelques tours
    print("\n=== SIMULATION ===")
    
    for turn in range(3):
        winner = interface.run_simulation_turn()
        if winner:
            break
        
        interface.display_game_state()
    
    print("\n=== FIN DE LA SIMULATION ===")

def demo_manual_input():
    """Fonction pour démontrer l'entrée manuelle"""
    interface = GameInterface()
    
    print("=== MODE MANUEL (DÉMO) ===")
    print("Votre ami peut entrer l'état après son tour comme ceci:")
    print()
    
    # Exemples d'entrées
    examples = [
        ("Massachusetts", 2, "patriots", "Après rabble-rousing réussi"),
        ("New York", -2, "british", "Forte opposition après répression"),
        ("Virginia", 1, None, "Support patriot mais pas de contrôle")
    ]
    
    for region, support, control, description in examples:
        print(f"Exemple: {description}")
        print(f"  Région: {region}")
        print(f"  Support: {support} (-2=Opposition Active, +2=Support Actif)")
        print(f"  Contrôle: {control}")
        interface.update_region_state(region, support, control)
        print(f"  ✓ Mise à jour effectuée")
        print()
    
    interface.display_game_state()

if __name__ == "__main__":
    main()
    print("\n" + "="*60)
    demo_manual_input()
