#!/usr/bin/env python3

"""
Serveur web simple pour lancer l'interface de sélection de zones.

Ce script lance un serveur HTTP local pour servir l'interface web.
"""

import http.server
import socketserver
import webbrowser
import os
import threading
import time

def start_server(port=8000):
    """Démarre le serveur web"""
    # Servir depuis le répertoire racine du projet pour accéder aux Images/
    project_dir = os.path.dirname(__file__)
    
    class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=project_dir, **kwargs)
        
        def end_headers(self):
            # Rediriger / vers /web/
            if self.path == '/':
                self.send_response(301)
                self.send_header('Location', '/web/')
                super().end_headers()
                return
            super().end_headers()
        
        def log_message(self, format, *args):
            # Logs simplifiés
            if not self.path.endswith(('.css', '.js', '.png', '.jpg', '.ico')):
                print(f"[{self.address_string()}] {format % args}")
    
    try:
        with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
            print(f"🌐 Serveur démarré sur http://localhost:{port}")
            print("🎮 Interface de sélection de zones disponible")
            print("📍 Ouvrez votre navigateur à l'adresse ci-dessus")
            print("⚠️  Utilisez Ctrl+C pour arrêter le serveur")
            print()
            
            # Ouvrir automatiquement le navigateur après un délai
            def open_browser():
                time.sleep(2)
                webbrowser.open(f"http://localhost:{port}")
            
            browser_thread = threading.Thread(target=open_browser)
            browser_thread.daemon = True
            browser_thread.start()
            
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Le port {port} est déjà utilisé")
            print(f"💡 Essayez avec un autre port: python3 {__file__} --port {port+1}")
        else:
            print(f"❌ Erreur lors du démarrage du serveur: {e}")

def check_files():
    """Vérifie que tous les fichiers nécessaires existent"""
    web_dir = os.path.join(os.path.dirname(__file__), 'web')
    required_files = ['index.html', 'zone-selector.js']
    
    missing_files = []
    for filename in required_files:
        filepath = os.path.join(web_dir, filename)
        if not os.path.exists(filepath):
            missing_files.append(filename)
    
    if missing_files:
        print(f"❌ Fichiers manquants dans le dossier web/:")
        for filename in missing_files:
            print(f"   • {filename}")
        return False
    
    # Vérifier l'image de la carte
    map_path = os.path.join(os.path.dirname(__file__), 'Images', 'Map', 'LODmap_VASSAL (resize).jpg')
    if not os.path.exists(map_path):
        print(f"⚠️  Image de la carte non trouvée: {map_path}")
        print("   L'interface utilisera une carte de substitution")
    else:
        print(f"✅ Image de la carte trouvée: {map_path}")
    
    return True

def main():
    print("🎮 LIBERTY AND DEATH - Interface Web de Sélection de Zones")
    print("="*60)
    
    # Vérifier les fichiers
    if not check_files():
        return 1
    
    # Démarrer le serveur
    try:
        port = 8000
        # Vérifier les arguments
        import sys
        if len(sys.argv) > 1:
            if sys.argv[1] == '--port' and len(sys.argv) > 2:
                try:
                    port = int(sys.argv[2])
                except ValueError:
                    print("❌ Port invalide")
                    return 1
        
        start_server(port)
        
    except KeyboardInterrupt:
        print("\\n🛑 Serveur arrêté par l'utilisateur")
        return 0
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        return 1

if __name__ == "__main__":
    exit(main())