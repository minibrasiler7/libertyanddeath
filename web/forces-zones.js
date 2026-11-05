class ForcesZoneSelector {
    constructor() {
        this.canvas = document.getElementById('forces-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.mapImage = new Image();
        
        // État de l'application
        this.forcesZones = {
            faction_forces: {}, // { "patriots": {...}, "british": {...}, etc. }
            british_forts: {},  // { "0": {...}, "1": {...}, ..., "6": {...} }
            patriot_forts: {},  // { "0": {...}, "1": {...}, ..., "6": {...} }
            indian_villages: {},// { "0": {...}, "1": {...}, ..., "12": {...} }
            french_fni: {},     // { "0": {...}, "1": {...}, "2": {...}, "3": {...} }
            french_ships: {}    // { "ship1": {...}, "ship2": {...}, "ship3": {...} }
        };
        
        this.currentForceType = 'faction_forces';
        this.currentFaction = 'patriots';
        this.currentNumber = 0;
        this.currentShip = 'ship1';
        
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
        // Sélection du type de force
        document.querySelectorAll('.force-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.force-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentForceType = e.target.getAttribute('data-type');
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
        
        // Sélection de numéro
        document.getElementById('number-input').addEventListener('change', (e) => {
            this.currentNumber = parseInt(e.target.value);
            this.updateCurrentInfo();
            this.redrawCanvas();
            this.updateZoneDetails();
        });
        
        // Sélection de bateau
        document.getElementById('ship-select').addEventListener('change', (e) => {
            this.currentShip = e.target.value;
            this.updateCurrentInfo();
            this.redrawCanvas();
            this.updateZoneDetails();
        });
        
        // Boutons d'action
        document.getElementById('clear-zone').addEventListener('click', () => this.clearCurrentZone());
        document.getElementById('save-forces').addEventListener('click', () => this.saveForces());
        document.getElementById('load-forces').addEventListener('click', () => this.loadForces());
        
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.startSelection(e));
        this.canvas.addEventListener('mousemove', (e) => this.updateSelection(e));
        this.canvas.addEventListener('mouseup', (e) => this.endSelection(e));
        
        // Charger fichier
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileLoad(e));
    }
    
    updateControlVisibility() {
        const factionSelector = document.getElementById('faction-selector');
        const numberSelector = document.getElementById('number-selector');
        const shipSelector = document.getElementById('ship-selector');
        const numberInput = document.getElementById('number-input');
        
        // Masquer tous
        factionSelector.style.display = 'none';
        numberSelector.style.display = 'none';
        shipSelector.style.display = 'none';
        
        // Afficher selon le type
        switch(this.currentForceType) {
            case 'faction_forces':
                factionSelector.style.display = 'block';
                break;
            case 'british_forts':
                numberSelector.style.display = 'block';
                numberInput.max = 6;
                numberInput.value = Math.min(this.currentNumber, 6);
                this.currentNumber = Math.min(this.currentNumber, 6);
                break;
            case 'patriot_forts':
                numberSelector.style.display = 'block';
                numberInput.max = 6;
                numberInput.value = Math.min(this.currentNumber, 6);
                this.currentNumber = Math.min(this.currentNumber, 6);
                break;
            case 'indian_villages':
                numberSelector.style.display = 'block';
                numberInput.max = 12;
                break;
            case 'french_fni':
                numberSelector.style.display = 'block';
                numberInput.max = 3;
                numberInput.value = Math.min(this.currentNumber, 3);
                this.currentNumber = Math.min(this.currentNumber, 3);
                break;
            case 'french_ships':
                shipSelector.style.display = 'block';
                break;
        }
    }
    
    getCurrentKey() {
        switch(this.currentForceType) {
            case 'faction_forces':
                return this.currentFaction;
            case 'british_forts':
            case 'patriot_forts':
            case 'indian_villages':
            case 'french_fni':
                return this.currentNumber.toString();
            case 'french_ships':
                return this.currentShip;
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
        this.ctx.fillStyle = '#f0f8ff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Liberty and Death - Zones des Forces', this.canvas.width/2, 100);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('(Définition des forces disponibles)', this.canvas.width/2, 130);
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
            
            this.forcesZones[this.currentForceType][currentKey] = {
                x1: Math.round(this.currentRect.x1),
                y1: Math.round(this.currentRect.y1),
                x2: Math.round(this.currentRect.x2),
                y2: Math.round(this.currentRect.y2)
            };
            
            this.updateProgress();
            this.updateZoneDetails();
            console.log(`Zone ${this.currentForceType}[${currentKey}] définie:`, 
                       this.forcesZones[this.currentForceType][currentKey]);
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
            faction_forces: '#17a2b8',
            british_forts: '#dc3545',
            patriot_forts: '#007bff',
            indian_villages: '#fd7e14',
            french_fni: '#6610f2',
            french_ships: '#20c997'
        };
        
        Object.entries(this.forcesZones).forEach(([forceType, zones]) => {
            const color = colors[forceType];
            
            Object.entries(zones).forEach(([key, coords]) => {
                const isCurrent = (forceType === this.currentForceType && key === this.getCurrentKey());
                
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
                this.ctx.fillText(
                    `${forceType}-${key}`,
                    coords.x1 + 2, coords.y1 - 2
                );
            });
        });
        
        // Reset line dash
        this.ctx.setLineDash([]);
    }
    
    drawCurrentSelection() {
        const colors = {
            faction_forces: '#17a2b8',
            british_forts: '#dc3545',
            patriot_forts: '#007bff',
            indian_villages: '#fd7e14',
            french_fni: '#6610f2',
            french_ships: '#20c997'
        };
        
        this.ctx.strokeStyle = colors[this.currentForceType];
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 0.7;
        
        this.ctx.strokeRect(
            this.currentRect.x1, this.currentRect.y1,
            this.currentRect.x2 - this.currentRect.x1,
            this.currentRect.y2 - this.currentRect.y1
        );
        
        // Zone semi-transparente
        this.ctx.fillStyle = colors[this.currentForceType];
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
            faction_forces: '🏛️ Forces par Faction',
            british_forts: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Forts Britanniques',
            patriot_forts: '🇺🇸 Forts Patriots',
            indian_villages: '🏕️ Villages Indiens',
            french_fni: '🇫🇷 FNI Français',
            french_ships: '⚓ Bateaux Français'
        };
        
        const factionLabels = {
            patriots: '🇺🇸 Patriots',
            british: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 British',
            french: '🇫🇷 French',
            indians: '🏕️ Indians'
        };
        
        const shipLabels = {
            ship1: 'Bateau 1',
            ship2: 'Bateau 2',
            ship3: 'Bateau 3'
        };
        
        document.getElementById('current-type').textContent = typeLabels[this.currentForceType];
        
        let elementText = '';
        switch(this.currentForceType) {
            case 'faction_forces':
                elementText = factionLabels[this.currentFaction];
                break;
            case 'british_forts':
            case 'patriot_forts':
            case 'indian_villages':
            case 'french_fni':
                elementText = `Numéro ${this.currentNumber}`;
                break;
            case 'french_ships':
                elementText = shipLabels[this.currentShip];
                break;
        }
        
        document.getElementById('current-element').textContent = elementText;
    }
    
    updateZoneDetails() {
        const detailsEl = document.getElementById('zone-details');
        const currentKey = this.getCurrentKey();
        
        if (this.forcesZones[this.currentForceType][currentKey]) {
            const coords = this.forcesZones[this.currentForceType][currentKey];
            detailsEl.innerHTML = `
                <strong>${this.currentForceType}[${currentKey}]:</strong><br>
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
                title: '🏛️ Forces par Faction',
                type: 'faction_forces',
                items: ['patriots', 'british', 'french', 'indians'],
                color: '#17a2b8'
            },
            {
                title: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Forts Britanniques (0-6)',
                type: 'british_forts',
                items: ['0', '1', '2', '3', '4', '5', '6'],
                color: '#dc3545'
            },
            {
                title: '🇺🇸 Forts Patriots (0-6)',
                type: 'patriot_forts',
                items: ['0', '1', '2', '3', '4', '5', '6'],
                color: '#007bff'
            },
            {
                title: '🏕️ Villages Indiens (0-12)',
                type: 'indian_villages',
                items: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
                color: '#fd7e14'
            },
            {
                title: '🇫🇷 FNI Français (0-3)',
                type: 'french_fni',
                items: ['0', '1', '2', '3'],
                color: '#6610f2'
            },
            {
                title: '⚓ Bateaux Français',
                type: 'french_ships',
                items: ['ship1', 'ship2', 'ship3'],
                color: '#20c997'
            }
        ];
        
        let html = '';
        
        categories.forEach(category => {
            const zones = this.forcesZones[category.type] || {};
            const completedCount = Object.keys(zones).length;
            const totalCount = category.items.length;
            
            html += `
                <div class="category-progress">
                    <div class="category-title">${category.title} (${completedCount}/${totalCount})</div>
                    <div class="progress-grid">
            `;
            
            category.items.forEach(item => {
                const isComplete = zones[item] ? 'complete' : 'empty';
                const isCurrent = (category.type === this.currentForceType && item === this.getCurrentKey()) ? 'current' : '';
                
                html += `
                    <div class="progress-box ${isComplete} ${isCurrent}" 
                         onclick="selectForceItem('${category.type}', '${item}')"
                         title="${category.title} - ${item}">
                        ${item.replace('ship', 'S')}
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
        
        if (this.forcesZones[this.currentForceType][currentKey]) {
            delete this.forcesZones[this.currentForceType][currentKey];
            
            this.updateProgress();
            this.updateZoneDetails();
            this.redrawCanvas();
            
            console.log(`Zone ${this.currentForceType}[${currentKey}] effacée`);
        }
    }
    
    saveForces() {
        const dataStr = JSON.stringify(this.forcesZones, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'forces_zones.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('Zones des forces sauvegardées:', this.forcesZones);
    }
    
    loadForces() {
        document.getElementById('file-input').click();
    }
    
    handleFileLoad(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedZones = JSON.parse(e.target.result);
                this.forcesZones = loadedZones;
                this.updateProgress();
                this.updateZoneDetails();
                this.redrawCanvas();
                console.log('Zones des forces chargées:', this.forcesZones);
            } catch (error) {
                alert('Erreur lors du chargement du fichier: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Fonctions globales
function selectForceItem(forceType, item) {
    const selector = window.forcesSelector;
    if (!selector) return;
    
    // Changer le type de force
    document.querySelectorAll('.force-type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-type="${forceType}"]`).classList.add('active');
    
    selector.currentForceType = forceType;
    selector.updateControlVisibility();
    
    // Changer l'élément sélectionné
    switch(forceType) {
        case 'faction_forces':
            document.getElementById('faction-select').value = item;
            selector.currentFaction = item;
            break;
        case 'british_forts':
        case 'patriot_forts':
        case 'indian_villages':
        case 'french_fni':
            document.getElementById('number-input').value = parseInt(item);
            selector.currentNumber = parseInt(item);
            break;
        case 'french_ships':
            document.getElementById('ship-select').value = item;
            selector.currentShip = item;
            break;
    }
    
    selector.updateCurrentInfo();
    selector.redrawCanvas();
    selector.updateZoneDetails();
}

// Initialiser l'application quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    window.forcesSelector = new ForcesZoneSelector();
});