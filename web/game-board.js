class GameBoard {
    constructor() {
        console.log('🚀 GameBoard constructor starting...');
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.mapImage = new Image();
        this.unitImages = {};
        this.resourceTokenImages = {};
        this.supportTokenImages = {};
        this.casualtyTokenImages = {};
        this.controlTokenImages = {};
        this.territorySupportImages = {};
        this.gameState = {};
        this.selectedFaction = 'patriots';
        this.selectedUnit = null;
        this.territories = {};
        this.zones = {};
        this.resourceTokens = {
            patriots: 0,
            british: 0,
            french: 0,
            indians: 0
        };
        this.supportTokens = {
            patriots: 10,  // Patriots Total Opposition - temporary test value
            british: 15    // British Total Support - temporary test value
        };
        this.casualtyTokens = {
            patriots: 5,  // Patriots Cumulative Rebellion Casualties - temporary test value
            british: 8    // British Cumulative British Casualties - temporary test value
        };
        this.controlTokens = {}; // Will store control for each territory/city
        this.territorySupport = {}; // Will store support level for each territory/city
        this.supportCalculation = { patriots: 0, british: 0 }; // Calculated totals

        // Leader system - Leaders placed on territories
        this.leaders = {}; // { territoryName: [leaderName1, leaderName2, ...] }
        this.leaderImages = {}; // Cache for leader images
        
        // Indian village system - 12 villages total
        this.indianVillages = {
            total: 12,
            placed: {}, // { territoryName: count }
            available: 12 // villages not yet placed
        };
        this.villageImages = {};
        
        // Fort system - Patriots and British forts (7 total each, but 6 available on counter 0-6)
        this.fortSystems = {
            patriots: {
                total: 7,
                placed: {}, // { territoryName: count }
                available: 6 // forts available for placement (0-6 range)
            },
            british: {
                total: 7,
                placed: {}, // { territoryName: count }
                available: 6 // forts available for placement (0-6 range)
            }
        };
        this.fortImages = {};
        this.frenchBoatImages = {};
        this.britishTroopImages = {};
        
        // French Regulars system - 15 total French Regulars
        this.frenchRegulars = {
            total: 15,
            placed: {}, // { territoryName: count }
            available: 15 // regulars not yet placed
        };
        
        // French Ships system - 3 total French Ships for blockade
        this.frenchShips = {
            total: 3,
            blockading: {}, // { portCityName: count } - ships blockading port cities
            available: 3, // ships not yet deployed
            dominancePoints: 0 // calculated from blockading ships
        };
        
        // Port cities that can be blockaded
        this.portCities = [
            'Boston', 'New York City', 'Philadelphia', 'Norfolk', 
            'Charles Town', 'Savannah', 'Quebec City'
        ];
        
        // British Troops system - 25 Regulars (red) + 25 Tories (green)
        this.britishTroops = {
            regulars: {
                total: 25,
                placed: {}, // { territoryName: count }
                available: 25 // regulars not yet deployed
            },
            tories: {
                total: 25,
                placed: {}, // { territoryName: count }
                available: 25 // tories not yet deployed
            }
        };
        
        // Patriot Troops system - 20 Continentals + 15 Militia (Active/Normal)
        this.patriotTroops = {
            continentals: {
                total: 20,
                placed: {}, // { territoryName: count }
                available: 20 // continentals not yet deployed
            },
            militia: {
                total: 15,
                placed: {}, // { territoryName: { normal: count, active: count } }
                available: 15 // total militia not yet deployed (normal + active)
            }
        };
        
        // Indian War Parties system - 15 total (Active/Normal)
        this.indianWarParties = {
            total: 15,
            placed: {}, // { territoryName: { normal: count, active: count } }
            available: 15 // total war parties not yet deployed
        };
        
        // Card system
        this.cardSystem = {
            allCards: [], // Liste de toutes les cartes disponibles
            currentDeckCard: null, // Carte actuellement sur le deck
            currentSequenceCard: null, // Carte actuellement sur la sequence (1)
            cardImages: {}, // Cache des images de cartes
            cardBackImage: null, // Image du dos de carte
            deckZone: null, // Zone pour placer le deck de cartes (définie par l'utilisateur)
            sequenceZone: null, // Zone sequence (chargée depuis gameplay_zones.json)
            isDefiningZone: false, // Mode définition de zone actif
            zoneType: null, // Type de zone en cours de définition ('deck')
            cardConfigs: null // Configurations des cartes (tours de jeu, sabre, rifle)
        };
        
        // Système de zones par territoire
        this.territoryZones = {
            propaganda: {}, // { territoryName: zoneData }
            raid: {} // { territoryName: zoneData }
        };
        this.selectedTerritory = null; // Territoire sélectionné pour créer des zones
        this.currentZoneMode = null; // 'propaganda' ou 'raid' quand on définit une zone
        
        // Système de marqueurs raid et propagande
        this.raidPropagandaMarkers = {
            propaganda: {
                total: 12,
                placed: {}, // { territoryName: count }
                available: 12
            },
            raid: {
                total: 12,
                placed: {}, // { territoryName: count }
                available: 12
            }
        };

        // Système de jeu - Faction du joueur humain et cartes
        this.gameSystem = {
            playerFaction: null, // 'patriots', 'british', 'french', ou 'indians'
            aiFactionsString: null, // Chaîne représentant les 3 factions IA
            cards: {
                first: null,  // Première carte tirée { name, fileName, turns: [{faction, sabre, rifle}, ...] }
                second: null  // Deuxième carte tirée { name, fileName, turns: [{faction, sabre, rifle}, ...] }
            },
            currentTurn: {
                cardNumber: 1, // 1 ou 2
                factionIndex: 0, // Index dans le turnOrder de la carte actuelle
                currentFaction: null, // Faction qui joue actuellement
                hasSabre: false, // Si le tour actuel a un sabre
                hasRifle: false  // Si le tour actuel a un fusil
            }
        };

        // Images pour les marqueurs
        this.markerImages = {
            propaganda: null,
            raid: null
        };
        
        console.log('📦 Canvas element found:', !!this.canvas);
        console.log('🎨 Canvas context created:', !!this.ctx);
        
        this.initializeCanvas();
        this.loadAssets();
        this.setupEventListeners();
        this.loadZoneData();
        
        // Initialiser le système de cartes après le chargement des zones
        setTimeout(() => {
            this.initializeCardSystem();
            this.loadTerritoryZones();
            this.populateTerritorySelect();
            this.updateZoneStatus();
        }, 500);
        
        console.log('✅ GameBoard constructor complete');
    }

    initializeCanvas() {
        // Native image dimensions
        const nativeWidth = 2500;
        const nativeHeight = 3864;
        const aspectRatio = nativeHeight / nativeWidth;
        
        // Set canvas size (reduced by 30%)
        const canvasWidth = 1400; // Reduced from 2000 to 1400
        const canvasHeight = canvasWidth * aspectRatio;
        
        // Set canvas dimensions
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // Store scale factor for coordinate conversion
        this.scaleX = canvasWidth / nativeWidth;
        this.scaleY = canvasHeight / nativeHeight;
        
        // Adjust the map container to exactly match canvas size
        this.adjustContainerSize(canvasWidth, canvasHeight);
        
        console.log(`📐 Canvas size: ${canvasWidth}x${canvasHeight} (scale: ${this.scaleX.toFixed(3)})`);
    }

    adjustContainerSize(canvasWidth, canvasHeight) {
        // Find the map container and set its size to exactly match the canvas
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.style.width = `${canvasWidth}px`;
            mapContainer.style.height = `${canvasHeight}px`;
            mapContainer.style.overflow = 'visible';
            mapContainer.style.minWidth = `${canvasWidth}px`;
            mapContainer.style.minHeight = `${canvasHeight}px`;
            mapContainer.style.maxWidth = `${canvasWidth}px`;
            mapContainer.style.maxHeight = `${canvasHeight}px`;
            
            console.log(`📦 Container adjusted to: ${canvasWidth}x${canvasHeight}px`);
        }
        
        // Also set the canvas style to prevent any browser scaling
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;
        this.canvas.style.display = 'block';
        this.canvas.style.overflow = 'visible';
    }

    async loadAssets() {
        // Load map image
        this.mapImage.src = 'LODmap_VASSAL (resize).jpg';
        
        // Load unit images - only use images that actually exist
        const unitTypes = {
            patriots: ['Continentals', 'Militia', 'Fort'],
            british: ['Regulars', 'Tories', 'Fort'],
            french: ['Regulars'],
            indians: ['War Party', 'Village']
        };

        for (const [faction, types] of Object.entries(unitTypes)) {
            this.unitImages[faction] = {};
            for (const type of types) {
                const img = new Image();
                let factionName = faction === 'patriots' ? 'Patriot' : 
                                faction === 'british' ? 'British' : 
                                faction === 'french' ? 'French' : 'Indian';
                
                // Handle special cases for file names
                let fileName = type;
                if (type === 'War Party') {
                    fileName = 'War Party'; // Keep the space as it exists in the file
                }
                
                img.src = `Images/Armée:fort:village/Wood_${factionName}_${fileName}.png`;
                this.unitImages[faction][type] = img;
            }
        }

        // Load resource token images
        const resourceFactions = ['patriots', 'british', 'french', 'indians'];
        resourceFactions.forEach(faction => {
            const img = new Image();
            const factionName = faction === 'patriots' ? 'Patriot' : 
                              faction === 'british' ? 'British' : 
                              faction === 'french' ? 'French' : 'Indian';
            img.src = `Images/Pièces ressources/Wood_${factionName}_Pawn.png`;
            this.resourceTokenImages[faction] = img;
        });

        // Initialize turn tokens system
        this.turnTokens = {
            tokens: [
                {id: 'patriots', faction: 'patriots', currentZone: '2'},
                {id: 'british', faction: 'british', currentZone: '2'},
                {id: 'french', faction: 'french', currentZone: '2'},
                {id: 'indians', faction: 'indians', currentZone: '2'}
            ],
            dragging: null,
            dragOffset: {x: 0, y: 0}
        };

        // Initialize mouse position tracking
        this.mousePos = {x: 0, y: 0};

        // Initialize resource token dragging
        this.draggingResourceToken = null;
        this.resourceDragOffset = {x: 0, y: 0};

        // Initialize support token dragging
        this.draggingSupportToken = null;
        this.supportDragOffset = {x: 0, y: 0};

        // Initialize casualty token dragging
        this.draggingCasualtyToken = null;
        this.casualtyDragOffset = {x: 0, y: 0};
        
        // Show score zones when dragging
        this.showScoreZones = false;

        // Load support token images
        const supportTokens = {
            patriots: 'Patriots_Total Opposition.png',
            british: 'British_Total Support.png'
        };
        Object.entries(supportTokens).forEach(([faction, filename]) => {
            const img = new Image();
            img.src = `Images/Jeton opposition:support/${filename}`;
            this.supportTokenImages[faction] = img;
        });

        // Load casualty token images
        const casualtyTokens = {
            patriots: 'Patriots_Cumulative Rebellion Casualties.png',
            british: 'British_Cumulative British Casualties.png'
        };
        Object.entries(casualtyTokens).forEach(([faction, filename]) => {
            const img = new Image();
            img.src = `Images/Jeton opposition:support/${filename}`;
            this.casualtyTokenImages[faction] = img;
        });

        // Load control token images
        const controlTokens = {
            patriots: 'Control_Patriots.png',
            british: 'Control_British.png'
        };
        Object.entries(controlTokens).forEach(([faction, filename]) => {
            const img = new Image();
            img.src = `Images/Controle/${filename}`;
            this.controlTokenImages[faction] = img;
        });

        // Load territory support/opposition images
        const territorySupportTokens = {
            'support_active': 'Support_Active.png',      // +2 British
            'support_passive': 'Support_Passive.png',    // +1 British
            'opposition_passive': 'Opposition_Passive.png', // +1 Patriots
            'opposition_active': 'Opposition_Active.png'    // +2 Patriots
        };
        Object.entries(territorySupportTokens).forEach(([type, filename]) => {
            const img = new Image();
            img.src = `Images/jetons support:opposition/${filename}`;
            img.onload = () => console.log(`✅ Territory support image loaded: ${type} (${filename})`);
            img.onerror = () => console.error(`❌ Failed to load territory support image: ${type} (${filename})`);
            this.territorySupportImages[type] = img;
        });

        // Load village images
        const villageImg = new Image();
        villageImg.src = 'Images/Armée:fort:village/Wood_Indian_Village.png';
        villageImg.onload = () => console.log('✅ Indian village image loaded');
        villageImg.onerror = () => console.error('❌ Failed to load Indian village image');
        this.villageImages.village = villageImg;

        // Load fort images
        const fortTypes = ['patriots', 'british'];
        fortTypes.forEach(faction => {
            const img = new Image();
            const factionName = faction === 'patriots' ? 'Patriot' : 'British';
            img.src = `Images/Images/Armée:fort:village/Wood_${factionName}_Fort.png`;
            img.onload = () => console.log(`✅ ${factionName} fort image loaded`);
            img.onerror = () => console.error(`❌ Failed to load ${factionName} fort image`);
            this.fortImages[faction] = img;
        });

        // Load French boat images - CORRECT RELATIVE PATHS  
        const frenchBlockadeImg = new Image();
        frenchBlockadeImg.src = 'Images/French Boat/French_Blockade.png';
        frenchBlockadeImg.onload = () => console.log('✅ French blockade image loaded');
        frenchBlockadeImg.onerror = () => console.error('❌ Failed to load French blockade image');
        this.frenchBoatImages.blockade = frenchBlockadeImg;

        const frenchSquadronImg = new Image();
        frenchSquadronImg.src = 'Images/French Boat/French_Squadron.png';
        frenchSquadronImg.onload = () => console.log('✅ French squadron image loaded');
        frenchSquadronImg.onerror = () => console.error('❌ Failed to load French squadron image');
        this.frenchBoatImages.squadron = frenchSquadronImg;

        const fniLevelImg = new Image();
        fniLevelImg.src = 'Images/French Boat/FNI Level.png';
        fniLevelImg.onload = () => console.log('✅ FNI Level image loaded');
        fniLevelImg.onerror = () => console.error('❌ Failed to load FNI Level image');
        this.frenchBoatImages.fniLevel = fniLevelImg;

        // Load British troop images
        const britishRegularsImg = new Image();
        britishRegularsImg.src = 'Images/Armée:fort:village/Wood_British_Regulars.png';
        britishRegularsImg.onload = () => console.log('✅ British Regulars image loaded');
        britishRegularsImg.onerror = () => console.error('❌ Failed to load British Regulars image');
        this.britishTroopImages.regulars = britishRegularsImg;

        const britishToriesImg = new Image();
        britishToriesImg.src = 'Images/Armée:fort:village/Wood_British_Tories.png';
        britishToriesImg.onload = () => console.log('✅ British Tories image loaded');
        britishToriesImg.onerror = () => console.error('❌ Failed to load British Tories image');
        this.britishTroopImages.tories = britishToriesImg;
        
        // Load Patriot troop images
        this.patriotTroopImages = {};
        
        const patriotContinentalsImg = new Image();
        patriotContinentalsImg.src = 'Images/Armée:fort:village/Wood_Patriot_Continentals.png';
        patriotContinentalsImg.onload = () => console.log('✅ Patriot Continentals image loaded');
        patriotContinentalsImg.onerror = () => console.error('❌ Failed to load Patriot Continentals image');
        this.patriotTroopImages.continentals = patriotContinentalsImg;
        
        const patriotMilitiaImg = new Image();
        patriotMilitiaImg.src = 'Images/Armée:fort:village/Wood_Patriot_Militia.png';
        patriotMilitiaImg.onload = () => console.log('✅ Patriot Militia image loaded');
        patriotMilitiaImg.onerror = () => console.error('❌ Failed to load Patriot Militia image');
        this.patriotTroopImages.militia = patriotMilitiaImg;
        
        const patriotMilitiaActiveImg = new Image();
        patriotMilitiaActiveImg.src = 'Images/Armée:fort:village/Wood_Patriot_Militia (A).png';
        patriotMilitiaActiveImg.onload = () => console.log('✅ Patriot Militia Active image loaded');
        patriotMilitiaActiveImg.onerror = () => console.error('❌ Failed to load Patriot Militia Active image');
        this.patriotTroopImages.militiaActive = patriotMilitiaActiveImg;

        // Load Indian War Party images
        this.indianWarPartyImages = {};
        
        const indianWarPartyImg = new Image();
        indianWarPartyImg.src = 'Images/Armée:fort:village/Wood_Indian_War Party.png';
        indianWarPartyImg.onload = () => console.log('✅ Indian War Party image loaded');
        indianWarPartyImg.onerror = () => console.error('❌ Failed to load Indian War Party image');
        this.indianWarPartyImages.warParty = indianWarPartyImg;
        
        const indianWarPartyActiveImg = new Image();
        indianWarPartyActiveImg.src = 'Images/Armée:fort:village/Wood_Indian_War Party (A).png';
        indianWarPartyActiveImg.onload = () => console.log('✅ Indian War Party Active image loaded');
        indianWarPartyActiveImg.onerror = () => console.error('❌ Failed to load Indian War Party Active image');
        this.indianWarPartyImages.warPartyActive = indianWarPartyActiveImg;

        // Load French Regulars image for reserves
        const frenchRegularsImg = new Image();
        frenchRegularsImg.src = 'Images/Armée:fort:village/Wood_French_Regulars.png';
        frenchRegularsImg.onload = () => console.log('✅ French Regulars image loaded');
        frenchRegularsImg.onerror = () => console.error('❌ Failed to load French Regulars image');
        this.frenchRegularsImage = frenchRegularsImg;

        // Load leader images
        const leaderNames = ['Brandt', 'Clinton', 'Cornplanter', 'Cornwallis', 'Dragging Canoe',
                            'Gage', 'Gates', 'Greene', 'Howe', 'Lauzun', 'Prevost', 'Rochambeau', 'Washington'];
        leaderNames.forEach(leaderName => {
            const img = new Image();
            img.src = `Images/Leader/Leader_${leaderName}.png`;
            img.onload = () => console.log(`✅ Leader image loaded: ${leaderName}`);
            img.onerror = () => console.error(`❌ Failed to load leader image: ${leaderName}`);
            this.leaderImages[leaderName.toLowerCase()] = img;
        });

        // Load raid and propaganda marker images
        const propagandaImg = new Image();
        propagandaImg.onload = () => {
            console.log('✅ Propaganda marker image loaded:', propagandaImg.src);
            console.log(`📐 Propaganda image dimensions: ${propagandaImg.naturalWidth}x${propagandaImg.naturalHeight}`);
        };
        propagandaImg.onerror = (e) => {
            console.error('❌ Failed to load Propaganda marker image:', propagandaImg.src);
            console.error('Error details:', e);
        };
        propagandaImg.src = 'Propaganda.png';
        this.markerImages.propaganda = propagandaImg;

        const raidImg = new Image();
        raidImg.onload = () => {
            console.log('✅ Raid marker image loaded:', raidImg.src);
            console.log(`📐 Raid image dimensions: ${raidImg.naturalWidth}x${raidImg.naturalHeight}`);
        };
        raidImg.onerror = (e) => {
            console.error('❌ Failed to load Raid marker image:', raidImg.src);
            console.error('Error details:', e);
        };
        raidImg.src = 'Raid.png';
        this.markerImages.raid = raidImg;

        // Wait for map image to load
        this.mapImage.onload = () => {
            console.log('🗺️ Map image loaded, drawing board...');
            this.draw();
        };
    }

    async loadZoneData() {
        console.log('🔄 Starting to load zone data...');
        try {
            // Load all zone files
            const zoneFiles = [
                { file: 'map_zone.json', type: 'territories', color: '#0066ff' },
                { file: 'score_zones.json', type: 'score', color: '#ff6600' },
                { file: 'forces_zones.json', type: 'forces', color: '#00cc66' },
                { file: 'gameplay_zones.json', type: 'gameplay', color: '#cc00ff' }
            ];
            
            // Load raid/propaganda zones separately
            try {
                console.log('📥 Loading raid-propaganda-zone.json...');
                const raidPropResponse = await fetch('raid-propaganda-zone.json');
                if (raidPropResponse.ok) {
                    const raidPropData = await raidPropResponse.json();
                    this.territoryZones = raidPropData.territoryZones;
                    console.log('✅ Raid/Propaganda zones loaded:', Object.keys(this.territoryZones.propaganda).length + Object.keys(this.territoryZones.raid).length + ' zones');
                } else {
                    console.log('⚠️ Raid/Propaganda zones file not found, using empty zones');
                }
            } catch (error) {
                console.log('⚠️ Failed to load raid/propaganda zones:', error);
            }

            this.allZones = {};
            console.log('📂 Zone files to load:', zoneFiles.map(f => f.file));
            
            for (const zoneFile of zoneFiles) {
                try {
                    console.log(`📥 Loading ${zoneFile.file}...`);
                    const response = await fetch(zoneFile.file);
                    console.log(`📊 Response status for ${zoneFile.file}:`, response.status);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    const data = await response.json();
                    this.allZones[zoneFile.type] = {
                        data: data,
                        color: zoneFile.color
                    };
                    console.log(`✅ ${zoneFile.type} zones loaded:`, Object.keys(data).length, 'zones');
                } catch (error) {
                    console.error(`❌ Could not load ${zoneFile.file}:`, error);
                }
            }
            
            console.log('🎯 All zones loaded:', Object.keys(this.allZones));
            
            // Keep territories for backward compatibility
            this.zones = this.allZones.territories?.data || {};
            
        } catch (error) {
            console.error('❌ Error loading zone files:', error);
            this.setDefaultTerritoryPositions();
        }

        // Always ensure we have some zones loaded for testing
        if (!this.zones || Object.keys(this.zones).length === 0) {
            console.warn('No zones loaded, using fallback positions');
            this.setDefaultTerritoryPositions();
        }

        // Initialize territory support after zones are loaded
        this.placeRandomTerritorySupport();
    }

    setDefaultTerritoryPositions() {
        // Estimated positions for territories scaled to native resolution (2500x3864)
        // These are rough estimates - you may need to adjust them
        this.zones = {
            "New Hampshire": { armies: {x: 2200, y: 500, width: 200, height: 150} },
            "Massachusetts": { armies: {x: 2250, y: 700, width: 200, height: 150} },
            "Connecticut-Rhode Island": { armies: {x: 2200, y: 950, width: 200, height: 150} },
            "New York": { armies: {x: 1900, y: 900, width: 250, height: 180} },
            "New Jersey": { armies: {x: 1850, y: 1200, width: 180, height: 150} },
            "Pennsylvania": { armies: {x: 1600, y: 1100, width: 220, height: 180} },
            "Maryland-Delaware": { armies: {x: 1700, y: 1350, width: 200, height: 150} },
            "Virginia": { armies: {x: 1500, y: 1600, width: 250, height: 200} },
            "North Carolina": { armies: {x: 1400, y: 1900, width: 220, height: 180} },
            "South Carolina": { armies: {x: 1300, y: 2200, width: 200, height: 180} },
            "Georgia": { armies: {x: 1250, y: 2500, width: 200, height: 180} },
            "Boston": { armies: {x: 2350, y: 720, width: 100, height: 100} },
            "New York City": { armies: {x: 1950, y: 1000, width: 100, height: 100} },
            "Philadelphia": { armies: {x: 1700, y: 1150, width: 100, height: 100} },
            "Baltimore": { armies: {x: 1750, y: 1300, width: 100, height: 100} },
            "Norfolk": { armies: {x: 1600, y: 1650, width: 100, height: 100} },
            "Wilmington": { armies: {x: 1500, y: 1950, width: 100, height: 100} },
            "Charleston": { armies: {x: 1400, y: 2250, width: 100, height: 100} },
            "Savannah": { armies: {x: 1350, y: 2550, width: 100, height: 100} },
            "Backcountry": { armies: {x: 1100, y: 1800, width: 300, height: 250} },
            "Northwest": { armies: {x: 900, y: 800, width: 400, height: 300} },
            "Cherokee": { armies: {x: 900, y: 1900, width: 250, height: 200} },
            "Creek": { armies: {x: 950, y: 2300, width: 250, height: 200} }
        };
    }

    setupEventListeners() {
        // Faction selection
        document.querySelectorAll('.faction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.faction-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedFaction = e.target.dataset.faction;
                this.updateUnitGrid();
            });
        });

        // Canvas click for territory selection, unit placement, and zone definition
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Si on est en mode définition de zone
            if (this.cardSystem.isDefiningZone) {
                this.handleZoneDefinitionClick(x, y);
                return;
            }
            
            const territory = this.getTerritoryAtPosition(x, y);
            if (territory) {
                this.selectTerritory(territory);
                
                // Si aucune unité sélectionnée, ouvrir l'éditeur de territoire
                if (!this.selectedUnit) {
                    console.log(`🖱️ No unit selected, opening territory editor for ${territory}`);
                    this.openTerritoryEditor(territory, e.clientX, e.clientY);
                } else {
                    // Sinon, placer l'unité sélectionnée
                    this.placeUnit(territory, this.selectedFaction, this.selectedUnit);
                }
            }
        });

        // Le menu d'édition s'ouvre maintenant avec un clic-gauche si aucune unité n'est sélectionnée

        // Variables pour la définition de zone par glisser-déposer
        this.zoneDefinition = {
            isDrawing: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };

        // Mouse events pour définition de zone par glisser-déposer
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Check for turn token click first
            const clickedTurnToken = this.getTurnTokenAt(mouseX, mouseY);
            if (clickedTurnToken) {
                this.startDraggingToken(clickedTurnToken, mouseX, mouseY);
                return;
            }

            // Check for resource token click
            const clickedResourceToken = this.getResourceTokenAt(mouseX, mouseY);
            if (clickedResourceToken) {
                this.startDraggingResourceToken(clickedResourceToken, mouseX, mouseY);
                return;
            }

            // Check for support token click (but disable drag for calculated support tokens)
            const clickedSupportToken = this.getSupportTokenAt(mouseX, mouseY);
            console.log(`🔍 Support token check at (${mouseX}, ${mouseY}):`, clickedSupportToken);
            if (clickedSupportToken) {
                // Désactiver le drag pour les jetons de support calculés (patriots et british)
                if (clickedSupportToken.faction === 'patriots' || clickedSupportToken.faction === 'british') {
                    console.log(`🚫 Cannot drag calculated support token: ${clickedSupportToken.faction}`);
                    return;
                }
                console.log(`✅ Support token clicked:`, clickedSupportToken);
                this.startDraggingSupportToken(clickedSupportToken, mouseX, mouseY);
                return;
            }

            // Check for casualty token click
            const clickedCasualtyToken = this.getCasualtyTokenAt(mouseX, mouseY);
            console.log(`🔍 Casualty token check at (${mouseX}, ${mouseY}):`, clickedCasualtyToken);
            if (clickedCasualtyToken) {
                console.log(`✅ Casualty token clicked:`, clickedCasualtyToken);
                this.startDraggingCasualtyToken(clickedCasualtyToken, mouseX, mouseY);
                return;
            }
            
            // Existing zone definition logic
            if (!this.cardSystem.isDefiningZone) return;
            
            this.zoneDefinition.startX = mouseX;
            this.zoneDefinition.startY = mouseY;
            this.zoneDefinition.isDrawing = true;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            // Handle turn token dragging
            if (this.turnTokens.dragging) {
                this.draw();
                return;
            }

            // Handle resource token dragging
            if (this.draggingResourceToken) {
                this.draw();
                return;
            }

            // Handle support token dragging
            if (this.draggingSupportToken) {
                this.draw();
                return;
            }

            // Handle casualty token dragging
            if (this.draggingCasualtyToken) {
                this.draw();
                return;
            }
            
            // Existing zone definition logic
            if (!this.cardSystem.isDefiningZone || !this.zoneDefinition.isDrawing) return;
            
            this.zoneDefinition.currentX = this.mousePos.x;
            this.zoneDefinition.currentY = this.mousePos.y;
            
            this.draw(); // Redessiner avec la zone en cours
        });

        this.canvas.addEventListener('mouseup', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Handle turn token drop
            if (this.turnTokens.dragging) {
                this.dropToken(mouseX, mouseY);
                return;
            }

            // Handle resource token drop
            if (this.draggingResourceToken) {
                this.dropResourceToken(mouseX, mouseY);
                return;
            }

            // Handle support token drop
            if (this.draggingSupportToken) {
                this.dropSupportToken(mouseX, mouseY);
                return;
            }

            // Handle casualty token drop
            if (this.draggingCasualtyToken) {
                this.dropCasualtyToken(mouseX, mouseY);
                return;
            }
            
            // Existing zone definition logic
            if (!this.cardSystem.isDefiningZone || !this.zoneDefinition.isDrawing) return;
            
            this.zoneDefinition.currentX = mouseX;
            this.zoneDefinition.currentY = mouseY;
            this.zoneDefinition.isDrawing = false;
            
            this.finishDefiningZone();
        });

        // Control buttons
        const exportBtn = document.getElementById('export-state');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.printGameState();
            });
        }

        // Save/Load game buttons
        const saveBtn = document.getElementById('save-game');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveGameToFile();
            });
        }

        const loadBtn = document.getElementById('load-game');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                this.loadGameFromFile();
            });
        }

        // Scenario loader
        const loadScenarioBtn = document.getElementById('load-scenario');
        if (loadScenarioBtn) {
            loadScenarioBtn.addEventListener('click', () => {
                this.loadScenario();
            });
        }

        // Territory selection (optionnel)
        const territorySelect = document.getElementById('territory-select');
        if (territorySelect) {
            territorySelect.addEventListener('change', (e) => {
                this.selectedTerritory = e.target.value;
                this.updateZoneStatus();
            });
        }
    }

    updateUnitGrid() {
        const unitGrid = document.getElementById('unit-grid');
        if (!unitGrid) {
            // L'élément unit-grid n'existe pas, on ne fait rien
            return;
        }

        unitGrid.innerHTML = '';

        const unitTypes = {
            patriots: ['Continentals', 'Militia', 'Village'],
            british: ['Regulars', 'Tories', 'Fort'],
            french: ['Regulars', 'Fort'],
            indians: ['War_Party', 'Village']
        };

        const types = unitTypes[this.selectedFaction] || [];
        types.forEach(type => {
            const btn = document.createElement('div');
            btn.className = 'unit-btn';
            btn.textContent = type;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedUnit = type;
            });
            unitGrid.appendChild(btn);
        });
    }

    getTerritoryAtPosition(x, y) {
        // Check territories in the loaded zones
        if (this.allZones?.territories?.data) {
            for (const [territoryName, zones] of Object.entries(this.allZones.territories.data)) {
                if (zones.armies) {
                    const zone = zones.armies;
                    let checkZone = zone;
                    
                    // Convert coordinates if needed
                    if (zone.x1 !== undefined) {
                        checkZone = {
                            x: zone.x1,
                            y: zone.y1,
                            width: zone.x2 - zone.x1,
                            height: zone.y2 - zone.y1
                        };
                    }
                    
                    // Scale coordinates to match canvas
                    const scaledZone = {
                        x: checkZone.x * this.scaleX,
                        y: checkZone.y * this.scaleY,
                        width: checkZone.width * this.scaleX,
                        height: checkZone.height * this.scaleY
                    };
                    
                    if (x >= scaledZone.x && x <= scaledZone.x + scaledZone.width && 
                        y >= scaledZone.y && y <= scaledZone.y + scaledZone.height) {
                        return territoryName;
                    }
                }
            }
        }
        return null;
    }

    selectTerritory(territoryName) {
        this.selectedTerritory = territoryName;
        this.updateTerritoryInfo(territoryName);
        this.draw();
    }

    updateTerritoryInfo(territoryName) {
        const info = document.getElementById('territory-info');
        const units = this.gameState[territoryName] || {};
        
        let unitsText = '';
        for (const [faction, factionUnits] of Object.entries(units)) {
            for (const [unitType, count] of Object.entries(factionUnits)) {
                if (count > 0) {
                    unitsText += `<div>${faction}: ${unitType} x${count}</div>`;
                }
            }
        }

        info.innerHTML = `
            <h4>📍 ${territoryName}</h4>
            <div><strong>Unités présentes:</strong></div>
            ${unitsText || '<div>Aucune unité</div>'}
        `;
    }

    placeUnit(territory, faction, unitType) {
        if (!this.gameState[territory]) {
            this.gameState[territory] = {};
        }
        if (!this.gameState[territory][faction]) {
            this.gameState[territory][faction] = {};
        }
        if (!this.gameState[territory][faction][unitType]) {
            this.gameState[territory][faction][unitType] = 0;
        }
        
        this.gameState[territory][faction][unitType]++;
        this.updateTerritoryInfo(territory);
        this.updateStatistics();
        this.draw();
    }

    generateRandomUnits() {
        this.clearBoard();
        
        // Place random territory support tokens after clearing
        this.placeRandomTerritorySupport();
        
        const territories = Object.keys(this.zones);
        const factions = ['patriots', 'british', 'french', 'indians'];
        const unitTypes = {
            patriots: ['Continentals', 'Militia', 'Fort'],
            british: ['Regulars', 'Tories', 'Fort'],
            french: ['Regulars'],
            indians: ['War Party']
        };

        // Place random units
        for (let i = 0; i < 50; i++) {
            const territory = territories[Math.floor(Math.random() * territories.length)];
            const faction = factions[Math.floor(Math.random() * factions.length)];
            const types = unitTypes[faction];
            const unitType = types[Math.floor(Math.random() * types.length)];
            
            // Apply placement rules
            const isCityTerritory = ['Boston', 'New York City', 'Philadelphia', 'Baltimore', 
                                   'Norfolk', 'Wilmington', 'Charleston', 'Savannah'].includes(territory);
            
            // Indian villages and war parties cannot be in cities
            if (isCityTerritory && faction === 'indians' && unitType === 'Village') {
                continue;
            }
            
            this.placeUnit(territory, faction, unitType);
        }

        // Place random resource tokens for each faction
        this.placeRandomResourceTokens();
        
        // Place random support tokens
        this.placeRandomSupportTokens();
        
        // Place random casualty tokens
        this.placeRandomCasualtyTokens();
        
        // Place random control tokens
        this.placeRandomControlTokens();
        
        // Place random territory support tokens
        this.placeRandomTerritorySupport();
        
        // Place random Indian villages (separate system from units)
        this.placeRandomIndianVillages();
        this.placeRandomForts();
        
        // Place random French Regulars (separate system from units)
        this.placeRandomFrenchRegulars();
        
        // Place random French Ships for blockade
        this.placeRandomFrenchShips();
        
        // Place random British Troops (Regulars and Tories)
        this.placeRandomBritishTroops();
        
        // Place random Patriot Troops (Continentals and Militia)
        this.placeRandomPatriotTroops();
        
        // Place random Indian War Parties
        this.placeRandomIndianWarParties();
        
        // Test collision scenario: force some tokens to same position for testing
        if (Math.random() < 0.5) { // 50% chance to create collisions for testing
            const sameScore = Math.floor(Math.random() * 51);
            const numCollisions = Math.floor(Math.random() * 3) + 2; // 2-4 factions at same position
            const factions = ['patriots', 'british', 'french', 'indians'];
            for (let i = 0; i < numCollisions; i++) {
                this.resourceTokens[factions[i]] = sameScore;
            }
            console.log(`🔥 Testing collision: ${numCollisions} tokens at position ${sameScore}`);
        }

        // Place random raid and propaganda markers
        this.placeRandomRaidPropagandaMarkers();

        this.updateStatistics();
        this.draw();
    }

    placeRandomResourceTokens() {
        const factions = ['patriots', 'british', 'french', 'indians'];
        
        factions.forEach(faction => {
            // Random score between 0 and 50
            const randomScore = Math.floor(Math.random() * 51);
            this.resourceTokens[faction] = randomScore;
            console.log(`📍 ${faction} resource token placed at: ${randomScore}`);
        });
    }

    placeRandomSupportTokens() {
        const supportFactions = ['patriots', 'british'];
        
        supportFactions.forEach(faction => {
            // Random score between 0 and 50
            const randomScore = Math.floor(Math.random() * 51);
            this.supportTokens[faction] = randomScore;
            console.log(`🎯 ${faction} support token placed at: ${randomScore}`);
        });
    }

    placeRandomCasualtyTokens() {
        const casualtyFactions = ['patriots', 'british'];
        
        casualtyFactions.forEach(faction => {
            // Random score between 0 and 50
            const randomScore = Math.floor(Math.random() * 51);
            this.casualtyTokens[faction] = randomScore;
            console.log(`💀 ${faction} casualty token placed at: ${randomScore}`);
        });
    }

    placeRandomControlTokens() {
        // Get all territories that have control zones
        const territories = [];
        if (this.allZones?.territories?.data) {
            Object.keys(this.allZones.territories.data).forEach(territory => {
                if (this.allZones.territories.data[territory].control) {
                    territories.push(territory);
                }
            });
        }

        // Clear existing control
        this.controlTokens = {};
        
        // Randomly assign control: 40% patriots, 40% british, 20% neutral
        territories.forEach(territory => {
            const random = Math.random();
            if (random < 0.4) {
                this.controlTokens[territory] = 'patriots';
                console.log(`🏛️ ${territory} under Patriots control`);
            } else if (random < 0.8) {
                this.controlTokens[territory] = 'british';
                console.log(`🏛️ ${territory} under British control`);
            } else {
                // Neutral - no token
                console.log(`🏛️ ${territory} is neutral`);
            }
        });
    }

    clearBoard() {
        this.gameState = {};
        this.selectedTerritory = null;
        this.resourceTokens = {
            patriots: 0,
            british: 0,
            french: 0,
            indians: 0
        };
        this.supportTokens = {
            patriots: 0,
            british: 0
        };
        this.casualtyTokens = {
            patriots: 0,
            british: 0
        };
        this.controlTokens = {};
        this.territorySupport = {};
        this.supportCalculation = {
            british_support: 0,
            patriots_opposition: 0
        };
        this.indianVillages = {
            total: 12,
            placed: {},
            available: 12
        };
        this.frenchRegulars = {
            total: 15,
            placed: {},
            available: 15
        };
        this.frenchShips = {
            total: 3,
            blockading: {},
            available: 3,
            dominancePoints: 0
        };
        this.britishTroops = {
            regulars: {
                total: 25,
                placed: {},
                available: 25
            },
            tories: {
                total: 25,
                placed: {},
                available: 25
            }
        };
        
        // Reset raid and propaganda markers
        this.raidPropagandaMarkers.propaganda.placed = {};
        this.raidPropagandaMarkers.raid.placed = {};
        this.raidPropagandaMarkers.propaganda.available = this.raidPropagandaMarkers.propaganda.total;
        this.raidPropagandaMarkers.raid.available = this.raidPropagandaMarkers.raid.total;
        
        this.updateStatistics();
        document.getElementById('territory-info').innerHTML = `
            <h4>📍 Région Sélectionnée</h4>
            <p>Cliquez sur une région pour voir les informations</p>
        `;
        this.draw();
    }

    updateStatistics() {
        const stats = {
            patriots: { total: 0, Continentals: 0, Militia: 0, Village: 0 },
            british: { total: 0, Regulars: 0, Tories: 0, Fort: 0 },
            french: { total: 0, Regulars: 0, Fort: 0 },
            indians: { total: 0, War_Party: 0, Village: 0 }
        };

        for (const territory of Object.values(this.gameState)) {
            for (const [faction, units] of Object.entries(territory)) {
                if (stats[faction]) {
                    for (const [unitType, count] of Object.entries(units)) {
                        if (stats[faction][unitType] !== undefined) {
                            stats[faction][unitType] += count;
                            stats[faction].total += count;
                        }
                    }
                }
            }
        }

        const container = document.getElementById('stats-container');
        if (!container) {
            // L'élément stats-container n'existe pas, on ne fait rien
            return;
        }

        container.innerHTML = '';

        for (const [faction, data] of Object.entries(stats)) {
            const factionDiv = document.createElement('div');
            factionDiv.innerHTML = `<strong>${faction}: ${data.total} unités</strong>`;
            container.appendChild(factionDiv);
            
            // Add resource token position
            const resourceDiv = document.createElement('div');
            resourceDiv.className = 'stat-item';
            resourceDiv.innerHTML = `<span>Resources:</span><span>${this.resourceTokens[faction]}</span>`;
            resourceDiv.style.color = '#ff3300';
            resourceDiv.style.fontWeight = 'bold';
            container.appendChild(resourceDiv);
            
            // Add support token position (only for patriots and british)
            if (this.supportTokens[faction] !== undefined) {
                const supportDiv = document.createElement('div');
                supportDiv.className = 'stat-item';
                const supportType = faction === 'patriots' ? 'Opposition' : 'Support';
                supportDiv.innerHTML = `<span>${supportType}:</span><span>${this.supportTokens[faction]}</span>`;
                supportDiv.style.color = faction === 'patriots' ? '#ff8800' : '#0088ff';
                supportDiv.style.fontWeight = 'bold';
                container.appendChild(supportDiv);
            }
            
            // Add casualty token position (only for patriots and british)
            if (this.casualtyTokens[faction] !== undefined) {
                const casualtyDiv = document.createElement('div');
                casualtyDiv.className = 'stat-item';
                const casualtyType = faction === 'patriots' ? 'Rebellion Casualties' : 'British Casualties';
                casualtyDiv.innerHTML = `<span>${casualtyType}:</span><span>${this.casualtyTokens[faction]}</span>`;
                casualtyDiv.style.color = faction === 'patriots' ? '#800000' : '#404040';
                casualtyDiv.style.fontWeight = 'bold';
                container.appendChild(casualtyDiv);
            }
            
            for (const [unitType, count] of Object.entries(data)) {
                if (unitType !== 'total') {
                    const unitDiv = document.createElement('div');
                    unitDiv.className = 'stat-item';
                    unitDiv.innerHTML = `<span>${unitType}:</span><span>${count}</span>`;
                    container.appendChild(unitDiv);
                }
            }
        }
    }

    exportGameState() {
        // Export comprehensive game state
        const gameState = {
            timestamp: new Date().toISOString(),
            
            // Control of territories and cities
            territoryControl: {},
            
            // Score tokens positions
            scores: {
                resources: { ...this.resourceTokens },
                support: {
                    patriots: this.supportTokens.patriots,  // Opposition
                    british: this.supportTokens.british     // Support
                },
                casualties: { ...this.casualtyTokens }
            },
            
            // Military units by territory
            militaryUnits: { ...this.gameState },
            
            // Card system state
            cardSystem: {
                deckZone: this.cardSystem.deckZone,
                sequenceZone: this.cardSystem.sequenceZone,
                currentDeckCard: this.cardSystem.currentDeckCard ? {
                    name: this.cardSystem.currentDeckCard.name,
                    fileName: this.cardSystem.currentDeckCard.fileName,
                    type: this.cardSystem.currentDeckCard.type
                } : null,
                currentSequenceCard: this.cardSystem.currentSequenceCard ? {
                    name: this.cardSystem.currentSequenceCard.name,
                    fileName: this.cardSystem.currentSequenceCard.fileName,
                    type: this.cardSystem.currentSequenceCard.type
                } : null
            },

            // Game system state (player faction, AI factions, cards)
            gameSystem: { ...this.gameSystem },
            
            // Statistics summary
            statistics: {
                totalUnits: 0,
                unitsByFaction: {
                    patriots: { total: 0 },
                    british: { total: 0 },
                    french: { total: 0 },
                    indians: { total: 0 }
                }
            }
        };

        // Process territory control
        Object.entries(this.controlTokens).forEach(([territory, faction]) => {
            gameState.territoryControl[territory] = faction;
        });

        // Add neutral territories
        if (this.allZones?.territories?.data) {
            Object.keys(this.allZones.territories.data).forEach(territory => {
                if (this.allZones.territories.data[territory].control && !gameState.territoryControl[territory]) {
                    gameState.territoryControl[territory] = 'neutral';
                }
            });
        }

        // Calculate statistics
        let totalUnits = 0;
        Object.entries(this.gameState).forEach(([territory, territoryUnits]) => {
            Object.entries(territoryUnits).forEach(([faction, factionUnits]) => {
                Object.entries(factionUnits).forEach(([unitType, count]) => {
                    totalUnits += count;
                    if (!gameState.statistics.unitsByFaction[faction]) {
                        gameState.statistics.unitsByFaction[faction] = { total: 0 };
                    }
                    if (!gameState.statistics.unitsByFaction[faction][unitType]) {
                        gameState.statistics.unitsByFaction[faction][unitType] = 0;
                    }
                    gameState.statistics.unitsByFaction[faction][unitType] += count;
                    gameState.statistics.unitsByFaction[faction].total += count;
                });
            });
        });
        gameState.statistics.totalUnits = totalUnits;

        // Add detailed breakdown
        gameState.breakdown = {
            controlledTerritories: {
                patriots: Object.entries(gameState.territoryControl).filter(([_, faction]) => faction === 'patriots').map(([territory, _]) => territory),
                british: Object.entries(gameState.territoryControl).filter(([_, faction]) => faction === 'british').map(([territory, _]) => territory),
                neutral: Object.entries(gameState.territoryControl).filter(([_, faction]) => faction === 'neutral').map(([territory, _]) => territory)
            },
            
            territorySupport: { ...this.territorySupport },
            supportCalculation: { ...this.supportCalculation },

            leaders: { ...this.leaders },

            indianVillages: { ...this.indianVillages },
            fortSystems: { ...this.fortSystems },
            frenchRegulars: { ...this.frenchRegulars },
            frenchShips: { ...this.frenchShips },
            britishTroops: { ...this.britishTroops },
            patriotTroops: { ...this.patriotTroops },
            indianWarParties: { ...this.indianWarParties },
            raidPropagandaMarkers: { ...this.raidPropagandaMarkers },
            
            scorePositions: {
                patriots: {
                    resources: this.resourceTokens.patriots,
                    opposition: this.supportTokens.patriots,
                    casualties: this.casualtyTokens.patriots
                },
                british: {
                    resources: this.resourceTokens.british,
                    support: this.supportTokens.british,
                    casualties: this.casualtyTokens.british
                },
                french: {
                    resources: this.resourceTokens.french
                },
                indians: {
                    resources: this.resourceTokens.indians
                }
            },
            
            // Raid and Propaganda markers
            raidPropagandaMarkers: {
                propaganda: {
                    total: this.raidPropagandaMarkers.propaganda.total,
                    available: this.raidPropagandaMarkers.propaganda.available,
                    placed: { ...this.raidPropagandaMarkers.propaganda.placed }
                },
                raid: {
                    total: this.raidPropagandaMarkers.raid.total,
                    available: this.raidPropagandaMarkers.raid.available,
                    placed: { ...this.raidPropagandaMarkers.raid.placed }
                }
            }
        };

        return gameState;
    }

    printGameState() {
        const state = this.exportGameState();

        console.log('🎮 ===== ÉTAT COMPLET DU JEU =====');
        console.log(`📅 Date: ${state.timestamp}`);

        // Afficher les informations du système de jeu
        if (state.gameSystem && state.gameSystem.playerFaction) {
            console.log('\n👥 CONFIGURATION DU JEU:');
            console.log(`  👤 Joueur humain: ${this.getFactionName(state.gameSystem.playerFaction)}`);
            console.log(`  🤖 Factions IA: ${state.gameSystem.aiFactionsString}`);

            console.log('\n🎴 CARTES EN JEU:');
            if (state.gameSystem.cards.first) {
                console.log(`  1️⃣ Première carte: ${state.gameSystem.cards.first.name}`);
                console.log(`     📋 Ordre des tours:`);
                state.gameSystem.cards.first.turns.forEach((t, idx) => {
                    const icons = [];
                    if (t.sabre) icons.push('🗡️');
                    if (t.rifle) icons.push('🔫');
                    const iconStr = icons.length > 0 ? ` ${icons.join(' ')}` : '';
                    console.log(`        ${idx + 1}. ${this.getFactionName(t.faction)}${iconStr}`);
                });
            }
            if (state.gameSystem.cards.second) {
                console.log(`  2️⃣ Deuxième carte: ${state.gameSystem.cards.second.name}`);
                console.log(`     📋 Ordre des tours:`);
                state.gameSystem.cards.second.turns.forEach((t, idx) => {
                    const icons = [];
                    if (t.sabre) icons.push('🗡️');
                    if (t.rifle) icons.push('🔫');
                    const iconStr = icons.length > 0 ? ` ${icons.join(' ')}` : '';
                    console.log(`        ${idx + 1}. ${this.getFactionName(t.faction)}${iconStr}`);
                });
            }

            console.log('\n▶️ TOUR ACTUEL:');
            const currentCard = state.gameSystem.currentTurn.cardNumber === 1 ? state.gameSystem.cards.first : state.gameSystem.cards.second;
            if (currentCard) {
                const currentTurn = currentCard.turns[state.gameSystem.currentTurn.factionIndex];
                const currentFaction = currentTurn.faction;
                const isPlayer = currentFaction === state.gameSystem.playerFaction;
                const items = [];
                if (currentTurn.sabre) items.push('🗡️ Sabre');
                if (currentTurn.rifle) items.push('🔫 Fusil');
                const itemStr = items.length > 0 ? ` [${items.join(', ')}]` : '';

                console.log(`  🎴 Carte active: ${state.gameSystem.currentTurn.cardNumber === 1 ? 'Première' : 'Deuxième'} carte (${currentCard.name})`);
                console.log(`  🎯 Faction qui joue: ${this.getFactionName(currentFaction)} ${isPlayer ? '(VOUS)' : '(IA)'}${itemStr}`);
                console.log(`  📍 Position dans l'ordre: ${state.gameSystem.currentTurn.factionIndex + 1}/${currentCard.turns.length}`);

                // Afficher l'ordre complet avec indicateur
                console.log(`  📋 Ordre complet de cette carte:`);
                currentCard.turns.forEach((t, idx) => {
                    const isCurrent = idx === state.gameSystem.currentTurn.factionIndex;
                    const marker = isCurrent ? '▶️' : '  ';
                    const playerMarker = t.faction === state.gameSystem.playerFaction ? '👤' : '🤖';
                    const turnItems = [];
                    if (t.sabre) turnItems.push('🗡️');
                    if (t.rifle) turnItems.push('🔫');
                    const turnItemStr = turnItems.length > 0 ? ` ${turnItems.join(' ')}` : '';
                    console.log(`     ${marker} ${playerMarker} ${this.getFactionName(t.faction)}${turnItemStr}`);
                });
            }
        } else {
            console.log('\n⚠️ Aucun système de jeu configuré (chargez un scénario)');
        }

        console.log('\n🏛️ CONTRÔLE DES TERRITOIRES:');
        Object.entries(state.territoryControl).forEach(([territory, faction]) => {
            const flag = faction === 'patriots' ? '🟢' : faction === 'british' ? '🔴' : '⚪';
            console.log(`  ${flag} ${territory}: ${faction.toUpperCase()}`);
        });
        
        console.log('\n📊 POSITIONS DES SCORES:');
        console.log(`  📍 Resources - Patriots: ${state.scores.resources.patriots}, British: ${state.scores.resources.british}, French: ${state.scores.resources.french}, Indians: ${state.scores.resources.indians}`);
        console.log(`  🎯 Support - Patriots Opposition: ${state.scores.support.patriots}, British Support: ${state.scores.support.british}`);
        console.log(`  💀 Casualties - Patriots: ${state.scores.casualties.patriots}, British: ${state.scores.casualties.british}`);
        
        // Afficher les totaux calculés de support vs les positions sur la piste
        if (state.breakdown && state.breakdown.supportCalculation) {
            console.log(`\n🎯 CALCULS DÉTAILLÉS DE SUPPORT:`);
            console.log(`  🔴 Support Britannique Calculé: ${state.breakdown.supportCalculation.british_support} → Position sur piste: ${state.scores.support.british}`);
            console.log(`  🟢 Opposition Patriote Calculée: ${state.breakdown.supportCalculation.patriots_opposition} → Position sur piste: ${state.scores.support.patriots}`);
        }
        
        console.log('\n🏛️ SUPPORT/OPPOSITION DES TERRITOIRES:');
        if (state.breakdown && state.breakdown.territorySupport) {
            Object.entries(state.breakdown.territorySupport).forEach(([territory, supportData]) => {
                // Gérer le nouveau format de données de support basé sur l'image
                const image = supportData.image;
                const value = supportData.value !== undefined ? supportData.value : supportData;
                let description = 'UNKNOWN';
                let faction = 'neutre';
                let points = 0;
                
                // Utiliser l'image pour déterminer le type correct
                if (image === 'support_active') {
                    description = 'ACTIVE SUPPORT';
                    faction = 'british';
                    points = 2;
                } else if (image === 'support_passive') {
                    description = 'PASSIVE SUPPORT';
                    faction = 'british';
                    points = 1;
                } else if (image === 'opposition_passive') {
                    description = 'PASSIVE OPPOSITION';
                    faction = 'patriots';
                    points = 1;
                } else if (image === 'opposition_active') {
                    description = 'ACTIVE OPPOSITION';
                    faction = 'patriots';
                    points = 2;
                } else if (image === null || value === 0) {
                    description = 'NEUTRAL';
                    faction = 'neutre';
                    points = 0;
                } else {
                    // Fallback pour l'ancien système
                    if (value === 2) {
                        description = 'ACTIVE SUPPORT';
                        faction = 'british';
                        points = 2;
                    } else if (value === 1) {
                        description = 'PASSIVE SUPPORT';
                        faction = 'british';
                        points = 1;
                    } else if (value === -1) {
                        description = 'PASSIVE OPPOSITION';
                        faction = 'patriots';
                        points = 1;
                    } else if (value === -2) {
                        description = 'ACTIVE OPPOSITION';
                        faction = 'patriots';
                        points = 2;
                    } else if (supportData.level) {
                        description = supportData.level.replace('_', ' ').toUpperCase();
                        faction = supportData.faction || 'neutre';
                        points = Math.abs(value);
                    }
                }
                
                const icon = faction === 'british' ? '🔵' : faction === 'patriots' ? '🔴' : '⚪';
                console.log(`  ${icon} ${territory}: ${description} (+${points} pour ${faction})`);
            });
        } else {
            console.log(`  ❌ Aucune donnée de support trouvée`);
        }
        
        if (state.breakdown && state.breakdown.supportCalculation) {
            console.log(`\n📊 TOTAUX DE SUPPORT:`);
            console.log(`  🔴 Support Britannique Total: ${state.breakdown.supportCalculation.british_support}`);
            console.log(`  🟢 Opposition Patriote Total: ${state.breakdown.supportCalculation.patriots_opposition}`);
        } else {
            console.log(`\n📊 TOTAUX DE SUPPORT:`);
            console.log(`  ❌ Aucune donnée de calcul de support trouvée`);
        }
        
        console.log('\n🏕️ VILLAGES INDIENS:');
        if (state.breakdown && state.breakdown.indianVillages) {
            const villages = state.breakdown.indianVillages;
            console.log(`  📊 Total: ${villages.total}, Placés sur carte: ${villages.total - villages.available}, Disponibles: ${villages.available}`);
            
            if (Object.keys(villages.placed).length > 0) {
                console.log(`  📍 Emplacement des villages:`);
                Object.entries(villages.placed).forEach(([territory, count]) => {
                    console.log(`    🏕️ ${territory}: ${count} village${count > 1 ? 's' : ''}`);
                });
            } else {
                console.log(`  📍 Aucun village placé sur la carte`);
            }
        } else {
            console.log(`  ❌ Aucune donnée de villages trouvée`);
        }
        
        console.log('\n🏰 FORTS:');
        if (state.breakdown && state.breakdown.fortSystems) {
            ['patriots', 'british'].forEach(faction => {
                const forts = state.breakdown.fortSystems[faction];
                const factionName = faction === 'patriots' ? 'Patriots' : 'Britanniques';
                const flag = faction === 'patriots' ? '🟢' : '🔴';
                console.log(`  ${flag} ${factionName} (${forts.available} disponibles sur ${forts.total}):`);
                
                if (Object.keys(forts.placed).length > 0) {
                    Object.entries(forts.placed).forEach(([location, count]) => {
                        console.log(`    🏰 ${location}: ${count} fort${count > 1 ? 's' : ''}`);
                    });
                } else {
                    console.log(`    📍 Aucun fort placé sur la carte`);
                }
            });
        } else {
            console.log(`  ❌ Aucune donnée de forts trouvée`);
        }
        
        console.log('\n⚔️ RÉGULIERS FRANÇAIS:');
        if (state.breakdown && state.breakdown.frenchRegulars) {
            const regulars = state.breakdown.frenchRegulars;
            console.log(`  📊 Total: ${regulars.total}, Placés sur carte: ${regulars.total - regulars.available}, Disponibles dans zone des forces: ${regulars.available}`);
            
            if (Object.keys(regulars.placed).length > 0) {
                console.log(`  📍 Emplacement des réguliers français:`);
                Object.entries(regulars.placed).forEach(([location, count]) => {
                    console.log(`    ⚔️ ${location}: ${count} régulier${count > 1 ? 's' : ''}`);
                });
            } else {
                console.log(`  📍 Aucun régulier français placé sur la carte`);
            }
        } else {
            console.log(`  ❌ Aucune donnée de réguliers français trouvée`);
        }
        
        console.log('\n🚢 BATEAUX FRANÇAIS:');
        if (state.breakdown && state.breakdown.frenchShips) {
            const ships = state.breakdown.frenchShips;
            console.log(`  📊 Total: ${ships.total}, En blocus: ${ships.total - ships.available}, Disponibles (ship1/2/3): ${ships.available}`);
            console.log(`  🎯 Points de dominance FNI: ${ships.dominancePoints}`);
            
            if (Object.keys(ships.blockading).length > 0) {
                console.log(`  📍 Blocus des villes portuaires:`);
                Object.entries(ships.blockading).forEach(([portCity, count]) => {
                    console.log(`    🚢 ${portCity}: ${count} bateau${count > 1 ? 'x' : ''} de blocus`);
                });
            } else {
                console.log(`  📍 Aucun blocus en cours`);
            }
        } else {
            console.log(`  ❌ Aucune donnée de bateaux français trouvée`);
        }
        
        console.log('\n🔴 TROUPES BRITANNIQUES:');
        if (state.breakdown && state.breakdown.britishTroops) {
            const troops = state.breakdown.britishTroops;
            console.log(`  🔴 Regulars - Total: ${troops.regulars.total}, Placés: ${troops.regulars.total - troops.regulars.available}, En réserve: ${troops.regulars.available}`);
            console.log(`  🟢 Tories - Total: ${troops.tories.total}, Placés: ${troops.tories.total - troops.tories.available}, En réserve: ${troops.tories.available}`);
            
            if (Object.keys(troops.regulars.placed).length > 0) {
                console.log(`  📍 Emplacement des Regulars:`);
                Object.entries(troops.regulars.placed).forEach(([location, count]) => {
                    console.log(`    🔴 ${location}: ${count} Regular${count > 1 ? 's' : ''}`);
                });
            }
            
            if (Object.keys(troops.tories.placed).length > 0) {
                console.log(`  📍 Emplacement des Tories:`);
                Object.entries(troops.tories.placed).forEach(([location, count]) => {
                    console.log(`    🟢 ${location}: ${count} Torie${count > 1 ? 's' : ''}`);
                });
            }
        } else {
            console.log(`  ❌ Aucune donnée de troupes britanniques trouvée`);
        }
        
        console.log('\n🟢 TROUPES PATRIOTS:');
        if (state.breakdown && state.breakdown.patriotTroops) {
            const troops = state.breakdown.patriotTroops;
            console.log(`  🟢 Continentals - Total: ${troops.continentals.total}, Placés: ${troops.continentals.total - troops.continentals.available}, En réserve: ${troops.continentals.available}`);
            console.log(`  🟦 Militia - Total: ${troops.militia.total}, Placés: ${troops.militia.total - troops.militia.available}, En réserve: ${troops.militia.available}`);
            
            if (Object.keys(troops.continentals.placed).length > 0) {
                console.log(`  📍 Emplacement des Continentals:`);
                Object.entries(troops.continentals.placed).forEach(([location, count]) => {
                    console.log(`    🟢 ${location}: ${count} Continental${count > 1 ? 's' : ''}`);
                });
            }
            
            if (Object.keys(troops.militia.placed).length > 0) {
                console.log(`  📍 Emplacement des Militia:`);
                Object.entries(troops.militia.placed).forEach(([location, militiaData]) => {
                    if (militiaData.normal > 0) {
                        console.log(`    🟦 ${location}: ${militiaData.normal} Milice${militiaData.normal > 1 ? 's' : ''} Normale${militiaData.normal > 1 ? 's' : ''}`);
                    }
                    if (militiaData.active > 0) {
                        console.log(`    🟨 ${location}: ${militiaData.active} Milice${militiaData.active > 1 ? 's' : ''} Active${militiaData.active > 1 ? 's' : ''}`);
                    }
                });
            }
        } else {
            console.log(`  ❌ Aucune donnée de troupes patriots trouvée`);
        }
        
        console.log('\n🟤 INDIAN WAR PARTIES:');
        if (state.breakdown && state.breakdown.indianWarParties) {
            const warParties = state.breakdown.indianWarParties;
            console.log(`  🟤 War Parties - Total: ${warParties.total}, Placés: ${warParties.total - warParties.available}, En réserve: ${warParties.available}`);
            
            if (Object.keys(warParties.placed).length > 0) {
                console.log(`  📍 Emplacement des War Parties:`);
                Object.entries(warParties.placed).forEach(([location, warPartyData]) => {
                    if (warPartyData.normal > 0) {
                        console.log(`    🟤 ${location}: ${warPartyData.normal} War Part${warPartyData.normal > 1 ? 'ies' : 'y'} Normale${warPartyData.normal > 1 ? 's' : ''}`);
                    }
                    if (warPartyData.active > 0) {
                        console.log(`    🟫 ${location}: ${warPartyData.active} War Part${warPartyData.active > 1 ? 'ies' : 'y'} Active${warPartyData.active > 1 ? 's' : ''}`);
                    }
                });
            }
        } else {
            console.log(`  ❌ Aucune donnée de war parties trouvée`);
        }
        
        console.log('\n⚔️ UNITÉS MILITAIRES PAR TERRITOIRE:');
        
        // Agrégation de toutes les unités par territoire - utiliser les vrais systèmes
        const territoryUnits = {};
        
        // Ajouter les troupes britanniques
        if (this.britishTroops) {
            const britishTroops = this.britishTroops;
            
            // Regulars
            Object.entries(britishTroops.regulars.placed).forEach(([territory, count]) => {
                if (!territoryUnits[territory]) territoryUnits[territory] = {};
                if (!territoryUnits[territory]['british']) territoryUnits[territory]['british'] = {};
                territoryUnits[territory]['british']['Regulars'] = (territoryUnits[territory]['british']['Regulars'] || 0) + count;
            });
            
            // Tories
            Object.entries(britishTroops.tories.placed).forEach(([territory, count]) => {
                if (!territoryUnits[territory]) territoryUnits[territory] = {};
                if (!territoryUnits[territory]['british']) territoryUnits[territory]['british'] = {};
                territoryUnits[territory]['british']['Tories'] = (territoryUnits[territory]['british']['Tories'] || 0) + count;
            });
        }
        
        // Ajouter les troupes patriots
        if (this.patriotTroops) {
            const patriotTroops = this.patriotTroops;
            
            // Continentals
            Object.entries(patriotTroops.continentals.placed).forEach(([territory, count]) => {
                if (!territoryUnits[territory]) territoryUnits[territory] = {};
                if (!territoryUnits[territory]['patriots']) territoryUnits[territory]['patriots'] = {};
                territoryUnits[territory]['patriots']['Continentals'] = (territoryUnits[territory]['patriots']['Continentals'] || 0) + count;
            });
            
            // Militia
            Object.entries(patriotTroops.militia.placed).forEach(([territory, militiaData]) => {
                if (!territoryUnits[territory]) territoryUnits[territory] = {};
                if (!territoryUnits[territory]['patriots']) territoryUnits[territory]['patriots'] = {};
                
                if (militiaData.normal > 0) {
                    territoryUnits[territory]['patriots']['Militia Normal'] = (territoryUnits[territory]['patriots']['Militia Normal'] || 0) + militiaData.normal;
                }
                if (militiaData.active > 0) {
                    territoryUnits[territory]['patriots']['Militia Active'] = (territoryUnits[territory]['patriots']['Militia Active'] || 0) + militiaData.active;
                }
            });
        }
        
        // Ajouter les réguliers français
        if (this.frenchRegulars) {
            Object.entries(this.frenchRegulars.placed).forEach(([territory, count]) => {
                if (!territoryUnits[territory]) territoryUnits[territory] = {};
                if (!territoryUnits[territory]['french']) territoryUnits[territory]['french'] = {};
                territoryUnits[territory]['french']['Regulars'] = (territoryUnits[territory]['french']['Regulars'] || 0) + count;
            });
        }
        
        // Ajouter les villages indiens
        if (this.indianVillages) {
            Object.entries(this.indianVillages.placed).forEach(([territory, count]) => {
                if (!territoryUnits[territory]) territoryUnits[territory] = {};
                if (!territoryUnits[territory]['indians']) territoryUnits[territory]['indians'] = {};
                territoryUnits[territory]['indians']['Villages'] = (territoryUnits[territory]['indians']['Villages'] || 0) + count;
            });
        }
        
        // Ajouter les Indian War Parties
        if (this.indianWarParties) {
            Object.entries(this.indianWarParties.placed).forEach(([territory, warPartyData]) => {
                if (!territoryUnits[territory]) territoryUnits[territory] = {};
                if (!territoryUnits[territory]['indians']) territoryUnits[territory]['indians'] = {};
                
                if (warPartyData.normal > 0) {
                    territoryUnits[territory]['indians']['War Parties Normal'] = (territoryUnits[territory]['indians']['War Parties Normal'] || 0) + warPartyData.normal;
                }
                if (warPartyData.active > 0) {
                    territoryUnits[territory]['indians']['War Parties Active'] = (territoryUnits[territory]['indians']['War Parties Active'] || 0) + warPartyData.active;
                }
            });
        }
        
        // Ajouter les forts
        if (this.fortSystems) {
            ['patriots', 'british'].forEach(faction => {
                const forts = this.fortSystems[faction];
                Object.entries(forts.placed).forEach(([territory, count]) => {
                    if (!territoryUnits[territory]) territoryUnits[territory] = {};
                    if (!territoryUnits[territory][faction]) territoryUnits[territory][faction] = {};
                    territoryUnits[territory][faction]['Forts'] = (territoryUnits[territory][faction]['Forts'] || 0) + count;
                });
            });
        }
        
        // Ajouter les bateaux français en blocus
        if (this.frenchShips) {
            Object.entries(this.frenchShips.blockading).forEach(([portCity, shipCount]) => {
                if (shipCount > 0) {
                    if (!territoryUnits[portCity]) territoryUnits[portCity] = {};
                    if (!territoryUnits[portCity]['french']) territoryUnits[portCity]['french'] = {};
                    territoryUnits[portCity]['french']['Ships Blockading'] = (territoryUnits[portCity]['french']['Ships Blockading'] || 0) + shipCount;
                }
            });
        }
        
        // Afficher les résultats agrégés
        Object.entries(territoryUnits).forEach(([territory, units]) => {
            console.log(`  🏞️ ${territory}:`);

            // Afficher les leaders si présents
            if (state.breakdown.leaders && state.breakdown.leaders[territory]) {
                const leaders = state.breakdown.leaders[territory];
                leaders.forEach(leader => {
                    console.log(`    👤 Leader: ${leader}`);
                });
            }

            Object.entries(units).forEach(([faction, factionUnits]) => {
                Object.entries(factionUnits).forEach(([unitType, count]) => {
                    if (count > 0) {
                        const factionIcon = faction === 'patriots' ? '🟢' : faction === 'british' ? '🔴' : faction === 'french' ? '🔵' : '🟤';
                        console.log(`    ${factionIcon} ${faction} ${unitType}: ${count}`);
                    }
                });
            });
        });
        
        console.log('\n🎯 MARQUEURS RAID ET PROPAGANDE:');
        if (state.breakdown && state.breakdown.raidPropagandaMarkers) {
            const propaganda = state.breakdown.raidPropagandaMarkers.propaganda;
            const raid = state.breakdown.raidPropagandaMarkers.raid;
            
            console.log(`  📢 PROPAGANDE (${propaganda.total} total):`);
            console.log(`    📍 Placés sur carte: ${propaganda.total - propaganda.available}, Disponibles dans zone Patriots: ${propaganda.available}`);
            if (Object.keys(propaganda.placed).length > 0) {
                Object.entries(propaganda.placed).forEach(([territory, count]) => {
                    console.log(`      📢 ${territory}: ${count} marqueur${count > 1 ? 's' : ''}`);
                });
            } else {
                console.log(`      📍 Aucun marqueur propagande placé sur la carte`);
            }
            
            console.log(`  ⚔️ RAID (${raid.total} total):`);
            console.log(`    📍 Placés sur carte: ${raid.total - raid.available}, Disponibles dans zone Indians: ${raid.available}`);
            if (Object.keys(raid.placed).length > 0) {
                Object.entries(raid.placed).forEach(([territory, count]) => {
                    console.log(`      ⚔️ ${territory}: ${count} marqueur${count > 1 ? 's' : ''}`);
                });
            } else {
                console.log(`      📍 Aucun marqueur raid placé sur la carte`);
            }
        } else {
            console.log(`  ❌ Aucune donnée de marqueurs raid/propagande trouvée`);
        }
        
        console.log('\n📈 STATISTIQUES GÉNÉRALES:');
        console.log(`  Total unités: ${state.statistics.totalUnits}`);
        Object.entries(state.statistics.unitsByFaction).forEach(([faction, data]) => {
            console.log(`  ${faction}: ${data.total} unités`);
        });

        // Afficher un message à l'utilisateur
        alert('✅ État du jeu affiché dans la console du navigateur.\n\nOuvrez la console (F12 ou Ctrl+Shift+I) pour voir les détails complets.');

        return state;
    }
    
    saveGameToFile() {
        console.log('💾 Saving game to file...');
        
        try {
            const gameState = this.exportGameState();
            
            // Créer le fichier JSON
            const jsonString = JSON.stringify(gameState, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Créer un lien de téléchargement
            const a = document.createElement('a');
            a.href = url;
            a.download = `liberty_and_death_save_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Game saved successfully');
            alert('Jeu sauvegardé ! Le fichier a été téléchargé.');
            
            // AUSSI sauvegarder la zone deck séparément dans deck_zone.json
            if (gameState.cardSystem.deckZone) {
                this.updateDeckZoneFile(gameState.cardSystem.deckZone);
            }
            
        } catch (error) {
            console.error('❌ Error saving game:', error);
            alert('Erreur lors de la sauvegarde du jeu.');
        }
    }
    
    loadGameFromFile() {
        console.log('📁 Loading game from file...');
        
        // Créer un input file temporaire
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const gameState = JSON.parse(e.target.result);
                    this.importGameState(gameState);
                    console.log('✅ Game loaded successfully');
                    alert('Jeu chargé avec succès !');
                } catch (error) {
                    console.error('❌ Error loading game:', error);
                    alert('Erreur lors du chargement du jeu. Vérifiez que le fichier est valide.');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    updateDeckZoneFile(deckZone) {
        console.log('💾 Updating deck_zone.json file...');
        
        const deckZoneData = {
            deckZone: deckZone
        };
        
        // Créer le fichier deck_zone.json mis à jour
        const jsonString = JSON.stringify(deckZoneData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Créer un lien de téléchargement
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deck_zone.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ deck_zone.json updated and downloaded');
    }
    
    importGameState(gameState) {
        console.log('📥 Importing game state...');
        
        // Importer tous les états
        if (gameState.scores) {
            this.resourceTokens = { ...gameState.scores.resources };
            this.supportTokens = { 
                patriots: gameState.scores.support.patriots || 0,
                british: gameState.scores.support.british || 0
            };
            this.casualtyTokens = { ...gameState.scores.casualties };
        }
        
        if (gameState.militaryUnits) {
            this.gameState = { ...gameState.militaryUnits };
        }
        
        // Importer le système de cartes
        if (gameState.cardSystem) {
            if (gameState.cardSystem.deckZone) {
                this.cardSystem.deckZone = gameState.cardSystem.deckZone;
                this.updateDeckZoneStatus();
            }
            
            if (gameState.cardSystem.sequenceZone) {
                this.cardSystem.sequenceZone = gameState.cardSystem.sequenceZone;
            }
            
            // Restaurer les cartes actuelles
            if (gameState.cardSystem.currentDeckCard) {
                const deckCardData = gameState.cardSystem.currentDeckCard;
                this.cardSystem.currentDeckCard = this.cardSystem.allCards.find(card => 
                    card.fileName === deckCardData.fileName
                );
            }
            
            if (gameState.cardSystem.currentSequenceCard) {
                const sequenceCardData = gameState.cardSystem.currentSequenceCard;
                this.cardSystem.currentSequenceCard = this.cardSystem.allCards.find(card => 
                    card.fileName === sequenceCardData.fileName
                );
            }
            
            this.updateCardStatus();
        }
        
        // Redessiner le plateau
        this.updateStatistics();
        this.draw();
    }

    draw() {
        console.log('🎨 Draw function called');
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Réinitialiser les grilles des territoires pour éviter les chevauchements
        this.territoryGrids = {};
        
        // Draw map scaled to canvas size
        if (this.mapImage.complete) {
            this.ctx.drawImage(this.mapImage, 0, 0, this.canvas.width, this.canvas.height);
        }

        // ZONES VISUELLES DÉSACTIVÉES - Garder seulement les bordures en pointillés des zones armies
        // (voir drawGridDebug() qui est appelé plus tard)

        // Draw units
        this.drawUnits();
        
        // Draw resource tokens
        this.drawResourceTokens();
        
        // Draw support tokens
        this.drawSupportTokens();
        
        // Draw casualty tokens
        this.drawCasualtyTokens();
        
        // Draw control tokens
        this.drawControlTokens();
        
        // Draw territory support tokens
        this.drawTerritorySupport();

        // Draw Indian villages
        this.drawIndianVillages();

        // Draw leaders
        this.drawLeaders();
        
        // Draw available villages indicator
        this.drawAvailableVillages();

        // Draw forts
        this.drawForts();
        
        // Draw available forts indicators
        this.drawAvailableForts();
        
        // Draw French Regulars
        this.drawFrenchRegulars();
        
        // Draw available French Regulars indicator
        this.drawAvailableFrenchRegulars();
        
        // Draw French Ships blockading ports
        this.drawFrenchShips();
        
        // Draw available French Ships and FNI dominance
        this.drawAvailableFrenchShips();
        
        // Draw French FNI dominance marker
        this.drawFrenchFNIDominance();
        
        // Draw British Troops
        this.drawBritishTroops();
        
        // Draw British reserve forces
        this.drawBritishReserves();
        
        // Draw Patriot Troops
        this.drawPatriotTroops();
        
        // Draw Patriot reserve forces
        this.drawPatriotReserves();
        
        // Draw Indian War Parties
        this.drawIndianWarParties();
        
        // Draw Indian reserve forces
        this.drawIndianReserves();
        
        // Draw raid and propaganda markers
        this.drawRaidPropagandaMarkers();
        
        // FONCTION DE DEBUG : Dessiner les grilles pour visualiser le placement
        this.drawGridDebug();
        
        // Draw card zones
        this.drawCardZones();
        // this.drawTerritoryZones(); // DÉSACTIVÉ - Ne plus dessiner les zones propagande/raid

        // Draw turn tokens
        this.drawTurnTokens();
        
        // Draw score zones when dragging support/casualty tokens
        this.drawScoreZones();
    }

    drawResourceTokens() {
        if (!this.allZones?.score?.data) return;

        // Group factions by score to detect overlaps
        const tokensByScore = {};
        Object.entries(this.resourceTokens).forEach(([faction, score]) => {
            if (score >= 0 && score <= 50) {
                if (!tokensByScore[score]) tokensByScore[score] = [];
                tokensByScore[score].push(faction);
            }
        });

        // Draw tokens for each score
        Object.entries(tokensByScore).forEach(([score, factions]) => {
            const scoreData = this.allZones.score.data[score];
            if (!scoreData || !scoreData.resources) return;

            const resourceZone = scoreData.resources;
            let zone = resourceZone;
            
            // Convert coordinates if needed
            if (resourceZone.x1 !== undefined) {
                zone = {
                    x: resourceZone.x1,
                    y: resourceZone.y1,
                    width: resourceZone.x2 - resourceZone.x1,
                    height: resourceZone.y2 - resourceZone.y1
                };
            }
            
            // Scale coordinates to match canvas
            zone = {
                x: zone.x * this.scaleX,
                y: zone.y * this.scaleY,
                width: zone.width * this.scaleX,
                height: zone.height * this.scaleY
            };

            // Calculate subdivision if multiple tokens at same score
            const tokenCount = factions.length;
            const tokensPerRow = Math.ceil(Math.sqrt(tokenCount));
            const tokenWidth = zone.width / tokensPerRow;
            const tokenHeight = zone.height / Math.ceil(tokenCount / tokensPerRow);
            
            factions.forEach((faction, index) => {
                const row = Math.floor(index / tokensPerRow);
                const col = index % tokensPerRow;
                
                const tokenX = zone.x + col * tokenWidth;
                const tokenY = zone.y + row * tokenHeight;
                const tokenSize = Math.min(tokenWidth * 0.9, tokenHeight * 0.9, 50);
                
                // Draw the resource token image if loaded
                const tokenImage = this.resourceTokenImages[faction];
                if (tokenImage && tokenImage.complete) {
                    const centerX = tokenX + tokenWidth / 2 - tokenSize / 2;
                    const centerY = tokenY + tokenHeight / 2 - tokenSize / 2;
                    this.ctx.drawImage(tokenImage, centerX, centerY, tokenSize, tokenSize);
                } else {
                    // Fallback to circle if image not loaded
                    const centerX = tokenX + tokenWidth / 2;
                    const centerY = tokenY + tokenHeight / 2;
                    
                    const factionColors = {
                        patriots: '#0066ff',
                        british: '#dc3545', 
                        french: '#6f42c1',
                        indians: '#fd7e14'
                    };
                    
                    this.ctx.fillStyle = factionColors[faction];
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, tokenSize / 2, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // Draw faction letter
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = `${Math.floor(tokenSize * 0.4)}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    const factionLetter = faction.charAt(0).toUpperCase();
                    this.ctx.fillText(factionLetter, centerX, centerY);
                }
            });
        });
    }

    drawSupportTokens() {
        if (!this.allZones?.score?.data) return;

        // Group support tokens by score to detect overlaps
        const tokensByScore = {};
        Object.entries(this.supportTokens).forEach(([faction, score]) => {
            if (score >= 0 && score <= 50) {
                if (!tokensByScore[score]) tokensByScore[score] = [];
                tokensByScore[score].push(faction);
            }
        });

        // Draw tokens for each score on support zones (blue zones)
        Object.entries(tokensByScore).forEach(([score, factions]) => {
            const scoreData = this.allZones.score.data[score];
            if (!scoreData || !scoreData.support) return;

            const supportZone = scoreData.support;
            let zone = supportZone;
            
            // Convert coordinates if needed
            if (supportZone.x1 !== undefined) {
                zone = {
                    x: supportZone.x1,
                    y: supportZone.y1,
                    width: supportZone.x2 - supportZone.x1,
                    height: supportZone.y2 - supportZone.y1
                };
            }
            
            // Scale coordinates to match canvas
            zone = {
                x: zone.x * this.scaleX,
                y: zone.y * this.scaleY,
                width: zone.width * this.scaleX,
                height: zone.height * this.scaleY
            };

            // Calculate subdivision if multiple tokens at same score
            const tokenCount = factions.length;
            const tokensPerRow = Math.ceil(Math.sqrt(tokenCount));
            const tokenWidth = zone.width / tokensPerRow;
            const tokenHeight = zone.height / Math.ceil(tokenCount / tokensPerRow);
            
            factions.forEach((faction, index) => {
                const row = Math.floor(index / tokensPerRow);
                const col = index % tokensPerRow;
                
                const tokenX = zone.x + col * tokenWidth;
                const tokenY = zone.y + row * tokenHeight;
                const tokenSize = Math.min(tokenWidth * 0.9, tokenHeight * 0.9, 50);
                
                // Draw the support token image if loaded
                const tokenImage = this.supportTokenImages[faction];
                if (tokenImage && tokenImage.complete) {
                    const centerX = tokenX + tokenWidth / 2 - tokenSize / 2;
                    const centerY = tokenY + tokenHeight / 2 - tokenSize / 2;
                    this.ctx.drawImage(tokenImage, centerX, centerY, tokenSize, tokenSize);
                } else {
                    // Fallback to square if image not loaded
                    const centerX = tokenX + tokenWidth / 2;
                    const centerY = tokenY + tokenHeight / 2;
                    
                    const factionColors = {
                        patriots: '#ff8800',  // Orange for opposition
                        british: '#0088ff'    // Blue for support
                    };
                    
                    this.ctx.fillStyle = factionColors[faction];
                    this.ctx.fillRect(centerX - tokenSize/2, centerY - tokenSize/2, tokenSize, tokenSize);
                    
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(centerX - tokenSize/2, centerY - tokenSize/2, tokenSize, tokenSize);
                    
                    // Draw faction letter
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = `${Math.floor(tokenSize * 0.4)}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    const factionLetter = faction === 'patriots' ? 'O' : 'S'; // Opposition/Support
                    this.ctx.fillText(factionLetter, centerX, centerY);
                }
            });
        });
    }

    drawCasualtyTokens() {
        if (!this.allZones?.score?.data) return;

        // Group casualty tokens by score to detect overlaps
        const tokensByScore = {};
        Object.entries(this.casualtyTokens).forEach(([faction, score]) => {
            if (score >= 0 && score <= 50) {
                if (!tokensByScore[score]) tokensByScore[score] = [];
                tokensByScore[score].push(faction);
            }
        });

        // Draw tokens for each score on casualties zones (black zones)
        Object.entries(tokensByScore).forEach(([score, factions]) => {
            const scoreData = this.allZones.score.data[score];
            if (!scoreData || !scoreData.casualties) return;

            const casualtyZone = scoreData.casualties;
            let zone = casualtyZone;
            
            // Convert coordinates if needed
            if (casualtyZone.x1 !== undefined) {
                zone = {
                    x: casualtyZone.x1,
                    y: casualtyZone.y1,
                    width: casualtyZone.x2 - casualtyZone.x1,
                    height: casualtyZone.y2 - casualtyZone.y1
                };
            }
            
            // Scale coordinates to match canvas
            zone = {
                x: zone.x * this.scaleX,
                y: zone.y * this.scaleY,
                width: zone.width * this.scaleX,
                height: zone.height * this.scaleY
            };

            // Calculate subdivision if multiple tokens at same score
            const tokenCount = factions.length;
            const tokensPerRow = Math.ceil(Math.sqrt(tokenCount));
            const tokenWidth = zone.width / tokensPerRow;
            const tokenHeight = zone.height / Math.ceil(tokenCount / tokensPerRow);
            
            factions.forEach((faction, index) => {
                const row = Math.floor(index / tokensPerRow);
                const col = index % tokensPerRow;
                
                const tokenX = zone.x + col * tokenWidth;
                const tokenY = zone.y + row * tokenHeight;
                const tokenSize = Math.min(tokenWidth * 0.9, tokenHeight * 0.9, 50);
                
                // Draw the casualty token image if loaded
                const tokenImage = this.casualtyTokenImages[faction];
                if (tokenImage && tokenImage.complete) {
                    const centerX = tokenX + tokenWidth / 2 - tokenSize / 2;
                    const centerY = tokenY + tokenHeight / 2 - tokenSize / 2;
                    this.ctx.drawImage(tokenImage, centerX, centerY, tokenSize, tokenSize);
                } else {
                    // Fallback to diamond shape if image not loaded
                    const centerX = tokenX + tokenWidth / 2;
                    const centerY = tokenY + tokenHeight / 2;
                    
                    const factionColors = {
                        patriots: '#800000',  // Dark red for rebellion casualties
                        british: '#404040'    // Dark gray for british casualties
                    };
                    
                    // Draw diamond shape for casualties
                    this.ctx.fillStyle = factionColors[faction];
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX, centerY - tokenSize/2);
                    this.ctx.lineTo(centerX + tokenSize/2, centerY);
                    this.ctx.lineTo(centerX, centerY + tokenSize/2);
                    this.ctx.lineTo(centerX - tokenSize/2, centerY);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // Draw faction letter
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = `${Math.floor(tokenSize * 0.4)}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    const factionLetter = faction.charAt(0).toUpperCase();
                    this.ctx.fillText(factionLetter, centerX, centerY);
                }
            });
        });
    }

    drawControlTokens() {
        if (!this.allZones?.territories?.data) return;

        // Draw control tokens on territories/cities
        Object.entries(this.controlTokens).forEach(([territory, faction]) => {
            const territoryData = this.allZones.territories.data[territory];
            if (!territoryData || !territoryData.control) return;

            const controlZone = territoryData.control;
            let zone = controlZone;
            
            // Convert coordinates if needed
            if (controlZone.x1 !== undefined) {
                zone = {
                    x: controlZone.x1,
                    y: controlZone.y1,
                    width: controlZone.x2 - controlZone.x1,
                    height: controlZone.y2 - controlZone.y1
                };
            }
            
            // Scale coordinates to match canvas
            zone = {
                x: zone.x * this.scaleX,
                y: zone.y * this.scaleY,
                width: zone.width * this.scaleX,
                height: zone.height * this.scaleY
            };

            const tokenSize = Math.min(zone.width * 0.9, zone.height * 0.9, 60);
            const centerX = zone.x + zone.width / 2 - tokenSize / 2;
            const centerY = zone.y + zone.height / 2 - tokenSize / 2;

            // Draw the control token image if loaded
            const tokenImage = this.controlTokenImages[faction];
            if (tokenImage && tokenImage.complete) {
                this.ctx.drawImage(tokenImage, centerX, centerY, tokenSize, tokenSize);
            } else {
                // Fallback to hexagon if image not loaded
                const hexCenterX = centerX + tokenSize / 2;
                const hexCenterY = centerY + tokenSize / 2;
                const radius = tokenSize * 0.4;
                
                const factionColors = {
                    patriots: '#4CAF50',  // Green for patriots control
                    british: '#F44336'    // Red for british control
                };
                
                // Draw hexagon for control
                this.ctx.fillStyle = factionColors[faction];
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const x = hexCenterX + radius * Math.cos(angle);
                    const y = hexCenterY + radius * Math.sin(angle);
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Draw faction letter
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = `${Math.floor(tokenSize * 0.3)}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                const factionLetter = faction.charAt(0).toUpperCase();
                this.ctx.fillText(factionLetter, hexCenterX, hexCenterY);
            }
        });
    }

    drawUnits() {
        for (const [territoryName, territory] of Object.entries(this.gameState)) {
            if (!this.zones[territoryName]?.armies) continue;
            
            const zone = this.zones[territoryName].armies;
            let unitIndex = 0;
            
            for (const [faction, units] of Object.entries(territory)) {
                for (const [unitType, count] of Object.entries(units)) {
                    if (count > 0 && this.unitImages[faction]?.[unitType]?.complete) {
                        const img = this.unitImages[faction][unitType];
                        
                        // Calculate position within territory zone
                        const unitsPerRow = Math.ceil(Math.sqrt(Object.keys(territory).length * 2));
                        const row = Math.floor(unitIndex / unitsPerRow);
                        const col = unitIndex % unitsPerRow;
                        
                        const unitSize = Math.min(zone.width / unitsPerRow, zone.height / 3, 30);
                        const x = zone.x + col * (unitSize + 2);
                        const y = zone.y + row * (unitSize + 2);
                        
                        // Draw unit image
                        this.ctx.drawImage(img, x, y, unitSize, unitSize);
                        
                        // Draw quantity if > 1 (compteur en dehors de la grille)
                        if (count > 1) {
                            // Position du compteur : position modérée
                            const circleRadius = 8;
                            const counterX = x + unitSize - circleRadius + 2; // Position intermédiaire
                            const counterY = y + circleRadius - 2; // Position intermédiaire
                            
                            // Dessiner le cercle coloré
                            this.ctx.fillStyle = faction === 'patriots' ? '#0066ff' : 
                                                faction === 'british' ? '#dc3545' : 
                                                faction === 'french' ? 'white' : '#8B4513';
                            this.ctx.beginPath();
                            this.ctx.arc(counterX, counterY, circleRadius, 0, 2 * Math.PI);
                            this.ctx.fill();
                            
                            // Dessiner le nombre selon la faction
                            this.ctx.fillStyle = faction === 'french' ? 'black' : 'white';
                            this.ctx.font = 'bold 10px Arial';
                            this.ctx.textAlign = 'center';
                            this.ctx.fillText(count.toString(), counterX, counterY + circleRadius * 0.3);
                        }
                        
                        unitIndex++;
                    }
                }
            }
        }
    }

    placeRandomTerritorySupport() {
        // Support levels: active_support (+2 British), passive_support (+1 British), 
        // neutral (0), passive_opposition (+1 Patriots), active_opposition (+2 Patriots)
        const supportLevels = [
            { name: 'active_support', value: 2, faction: 'british', image: 'support_active' },
            { name: 'passive_support', value: 1, faction: 'british', image: 'support_passive' },
            { name: 'neutral', value: 0, faction: null, image: null },
            { name: 'passive_opposition', value: 1, faction: 'patriots', image: 'opposition_passive' },
            { name: 'active_opposition', value: 2, faction: 'patriots', image: 'opposition_active' }
        ];

        let totalBritishSupport = 0;
        let totalPatriotsOpposition = 0;

        // Get all territories that have support zones from the territories data
        const territories = this.allZones.territories?.data || {};
        for (const territoryName in territories) {
            if (territories[territoryName].support) {
                // Randomly assign support level
                const randomLevel = supportLevels[Math.floor(Math.random() * supportLevels.length)];
                
                // Store territory support information
                this.territorySupport[territoryName] = {
                    level: randomLevel.name,
                    value: randomLevel.value,
                    faction: randomLevel.faction,
                    image: randomLevel.image
                };

                // Add to totals
                if (randomLevel.faction === 'british') {
                    totalBritishSupport += randomLevel.value;
                } else if (randomLevel.faction === 'patriots') {
                    totalPatriotsOpposition += randomLevel.value;
                }

                console.log(`🏛️ ${territoryName}: ${randomLevel.name} (${randomLevel.faction ? randomLevel.faction : 'neutral'} +${randomLevel.value})`);
            }
        }

        // Update support totals and place tokens on score track
        this.supportCalculation = {
            british_support: totalBritishSupport,
            patriots_opposition: totalPatriotsOpposition
        };

        // Place support tokens on the score track (0-50)
        this.supportTokens.british = Math.min(totalBritishSupport, 50);
        this.supportTokens.patriots = Math.min(totalPatriotsOpposition, 50);

        console.log(`📊 Total British Support: ${totalBritishSupport} (placed at ${this.supportTokens.british})`);
        console.log(`📊 Total Patriots Opposition: ${totalPatriotsOpposition} (placed at ${this.supportTokens.patriots})`);
    }

    recalculateSupportScores() {
        console.log('🔄 Recalculating support scores from territory support...');
        
        let totalBritishSupport = 0;   // Points bleus
        let totalPatriotsOpposition = 0; // Points rouges

        // Parcourir tous les territoires avec support
        for (const [territoryName, supportData] of Object.entries(this.territorySupport)) {
            console.log(`🔍 Territory ${territoryName} supportData:`, supportData);
            if (supportData) {
                const image = supportData.image;
                const value = supportData.value || supportData; // Compatibilité ancien/nouveau format
                console.log(`🔍 Territory ${territoryName} image: ${image}, value: ${value}`);
                
                // Système de calcul basé sur les images (plus fiable)
                if (image === 'support_active') {
                    // Support_Active.png = +2 points bleus (britanniques)
                    totalBritishSupport += 2;
                    console.log(`🔵 ${territoryName}: Active Support (+2 blue points for British)`);
                } else if (image === 'support_passive') {
                    // Support_Passive.png = +1 point bleu (britannique)
                    totalBritishSupport += 1;
                    console.log(`🔵 ${territoryName}: Passive Support (+1 blue point for British)`);
                } else if (image === 'opposition_passive') {
                    // Opposition_Passive.png = +1 point rouge (patriote)
                    totalPatriotsOpposition += 1;
                    console.log(`🔴 ${territoryName}: Passive Opposition (+1 red point for Patriots)`);
                } else if (image === 'opposition_active') {
                    // Opposition_Active.png = +2 points rouges (patriotes)
                    totalPatriotsOpposition += 2;
                    console.log(`🔴 ${territoryName}: Active Opposition (+2 red points for Patriots)`);
                } else if (image === null || value === 0) {
                    console.log(`⚪ ${territoryName}: Neutral (0 points)`);
                } else {
                    // Fallback pour l'ancien système basé sur les valeurs
                    if (value === 2) {
                        totalBritishSupport += 2;
                        console.log(`🔵 ${territoryName}: Active Support (+2 blue points) [fallback]`);
                    } else if (value === 1) {
                        totalBritishSupport += 1;
                        console.log(`🔵 ${territoryName}: Passive Support (+1 blue point) [fallback]`);
                    } else if (value === -1) {
                        totalPatriotsOpposition += 1;
                        console.log(`🔴 ${territoryName}: Passive Opposition (+1 red point) [fallback]`);
                    } else if (value === -2) {
                        totalPatriotsOpposition += 2;
                        console.log(`🔴 ${territoryName}: Active Opposition (+2 red points) [fallback]`);
                    }
                }
            }
        }

        // Mettre à jour les totaux
        this.supportCalculation = {
            british_support: totalBritishSupport,
            patriots_opposition: totalPatriotsOpposition
        };

        // Placer les jetons sur la piste de score (0-50)
        this.supportTokens.british = Math.min(totalBritishSupport, 50);
        this.supportTokens.patriots = Math.min(totalPatriotsOpposition, 50);

        console.log(`📊 🔵 Total British Support (blue): ${totalBritishSupport} → position ${this.supportTokens.british}`);
        console.log(`📊 🔴 Total Patriots Opposition (red): ${totalPatriotsOpposition} → position ${this.supportTokens.patriots}`);
    }

    placeRandomIndianVillages() {
        console.log('🏕️ === Starting Indian village placement ===');
        
        // Reset villages
        this.indianVillages = {
            total: 12,
            placed: {},
            available: 12
        };

        // Get all territories with armies zones where villages can be placed
        const territories = this.allZones.territories?.data || {};
        
        // Cities where villages CANNOT be placed
        const cities = [
            'Boston', 'New York City', 'Philadelphia', 'Norfolk', 
            'Charles Town', 'Savannah', 'Quebec City'
        ];
        
        const availableTerritories = Object.keys(territories).filter(name => 
            territories[name].armies && !cities.includes(name)
        );
        
        console.log('🏙️ Cities excluded from village placement:', cities);
        console.log('🌲 Available territories for villages (excluding cities):', availableTerritories.length, availableTerritories);
        
        // Randomly place villages in territories (respecting the max 2 constructions per zone rule)
        const villagesToPlace = Math.min(8, this.indianVillages.total); // Place up to 8 villages on map
        let placedCount = 0;
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loop

        while (placedCount < villagesToPlace && attempts < maxAttempts) {
            attempts++;
            const randomTerritory = availableTerritories[Math.floor(Math.random() * availableTerritories.length)];
            
            // Check how many constructions (forts + villages) are already in this territory
            const existingConstructions = this.getConstructionsInTerritory(randomTerritory);
            
            if (existingConstructions < 2) { // Max 2 constructions per zone
                if (!this.indianVillages.placed[randomTerritory]) {
                    this.indianVillages.placed[randomTerritory] = 0;
                }
                
                // Add village (max 2 per territory)
                if (this.indianVillages.placed[randomTerritory] < 2) {
                    this.indianVillages.placed[randomTerritory]++;
                    placedCount++;
                    console.log(`🏕️ Village indien placé à ${randomTerritory} (${this.indianVillages.placed[randomTerritory]} villages)`);
                }
            }
        }

        // Update available villages count
        this.indianVillages.available = this.indianVillages.total - placedCount;
        console.log(`🏕️ Villages placés: ${placedCount}, Villages disponibles: ${this.indianVillages.available}`);
    }

    placeRandomForts() {
        console.log('🏰 === Starting fort placement ===');
        
        // Reset forts
        this.fortSystems = {
            patriots: {
                total: 7,
                placed: {},
                available: 6 // 0-6 available for placement
            },
            british: {
                total: 7,
                placed: {},
                available: 6 // 0-6 available for placement
            }
        };

        // Get all territories AND cities with armies zones (forts can be placed in both)
        const territories = this.allZones.territories?.data || {};
        const availableLocations = Object.keys(territories).filter(name => 
            territories[name].armies
        );
        
        console.log('🏰 Available locations for forts (territories + cities):', availableLocations.length, availableLocations);
        
        // Place forts for each faction
        ['patriots', 'british'].forEach(faction => {
            const fortsToPlace = Math.min(5, this.fortSystems[faction].total); // Place up to 5 forts on map per faction
            let placedCount = 0;
            let attempts = 0;
            const maxAttempts = 100;

            while (placedCount < fortsToPlace && attempts < maxAttempts) {
                attempts++;
                const randomLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
                
                // Check how many constructions (forts + villages) are already in this location
                const existingConstructions = this.getConstructionsInLocation(randomLocation);
                
                if (existingConstructions < 2) { // Max 2 constructions per zone
                    if (!this.fortSystems[faction].placed[randomLocation]) {
                        this.fortSystems[faction].placed[randomLocation] = 0;
                    }
                    
                    // Add fort (max 2 per location)
                    if (this.fortSystems[faction].placed[randomLocation] < 2) {
                        this.fortSystems[faction].placed[randomLocation]++;
                        placedCount++;
                        console.log(`🏰 Fort ${faction} placé à ${randomLocation} (${this.fortSystems[faction].placed[randomLocation]} forts)`);
                    }
                }
            }

            // Update available forts count (6 max available, so 6 - placedCount)
            this.fortSystems[faction].available = 6 - placedCount;
            console.log(`🏰 Forts ${faction} placés: ${placedCount}, Disponibles: ${this.fortSystems[faction].available}`);
        });
    }

    placeRandomFrenchRegulars() {
        console.log('⚔️ === Starting French Regulars placement ===');
        
        // Reset French Regulars
        this.frenchRegulars = {
            total: 15,
            placed: {},
            available: 15
        };

        // Get all territories with armies zones where French Regulars can be placed
        const territories = this.allZones.territories?.data || {};
        
        // French Regulars can be placed in any territory/city with armies zones
        const availableLocations = Object.keys(territories).filter(name => 
            territories[name].armies
        );
        
        console.log('⚔️ Available locations for French Regulars:', availableLocations.length, availableLocations);
        
        // Place French Regulars on map (up to 12 on map, rest go to available forces)
        const regularsToPlace = Math.min(12, this.frenchRegulars.total);
        let placedCount = 0;
        let attempts = 0;
        const maxAttempts = 100;

        while (placedCount < regularsToPlace && attempts < maxAttempts) {
            attempts++;
            const randomLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
            
            // French Regulars can be placed multiple per territory (up to 3 per location)
            if (!this.frenchRegulars.placed[randomLocation]) {
                this.frenchRegulars.placed[randomLocation] = 0;
            }
            
            // Add French Regular (max 3 per location)
            if (this.frenchRegulars.placed[randomLocation] < 3) {
                this.frenchRegulars.placed[randomLocation]++;
                placedCount++;
                console.log(`⚔️ French Regular placé à ${randomLocation} (${this.frenchRegulars.placed[randomLocation]} réguliers)`);
            }
        }

        // Update available French Regulars count (remaining go to available forces area)
        this.frenchRegulars.available = this.frenchRegulars.total - placedCount;
        console.log(`⚔️ French Regulars placés sur carte: ${placedCount}, Disponibles dans la zone des forces: ${this.frenchRegulars.available}`);
    }

    placeRandomFrenchShips() {
        console.log('🚢 === Starting French Ships placement ===');
        
        // Reset French Ships
        this.frenchShips = {
            total: 3,
            blockading: {},
            available: 3,
            dominancePoints: 0
        };

        console.log('🏖️ Port cities for blockade:', this.portCities);
        
        // Randomly decide how many ships to deploy for blockade (0-3)
        const shipsToBlockade = Math.floor(Math.random() * (this.frenchShips.total + 1)); // 0, 1, 2, or 3
        let deployedShips = 0;

        // Deploy ships to blockade port cities
        while (deployedShips < shipsToBlockade && this.portCities.length > 0) {
            const randomPortIndex = Math.floor(Math.random() * this.portCities.length);
            const portCity = this.portCities[randomPortIndex];
            
            // Check if this port city exists in territories (has armies zone)
            if (this.allZones?.territories?.data[portCity]?.armies) {
                if (!this.frenchShips.blockading[portCity]) {
                    this.frenchShips.blockading[portCity] = 0;
                }
                
                // Add one ship to blockade this port (only 1 ship per port for simplicity)
                if (this.frenchShips.blockading[portCity] === 0) {
                    this.frenchShips.blockading[portCity] = 1;
                    deployedShips++;
                    console.log(`🚢 French ship blockading ${portCity}`);
                }
            }
        }

        // Calculate dominance points (1 point per blockading ship)
        this.frenchShips.dominancePoints = deployedShips;
        this.frenchShips.available = this.frenchShips.total - deployedShips;

        console.log(`🚢 French Ships deployed for blockade: ${deployedShips}`);
        console.log(`⚓ French Ships available (ship1/2/3 zones): ${this.frenchShips.available}`);
        console.log(`🎯 French FNI dominance points: ${this.frenchShips.dominancePoints}`);
    }

    placeRandomBritishTroops() {
        console.log('🔴 === Starting British Troops placement ===');
        
        // Reset British troops
        this.britishTroops = {
            regulars: {
                total: 25,
                placed: {},
                available: 25
            },
            tories: {
                total: 25,
                placed: {},
                available: 25
            }
        };

        // Get all territories with armies zones where British troops can be placed
        const territories = this.allZones.territories?.data || {};
        const availableLocations = Object.keys(territories).filter(name => 
            territories[name].armies
        );
        
        console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Available locations for British troops:', availableLocations.length, availableLocations);
        
        // Place British Regulars (red cubes) - up to 20 on map, rest go to reserve
        this.placeTroopType('regulars', '🔴 British Regular', Math.min(20, this.britishTroops.regulars.total), availableLocations);
        
        // Place British Tories (green cubes) - up to 20 on map, rest go to reserve  
        this.placeTroopType('tories', '🟢 British Torie', Math.min(20, this.britishTroops.tories.total), availableLocations);

        console.log(`🔴 British Regulars: ${this.britishTroops.regulars.total - this.britishTroops.regulars.available} placés, ${this.britishTroops.regulars.available} en réserve`);
        console.log(`🟢 British Tories: ${this.britishTroops.tories.total - this.britishTroops.tories.available} placés, ${this.britishTroops.tories.available} en réserve`);
    }

    placeTroopType(troopType, troopLabel, maxToPlace, availableLocations) {
        let placedCount = 0;
        let attempts = 0;
        const maxAttempts = 100;

        while (placedCount < maxToPlace && attempts < maxAttempts && availableLocations.length > 0) {
            attempts++;
            const randomLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
            
            // Initialize location if not exists
            if (!this.britishTroops[troopType].placed[randomLocation]) {
                this.britishTroops[troopType].placed[randomLocation] = 0;
            }
            
            // Add troop (max 4 per location to avoid overcrowding)
            if (this.britishTroops[troopType].placed[randomLocation] < 4) {
                this.britishTroops[troopType].placed[randomLocation]++;
                placedCount++;
                console.log(`${troopLabel} placé à ${randomLocation} (${this.britishTroops[troopType].placed[randomLocation]} unités)`);
            }
        }

        // Update available count (remaining go to reserve)
        this.britishTroops[troopType].available = this.britishTroops[troopType].total - placedCount;
    }

    getConstructionsInTerritory(territoryName) {
        return this.getConstructionsInLocation(territoryName);
    }

    getConstructionsInLocation(locationName) {
        // Count forts and villages in this location (territory or city)
        let constructions = 0;
        
        // Count Indian villages
        if (this.indianVillages.placed[locationName]) {
            constructions += this.indianVillages.placed[locationName];
        }
        
        // Count Patriots forts
        if (this.fortSystems.patriots.placed[locationName]) {
            constructions += this.fortSystems.patriots.placed[locationName];
        }
        
        // Count British forts
        if (this.fortSystems.british.placed[locationName]) {
            constructions += this.fortSystems.british.placed[locationName];
        }
        
        // Count forts from gameState (if any)
        if (this.gameState[locationName]) {
            Object.entries(this.gameState[locationName]).forEach(([faction, units]) => {
                if (units.Fort) {
                    constructions += units.Fort;
                }
            });
        }
        
        return constructions;
    }

    drawTerritorySupport() {
        if (!this.allZones?.territories?.data) {
            console.log('⚠️ Territory zones not loaded yet');
            return;
        }

        const territories = this.allZones.territories.data;
        let drawnCount = 0;

        for (const [territoryName, supportData] of Object.entries(this.territorySupport)) {
            // Gérer l'ancien format (nombre) et le nouveau format (objet)
            const imageKey = typeof supportData === 'object' ? supportData.image : null;

            if (!imageKey || !territories[territoryName]?.support) {
                if (typeof supportData === 'number') {
                    console.warn(`⚠️ Ancien format de support détecté pour ${territoryName}: ${supportData}`);
                }
                continue;
            }

            const zone = territories[territoryName].support;
            const img = this.territorySupportImages[imageKey];

            if (img && img.complete) {
                // Convert zone coordinates
                const zoneRect = this.convertZone(zone);

                // Calculate token size and position
                const tokenSize = Math.min(zoneRect.width, zoneRect.height, 40);
                const x = zoneRect.x + (zoneRect.width - tokenSize) / 2;
                const y = zoneRect.y + (zoneRect.height - tokenSize) / 2;

                // Draw support token
                this.ctx.drawImage(img, x, y, tokenSize, tokenSize);
                drawnCount++;
            }
        }

        if (drawnCount > 0) {
            console.log(`✅ ${drawnCount} jetons de support/opposition dessinés`);
        }
    }

    drawIndianVillages() {
        console.log('🏕️ Drawing Indian villages...');

        for (const [territoryName, villageCount] of Object.entries(this.indianVillages.placed)) {
            if (villageCount > 0) {
                this.drawUnitInTerritory(
                    territoryName,
                    'indians',
                    'Villages',
                    this.villageImages.village,
                    '#8B4513',
                    villageCount,
                    true
                );
            }
        }
    }

    drawLeaders() {
        if (!this.allZones?.territories?.data) {
            return;
        }

        let drawnCount = 0;

        for (const [territoryName, leaders] of Object.entries(this.leaders)) {
            if (!leaders || leaders.length === 0) continue;

            leaders.forEach(leaderName => {
                const leaderKey = leaderName.toLowerCase().replace(/ /g, ' '); // Keep spaces as is for "dragging canoe"
                const img = this.leaderImages[leaderKey];

                if (img && img.complete) {
                    // Utiliser le système de grille comme les autres unités
                    this.drawUnitInTerritory(
                        territoryName,
                        'leader',
                        leaderName,
                        img,
                        '#FFD700', // Gold color as fallback
                        1,
                        false
                    );
                    drawnCount++;
                }
            });
        }

        if (drawnCount > 0) {
            console.log(`✅ ${drawnCount} leaders dessinés`);
        }
    }

    drawAvailableVillages() {
        // Draw available villages indicator on the indian_villages zones
        if (!this.allZones || !this.allZones.forces || !this.allZones.forces.data || !this.allZones.forces.data.indian_villages) return;

        const villageZones = this.allZones.forces.data.indian_villages;
        const available = this.indianVillages.available;
        
        console.log(`🏕️ Drawing available villages counter: ${available} villages remaining`);
        
        // Use the zone corresponding to the number of available villages
        // If 4 available, use zone "4", if 0 available, use zone "0", etc.
        const targetZone = villageZones[available.toString()];
        if (targetZone) {
            const zoneRect = this.convertZone(targetZone);
            
            // Draw a simple indicator dot with number
            const centerX = zoneRect.x + zoneRect.width / 2;
            const centerY = zoneRect.y + zoneRect.height / 2;
            
            // Draw background circle
            this.ctx.fillStyle = available > 0 ? '#8B4513' : '#666666'; // Brown if available, gray if none
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw number
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(available.toString(), centerX, centerY);
            
            console.log(`✅ Available villages counter placed on zone ${available}`);
        } else {
            console.log(`❌ No zone found for ${available} available villages`);
        }
    }

    drawForts() {
        console.log('🏰 Drawing forts...');
        
        ['patriots', 'british'].forEach(faction => {
            const factionForts = this.fortSystems[faction].placed;
            const fortImage = this.fortImages[faction];
            
            if (!fortImage || !fortImage.complete) {
                console.log(`❌ Fort image not loaded for ${faction}`);
                return;
            }

            for (const [locationName, fortCount] of Object.entries(factionForts)) {
                console.log(`🏰 Processing ${locationName}: ${fortCount} ${faction} forts`);
                
                if (fortCount > 0) {
                    this.drawUnitInTerritory(
                        locationName, 
                        faction, 
                        'Forts', 
                        fortImage, 
                        '#666666', 
                        fortCount, 
                        true
                    );
                }
            }
        });
    }

    drawAvailableForts() {
        console.log('🏰 Drawing available forts counters...');

        if (!this.allZones || !this.allZones.forces || !this.allZones.forces.data) return;

        ['patriots', 'british'].forEach(faction => {
            const available = this.fortSystems[faction].available;
            
            // Get the appropriate fort zones
            const fortZones = faction === 'patriots' ? 
                this.allZones.forces.data.patriot_forts : 
                this.allZones.forces.data.british_forts;
            
            if (!fortZones) {
                console.log(`❌ No fort zones found for ${faction}`);
                return;
            }
            
            console.log(`🏰 Drawing available ${faction} forts counter: ${available} forts remaining`);
            
            // Use the zone corresponding to the number of available forts
            const targetZone = fortZones[available.toString()];
            if (targetZone) {
                const zoneRect = this.convertZone(targetZone);
                
                // Draw indicator with faction colors
                const centerX = zoneRect.x + zoneRect.width / 2;
                const centerY = zoneRect.y + zoneRect.height / 2;
                
                // Draw background circle with faction color
                this.ctx.fillStyle = available > 0 ? 
                    (faction === 'patriots' ? '#0066ff' : '#cc0000') : '#666666';
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Draw number
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(available.toString(), centerX, centerY);
                
                console.log(`✅ Available ${faction} forts counter placed on zone ${available}`);
            } else {
                console.log(`❌ No zone found for ${available} available ${faction} forts`);
            }
        });
    }

    drawFrenchRegulars() {
        console.log('⚔️ Drawing French Regulars...');
        
        for (const [locationName, regularCount] of Object.entries(this.frenchRegulars.placed)) {
            if (regularCount > 0) {
                this.drawUnitInTerritory(
                    locationName, 
                    'french', 
                    'Regulars', 
                    this.unitImages.french?.Regulars, 
                    '#6f42c1', 
                    regularCount, 
                    true
                );
            }
        }
    }

    drawAvailableFrenchRegulars() {
        console.log('⚔️ Drawing available French Regulars counter...');
        
        if (!this.allZones.forces?.data?.faction_forces?.french) {
            console.log('❌ No French forces zone found');
            return;
        }

        const available = this.frenchRegulars.available;
        const frenchZone = this.allZones.forces.data.faction_forces.french;
        
        console.log(`⚔️ Drawing available French Regulars counter: ${available} regulars in forces zone`);
        
        const zoneRect = this.convertZone(frenchZone);
        
        // Draw French Regulars reserve using real image
        const centerX = zoneRect.x + zoneRect.width / 2;
        const centerY = zoneRect.y + zoneRect.height / 2;
        
        if (available > 0) {
            this.drawReserveUnit(centerX - 12, centerY - 12, this.frenchRegularsImage, '#6f42c1', available, 'French Regulars', 'white', 'black');
        }
        
        console.log(`✅ Available French Regulars counter placed in French forces zone: ${available}`);
    }

    drawFrenchShips() {
        console.log('🚢 Drawing French Ships blockading ports...');
        
        const territories = this.allZones.territories?.data || {};
        const frenchBlockadeImage = this.frenchBoatImages.blockade;
        
        for (const [portCity, shipCount] of Object.entries(this.frenchShips.blockading)) {
            console.log(`🚢 Processing ${portCity}: ${shipCount} French ship(s) blockading`);
            
            if (shipCount > 0 && territories[portCity]?.armies) {
                console.log(`✅ Port city ${portCity} has armies zone, drawing blockading ship`);
                
                const zone = territories[portCity].armies;
                const zoneRect = this.convertZone(zone);
                
                // Position ship to the RIGHT of the armies zone as requested
                const shipWidth = Math.min(50, zoneRect.width * 0.6); // Doubler la largeur (25 -> 50)
                const shipHeight = Math.min(100, zoneRect.height * 1.2); // Doubler la hauteur (50 -> 100)
                const x = zoneRect.x + zoneRect.width + 5; // Right side of armies zone
                const y = zoneRect.y + (zoneRect.height - shipHeight) / 2; // Center vertically
                
                console.log(`🎨 Drawing French blockade ship at (${x}, ${y}) size ${shipWidth}x${shipHeight}`);
                
                // Draw the French blockade image if loaded (taller proportion)
                if (frenchBlockadeImage && frenchBlockadeImage.complete && frenchBlockadeImage.naturalWidth > 0) {
                    this.ctx.drawImage(frenchBlockadeImage, x, y, shipWidth, shipHeight);
                    console.log(`✅ French blockade image drawn blockading ${portCity}`);
                } else {
                    // Fallback to drawing a simple ship shape if image not loaded
                    console.log(`⚠️ French blockade image not loaded, using fallback for ${portCity}`);
                    
                    this.ctx.fillStyle = '#6f42c1'; // French purple
                    this.ctx.beginPath();
                    // Draw simple boat shape (taller)
                    this.ctx.ellipse(x + shipWidth/2, y + shipHeight/2, shipWidth/2, shipHeight/4, 0, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    // Draw mast
                    this.ctx.strokeStyle = '#333333';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + shipWidth/2, y + shipHeight/4);
                    this.ctx.lineTo(x + shipWidth/2, y);
                    this.ctx.stroke();
                    
                    // Draw sail
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillRect(x + shipWidth/2 - 6, y, 6, shipHeight/4);
                    
                    // Draw border
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x, y, shipWidth, shipHeight);
                }
            }
        }
    }

    drawAvailableFrenchShips() {
        console.log('🚢 Drawing available French Ships on ship zones...');
        
        if (!this.allZones.forces?.data?.french_ships) {
            console.log('❌ No French ships zones found');
            return;
        }

        const available = this.frenchShips.available;
        const shipZones = this.allZones.forces.data.french_ships;
        const frenchSquadronImage = this.frenchBoatImages.squadron;
        
        console.log(`🚢 Drawing ${available} available French ships on ship zones`);
        
        // Place ships on ship1, ship2, ship3 zones based on availability
        let shipsToPlace = available;
        const shipZoneNames = ['ship1', 'ship2', 'ship3'];
        
        shipZoneNames.forEach((shipZoneName, index) => {
            if (shipsToPlace > 0 && shipZones[shipZoneName]) {
                const zoneRect = this.convertZone(shipZones[shipZoneName]);
                
                // Calculate position and size - wider for squadron (doubled)
                const centerX = zoneRect.x + zoneRect.width / 2;
                const centerY = zoneRect.y + zoneRect.height / 2;
                const shipWidth = Math.min(zoneRect.width * 1.8, 90); // Doubler la largeur (45 -> 90)
                const shipHeight = Math.min(zoneRect.height * 1.2, 50); // Doubler la hauteur (25 -> 50)
                
                // Draw the French squadron image if loaded (wider proportion)
                if (frenchSquadronImage && frenchSquadronImage.complete && frenchSquadronImage.naturalWidth > 0) {
                    this.ctx.drawImage(frenchSquadronImage, 
                        centerX - shipWidth/2, centerY - shipHeight/2, 
                        shipWidth, shipHeight);
                    console.log(`✅ French squadron image placed on ${shipZoneName} (${shipWidth}x${shipHeight})`);
                } else {
                    // Fallback to drawing a simple ship shape if image not loaded (wider)
                    console.log(`⚠️ French squadron image not loaded, using fallback for ${shipZoneName}`);
                    
                    this.ctx.fillStyle = '#6f42c1'; // French purple
                    this.ctx.beginPath();
                    this.ctx.ellipse(centerX, centerY, shipWidth/2, shipHeight/2, 0, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    // Draw border
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                }
                
                shipsToPlace--;
            }
        });
    }

    drawFrenchFNIDominance() {
        console.log('🎯 Drawing French FNI dominance marker...');
        
        if (!this.allZones.forces?.data?.french_fni) {
            console.log('❌ No French FNI zones found');
            return;
        }

        const dominancePoints = this.frenchShips.dominancePoints;
        const fniZones = this.allZones.forces.data.french_fni;
        const fniLevelImage = this.frenchBoatImages.fniLevel;
        
        console.log(`🎯 French FNI dominance points: ${dominancePoints}`);
        
        // Place FNI marker on the appropriate zone (0, 1, 2, or 3)
        const targetZone = fniZones[dominancePoints.toString()];
        if (targetZone) {
            const zoneRect = this.convertZone(targetZone);
            
            // Draw FNI dominance marker
            const centerX = zoneRect.x + zoneRect.width / 2;
            const centerY = zoneRect.y + zoneRect.height / 2;
            const markerSize = Math.min(zoneRect.width * 0.8, zoneRect.height * 0.8, 40);
            
            // Draw the FNI Level image if loaded
            if (fniLevelImage && fniLevelImage.complete && fniLevelImage.naturalWidth > 0) {
                this.ctx.drawImage(fniLevelImage, 
                    centerX - markerSize/2, centerY - markerSize/2, 
                    markerSize, markerSize);
                console.log(`✅ FNI Level image placed on zone ${dominancePoints}`);
            } else {
                // Fallback to drawing a rectangle if image not loaded
                console.log(`⚠️ FNI Level image not loaded, using fallback for zone ${dominancePoints}`);
                
                // Draw background rectangle
                this.ctx.fillStyle = dominancePoints > 0 ? '#6f42c1' : '#666666'; // Purple if active, gray if zero
                this.ctx.fillRect(centerX - 20, centerY - 12, 40, 24);
                
                // Draw border
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(centerX - 20, centerY - 12, 40, 24);
                
                // Draw "FNI" text and points
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`FNI ${dominancePoints}`, centerX, centerY);
            }
            
            console.log(`✅ French FNI marker placed on zone ${dominancePoints}`);
        } else {
            console.log(`❌ No FNI zone found for ${dominancePoints} points`);
        }
    }

    drawBritishTroops() {
        console.log('🔴 Drawing British Troops...');
        
        // Draw British Regulars first
        this.drawTroopType('regulars', '🔴', '#dc3545');
        
        // Draw British Tories
        this.drawTroopType('tories', '🟢', '#28a745');
    }

    drawTroopType(troopType, emoji, color) {
        for (const [locationName, troopCount] of Object.entries(this.britishTroops[troopType].placed)) {
            console.log(`${emoji} Processing ${locationName}: ${troopCount} British ${troopType}`);
            
            if (troopCount > 0) {
                const troopImage = this.britishTroopImages[troopType];
                const troopName = troopType === 'regulars' ? 'Regulars' : 'Tories';
                
                this.drawUnitInTerritory(
                    locationName, 
                    'british', 
                    troopName, 
                    troopImage, 
                    color, 
                    troopCount, 
                    true
                );
            }
        }
    }

    getOccupiedPositions(locationName, zoneRect) {
        const occupied = [];
        const unitSize = 25;
        
        // Check for Indian villages
        if (this.indianVillages.placed[locationName] > 0) {
            // Villages are in top-left
            occupied.push({
                x: zoneRect.x + 5,
                y: zoneRect.y + 5,
                width: unitSize,
                height: unitSize,
                type: 'village'
            });
        }
        
        // Check for forts
        ['patriots', 'british'].forEach(faction => {
            if (this.fortSystems[faction].placed[locationName] > 0) {
                let x, y;
                if (faction === 'patriots') {
                    // Patriots forts are in bottom-left
                    x = zoneRect.x + 5;
                    y = zoneRect.y + zoneRect.height - unitSize - 5;
                } else {
                    // British forts are in top-left  
                    x = zoneRect.x + 5;
                    y = zoneRect.y + 5;
                }
                
                occupied.push({
                    x: x,
                    y: y,
                    width: unitSize,
                    height: unitSize,
                    type: `${faction}_fort`
                });
            }
        });
        
        // Check for French Regulars
        if (this.frenchRegulars.placed[locationName] > 0) {
            // French Regulars are in bottom-right
            occupied.push({
                x: zoneRect.x + zoneRect.width - unitSize - 5,
                y: zoneRect.y + zoneRect.height - unitSize - 5,
                width: unitSize,
                height: unitSize,
                type: 'french_regulars'
            });
        }
        
        // Add temporarily occupied positions (for British troops being drawn)
        if (this.tempOccupiedPositions && this.tempOccupiedPositions[locationName]) {
            occupied.push(...this.tempOccupiedPositions[locationName]);
        }
        
        return occupied;
    }

    findAvailablePosition(zoneRect, occupiedPositions, unitSize) {
        // Define potential positions (grid-based placement)
        const margin = 5;
        const positions = [
            // Bottom-left (preferred for British troops)
            { x: zoneRect.x + margin, y: zoneRect.y + zoneRect.height - unitSize - margin },
            // Center-left
            { x: zoneRect.x + margin, y: zoneRect.y + (zoneRect.height - unitSize) / 2 },
            // Center-center
            { x: zoneRect.x + (zoneRect.width - unitSize) / 2, y: zoneRect.y + (zoneRect.height - unitSize) / 2 },
            // Center-bottom
            { x: zoneRect.x + (zoneRect.width - unitSize) / 2, y: zoneRect.y + zoneRect.height - unitSize - margin },
            // Top-center
            { x: zoneRect.x + (zoneRect.width - unitSize) / 2, y: zoneRect.y + margin },
            // Any other available space
            { x: zoneRect.x + margin * 2 + unitSize, y: zoneRect.y + zoneRect.height - unitSize - margin }
        ];
        
        // Find first available position
        for (const pos of positions) {
            if (this.isPositionAvailable(pos, occupiedPositions, unitSize)) {
                return pos;
            }
        }
        
        return null; // No available position found
    }

    isPositionAvailable(position, occupiedPositions, unitSize) {
        const newRect = {
            x: position.x,
            y: position.y,
            width: unitSize,
            height: unitSize
        };
        
        // Check collision with occupied positions
        for (const occupied of occupiedPositions) {
            if (this.rectanglesOverlap(newRect, occupied)) {
                return false;
            }
        }
        
        return true;
    }

    rectanglesOverlap(rect1, rect2) {
        return !(rect1.x + rect1.width <= rect2.x || 
                rect2.x + rect2.width <= rect1.x || 
                rect1.y + rect1.height <= rect2.y || 
                rect2.y + rect2.height <= rect1.y);
    }

    drawBritishReserves() {
        console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Drawing British reserve forces...');
        
        if (!this.allZones.forces?.data?.faction_forces?.british) {
            console.log('❌ No British forces zone found');
            return;
        }

        const britishZone = this.allZones.forces.data.faction_forces.british;
        const zoneRect = this.convertZone(britishZone);
        
        console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 Drawing British reserves in forces zone`);
        
        // Position for reserves display
        const centerX = zoneRect.x + zoneRect.width / 2;
        const centerY = zoneRect.y + zoneRect.height / 2;
        
        // Draw British Regulars reserve (using real image)
        const regularsAvailable = this.britishTroops.regulars.available;
        if (regularsAvailable > 0) {
            this.drawReserveUnit(centerX - 20, centerY - 10, this.britishTroopImages.regulars, '#dc3545', regularsAvailable, 'British Regulars', '#cc0000', 'white');
        }
        
        // Draw British Tories reserve (using real image)
        const toriesAvailable = this.britishTroops.tories.available;
        if (toriesAvailable > 0) {
            this.drawReserveUnit(centerX + 5, centerY - 10, this.britishTroopImages.tories, '#28a745', toriesAvailable, 'British Tories', '#28a745', 'white');
        }
        
        console.log(`✅ British reserves drawn: ${regularsAvailable} Regulars, ${toriesAvailable} Tories`);
    }

    drawReserveUnit(x, y, unitImage, fallbackColor, count, label, circleColor = null, textColor = 'white') {
        const unitSize = 25;
        
        // Use image if loaded, otherwise fallback to colored rectangle
        if (unitImage && unitImage.complete && unitImage.naturalWidth > 0) {
            this.ctx.drawImage(unitImage, x, y, unitSize, unitSize);
            console.log(`✅ ${label} reserve image placed: ${count} units`);
        } else {
            // Fallback to colored cube
            console.log(`⚠️ ${label} image not loaded, using fallback cube`);
            this.ctx.fillStyle = fallbackColor;
            this.ctx.fillRect(x, y, unitSize, unitSize);
            
            // Draw border
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, unitSize, unitSize);
        }
        
        // Draw count number (compteur en dehors de l'unité de réserve)
        if (count > 1) {
            // Position du compteur : position modérée (réserves)
            const circleRadius = 8;
            const counterX = x + unitSize - circleRadius + 2; // Position intermédiaire
            const counterY = y + circleRadius - 2; // Position intermédiaire
            
            // Use provided circle color or fallback to white
            this.ctx.fillStyle = circleColor || 'white';
            this.ctx.beginPath();
            this.ctx.arc(counterX, counterY, circleRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw number with specified text color
            this.ctx.fillStyle = textColor;
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(count.toString(), counterX, counterY + circleRadius * 0.3);
            console.log(`🔢 Drew count ${count} on ${label} reserve`);
        }
    }

    placeRandomPatriotTroops() {
        console.log('🟢 === Starting Patriot Troops placement ===');
        
        // Reset Patriot troops
        this.patriotTroops = {
            continentals: {
                total: 20,
                placed: {},
                available: 20
            },
            militia: {
                total: 15,
                placed: {}, // { territoryName: { normal: count, active: count } }
                available: 15
            }
        };
        
        const territories = this.allZones.territories?.data || {};
        const availableLocations = Object.keys(territories);
        
        console.log(`📍 Available locations for Patriot troops: ${availableLocations.length}`);
        
        // Place Continentals (20 total) - only place 12-15, keep 5-8 in reserve
        const continentalsToPlace = Math.floor(Math.random() * 4) + 12; // Random between 12-15
        this.placePatriotUnits('continentals', continentalsToPlace, availableLocations, '🟢 Continental');
        
        // Place Militia (15 total) - only place 8-12, keep 3-7 in reserve
        const militiaToPlace = Math.floor(Math.random() * 5) + 8; // Random between 8-12
        this.placePatriotMilitia(militiaToPlace, availableLocations);
        
        console.log(`🟢 Patriots placement summary: ${continentalsToPlace}/20 Continentals placed, ${militiaToPlace}/15 Militia placed`);
        
        console.log('🟢 === Patriot Troops placement completed ===');
    }
    
    placePatriotUnits(troopType, totalUnits, availableLocations, troopLabel) {
        let placedCount = 0;
        let attempts = 0;
        const maxAttempts = totalUnits * 10;
        
        while (placedCount < totalUnits && attempts < maxAttempts) {
            attempts++;
            const randomLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
            
            // Initialize location if not exists
            if (!this.patriotTroops[troopType].placed[randomLocation]) {
                this.patriotTroops[troopType].placed[randomLocation] = 0;
            }
            
            // Add troop (max 4 per location to avoid overcrowding)
            if (this.patriotTroops[troopType].placed[randomLocation] < 4) {
                this.patriotTroops[troopType].placed[randomLocation]++;
                placedCount++;
                console.log(`${troopLabel} placé à ${randomLocation} (${this.patriotTroops[troopType].placed[randomLocation]} unités)`);
            }
        }

        // Update available count (remaining go to reserve)
        this.patriotTroops[troopType].available = this.patriotTroops[troopType].total - placedCount;
    }
    
    placePatriotMilitia(totalMilitia, availableLocations) {
        let placedCount = 0;
        let attempts = 0;
        const maxAttempts = totalMilitia * 10;
        
        while (placedCount < totalMilitia && attempts < maxAttempts) {
            attempts++;
            const randomLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
            
            // Initialize location if not exists
            if (!this.patriotTroops.militia.placed[randomLocation]) {
                this.patriotTroops.militia.placed[randomLocation] = {
                    normal: 0,
                    active: 0
                };
            }
            
            const totalAtLocation = this.patriotTroops.militia.placed[randomLocation].normal + 
                                  this.patriotTroops.militia.placed[randomLocation].active;
            
            // Add militia (max 4 per location to avoid overcrowding)
            if (totalAtLocation < 4) {
                // Randomly choose between normal and active (50/50 chance)
                const isActive = Math.random() < 0.5;
                
                if (isActive) {
                    this.patriotTroops.militia.placed[randomLocation].active++;
                    console.log(`🟢 Milice Active placée à ${randomLocation} (A:${this.patriotTroops.militia.placed[randomLocation].active}, N:${this.patriotTroops.militia.placed[randomLocation].normal})`);
                } else {
                    this.patriotTroops.militia.placed[randomLocation].normal++;
                    console.log(`🟢 Milice Normale placée à ${randomLocation} (A:${this.patriotTroops.militia.placed[randomLocation].active}, N:${this.patriotTroops.militia.placed[randomLocation].normal})`);
                }
                
                placedCount++;
            }
        }

        // Update available count (remaining go to reserve)
        this.patriotTroops.militia.available = this.patriotTroops.militia.total - placedCount;
        console.log(`🟢 Total Militia placées: ${placedCount}, disponibles en réserve: ${this.patriotTroops.militia.available}`);
    }
    
    placeRandomIndianWarParties() {
        console.log('🟤 === Starting Indian War Parties placement ===');
        
        // Reset Indian War Parties
        this.indianWarParties = {
            total: 15,
            placed: {}, // { territoryName: { normal: count, active: count } }
            available: 15
        };
        
        const territories = this.allZones.territories?.data || {};
        
        // Filter out cities and port cities - War Parties cannot be placed there
        const portCities = ['Boston', 'New York City', 'Philadelphia', 'Baltimore', 'Norfolk', 'Wilmington', 'Charleston', 'Savannah'];
        const cities = ['Albany', 'Montreal', 'Quebec', 'Halifax', 'Pensacola', 'Mobile', 'New Orleans']; // Add other cities as needed
        const forbiddenLocations = [...portCities, ...cities];
        
        const availableLocations = Object.keys(territories).filter(location => 
            !forbiddenLocations.includes(location)
        );
        
        console.log(`📍 Available locations for Indian War Parties: ${availableLocations.length} (excluded cities: ${forbiddenLocations.join(', ')})`);
        
        // Place War Parties (15 total) - only place 8-12, keep 3-7 in reserve
        const warPartiesToPlace = Math.floor(Math.random() * 5) + 8; // Random between 8-12
        this.placeIndianWarParties(warPartiesToPlace, availableLocations);
        
        console.log(`🟤 Indian War Parties placement summary: ${warPartiesToPlace}/15 War Parties placed`);
        console.log('🟤 === Indian War Parties placement completed ===');
    }
    
    placeIndianWarParties(totalWarParties, availableLocations) {
        let placedCount = 0;
        let attempts = 0;
        const maxAttempts = totalWarParties * 10;
        
        while (placedCount < totalWarParties && attempts < maxAttempts) {
            attempts++;
            const randomLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
            
            // Initialize location if not exists
            if (!this.indianWarParties.placed[randomLocation]) {
                this.indianWarParties.placed[randomLocation] = {
                    normal: 0,
                    active: 0
                };
            }
            
            const totalAtLocation = this.indianWarParties.placed[randomLocation].normal + 
                                  this.indianWarParties.placed[randomLocation].active;
            
            // Add war party (max 4 per location to avoid overcrowding)
            if (totalAtLocation < 4) {
                // Randomly choose between normal and active (50/50 chance)
                const isActive = Math.random() < 0.5;
                
                if (isActive) {
                    this.indianWarParties.placed[randomLocation].active++;
                    console.log(`🟤 War Party Active placée à ${randomLocation} (A:${this.indianWarParties.placed[randomLocation].active}, N:${this.indianWarParties.placed[randomLocation].normal})`);
                } else {
                    this.indianWarParties.placed[randomLocation].normal++;
                    console.log(`🟤 War Party Normale placée à ${randomLocation} (A:${this.indianWarParties.placed[randomLocation].active}, N:${this.indianWarParties.placed[randomLocation].normal})`);
                }
                
                placedCount++;
            }
        }

        // Update available count (remaining go to reserve)
        this.indianWarParties.available = this.indianWarParties.total - placedCount;
        console.log(`🟤 Total War Parties placées: ${placedCount}, disponibles en réserve: ${this.indianWarParties.available}`);
    }
    
    placeRandomRaidPropagandaMarkers() {
        console.log('🎯 Placing random raid and propaganda markers...');
        
        // Reset markers
        this.raidPropagandaMarkers.propaganda.placed = {};
        this.raidPropagandaMarkers.raid.placed = {};
        this.raidPropagandaMarkers.propaganda.available = this.raidPropagandaMarkers.propaganda.total;
        this.raidPropagandaMarkers.raid.available = this.raidPropagandaMarkers.raid.total;
        
        // Get territories with defined zones from the loaded file
        const propagandaTerritories = Object.keys(this.territoryZones.propaganda || {});
        const raidTerritories = Object.keys(this.territoryZones.raid || {});
        
        console.log(`📢 Found ${propagandaTerritories.length} territories with propaganda zones`);
        console.log(`⚔️ Found ${raidTerritories.length} territories with raid zones`);
        
        // Place propaganda markers (60-80% of total)
        const propagandaToPlace = Math.floor(this.raidPropagandaMarkers.propaganda.total * (0.6 + Math.random() * 0.2));
        for (let i = 0; i < propagandaToPlace && propagandaTerritories.length > 0; i++) {
            const randomTerritory = propagandaTerritories[Math.floor(Math.random() * propagandaTerritories.length)];
            
            if (!this.raidPropagandaMarkers.propaganda.placed[randomTerritory]) {
                this.raidPropagandaMarkers.propaganda.placed[randomTerritory] = 0;
            }
            
            this.raidPropagandaMarkers.propaganda.placed[randomTerritory]++;
            this.raidPropagandaMarkers.propaganda.available--;
            
            console.log(`📢 Propaganda marker placed in ${randomTerritory} (count: ${this.raidPropagandaMarkers.propaganda.placed[randomTerritory]})`);
        }
        
        // Place raid markers (60-80% of total)
        const raidsToPlace = Math.floor(this.raidPropagandaMarkers.raid.total * (0.6 + Math.random() * 0.2));
        for (let i = 0; i < raidsToPlace && raidTerritories.length > 0; i++) {
            const randomTerritory = raidTerritories[Math.floor(Math.random() * raidTerritories.length)];
            
            if (!this.raidPropagandaMarkers.raid.placed[randomTerritory]) {
                this.raidPropagandaMarkers.raid.placed[randomTerritory] = 0;
            }
            
            this.raidPropagandaMarkers.raid.placed[randomTerritory]++;
            this.raidPropagandaMarkers.raid.available--;
            
            console.log(`⚔️ Raid marker placed in ${randomTerritory} (count: ${this.raidPropagandaMarkers.raid.placed[randomTerritory]})`);
        }
        
        console.log(`📢 Total propaganda markers placed: ${this.raidPropagandaMarkers.propaganda.total - this.raidPropagandaMarkers.propaganda.available}, remaining: ${this.raidPropagandaMarkers.propaganda.available}`);
        console.log(`⚔️ Total raid markers placed: ${this.raidPropagandaMarkers.raid.total - this.raidPropagandaMarkers.raid.available}, remaining: ${this.raidPropagandaMarkers.raid.available}`);
    }
    
    drawPatriotTroopsOld() {
        console.log('🟢 Drawing Patriot Troops (OLD SYSTEM)...');
        
        const territories = this.allZones.territories?.data || {};
        
        // Reset temp occupied positions tracker for Patriots
        if (!this.tempOccupiedPositions) {
            this.tempOccupiedPositions = {};
        }
        
        // Draw Continentals
        for (const [locationName, continentalCount] of Object.entries(this.patriotTroops.continentals.placed)) {
            if (continentalCount > 0 && territories[locationName]?.armies) {
                const zone = territories[locationName].armies;
                const zoneRect = this.convertZone(zone);
                
                if (!this.tempOccupiedPositions[locationName]) {
                    this.tempOccupiedPositions[locationName] = [];
                }
                
                // Get occupied positions 
                const occupiedPositions = this.getOccupiedPositions(locationName, zoneRect);
                
                // Find available position for Continentals
                const position = this.findAvailablePosition(zoneRect, occupiedPositions, 25); // 25px unit size
                
                if (position) {
                    console.log(`🎨 Drawing Continentals at (${position.x}, ${position.y}) - ${continentalCount} units`);
                    
                    // Use image if loaded, otherwise fallback to cube
                    const continentalImage = this.patriotTroopImages.continentals;
                    if (continentalImage && continentalImage.complete && continentalImage.naturalWidth > 0) {
                        this.ctx.drawImage(continentalImage, position.x, position.y, 25, 25);
                        console.log(`✅ Continentals image drawn at ${locationName}`);
                    } else {
                        // Fallback to light blue cube
                        console.log(`⚠️ Continentals image not loaded, using fallback cube`);
                        this.ctx.fillStyle = '#87ceeb'; // light blue
                        this.ctx.fillRect(position.x, position.y, 25, 25);
                        this.ctx.strokeStyle = '#000000';
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeRect(position.x, position.y, 25, 25);
                    }
                    
                    // Add count number if multiple units
                    if (continentalCount > 1) {
                        // Draw light blue circle with black number for Continentals
                        this.ctx.fillStyle = '#87ceeb'; // light blue
                        this.ctx.beginPath();
                        this.ctx.arc(position.x + 19, position.y + 6, 6, 0, 2 * Math.PI);
                        this.ctx.fill();
                        
                        // Draw black number
                        this.ctx.fillStyle = 'black';
                        this.ctx.font = 'bold 8px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(continentalCount.toString(), position.x + 19, position.y + 6);
                        console.log(`🔢 Drew count ${continentalCount} on Continentals`);
                    }
                    
                    // Add this position to temp occupied positions 
                    this.tempOccupiedPositions[locationName].push({
                        x: position.x,
                        y: position.y,
                        width: 25,
                        height: 25,
                        type: 'patriot_continentals'
                    });
                }
            }
        }
        
        // Draw Militia (both normal and active)
        for (const [locationName, militiaData] of Object.entries(this.patriotTroops.militia.placed)) {
            if (territories[locationName]?.armies) {
                const zone = territories[locationName].armies;
                const zoneRect = this.convertZone(zone);
                
                if (!this.tempOccupiedPositions[locationName]) {
                    this.tempOccupiedPositions[locationName] = [];
                }
                
                // Draw Normal Militia
                if (militiaData.normal > 0) {
                    const occupiedPositions = this.getOccupiedPositions(locationName, zoneRect);
                    const position = this.findAvailablePosition(zoneRect, occupiedPositions, 25);
                    
                    if (position) {
                        console.log(`🎨 Drawing Normal Militia at (${position.x}, ${position.y}) - ${militiaData.normal} units`);
                        
                        const militiaImage = this.patriotTroopImages.militia;
                        if (militiaImage && militiaImage.complete && militiaImage.naturalWidth > 0) {
                            this.ctx.drawImage(militiaImage, position.x, position.y, 25, 25);
                        } else {
                            // Fallback to dark blue cube
                            this.ctx.fillStyle = '#0066ff'; // dark blue
                            this.ctx.fillRect(position.x, position.y, 25, 25);
                            this.ctx.strokeStyle = '#000000';
                            this.ctx.lineWidth = 1;
                            this.ctx.strokeRect(position.x, position.y, 25, 25);
                        }
                        
                        if (militiaData.normal > 1) {
                            // Draw dark blue circle with white number for Militia
                            this.ctx.fillStyle = '#0066ff'; // dark blue
                            this.ctx.beginPath();
                            this.ctx.arc(position.x + 19, position.y + 6, 6, 0, 2 * Math.PI);
                            this.ctx.fill();
                            
                            this.ctx.fillStyle = 'white';
                            this.ctx.font = 'bold 8px Arial';
                            this.ctx.textAlign = 'center';
                            this.ctx.textBaseline = 'middle';
                            this.ctx.fillText(militiaData.normal.toString(), position.x + 19, position.y + 6);
                        }
                        
                        this.tempOccupiedPositions[locationName].push({
                            x: position.x,
                            y: position.y,
                            width: 25,
                            height: 25,
                            type: 'patriot_militia_normal'
                        });
                    }
                }
                
                // Draw Active Militia
                if (militiaData.active > 0) {
                    const occupiedPositions = this.getOccupiedPositions(locationName, zoneRect);
                    const position = this.findAvailablePosition(zoneRect, occupiedPositions, 25);
                    
                    if (position) {
                        console.log(`🎨 Drawing Active Militia at (${position.x}, ${position.y}) - ${militiaData.active} units`);
                        
                        const militiaActiveImage = this.patriotTroopImages.militiaActive;
                        if (militiaActiveImage && militiaActiveImage.complete && militiaActiveImage.naturalWidth > 0) {
                            this.ctx.drawImage(militiaActiveImage, position.x, position.y, 25, 25);
                        } else {
                            // Fallback to dark blue cube
                            this.ctx.fillStyle = '#0066ff'; // dark blue
                            this.ctx.fillRect(position.x, position.y, 25, 25);
                            this.ctx.strokeStyle = '#000000';
                            this.ctx.lineWidth = 1;
                            this.ctx.strokeRect(position.x, position.y, 25, 25);
                        }
                        
                        if (militiaData.active > 1) {
                            // Draw dark blue circle with white number for Active Militia
                            this.ctx.fillStyle = '#0066ff'; // dark blue
                            this.ctx.beginPath();
                            this.ctx.arc(position.x + 19, position.y + 6, 6, 0, 2 * Math.PI);
                            this.ctx.fill();
                            
                            this.ctx.fillStyle = 'white';
                            this.ctx.font = 'bold 8px Arial';
                            this.ctx.textAlign = 'center';
                            this.ctx.textBaseline = 'middle';
                            this.ctx.fillText(militiaData.active.toString(), position.x + 19, position.y + 6);
                        }
                        
                        this.tempOccupiedPositions[locationName].push({
                            x: position.x,
                            y: position.y,
                            width: 25,
                            height: 25,
                            type: 'patriot_militia_active'
                        });
                    }
                }
            }
        }
    }
    
    drawPatriotReserves() {
        console.log('🟢 Drawing Patriot reserve forces...');
        
        if (!this.allZones.forces?.data?.faction_forces?.patriots) {
            console.log('❌ No Patriot forces zone found');
            return;
        }
        
        const zoneRect = this.convertZone(this.allZones.forces.data.faction_forces.patriots);
        
        // Position for reserves display
        const centerX = zoneRect.x + zoneRect.width / 2;
        const centerY = zoneRect.y + zoneRect.height / 2;
        
        // Draw Continental reserves (using real image)
        const continentalsAvailable = this.patriotTroops.continentals.available;
        if (continentalsAvailable > 0) {
            this.drawReserveUnit(centerX - 20, centerY - 10, this.patriotTroopImages.continentals, '#87ceeb', continentalsAvailable, 'Patriot Continentals', '#87ceeb', 'black');
        }
        
        // Draw Militia reserves (using normal militia image, total count)
        const militiaAvailable = this.patriotTroops.militia.available;
        if (militiaAvailable > 0) {
            this.drawReserveUnit(centerX + 5, centerY - 10, this.patriotTroopImages.militia, '#0066ff', militiaAvailable, 'Patriot Militia', '#0066ff', 'white');
        }
        
        console.log(`✅ Patriot reserves drawn: ${continentalsAvailable} Continentals, ${militiaAvailable} Militia`);
    }

    drawPatriotTroops() {
        console.log('🟢 Drawing Patriot Troops...');
        
        // Draw Continentals
        for (const [locationName, continentalCount] of Object.entries(this.patriotTroops.continentals.placed)) {
            if (continentalCount > 0) {
                this.drawUnitInTerritory(
                    locationName, 
                    'patriots', 
                    'Continentals', 
                    this.patriotTroopImages.continentals, 
                    '#87ceeb', 
                    continentalCount, 
                    true
                );
            }
        }
        
        // Draw Militia (both normal and active)
        for (const [locationName, militiaData] of Object.entries(this.patriotTroops.militia.placed)) {
            // Draw Normal Militia
            if (militiaData.normal > 0) {
                this.drawUnitInTerritory(
                    locationName, 
                    'patriots', 
                    'Militia Normal', 
                    this.patriotTroopImages.militia, 
                    '#0066ff', 
                    militiaData.normal, 
                    true
                );
            }
            
            // Draw Active Militia
            if (militiaData.active > 0) {
                this.drawUnitInTerritory(
                    locationName, 
                    'patriots', 
                    'Militia Active', 
                    this.patriotTroopImages.militiaActive, 
                    '#0066ff', 
                    militiaData.active, 
                    true
                );
            }
        }
    }

    drawIndianWarPartiesOld() {
        console.log('🟤 Drawing Indian War Parties (OLD SYSTEM)...');
        
        const territories = this.allZones.territories?.data || {};
        
        // Reset temp occupied positions tracker for Indians
        if (!this.tempOccupiedPositions) {
            this.tempOccupiedPositions = {};
        }
        
        // Draw War Parties (both normal and active)
        for (const [locationName, warPartyData] of Object.entries(this.indianWarParties.placed)) {
            if (territories[locationName]?.armies) {
                const zone = territories[locationName].armies;
                const zoneRect = this.convertZone(zone);
                
                if (!this.tempOccupiedPositions[locationName]) {
                    this.tempOccupiedPositions[locationName] = [];
                }
                
                // Draw Normal War Parties
                if (warPartyData.normal > 0) {
                    const occupiedPositions = this.getOccupiedPositions(locationName, zoneRect);
                    const position = this.findAvailablePosition(zoneRect, occupiedPositions, 25);
                    
                    if (position) {
                        console.log(`🎨 Drawing Normal War Party at (${position.x}, ${position.y}) - ${warPartyData.normal} units`);
                        
                        const warPartyImage = this.indianWarPartyImages.warParty;
                        if (warPartyImage && warPartyImage.complete && warPartyImage.naturalWidth > 0) {
                            this.ctx.drawImage(warPartyImage, position.x, position.y, 25, 25);
                        } else {
                            // Fallback to brown cube
                            this.ctx.fillStyle = '#8B4513'; // saddle brown
                            this.ctx.fillRect(position.x, position.y, 25, 25);
                            this.ctx.strokeStyle = '#000000';
                            this.ctx.lineWidth = 1;
                            this.ctx.strokeRect(position.x, position.y, 25, 25);
                        }
                        
                        // Draw count if more than 1
                        if (warPartyData.normal > 1) {
                            this.ctx.fillStyle = '#8B4513'; // brown circle
                            this.ctx.beginPath();
                            this.ctx.arc(position.x + 20, position.y + 5, 8, 0, 2 * Math.PI);
                            this.ctx.fill();
                            
                            this.ctx.fillStyle = 'white';
                            this.ctx.font = '10px Arial';
                            this.ctx.textAlign = 'center';
                            this.ctx.fillText(warPartyData.normal.toString(), position.x + 20, position.y + 9);
                        }
                        
                        // Add to occupied positions
                        this.tempOccupiedPositions[locationName].push({
                            x: position.x, y: position.y, width: 25, height: 25
                        });
                    }
                }
                
                // Draw Active War Parties
                if (warPartyData.active > 0) {
                    const occupiedPositions = this.getOccupiedPositions(locationName, zoneRect);
                    const position = this.findAvailablePosition(zoneRect, occupiedPositions, 25);
                    
                    if (position) {
                        console.log(`🎨 Drawing Active War Party at (${position.x}, ${position.y}) - ${warPartyData.active} units`);
                        
                        const warPartyActiveImage = this.indianWarPartyImages.warPartyActive;
                        if (warPartyActiveImage && warPartyActiveImage.complete && warPartyActiveImage.naturalWidth > 0) {
                            this.ctx.drawImage(warPartyActiveImage, position.x, position.y, 25, 25);
                        } else {
                            // Fallback to darker brown cube
                            this.ctx.fillStyle = '#654321'; // darker brown
                            this.ctx.fillRect(position.x, position.y, 25, 25);
                            this.ctx.strokeStyle = '#000000';
                            this.ctx.lineWidth = 1;
                            this.ctx.strokeRect(position.x, position.y, 25, 25);
                        }
                        
                        // Draw count if more than 1
                        if (warPartyData.active > 1) {
                            this.ctx.fillStyle = '#8B4513'; // brown circle
                            this.ctx.beginPath();
                            this.ctx.arc(position.x + 20, position.y + 5, 8, 0, 2 * Math.PI);
                            this.ctx.fill();
                            
                            this.ctx.fillStyle = 'white';
                            this.ctx.font = '10px Arial';
                            this.ctx.textAlign = 'center';
                            this.ctx.fillText(warPartyData.active.toString(), position.x + 20, position.y + 9);
                        }
                        
                        // Add to occupied positions
                        this.tempOccupiedPositions[locationName].push({
                            x: position.x, y: position.y, width: 25, height: 25
                        });
                    }
                }
            }
        }
    }

    drawIndianReserves() {
        console.log('🟤 Drawing Indian reserve forces...');
        
        if (!this.allZones.forces?.data?.faction_forces?.indians) {
            console.log('❌ No Indian forces zone found');
            return;
        }
        
        const zoneRect = this.convertZone(this.allZones.forces.data.faction_forces.indians);
        
        // Position for reserves display
        const centerX = zoneRect.x + zoneRect.width / 2;
        const centerY = zoneRect.y + zoneRect.height / 2;
        
        // Draw War Party reserves (normal and active separately if both exist)
        const warPartiesAvailable = this.indianWarParties.available;
        if (warPartiesAvailable > 0) {
            // For simplicity, show total available count using normal image
            this.drawReserveUnit(centerX - 10, centerY - 10, this.indianWarPartyImages.warParty, '#8B4513', warPartiesAvailable, 'Indian War Parties', '#8B4513', 'white');
        }
        
        console.log(`✅ Indian reserves drawn: ${warPartiesAvailable} War Parties`);
    }

    drawIndianWarParties() {
        console.log('🟤 Drawing Indian War Parties...');
        
        // Draw War Parties (both normal and active)
        for (const [locationName, warPartyData] of Object.entries(this.indianWarParties.placed)) {
            // Draw Normal War Parties
            if (warPartyData.normal > 0) {
                this.drawUnitInTerritory(
                    locationName, 
                    'indians', 
                    'War Parties Normal', 
                    this.indianWarPartyImages.warParty, 
                    '#8B4513', 
                    warPartyData.normal, 
                    true
                );
            }
            
            // Draw Active War Parties
            if (warPartyData.active > 0) {
                this.drawUnitInTerritory(
                    locationName, 
                    'indians', 
                    'War Parties Active', 
                    this.indianWarPartyImages.warPartyActive, 
                    '#654321', 
                    warPartyData.active, 
                    true
                );
            }
        }
    }

    // Nouveau système de grille pour éviter les chevauchements
    countTotalUnitsInTerritory(territoryName) {
        let totalUnits = 0;
        
        // Compter les unités de l'ancien système (gameState)
        if (this.gameState[territoryName]) {
            for (const [faction, units] of Object.entries(this.gameState[territoryName])) {
                for (const [unitType, count] of Object.entries(units)) {
                    totalUnits += count;
                }
            }
        }
        
        // Villages indiens (nouveau système)
        if (this.indianVillages?.placed[territoryName]) {
            totalUnits += this.indianVillages.placed[territoryName];
        }
        
        // Troupes britanniques (nouveau système)
        if (this.britishTroops?.regulars?.placed[territoryName]) {
            totalUnits += this.britishTroops.regulars.placed[territoryName];
        }
        if (this.britishTroops?.tories?.placed[territoryName]) {
            totalUnits += this.britishTroops.tories.placed[territoryName];
        }
        
        // Troupes patriots (nouveau système)
        if (this.patriotTroops?.continentals?.placed[territoryName]) {
            totalUnits += this.patriotTroops.continentals.placed[territoryName];
        }
        if (this.patriotTroops?.militia?.placed[territoryName]) {
            const militiaData = this.patriotTroops.militia.placed[territoryName];
            totalUnits += (militiaData.normal || 0) + (militiaData.active || 0);
        }
        
        // Indian War Parties (nouveau système)
        if (this.indianWarParties?.placed[territoryName]) {
            const warPartyData = this.indianWarParties.placed[territoryName];
            totalUnits += (warPartyData.normal || 0) + (warPartyData.active || 0);
        }
        
        // Réguliers français (nouveau système)
        if (this.frenchRegulars?.placed[territoryName]) {
            totalUnits += this.frenchRegulars.placed[territoryName];
        }
        
        // Forts (nouveau système)
        if (this.fortSystems?.patriots?.placed[territoryName]) {
            totalUnits += this.fortSystems.patriots.placed[territoryName];
        }
        if (this.fortSystems?.british?.placed[territoryName]) {
            totalUnits += this.fortSystems.british.placed[territoryName];
        }
        
        // Bateaux français en blocus (nouveau système)
        if (this.frenchShips?.blockading[territoryName]) {
            totalUnits += this.frenchShips.blockading[territoryName];
        }

        // Leaders (nouveau système)
        if (this.leaders?.[territoryName]) {
            totalUnits += this.leaders[territoryName].length;
        }

        console.log(`📊 Territory ${territoryName} has ${totalUnits} total units`);
        return totalUnits;
    }

    createGridPositions(zoneRect, unitCount) {
        const positions = [];
        const margin = 2;  // Marge réduite
        
        if (unitCount <= 0) return positions;
        
        // Calculer les dimensions disponibles (toute la zone moins petites marges)
        const availableWidth = zoneRect.width - 2 * margin;
        const availableHeight = zoneRect.height - 2 * margin;
        
        // Calculer le nombre optimal de colonnes et lignes
        let cols = Math.ceil(Math.sqrt(unitCount));
        let rows = Math.ceil(unitCount / cols);
        
        // Ajuster pour optimiser l'espace
        const aspectRatio = availableWidth / availableHeight;
        if (aspectRatio > 1) {
            // Zone plus large que haute : plus de colonnes
            cols = Math.ceil(Math.sqrt(unitCount * aspectRatio));
            rows = Math.ceil(unitCount / cols);
        } else {
            // Zone plus haute que large : plus de lignes
            rows = Math.ceil(Math.sqrt(unitCount / aspectRatio));
            cols = Math.ceil(unitCount / rows);
        }
        
        // Calculer la taille des cases pour remplir tout l'espace
        const cellWidth = Math.floor(availableWidth / cols);
        const cellHeight = Math.floor(availableHeight / rows);
        
        // Utiliser la plus petite dimension pour garder des cases carrées
        const cellSize = Math.min(cellWidth, cellHeight);
        
        // Position de départ pour centrer la grille
        const totalGridWidth = cols * cellSize;
        const totalGridHeight = rows * cellSize;
        const startX = zoneRect.x + margin + (availableWidth - totalGridWidth) / 2;
        const startY = zoneRect.y + margin + (availableHeight - totalGridHeight) / 2;
        
        // Créer les positions dans la grille
        for (let i = 0; i < unitCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            positions.push({
                x: startX + col * cellSize,
                y: startY + row * cellSize,
                width: cellSize,
                height: cellSize
            });
        }
        
        return positions;
    }

    drawUnitInTerritory(territoryName, factionType, unitType, unitImage, fallbackColor, count, isMultiple = false) {
        const territories = this.allZones.territories?.data || {};
        
        if (!territories[territoryName]?.armies) {
            console.log(`⚠️ No armies zone for ${territoryName}`);
            return null;
        }
        
        const zone = territories[territoryName].armies;
        const zoneRect = this.convertZone(zone);
        
        // Compter toutes les unités dans ce territoire
        const totalUnits = this.countTotalUnitsInTerritory(territoryName);
        
        // Créer la grille pour toutes les unités
        if (!this.territoryGrids) {
            this.territoryGrids = {};
        }
        
        if (!this.territoryGrids[territoryName]) {
            this.territoryGrids[territoryName] = {
                positions: this.createGridPositions(zoneRect, totalUnits),
                usedPositions: 0
            };
        }
        
        const grid = this.territoryGrids[territoryName];
        
        if (grid.usedPositions >= grid.positions.length) {
            console.log(`⚠️ No more grid positions available in ${territoryName}`);
            return null;
        }
        
        const position = grid.positions[grid.usedPositions];
        grid.usedPositions++;
        
        // Dessiner l'unité (utiliser la taille de la case dynamique)
        const unitSize = Math.min(position.width, position.height) - 1; // -1 pour laisser un pixel de marge
        
        if (unitImage && unitImage.complete && unitImage.naturalWidth > 0) {
            this.ctx.drawImage(unitImage, position.x, position.y, unitSize, unitSize);
        } else {
            // Fallback to colored cube
            this.ctx.fillStyle = fallbackColor;
            this.ctx.fillRect(position.x, position.y, unitSize, unitSize);
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(position.x, position.y, unitSize, unitSize);
        }
        
        // Dessiner le compteur si multiple
        if (isMultiple && count > 1) {
            const circleColor = factionType === 'patriots' ? '#0066ff' : 
                              factionType === 'british' ? '#dc3545' : 
                              factionType === 'french' ? 'white' : '#8B4513';
            
            // Position du compteur : position modérée (système de grille)
            const circleRadius = Math.min(8, unitSize * 0.3);
            const counterX = position.x + unitSize - circleRadius + 2; // Position intermédiaire
            const counterY = position.y + circleRadius - 2; // Position intermédiaire
            
            this.ctx.fillStyle = circleColor;
            this.ctx.beginPath();
            this.ctx.arc(counterX, counterY, circleRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Couleur du texte selon la faction
            this.ctx.fillStyle = factionType === 'french' ? 'black' : 'white';
            this.ctx.font = `bold ${Math.max(8, Math.floor(unitSize * 0.4))}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(count.toString(), counterX, counterY + circleRadius * 0.3);
        }
        
        console.log(`✅ ${factionType} ${unitType} drawn at grid position (${position.x}, ${position.y}) in ${territoryName}`);
        
        return position;
    }

    // Fonction de debug pour visualiser la grille
    drawGridDebug() {
        // Dessiner seulement les bordures en pointillés des zones armies
        const territories = this.allZones.territories?.data || {};
        
        for (const [territoryName, territoryData] of Object.entries(territories)) {
            if (territoryData.armies) {
                const zone = territoryData.armies;
                const zoneRect = this.convertZone(zone);
                
                // Dessiner seulement le contour de la zone d'armée avec une bordure en pointillés
                this.ctx.strokeStyle = '#888888'; // Gris discret
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([5, 5]); // Pointillés
                this.ctx.strokeRect(zoneRect.x, zoneRect.y, zoneRect.width, zoneRect.height);
                this.ctx.setLineDash([]); // Remettre les traits pleins pour le reste
            }
        }
    }

    convertZone(zoneObj) {
        let zone;
        if (zoneObj.x1 !== undefined) {
            // Convert from {x1, y1, x2, y2} to {x, y, width, height}
            zone = {
                x: zoneObj.x1,
                y: zoneObj.y1,
                width: zoneObj.x2 - zoneObj.x1,
                height: zoneObj.y2 - zoneObj.y1
            };
        } else {
            zone = zoneObj; // Already in correct format
        }
        
        // Scale coordinates to match canvas size
        return {
            x: zone.x * this.scaleX,
            y: zone.y * this.scaleY,
            width: zone.width * this.scaleX,
            height: zone.height * this.scaleY
        };
    }

    // === DÉFINITION DES ZONES CARTES ===
    
    startDefiningZone(zoneType) {
        console.log(`🎯 Starting zone definition for ${zoneType}`);
        
        this.cardSystem.isDefiningZone = true;
        this.cardSystem.zoneType = zoneType;
        
        // Changer le curseur du canvas
        this.canvas.style.cursor = 'crosshair';
        
        // Mettre à jour le bouton pour indiquer le mode actif
        const button = document.getElementById('define-deck-zone');
        if (button) {
            button.style.backgroundColor = '#ff6b6b';
            button.textContent = '📍 Cliquez et glissez pour définir la zone deck';
        }
        
        console.log(`✅ Zone definition mode activated for ${zoneType}`);
    }
    
    startDefiningTerritoryZone(zoneType) {
        console.log(`🗺️ Starting territory zone definition for ${zoneType}`);
        
        if (!this.selectedTerritory) {
            alert('Veuillez d\'abord sélectionner un territoire dans la liste.');
            return;
        }
        
        this.cardSystem.isDefiningZone = true;
        this.currentZoneMode = zoneType;
        
        // Changer le curseur du canvas
        this.canvas.style.cursor = 'crosshair';
        
        // Mettre à jour les boutons pour indiquer le mode actif
        const propagandaBtn = document.getElementById('define-propaganda-zone');
        const raidBtn = document.getElementById('define-raid-zone');
        
        if (zoneType === 'propaganda' && propagandaBtn) {
            propagandaBtn.style.backgroundColor = '#007bff';
            propagandaBtn.textContent = '📍 Cliquez et glissez pour définir la zone propagande';
        } else if (zoneType === 'raid' && raidBtn) {
            raidBtn.style.backgroundColor = '#dc3545';
            raidBtn.textContent = '📍 Cliquez et glissez pour définir la zone raid';
        }
        
        console.log(`✅ Territory zone definition mode activated for ${zoneType} on ${this.selectedTerritory}`);
    }
    
    handleZoneDefinitionClick(x, y) {
        // Cette méthode est appelée si on utilise un simple clic au lieu de glisser-déposer
        console.log(`🎯 Zone definition click at (${x}, ${y})`);
    }
    
    finishDefiningZone() {
        const { startX, startY, currentX, currentY } = this.zoneDefinition;
        const zoneType = this.cardSystem.zoneType;
        
        // Calculer les coordonnées de la zone
        const x1 = Math.min(startX, currentX);
        const y1 = Math.min(startY, currentY);
        const x2 = Math.max(startX, currentX);
        const y2 = Math.max(startY, currentY);
        
        const width = x2 - x1;
        const height = y2 - y1;
        
        // Convertir les coordonnées canvas en coordonnées natives
        const nativeZone = {
            x: x1 / this.scaleX,
            y: y1 / this.scaleY,
            width: width / this.scaleX,
            height: height / this.scaleY
        };
        
        // Sauvegarder la zone
        if (zoneType === 'deck') {
            this.cardSystem.deckZone = nativeZone;
            console.log(`🎴 Deck zone defined:`, nativeZone);
            
            // Mettre à jour l'interface pour indiquer que la zone deck est définie
            this.updateDeckZoneStatus();
        } else if (this.currentZoneMode && this.selectedTerritory) {
            // Sauvegarder zone de territoire (propagande ou raid)
            this.territoryZones[this.currentZoneMode][this.selectedTerritory] = nativeZone;
            console.log(`🗺️ ${this.currentZoneMode} zone defined for ${this.selectedTerritory}:`, nativeZone);
            
            // Sauvegarder dans un fichier
            this.saveTerritoryZonesToFile();
            
            // Mettre à jour l'affichage
            this.updateZoneStatus();
        }
        
        // Désactiver le mode définition
        this.cardSystem.isDefiningZone = false;
        this.cardSystem.zoneType = null;
        this.currentZoneMode = null;
        
        // Restaurer le curseur
        this.canvas.style.cursor = 'pointer';
        
        // Restaurer les boutons
        const deckButton = document.getElementById('define-deck-zone');
        const propagandaBtn = document.getElementById('define-propaganda-zone');
        const raidBtn = document.getElementById('define-raid-zone');
        
        if (deckButton) {
            deckButton.style.backgroundColor = '';
            deckButton.textContent = '🎴 Définir Zone Deck';
        }
        if (propagandaBtn) {
            propagandaBtn.style.backgroundColor = '';
            propagandaBtn.textContent = '📢 Définir Zone Propagande';
        }
        if (raidBtn) {
            raidBtn.style.backgroundColor = '';
            raidBtn.textContent = '⚔️ Définir Zone Raid';
        }
        
        // Redessiner pour afficher la zone
        this.draw();
        
        console.log(`✅ Zone ${zoneType} definition completed`);
    }
    
    cancelZoneDefinition() {
        this.cardSystem.isDefiningZone = false;
        this.cardSystem.zoneType = null;
        this.currentZoneMode = null;
        this.canvas.style.cursor = 'pointer';
        
        // Restaurer tous les boutons
        const deckButton = document.getElementById('define-deck-zone');
        const propagandaBtn = document.getElementById('define-propaganda-zone');
        const raidBtn = document.getElementById('define-raid-zone');
        
        if (deckButton) {
            deckButton.style.backgroundColor = '';
            deckButton.textContent = '🎴 Définir Zone Deck';
        }
        if (propagandaBtn) {
            propagandaBtn.style.backgroundColor = '';
            propagandaBtn.textContent = '📢 Définir Zone Propagande';
        }
        if (raidBtn) {
            raidBtn.style.backgroundColor = '';
            raidBtn.textContent = '⚔️ Définir Zone Raid';
        }
    }
    
    saveTerritoryZonesToFile() {
        console.log('💾 Saving territory zones to file...');
        
        const data = {
            version: '1.0',
            lastUpdated: new Date().toISOString(),
            territoryZones: this.territoryZones
        };
        
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'territory-zones.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Territory zones saved to file');
        } catch (error) {
            console.error('❌ Error saving territory zones:', error);
        }
    }
    
    updateZoneStatus() {
        const zoneList = document.getElementById('zone-list');
        if (!zoneList) return;
        
        zoneList.innerHTML = '';
        
        if (!this.selectedTerritory) {
            zoneList.innerHTML = '<p style="color: #666; font-style: italic;">Sélectionnez un territoire</p>';
            return;
        }
        
        const propagandaZone = this.territoryZones.propaganda[this.selectedTerritory];
        const raidZone = this.territoryZones.raid[this.selectedTerritory];
        
        // Zone propagande
        const propagandaDiv = document.createElement('div');
        propagandaDiv.className = 'zone-item';
        propagandaDiv.innerHTML = `
            <span class="zone-type propaganda">📢 Propagande</span>
            <span>${propagandaZone ? '✅ Définie' : '❌ Non définie'}</span>
        `;
        zoneList.appendChild(propagandaDiv);
        
        // Zone raid
        const raidDiv = document.createElement('div');
        raidDiv.className = 'zone-item';
        raidDiv.innerHTML = `
            <span class="zone-type raid">⚔️ Raid</span>
            <span>${raidZone ? '✅ Définie' : '❌ Non définie'}</span>
        `;
        zoneList.appendChild(raidDiv);
    }
    
    loadTerritoryZones() {
        console.log('📁 Loading territory zones...');
        
        // Cette méthode pourrait charger depuis un fichier sauvegardé
        // Pour l'instant, on initialise avec un objet vide
        if (!this.territoryZones.propaganda) {
            this.territoryZones.propaganda = {};
        }
        if (!this.territoryZones.raid) {
            this.territoryZones.raid = {};
        }
        
        console.log('✅ Territory zones initialized');
    }
    
    populateTerritorySelect() {
        const select = document.getElementById('territory-select');
        if (!select) return;
        
        // Effacer les options existantes (sauf la première)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Utiliser les territoires réels du plateau de jeu
        let territories = [];
        
        if (this.allZones?.territories?.data) {
            // Récupérer tous les territoires avec des zones armies (là où on peut placer des unités)
            territories = Object.keys(this.allZones.territories.data)
                .filter(name => this.allZones.territories.data[name].armies)
                .sort(); // Trier par ordre alphabétique
                
            console.log(`📍 Found ${territories.length} territories from game board data`);
        } else {
            console.log('⚠️ Territory data not loaded yet, will retry later');
            // Réessayer dans 1 seconde si les données ne sont pas encore chargées
            setTimeout(() => {
                this.populateTerritorySelect();
            }, 1000);
            return;
        }
        
        territories.forEach(territory => {
            const option = document.createElement('option');
            option.value = territory;
            option.textContent = territory;
            select.appendChild(option);
        });
        
        console.log(`✅ Populated territory select with ${territories.length} real territories from game board`);
    }
    
    drawCardZones() {
        console.log('🎨 Drawing card zones...');
        console.log(`🎴 Deck zone available: ${!!this.cardSystem.deckZone}`);
        console.log(`🎴 Sequence zone available: ${!!this.cardSystem.sequenceZone}`);
        console.log(`🎴 Current deck card: ${this.cardSystem.currentDeckCard ? this.cardSystem.currentDeckCard.name : 'none'}`);
        console.log(`🎴 Current sequence card: ${this.cardSystem.currentSequenceCard ? this.cardSystem.currentSequenceCard.name : 'none'}`);
        
        // Dessiner la zone deck et sa carte
        if (this.cardSystem.deckZone) {
            console.log('🎴 Drawing deck zone outline and card');
            this.drawZoneOutline(this.cardSystem.deckZone, '#007bff', 'DECK');
            this.drawCardInZone('deck', this.cardSystem.deckZone, this.cardSystem.currentDeckCard);
        } else {
            console.log('⚠️ Deck zone not available');
        }
        
        // Dessiner la zone sequence et sa carte
        if (this.cardSystem.sequenceZone) {
            console.log('🎴 Drawing sequence zone outline and card');
            this.drawZoneOutline(this.cardSystem.sequenceZone, '#28a745', 'SEQUENCE');
            this.drawCardInZone('sequence', this.cardSystem.sequenceZone, this.cardSystem.currentSequenceCard);
        } else {
            console.log('⚠️ Sequence zone not available');
        }
        
        // Dessiner la zone en cours de définition
        if (this.cardSystem.isDefiningZone && this.zoneDefinition.isDrawing) {
            this.drawCurrentZoneDefinition();
        }
    }

    drawTurnTokens() {
        console.log('🎯 Drawing turn tokens...');
        
        if (!this.allZones?.gameplay?.data?.game_sequence) {
            console.log('⚠️ Game sequence zones not available');
            return;
        }

        const gameSequenceZones = this.allZones.gameplay.data.game_sequence;
        
        // Group tokens by zone for grid positioning
        const tokensByZone = {};
        this.turnTokens.tokens.forEach(token => {
            if (!tokensByZone[token.currentZone]) {
                tokensByZone[token.currentZone] = [];
            }
            tokensByZone[token.currentZone].push(token);
        });

        // Draw tokens in each zone
        Object.entries(tokensByZone).forEach(([zoneId, tokens]) => {
            const zoneData = gameSequenceZones[zoneId];
            if (!zoneData) {
                console.log(`⚠️ Zone ${zoneId} not found in game sequence zones`);
                return;
            }

            // Convert to canvas coordinates
            const canvasZone = {
                x: zoneData.x1 * this.scaleX,
                y: zoneData.y1 * this.scaleY,
                width: (zoneData.x2 - zoneData.x1) * this.scaleX,
                height: (zoneData.y2 - zoneData.y1) * this.scaleY
            };

            this.drawTokensInZone(canvasZone, tokens, zoneId);
        });

        // Draw dragging token if any
        if (this.turnTokens.dragging) {
            this.drawDraggingToken();
        }

        // Draw dragging resource token if any
        if (this.draggingResourceToken) {
            this.drawDraggingResourceToken();
        }

        // Draw dragging support token if any
        if (this.draggingSupportToken) {
            this.drawDraggingSupportToken();
        }

        // Draw dragging casualty token if any
        if (this.draggingCasualtyToken) {
            this.drawDraggingCasualtyToken();
        }
    }

    drawTokensInZone(zone, tokens, zoneId) {
        const tokenSize = 25;
        const padding = 3;
        
        // Calculate grid layout based on zone capabilities
        const isMultiTokenZone = ['2', '3', '10'].includes(zoneId);
        let gridCols, gridRows;
        
        if (isMultiTokenZone) {
            // Multi-token zones: arrange in grid
            gridCols = Math.min(tokens.length, Math.floor(zone.width / (tokenSize + padding)));
            gridRows = Math.ceil(tokens.length / gridCols);
        } else {
            // Single token zones: center the token
            gridCols = 1;
            gridRows = 1;
        }
        
        // Calculate starting position for centering
        const totalWidth = gridCols * tokenSize + (gridCols - 1) * padding;
        const totalHeight = gridRows * tokenSize + (gridRows - 1) * padding;
        const startX = zone.x + (zone.width - totalWidth) / 2;
        const startY = zone.y + (zone.height - totalHeight) / 2;
        
        tokens.forEach((token, index) => {
            if (this.turnTokens.dragging && this.turnTokens.dragging.id === token.id) {
                return; // Skip dragging token, it's drawn separately
            }
            
            const col = index % gridCols;
            const row = Math.floor(index / gridCols);
            
            const x = startX + col * (tokenSize + padding);
            const y = startY + row * (tokenSize + padding);
            
            this.drawTurnToken(x, y, token, tokenSize);
        });
    }

    drawTurnToken(x, y, token, size) {
        const tokenImage = this.resourceTokenImages[token.faction];
        
        if (tokenImage && tokenImage.complete && tokenImage.naturalWidth > 0) {
            this.ctx.drawImage(tokenImage, x, y, size, size);
        } else {
            // Fallback to colored rectangle
            const colors = {
                patriots: '#007bff',
                british: '#dc3545', 
                french: '#6f42c1',
                indians: '#fd7e14'
            };
            
            this.ctx.fillStyle = colors[token.faction] || '#333';
            this.ctx.fillRect(x, y, size, size);
            
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, size, size);
        }
    }

    drawDraggingToken() {
        if (!this.turnTokens.dragging) return;
        
        const token = this.turnTokens.dragging;
        const tokenSize = 25;
        
        // Draw at mouse position with offset
        const x = this.mousePos.x - this.turnTokens.dragOffset.x;
        const y = this.mousePos.y - this.turnTokens.dragOffset.y;
        
        // Draw with slight transparency to indicate dragging
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        this.drawTurnToken(x, y, token, tokenSize);
        this.ctx.restore();
    }

    getTurnTokenAt(x, y) {
        if (!this.allZones?.gameplay?.data?.game_sequence) return null;
        
        const gameSequenceZones = this.allZones.gameplay.data.game_sequence;
        const tokenSize = 25;
        const padding = 3;
        
        // Group tokens by zone
        const tokensByZone = {};
        this.turnTokens.tokens.forEach(token => {
            if (!tokensByZone[token.currentZone]) {
                tokensByZone[token.currentZone] = [];
            }
            tokensByZone[token.currentZone].push(token);
        });
        
        // Check each zone
        for (const [zoneId, tokens] of Object.entries(tokensByZone)) {
            const zoneData = gameSequenceZones[zoneId];
            if (!zoneData) continue;
            
            const canvasZone = {
                x: zoneData.x1 * this.scaleX,
                y: zoneData.y1 * this.scaleY,
                width: (zoneData.x2 - zoneData.x1) * this.scaleX,
                height: (zoneData.y2 - zoneData.y1) * this.scaleY
            };
            
            // Calculate grid positions
            const isMultiTokenZone = ['2', '3', '10'].includes(zoneId);
            let gridCols = isMultiTokenZone ? 
                Math.min(tokens.length, Math.floor(canvasZone.width / (tokenSize + padding))) : 1;
            
            const totalWidth = gridCols * tokenSize + (gridCols - 1) * padding;
            const totalHeight = Math.ceil(tokens.length / gridCols) * tokenSize + 
                               (Math.ceil(tokens.length / gridCols) - 1) * padding;
            const startX = canvasZone.x + (canvasZone.width - totalWidth) / 2;
            const startY = canvasZone.y + (canvasZone.height - totalHeight) / 2;
            
            // Check each token position
            for (let i = 0; i < tokens.length; i++) {
                const col = i % gridCols;
                const row = Math.floor(i / gridCols);
                const tokenX = startX + col * (tokenSize + padding);
                const tokenY = startY + row * (tokenSize + padding);
                
                if (x >= tokenX && x <= tokenX + tokenSize && 
                    y >= tokenY && y <= tokenY + tokenSize) {
                    return tokens[i];
                }
            }
        }
        
        return null;
    }

    startDraggingToken(token, mouseX, mouseY) {
        console.log(`🎯 Starting to drag token: ${token.faction}`);
        
        // Calculate drag offset
        const tokenPosition = this.getTokenPosition(token);
        if (tokenPosition) {
            this.turnTokens.dragOffset = {
                x: mouseX - tokenPosition.x,
                y: mouseY - tokenPosition.y
            };
        } else {
            this.turnTokens.dragOffset = { x: 12.5, y: 12.5 }; // Center of token
        }
        
        this.turnTokens.dragging = token;
        this.draw();
    }

    getTokenPosition(token) {
        if (!this.allZones?.gameplay?.data?.game_sequence) return null;
        
        const gameSequenceZones = this.allZones.gameplay.data.game_sequence;
        const zoneData = gameSequenceZones[token.currentZone];
        if (!zoneData) return null;
        
        const canvasZone = {
            x: zoneData.x1 * this.scaleX,
            y: zoneData.y1 * this.scaleY,
            width: (zoneData.x2 - zoneData.x1) * this.scaleX,
            height: (zoneData.y2 - zoneData.y1) * this.scaleY
        };
        
        const tokensInZone = this.turnTokens.tokens.filter(t => t.currentZone === token.currentZone);
        const tokenIndex = tokensInZone.findIndex(t => t.id === token.id);
        
        const tokenSize = 25;
        const padding = 3;
        const isMultiTokenZone = ['2', '3', '10'].includes(token.currentZone);
        const gridCols = isMultiTokenZone ? 
            Math.min(tokensInZone.length, Math.floor(canvasZone.width / (tokenSize + padding))) : 1;
        
        const totalWidth = gridCols * tokenSize + (gridCols - 1) * padding;
        const totalHeight = Math.ceil(tokensInZone.length / gridCols) * tokenSize + 
                           (Math.ceil(tokensInZone.length / gridCols) - 1) * padding;
        const startX = canvasZone.x + (canvasZone.width - totalWidth) / 2;
        const startY = canvasZone.y + (canvasZone.height - totalHeight) / 2;
        
        const col = tokenIndex % gridCols;
        const row = Math.floor(tokenIndex / gridCols);
        
        return {
            x: startX + col * (tokenSize + padding),
            y: startY + row * (tokenSize + padding)
        };
    }

    dropToken(mouseX, mouseY) {
        if (!this.turnTokens.dragging) return;
        
        const token = this.turnTokens.dragging;
        const targetZone = this.getGameSequenceZoneAt(mouseX, mouseY);
        
        if (targetZone && this.canPlaceTokenInZone(token, targetZone)) {
            console.log(`🎯 Dropping token ${token.faction} in zone ${targetZone}`);
            token.currentZone = targetZone;
        } else {
            console.log(`🎯 Invalid drop for token ${token.faction}, returning to original position`);
        }
        
        this.turnTokens.dragging = null;
        this.turnTokens.dragOffset = { x: 0, y: 0 };
        this.draw();
    }

    getGameSequenceZoneAt(x, y) {
        if (!this.allZones?.gameplay?.data?.game_sequence) return null;
        
        const gameSequenceZones = this.allZones.gameplay.data.game_sequence;
        
        for (const [zoneId, zoneData] of Object.entries(gameSequenceZones)) {
            const canvasZone = {
                x: zoneData.x1 * this.scaleX,
                y: zoneData.y1 * this.scaleY,
                width: (zoneData.x2 - zoneData.x1) * this.scaleX,
                height: (zoneData.y2 - zoneData.y1) * this.scaleY
            };
            
            if (x >= canvasZone.x && x <= canvasZone.x + canvasZone.width &&
                y >= canvasZone.y && y <= canvasZone.y + canvasZone.height) {
                return zoneId;
            }
        }
        
        return null;
    }

    canPlaceTokenInZone(token, zoneId) {
        // Only allow placement in zones 2-10
        const allowedZones = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];
        if (!allowedZones.includes(zoneId)) {
            return false;
        }
        
        const tokensInZone = this.turnTokens.tokens.filter(t => 
            t.currentZone === zoneId && t.id !== token.id
        );
        
        // Multi-token zones: 2, 3, 10
        const multiTokenZones = ['2', '3', '10'];
        if (multiTokenZones.includes(zoneId)) {
            return true; // Can always place in multi-token zones
        }
        
        // Single-token zones: 4, 5, 6, 7, 8, 9
        return tokensInZone.length === 0;
    }

    getResourceTokenAt(x, y) {
        if (!this.allZones?.score?.data) return null;
        
        // Group factions by score to detect overlaps
        const tokensByScore = {};
        Object.entries(this.resourceTokens).forEach(([faction, score]) => {
            if (score >= 0 && score <= 50) {
                if (!tokensByScore[score]) tokensByScore[score] = [];
                tokensByScore[score].push(faction);
            }
        });

        // Check each score zone
        for (const [score, factions] of Object.entries(tokensByScore)) {
            const scoreData = this.allZones.score.data[score];
            if (!scoreData || !scoreData.resources) continue;

            const resourceZone = scoreData.resources;
            let zone = resourceZone;
            
            // Convert coordinates if needed
            if (resourceZone.x1 !== undefined) {
                zone = {
                    x: resourceZone.x1,
                    y: resourceZone.y1,
                    width: resourceZone.x2 - resourceZone.x1,
                    height: resourceZone.y2 - resourceZone.y1
                };
            }
            
            // Scale coordinates to match canvas
            zone = {
                x: zone.x * this.scaleX,
                y: zone.y * this.scaleY,
                width: zone.width * this.scaleX,
                height: zone.height * this.scaleY
            };

            // Calculate subdivision if multiple tokens at same score
            const tokenCount = factions.length;
            const tokensPerRow = Math.ceil(Math.sqrt(tokenCount));
            const tokenWidth = zone.width / tokensPerRow;
            const tokenHeight = zone.height / Math.ceil(tokenCount / tokensPerRow);
            const tokenSize = 20;
            
            // Check each faction token
            for (let index = 0; index < factions.length; index++) {
                const faction = factions[index];
                const row = Math.floor(index / tokensPerRow);
                const col = index % tokensPerRow;
                
                const tokenX = zone.x + col * tokenWidth;
                const tokenY = zone.y + row * tokenHeight;
                const centerX = tokenX + tokenWidth / 2 - tokenSize / 2;
                const centerY = tokenY + tokenHeight / 2 - tokenSize / 2;
                
                if (x >= centerX && x <= centerX + tokenSize && 
                    y >= centerY && y <= centerY + tokenSize) {
                    return { faction, score: parseInt(score) };
                }
            }
        }
        
        return null;
    }

    startDraggingResourceToken(tokenInfo, mouseX, mouseY) {
        console.log(`🎯 Starting to drag resource token: ${tokenInfo.faction} at score ${tokenInfo.score}`);
        
        // Calculate drag offset
        const tokenPosition = this.getResourceTokenPosition(tokenInfo);
        if (tokenPosition) {
            this.resourceDragOffset = {
                x: mouseX - tokenPosition.x,
                y: mouseY - tokenPosition.y
            };
        } else {
            this.resourceDragOffset = { x: 10, y: 10 }; // Center of token
        }
        
        this.draggingResourceToken = tokenInfo;
        this.draw();
    }

    getResourceTokenPosition(tokenInfo) {
        if (!this.allZones?.score?.data) return null;
        
        const scoreData = this.allZones.score.data[tokenInfo.score];
        if (!scoreData || !scoreData.resources) return null;

        const resourceZone = scoreData.resources;
        let zone = resourceZone;
        
        // Convert coordinates if needed
        if (resourceZone.x1 !== undefined) {
            zone = {
                x: resourceZone.x1,
                y: resourceZone.y1,
                width: resourceZone.x2 - resourceZone.x1,
                height: resourceZone.y2 - resourceZone.y1
            };
        }
        
        // Scale coordinates to match canvas
        zone = {
            x: zone.x * this.scaleX,
            y: zone.y * this.scaleY,
            width: zone.width * this.scaleX,
            height: zone.height * this.scaleY
        };

        // Find all tokens at this score
        const factionsAtScore = [];
        Object.entries(this.resourceTokens).forEach(([faction, score]) => {
            if (score === tokenInfo.score) {
                factionsAtScore.push(faction);
            }
        });

        const tokenIndex = factionsAtScore.indexOf(tokenInfo.faction);
        if (tokenIndex === -1) return null;

        // Calculate grid position
        const tokenCount = factionsAtScore.length;
        const tokensPerRow = Math.ceil(Math.sqrt(tokenCount));
        const tokenWidth = zone.width / tokensPerRow;
        const tokenHeight = zone.height / Math.ceil(tokenCount / tokensPerRow);
        const tokenSize = 20;
        
        const row = Math.floor(tokenIndex / tokensPerRow);
        const col = tokenIndex % tokensPerRow;
        
        const tokenX = zone.x + col * tokenWidth;
        const tokenY = zone.y + row * tokenHeight;
        const centerX = tokenX + tokenWidth / 2 - tokenSize / 2;
        const centerY = tokenY + tokenHeight / 2 - tokenSize / 2;
        
        return { x: centerX, y: centerY };
    }

    drawDraggingResourceToken() {
        if (!this.draggingResourceToken) return;
        
        const tokenInfo = this.draggingResourceToken;
        const tokenSize = 20;
        
        // Draw at mouse position with offset
        const x = this.mousePos.x - this.resourceDragOffset.x;
        const y = this.mousePos.y - this.resourceDragOffset.y;
        
        // Draw with slight transparency to indicate dragging
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        
        const tokenImage = this.resourceTokenImages[tokenInfo.faction];
        if (tokenImage && tokenImage.complete && tokenImage.naturalWidth > 0) {
            this.ctx.drawImage(tokenImage, x, y, tokenSize, tokenSize);
        } else {
            // Fallback to colored rectangle
            const colors = {
                patriots: '#007bff',
                british: '#dc3545', 
                french: '#6f42c1',
                indians: '#fd7e14'
            };
            
            this.ctx.fillStyle = colors[tokenInfo.faction] || '#333';
            this.ctx.fillRect(x, y, tokenSize, tokenSize);
            
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, tokenSize, tokenSize);
        }
        
        this.ctx.restore();
    }

    dropResourceToken(mouseX, mouseY) {
        if (!this.draggingResourceToken) return;
        
        const tokenInfo = this.draggingResourceToken;
        const targetScore = this.getScoreZoneAt(mouseX, mouseY);
        
        if (targetScore !== null && targetScore >= 0 && targetScore <= 50) {
            console.log(`🎯 Dropping resource token ${tokenInfo.faction} at score ${targetScore}`);
            this.resourceTokens[tokenInfo.faction] = targetScore;
            this.updateStatistics();
        } else {
            console.log(`🎯 Invalid drop for resource token ${tokenInfo.faction}, returning to score ${tokenInfo.score}`);
        }
        
        this.draggingResourceToken = null;
        this.resourceDragOffset = { x: 0, y: 0 };
        this.draw();
    }

    getScoreZoneAt(x, y) {
        if (!this.allZones?.score?.data) return null;
        
        // Check each score zone from 0 to 50
        for (let score = 0; score <= 50; score++) {
            const scoreData = this.allZones.score.data[score];
            if (!scoreData || !scoreData.resources) continue;

            const resourceZone = scoreData.resources;
            let zone = resourceZone;
            
            // Convert coordinates if needed
            if (resourceZone.x1 !== undefined) {
                zone = {
                    x: resourceZone.x1,
                    y: resourceZone.y1,
                    width: resourceZone.x2 - resourceZone.x1,
                    height: resourceZone.y2 - resourceZone.y1
                };
            }
            
            // Scale coordinates to match canvas
            zone = {
                x: zone.x * this.scaleX,
                y: zone.y * this.scaleY,
                width: zone.width * this.scaleX,
                height: zone.height * this.scaleY
            };
            
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                return score;
            }
        }
        
        return null;
    }

    // ================ SUPPORT TOKEN DRAG & DROP ================

    getSupportTokenAt(x, y) {
        console.log(`🔍 getSupportTokenAt called with (${x}, ${y})`);
        console.log(`🔍 allZones.score available:`, !!this.allZones?.score?.data);
        console.log(`🔍 supportTokens:`, this.supportTokens);
        
        if (!this.allZones?.score?.data) {
            console.log(`❌ No score data available`);
            return null;
        }
        
        // Group support tokens by score to detect overlaps
        const tokensByScore = {};
        Object.entries(this.supportTokens).forEach(([faction, score]) => {
            if (score >= 0 && score <= 50) {
                if (!tokensByScore[score]) tokensByScore[score] = [];
                tokensByScore[score].push(faction);
            }
        });

        console.log(`🔍 tokensByScore for support:`, tokensByScore);
        
        // Check each score zone
        for (const [score, factions] of Object.entries(tokensByScore)) {
            console.log(`🔍 Checking score ${score} with factions:`, factions);
            const scoreData = this.allZones.score.data[score];
            if (!scoreData) {
                console.log(`❌ No scoreData for score ${score}`);
                continue;
            }
            if (!scoreData.support) {
                console.log(`❌ No support zone for score ${score}`);
                continue;
            }

            const supportZone = scoreData.support;
            let zone = supportZone;
            
            // Convert coordinates if needed
            if (supportZone.x1 !== undefined) {
                zone = {
                    x: supportZone.x1,
                    y: supportZone.y1,
                    width: supportZone.x2 - supportZone.x1,
                    height: supportZone.y2 - supportZone.y1
                };
            }
            
            // Scale coordinates to match canvas
            zone = {
                x: zone.x * this.scaleX,
                y: zone.y * this.scaleY,
                width: zone.width * this.scaleX,
                height: zone.height * this.scaleY
            };

            // Calculate subdivision if multiple tokens at same score
            const tokenCount = factions.length;
            const tokensPerRow = Math.ceil(Math.sqrt(tokenCount));
            const tokenWidth = zone.width / tokensPerRow;
            const tokenHeight = zone.height / Math.ceil(tokenCount / tokensPerRow);
            const tokenSize = 20;
            
            // Check each faction token
            for (let index = 0; index < factions.length; index++) {
                const faction = factions[index];
                const row = Math.floor(index / tokensPerRow);
                const col = index % tokensPerRow;
                
                const tokenX = zone.x + col * tokenWidth;
                const tokenY = zone.y + row * tokenHeight;
                const centerX = tokenX + tokenWidth / 2 - tokenSize / 2;
                const centerY = tokenY + tokenHeight / 2 - tokenSize / 2;
                
                if (x >= centerX && x <= centerX + tokenSize && 
                    y >= centerY && y <= centerY + tokenSize) {
                    return { faction, score: parseInt(score), type: 'support' };
                }
            }
        }
        
        return null;
    }

    startDraggingSupportToken(tokenInfo, mouseX, mouseY) {
        console.log(`🎯 Starting to drag support token: ${tokenInfo.faction} at score ${tokenInfo.score}`);
        
        // Calculate drag offset
        const tokenPosition = this.getSupportTokenPosition(tokenInfo);
        if (tokenPosition) {
            this.supportDragOffset = {
                x: mouseX - tokenPosition.x,
                y: mouseY - tokenPosition.y
            };
        } else {
            this.supportDragOffset = { x: 10, y: 10 }; // Center of token
        }
        
        this.draggingSupportToken = tokenInfo;
        this.showScoreZones = true; // Afficher les zones de score
        this.draw();
    }

    getSupportTokenPosition(tokenInfo) {
        if (!this.allZones?.score?.data) return null;
        
        const scoreData = this.allZones.score.data[tokenInfo.score];
        if (!scoreData || !scoreData.support) return null;

        const supportZone = scoreData.support;
        let zone = supportZone;
        
        // Convert coordinates if needed
        if (supportZone.x1 !== undefined) {
            zone = {
                x: supportZone.x1,
                y: supportZone.y1,
                width: supportZone.x2 - supportZone.x1,
                height: supportZone.y2 - supportZone.y1
            };
        }
        
        // Scale coordinates to match canvas
        zone = {
            x: zone.x * this.scaleX,
            y: zone.y * this.scaleY,
            width: zone.width * this.scaleX,
            height: zone.height * this.scaleY
        };

        // Find all tokens at this score
        const factionsAtScore = [];
        Object.entries(this.supportTokens).forEach(([faction, score]) => {
            if (score === tokenInfo.score) {
                factionsAtScore.push(faction);
            }
        });

        const tokenIndex = factionsAtScore.indexOf(tokenInfo.faction);
        if (tokenIndex === -1) return null;

        // Calculate grid position
        const tokenCount = factionsAtScore.length;
        const tokensPerRow = Math.ceil(Math.sqrt(tokenCount));
        const tokenWidth = zone.width / tokensPerRow;
        const tokenHeight = zone.height / Math.ceil(tokenCount / tokensPerRow);
        const tokenSize = 20;
        
        const row = Math.floor(tokenIndex / tokensPerRow);
        const col = tokenIndex % tokensPerRow;
        
        const tokenX = zone.x + col * tokenWidth;
        const tokenY = zone.y + row * tokenHeight;
        const centerX = tokenX + tokenWidth / 2 - tokenSize / 2;
        const centerY = tokenY + tokenHeight / 2 - tokenSize / 2;
        
        return { x: centerX, y: centerY };
    }

    drawDraggingSupportToken() {
        if (!this.draggingSupportToken) return;
        
        const tokenInfo = this.draggingSupportToken;
        const tokenSize = 20;
        
        // Draw at mouse position with offset
        const x = this.mousePos.x - this.supportDragOffset.x;
        const y = this.mousePos.y - this.supportDragOffset.y;
        
        // Draw with slight transparency to indicate dragging
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        
        const tokenImage = this.supportTokenImages[tokenInfo.faction];
        if (tokenImage && tokenImage.complete && tokenImage.naturalWidth > 0) {
            this.ctx.drawImage(tokenImage, x, y, tokenSize, tokenSize);
        } else {
            // Fallback to colored rectangle
            const colors = {
                patriots: '#ffc107', // Yellow for Patriots Opposition
                british: '#007bff'   // Blue for British Support
            };
            
            this.ctx.fillStyle = colors[tokenInfo.faction] || '#333';
            this.ctx.fillRect(x, y, tokenSize, tokenSize);
            
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, tokenSize, tokenSize);
        }
        
        this.ctx.restore();
    }

    dropSupportToken(mouseX, mouseY) {
        if (!this.draggingSupportToken) return;
        
        const tokenInfo = this.draggingSupportToken;
        const targetScore = this.getSupportScoreZoneAt(mouseX, mouseY);
        
        if (targetScore !== null && targetScore >= 0 && targetScore <= 50) {
            console.log(`🎯 Dropping support token ${tokenInfo.faction} at score ${targetScore}`);
            this.supportTokens[tokenInfo.faction] = targetScore;
            this.updateStatistics();
        } else {
            console.log(`🎯 Invalid drop for support token ${tokenInfo.faction}, returning to score ${tokenInfo.score}`);
        }
        
        this.draggingSupportToken = null;
        this.showScoreZones = false; // Cacher les zones de score
        this.supportDragOffset = { x: 0, y: 0 };
        this.draw();
    }

    getSupportScoreZoneAt(x, y) {
        if (!this.allZones?.score?.data) return null;
        
        // Check each score zone from 0 to 50
        for (let score = 0; score <= 50; score++) {
            const scoreData = this.allZones.score.data[score];
            if (!scoreData || !scoreData.support) continue;

            const supportZone = scoreData.support;
            let zone = supportZone;
            
            // Convert coordinates if needed
            if (supportZone.x1 !== undefined) {
                zone = {
                    x: supportZone.x1,
                    y: supportZone.y1,
                    width: supportZone.x2 - supportZone.x1,
                    height: supportZone.y2 - supportZone.y1
                };
            }
            
            // Scale coordinates to match canvas
            zone = {
                x: zone.x * this.scaleX,
                y: zone.y * this.scaleY,
                width: zone.width * this.scaleX,
                height: zone.height * this.scaleY
            };
            
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                return score;
            }
        }
        
        return null;
    }

    // ================ CASUALTY TOKEN DRAG & DROP ================

    getCasualtyTokenAt(x, y) {
        console.log(`🔍 getCasualtyTokenAt called with (${x}, ${y})`);
        console.log(`🔍 allZones.score available:`, !!this.allZones?.score?.data);
        console.log(`🔍 casualtyTokens:`, this.casualtyTokens);
        
        if (!this.allZones?.score?.data) {
            console.log(`❌ No score data available`);
            return null;
        }
        
        // Group casualty tokens by score to detect overlaps
        const tokensByScore = {};
        Object.entries(this.casualtyTokens).forEach(([faction, score]) => {
            if (score >= 0 && score <= 50) {
                if (!tokensByScore[score]) tokensByScore[score] = [];
                tokensByScore[score].push(faction);
            }
        });

        console.log(`🔍 tokensByScore for casualties:`, tokensByScore);
        
        // Check each score zone
        for (const [score, factions] of Object.entries(tokensByScore)) {
            console.log(`🔍 Checking casualty score ${score} with factions:`, factions);
            const scoreData = this.allZones.score.data[score];
            if (!scoreData) {
                console.log(`❌ No scoreData for casualty score ${score}`);
                continue;
            }
            if (!scoreData.casualties) {
                console.log(`❌ No casualties zone for score ${score}`);
                continue;
            }

            const casualtyZone = scoreData.casualties;
            let zone = casualtyZone;
            
            // Convert coordinates if needed
            if (casualtyZone.x1 !== undefined) {
                zone = {
                    x: casualtyZone.x1,
                    y: casualtyZone.y1,
                    width: casualtyZone.x2 - casualtyZone.x1,
                    height: casualtyZone.y2 - casualtyZone.y1
                };
            }
            
            // Scale coordinates to match canvas
            zone = {
                x: zone.x * this.scaleX,
                y: zone.y * this.scaleY,
                width: zone.width * this.scaleX,
                height: zone.height * this.scaleY
            };

            // Calculate subdivision if multiple tokens at same score
            const tokenCount = factions.length;
            const tokensPerRow = Math.ceil(Math.sqrt(tokenCount));
            const tokenWidth = zone.width / tokensPerRow;
            const tokenHeight = zone.height / Math.ceil(tokenCount / tokensPerRow);
            const tokenSize = 20;
            
            // Check each faction token
            for (let index = 0; index < factions.length; index++) {
                const faction = factions[index];
                const row = Math.floor(index / tokensPerRow);
                const col = index % tokensPerRow;
                
                const tokenX = zone.x + col * tokenWidth;
                const tokenY = zone.y + row * tokenHeight;
                const centerX = tokenX + tokenWidth / 2 - tokenSize / 2;
                const centerY = tokenY + tokenHeight / 2 - tokenSize / 2;
                
                if (x >= centerX && x <= centerX + tokenSize && 
                    y >= centerY && y <= centerY + tokenSize) {
                    return { faction, score: parseInt(score), type: 'casualty' };
                }
            }
        }
        
        return null;
    }

    startDraggingCasualtyToken(tokenInfo, mouseX, mouseY) {
        console.log(`🎯 Starting to drag casualty token: ${tokenInfo.faction} at score ${tokenInfo.score}`);
        
        // Calculate drag offset
        const tokenPosition = this.getCasualtyTokenPosition(tokenInfo);
        if (tokenPosition) {
            this.casualtyDragOffset = {
                x: mouseX - tokenPosition.x,
                y: mouseY - tokenPosition.y
            };
        } else {
            this.casualtyDragOffset = { x: 10, y: 10 }; // Center of token
        }
        
        this.draggingCasualtyToken = tokenInfo;
        this.showScoreZones = true; // Afficher les zones de score
        this.draw();
    }

    getCasualtyTokenPosition(tokenInfo) {
        if (!this.allZones?.score?.data) return null;
        
        const scoreData = this.allZones.score.data[tokenInfo.score];
        if (!scoreData || !scoreData.casualties) return null;

        const casualtyZone = scoreData.casualties;
        let zone = casualtyZone;
        
        // Convert coordinates if needed
        if (casualtyZone.x1 !== undefined) {
            zone = {
                x: casualtyZone.x1,
                y: casualtyZone.y1,
                width: casualtyZone.x2 - casualtyZone.x1,
                height: casualtyZone.y2 - casualtyZone.y1
            };
        }
        
        // Scale coordinates to match canvas
        zone = {
            x: zone.x * this.scaleX,
            y: zone.y * this.scaleY,
            width: zone.width * this.scaleX,
            height: zone.height * this.scaleY
        };

        // Find all tokens at this score
        const factionsAtScore = [];
        Object.entries(this.casualtyTokens).forEach(([faction, score]) => {
            if (score === tokenInfo.score) {
                factionsAtScore.push(faction);
            }
        });

        const tokenIndex = factionsAtScore.indexOf(tokenInfo.faction);
        if (tokenIndex === -1) return null;

        // Calculate grid position
        const tokenCount = factionsAtScore.length;
        const tokensPerRow = Math.ceil(Math.sqrt(tokenCount));
        const tokenWidth = zone.width / tokensPerRow;
        const tokenHeight = zone.height / Math.ceil(tokenCount / tokensPerRow);
        const tokenSize = 20;
        
        const row = Math.floor(tokenIndex / tokensPerRow);
        const col = tokenIndex % tokensPerRow;
        
        const tokenX = zone.x + col * tokenWidth;
        const tokenY = zone.y + row * tokenHeight;
        const centerX = tokenX + tokenWidth / 2 - tokenSize / 2;
        const centerY = tokenY + tokenHeight / 2 - tokenSize / 2;
        
        return { x: centerX, y: centerY };
    }

    drawDraggingCasualtyToken() {
        if (!this.draggingCasualtyToken) return;
        
        const tokenInfo = this.draggingCasualtyToken;
        const tokenSize = 20;
        
        // Draw at mouse position with offset
        const x = this.mousePos.x - this.casualtyDragOffset.x;
        const y = this.mousePos.y - this.casualtyDragOffset.y;
        
        // Draw with slight transparency to indicate dragging
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        
        const tokenImage = this.casualtyTokenImages[tokenInfo.faction];
        if (tokenImage && tokenImage.complete && tokenImage.naturalWidth > 0) {
            this.ctx.drawImage(tokenImage, x, y, tokenSize, tokenSize);
        } else {
            // Fallback to colored rectangle - black for casualties
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(x, y, tokenSize, tokenSize);
            
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, tokenSize, tokenSize);
        }
        
        this.ctx.restore();
    }

    dropCasualtyToken(mouseX, mouseY) {
        if (!this.draggingCasualtyToken) return;
        
        const tokenInfo = this.draggingCasualtyToken;
        const targetScore = this.getCasualtyScoreZoneAt(mouseX, mouseY);
        
        if (targetScore !== null && targetScore >= 0 && targetScore <= 50) {
            console.log(`🎯 Dropping casualty token ${tokenInfo.faction} at score ${targetScore}`);
            this.casualtyTokens[tokenInfo.faction] = targetScore;
            this.updateStatistics();
        } else {
            console.log(`🎯 Invalid drop for casualty token ${tokenInfo.faction}, returning to score ${tokenInfo.score}`);
        }
        
        this.draggingCasualtyToken = null;
        this.showScoreZones = false; // Cacher les zones de score
        this.casualtyDragOffset = { x: 0, y: 0 };
        this.draw();
    }

    drawScoreZones() {
        if (!this.showScoreZones || !this.allZones?.score?.data) return;
        
        console.log('🎯 Drawing score zones...');
        
        // Dessiner toutes les zones de score de 0 à 50
        for (let score = 0; score <= 50; score++) {
            const scoreData = this.allZones.score.data[score];
            if (!scoreData || !scoreData.support) continue;
            
            const zone = scoreData.support;
            let zoneRect;
            
            // Convert coordinates if needed
            if (zone.x1 !== undefined) {
                zoneRect = {
                    x: zone.x1 * this.scaleX,
                    y: zone.y1 * this.scaleY,
                    width: (zone.x2 - zone.x1) * this.scaleX,
                    height: (zone.y2 - zone.y1) * this.scaleY
                };
            } else {
                zoneRect = {
                    x: zone.x * this.scaleX,
                    y: zone.y * this.scaleY,
                    width: zone.width * this.scaleX,
                    height: zone.height * this.scaleY
                };
            }
            
            // Dessiner la zone avec une bordure colorée
            this.ctx.strokeStyle = '#00ff00'; // Vert
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]); // Pointillés
            this.ctx.strokeRect(zoneRect.x, zoneRect.y, zoneRect.width, zoneRect.height);
            
            // Dessiner le fond semi-transparent
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            this.ctx.fillRect(zoneRect.x, zoneRect.y, zoneRect.width, zoneRect.height);
            
            // Dessiner le numéro au centre
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const centerX = zoneRect.x + zoneRect.width / 2;
            const centerY = zoneRect.y + zoneRect.height / 2;
            
            // Fond blanc pour le texte
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            const textMetrics = this.ctx.measureText(score.toString());
            const padding = 4;
            this.ctx.fillRect(
                centerX - textMetrics.width / 2 - padding,
                centerY - 8 - padding,
                textMetrics.width + padding * 2,
                16 + padding * 2
            );
            
            // Texte noir
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(score.toString(), centerX, centerY);
        }
        
        // Remettre les styles par défaut
        this.ctx.setLineDash([]);
    }

    getCasualtyScoreZoneAt(x, y) {
        if (!this.allZones?.score?.data) return null;
        
        // Check each score zone from 0 to 50
        for (let score = 0; score <= 50; score++) {
            const scoreData = this.allZones.score.data[score];
            if (!scoreData || !scoreData.casualties) continue;

            const casualtyZone = scoreData.casualties;
            let zone = casualtyZone;
            
            // Convert coordinates if needed
            if (casualtyZone.x1 !== undefined) {
                zone = {
                    x: casualtyZone.x1,
                    y: casualtyZone.y1,
                    width: casualtyZone.x2 - casualtyZone.x1,
                    height: casualtyZone.y2 - casualtyZone.y1
                };
            }
            
            // Scale coordinates to match canvas
            zone = {
                x: zone.x * this.scaleX,
                y: zone.y * this.scaleY,
                width: zone.width * this.scaleX,
                height: zone.height * this.scaleY
            };
            
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                return score;
            }
        }
        
        return null;
    }
    
    drawZoneOutline(zone, color, label) {
        // Convertir les coordonnées natives en coordonnées canvas
        const canvasZone = {
            x: zone.x * this.scaleX,
            y: zone.y * this.scaleY,
            width: zone.width * this.scaleX,
            height: zone.height * this.scaleY
        };
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(canvasZone.x, canvasZone.y, canvasZone.width, canvasZone.height);
        this.ctx.setLineDash([]);
        
        // Dessiner le label
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(label, canvasZone.x + 5, canvasZone.y - 5);
    }
    
    drawCurrentZoneDefinition() {
        const { startX, startY, currentX, currentY } = this.zoneDefinition;
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([3, 3]);
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.setLineDash([]);
        
        // Afficher les dimensions
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`${Math.round(width)}x${Math.round(height)}`, x + 5, y - 5);
    }
    
    drawCardInZone(zoneType, zone, card) {
        console.log(`🎨 drawCardInZone called - zoneType: ${zoneType}, hasCard: ${!!card}, cardName: ${card ? card.name : 'none'}`);
        
        // Convertir les coordonnées natives en coordonnées canvas
        const canvasZone = {
            x: zone.x * this.scaleX,
            y: zone.y * this.scaleY,
            width: zone.width * this.scaleX,
            height: zone.height * this.scaleY
        };
        
        console.log(`📐 Canvas zone: ${JSON.stringify(canvasZone)}`);
        
        let cardImage;
        
        if (zoneType === 'deck') {
            // Pour le deck: si une carte est sélectionnée, l'afficher, sinon afficher le dos
            if (card) {
                console.log(`🎴 Deck zone - showing specific card: ${card.name}`);
                cardImage = this.getCardImage(card);
            } else {
                console.log(`🎴 Deck zone - showing default card back`);
                cardImage = this.cardSystem.cardBackImage;
            }
            console.log(`🎴 Card image status: loaded=${cardImage ? cardImage.complete : 'null'}, naturalWidth=${cardImage ? cardImage.naturalWidth : 'null'}`);
        } else if (zoneType === 'sequence') {
            // Pour la séquence: afficher la carte face visible si elle existe
            if (card) {
                console.log(`🎴 Sequence zone - getting card image for: ${card.name}`);
                cardImage = this.getCardImage(card);
            } else {
                console.log(`🎴 Sequence zone - no card to display`);
            }
        }
        
        // Dessiner la carte si on a une image
        // Pour le deck, toujours afficher quelque chose (image ou fallback)
        const shouldDrawCard = (cardImage && cardImage.complete && cardImage.naturalWidth > 0) || 
                               (zoneType === 'deck') || 
                               (zoneType === 'sequence' && card);
        
        if (cardImage && cardImage.complete && cardImage.naturalWidth > 0) {
            console.log(`✅ Drawing card image - dimensions: ${cardImage.naturalWidth}x${cardImage.naturalHeight}`);
        } else {
            console.log(`❌ Cannot draw card image - cardImage: ${!!cardImage}, complete: ${cardImage ? cardImage.complete : 'n/a'}, naturalWidth: ${cardImage ? cardImage.naturalWidth : 'n/a'}`);
            if (shouldDrawCard) {
                console.log(`🎨 Will draw fallback for ${zoneType} zone`);
            }
        }
        
        if (cardImage && cardImage.complete && cardImage.naturalWidth > 0) {
            // Calculer les dimensions pour s'adapter à la zone en gardant le ratio
            const cardRatio = cardImage.naturalWidth / cardImage.naturalHeight;
            const zoneRatio = canvasZone.width / canvasZone.height;
            
            let cardWidth, cardHeight, cardX, cardY;
            
            if (cardRatio > zoneRatio) {
                // La carte est plus large proportionnellement que la zone
                cardWidth = canvasZone.width * 0.9; // Laisser un peu de marge
                cardHeight = cardWidth / cardRatio;
            } else {
                // La carte est plus haute proportionnellement que la zone
                cardHeight = canvasZone.height * 0.9; // Laisser un peu de marge
                cardWidth = cardHeight * cardRatio;
            }
            
            // Centrer la carte dans la zone
            cardX = canvasZone.x + (canvasZone.width - cardWidth) / 2;
            cardY = canvasZone.y + (canvasZone.height - cardHeight) / 2;
            
            // Dessiner la carte
            this.ctx.drawImage(cardImage, cardX, cardY, cardWidth, cardHeight);
            
            console.log(`🎴 Drew ${card ? card.name : 'card back'} in ${zoneType} zone`);
        } else if (shouldDrawCard) {
            // Fallback: dessiner un rectangle coloré si l'image ne se charge pas
            this.drawCardFallback(zoneType, canvasZone, card);
        }
    }
    
    drawCardFallback(zoneType, canvasZone, card) {
        console.log(`🎨 Drawing fallback rectangle for ${zoneType} zone`);
        
        // Couleur de fond selon le type de zone
        if (zoneType === 'deck') {
            this.ctx.fillStyle = '#2c3e50'; // Bleu foncé pour le deck
        } else if (zoneType === 'sequence') {
            this.ctx.fillStyle = '#e74c3c'; // Rouge pour la séquence
        }
        
        // Dessiner le rectangle avec une marge
        const margin = 5;
        this.ctx.fillRect(
            canvasZone.x + margin, 
            canvasZone.y + margin, 
            canvasZone.width - 2 * margin, 
            canvasZone.height - 2 * margin
        );
        
        // Ajouter du texte
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let text;
        if (zoneType === 'deck') {
            text = card ? 'DECK\n(Face cachée)' : 'DECK\n(Vide)';
        } else if (zoneType === 'sequence') {
            text = card ? card.name : 'SEQUENCE\n(Vide)';
        }
        
        // Dessiner le texte (gérer les sauts de ligne)
        const lines = text.split('\n');
        const lineHeight = 18;
        const startY = canvasZone.y + canvasZone.height/2 - (lines.length - 1) * lineHeight/2;
        
        lines.forEach((line, index) => {
            this.ctx.fillText(
                line, 
                canvasZone.x + canvasZone.width/2, 
                startY + index * lineHeight
            );
        });
        
        // Restaurer les styles par défaut
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }

    // === SYSTÈME DE CARTES ===
    
    async initializeCardSystem() {
        console.log('🎴 Initializing card system...');
        
        // Charger l'image du dos de carte
        this.loadCardBackImage();
        
        // Charger la liste des cartes
        await this.loadCardList();
        
        // Charger les configurations de cartes
        await this.loadCardConfigs();
        
        // Charger les zones (séquence existante + deck sauvegardé)
        this.loadCardZones();
        
        // Setup des event listeners pour le système de cartes
        this.setupCardEventListeners();
        
        console.log('✅ Card system initialized');
        
        // Redessiner le plateau pour afficher les zones de cartes
        this.draw();
    }
    
    async loadCardList() {
        console.log('📋 Loading card list...');
        
        const cardFolders = [
            '/Users/loicstrauch/PycharmProjects/libertyanddeath/Images/Cartes',
            '/Users/loicstrauch/PycharmProjects/libertyanddeath/Images/Cartes spéciales'
        ];
        
        const cardPaths = [
            '/Images/Cartes/',
            '/Images/Cartes%20sp%C3%A9ciales/'
        ];
        
        this.cardSystem.allCards = [];
        
        // Liste des cartes avec leurs vrais noms (sans les numéros de début)
        const cartes = [
            { fileName: '01 Untitled', displayName: 'Untitled' },
            { fileName: '02 Common Sense', displayName: 'Common Sense' },
            { fileName: '03 George Rogers Clark\'s Illinois Campaign', displayName: 'George Rogers Clark\'s Illinois Campaign' },
            { fileName: '04 Penobscot Expedition', displayName: 'Penobscot Expedition' },
            { fileName: '05 William Lord Stirling', displayName: 'William Lord Stirling' },
            { fileName: '06 Benedict Arnold', displayName: 'Benedict Arnold' },
            { fileName: '07 John Paul Jones', displayName: 'John Paul Jones' },
            { fileName: '08 Culper Spy Ring', displayName: 'Culper Spy Ring' },
            { fileName: '09 Friedrich Wilhelm von Steuben', displayName: 'Friedrich Wilhelm von Steuben' },
            { fileName: '11 Thaddeus Kosciuszkho Expert Engineer', displayName: 'Thaddeus Kosciuszkho Expert Engineer' },
            { fileName: '12 Martha Washington to Valley Forge', displayName: 'Martha Washington to Valley Forge' },
            { fileName: '13 the origin of all our misfortunes', displayName: 'The origin of all our misfortunes' },
            { fileName: '14 Overmountain Men Fight for NC', displayName: 'Overmountain Men Fight for NC' },
            { fileName: '15 Morgan\'s Rifles', displayName: 'Morgan\'s Rifles' },
            { fileName: '16 Mercy Warren\'s The Motley Assembly', displayName: 'Mercy Warren\'s The Motley Assembly' },
            { fileName: '17 Jane McCrea Murdered by Indians', displayName: 'Jane McCrea Murdered by Indians' },
            { fileName: '18 If it hadn\'t been so stormy', displayName: 'If it hadn\'t been so stormy' },
            { fileName: '19 Legend of Nathan Hale', displayName: 'Legend of Nathan Hale' },
            { fileName: '20 Continental Marines', displayName: 'Continental Marines' },
            { fileName: '21 The Gamecock Thomas Sumter', displayName: 'The Gamecock Thomas Sumter' },
            { fileName: '22 The Newburgh Conspiracy', displayName: 'The Newburgh Conspiracy' },
            { fileName: '23 Lieutenant Colonel Francis Marion', displayName: 'Lieutenant Colonel Francis Marion' },
            { fileName: '24 Declaration of Independence', displayName: 'Declaration of Independence' },
            { fileName: '25 British Prison Ships', displayName: 'British Prison Ships' },
            { fileName: '26 Josia Martin NC Royal Governor Plots', displayName: 'Josia Martin NC Royal Governor Plots' },
            { fileName: '27 The Queen\'s Rangers Show for Battle', displayName: 'The Queen\'s Rangers Show for Battle' },
            { fileName: '28 Battle of Moore\'s Creek Bridge', displayName: 'Battle of Moore\'s Creek Bridge' },
            { fileName: '29 Edward Bancroft, British Spy', displayName: 'Edward Bancroft, British Spy' },
            { fileName: '30 Hessians', displayName: 'Hessians' },
            { fileName: '31 Thomas Brown & the King\'s Rangers', displayName: 'Thomas Brown & the King\'s Rangers' },
            { fileName: '32 Rule Britannia', displayName: 'Rule Britannia' },
            { fileName: '33 The Burning of Falmouth', displayName: 'The Burning of Falmouth' },
            { fileName: '34 Lord Sandwich, First Lord of the Admiralty', displayName: 'Lord Sandwich, First Lord of the Admiralty' },
            { fileName: '35 Tryon Plot', displayName: 'Tryon Plot' },
            { fileName: '36 Naval Battle in West Indies', displayName: 'Naval Battle in West Indies' },
            { fileName: '37 The Armada of 1779', displayName: 'The Armada of 1779' },
            { fileName: '38 Johnson\'s Royal Greens', displayName: 'Johnson\'s Royal Greens' },
            { fileName: '39 Gordon Riots', displayName: 'Gordon Riots' },
            { fileName: '40 Battle of the Chesapeake', displayName: 'Battle of the Chesapeake' },
            { fileName: '41 William Pitt America Can\'t Be Conquered', displayName: 'William Pitt America Can\'t Be Conquered' },
            { fileName: '42 British Attack Danbury', displayName: 'British Attack Danbury' },
            { fileName: '43 HMS Russian Merchant with 4,000 Muskets', displayName: 'HMS Russian Merchant with 4,000 Muskets' },
            { fileName: '44 Earl of Mansfield Recalled from Paris', displayName: 'Earl of Mansfield Recalled from Paris' },
            { fileName: '45 Adam Smith Wealth of Nations', displayName: 'Adam Smith Wealth of Nations' },
            { fileName: '46 Edmund Burke on Conciliation', displayName: 'Edmund Burke on Conciliation' },
            { fileName: '47 Tories Tested', displayName: 'Tories Tested' },
            { fileName: '48 God Save the King', displayName: 'God Save the King' },
            { fileName: '49 Claude Louise, Comte de Saint-Germain', displayName: 'Claude Louise, Comte de Saint-Germain' },
            { fileName: '50 Admiral d\'Estang, French Fleet Arrives', displayName: 'Admiral d\'Estang, French Fleet Arrives' },
            { fileName: '51 Bermuda Gunpowder Plot', displayName: 'Bermuda Gunpowder Plot' },
            { fileName: '52 French Fleet Arrives in the Wrong Spot', displayName: 'French Fleet Arrives in the Wrong Spot' },
            { fileName: '53 French Ports Accept Patriot\'s Ships', displayName: 'French Ports Accept Patriot\'s Ships' },
            { fileName: '54 Antoine de Sartine, Secretary of the Navy', displayName: 'Antoine de Sartine, Secretary of the Navy' },
            { fileName: '55 French Navy Dominates Caribbean', displayName: 'French Navy Dominates Caribbean' },
            { fileName: '56 Jacques Turgot\'s Economic Liberalism', displayName: 'Jacques Turgot\'s Economic Liberalism' },
            { fileName: '57 French Fleet Sails for the Carribean', displayName: 'French Fleet Sails for the Carribean' },
            { fileName: '58 Marquis de Lafayette Arrives in Colonies', displayName: 'Marquis de Lafayette Arrives in Colonies' },
            { fileName: '59 Tronson du Coudray Arrives in America', displayName: 'Tronson du Coudray Arrives in America' },
            { fileName: '60 Comte d\'Orvilliers Builds a Fleet at Brest', displayName: 'Comte d\'Orvilliers Builds a Fleet at Brest' },
            { fileName: '61 Minister Comte de Vergennes', displayName: 'Minister Comte de Vergennes' },
            { fileName: '62 Charles Michel de Langlade', displayName: 'Charles Michel de Langlade' },
            { fileName: '63 French and Spanish Besiege Gibraltar', displayName: 'French and Spanish Besiege Gibraltar' },
            { fileName: '64 The Affair of Fielding and Bylandt', displayName: 'The Affair of Fielding and Bylandt' },
            { fileName: '65 Jacques Necker, Finance Minister', displayName: 'Jacques Necker, Finance Minister' },
            { fileName: '66 Don Bernardo Takes Pensacola', displayName: 'Don Bernardo Takes Pensacola' },
            { fileName: '67 De Grasse Arrives with the French Fleet', displayName: 'De Grasse Arrives with the French Fleet' },
            { fileName: '68 French in America Want Canada', displayName: 'French in America Want Canada' },
            { fileName: '69 Admiral Pierre Andre de Suffren', displayName: 'Admiral Pierre Andre de Suffren' },
            { fileName: '70 British Gain from French in India', displayName: 'British Gain from French in India' },
            { fileName: '71 Treaty of Amity and Commerce', displayName: 'Treaty of Amity and Commerce' },
            { fileName: '72 French Settlers Help', displayName: 'French Settlers Help' },
            { fileName: '73 Sullivan Expedition vs Iroquois and Tories', displayName: 'Sullivan Expedition vs Iroquois and Tories' },
            { fileName: '74 Chickasaw Ally with the British', displayName: 'Chickasaw Ally with the British' },
            { fileName: '75 Congress\' Speech to the Six Nations', displayName: 'Congress\' Speech to the Six Nations' },
            { fileName: '76 Edward Hand Raids into Indian Country', displayName: 'Edward Hand Raids into Indian Country' },
            { fileName: '77 General Burgoyne Cracks Down', displayName: 'General Burgoyne Cracks Down' },
            { fileName: '78 Cherry Valley Destroyed by Tories', displayName: 'Cherry Valley Destroyed by Tories' },
            { fileName: '79 Tuscarora and Oneida Come to Washington', displayName: 'Tuscarora and Oneida Come to Washington' },
            { fileName: '80 Confusion Allows Slaves to Escape', displayName: 'Confusion Allows Slaves to Escape' },
            { fileName: '81 Creek and Seminole Active in South', displayName: 'Creek and Seminole Active in South' },
            { fileName: '82 Frustrated Shawnee Warriors Attack', displayName: 'Frustrated Shawnee Warriors Attack' },
            { fileName: '83 Guy Carleton and Indians Negotiate', displayName: 'Guy Carleton and Indians Negotiate' },
            { fileName: '84 Merciless Indian Savages', displayName: 'Merciless Indian Savages' },
            { fileName: '85 Indians Help British Raids on Mississippi', displayName: 'Indians Help British Raids on Mississippi' },
            { fileName: '86 Stockbridge Indians', displayName: 'Stockbridge Indians' },
            { fileName: '87 Patriots Massacre Lenape Indians', displayName: 'Patriots Massacre Lenape Indians' },
            { fileName: '88 If it hadn\'t been so foggy', displayName: 'If it hadn\'t been so foggy' },
            { fileName: '89 War Damages Colonies\' Economy', displayName: 'War Damages Colonies\' Economy' },
            { fileName: '90 The World Turned Upside Down', displayName: 'The World Turned Upside Down' },
            { fileName: '91 Indians Help British Outside Colonies', displayName: 'Indians Help British Outside Colonies' },
            { fileName: '92 Cherokees Supplied by the British', displayName: 'Cherokees Supplied by the British' },
            { fileName: '93 Wyoming Massacre', displayName: 'Wyoming Massacre' },
            { fileName: '94 Herkimer\'s Relief Column', displayName: 'Herkimer\'s Relief Column' },
            { fileName: '95 Ohio Country Frontier Erupts', displayName: 'Ohio Country Frontier Erupts' },
            { fileName: '96 Iroquois Confederacy', displayName: 'Iroquois Confederacy' },
            { fileName: '97 Winter Quarters', displayName: 'Winter Quarters' },
            { fileName: '98 Winter Quarters', displayName: 'Winter Quarters' },
            { fileName: '99 Winter Quarters', displayName: 'Winter Quarters' },
            { fileName: '101 Winter Quarters', displayName: 'Winter Quarters' },
            { fileName: '102 Winter Quarters', displayName: 'Winter Quarters' },
            { fileName: '104 Winter Quarters', displayName: 'Winter Quarters' }
        ];
        
        const cartesSpeciales = [
            { fileName: '105 Patriots Brilliant Stroke', displayName: 'Patriots Brilliant Stroke' },
            { fileName: '106 British Brilliant Stroke', displayName: 'British Brilliant Stroke' },
            { fileName: '107 French Brilliant Stroke', displayName: 'French Brilliant Stroke' },
            { fileName: '108 Indians Brilliant Stroke', displayName: 'Indians Brilliant Stroke' },
            { fileName: '109 Treaty of Alliance Brilliant Stroke', displayName: 'Treaty of Alliance Brilliant Stroke' },
            { fileName: '110 Leader Capabilities', displayName: 'Leader Capabilities' }
        ];
        
        // Ajouter toutes les cartes à la liste
        cartes.forEach(card => {
            this.cardSystem.allCards.push({
                name: card.displayName,
                fileName: card.fileName,
                fullFileName: card.fileName + '.png',
                path: cardPaths[0] + card.fileName + '.png',
                type: 'normale'
            });
        });
        
        cartesSpeciales.forEach(card => {
            this.cardSystem.allCards.push({
                name: card.displayName,
                fileName: card.fileName,
                fullFileName: card.fileName + '.png',
                path: cardPaths[1] + card.fileName + '.png',
                type: 'speciale'
            });
        });
        
        console.log(`📋 Loaded ${this.cardSystem.allCards.length} cards`);
    }
    
    async loadCardConfigs() {
        console.log('⚙️ Loading card configurations...');
        
        try {
            const response = await fetch('cards-description.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.cardSystem.cardConfigs = data.cardConfigs;
            
            console.log(`⚙️ Loaded configurations for ${Object.keys(this.cardSystem.cardConfigs).length} cards`);
        } catch (error) {
            console.error('❌ Failed to load card configurations:', error);
            this.cardSystem.cardConfigs = {};
        }
    }
    
    loadCardBackImage() {
        console.log('🎴 Loading card back image...');
        
        this.cardSystem.cardBackImage = new Image();
        
        // Essayer plusieurs chemins possibles
        const cardBackPaths = [
            '/Images/Dos%20de%20carte/Card%20Back.png',
            '/Images/Dos de carte/Card Back.png',
            '../Images/Dos%20de%20carte/Card%20Back.png'
        ];
        
        this.tryLoadCardBackImage(cardBackPaths, 0);
    }
    
    tryLoadCardBackImage(paths, index) {
        if (index >= paths.length) {
            console.warn('⚠️ Card back image not found - will use placeholder');
            return;
        }
        
        const currentPath = paths[index];
        console.log(`🔄 Trying card back path ${index + 1}/${paths.length}: ${currentPath}`);
        
        this.cardSystem.cardBackImage.src = currentPath;
        this.cardSystem.cardBackImage.onload = () => {
            console.log(`✅ Card back image loaded from: ${currentPath}`);
            console.log(`📐 Image dimensions: ${this.cardSystem.cardBackImage.naturalWidth}x${this.cardSystem.cardBackImage.naturalHeight}`);
            this.draw(); // Redessiner pour afficher le dos de carte par défaut
        };
        this.cardSystem.cardBackImage.onerror = () => {
            console.log(`❌ Failed to load from: ${currentPath}`);
            // Essayer le chemin suivant
            this.tryLoadCardBackImage(paths, index + 1);
        };
    }
    
    loadCardZones() {
        console.log('🎯 Loading card zones...');
        console.log('🔍 allZones available:', !!this.allZones);
        console.log('🔍 allZones.gameplay available:', !!this.allZones?.gameplay);
        console.log('🔍 allZones.gameplay.data available:', !!this.allZones?.gameplay?.data);
        console.log('🔍 game_sequence available:', !!this.allZones?.gameplay?.data?.game_sequence);
        console.log('🔍 sequence[1] available:', !!this.allZones?.gameplay?.data?.game_sequence?.['1']);
        
        // Charger la zone séquence depuis les zones gameplay existantes
        if (this.allZones?.gameplay?.data?.game_sequence?.['1']) {
            const sequenceZoneData = this.allZones.gameplay.data.game_sequence['1'];
            this.cardSystem.sequenceZone = {
                x: sequenceZoneData.x1,
                y: sequenceZoneData.y1,
                width: sequenceZoneData.x2 - sequenceZoneData.x1,
                height: sequenceZoneData.y2 - sequenceZoneData.y1
            };
            console.log('✅ Sequence zone loaded from gameplay zones:', this.cardSystem.sequenceZone);
        } else {
            console.log('⚠️ Sequence zone not found in allZones');
            // Fallback: essayer de charger directement depuis gameplay_zones.json
            this.loadSequenceZoneFromFile();
        }
        
        // Charger la zone deck depuis le fichier JSON
        this.loadDeckZoneFromFile();
    }
    
    async loadSequenceZoneFromFile() {
        console.log('🔄 Loading sequence zone directly from file...');
        try {
            const response = await fetch('gameplay_zones.json');
            const gameplayZones = await response.json();
            
            if (gameplayZones.game_sequence?.['1']) {
                const sequenceZoneData = gameplayZones.game_sequence['1'];
                this.cardSystem.sequenceZone = {
                    x: sequenceZoneData.x1,
                    y: sequenceZoneData.y1,
                    width: sequenceZoneData.x2 - sequenceZoneData.x1,
                    height: sequenceZoneData.y2 - sequenceZoneData.y1
                };
                console.log('✅ Sequence zone loaded from file:', this.cardSystem.sequenceZone);
                this.draw(); // Redessiner pour afficher la zone
            }
        } catch (error) {
            console.error('❌ Failed to load sequence zone from file:', error);
        }
    }
    
    async loadDeckZoneFromFile() {
        console.log('🔄 Loading deck zone from file...');
        try {
            const response = await fetch('deck_zone.json');
            const data = await response.json();
            
            if (data.deckZone) {
                this.cardSystem.deckZone = data.deckZone;
                console.log('✅ Deck zone loaded from file:', this.cardSystem.deckZone);
                this.updateDeckZoneStatus();
                this.draw(); // Redessiner pour afficher la zone
            } else {
                console.log('ℹ️ No deck zone found in file');
            }
        } catch (error) {
            console.log('ℹ️ Deck zone file not found or invalid, creating new one');
        }
    }

    
    updateDeckZoneStatus() {
        const statusSpan = document.querySelector('.control-group span');
        if (statusSpan && this.cardSystem.deckZone) {
            statusSpan.innerHTML = '🎯 Zone Sequence définie ✅ Zone Deck définie';
            statusSpan.style.color = '#28a745';
        }
    }
    
    setupCardEventListeners() {
        const cardSearch = document.getElementById('card-search');
        const cardSuggestions = document.getElementById('card-suggestions');
        
        if (!cardSearch || !cardSuggestions) {
            console.log('⚠️ Card search elements not found');
            return;
        }
        
        // Event listener pour la recherche de cartes
        cardSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query.length < 2) {
                cardSuggestions.style.display = 'none';
                return;
            }
            
            this.showCardSuggestions(query);
        });
        
        // Cacher les suggestions quand on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.card-input-container')) {
                cardSuggestions.style.display = 'none';
            }
        });
    }
    
    showCardSuggestions(query) {
        const cardSuggestions = document.getElementById('card-suggestions');
        
        // Filtrer les cartes qui correspondent à la recherche
        const matchingCards = this.cardSystem.allCards.filter(card =>
            card.name.toLowerCase().includes(query)
        ).slice(0, 10); // Limiter à 10 résultats
        
        if (matchingCards.length === 0) {
            cardSuggestions.style.display = 'none';
            return;
        }
        
        // Afficher les suggestions
        cardSuggestions.innerHTML = '';
        matchingCards.forEach(card => {
            const suggestion = document.createElement('div');
            suggestion.className = 'card-suggestion';
            suggestion.textContent = card.name;
            suggestion.addEventListener('click', () => {
                this.selectCard(card);
                cardSuggestions.style.display = 'none';
                document.getElementById('card-search').value = '';
            });
            cardSuggestions.appendChild(suggestion);
        });
        
        cardSuggestions.style.display = 'block';
    }
    
    selectCard(card) {
        console.log(`🎴 Card selected: ${card.name}`);
        console.log(`🎴 Current state - Deck: ${this.cardSystem.currentDeckCard ? this.cardSystem.currentDeckCard.name : 'empty'}, Sequence: ${this.cardSystem.currentSequenceCard ? this.cardSystem.currentSequenceCard.name : 'empty'}`);
        
        // Si aucune carte n'est encore tirée, placer sur sequence (1)
        if (!this.cardSystem.currentDeckCard && !this.cardSystem.currentSequenceCard) {
            console.log(`📍 Case 1: No cards placed yet - placing ${card.name} on sequence`);
            this.setSequenceCard(card);
            this.animateCardPlacement('sequence', card);
            console.log(`📍 First card placed on sequence: ${card.name}`);
        }
        // Si il y a une carte sur sequence mais pas sur deck
        else if (this.cardSystem.currentSequenceCard && !this.cardSystem.currentDeckCard) {
            console.log(`📍 Case 2: Sequence has card, deck empty - placing ${card.name} on deck`);
            this.cardSystem.currentDeckCard = card;
            this.updateCardStatus();
            this.animateCardPlacement('deck', card);
            console.log(`📍 Second card placed on deck: ${card.name}`);
        }
        // Rotation : deck → sequence, nouvelle carte → deck
        else {
            console.log(`📍 Case 3: Both zones occupied - rotating cards`);
            // Animer la rotation des cartes
            this.animateCardRotation(this.cardSystem.currentDeckCard, card);
        }
        
        console.log(`🎴 New state - Deck: ${this.cardSystem.currentDeckCard ? this.cardSystem.currentDeckCard.name : 'empty'}, Sequence: ${this.cardSystem.currentSequenceCard ? this.cardSystem.currentSequenceCard.name : 'empty'}`);
    }
    
    animateCardPlacement(location, card) {
        console.log(`🎬 Starting card placement animation: ${card.name} to ${location}`);
        
        // Animation simple: faire clignoter la zone
        let blinkCount = 0;
        const maxBlinks = 3;
        
        const blink = () => {
            if (blinkCount < maxBlinks) {
                // Redessiner normalement
                this.draw();
                
                setTimeout(() => {
                    // Surbrillance de la zone
                    this.highlightZone(location);
                    blinkCount++;
                    
                    setTimeout(blink, 200);
                }, 200);
            } else {
                // Animation terminée
                this.draw();
                console.log(`✅ Card placement animation completed: ${card.name} to ${location}`);
            }
        };
        
        blink();
    }
    
    highlightZone(location) {
        let zone;
        if (location === 'deck' && this.cardSystem.deckZone) {
            zone = this.cardSystem.deckZone;
        } else if (location === 'sequence' && this.cardSystem.sequenceZone) {
            zone = this.cardSystem.sequenceZone;
        }
        
        if (zone) {
            const canvasZone = {
                x: zone.x * this.scaleX,
                y: zone.y * this.scaleY,
                width: zone.width * this.scaleX,
                height: zone.height * this.scaleY
            };
            
            // Dessiner une surbrillance jaune
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 4;
            this.ctx.setLineDash([]);
            this.ctx.strokeRect(canvasZone.x - 2, canvasZone.y - 2, canvasZone.width + 4, canvasZone.height + 4);
        }
    }
    
    animateCardRotation(oldDeckCard, newCard) {
        console.log(`🔄 Animating card rotation: ${oldDeckCard.name} → sequence, ${newCard.name} → deck`);
        
        // Animation en plusieurs étapes avec feedback visuel
        
        // Étape 1: Faire clignoter la zone deck
        this.highlightZone('deck');
        
        setTimeout(() => {
            // Étape 2: Déplacer la carte du deck vers sequence
            this.setSequenceCard(oldDeckCard);
            this.cardSystem.currentDeckCard = null;
            this.draw();
            
            // Faire clignoter la zone sequence
            this.highlightZone('sequence');
            
            setTimeout(() => {
                // Étape 3: Placer la nouvelle carte sur le deck
                this.cardSystem.currentDeckCard = newCard;
                this.updateCardStatus();
                this.draw();
                
                // Faire clignoter la zone deck pour la nouvelle carte
                this.highlightZone('deck');
                
                setTimeout(() => {
                    // Étape finale: redessiner normalement
                    this.draw();
                    console.log(`✅ Card rotation completed: ${this.cardSystem.currentSequenceCard.name} on sequence, ${newCard.name} on deck`);
                }, 400);
            }, 600);
        }, 400);
    }
    
    updateCardStatus() {
        console.log('🔄 Updating card status in UI...');
        
        const deckElement = document.getElementById('current-deck-card');
        const sequenceElement = document.getElementById('current-sequence-card');
        
        if (deckElement) {
            const deckCardName = this.cardSystem.currentDeckCard ? 
                this.cardSystem.currentDeckCard.name : 'Aucune';
            deckElement.textContent = deckCardName;
            console.log(`🎴 UI updated - Deck card: ${deckCardName}`);
        }
        
        if (sequenceElement) {
            const sequenceCardName = this.cardSystem.currentSequenceCard ? 
                this.cardSystem.currentSequenceCard.name : 'Aucune';
            sequenceElement.textContent = sequenceCardName;
            console.log(`🎴 UI updated - Sequence card: ${sequenceCardName}`);
        }
        
        // Force redraw to update card zones
        console.log('🎨 Forcing redraw after status update...');
        this.draw();
    }
    
    setSequenceCard(newCard) {
        console.log(`🎯 Setting sequence card to: ${newCard ? newCard.name : 'none'}`);
        
        const previousCard = this.cardSystem.currentSequenceCard;
        this.cardSystem.currentSequenceCard = newCard;
        
        // Déclencher la popup si une nouvelle carte est placée (différente de la précédente)
        if (newCard && newCard !== previousCard) {
            console.log(`🎯 New card detected in sequence: ${newCard.name}`);
            this.showTurnOrderPopup(newCard);
        }
        
        // Mettre à jour l'affichage
        this.updateCardStatus();
    }
    
    showTurnOrderPopup(card) {
        console.log(`🎯 Showing turn order popup for card: ${card.name}`);
        
        if (!this.cardSystem.cardConfigs) {
            console.error('❌ Card configurations not loaded');
            return;
        }
        
        const cardConfig = this.cardSystem.cardConfigs[card.name];
        if (!cardConfig) {
            console.error(`❌ No configuration found for card: ${card.name}`);
            return;
        }
        
        if (cardConfig.type === 'winter') {
            this.showWinterCardPopup(card);
            return;
        }
        
        // Créer le contenu de la popup
        let popupContent = `
            <div style="font-family: Arial, sans-serif; max-width: 400px;">
                <h3 style="color: #333; margin-bottom: 20px; text-align: center;">
                    🎴 ${card.name}
                </h3>
                <h4 style="color: #555; margin-bottom: 15px;">Ordre des tours:</h4>
                <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
        `;
        
        // Ajouter chaque tour
        cardConfig.turns.forEach((turn, index) => {
            const factionColors = {
                patriots: '#007bff',
                british: '#dc3545', 
                french: '#6f42c1',
                indians: '#fd7e14'
            };
            
            const factionEmojis = {
                patriots: '🇺🇸',
                british: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
                french: '🇫🇷',
                indians: '🏕️'
            };
            
            const factionName = turn.faction.charAt(0).toUpperCase() + turn.faction.slice(1);
            const symbols = [];
            if (turn.sabre) symbols.push('⚔️ Sabre');
            if (turn.rifle) symbols.push('🔫 Fusil');
            
            popupContent += `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 4px solid ${factionColors[turn.faction]};">
                    <strong>Tour ${turn.turn}:</strong> 
                    <span style="color: ${factionColors[turn.faction]}; font-weight: bold;">
                        ${factionEmojis[turn.faction]} ${factionName}
                    </span>
                    ${symbols.length > 0 ? `<br><small>${symbols.join(', ')}</small>` : ''}
                </div>
            `;
        });
        
        popupContent += `
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        Fermer
                    </button>
                </div>
            </div>
        `;
        
        this.createPopup(popupContent);
    }
    
    showWinterCardPopup(card) {
        const popupContent = `
            <div style="font-family: Arial, sans-serif; max-width: 400px; text-align: center;">
                <h3 style="color: #17a2b8; margin-bottom: 20px;">
                    ❄️ ${card.name}
                </h3>
                <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #0066cc; margin-bottom: 10px;">Carte Winter</h4>
                    <p style="color: #555; margin: 0;">
                        Cette carte n'a pas de tours de civilisation.<br>
                        Les cartes Winter marquent la fin des tours.
                    </p>
                </div>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    Fermer
                </button>
            </div>
        `;
        
        this.createPopup(popupContent);
    }
    
    createPopup(content) {
        // Supprimer toute popup existante
        const existingPopup = document.getElementById('turn-order-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // Créer la popup
        const popup = document.createElement('div');
        popup.id = 'turn-order-popup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            padding: 20px;
            z-index: 10000;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;
        overlay.onclick = () => {
            popup.remove();
            overlay.remove();
        };
        
        popup.innerHTML = content;
        
        document.body.appendChild(overlay);
        document.body.appendChild(popup);
        
        console.log('✅ Turn order popup displayed');
    }
    
    drawCardOnBoard(location, card) {
        console.log(`🎨 Drawing card ${card ? card.name : 'card back'} on ${location}`);
        
        let zone, cardImage;
        
        // Déterminer la zone et l'image à utiliser
        if (location === 'deck') {
            zone = this.cardSystem.deckZone;
            cardImage = card ? this.getCardImage(card) : this.cardSystem.cardBackImage;
        } else if (location === 'sequence') {
            zone = this.cardSystem.sequenceZone;
            cardImage = card ? this.getCardImage(card) : null;
        }
        
        if (!zone) {
            console.log(`⚠️ Zone ${location} not defined yet`);
            return;
        }
        
        if (!cardImage) {
            console.log(`⚠️ No image for ${location}`);
            return;
        }
        
        // Redessiner le plateau pour mettre à jour l'affichage
        this.draw();
    }
    
    encodeImagePath(path) {
        // Encoder correctement les caractères spéciaux pour les URLs
        return path
            .replace(/\s/g, '%20')  // Espaces -> %20
            .replace(/é/g, '%C3%A9')  // é -> %C3%A9
            .replace(/è/g, '%C3%A8')  // è -> %C3%A8
            .replace(/à/g, '%C3%A0')  // à -> %C3%A0
            .replace(/ç/g, '%C3%A7')  // ç -> %C3%A7
            .replace(/'/g, '%27');    // apostrophes -> %27
    }
    
    getCardImage(card) {
        console.log(`🔍 Getting card image for: ${card.name}, path: ${card.path}`);
        
        // Vérifier si l'image est déjà en cache
        if (this.cardSystem.cardImages[card.path]) {
            const cachedImg = this.cardSystem.cardImages[card.path];
            console.log(`📋 Using cached image for: ${card.name}, loaded: ${cachedImg.complete}, naturalWidth: ${cachedImg.naturalWidth}`);
            return cachedImg;
        }
        
        // Charger l'image et la mettre en cache
        const img = new Image();
        console.log(`🔄 Loading new image: ${card.path}`);
        
        // Encoder correctement l'URL pour le serveur
        const encodedPath = this.encodeImagePath(card.path);
        
        // Essayer plusieurs chemins pour cette carte
        const alternativePaths = [
            encodedPath,
            card.path,
            card.path.replace('/Images/Cartes/', '../Images/Cartes/'),
            card.path.replace('/Images/Cartes%20sp%C3%A9ciales/', '../Images/Cartes spéciales/')
        ];
        
        this.tryLoadCardImage(img, card, alternativePaths, 0);
        this.cardSystem.cardImages[card.path] = img;
        return img;
    }
    
    tryLoadCardImage(img, card, paths, index) {
        if (index >= paths.length) {
            console.error(`❌ Failed to load card image: ${card.name} from all paths`);
            return;
        }
        
        const currentPath = paths[index];
        console.log(`🔄 Trying card path ${index + 1}/${paths.length}: ${currentPath}`);
        
        img.src = currentPath;
        img.onload = () => {
            console.log(`✅ Card image loaded: ${card.name} from ${currentPath}, dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
            this.draw(); // Redessiner quand l'image est prête
        };
        img.onerror = () => {
            console.log(`❌ Failed to load from: ${currentPath}`);
            // Essayer le chemin suivant
            this.tryLoadCardImage(img, card, paths, index + 1);
        };
    }
    
    drawTerritoryZones() {
        if (!this.territoryZones) return;
        
        // Dessiner les zones propagande en bleu
        Object.entries(this.territoryZones.propaganda).forEach(([territory, zone]) => {
            if (zone) {
                this.ctx.strokeStyle = '#007bff';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                
                const canvasX = zone.x * this.scaleX;
                const canvasY = zone.y * this.scaleY;
                const canvasWidth = zone.width * this.scaleX;
                const canvasHeight = zone.height * this.scaleY;
                
                this.ctx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);
                
                // Label
                this.ctx.fillStyle = '#007bff';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(`📢 ${territory} (Propagande)`, canvasX + 5, canvasY + 15);
            }
        });
        
        // Dessiner les zones raid en rouge
        Object.entries(this.territoryZones.raid).forEach(([territory, zone]) => {
            if (zone) {
                this.ctx.strokeStyle = '#dc3545';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([3, 3]);
                
                const canvasX = zone.x * this.scaleX;
                const canvasY = zone.y * this.scaleY;
                const canvasWidth = zone.width * this.scaleX;
                const canvasHeight = zone.height * this.scaleY;
                
                this.ctx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);
                
                // Label
                this.ctx.fillStyle = '#dc3545';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(`⚔️ ${territory} (Raid)`, canvasX + 5, canvasY + 15);
            }
        });
        
        // Restaurer les paramètres de dessin
        this.ctx.setLineDash([]);
        this.ctx.lineWidth = 1;
    }
    
    drawRaidPropagandaMarkers() {
        console.log('🎯 Drawing raid and propaganda markers...');
        
        if (!this.markerImages.propaganda || !this.markerImages.raid) {
            console.log('⚠️ Marker images not loaded yet');
            return;
        }
        
        // Draw propaganda markers
        Object.entries(this.raidPropagandaMarkers.propaganda.placed).forEach(([territory, count]) => {
            const zone = this.territoryZones.propaganda[territory];
            if (zone && count > 0) {
                this.drawMarkerInZone(territory, 'propaganda', zone, count);
            }
        });
        
        // Draw raid markers  
        Object.entries(this.raidPropagandaMarkers.raid.placed).forEach(([territory, count]) => {
            const zone = this.territoryZones.raid[territory];
            if (zone && count > 0) {
                this.drawMarkerInZone(territory, 'raid', zone, count);
            }
        });
        
        // Draw remaining markers in available zones
        this.drawAvailableMarkers();
    }
    
    drawMarkerInZone(territory, type, zone, count) {
        const image = this.markerImages[type];
        if (!image) {
            console.log(`⚠️ ${type} marker image not found`);
            return;
        }
        
        if (!image.complete) {
            console.log(`⚠️ ${type} marker image not loaded yet`);
            return;
        }
        
        // Convert zone coordinates to canvas coordinates
        const canvasX = zone.x * this.scaleX;
        const canvasY = zone.y * this.scaleY;
        const canvasWidth = zone.width * this.scaleX;
        const canvasHeight = zone.height * this.scaleY;
        
        // Draw marker image centered in zone
        const markerSize = Math.min(canvasWidth, canvasHeight) * 0.8; // 80% of zone size
        const centerX = canvasX + (canvasWidth - markerSize) / 2;
        const centerY = canvasY + (canvasHeight - markerSize) / 2;
        
        if (image.naturalWidth === 0 || image.naturalHeight === 0) {
            console.log(`⚠️ ${type} marker image failed to load, using fallback`);
            // Fallback: draw a colored rectangle with icon
            this.ctx.fillStyle = type === 'propaganda' ? '#007bff' : '#dc3545';
            this.ctx.fillRect(centerX, centerY, markerSize, markerSize);
            
            // Add text icon
            this.ctx.fillStyle = 'white';
            this.ctx.font = `bold ${markerSize * 0.4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const icon = type === 'propaganda' ? '📢' : '⚔️';
            this.ctx.fillText(icon, centerX + markerSize/2, centerY + markerSize/2);
        } else {
            try {
                this.ctx.drawImage(image, centerX, centerY, markerSize, markerSize);
            } catch (error) {
                console.error(`❌ Error drawing ${type} marker image:`, error);
                // Fallback if drawImage fails
                this.ctx.fillStyle = type === 'propaganda' ? '#007bff' : '#dc3545';
                this.ctx.fillRect(centerX, centerY, markerSize, markerSize);
                
                this.ctx.fillStyle = 'white';
                this.ctx.font = `bold ${markerSize * 0.4}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                const icon = type === 'propaganda' ? '📢' : '⚔️';
                this.ctx.fillText(icon, centerX + markerSize/2, centerY + markerSize/2);
            }
        }
        
        // Draw counter if more than 1
        if (count > 1) {
            const counterX = centerX + markerSize - 8;  // Plus proche du bord droit
            const counterY = centerY + 8;  // Plus proche du haut
            
            // Background circle for counter
            this.ctx.fillStyle = type === 'propaganda' ? '#007bff' : '#dc3545';
            this.ctx.beginPath();
            this.ctx.arc(counterX, counterY, 10, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Counter text
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(count.toString(), counterX, counterY);
        }
        
        console.log(`🎯 Drew ${count} ${type} marker(s) in ${territory}`);
    }
    
    drawAvailableMarkers() {
        // Draw remaining propaganda markers in available patriot force zone
        if (this.raidPropagandaMarkers.propaganda.available > 0) {
            const patriotForceZone = this.allZones?.forces?.data?.faction_forces?.patriots;
            if (patriotForceZone) {
                console.log(`📢 Drawing ${this.raidPropagandaMarkers.propaganda.available} available propaganda markers in patriot force zone`);
                this.drawMarkersInAvailableZone(patriotForceZone, 'propaganda', this.raidPropagandaMarkers.propaganda.available);
            } else {
                console.log('⚠️ Patriot force zone not found for propaganda markers');
            }
        }
        
        // Draw remaining raid markers in available indian force zone  
        if (this.raidPropagandaMarkers.raid.available > 0) {
            const indianForceZone = this.allZones?.forces?.data?.faction_forces?.indians;
            if (indianForceZone) {
                console.log(`⚔️ Drawing ${this.raidPropagandaMarkers.raid.available} available raid markers in indian force zone`);
                this.drawMarkersInAvailableZone(indianForceZone, 'raid', this.raidPropagandaMarkers.raid.available);
            } else {
                console.log('⚠️ Indian force zone not found for raid markers');
            }
        }
    }
    
    drawMarkersInAvailableZone(zone, type, count) {
        const image = this.markerImages[type];
        if (!image || !image.complete || count <= 0) return;
        
        if (image.naturalWidth === 0 || image.naturalHeight === 0) {
            console.log(`⚠️ ${type} marker image failed to load properly for available zone`);
            return;
        }
        
        // Convert zone coordinates to canvas coordinates
        const canvasX = zone.x1 * this.scaleX;
        const canvasY = zone.y1 * this.scaleY;
        const canvasWidth = (zone.x2 - zone.x1) * this.scaleX;
        const canvasHeight = (zone.y2 - zone.y1) * this.scaleY;
        
        // Position marker in corner of available zone
        const markerSize = 30; // Fixed size for available zone
        const offsetX = type === 'propaganda' ? 10 : 50; // Offset to avoid overlap
        const offsetY = 10;
        
        const drawX = canvasX + offsetX;
        const drawY = canvasY + offsetY;
        
        this.ctx.drawImage(image, drawX, drawY, markerSize, markerSize);
        
        // Draw counter
        const counterX = drawX + markerSize - 8;
        const counterY = drawY + 12;
        
        // Background circle for counter
        this.ctx.fillStyle = type === 'propaganda' ? '#007bff' : '#dc3545';
        this.ctx.beginPath();
        this.ctx.arc(counterX, counterY, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Counter text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(count.toString(), counterX, counterY);
        
        console.log(`🎯 Drew ${count} available ${type} markers in ${type === 'propaganda' ? 'patriot' : 'indian'} force zone`);
    }

    // === MENU D'ÉDITION DE TERRITOIRE ===
    
    openTerritoryEditor(territory, screenX, screenY) {
        console.log(`🎮 TERRITORY EDITOR: Opening editor for ${territory} at screen position (${screenX}, ${screenY})`);
        
        // Fermer l'éditeur existant s'il y en a un
        this.closeTerritoryEditor();
        
        // Créer l'élément du menu
        const editor = document.createElement('div');
        editor.className = 'territory-editor';
        editor.id = 'territory-editor';
        
        // Positionner près du clic
        editor.style.left = Math.min(screenX, window.innerWidth - 420) + 'px';
        editor.style.top = Math.min(screenY, window.innerHeight - 650) + 'px';
        
        // Récupérer les données actuelles du territoire
        const currentData = this.getTerritoryData(territory);
        
        editor.innerHTML = this.createEditorHTML(territory, currentData);
        
        document.body.appendChild(editor);
        
        // Ajouter les gestionnaires d'événements
        this.setupEditorEventListeners(territory, currentData);
        
        // Ajouter un gestionnaire pour fermer le menu en cliquant ailleurs
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick.bind(this), true);
        }, 100); // Petit délai pour éviter que le clic qui ouvre le menu le ferme immédiatement
    }
    
    getTerritoryData(territory) {
        console.log(`📊 Getting territory data for: ${territory}`);
        
        const data = {
            units: {
                patriots: { 
                    Continentals: 0, 
                    'Militia Normal': 0, 
                    'Militia Active': 0 
                },
                british: { 
                    Regulars: 0, 
                    Tories: 0 
                },
                french: { 
                    Regulars: 0 
                },
                indians: { 
                    'War_Party Normal': 0, 
                    'War_Party Active': 0, 
                    Villages: 0 
                }
            },
            control: 'neutral',
            support: 'neutral',
            markers: {
                propaganda: 0,
                raid: 0
            }
        };
        
        // Récupérer les unités depuis les nouveaux systèmes
        
        // Patriots - Continentals
        if (this.patriotTroops?.continentals?.placed[territory]) {
            data.units.patriots.Continentals = this.patriotTroops.continentals.placed[territory];
            console.log(`📊 Set patriot Continentals: ${data.units.patriots.Continentals}`);
        }
        
        // Patriots - Militia 
        if (this.patriotTroops?.militia?.placed[territory]) {
            const militiaData = this.patriotTroops.militia.placed[territory];
            data.units.patriots['Militia Normal'] = militiaData.normal || 0;
            data.units.patriots['Militia Active'] = militiaData.active || 0;
            console.log(`📊 Set patriot Militia Normal: ${data.units.patriots['Militia Normal']}, Active: ${data.units.patriots['Militia Active']}`);
        }
        
        // British troops
        if (this.britishTroops?.regulars?.placed[territory]) {
            data.units.british.Regulars = this.britishTroops.regulars.placed[territory];
            console.log(`📊 Set british Regulars: ${data.units.british.Regulars}`);
        }
        if (this.britishTroops?.tories?.placed[territory]) {
            data.units.british.Tories = this.britishTroops.tories.placed[territory];
            console.log(`📊 Set british Tories: ${data.units.british.Tories}`);
        }
        
        // French troops
        if (this.frenchRegulars?.placed[territory]) {
            data.units.french.Regulars = this.frenchRegulars.placed[territory];
            console.log(`📊 Set french Regulars: ${data.units.french.Regulars}`);
        }
        
        // Indian War Parties
        if (this.indianWarParties?.placed[territory]) {
            const warPartyData = this.indianWarParties.placed[territory];
            data.units.indians['War_Party Normal'] = warPartyData.normal || 0;
            data.units.indians['War_Party Active'] = warPartyData.active || 0;
            console.log(`📊 Set indian War Party Normal: ${data.units.indians['War_Party Normal']}, Active: ${data.units.indians['War_Party Active']}`);
        }
        
        // Récupérer les villages indiens (stockés séparément)
        if (this.indianVillages.placed[territory]) {
            data.units.indians.Villages = this.indianVillages.placed[territory];
            console.log(`📊 Set indian Villages: ${data.units.indians.Villages}`);
        }
        
        // Récupérer les forts Patriots
        if (this.fortSystems.patriots.placed[territory]) {
            data.units.patriots.Forts = this.fortSystems.patriots.placed[territory];
            console.log(`📊 Set patriot Forts: ${data.units.patriots.Forts}`);
        }
        
        // Récupérer les forts British  
        if (this.fortSystems.british.placed[territory]) {
            data.units.british.Forts = this.fortSystems.british.placed[territory];
            console.log(`📊 Set british Forts: ${data.units.british.Forts}`);
        }
        
        // Récupérer les French Regulars
        if (this.frenchRegulars.placed[territory]) {
            data.units.french.Regulars = this.frenchRegulars.placed[territory];
            console.log(`📊 Set french Regulars: ${data.units.french.Regulars}`);
        }
        
        // Récupérer le contrôle actuel
        if (this.controlTokens[territory]) {
            data.control = this.controlTokens[territory];
            console.log(`📊 Set control: ${data.control}`);
        }
        
        // Récupérer le support actuel  
        if (this.territorySupport[territory] !== undefined) {
            const supportData = this.territorySupport[territory];
            const supportValue = supportData.value || supportData; // Compatibilité ancien/nouveau format
            if (supportValue === 2) data.support = 'active_support';
            else if (supportValue === 1) data.support = 'passive_support';
            else if (supportValue === 0) data.support = 'neutral';
            else if (supportValue === -1) data.support = 'passive_oppose';
            else if (supportValue === -2) data.support = 'active_oppose';
            console.log(`📊 Set support: ${data.support} (value: ${supportValue})`);
        }
        
        // Récupérer les marqueurs actuels
        if (this.raidPropagandaMarkers.propaganda.placed[territory]) {
            data.markers.propaganda = this.raidPropagandaMarkers.propaganda.placed[territory];
            console.log(`📊 Set propaganda markers: ${data.markers.propaganda}`);
        }
        if (this.raidPropagandaMarkers.raid.placed[territory]) {
            data.markers.raid = this.raidPropagandaMarkers.raid.placed[territory];
            console.log(`📊 Set raid markers: ${data.markers.raid}`);
        }
        
        // Ajouter les données des forts
        data.forts = {
            british: 0,
            patriots: 0
        };

        // Forts britanniques
        if (this.fortSystems?.british?.placed[territory]) {
            data.forts.british = this.fortSystems.british.placed[territory];
        }

        // Forts patriots
        if (this.fortSystems?.patriots?.placed[territory]) {
            data.forts.patriots = this.fortSystems.patriots.placed[territory];
        }

        // Ajouter les données des bateaux français (pour les villes portuaires uniquement)
        data.frenchShips = 0;
        if (this.portCities.includes(territory) && this.frenchShips?.blockading[territory]) {
            data.frenchShips = this.frenchShips.blockading[territory];
            console.log(`📊 Set French ships: ${data.frenchShips}`);
        }

        // Ajouter les leaders
        data.leaders = this.leaders[territory] ? [...this.leaders[territory]] : [];
        console.log(`📊 Set leaders: ${data.leaders.length > 0 ? data.leaders.join(', ') : 'none'}`);

        console.log(`📊 Final territory data for ${territory}:`, data);
        return data;
    }
    
    createEditorHTML(territory, data) {
        const factionUnits = {
            patriots: [
                { 
                    type: 'Continentals', 
                    image: 'Images/Armée:fort:village/Wood_Patriot_Continentals.png',
                    color: '#007bff' 
                },
                { 
                    type: 'Militia Normal', 
                    image: 'Images/Armée:fort:village/Wood_Patriot_Militia.png',
                    color: '#007bff' 
                },
                { 
                    type: 'Militia Active', 
                    image: 'Images/Armée:fort:village/Wood_Patriot_Militia (A).png',
                    color: '#007bff' 
                }
            ],
            british: [
                { 
                    type: 'Regulars', 
                    image: 'Images/Armée:fort:village/Wood_British_Regulars.png',
                    color: '#dc3545' 
                },
                { 
                    type: 'Tories', 
                    image: 'Images/Armée:fort:village/Wood_British_Tories.png',
                    color: '#dc3545' 
                }
            ],
            french: [
                { 
                    type: 'Regulars', 
                    image: 'Images/Armée:fort:village/Wood_French_Regulars.png',
                    color: '#6f42c1' 
                }
            ],
            indians: [
                { 
                    type: 'War_Party Normal', 
                    image: 'Images/Armée:fort:village/Wood_Indian_War Party.png',
                    color: '#fd7e14' 
                },
                { 
                    type: 'War_Party Active', 
                    image: 'Images/Armée:fort:village/Wood_Indian_War Party (A).png',
                    color: '#fd7e14' 
                },
                { 
                    type: 'Villages', 
                    image: 'Images/Armée:fort:village/Wood_Indian_Village.png',
                    color: '#fd7e14' 
                }
            ]
        };
        
        let unitsHTML = '';
        for (const [faction, units] of Object.entries(factionUnits)) {
            unitsHTML += `<h5 style="color: ${units[0].color}; margin: 10px 0 5px 0;">${faction.charAt(0).toUpperCase() + faction.slice(1)}</h5>`;
            unitsHTML += `<div class="faction-units-container">`;
            for (const unit of units) {
                const count = data.units[faction][unit.type] || 0;
                unitsHTML += `
                    <div class="unit-editor-image">
                        <div class="unit-image-container">
                            <img src="${unit.image}" class="unit-image" alt="${unit.type}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div class="unit-fallback" style="display: none; background-color: ${unit.color};">${unit.type.charAt(0)}</div>
                            <div class="unit-counter" id="counter-${faction}-${unit.type}">${count > 0 ? count : ''}</div>
                        </div>
                        <div class="unit-controls">
                            <button class="unit-btn" onclick="window.territoryEditor.changeUnit('${faction}', '${unit.type}', -1)">-</button>
                            <button class="unit-btn" onclick="window.territoryEditor.changeUnit('${faction}', '${unit.type}', 1)">+</button>
                        </div>
                    </div>
                `;
            }
            unitsHTML += `</div>`;
        }

        // Ajouter les forts
        const forts = [
            { 
                faction: 'british', 
                type: 'Forts', 
                image: 'Images/Armée:fort:village/Wood_British_Fort.png',
                color: '#dc3545' 
            },
            { 
                faction: 'patriots', 
                type: 'Forts', 
                image: 'Images/Armée:fort:village/Wood_Patriot_Fort.png',
                color: '#007bff' 
            }
        ];

        unitsHTML += `<h5 style="color: #666; margin: 10px 0 5px 0;">Fortifications</h5>`;
        unitsHTML += `<div class="faction-units-container">`;
        for (const fort of forts) {
            const count = data.forts[fort.faction] || 0;
            unitsHTML += `
                <div class="unit-editor-image">
                    <div class="unit-image-container">
                        <img src="${fort.image}" class="unit-image" alt="${fort.type}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div class="unit-fallback" style="display: none; background-color: ${fort.color};">F</div>
                        <div class="unit-counter" id="counter-forts-${fort.faction}">${count > 0 ? count : ''}</div>
                    </div>
                    <div class="unit-controls">
                        <button class="unit-btn" onclick="window.territoryEditor.changeFort('${fort.faction}', -1)">-</button>
                        <button class="unit-btn" onclick="window.territoryEditor.changeFort('${fort.faction}', 1)">+</button>
                    </div>
                </div>
            `;
        }
        unitsHTML += `</div>`;

        // Ajouter les bateaux français pour les villes portuaires uniquement
        let frenchShipsHTML = '';
        if (this.portCities.includes(territory)) {
            const shipCount = data.frenchShips || 0;
            const availableShips = this.frenchShips?.available || 0;
            
            frenchShipsHTML = `
                <h5 style="color: #6f42c1; margin: 10px 0 5px 0;">Bateaux Français</h5>
                <div class="faction-units-container">
                    <div class="unit-editor-image">
                        <div class="unit-image-container">
                            <img src="Images/French Boat/French_Blockade.png" class="unit-image" alt="French Ship" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div class="unit-fallback" style="display: none; background-color: #6f42c1;">S</div>
                            <div class="unit-counter" id="counter-french-ships">${shipCount > 0 ? shipCount : ''}</div>
                        </div>
                        <div class="unit-controls">
                            <button class="unit-btn" onclick="window.territoryEditor.changeFrenchShip(-1)" ${shipCount <= 0 ? 'disabled' : ''}>-</button>
                            <button class="unit-btn" onclick="window.territoryEditor.changeFrenchShip(1)" ${availableShips <= 0 && shipCount >= 1 ? 'disabled' : ''}>+</button>
                        </div>
                    </div>
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    Max 1 bateau par port • ${availableShips} bateau(x) disponible(s)
                </div>
            `;
        }
        
        const controlOptions = [
            { 
                value: 'british', 
                label: 'British', 
                image: 'Images/Controle/Control_British.png',
                class: 'british' 
            },
            { 
                value: 'patriots', 
                label: 'Patriots', 
                image: 'Images/Controle/Control_Patriots.png',
                class: 'patriots' 
            },
            { 
                value: 'neutral', 
                label: 'Neutre', 
                image: null,
                class: 'neutral' 
            }
        ];
        
        const supportOptions = [
            { 
                value: 'active_support', 
                label: 'Active Support',
                image: 'Images/jetons support:opposition/Support_Active.png'
            },
            { 
                value: 'passive_support', 
                label: 'Passive Support',
                image: 'Images/jetons support:opposition/Support_Passive.png'
            },
            { 
                value: 'neutral', 
                label: 'Neutre',
                image: null
            },
            { 
                value: 'passive_oppose', 
                label: 'Passive Opposition',
                image: 'Images/jetons support:opposition/Opposition_Passive.png'
            },
            { 
                value: 'active_oppose', 
                label: 'Active Opposition',
                image: 'Images/jetons support:opposition/Opposition_Active.png'
            }
        ];
        
        let controlHTML = '';
        for (const option of controlOptions) {
            const active = data.control === option.value ? 'active' : '';
            const content = option.image ? 
                `<img src="${option.image}" class="control-image" alt="${option.label}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                 <span style="display: none;">${option.label}</span>` : 
                option.label;
            controlHTML += `
                <div class="control-option ${option.class} ${active}" onclick="window.territoryEditor.setControl('${option.value}')">
                    ${content}
                </div>
            `;
        }
        
        let supportHTML = '';
        for (const option of supportOptions) {
            const active = data.support === option.value ? 'active' : '';
            const content = option.image ? 
                `<img src="${option.image}" class="support-image" alt="${option.label}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                 <span style="display: none;">${option.label}</span>` : 
                option.label;
            supportHTML += `
                <div class="support-option ${active}" onclick="window.territoryEditor.setSupport('${option.value}')">
                    ${content}
                </div>
            `;
        }
        
        return `
            <h3>📍 ${territory}</h3>
            
            <div class="editor-section">
                <h4>⚔️ Unités Militaires</h4>
                ${unitsHTML}
            </div>
            
            ${frenchShipsHTML ? `<div class="editor-section">${frenchShipsHTML}</div>` : ''}
            
            <div class="editor-section">
                <h4>🏛️ Contrôle</h4>
                <div class="control-selector">
                    ${controlHTML}
                </div>
            </div>
            
            <div class="editor-section">
                <h4>❤️ Support</h4>
                <div class="support-selector">
                    ${supportHTML}
                </div>
            </div>
            
            <div class="editor-section">
                <h4>👤 Leaders</h4>
                <div style="font-size: 12px; margin-bottom: 10px;">
                    <select id="leader-select" style="width: 100%; padding: 5px; margin-bottom: 5px;">
                        <option value="">-- Sélectionner un leader --</option>
                        <option value="Washington">Washington</option>
                        <option value="Gates">Gates</option>
                        <option value="Greene">Greene</option>
                        <option value="Cornwallis">Cornwallis</option>
                        <option value="Clinton">Clinton</option>
                        <option value="Howe">Howe</option>
                        <option value="Gage">Gage</option>
                        <option value="Prevost">Prevost</option>
                        <option value="Rochambeau">Rochambeau</option>
                        <option value="Lauzun">Lauzun</option>
                        <option value="Cornplanter">Cornplanter</option>
                        <option value="Brandt">Brandt</option>
                        <option value="Dragging Canoe">Dragging Canoe</option>
                    </select>
                    <button class="unit-btn" style="width: 100%;" onclick="window.territoryEditor.addLeader()">➕ Ajouter Leader</button>
                </div>
                <div id="leaders-list" style="font-size: 12px;">
                    ${(data.leaders || []).map(leader => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px; background: #f0f0f0; margin-bottom: 5px; border-radius: 4px;">
                            <span>👤 ${leader}</span>
                            <button class="unit-btn" style="padding: 2px 8px;" onclick="window.territoryEditor.removeLeader('${leader}')">✖</button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="editor-section">
                <h4>🎯 Marqueurs</h4>
                <div class="marker-editor">
                    <span>📢 Propagande</span>
                    <button class="unit-btn" onclick="window.territoryEditor.changeMarker('propaganda', -1)">-</button>
                    <span class="unit-count" id="count-propaganda">${data.markers.propaganda}</span>
                    <button class="unit-btn" onclick="window.territoryEditor.changeMarker('propaganda', 1)">+</button>
                </div>
                <div class="marker-editor">
                    <span>⚔️ Raid</span>
                    <button class="unit-btn" onclick="window.territoryEditor.changeMarker('raid', -1)">-</button>
                    <span class="unit-count" id="count-raid">${data.markers.raid}</span>
                    <button class="unit-btn" onclick="window.territoryEditor.changeMarker('raid', 1)">+</button>
                </div>
            </div>

            <div class="editor-buttons">
                <button class="save-btn" onclick="window.territoryEditor.save()">💾 Sauvegarder</button>
                <button class="cancel-btn" onclick="window.territoryEditor.cancel()">❌ Annuler</button>
            </div>
        `;
    }
    
    setupEditorEventListeners(territory, originalData) {
        // Créer un objet global pour gérer l'éditeur
        window.territoryEditor = {
            territory: territory,
            gameBoard: this,
            data: JSON.parse(JSON.stringify(originalData)), // Copie profonde
            
            changeUnit: function(faction, unitType, delta) {
                const newCount = Math.max(0, window.territoryEditor.data.units[faction][unitType] + delta);
                window.territoryEditor.data.units[faction][unitType] = newCount;
                const counterElement = document.getElementById(`counter-${faction}-${unitType}`);
                if (counterElement) {
                    counterElement.textContent = newCount > 0 ? newCount : '';
                }
            },
            
            setControl: function(control) {
                window.territoryEditor.data.control = control;
                // Mettre à jour l'affichage
                document.querySelectorAll('.control-option').forEach(el => el.classList.remove('active'));
                document.querySelector(`.control-option[onclick*="${control}"]`).classList.add('active');
            },
            
            setSupport: function(support) {
                window.territoryEditor.data.support = support;
                // Mettre à jour l'affichage
                document.querySelectorAll('.support-option').forEach(el => el.classList.remove('active'));
                document.querySelector(`.support-option[onclick*="${support}"]`).classList.add('active');
            },
            
            changeMarker: function(type, delta) {
                const newCount = Math.max(0, window.territoryEditor.data.markers[type] + delta);
                window.territoryEditor.data.markers[type] = newCount;
                document.getElementById(`count-${type}`).textContent = newCount;
            },

            changeFort: function(faction, delta) {
                const newCount = Math.max(0, window.territoryEditor.data.forts[faction] + delta);
                window.territoryEditor.data.forts[faction] = newCount;
                const counterElement = document.getElementById(`counter-forts-${faction}`);
                if (counterElement) {
                    counterElement.textContent = newCount > 0 ? newCount : '';
                }
            },

            changeFrenchShip: function(delta) {
                const currentShips = window.territoryEditor.data.frenchShips || 0;
                const availableShips = window.territoryEditor.gameBoard.frenchShips?.available || 0;
                
                if (delta > 0) {
                    // Ajouter un bateau : vérifier les limites
                    if (currentShips >= 1) {
                        alert('❌ Maximum 1 bateau français par ville portuaire');
                        return;
                    }
                    if (availableShips <= 0) {
                        alert('❌ Aucun bateau français disponible (maximum 3 bateaux au total)');
                        return;
                    }
                    window.territoryEditor.data.frenchShips = 1;
                } else {
                    // Enlever un bateau
                    window.territoryEditor.data.frenchShips = Math.max(0, currentShips - 1);
                }
                
                // Mettre à jour l'affichage
                const counterElement = document.getElementById('counter-french-ships');
                if (counterElement) {
                    const newCount = window.territoryEditor.data.frenchShips;
                    counterElement.textContent = newCount > 0 ? newCount : '';
                }
                
                // Mettre à jour les boutons (désactiver si limite atteinte)
                const addButton = document.querySelector('button[onclick*="changeFrenchShip(1)"]');
                const removeButton = document.querySelector('button[onclick*="changeFrenchShip(-1)"]');
                if (addButton) {
                    addButton.disabled = window.territoryEditor.data.frenchShips >= 1 || availableShips <= 0;
                }
                if (removeButton) {
                    removeButton.disabled = window.territoryEditor.data.frenchShips <= 0;
                }
            },

            addLeader: function() {
                const select = document.getElementById('leader-select');
                const leaderName = select.value;

                if (!leaderName) {
                    alert('⚠️ Veuillez sélectionner un leader');
                    return;
                }

                // Initialiser le tableau si nécessaire
                if (!window.territoryEditor.data.leaders) {
                    window.territoryEditor.data.leaders = [];
                }

                // Vérifier si le leader est déjà présent
                if (window.territoryEditor.data.leaders.includes(leaderName)) {
                    alert(`⚠️ ${leaderName} est déjà dans ce territoire`);
                    return;
                }

                // Ajouter le leader
                window.territoryEditor.data.leaders.push(leaderName);

                // Mettre à jour l'affichage
                const leadersList = document.getElementById('leaders-list');
                leadersList.innerHTML = window.territoryEditor.data.leaders.map(leader => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px; background: #f0f0f0; margin-bottom: 5px; border-radius: 4px;">
                        <span>👤 ${leader}</span>
                        <button class="unit-btn" style="padding: 2px 8px;" onclick="window.territoryEditor.removeLeader('${leader}')">✖</button>
                    </div>
                `).join('');

                // Réinitialiser le select
                select.value = '';
            },

            removeLeader: function(leaderName) {
                if (!window.territoryEditor.data.leaders) return;

                // Retirer le leader
                window.territoryEditor.data.leaders = window.territoryEditor.data.leaders.filter(l => l !== leaderName);

                // Mettre à jour l'affichage
                const leadersList = document.getElementById('leaders-list');
                leadersList.innerHTML = window.territoryEditor.data.leaders.map(leader => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px; background: #f0f0f0; margin-bottom: 5px; border-radius: 4px;">
                        <span>👤 ${leader}</span>
                        <button class="unit-btn" style="padding: 2px 8px;" onclick="window.territoryEditor.removeLeader('${leader}')">✖</button>
                    </div>
                `).join('');
            },

            save: function() {
                const success = window.territoryEditor.gameBoard.applyTerritoryChanges(window.territoryEditor.territory, window.territoryEditor.data);
                if (success) {
                    window.territoryEditor.gameBoard.closeTerritoryEditor();
                }
                // Si success est false, le menu reste ouvert pour permettre les corrections
            },
            
            cancel: function() {
                window.territoryEditor.gameBoard.closeTerritoryEditor();
            }
        };
    }
    
    applyTerritoryChanges(territory, data) {
        console.log(`💾 Applying changes to ${territory}:`, data);
        
        // Validation : vérifier la limite des forts et villages (max 2)
        const totalFortsAndVillages = (data.forts?.british || 0) + (data.forts?.patriots || 0) + (data.units?.indians?.Villages || 0);
        if (totalFortsAndVillages > 2) {
            alert(`❌ Erreur: Maximum 2 forts/villages par territoire.\nActuel: ${totalFortsAndVillages} (${data.forts?.british || 0} forts britanniques + ${data.forts?.patriots || 0} forts patriots + ${data.units?.indians?.Villages || 0} villages indiens)`);
            return false; // Ne pas fermer le menu
        }

        // Validation : vérifier les limites des bateaux français pour les ports
        if (this.portCities.includes(territory) && data.frenchShips > 1) {
            alert(`❌ Erreur: Maximum 1 bateau français par ville portuaire.\nActuel: ${data.frenchShips}`);
            return false;
        }
        
        // Nettoyer les anciennes données du territoire
        this.clearTerritoryData(territory);
        
        // Appliquer les changements d'unités Patriots
        if (data.units.patriots.Continentals > 0) {
            if (!this.patriotTroops.continentals.placed[territory]) {
                this.patriotTroops.continentals.placed[territory] = 0;
            }
            this.patriotTroops.continentals.placed[territory] = data.units.patriots.Continentals;
        }
        
        if (data.units.patriots['Militia Normal'] > 0 || data.units.patriots['Militia Active'] > 0) {
            if (!this.patriotTroops.militia.placed[territory]) {
                this.patriotTroops.militia.placed[territory] = { normal: 0, active: 0 };
            }
            this.patriotTroops.militia.placed[territory].normal = data.units.patriots['Militia Normal'];
            this.patriotTroops.militia.placed[territory].active = data.units.patriots['Militia Active'];
        }
        
        // Appliquer les changements d'unités British
        if (data.units.british.Regulars > 0) {
            if (!this.britishTroops.regulars.placed[territory]) {
                this.britishTroops.regulars.placed[territory] = 0;
            }
            this.britishTroops.regulars.placed[territory] = data.units.british.Regulars;
        }
        
        if (data.units.british.Tories > 0) {
            if (!this.britishTroops.tories.placed[territory]) {
                this.britishTroops.tories.placed[territory] = 0;
            }
            this.britishTroops.tories.placed[territory] = data.units.british.Tories;
        }
        
        // Appliquer les changements d'unités French
        if (data.units.french.Regulars > 0) {
            if (!this.frenchRegulars.placed[territory]) {
                this.frenchRegulars.placed[territory] = 0;
            }
            this.frenchRegulars.placed[territory] = data.units.french.Regulars;
        }
        
        // Appliquer les changements d'unités Indians
        if (data.units.indians['War_Party Normal'] > 0 || data.units.indians['War_Party Active'] > 0) {
            if (!this.indianWarParties.placed[territory]) {
                this.indianWarParties.placed[territory] = { normal: 0, active: 0 };
            }
            this.indianWarParties.placed[territory].normal = data.units.indians['War_Party Normal'];
            this.indianWarParties.placed[territory].active = data.units.indians['War_Party Active'];
        }
        
        if (data.units.indians.Villages > 0) {
            this.indianVillages.placed[territory] = data.units.indians.Villages;
        }
        
        // Appliquer les forts
        if (data.forts?.british > 0) {
            this.fortSystems.british.placed[territory] = data.forts.british;
        }
        if (data.forts?.patriots > 0) {
            this.fortSystems.patriots.placed[territory] = data.forts.patriots;
        }

        // Appliquer les bateaux français (pour les villes portuaires)
        if (this.portCities.includes(territory)) {
            const oldShips = this.frenchShips.blockading[territory] || 0;
            const newShips = data.frenchShips || 0;
            
            if (newShips > 0) {
                this.frenchShips.blockading[territory] = newShips;
            } else {
                delete this.frenchShips.blockading[territory];
            }
            
            // Mettre à jour les bateaux disponibles
            const shipDifference = newShips - oldShips;
            this.frenchShips.available = Math.max(0, this.frenchShips.available - shipDifference);
            
            console.log(`🚢 French ships in ${territory}: ${oldShips} → ${newShips}, Available: ${this.frenchShips.available}`);
            
            // Mettre à jour les points de dominance FNI et les French Squadron
            this.updateFrenchNavalDominance();
        }
        
        // Appliquer le contrôle
        if (data.control === 'neutral') {
            delete this.controlTokens[territory]; // Supprimer pour neutral
        } else {
            this.controlTokens[territory] = data.control;
        }
        
        // Appliquer le support
        const supportMapping = {
            'active_support': { value: 2, image: 'support_active' },
            'passive_support': { value: 1, image: 'support_passive' },
            'neutral': { value: 0, image: null },
            'passive_oppose': { value: -1, image: 'opposition_passive' },
            'active_oppose': { value: -2, image: 'opposition_active' }
        };
        
        if (data.support === 'neutral') {
            delete this.territorySupport[territory];
        } else {
            this.territorySupport[territory] = supportMapping[data.support];
        }
        
        // Appliquer les marqueurs
        this.raidPropagandaMarkers.propaganda.placed[territory] = data.markers.propaganda;
        this.raidPropagandaMarkers.raid.placed[territory] = data.markers.raid;

        // Appliquer les leaders
        if (data.leaders && data.leaders.length > 0) {
            this.leaders[territory] = [...data.leaders];
            console.log(`👤 Leaders appliqués pour ${territory}:`, data.leaders);
        } else {
            delete this.leaders[territory];
        }

        // Recalculer les scores de support basés sur le support territorial
        this.recalculateSupportScores();
        
        // Recalculer les disponibles
        this.updateAvailableCounters();
        
        // Redessiner
        this.draw();
        
        console.log(`✅ Changes applied to ${territory}`);
        return true; // Succès, fermer le menu
    }
    
    clearTerritoryData(territory) {
        // Nettoyer toutes les données existantes pour ce territoire
        delete this.patriotTroops.continentals.placed[territory];
        delete this.patriotTroops.militia.placed[territory];
        delete this.britishTroops.regulars.placed[territory];
        delete this.britishTroops.tories.placed[territory];
        delete this.frenchRegulars.placed[territory];
        delete this.indianWarParties.placed[territory];
        delete this.indianVillages.placed[territory];
        delete this.fortSystems.british.placed[territory];
        delete this.fortSystems.patriots.placed[territory];
        delete this.controlTokens[territory];
        delete this.territorySupport[territory];
        delete this.leaders[territory];
        
        // Nettoyer les bateaux français pour les ports
        if (this.portCities.includes(territory) && this.frenchShips.blockading[territory]) {
            const removedShips = this.frenchShips.blockading[territory];
            delete this.frenchShips.blockading[territory];
            this.frenchShips.available += removedShips;
            console.log(`🚢 Removed ${removedShips} French ship(s) from ${territory}, available: ${this.frenchShips.available}`);
        }
    }
    
    updateAvailableCounters() {
        // Recalculer les marqueurs disponibles
        let totalPropaganda = 0;
        let totalRaid = 0;
        
        for (const count of Object.values(this.raidPropagandaMarkers.propaganda.placed)) {
            totalPropaganda += count;
        }
        for (const count of Object.values(this.raidPropagandaMarkers.raid.placed)) {
            totalRaid += count;
        }
        
        this.raidPropagandaMarkers.propaganda.available = this.raidPropagandaMarkers.propaganda.total - totalPropaganda;
        this.raidPropagandaMarkers.raid.available = this.raidPropagandaMarkers.raid.total - totalRaid;
        
        console.log(`🔄 Updated available counters: ${this.raidPropagandaMarkers.propaganda.available} propaganda, ${this.raidPropagandaMarkers.raid.available} raid`);
    }

    updateFrenchNavalDominance() {
        console.log('🚢 Updating French Naval Dominance...');
        
        // Compter le total de bateaux en blocus
        let totalBlockadingShips = 0;
        for (const [port, shipCount] of Object.entries(this.frenchShips.blockading)) {
            totalBlockadingShips += shipCount;
            console.log(`🚢 ${port}: ${shipCount} French ship(s)`);
        }
        
        // Mettre à jour les compteurs
        this.frenchShips.available = Math.max(0, this.frenchShips.total - totalBlockadingShips);
        this.frenchShips.dominancePoints = totalBlockadingShips;
        
        console.log(`🚢 French Ships Summary:`);
        console.log(`  📊 Total ships: ${this.frenchShips.total}`);
        console.log(`  ⚓ Ships blockading: ${totalBlockadingShips}`);
        console.log(`  🚢 Available ships: ${this.frenchShips.available}`);
        console.log(`  🇫🇷 FNI Dominance points: ${this.frenchShips.dominancePoints}`);
        
        // Les jetons French Squadron et FNI se mettront à jour automatiquement lors du redraw
    }
    
    handleOutsideClick(event) {
        const editor = document.getElementById('territory-editor');
        if (editor && !editor.contains(event.target)) {
            this.closeTerritoryEditor();
        }
    }

    closeTerritoryEditor() {
        const editor = document.getElementById('territory-editor');
        if (editor) {
            editor.remove();
        }
        if (window.territoryEditor) {
            delete window.territoryEditor;
        }
        // Supprimer l'event listener pour les clics extérieurs
        document.removeEventListener('click', this.handleOutsideClick.bind(this), true);
    }

    showFactionSelectionPopup() {
        return new Promise((resolve) => {
            // Créer la popup
            const popup = document.createElement('div');
            popup.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            popup.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <h2 style="margin-top: 0; color: #333; text-align: center;">🎮 Sélection de votre faction</h2>
                    <p style="color: #666; text-align: center; margin-bottom: 25px;">Choisissez la faction que vous souhaitez jouer.<br>Les trois autres seront contrôlées par l'ordinateur.</p>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                        <button class="faction-choice" data-faction="patriots" style="padding: 20px; border: 3px solid #007bff; border-radius: 8px; background: white; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.2s;">
                            🇺🇸 Patriots
                        </button>
                        <button class="faction-choice" data-faction="british" style="padding: 20px; border: 3px solid #dc3545; border-radius: 8px; background: white; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.2s;">
                            🏴󠁧󠁢󠁥󠁮󠁧󠁿 British
                        </button>
                        <button class="faction-choice" data-faction="french" style="padding: 20px; border: 3px solid #6f42c1; border-radius: 8px; background: white; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.2s;">
                            🇫🇷 French
                        </button>
                        <button class="faction-choice" data-faction="indians" style="padding: 20px; border: 3px solid #fd7e14; border-radius: 8px; background: white; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.2s;">
                            🏕️ Indians
                        </button>
                    </div>

                    <button id="cancel-faction" style="width: 100%; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">
                        ❌ Annuler
                    </button>
                </div>
            `;

            document.body.appendChild(popup);

            // Event listeners
            popup.querySelectorAll('.faction-choice').forEach(btn => {
                btn.addEventListener('mouseenter', (e) => {
                    e.target.style.transform = 'scale(1.05)';
                });
                btn.addEventListener('mouseleave', (e) => {
                    e.target.style.transform = 'scale(1)';
                });
                btn.addEventListener('click', (e) => {
                    const faction = e.target.dataset.faction;
                    popup.remove();
                    resolve(faction);
                });
            });

            document.getElementById('cancel-faction').addEventListener('click', () => {
                popup.remove();
                resolve(null);
            });
        });
    }

    drawTwoCardsPopup() {
        return new Promise((resolve) => {
            if (!this.cardSystem.allCards || this.cardSystem.allCards.length === 0) {
                alert('❌ Aucune carte disponible. Veuillez charger les cartes d\'abord.');
                resolve(null);
                return;
            }

            let selectedCards = {
                first: null,
                second: null
            };

            // Créer la popup
            const popup = document.createElement('div');
            popup.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            popup.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                    <h2 style="margin-top: 0; color: #333; text-align: center;">🎴 Sélection des cartes</h2>
                    <p style="color: #666; text-align: center; margin-bottom: 25px;">Saisissez le nom des deux cartes à jouer.</p>

                    <div style="margin-bottom: 25px;">
                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 10px 0; color: #007bff;">1️⃣ Première carte</h3>
                            <div style="position: relative;">
                                <input type="text" id="card-input-1" placeholder="Tapez le nom de la première carte..."
                                    style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                                <div id="suggestions-1" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 6px; max-height: 200px; overflow-y: auto; z-index: 1000; display: none;"></div>
                            </div>
                            <div id="card-info-1" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px; display: none;">
                                <p style="margin: 0; font-weight: bold;" id="card-name-1"></p>
                                <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;"><strong>Ordre des tours:</strong></p>
                                <ol style="margin: 5px 0; padding-left: 20px; font-size: 12px;" id="card-turns-1"></ol>
                            </div>
                        </div>

                        <div>
                            <h3 style="margin: 0 0 10px 0; color: #28a745;">2️⃣ Deuxième carte</h3>
                            <div style="position: relative;">
                                <input type="text" id="card-input-2" placeholder="Tapez le nom de la deuxième carte..."
                                    style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                                <div id="suggestions-2" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 6px; max-height: 200px; overflow-y: auto; z-index: 1000; display: none;"></div>
                            </div>
                            <div id="card-info-2" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px; display: none;">
                                <p style="margin: 0; font-weight: bold;" id="card-name-2"></p>
                                <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;"><strong>Ordre des tours:</strong></p>
                                <ol style="margin: 5px 0; padding-left: 20px; font-size: 12px;" id="card-turns-2"></ol>
                            </div>
                        </div>
                    </div>

                    <div id="start-info" style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 20px; display: none;">
                        <p style="margin: 0; font-size: 14px; color: #856404;" id="start-faction-text">
                        </p>
                    </div>

                    <button id="confirm-cards" style="width: 100%; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: not-allowed; font-size: 16px; font-weight: bold; margin-bottom: 10px;" disabled>
                        ✅ Confirmer
                    </button>
                    <button id="cancel-cards" style="width: 100%; padding: 12px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">
                        ❌ Annuler
                    </button>
                </div>
            `;

            document.body.appendChild(popup);

            // Fonction pour afficher les suggestions
            const showSuggestions = (inputId, suggestionsId, cardNumber) => {
                const input = document.getElementById(inputId);
                const suggestionsDiv = document.getElementById(suggestionsId);
                const query = input.value.toLowerCase();

                if (query.length < 2) {
                    suggestionsDiv.style.display = 'none';
                    return;
                }

                const matches = this.cardSystem.allCards.filter(card =>
                    card.name.toLowerCase().includes(query)
                );

                if (matches.length === 0) {
                    suggestionsDiv.style.display = 'none';
                    return;
                }

                suggestionsDiv.innerHTML = matches.slice(0, 10).map(card => `
                    <div class="card-suggestion" data-card-name="${card.name}" data-card-file="${card.fileName}"
                        style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 12px;">
                        ${card.name}
                    </div>
                `).join('');

                suggestionsDiv.style.display = 'block';

                // Event listeners pour les suggestions
                suggestionsDiv.querySelectorAll('.card-suggestion').forEach(div => {
                    div.addEventListener('mouseenter', (e) => {
                        e.target.style.background = '#f8f9fa';
                    });
                    div.addEventListener('mouseleave', (e) => {
                        e.target.style.background = 'white';
                    });
                    div.addEventListener('click', (e) => {
                        const cardName = e.target.dataset.cardName;
                        const cardFileName = e.target.dataset.cardFile;
                        selectCard(cardNumber, cardName, cardFileName);
                        suggestionsDiv.style.display = 'none';
                        input.value = cardName;
                    });
                });
            };

            // Fonction pour sélectionner une carte
            const selectCard = (cardNumber, cardName, cardFileName) => {
                const card = this.cardSystem.allCards.find(c => c.fileName === cardFileName);
                if (!card) return;

                // Utiliser le nouveau format de cards-description.json
                const config = this.cardSystem.cardConfigs?.[card.name];
                const turns = config?.turns || [
                    {faction: 'patriots', sabre: false, rifle: false},
                    {faction: 'british', sabre: false, rifle: false},
                    {faction: 'french', sabre: false, rifle: false},
                    {faction: 'indians', sabre: false, rifle: false}
                ];

                selectedCards[cardNumber === 1 ? 'first' : 'second'] = {
                    name: card.name,
                    fileName: card.fileName,
                    turns: turns
                };

                // Afficher les informations de la carte
                document.getElementById(`card-info-${cardNumber}`).style.display = 'block';
                document.getElementById(`card-name-${cardNumber}`).textContent = card.name;
                document.getElementById(`card-turns-${cardNumber}`).innerHTML =
                    turns.map((t, idx) => {
                        const icons = [];
                        if (t.sabre) icons.push('🗡️');
                        if (t.rifle) icons.push('🔫');
                        const iconStr = icons.length > 0 ? ` ${icons.join(' ')}` : '';
                        return `<li>${idx + 1}. ${this.getFactionName(t.faction)}${iconStr}</li>`;
                    }).join('');

                // Vérifier si les deux cartes sont sélectionnées
                checkBothCardsSelected();
            };

            // Fonction pour vérifier si les deux cartes sont sélectionnées
            const checkBothCardsSelected = () => {
                if (selectedCards.first && selectedCards.second) {
                    const confirmBtn = document.getElementById('confirm-cards');
                    confirmBtn.disabled = false;
                    confirmBtn.style.background = '#28a745';
                    confirmBtn.style.cursor = 'pointer';

                    // Afficher le message de démarrage
                    const startInfo = document.getElementById('start-info');
                    const startText = document.getElementById('start-faction-text');
                    startInfo.style.display = 'block';
                    const firstTurn = selectedCards.first.turns[0];
                    const icons = [];
                    if (firstTurn.sabre) icons.push('🗡️');
                    if (firstTurn.rifle) icons.push('🔫');
                    const iconStr = icons.length > 0 ? ` ${icons.join(' ')}` : '';
                    startText.innerHTML = `▶️ Le jeu commence avec la <strong>première carte</strong>, faction: <strong>${this.getFactionName(firstTurn.faction)}${iconStr}</strong>`;
                }
            };

            // Event listeners pour les inputs
            const input1 = document.getElementById('card-input-1');
            const input2 = document.getElementById('card-input-2');

            input1.addEventListener('input', () => showSuggestions('card-input-1', 'suggestions-1', 1));
            input2.addEventListener('input', () => showSuggestions('card-input-2', 'suggestions-2', 2));

            // Cacher les suggestions en cliquant ailleurs
            const hideSuggestions = (e) => {
                const suggestions1 = document.getElementById('suggestions-1');
                const suggestions2 = document.getElementById('suggestions-2');

                if (suggestions1 && !e.target.closest('#card-input-1') && !e.target.closest('#suggestions-1')) {
                    suggestions1.style.display = 'none';
                }
                if (suggestions2 && !e.target.closest('#card-input-2') && !e.target.closest('#suggestions-2')) {
                    suggestions2.style.display = 'none';
                }
            };

            document.addEventListener('click', hideSuggestions);

            // Boutons
            document.getElementById('confirm-cards').addEventListener('click', () => {
                if (selectedCards.first && selectedCards.second) {
                    document.removeEventListener('click', hideSuggestions);
                    popup.remove();
                    resolve(selectedCards);
                }
            });

            document.getElementById('cancel-cards').addEventListener('click', () => {
                document.removeEventListener('click', hideSuggestions);
                popup.remove();
                resolve(null);
            });
        });
    }

    getFactionName(faction) {
        const names = {
            patriots: 'Patriots',
            british: 'British',
            french: 'French',
            indians: 'Indians'
        };
        return names[faction] || faction;
    }

    getCurrentTurnFaction() {
        return this.gameSystem.currentTurn.currentFaction;
    }

    getCurrentTurnInfo() {
        const currentCard = this.gameSystem.currentTurn.cardNumber === 1
            ? this.gameSystem.cards.first
            : this.gameSystem.cards.second;

        if (!currentCard || !currentCard.turns) {
            return null;
        }

        const turnData = currentCard.turns[this.gameSystem.currentTurn.factionIndex];
        return {
            faction: turnData.faction,
            sabre: turnData.sabre,
            rifle: turnData.rifle
        };
    }

    async loadScenario() {
        const scenarioSelect = document.getElementById('scenario-select');
        const scenarioId = scenarioSelect.value;

        if (!scenarioId || scenarioId === '') {
            alert('⚠️ Veuillez sélectionner un scénario');
            return;
        }

        if (scenarioId === 'random') {
            this.generateRandomSituation();
            return;
        }

        try {
            console.log(`🎮 Chargement du scénario: ${scenarioId}`);

            // Appeler l'API pour récupérer les données du scénario
            const response = await fetch(`http://localhost:3001/api/scenario?id=${scenarioId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const scenarioData = await response.json();

            if (scenarioData.error) {
                throw new Error(scenarioData.error);
            }

            console.log('📦 Données du scénario reçues:', scenarioData);

            // Vider le plateau actuel
            this.clearBoard();

            // Afficher la popup de sélection de faction
            const playerFaction = await this.showFactionSelectionPopup();
            if (!playerFaction) {
                // L'utilisateur a annulé
                return;
            }

            // Tirer deux cartes
            const cards = await this.drawTwoCardsPopup();
            if (!cards) {
                // L'utilisateur a annulé
                return;
            }

            // Enregistrer les informations du jeu
            this.gameSystem.playerFaction = playerFaction;
            const allFactions = ['patriots', 'british', 'french', 'indians'];
            const aiFactions = allFactions.filter(f => f !== playerFaction);
            this.gameSystem.aiFactionsString = aiFactions.join(', ');
            this.gameSystem.cards.first = cards.first;
            this.gameSystem.cards.second = cards.second;
            this.gameSystem.currentTurn.cardNumber = 1;
            this.gameSystem.currentTurn.factionIndex = 0;

            // Calculer les informations du tour actuel
            const currentTurnData = cards.first.turns[0];
            this.gameSystem.currentTurn.currentFaction = currentTurnData.faction;
            this.gameSystem.currentTurn.hasSabre = currentTurnData.sabre;
            this.gameSystem.currentTurn.hasRifle = currentTurnData.rifle;

            console.log('🎮 Système de jeu configuré:', this.gameSystem);

            // Placer les cartes sur le plateau (dans la zone sequence et deck)
            const firstCardObj = this.cardSystem.allCards.find(c => c.fileName === cards.first.fileName);
            const secondCardObj = this.cardSystem.allCards.find(c => c.fileName === cards.second.fileName);

            if (firstCardObj) {
                this.cardSystem.currentSequenceCard = firstCardObj;
                console.log('📍 Première carte placée dans la zone Sequence:', firstCardObj.name);
            }

            if (secondCardObj) {
                this.cardSystem.currentDeckCard = secondCardObj;
                console.log('📍 Deuxième carte placée dans la zone Deck:', secondCardObj.name);
            }

            // Mettre à jour l'affichage des cartes dans la sidebar
            this.updateCardStatus();

            // Appliquer les données du scénario
            this.applyScenarioData(scenarioData);

            // Redessiner le plateau
            this.draw();

            // Mettre à jour les compteurs disponibles
            this.updateAvailableCounters();

            // Mettre à jour les statistiques
            this.updateStatistics();

            // Afficher un résumé
            const currentFaction = this.getCurrentTurnFaction();
            alert(`✅ Scénario "${scenarioData.scenario.name}" chargé avec succès!\n\n` +
                  `👤 Vous jouez: ${this.getFactionName(playerFaction)}\n` +
                  `🤖 IA: ${aiFactions.map(f => this.getFactionName(f)).join(', ')}\n\n` +
                  `🎴 Cartes tirées:\n` +
                  `1️⃣ ${cards.first.name}\n` +
                  `2️⃣ ${cards.second.name}\n\n` +
                  `▶️ Tour actuel: ${this.getFactionName(currentFaction)}`);

        } catch (error) {
            console.error('❌ Erreur lors du chargement du scénario:', error);

            if (error.message.includes('Failed to fetch')) {
                alert(`❌ Impossible de se connecter à l'API du scénario.\n\nVérifiez que le serveur API est démarré sur le port 3001.\n\nErreur: ${error.message}`);
            } else {
                alert(`❌ Erreur lors du chargement du scénario: ${error.message}`);
            }
        }
    }

    applyScenarioData(scenarioData) {
        console.log('🔄 Application des données du scénario...');

        // Appliquer les marqueurs globaux
        if (scenarioData.global_state) {
            const globalState = scenarioData.global_state;

            // Mettre à jour les marqueurs de support/opposition
            this.supportTokens.patriots = globalState.opposition_track || 0;
            this.supportTokens.british = globalState.support_track || 0;

            // Mettre à jour les marqueurs de casualties
            this.casualtyTokens.patriots = globalState.rebellion_casualties || 0;
            this.casualtyTokens.british = globalState.british_casualties || 0;
        }

        // Appliquer les ressources des factions
        if (scenarioData.factions) {
            const factions = scenarioData.factions;
            Object.keys(factions).forEach(factionKey => {
                if (this.resourceTokens.hasOwnProperty(factionKey)) {
                    this.resourceTokens[factionKey] = factions[factionKey].resources || 0;
                }
            });
        }

        // Calculer d'abord les totaux nécessaires depuis les données du scénario
        this.calculateScenarioTotals(scenarioData);

        // Appliquer les territoires
        if (scenarioData.territories) {
            Object.keys(scenarioData.territories).forEach(territoryName => {
                this.applyTerritoryData(territoryName, scenarioData.territories[territoryName]);
            });
        }

        // Recalculer les unités disponibles après placement
        this.calculateAvailableUnitsAfterScenario();

        console.log('✅ Données du scénario appliquées');
    }

    calculateScenarioTotals(scenarioData) {
        // Calculer les totaux nécessaires pour chaque type d'unité depuis le scénario
        let totalPatriotsContinentals = 0;
        let totalPatriotsMilitia = 0;
        let totalPatriotsForts = 0;
        let totalBritishRegulars = 0;
        let totalBritishTories = 0;
        let totalBritishForts = 0;
        let totalFrenchRegulars = 0;
        let totalIndianWarParties = 0;
        let totalIndianVillages = 0;

        // Compter depuis les données de territoires
        if (scenarioData.territories) {
            Object.values(scenarioData.territories).forEach(territory => {
                if (territory.units) {
                    if (territory.units.patriots) {
                        totalPatriotsContinentals += territory.units.patriots.continentals || 0;
                        totalPatriotsMilitia += territory.units.patriots.militia || 0;
                        totalPatriotsForts += territory.units.patriots.fort || 0;
                    }
                    if (territory.units.british) {
                        totalBritishRegulars += territory.units.british.regulars || 0;
                        totalBritishTories += territory.units.british.tories || 0;
                        totalBritishForts += territory.units.british.fort || 0;
                    }
                    if (territory.units.french) {
                        totalFrenchRegulars += territory.units.french.regulars || 0;
                    }
                    if (territory.units.indians) {
                        totalIndianWarParties += territory.units.indians.warparties || 0;
                        totalIndianVillages += territory.units.indians.village || 0;
                    }
                }
            });
        }

        // Ajouter les unités disponibles depuis les données du scénario (global_setup.available_units)
        if (scenarioData.factions) {
            const factions = scenarioData.factions;

            // Ces totaux incluent les unités disponibles + placées
            totalPatriotsContinentals += 11; // depuis available_units
            totalPatriotsMilitia += 1;
            totalPatriotsForts += 2;

            totalBritishRegulars += 7;
            totalBritishTories += 8;
            totalBritishForts += 3;

            totalFrenchRegulars += 8;

            totalIndianWarParties += 8;
            totalIndianVillages += 6;
        }

        // Mettre à jour les totaux dans le système
        this.patriotTroops.continentals.total = totalPatriotsContinentals;
        this.patriotTroops.militia.total = totalPatriotsMilitia;
        this.fortSystems.patriots.total = totalPatriotsForts;

        this.britishTroops.regulars.total = totalBritishRegulars;
        this.britishTroops.tories.total = totalBritishTories;
        this.fortSystems.british.total = totalBritishForts;

        this.frenchRegulars.total = totalFrenchRegulars;

        this.indianWarParties.total = totalIndianWarParties;
        this.indianVillages.total = totalIndianVillages;

        console.log('📊 Totaux calculés:', {
            patriots: { continentals: totalPatriotsContinentals, militia: totalPatriotsMilitia, forts: totalPatriotsForts },
            british: { regulars: totalBritishRegulars, tories: totalBritishTories, forts: totalBritishForts },
            french: { regulars: totalFrenchRegulars },
            indians: { warparties: totalIndianWarParties, villages: totalIndianVillages }
        });
    }

    applyTerritoryData(territoryName, territoryData) {
        console.log(`🏛️ Application des données pour ${territoryName}:`, territoryData);

        // Nettoyer les données existantes
        this.clearTerritoryData(territoryName);

        // Appliquer le contrôle
        if (territoryData.controlling_faction) {
            this.controlTokens[territoryName] = territoryData.controlling_faction;
        }

        // Appliquer le niveau de support - CORRECTION DU MAPPING
        if (territoryData.support_level && territoryData.support_level !== 'neutral') {
            // Mapper correctement les niveaux de support avec l'image
            const supportMapping = {
                'active_opposition': { value: -2, image: 'opposition_active' },
                'passive_opposition': { value: -1, image: 'opposition_passive' },
                'neutral': { value: 0, image: null },
                'passive_support': { value: 1, image: 'support_passive' },
                'active_support': { value: 2, image: 'support_active' }
            };

            const supportData = supportMapping[territoryData.support_level];
            if (supportData !== undefined) {
                this.territorySupport[territoryName] = supportData;
                console.log(`📍 Support appliqué pour ${territoryName}: ${territoryData.support_level} (${supportData.value}, image: ${supportData.image})`);
            }
        }

        // Appliquer les leaders
        if (territoryData.leaders && territoryData.leaders.length > 0) {
            this.leaders[territoryName] = territoryData.leaders;
            console.log(`👤 Leaders appliqués pour ${territoryName}:`, territoryData.leaders);
        }

        // Appliquer les unités
        if (territoryData.units) {
            Object.keys(territoryData.units).forEach(factionKey => {
                const factionUnits = territoryData.units[factionKey];

                Object.keys(factionUnits).forEach(unitType => {
                    const count = factionUnits[unitType];
                    this.placeScenarioUnit(territoryName, factionKey, unitType, count);
                });
            });
        }
    }

    placeScenarioUnit(territoryName, faction, unitType, count) {
        console.log(`⚔️ Placement: ${count}x ${unitType} ${faction} dans ${territoryName}`);

        // Placer les unités selon le système existant - les available seront recalculés après
        switch (faction) {
            case 'patriots':
                switch (unitType) {
                    case 'continentals':
                        this.patriotTroops.continentals.placed[territoryName] = count;
                        break;
                    case 'militia':
                        this.patriotTroops.militia.placed[territoryName] = count;
                        break;
                    case 'fort':
                        this.fortSystems.patriots.placed[territoryName] = count;
                        break;
                }
                break;

            case 'british':
                switch (unitType) {
                    case 'regulars':
                        this.britishTroops.regulars.placed[territoryName] = count;
                        break;
                    case 'tories':
                        this.britishTroops.tories.placed[territoryName] = count;
                        break;
                    case 'fort':
                        this.fortSystems.british.placed[territoryName] = count;
                        break;
                }
                break;

            case 'french':
                switch (unitType) {
                    case 'regulars':
                        this.frenchRegulars.placed[territoryName] = count;
                        break;
                    case 'squadrons':
                        // Note: Le système de squadrons pourrait nécessiter des ajustements
                        console.log(`📝 Note: Squadrons français non encore complètement supportées`);
                        break;
                }
                break;

            case 'indians':
                switch (unitType) {
                    case 'warparties':
                        this.indianWarParties.placed[territoryName] = count;
                        break;
                    case 'village':
                        this.indianVillages.placed[territoryName] = count;
                        break;
                }
                break;
        }
    }

    calculateAvailableUnitsAfterScenario() {
        // Recalcule les unités disponibles basées sur total - placé
        const calculatePlaced = (placedObj) => {
            return Object.values(placedObj).reduce((sum, count) => sum + (count || 0), 0);
        };

        // Patriots
        this.patriotTroops.continentals.available =
            this.patriotTroops.continentals.total - calculatePlaced(this.patriotTroops.continentals.placed);
        this.patriotTroops.militia.available =
            this.patriotTroops.militia.total - calculatePlaced(this.patriotTroops.militia.placed);
        this.fortSystems.patriots.available =
            this.fortSystems.patriots.total - calculatePlaced(this.fortSystems.patriots.placed);

        // British
        this.britishTroops.regulars.available =
            this.britishTroops.regulars.total - calculatePlaced(this.britishTroops.regulars.placed);
        this.britishTroops.tories.available =
            this.britishTroops.tories.total - calculatePlaced(this.britishTroops.tories.placed);
        this.fortSystems.british.available =
            this.fortSystems.british.total - calculatePlaced(this.fortSystems.british.placed);

        // French
        this.frenchRegulars.available =
            this.frenchRegulars.total - calculatePlaced(this.frenchRegulars.placed);

        // Indians
        this.indianWarParties.available =
            this.indianWarParties.total - calculatePlaced(this.indianWarParties.placed);
        this.indianVillages.available =
            this.indianVillages.total - calculatePlaced(this.indianVillages.placed);

        console.log('🔢 Unités disponibles recalculées:', {
            patriots: {
                continentals: this.patriotTroops.continentals.available,
                militia: this.patriotTroops.militia.available,
                forts: this.fortSystems.patriots.available
            },
            british: {
                regulars: this.britishTroops.regulars.available,
                tories: this.britishTroops.tories.available,
                forts: this.fortSystems.british.available
            },
            french: { regulars: this.frenchRegulars.available },
            indians: {
                warparties: this.indianWarParties.available,
                villages: this.indianVillages.available
            }
        });
    }
}

// Initialize game board when page loads
document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = new GameBoard();
    
    // Initialize faction controls
    gameBoard.updateUnitGrid();
});