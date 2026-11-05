#!/usr/bin/env python3

"""
Serveur API pour Liberty and Death - Interface entre le web et le système de scénarios Python
"""

import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
import socket

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.scenarios import ScenarioManager
from core.game_state import GameState
from core.enums import Faction, UnitType, SupportLevel

class LibertAndDeathAPI(BaseHTTPRequestHandler):
    """Handler pour l'API Liberty and Death"""

    def __init__(self, *args, **kwargs):
        self.scenario_manager = ScenarioManager()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Gère les requêtes GET"""
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            query_params = parse_qs(parsed_url.query)

            # Servir les fichiers statiques (HTML, JS, CSS, JSON, images)
            if path == '/' or path == '/index.html':
                path = '/game-board.html'

            web_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'web')

            # Si le chemin ne commence pas par /api/, servir les fichiers statiques
            if not path.startswith('/api/'):
                # Décoder l'URL pour gérer les espaces et caractères spéciaux
                decoded_path = unquote(path.lstrip('/'))
                file_path = os.path.join(web_dir, decoded_path)

                if os.path.exists(file_path) and os.path.isfile(file_path):
                    # Déterminer le type MIME
                    content_type = 'text/html'
                    if path.endswith('.js'):
                        content_type = 'application/javascript'
                    elif path.endswith('.css'):
                        content_type = 'text/css'
                    elif path.endswith('.json'):
                        content_type = 'application/json'
                    elif path.endswith('.png'):
                        content_type = 'image/png'
                    elif path.endswith('.jpg') or path.endswith('.jpeg'):
                        content_type = 'image/jpeg'
                    elif path.endswith('.svg'):
                        content_type = 'image/svg+xml'

                    self.send_response(200)
                    self.send_header('Content-Type', content_type)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()

                    # Lire et envoyer le fichier
                    mode = 'rb' if content_type.startswith('image') else 'r'
                    encoding = None if mode == 'rb' else 'utf-8'

                    with open(file_path, mode, encoding=encoding) as f:
                        content = f.read()
                        if isinstance(content, str):
                            content = content.encode('utf-8')
                        self.wfile.write(content)
                    return

            # Headers CORS pour les API
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()

            response_data = {}

            if path == '/api/scenarios':
                # Liste des scénarios disponibles
                scenarios = self.scenario_manager.list_scenarios()
                response_data = {
                    "scenarios": [
                        {
                            "id": scenario_id,
                            "name": name,
                            "available": self.scenario_manager.get_scenario(scenario_id) is not None
                        }
                        for scenario_id, name in scenarios
                    ]
                }

            elif path == '/api/scenario' and 'id' in query_params:
                # Détails d'un scénario spécifique
                scenario_id = query_params['id'][0]
                scenario = self.scenario_manager.get_scenario(scenario_id)

                if scenario:
                    # Créer un état de jeu temporaire pour appliquer le scénario
                    game_state = GameState()
                    success = self.scenario_manager.apply_scenario(game_state, scenario_id)

                    if success:
                        response_data = self.convert_game_state_to_web_format(game_state, scenario)
                    else:
                        response_data = {"error": "Failed to apply scenario"}
                else:
                    response_data = {"error": f"Scenario '{scenario_id}' not found"}

            elif path == '/api/health':
                # Check de santé
                response_data = {"status": "ok", "message": "Liberty and Death API is running"}

            else:
                self.send_response(404)
                response_data = {"error": f"Endpoint not found: {path}"}

            # Envoyer la réponse
            response_json = json.dumps(response_data, ensure_ascii=False, indent=2)
            self.wfile.write(response_json.encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {"error": f"Internal server error: {str(e)}"}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def do_OPTIONS(self):
        """Gère les requêtes OPTIONS pour CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def convert_game_state_to_web_format(self, game_state, scenario):
        """Convertit l'état de jeu Python vers le format attendu par l'interface web"""

        # Mapper les factions
        faction_mapping = {
            Faction.PATRIOTS: "patriots",
            Faction.BRITISH: "british",
            Faction.FRENCH: "french",
            Faction.INDIANS: "indians"
        }

        # Mapper les types d'unités
        unit_type_mapping = {
            UnitType.PATRIOT_CONTINENTALS: "continentals",
            UnitType.PATRIOT_MILITIA: "militia",
            UnitType.PATRIOT_FORT: "fort",
            UnitType.BRITISH_REGULARS: "regulars",
            UnitType.BRITISH_TORIES: "tories",
            UnitType.BRITISH_FORT: "fort",
            UnitType.FRENCH_REGULARS: "regulars",
            UnitType.FRENCH_SQUADRONS: "squadrons",
            UnitType.INDIAN_WAR_PARTIES: "warparties",
            UnitType.INDIAN_VILLAGE: "village"
        }

        # Mapper les niveaux de support
        support_mapping = {
            SupportLevel.ACTIVE_OPPOSITION: "active_opposition",
            SupportLevel.PASSIVE_OPPOSITION: "passive_opposition",
            SupportLevel.NEUTRAL: "neutral",
            SupportLevel.PASSIVE_SUPPORT: "passive_support",
            SupportLevel.ACTIVE_SUPPORT: "active_support"
        }

        web_data = {
            "scenario": {
                "id": scenario.name.lower().replace(" ", "_"),
                "name": scenario.name,
                "description": scenario.description
            },
            "global_state": {
                "turn": game_state.turn,
                "support_track": game_state.support_track,
                "opposition_track": game_state.opposition_track,
                "british_casualties": game_state.british_casualties,
                "rebellion_casualties": game_state.rebellion_casualties
            },
            "factions": {},
            "territories": {}
        }

        # Ressources des factions
        for faction, faction_state in game_state.factions.items():
            web_faction_id = faction_mapping.get(faction, faction.value)
            web_data["factions"][web_faction_id] = {
                "resources": faction_state.resources,
                "units_total": len(faction_state.units),
                "leaders": [leader.name for leader in faction_state.leaders]
            }

        # État des territoires
        for region_name, region in game_state.board.regions.items():
            if region.controlling_faction or region.units or region.support_level != SupportLevel.NEUTRAL:
                territory_data = {
                    "name": region_name,
                    "controlling_faction": faction_mapping.get(region.controlling_faction) if region.controlling_faction else None,
                    "support_level": support_mapping.get(region.support_level, "neutral"),
                    "units": {}
                }

                # Compter les unités par faction et type
                for unit in region.units:
                    faction_key = faction_mapping.get(unit.faction, unit.faction.value)
                    unit_type_key = unit_type_mapping.get(unit.unit_type, unit.unit_type.name.lower())

                    if faction_key not in territory_data["units"]:
                        territory_data["units"][faction_key] = {}

                    if unit_type_key not in territory_data["units"][faction_key]:
                        territory_data["units"][faction_key][unit_type_key] = 0

                    territory_data["units"][faction_key][unit_type_key] += 1

                # Ajouter les leaders
                territory_data["leaders"] = [leader.name for leader in region.leaders]

                web_data["territories"][region_name] = territory_data

        return web_data

    def log_message(self, format, *args):
        """Log personnalisé pour l'API"""
        print(f"[API] {format % args}")

def find_available_port(start_port=3001, max_attempts=10):
    """Trouve un port disponible"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    return None

def main():
    """Démarre le serveur API"""
    port = find_available_port()

    if not port:
        print("❌ Aucun port disponible trouvé")
        return 1

    server_address = ('localhost', port)
    httpd = HTTPServer(server_address, LibertAndDeathAPI)

    print("🚀 API Liberty and Death démarrée")
    print(f"📡 Adresse: http://localhost:{port}")
    print("🔗 Endpoints disponibles:")
    print(f"   - GET /api/health")
    print(f"   - GET /api/scenarios")
    print(f"   - GET /api/scenario?id=people_numerous_armed")
    print("⚠️  Utilisez Ctrl+C pour arrêter")
    print()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Serveur arrêté par l'utilisateur")
        httpd.shutdown()
        return 0

if __name__ == "__main__":
    exit(main())