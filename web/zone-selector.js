class ZoneSelector {
    constructor() {
        this.canvas = document.getElementById('map-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.mapImage = new Image();
        
        // État de l'application
        this.zones = {};
        this.currentRegion = '';
        this.currentZoneType = 'armies';
        this.isSelecting = false;
        this.startPos = { x: 0, y: 0 };
        this.currentRect = null;
        
        // Liste des régions
        this.regions = [
            'Massachusetts', 'New York', 'Virginia', 'Pennsylvania',
            'North Carolina', 'South Carolina', 'Georgia', 'New Hampshire',
            'Connecticut - Rhode Island', 'New Jersey', 'Maryland - Delaware',
            'Quebec', 'Florida', 'Savannah', 'Charles Town', 'Norfolk',
            'Philadelphia', 'New York City', 'Boston', 'Quebec City',
            'Southwest', 'Northwest', 'West Indies'
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadMapImage();
        this.updateProgress();
        
        // Initialiser les zones avec des données de démo si disponible
        this.loadDemoZones();
    }
    
    setupEventListeners() {
        // Sélection de région
        document.getElementById('region-select').addEventListener('change', (e) => {
            this.currentRegion = e.target.value;
            this.updateCurrentInfo();
            this.redrawCanvas();
        });
        
        // Sélection du type de zone
        document.querySelectorAll('.zone-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.zone-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentZoneType = e.target.getAttribute('data-type');
                this.updateCurrentInfo();
                this.redrawCanvas();
            });
        });
        
        // Boutons d'action
        document.getElementById('clear-zone').addEventListener('click', () => this.clearCurrentZone());
        document.getElementById('save-zones').addEventListener('click', () => this.saveZones());
        document.getElementById('load-zones').addEventListener('click', () => this.loadZones());
        
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.startSelection(e));
        this.canvas.addEventListener('mousemove', (e) => this.updateSelection(e));
        this.canvas.addEventListener('mouseup', (e) => this.endSelection(e));
        
        // Charger fichier
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileLoad(e));
    }
    
    loadMapImage() {
        this.mapImage.onload = () => {
            this.canvas.width = this.mapImage.width;
            this.canvas.height = this.mapImage.height;
            this.redrawCanvas();
        };
        
        this.mapImage.onerror = () => {
            console.error('Impossible de charger l\'image de la carte');
            // Créer une carte de substitution
            this.canvas.width = 1200;
            this.canvas.height = 800;
            this.drawPlaceholderMap();
        };
        
        // Essayer de charger l'image
        this.mapImage.src = 'map.jpg';
    }
    
    drawPlaceholderMap() {
        // Dessiner une carte de substitution simple
        this.ctx.fillStyle = '#e8f4f8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Carte Liberty and Death', this.canvas.width/2, 100);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('(Image non trouvée - mode substitution)', this.canvas.width/2, 130);
        
        // Dessiner des régions approximatives
        const regionPositions = {
            'Massachusetts': [850, 200],
            'New York': [700, 280],
            'Virginia': [600, 400],
            'Pennsylvania': [650, 320],
            'North Carolina': [550, 500],
            'South Carolina': [500, 550],
            'Georgia': [450, 600]
        };
        
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px Arial';
        Object.entries(regionPositions).forEach(([region, [x, y]]) => {
            this.ctx.fillRect(x-30, y-15, 60, 30);
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(region, x, y+3);
            this.ctx.fillStyle = '#666';
        });
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
        if (!this.currentRegion) {
            alert('Veuillez d\'abord sélectionner une région');
            return;
        }
        
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
        this.updateCoordinatesDisplay();
    }
    
    endSelection(e) {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        this.canvas.style.cursor = 'crosshair';
        
        if (this.currentRect) {
            // Sauvegarder la zone
            if (!this.zones[this.currentRegion]) {
                this.zones[this.currentRegion] = {};
            }
            
            this.zones[this.currentRegion][this.currentZoneType] = {
                x1: Math.round(this.currentRect.x1),
                y1: Math.round(this.currentRect.y1),
                x2: Math.round(this.currentRect.x2),
                y2: Math.round(this.currentRect.y2)
            };
            
            this.updateProgress();
            this.updateCoordinatesDisplay();
            console.log(`Zone ${this.currentZoneType} définie pour ${this.currentRegion}:`, 
                       this.zones[this.currentRegion][this.currentZoneType]);
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
            armies: '#dc3545',
            support: '#007bff',
            control: '#28a745'
        };
        
        Object.entries(this.zones).forEach(([region, zones]) => {
            Object.entries(zones).forEach(([zoneType, coords]) => {
                const color = colors[zoneType];
                const isCurrentRegion = region === this.currentRegion;
                const isCurrentType = zoneType === this.currentZoneType;
                
                // Style selon si c'est la sélection actuelle
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = (isCurrentRegion && isCurrentType) ? 3 : 2;
                this.ctx.setLineDash((isCurrentRegion && isCurrentType) ? [] : [5, 5]);
                
                // Dessiner le rectangle
                this.ctx.strokeRect(
                    coords.x1, coords.y1,
                    coords.x2 - coords.x1, coords.y2 - coords.y1
                );
                
                // Ajouter un label
                this.ctx.fillStyle = color;
                this.ctx.font = '12px Arial';
                this.ctx.fillText(
                    `${region}\n${zoneType}`,
                    coords.x1 + 5, coords.y1 - 5
                );
            });
        });
        
        // Reset line dash
        this.ctx.setLineDash([]);
    }
    
    drawCurrentSelection() {
        const colors = {
            armies: '#dc3545',
            support: '#007bff',
            control: '#28a745'
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
        document.getElementById('current-region').textContent = this.currentRegion || 'Aucune';
        
        const typeLabels = {
            armies: '🔴 Armées',
            support: '🔵 Support',
            control: '🟢 Contrôle'
        };
        document.getElementById('current-type').textContent = typeLabels[this.currentZoneType];
    }
    
    updateCoordinatesDisplay() {
        const coordsEl = document.getElementById('coordinates');
        
        if (this.currentRegion && this.zones[this.currentRegion] && this.zones[this.currentRegion][this.currentZoneType]) {
            const coords = this.zones[this.currentRegion][this.currentZoneType];
            coordsEl.innerHTML = `
                <strong>Zone ${this.currentZoneType} - ${this.currentRegion}:</strong><br>
                x1: ${coords.x1}, y1: ${coords.y1}<br>
                x2: ${coords.x2}, y2: ${coords.y2}<br>
                Taille: ${coords.x2 - coords.x1} × ${coords.y2 - coords.y1}
            `;
        } else if (this.currentRect) {
            coordsEl.innerHTML = `
                <strong>Sélection en cours:</strong><br>
                x1: ${Math.round(this.currentRect.x1)}, y1: ${Math.round(this.currentRect.y1)}<br>
                x2: ${Math.round(this.currentRect.x2)}, y2: ${Math.round(this.currentRect.y2)}<br>
                Taille: ${Math.round(this.currentRect.x2 - this.currentRect.x1)} × ${Math.round(this.currentRect.y2 - this.currentRect.y1)}
            `;
        } else {
            coordsEl.innerHTML = '<em>Cliquez et glissez pour sélectionner une zone</em>';
        }
    }
    
    updateProgress() {
        const progressEl = document.getElementById('progress-list');
        let html = '';
        
        this.regions.forEach(region => {
            const zones = this.zones[region] || {};
            const indicators = ['armies', 'support', 'control'].map(type => {
                const defined = zones[type] ? 'defined' : 'undefined';
                const symbol = defined === 'defined' ? '✓' : '✗';
                return `<div class="status-indicator ${defined}" title="${type}">${symbol}</div>`;
            }).join('');
            
            html += `
                <div class="region-status">
                    <span>${region}</span>
                    <div class="status-indicators">${indicators}</div>
                </div>
            `;
        });
        
        progressEl.innerHTML = html;
    }
    
    clearCurrentZone() {
        if (!this.currentRegion) {
            alert('Veuillez sélectionner une région');
            return;
        }
        
        if (this.zones[this.currentRegion] && this.zones[this.currentRegion][this.currentZoneType]) {
            delete this.zones[this.currentRegion][this.currentZoneType];
            
            // Supprimer la région si elle n'a plus de zones
            if (Object.keys(this.zones[this.currentRegion]).length === 0) {
                delete this.zones[this.currentRegion];
            }
            
            this.updateProgress();
            this.updateCoordinatesDisplay();
            this.redrawCanvas();
            
            console.log(`Zone ${this.currentZoneType} effacée pour ${this.currentRegion}`);
        }
    }
    
    saveZones() {
        const dataStr = JSON.stringify(this.zones, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'map_zones.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('Zones sauvegardées:', this.zones);
    }
    
    loadZones() {
        document.getElementById('file-input').click();
    }
    
    handleFileLoad(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedZones = JSON.parse(e.target.result);
                this.zones = loadedZones;
                this.updateProgress();
                this.updateCoordinatesDisplay();
                this.redrawCanvas();
                console.log('Zones chargées:', this.zones);
            } catch (error) {
                alert('Erreur lors du chargement du fichier: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    
    loadDemoZones() {
        // Charger les zones de démonstration si elles existent
        const demoZones = {
            "Massachusetts": {
                "armies": {"x1": 810, "y1": 180, "x2": 890, "y2": 220},
                "support": {"x1": 790, "y1": 160, "x2": 830, "y2": 190},
                "control": {"x1": 870, "y1": 160, "x2": 910, "y2": 190}
            },
            "New York": {
                "armies": {"x1": 660, "y1": 260, "x2": 740, "y2": 300},
                "support": {"x1": 640, "y1": 240, "x2": 680, "y2": 270},
                "control": {"x1": 720, "y1": 240, "x2": 760, "y2": 270}
            },
            "Virginia": {
                "armies": {"x1": 560, "y1": 380, "x2": 640, "y2": 420},
                "support": {"x1": 540, "y1": 360, "x2": 580, "y2": 390},
                "control": {"x1": 620, "y1": 360, "x2": 660, "y2": 390}
            }
        };
        
        // Charger seulement si aucune zone n'est définie
        if (Object.keys(this.zones).length === 0) {
            this.zones = demoZones;
            this.updateProgress();
        }
    }
}

// Initialiser l'application quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    new ZoneSelector();
});