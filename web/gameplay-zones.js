class GameplayZoneSelector {
    constructor() {
        this.canvas = document.getElementById('gameplay-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.mapImage = new Image();
        
        // État de l'application
        this.gameplayZones = {
            unavailable_forces: {}, // { "british": {...}, "french": {...} }
            casualties: { "casualties": null },  // Zone unique pour toutes les unités mortes
            game_sequence: {}       // { "1": {...}, "2": {...}, ..., "10": {...} }
        };
        
        this.currentZoneType = 'unavailable_forces';
        this.currentFaction = 'british';
        this.currentSequence = '1';
        
        this.isSelecting = false;
        this.startPos = { x: 0, y: 0 };
        this.currentRect = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadMapImage();
        this.updateProgress();
        this.updateCurrentInfo();
    }
    
    setupEventListeners() {
        // Sélection du type de zone
        document.querySelectorAll('.zone-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.zone-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentZoneType = e.target.getAttribute('data-type');
                this.updateControlVisibility();
                this.updateCurrentInfo();
                this.redrawCanvas();
                this.updateZoneDetails();
            });
        });
        
        // Sélection de faction
        document.getElementById('faction-select').addEventListener('change', (e) => {
            this.currentFaction = e.target.value;
            this.updateCurrentInfo();
            this.redrawCanvas();
            this.updateZoneDetails();
        });
        
        // Sélection de séquence
        document.getElementById('sequence-select').addEventListener('change', (e) => {
            this.currentSequence = e.target.value;
            this.updateCurrentInfo();
            this.redrawCanvas();
            this.updateZoneDetails();
        });
        
        // Boutons d'action
        document.getElementById('clear-zone').addEventListener('click', () => this.clearCurrentZone());
        document.getElementById('save-gameplay').addEventListener('click', () => this.saveGameplay());
        document.getElementById('load-gameplay').addEventListener('click', () => this.loadGameplay());
        
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.startSelection(e));
        this.canvas.addEventListener('mousemove', (e) => this.updateSelection(e));
        this.canvas.addEventListener('mouseup', (e) => this.endSelection(e));
        
        // Charger fichier
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileLoad(e));
    }
    
    updateControlVisibility() {
        const factionSelector = document.getElementById('faction-selector');
        const sequenceSelector = document.getElementById('sequence-selector');
        
        // Masquer tous
        factionSelector.style.display = 'none';
        sequenceSelector.style.display = 'none';
        
        // Afficher selon le type
        switch(this.currentZoneType) {
            case 'unavailable_forces':
                factionSelector.style.display = 'block';
                break;
            case 'casualties':
                // Pas de sélecteur supplémentaire - zone unique
                break;
            case 'game_sequence':
                sequenceSelector.style.display = 'block';
                break;
        }
    }
    
    getCurrentKey() {
        switch(this.currentZoneType) {
            case 'unavailable_forces':
                return this.currentFaction;
            case 'casualties':
                return 'casualties';
            case 'game_sequence':
                return this.currentSequence;
            default:
                return 'unknown';
        }
    }
    
    loadMapImage() {
        this.mapImage.onload = () => {
            this.canvas.width = this.mapImage.width;
            this.canvas.height = this.mapImage.height;
            this.redrawCanvas();
        };
        
        this.mapImage.onerror = () => {
            console.error('Impossible de charger l\'image de la carte');
            this.canvas.width = 1200;
            this.canvas.height = 800;
            this.drawPlaceholderMap();
        };
        
        this.mapImage.src = 'map.jpg';
    }
    
    drawPlaceholderMap() {
        this.ctx.fillStyle = '#fff5f5';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Liberty and Death - Zones de Gameplay', this.canvas.width/2, 100);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('(Forces, casualties, séquence de jeu)', this.canvas.width/2, 130);
    }
    
    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    startSelection(e) {
        this.isSelecting = true;
        this.startPos = this.getCanvasCoordinates(e);
        this.canvas.style.cursor = 'crosshair';
    }
    
    updateSelection(e) {
        if (!this.isSelecting) return;
        
        const currentPos = this.getCanvasCoordinates(e);
        this.currentRect = {
            x1: Math.min(this.startPos.x, currentPos.x),
            y1: Math.min(this.startPos.y, currentPos.y),
            x2: Math.max(this.startPos.x, currentPos.x),
            y2: Math.max(this.startPos.y, currentPos.y)
        };
        
        this.redrawCanvas();
        this.updateZoneDetails();
    }
    
    endSelection(e) {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        this.canvas.style.cursor = 'crosshair';
        
        if (this.currentRect) {
            // Sauvegarder la zone
            const currentKey = this.getCurrentKey();
            
            this.gameplayZones[this.currentZoneType][currentKey] = {
                x1: Math.round(this.currentRect.x1),
                y1: Math.round(this.currentRect.y1),
                x2: Math.round(this.currentRect.x2),
                y2: Math.round(this.currentRect.y2)
            };
            
            this.updateProgress();
            this.updateZoneDetails();
            console.log(`Zone ${this.currentZoneType}[${currentKey}] définie:`, 
                       this.gameplayZones[this.currentZoneType][currentKey]);
        }
        
        this.currentRect = null;
    }
    
    redrawCanvas() {
        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dessiner l'image de la carte
        if (this.mapImage.complete && this.mapImage.naturalHeight !== 0) {
            this.ctx.drawImage(this.mapImage, 0, 0);
        } else {
            this.drawPlaceholderMap();
        }
        
        // Dessiner toutes les zones définies
        this.drawDefinedZones();
        
        // Dessiner la sélection en cours
        if (this.currentRect) {
            this.drawCurrentSelection();
        }
    }
    
    drawDefinedZones() {
        const colors = {
            unavailable_forces: '#6c757d',
            casualties: '#dc3545',
            game_sequence: '#17a2b8'
        };
        
        Object.entries(this.gameplayZones).forEach(([zoneType, zones]) => {
            const color = colors[zoneType];
            
            Object.entries(zones).forEach(([key, coords]) => {
                if (!coords) return; // Skip null values
                
                const isCurrent = (zoneType === this.currentZoneType && key === this.getCurrentKey());
                
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = isCurrent ? 3 : 2;
                this.ctx.setLineDash(isCurrent ? [] : [5, 5]);
                
                // Dessiner le rectangle
                this.ctx.strokeRect(
                    coords.x1, coords.y1,
                    coords.x2 - coords.x1, coords.y2 - coords.y1
                );
                
                // Ajouter un label
                this.ctx.fillStyle = color;
                this.ctx.font = '10px Arial';
                let label = `${zoneType}-${key}`;
                if (zoneType === 'game_sequence') {
                    label = `Seq-${key}`;
                }
                this.ctx.fillText(label, coords.x1 + 2, coords.y1 - 2);
            });
        });
        
        // Reset line dash
        this.ctx.setLineDash([]);
    }
    
    drawCurrentSelection() {
        const colors = {
            unavailable_forces: '#6c757d',
            casualties: '#dc3545',
            game_sequence: '#17a2b8'
        };
        
        this.ctx.strokeStyle = colors[this.currentZoneType];
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 0.7;
        
        this.ctx.strokeRect(
            this.currentRect.x1, this.currentRect.y1,
            this.currentRect.x2 - this.currentRect.x1,
            this.currentRect.y2 - this.currentRect.y1
        );
        
        // Zone semi-transparente
        this.ctx.fillStyle = colors[this.currentZoneType];
        this.ctx.globalAlpha = 0.2;
        this.ctx.fillRect(
            this.currentRect.x1, this.currentRect.y1,
            this.currentRect.x2 - this.currentRect.x1,
            this.currentRect.y2 - this.currentRect.y1
        );
        
        this.ctx.globalAlpha = 1;
    }
    
    updateCurrentInfo() {
        const typeLabels = {
            unavailable_forces: '⚫ Forces Non Disponibles',
            casualties: '💀 Casualties',
            game_sequence: '🎯 Séquence de Jeu'
        };
        
        const factionLabels = {
            british: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 British',
            french: '🇫🇷 French'
        };
        
        document.getElementById('current-type').textContent = typeLabels[this.currentZoneType];
        
        let elementText = '';
        switch(this.currentZoneType) {
            case 'unavailable_forces':
                elementText = factionLabels[this.currentFaction];
                break;
            case 'casualties':
                elementText = 'Toutes les unités mortes';
                break;
            case 'game_sequence':
                const sequenceOption = document.querySelector(`#sequence-select option[value="${this.currentSequence}"]`);
                elementText = sequenceOption ? sequenceOption.textContent : `Étape ${this.currentSequence}`;
                break;
        }
        
        document.getElementById('current-element').textContent = elementText;
    }
    
    updateZoneDetails() {
        const detailsEl = document.getElementById('zone-details');
        const currentKey = this.getCurrentKey();
        
        if (this.gameplayZones[this.currentZoneType][currentKey]) {
            const coords = this.gameplayZones[this.currentZoneType][currentKey];
            detailsEl.innerHTML = `
                <strong>${this.currentZoneType}[${currentKey}]:</strong><br>
                x1: ${coords.x1}, y1: ${coords.y1}<br>
                x2: ${coords.x2}, y2: ${coords.y2}<br>
                Taille: ${coords.x2 - coords.x1} × ${coords.y2 - coords.y1}
            `;
        } else if (this.currentRect) {
            detailsEl.innerHTML = `
                <strong>Sélection en cours:</strong><br>
                x1: ${Math.round(this.currentRect.x1)}, y1: ${Math.round(this.currentRect.y1)}<br>
                x2: ${Math.round(this.currentRect.x2)}, y2: ${Math.round(this.currentRect.y2)}<br>
                Taille: ${Math.round(this.currentRect.x2 - this.currentRect.x1)} × ${Math.round(this.currentRect.y2 - this.currentRect.y1)}
            `;
        } else {
            detailsEl.innerHTML = '<em>Cliquez et glissez pour sélectionner une zone</em>';
        }
    }
    
    updateProgress() {
        const progressContainer = document.getElementById('progress-container');
        
        const categories = [
            {
                title: '⚫ Forces Non Disponibles',
                type: 'unavailable_forces',
                items: ['british', 'french'],
                color: '#6c757d',
                labels: {'british': 'British', 'french': 'French'}
            },
            {
                title: '💀 Casualties (Zone Unique)',
                type: 'casualties',
                items: ['casualties'],
                color: '#dc3545',
                labels: {'casualties': 'All'}
            },
            {
                title: '🎯 Séquence de Jeu (1-10)',
                type: 'game_sequence',
                items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
                color: '#17a2b8',
                labels: {}
            }
        ];
        
        let html = '';
        
        categories.forEach(category => {
            const zones = this.gameplayZones[category.type] || {};
            const completedCount = Object.keys(zones).filter(key => zones[key]).length;
            const totalCount = category.items.length;
            
            html += `
                <div class="category-progress">
                    <div class="category-title">${category.title} (${completedCount}/${totalCount})</div>
            `;
            
            if (category.type === 'game_sequence') {
                html += '<div class="sequence-grid">';
            } else {
                html += '<div class="other-grid">';
            }
            
            category.items.forEach(item => {
                const isComplete = (zones[item] && zones[item] !== null) ? 'complete' : 'empty';
                const isCurrent = (category.type === this.currentZoneType && item === this.getCurrentKey()) ? 'current' : '';
                const cssClass = category.type === 'game_sequence' ? 'sequence' : '';
                const label = category.labels[item] || item;
                
                html += `
                    <div class="progress-box ${cssClass} ${isComplete} ${isCurrent}" 
                         onclick="selectGameplayItem('${category.type}', '${item}')"
                         title="${category.title} - ${label}">
                        ${label}
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        progressContainer.innerHTML = html;
    }
    
    clearCurrentZone() {
        const currentKey = this.getCurrentKey();
        
        if (this.gameplayZones[this.currentZoneType][currentKey]) {
            delete this.gameplayZones[this.currentZoneType][currentKey];
            
            this.updateProgress();
            this.updateZoneDetails();
            this.redrawCanvas();
            
            console.log(`Zone ${this.currentZoneType}[${currentKey}] effacée`);
        }
    }
    
    saveGameplay() {
        const dataStr = JSON.stringify(this.gameplayZones, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'gameplay_zones.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('Zones de gameplay sauvegardées:', this.gameplayZones);
    }
    
    loadGameplay() {
        document.getElementById('file-input').click();
    }
    
    handleFileLoad(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedZones = JSON.parse(e.target.result);
                this.gameplayZones = loadedZones;
                this.updateProgress();
                this.updateZoneDetails();
                this.redrawCanvas();
                console.log('Zones de gameplay chargées:', this.gameplayZones);
            } catch (error) {
                alert('Erreur lors du chargement du fichier: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Fonctions globales
function selectGameplayItem(zoneType, item) {
    const selector = window.gameplaySelector;
    if (!selector) return;
    
    // Changer le type de zone
    document.querySelectorAll('.zone-type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-type="${zoneType}"]`).classList.add('active');
    
    selector.currentZoneType = zoneType;
    selector.updateControlVisibility();
    
    // Changer l'élément sélectionné
    switch(zoneType) {
        case 'unavailable_forces':
            document.getElementById('faction-select').value = item;
            selector.currentFaction = item;
            break;
        case 'casualties':
            // Pas de sélection spécifique - zone unique
            break;
        case 'game_sequence':
            document.getElementById('sequence-select').value = item;
            selector.currentSequence = item;
            break;
    }
    
    selector.updateCurrentInfo();
    selector.redrawCanvas();
    selector.updateZoneDetails();
}

// Initialiser l'application quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    window.gameplaySelector = new GameplayZoneSelector();
});