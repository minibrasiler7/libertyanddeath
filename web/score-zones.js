class ScoreZoneSelector {
    constructor() {
        this.canvas = document.getElementById('score-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.mapImage = new Image();
        
        // État de l'application
        this.scoreZones = {}; // Structure: { "0": { "resources": {...}, "casualties": {...}, "support": {...} } }
        this.currentScore = 0;
        this.currentScoreType = 'resources';
        this.isSelecting = false;
        this.startPos = { x: 0, y: 0 };
        this.currentRect = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadMapImage();
        this.updateProgress();
        this.initializeScoreGrid();
        
        // Charger les données de démo si disponibles
        this.loadDemoData();
    }
    
    setupEventListeners() {
        // Sélection du numéro de point
        document.getElementById('score-number').addEventListener('change', (e) => {
            this.currentScore = parseInt(e.target.value);
            this.updateCurrentInfo();
            this.redrawCanvas();
            this.updateZoneDetails();
        });
        
        // Sélection du type de score
        document.querySelectorAll('.score-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.score-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentScoreType = e.target.getAttribute('data-type');
                this.updateCurrentInfo();
                this.redrawCanvas();
                this.updateZoneDetails();
            });
        });
        
        // Boutons d'action
        document.getElementById('clear-zone').addEventListener('click', () => this.clearCurrentZone());
        document.getElementById('save-scores').addEventListener('click', () => this.saveScores());
        document.getElementById('load-scores').addEventListener('click', () => this.loadScores());
        
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
        this.ctx.fillText('Liberty and Death - Zones de Score', this.canvas.width/2, 100);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('(Définition des compteurs 0-50)', this.canvas.width/2, 130);
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
            if (!this.scoreZones[this.currentScore]) {
                this.scoreZones[this.currentScore] = {};
            }
            
            this.scoreZones[this.currentScore][this.currentScoreType] = {
                x1: Math.round(this.currentRect.x1),
                y1: Math.round(this.currentRect.y1),
                x2: Math.round(this.currentRect.x2),
                y2: Math.round(this.currentRect.y2)
            };
            
            this.updateProgress();
            this.updateZoneDetails();
            console.log(`Zone ${this.currentScoreType} définie pour le point ${this.currentScore}:`, 
                       this.scoreZones[this.currentScore][this.currentScoreType]);
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
            resources: '#ffc107',
            casualties: '#dc3545',
            support: '#007bff'
        };
        
        Object.entries(this.scoreZones).forEach(([scoreNum, zones]) => {
            Object.entries(zones).forEach(([scoreType, coords]) => {
                const color = colors[scoreType];
                const isCurrentScore = parseInt(scoreNum) === this.currentScore;
                const isCurrentType = scoreType === this.currentScoreType;
                
                // Style selon si c'est la sélection actuelle
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = (isCurrentScore && isCurrentType) ? 3 : 2;
                this.ctx.setLineDash((isCurrentScore && isCurrentType) ? [] : [5, 5]);
                
                // Dessiner le rectangle
                this.ctx.strokeRect(
                    coords.x1, coords.y1,
                    coords.x2 - coords.x1, coords.y2 - coords.y1
                );
                
                // Ajouter un label
                this.ctx.fillStyle = color;
                this.ctx.font = '10px Arial';
                this.ctx.fillText(
                    `${scoreNum}-${scoreType}`,
                    coords.x1 + 2, coords.y1 - 2
                );
            });
        });
        
        // Reset line dash
        this.ctx.setLineDash([]);
    }
    
    drawCurrentSelection() {
        const colors = {
            resources: '#ffc107',
            casualties: '#dc3545',
            support: '#007bff'
        };
        
        this.ctx.strokeStyle = colors[this.currentScoreType];
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 0.7;
        
        this.ctx.strokeRect(
            this.currentRect.x1, this.currentRect.y1,
            this.currentRect.x2 - this.currentRect.x1,
            this.currentRect.y2 - this.currentRect.y1
        );
        
        // Zone semi-transparente
        this.ctx.fillStyle = colors[this.currentScoreType];
        this.ctx.globalAlpha = 0.2;
        this.ctx.fillRect(
            this.currentRect.x1, this.currentRect.y1,
            this.currentRect.x2 - this.currentRect.x1,
            this.currentRect.y2 - this.currentRect.y1
        );
        
        this.ctx.globalAlpha = 1;
    }
    
    updateCurrentInfo() {
        document.getElementById('current-score').textContent = this.currentScore;
        
        const typeLabels = {
            resources: '🟡 Ressources',
            casualties: '🔴 Pertes',
            support: '🔵 Support'
        };
        document.getElementById('current-score-type').textContent = typeLabels[this.currentScoreType];
        
        // Mettre à jour la grille de progrès
        this.updateProgressHighlight();
    }
    
    updateZoneDetails() {
        const detailsEl = document.getElementById('zone-details');
        
        if (this.scoreZones[this.currentScore] && this.scoreZones[this.currentScore][this.currentScoreType]) {
            const coords = this.scoreZones[this.currentScore][this.currentScoreType];
            detailsEl.innerHTML = `
                <strong>Point ${this.currentScore} - ${this.currentScoreType}:</strong><br>
                x1: ${coords.x1}, y1: ${coords.y1}<br>
                x2: ${coords.x2}, y2: ${coords.y2}<br>
                Taille: ${coords.x2 - coords.x1} × ${coords.y2 - coords.y1}
            `;
        } else if (this.currentRect) {
            detailsEl.innerHTML = `
                <strong>Sélection en cours (Point ${this.currentScore}):</strong><br>
                x1: ${Math.round(this.currentRect.x1)}, y1: ${Math.round(this.currentRect.y1)}<br>
                x2: ${Math.round(this.currentRect.x2)}, y2: ${Math.round(this.currentRect.y2)}<br>
                Taille: ${Math.round(this.currentRect.x2 - this.currentRect.x1)} × ${Math.round(this.currentRect.y2 - this.currentRect.y1)}
            `;
        } else {
            detailsEl.innerHTML = '<em>Cliquez et glissez pour sélectionner une zone</em>';
        }
    }
    
    initializeScoreGrid() {
        const progressEl = document.getElementById('score-progress');
        let html = '';
        
        for (let i = 0; i <= 50; i++) {
            html += `<div class="score-box empty" data-score="${i}" onclick="selectScore(${i})">${i}</div>`;
        }
        
        progressEl.innerHTML = html;
    }
    
    updateProgress() {
        for (let i = 0; i <= 50; i++) {
            const scoreBox = document.querySelector(`[data-score="${i}"]`);
            if (!scoreBox) continue;
            
            const zones = this.scoreZones[i] || {};
            const zoneCount = Object.keys(zones).length;
            
            scoreBox.classList.remove('empty', 'partial', 'complete');
            
            if (zoneCount === 0) {
                scoreBox.classList.add('empty');
            } else if (zoneCount < 3) {
                scoreBox.classList.add('partial');
            } else {
                scoreBox.classList.add('complete');
            }
        }
        
        this.updateProgressHighlight();
    }
    
    updateProgressHighlight() {
        document.querySelectorAll('.score-box').forEach(box => {
            box.classList.remove('current');
        });
        
        const currentBox = document.querySelector(`[data-score="${this.currentScore}"]`);
        if (currentBox) {
            currentBox.classList.add('current');
        }
    }
    
    clearCurrentZone() {
        if (this.scoreZones[this.currentScore] && this.scoreZones[this.currentScore][this.currentScoreType]) {
            delete this.scoreZones[this.currentScore][this.currentScoreType];
            
            // Supprimer le point si il n'a plus de zones
            if (Object.keys(this.scoreZones[this.currentScore]).length === 0) {
                delete this.scoreZones[this.currentScore];
            }
            
            this.updateProgress();
            this.updateZoneDetails();
            this.redrawCanvas();
            
            console.log(`Zone ${this.currentScoreType} effacée pour le point ${this.currentScore}`);
        }
    }
    
    saveScores() {
        const dataStr = JSON.stringify(this.scoreZones, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'score_zones.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('Zones de score sauvegardées:', this.scoreZones);
    }
    
    loadScores() {
        document.getElementById('file-input').click();
    }
    
    handleFileLoad(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedZones = JSON.parse(e.target.result);
                this.scoreZones = loadedZones;
                this.updateProgress();
                this.updateZoneDetails();
                this.redrawCanvas();
                console.log('Zones de score chargées:', this.scoreZones);
            } catch (error) {
                alert('Erreur lors du chargement du fichier: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    
    loadDemoData() {
        // Ajouter quelques zones de démonstration si aucune donnée n'existe
        if (Object.keys(this.scoreZones).length === 0) {
            // Exemple pour le point 0
            this.scoreZones['0'] = {
                'resources': { x1: 100, y1: 100, x2: 150, y2: 130 },
                'casualties': { x1: 160, y1: 100, x2: 210, y2: 130 },
                'support': { x1: 220, y1: 100, x2: 270, y2: 130 }
            };
        }
        
        this.updateProgress();
    }
}

// Fonctions globales
function selectScore(scoreNum) {
    const selector = window.scoreSelector;
    if (selector) {
        selector.currentScore = scoreNum;
        document.getElementById('score-number').value = scoreNum;
        selector.updateCurrentInfo();
        selector.redrawCanvas();
        selector.updateZoneDetails();
    }
}

function goToScore(scoreNum) {
    selectScore(scoreNum);
}

// Initialiser l'application quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    window.scoreSelector = new ScoreZoneSelector();
});