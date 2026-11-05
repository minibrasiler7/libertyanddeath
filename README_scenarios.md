# 🎮 Liberty and Death - Guide des Scénarios

## ✅ Fonctionnalité Implémentée : Scénario "A People Numerous and Armed"

Le système de scénarios est maintenant intégré dans l'interface web et disponible via l'interface Python.

### 🚀 Comment utiliser le scénario sur l'interface web

#### 1. Démarrer les serveurs

```bash
# Terminal 1 : Serveur web principal
python3 start_web_interface.py --port 3000

# Terminal 2 : Serveur API pour les scénarios
python3 api_server.py
```

#### 2. Accéder à l'interface

1. Ouvrez votre navigateur à l'adresse : **http://localhost:3000/web/game-board.html**
2. Dans la section "Contrôles" en haut de la page, vous verrez maintenant :
   - Un menu déroulant "Scénario" avec l'option **"A People Numerous and Armed"**
   - Un bouton **"📥 Charger Scénario"**

#### 3. Charger le scénario

1. Sélectionnez **"A People Numerous and Armed"** dans le menu déroulant
2. Cliquez sur **"📥 Charger Scénario"**
3. L'interface chargera automatiquement :
   - **92 unités** réparties sur **20 territoires**
   - **Ressources des factions** : British: 6, Patriots: 3, French: 8, Indians: 2
   - **Marqueurs de victoire** : Support: 17, Opposition: 16, Pertes britanniques: 10, Pertes rebelles: 12
   - **Contrôle territorial** : British contrôle 8 territoires, Patriots contrôlent 9 territoires

### 📊 Contenu du Scénario "A People Numerous and Armed"

#### Unités Déployées (92 total) :
- **Patriots** : 28 unités
  - 10 Continentals
  - 14 Militia
  - 4 Forts
- **British** : 39 unités
  - 19 Regulars
  - 17 Tories
  - 3 Forts
- **French** : 11 unités
  - 8 Regulars
  - 3 Squadrons
- **Indians** : 14 unités
  - 8 War Parties
  - 6 Villages

#### Territoires Contrôlés :
**British (8 territoires) :**
- Florida, New Hampshire, New York, New York City
- Philadelphia, Quebec, Quebec City, Savannah

**Patriots (9 territoires) :**
- Boston, Charles Town, Connecticut-RI, Massachusetts
- New Jersey, Norfolk, North Carolina, Pennsylvania, West Indies

### 🔧 Interface Python (Alternative)

Si vous préférez l'interface en ligne de commande :

```bash
# Configuration interactive complète
python3 scenario_main.py

# Test simple
python3 test_scenario_setup.py
```

### 🐛 Dépannage

**Si le bouton "Charger Scénario" ne fonctionne pas :**

1. Vérifiez que l'API est démarrée :
   ```bash
   curl http://localhost:3001/api/health
   ```

2. Vérifiez la console du navigateur (F12) pour les erreurs

3. Assurez-vous que les deux serveurs fonctionnent :
   - Serveur web : http://localhost:3000
   - Serveur API : http://localhost:3001

**Erreur "Failed to fetch" :**
- Le serveur API n'est pas démarré
- Conflit de ports (essayez de redémarrer l'API)

### 🔮 Scénarios Futurs

Actuellement disponible :
- ✅ **A People Numerous and Armed** (complet)

En développement :
- ⏳ **British Return to New York**
- ⏳ **The Southern Campaign**

### 📝 Notes Techniques

- Les données du scénario sont générées côté Python et servies via une API REST
- L'interface web communique avec l'API pour charger les configurations
- Le système est extensible pour ajouter facilement de nouveaux scénarios
- Les données sont appliquées dynamiquement sans rechargement de page

---

**🎯 Testez maintenant !** Allez sur http://localhost:3000/web/game-board.html et chargez le scénario "A People Numerous and Armed" pour voir votre setup en action !