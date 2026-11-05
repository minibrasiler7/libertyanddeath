#!/usr/bin/env python3

"""
Script pour générer automatiquement le fichier cards.json 
à partir des images de cartes présentes dans le dossier Images/Cartes
"""

import os
import json
import re

def generate_cards_database():
    # Chemin vers le dossier des cartes
    cards_dir = "/Users/loicstrauch/PycharmProjects/libertyanddeath/Images/Cartes"
    
    # Chemin de sortie pour le fichier JSON
    output_file = "/Users/loicstrauch/PycharmProjects/libertyanddeath/web/cards.json"
    
    cards_database = {}
    
    # Lister tous les fichiers PNG dans le dossier
    if not os.path.exists(cards_dir):
        print(f"❌ Dossier {cards_dir} non trouvé")
        return
    
    files = [f for f in os.listdir(cards_dir) if f.endswith('.png')]
    files.sort()  # Trier par ordre alphabétique
    
    print(f"📚 Trouvé {len(files)} cartes dans {cards_dir}")
    
    for filename in files:
        # Extraire le numéro et le nom de la carte
        # Format: "01 Waxhaws Massacre.png"
        match = re.match(r'^(\d+)\s+(.+)\.png$', filename)
        
        if match:
            card_id = int(match.group(1))
            card_name = match.group(2)
            
            # Déterminer si c'est une carte Winter
            is_winter = "Winter Quarters" in card_name
            
            # Créer un nom unique pour les cartes Winter
            if is_winter:
                unique_card_name = f"Winter Quarters {card_id}"
                description = f"Carte Winter - Quartiers d'hiver #{card_id}"
            else:
                unique_card_name = card_name
                description = f"Carte historique: {card_name}"
            
            # Ajouter à la base de données
            cards_database[unique_card_name] = {
                "name": unique_card_name,
                "id": card_id,
                "description": description,
                "image": filename,
                "is_winter": is_winter
            }
            
            print(f"✅ {card_id:3d}: {unique_card_name}")
        else:
            print(f"⚠️  Format non reconnu: {filename}")
    
    # Sauvegarder le fichier JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(cards_database, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Base de données sauvegardée: {output_file}")
    print(f"📊 Total: {len(cards_database)} cartes")
    
    # Statistiques
    winter_cards = [card for card in cards_database.values() if card.get('is_winter', False)]
    normal_cards = [card for card in cards_database.values() if not card.get('is_winter', False)]
    
    print(f"   - Cartes normales: {len(normal_cards)}")
    print(f"   - Cartes Winter: {len(winter_cards)}")
    
    return cards_database

if __name__ == "__main__":
    generate_cards_database()