#!/usr/bin/env python3

"""
Script de configuration de l'environnement pour Liberty and Death

Ce script configure un environnement virtuel et installe les dépendances nécessaires.
"""

import subprocess
import sys
import os
import venv

def create_virtual_environment():
    """Crée un environnement virtuel"""
    venv_path = os.path.join(os.getcwd(), "venv")
    
    if os.path.exists(venv_path):
        print("Environnement virtuel existe déjà")
        return venv_path
    
    print("Création de l'environnement virtuel...")
    venv.create(venv_path, with_pip=True)
    print(f"Environnement virtuel créé dans: {venv_path}")
    return venv_path

def install_dependencies(venv_path):
    """Installe les dépendances dans l'environnement virtuel"""
    if sys.platform == "win32":
        pip_path = os.path.join(venv_path, "Scripts", "pip")
    else:
        pip_path = os.path.join(venv_path, "bin", "pip")
    
    dependencies = ["pillow", "tkinter-tooltip"]
    
    for dep in dependencies:
        print(f"Installation de {dep}...")
        try:
            subprocess.check_call([pip_path, "install", dep])
            print(f"✓ {dep} installé avec succès")
        except subprocess.CalledProcessError:
            print(f"⚠ Erreur lors de l'installation de {dep}")
        except FileNotFoundError:
            print(f"⚠ pip non trouvé à {pip_path}")
            break

def create_activation_script():
    """Crée un script d'activation simplifié"""
    if sys.platform == "win32":
        script_content = """@echo off
call venv\\Scripts\\activate.bat
python run_map_selector.py
"""
        script_name = "run_with_venv.bat"
    else:
        script_content = """#!/bin/bash
source venv/bin/activate
python3 run_map_selector.py
"""
        script_name = "run_with_venv.sh"
    
    with open(script_name, 'w') as f:
        f.write(script_content)
    
    if sys.platform != "win32":
        os.chmod(script_name, 0o755)
    
    print(f"Script d'activation créé: {script_name}")

def main():
    print("=== Configuration de l'environnement Liberty and Death ===")
    
    try:
        # Créer l'environnement virtuel
        venv_path = create_virtual_environment()
        
        # Installer les dépendances
        install_dependencies(venv_path)
        
        # Créer le script d'activation
        create_activation_script()
        
        print("\n=== Configuration terminée ===")
        print("Pour utiliser le sélecteur de zones:")
        if sys.platform == "win32":
            print("1. Exécutez: run_with_venv.bat")
        else:
            print("1. Exécutez: ./run_with_venv.sh")
            print("   ou")
            print("1. source venv/bin/activate")
            print("2. python3 run_map_selector.py")
        
    except Exception as e:
        print(f"Erreur lors de la configuration: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())