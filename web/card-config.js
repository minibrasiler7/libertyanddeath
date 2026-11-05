class CardConfigurator {
    constructor() {
        this.cardDatabase = {}; // Base de données des cartes disponibles
        this.cardConfigs = {}; // Configurations des cartes
        this.currentCard = null; // Carte actuellement sélectionnée
        this.currentCardType = 'normal'; // Type de carte sélectionné
        
        this.init();
        this.loadCards();
    }

    init() {
        // Event listeners pour les contrôles principaux
        document.getElementById('save-config').addEventListener('click', () => this.saveConfig());
        document.getElementById('load-config').addEventListener('click', () => this.loadConfig());
        document.getElementById('export-config').addEventListener('click', () => this.exportConfig());
        document.getElementById('clear-card').addEventListener('click', () => this.clearCurrentCard());
        document.getElementById('mark-winter').addEventListener('click', () => this.markAsWinter());

        // Event listeners pour les sélecteurs de type de carte
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.setCardType(type);
            });
        });

        // Event listeners pour les sélecteurs de faction
        document.querySelectorAll('.faction-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateTurnConfig();
            });
        });

        // Event listeners pour les checkboxes de sabre
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.updateTurnConfig();
            });
        });

        // Event listener pour la recherche de cartes
        document.getElementById('card-search').addEventListener('input', (e) => {
            this.searchCard(e.target.value);
        });

        // Event listener pour le filtrage de cartes
        document.getElementById('filter-cards').addEventListener('input', (e) => {
            this.filterCards(e.target.value);
        });

        // Event listener pour le chargement de fichier
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileLoad(e);
        });
    }

    async loadCards() {
        try {
            // Charger la liste des cartes depuis le fichier cards.json
            const response = await fetch('cards.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this.cardDatabase = await response.json();
            console.log('📚 Cards loaded:', Object.keys(this.cardDatabase).length);
        } catch (error) {
            console.warn('⚠️ Could not load cards.json, using fallback list');
            // Liste de fallback avec des cartes exemple
            this.cardDatabase = this.getFallbackCards();
        }

        this.populateCardList();
        this.updateStatistics();
    }

    getFallbackCards() {
        // Liste de cartes exemple pour tester l'interface
        const fallbackCards = {};
        const cardNames = [
            "1775 - The Shot Heard 'Round the World",
            "Albany Congress",
            "Benedict Arnold - Treason!",
            "Bonhomme Richard vs. Serapis",
            "Boston Massacre", 
            "Boston Tea Party",
            "Campaign Season",
            "Declaration of Independence",
            "French Alliance",
            "Intolerable Acts",
            "Lafayette",
            "Lexington and Concord",
            "Lord North's Government Falls",
            "Mobilization",
            "Monmouth Courthouse",
            "Saratoga Campaign",
            "The Hard Winter at Valley Forge",
            "Treaty of Paris",
            "Washington Assumes Command",
            "Yorktown Campaign"
        ];

        cardNames.forEach((name, index) => {
            fallbackCards[name] = {
                name: name,
                id: index + 1,
                description: `Carte exemple: ${name}`,
                image: `card_${index + 1}.jpg`
            };
        });

        return fallbackCards;
    }

    populateCardList() {
        const cardList = document.getElementById('card-list');
        cardList.innerHTML = '';

        Object.values(this.cardDatabase).forEach(card => {
            const cardItem = document.createElement('div');
            cardItem.className = 'card-item';
            cardItem.dataset.cardName = card.name;
            
            const config = this.cardConfigs[card.name];
            let statusClass = 'status-unconfigured';
            let statusText = 'Non configurée';
            
            if (config) {
                if (config.type === 'winter') {
                    statusClass = 'status-winter';
                    statusText = 'Carte Winter';
                } else if (config.turns && config.turns.length === 4) {
                    statusClass = 'status-configured';
                    statusText = 'Configurée';
                }
            }

            cardItem.innerHTML = `
                <div><strong>${card.name}</strong></div>
                <div class="card-status ${statusClass}">${statusText}</div>
            `;

            cardItem.addEventListener('click', () => {
                this.selectCard(card.name);
            });

            cardList.appendChild(cardItem);
        });
    }

    filterCards(filter) {
        const cardItems = document.querySelectorAll('.card-item');
        const filterLower = filter.toLowerCase();

        cardItems.forEach(item => {
            const cardName = item.dataset.cardName.toLowerCase();
            const shouldShow = cardName.includes(filterLower);
            item.style.display = shouldShow ? 'block' : 'none';
        });
    }

    searchCard(searchTerm) {
        const cardItems = document.querySelectorAll('.card-item');
        
        // Retirer la sélection précédente
        cardItems.forEach(item => item.classList.remove('selected'));

        if (!searchTerm) return;

        const searchLower = searchTerm.toLowerCase();
        
        // Chercher la première carte qui correspond
        for (const item of cardItems) {
            const cardName = item.dataset.cardName.toLowerCase();
            if (cardName.includes(searchLower)) {
                this.selectCard(item.dataset.cardName);
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            }
        }
    }

    selectCard(cardName) {
        // Mettre à jour la sélection visuelle
        document.querySelectorAll('.card-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = document.querySelector(`[data-card-name="${cardName}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        this.currentCard = cardName;
        console.log(`🎴 Selected card: ${cardName}`);

        // Afficher l'aperçu de la carte
        this.showCardPreview(cardName);

        // Charger la configuration de cette carte
        this.loadCardConfig(cardName);
    }

    loadCardConfig(cardName) {
        const config = this.cardConfigs[cardName];
        
        if (config) {
            // Charger le type de carte
            this.setCardType(config.type || 'normal');
            
            if (config.type === 'normal' && config.turns) {
                // Charger la configuration des tours
                config.turns.forEach((turn, index) => {
                    const turnNumber = index + 1;
                    const factionSelect = document.querySelector(`[data-turn="${turnNumber}"]`);
                    const sabreCheckbox = document.querySelector(`#sabre-${turnNumber}`);
                    const rifleCheckbox = document.querySelector(`#rifle-${turnNumber}`);
                    
                    if (factionSelect) {
                        factionSelect.value = turn.faction || '';
                    }
                    if (sabreCheckbox) {
                        sabreCheckbox.checked = turn.sabre || false;
                    }
                    if (rifleCheckbox) {
                        rifleCheckbox.checked = turn.rifle || false;
                    }
                });
            }
        } else {
            // Réinitialiser l'interface pour une nouvelle carte
            this.setCardType('normal');
            this.clearTurnConfig();
        }
    }

    setCardType(type) {
        this.currentCardType = type;
        
        // Mettre à jour les boutons de type
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // Afficher/masquer les éditeurs appropriés
        document.querySelectorAll('.turn-editor').forEach(editor => {
            editor.classList.remove('active');
        });
        document.querySelectorAll('.winter-message').forEach(msg => {
            msg.classList.remove('active');
        });

        if (type === 'normal') {
            document.getElementById('normal-editor').classList.add('active');
        } else {
            document.getElementById('winter-editor').classList.add('active');
        }

        // Sauvegarder automatiquement le type
        if (this.currentCard) {
            this.updateCardConfig();
        }
    }

    clearTurnConfig() {
        // Réinitialiser tous les sélecteurs de faction
        document.querySelectorAll('.faction-select').forEach(select => {
            select.value = '';
        });

        // Décocher toutes les checkboxes (sabre et rifle)
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    updateTurnConfig() {
        if (!this.currentCard) return;
        this.updateCardConfig();
    }

    updateCardConfig() {
        if (!this.currentCard) return;

        const config = {
            type: this.currentCardType,
            configuredAt: new Date().toISOString()
        };

        if (this.currentCardType === 'normal') {
            config.turns = [];
            
            for (let i = 1; i <= 4; i++) {
                const factionSelect = document.querySelector(`[data-turn="${i}"]`);
                const sabreCheckbox = document.querySelector(`#sabre-${i}`);
                const rifleCheckbox = document.querySelector(`#rifle-${i}`);
                
                config.turns.push({
                    turn: i,
                    faction: factionSelect ? factionSelect.value : '',
                    sabre: sabreCheckbox ? sabreCheckbox.checked : false,
                    rifle: rifleCheckbox ? rifleCheckbox.checked : false
                });
            }
        }

        this.cardConfigs[this.currentCard] = config;
        console.log(`💾 Updated config for ${this.currentCard}:`, config);

        // Mettre à jour l'affichage de la liste
        this.updateCardListDisplay();
        this.updateStatistics();
    }

    updateCardListDisplay() {
        // Mettre à jour le statut de la carte dans la liste
        const cardItem = document.querySelector(`[data-card-name="${this.currentCard}"]`);
        if (!cardItem) return;

        const config = this.cardConfigs[this.currentCard];
        const statusElement = cardItem.querySelector('.card-status');
        
        if (config) {
            if (config.type === 'winter') {
                statusElement.className = 'card-status status-winter';
                statusElement.textContent = 'Carte Winter';
            } else if (config.turns && config.turns.every(turn => turn.faction)) {
                statusElement.className = 'card-status status-configured';
                statusElement.textContent = 'Configurée';
            } else {
                statusElement.className = 'card-status status-unconfigured';
                statusElement.textContent = 'Incomplète';
            }
        }
    }

    updateStatistics() {
        const totalCards = Object.keys(this.cardDatabase).length;
        const configuredCards = Object.values(this.cardConfigs).filter(config => 
            config.type === 'winter' || (config.turns && config.turns.every(turn => turn.faction))
        ).length;
        const winterCards = Object.values(this.cardConfigs).filter(config => 
            config.type === 'winter'
        ).length;

        document.getElementById('total-count').textContent = totalCards;
        document.getElementById('configured-count').textContent = configuredCards;
        document.getElementById('winter-count').textContent = winterCards;
    }

    clearCurrentCard() {
        if (!this.currentCard) {
            alert('Aucune carte sélectionnée');
            return;
        }

        if (confirm(`Effacer la configuration de "${this.currentCard}" ?`)) {
            delete this.cardConfigs[this.currentCard];
            this.clearTurnConfig();
            this.updateCardListDisplay();
            this.updateStatistics();
            console.log(`🗑️ Cleared config for ${this.currentCard}`);
        }
    }

    markAsWinter() {
        if (!this.currentCard) {
            alert('Aucune carte sélectionnée');
            return;
        }

        this.setCardType('winter');
        console.log(`❄️ Marked ${this.currentCard} as Winter card`);
    }

    saveConfig() {
        const configData = {
            version: "1.0",
            createdAt: new Date().toISOString(),
            totalCards: Object.keys(this.cardDatabase).length,
            configuredCards: Object.keys(this.cardConfigs).length,
            cardConfigs: this.cardConfigs
        };

        const jsonString = JSON.stringify(configData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `card-configs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('💾 Configuration saved');
        alert(`Configuration sauvegardée !\n${Object.keys(this.cardConfigs).length} cartes configurées`);
    }

    loadConfig() {
        document.getElementById('file-input').click();
    }

    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const configData = JSON.parse(e.target.result);
                
                if (configData.cardConfigs) {
                    this.cardConfigs = configData.cardConfigs;
                    console.log('📁 Configuration loaded:', Object.keys(this.cardConfigs).length, 'cards');
                    
                    // Recharger l'affichage
                    this.populateCardList();
                    this.updateStatistics();
                    
                    // Recharger la carte actuelle si elle existe
                    if (this.currentCard && this.cardConfigs[this.currentCard]) {
                        this.loadCardConfig(this.currentCard);
                    }

                    alert(`Configuration chargée !\n${Object.keys(this.cardConfigs).length} cartes configurées`);
                } else {
                    throw new Error('Format de fichier invalide');
                }
            } catch (error) {
                console.error('❌ Error loading config:', error);
                alert('Erreur lors du chargement du fichier de configuration');
            }
        };
        reader.readAsText(file);
        
        // Reset the input
        event.target.value = '';
    }

    exportConfig() {
        // Créer un résumé de la configuration
        const summary = {
            metadata: {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                totalCards: Object.keys(this.cardDatabase).length,
                configuredCards: Object.keys(this.cardConfigs).length
            },
            configurations: this.cardConfigs,
            statistics: {
                normalCards: Object.values(this.cardConfigs).filter(c => c.type !== 'winter').length,
                winterCards: Object.values(this.cardConfigs).filter(c => c.type === 'winter').length,
                cardsWithSabre: Object.values(this.cardConfigs).filter(c => 
                    c.turns && c.turns.some(t => t.sabre)
                ).length
            }
        };

        const jsonString = JSON.stringify(summary, null, 2);
        
        // Copier dans le presse-papiers si possible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(jsonString).then(() => {
                alert('Configuration copiée dans le presse-papiers !');
            });
        } else {
            // Fallback: afficher dans une fenêtre
            const popup = window.open('', '_blank');
            popup.document.write(`
                <html>
                <head><title>Configuration des Cartes - Export JSON</title></head>
                <body>
                    <h2>Configuration des Cartes - Export JSON</h2>
                    <p>Copiez le contenu ci-dessous :</p>
                    <textarea style="width: 100%; height: 80vh; font-family: monospace;">${jsonString}</textarea>
                </body>
                </html>
            `);
        }

        console.log('📋 Configuration exported');
    }

    showCardPreview(cardName) {
        const card = this.cardDatabase[cardName];
        if (!card) {
            this.hideCardPreview();
            return;
        }

        // Masquer le message "aucune carte sélectionnée"
        document.getElementById('no-card-message').style.display = 'none';

        // Afficher les informations de la carte
        document.getElementById('card-name').textContent = card.name;
        document.getElementById('card-id').textContent = card.id;
        document.getElementById('card-description').textContent = card.description || 'Aucune description disponible';
        document.getElementById('card-info').style.display = 'block';

        // Tenter de charger l'image de la carte
        const cardImage = document.getElementById('card-image');
        const cardPlaceholder = document.getElementById('card-placeholder');
        
        // Essayer différentes stratégies d'encodage
        const imagePaths = [
            `../Images/Cartes/${card.image}`, // Chemin relatif correct
            `../Images/Cartes/${card.image.replace(/ /g, '%20')}`, // Chemin relatif + espaces
            `/Images/Cartes/${card.image}`, // Chemin absolu
            `/Images/Cartes/${card.image.replace(/ /g, '%20')}`, // Chemin absolu + espaces
            `Images/Cartes/${card.image}`, // Chemin direct
            `Images/Cartes/${card.image.replace(/ /g, '%20')}`, // Juste les espaces
            `Images/Cartes/${encodeURIComponent(card.image)}`, // Encodage complet
        ];
        
        console.log(`🖼️ Attempting to load card image for: ${card.image}`);
        console.log(`🖼️ Will try paths:`, imagePaths);
        
        this.tryLoadImagePaths(imagePaths, cardImage, cardPlaceholder);
    }

    tryLoadImagePaths(paths, cardImage, cardPlaceholder) {
        let currentIndex = 0;
        
        const tryNextPath = () => {
            if (currentIndex >= paths.length) {
                console.error(`❌ Failed to load image with any encoding strategy`);
                // Afficher le placeholder si aucun chemin ne fonctionne
                cardImage.style.display = 'none';
                cardPlaceholder.style.display = 'block';
                return;
            }
            
            const currentPath = paths[currentIndex];
            console.log(`🔄 Trying path ${currentIndex + 1}/${paths.length}: ${currentPath}`);
            
            const testImage = new Image();
            testImage.onload = () => {
                console.log(`✅ Successfully loaded image with path: ${currentPath}`);
                cardImage.src = currentPath;
                cardImage.style.display = 'block';
                cardPlaceholder.style.display = 'none';
            };
            
            testImage.onerror = () => {
                console.log(`❌ Failed to load image with path: ${currentPath}`);
                currentIndex++;
                tryNextPath();
            };
            
            testImage.src = currentPath;
        };
        
        tryNextPath();
    }

    hideCardPreview() {
        document.getElementById('no-card-message').style.display = 'block';
        document.getElementById('card-image').style.display = 'none';
        document.getElementById('card-placeholder').style.display = 'none';
        document.getElementById('card-info').style.display = 'none';
    }
}

// Initialiser l'application quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    new CardConfigurator();
});