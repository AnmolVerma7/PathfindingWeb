// Constants (use AppConfig colors if available to allow easy customization)
const COLORS = (typeof window !== 'undefined' && window.AppConfig && window.AppConfig.colors) ? window.AppConfig.colors : {
    WHITE: "#FFFFFF",
    BLACK: "#000000",
    RED: "#FF3333",
    GREEN: "#33FF33",
    BLUE: "#3333FF",
    YELLOW: "#FFFF33",
    PURPLE: "#9933FF",
    ORANGE: "#FF9900",
    TURQUOISE: "#33FFEE",
    GREY: "#AAAAAA",
    GOLD: "#FFD700"
};

const ALGORITHM_INFO = {
    astar: "A* Algorithm balances between path length and distance to target, guaranteeing the shortest path.",
    dijkstra: "Dijkstra's Algorithm explores all directions equally, guaranteeing the shortest path but less efficient than A*.",
    greedy: "Greedy Best-First Search always moves toward the goal, very fast but does not guarantee the shortest path."
};

class PathfindingVisualizer {
    constructor() {
        console.log("Initializing PathfindingVisualizer...");

        // Initialize canvas
    this.canvas = document.getElementById('gridCanvas');
        if (!this.canvas) {
            console.error("Canvas element not found!");
            return;
        }
    this.ctx = this.canvas.getContext('2d');
    // Initialize renderer and state manager (lightweight)
    if (typeof Renderer2D !== 'undefined') {
        this.renderer2D = new Renderer2D(this.canvas);
    }
    if (typeof VisualizerState !== 'undefined') {
        this.state = new VisualizerState();
        this.state.set({ is3DView: false, zoomLevel: 1, panOffset: {x:0,y:0}, selectedAlgorithm: 'astar' });
    }
    // Track DPR and CSS pixel dimensions for correct 2D math
    this.dpr = window.devicePixelRatio || 1;
    this.canvasCssWidth = 0;
    this.canvasCssHeight = 0;
        
        // Force proper canvas dimensions immediately
        this.forceCanvasDimensions();
        if (this.renderer2D && this.renderer2D.resizeToWindow) {
            this.renderer2D.resizeToWindow();
        }
        
        // Set default properties
        this.is3DView = false;
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.mousePos = { x: 0, y: 0 };
        this.selectedAlgorithm = 'astar';
        this.isRunning = false;
        this.isCancelled = false;
        this.animationDelay = parseInt(document.getElementById('speedSelect')?.value) || 20;
        // App background color is configurable via CSS variable --app-bg in Styles/main.css
        const appBgVar = (typeof window !== 'undefined' && window.getComputedStyle)
            ? getComputedStyle(document.documentElement).getPropertyValue('--app-bg')
            : '';
        const appBg = (appBgVar && appBgVar.trim().length > 0) ? appBgVar.trim() : '#B2BEB5';
        this.background2D = appBg;
        this.background3D = appBg;
        
        // Add 3D cell size properties
        this.cell3DSizes = {
            barrier: 0.8,    // Tall barriers
            startEnd: 0.4,   // Start/End points
            path: 0.2,       // Path cells
            visited: 0.15,   // Visited cells
            empty: 0.05      // Empty cells
        };
        
        // Add 3D cell width/depth (affects spacing)
        this.cell3DWidth = 0.9;

        // Add 3D camera configuration
        this.camera3DConfig = {
            position: { x: 25, y: 50, z: 50 },
            rotation: { x: -0.5, y: 0, z: 0 },
            fov: 45,
            near: 0.1,
            far: 1000,
            lookAt: { x: 25, y: 0, z: 25 }
        };
        
        // Add debug properties
        this.isDebugMode = false;
        this.debugOverlay = null;

        // Initialize grid with proper dimensions
        this.initializeGrid();
        
        // Initialize UI elements and event listeners
        this.initUIElements();
        this.setupEventListeners();
        
        // Remove multi-point related initialization
        if (this.multiPointToggle) {
            this.multiPointToggle.remove();
        }

        // Force an initial render
        this.render();
        
        console.log("PathfindingVisualizer initialized successfully");

        // Show tutorial when first loaded
        const tutorial = document.getElementById('tutorial');
        if (tutorial) {
            tutorial.classList.add('show');
        }

        // Initialize UI effects
        this.uiEffects = new UIEffects();
    }

    forceCanvasDimensions() {
        // Get the true window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
    // Set physical pixel dimensions accounting for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;
    this.canvas.width = windowWidth * dpr;
    this.canvas.height = windowHeight * dpr;
        
        // Set CSS dimensions to exactly match window
    this.canvas.style.width = windowWidth + 'px';
    this.canvas.style.height = windowHeight + 'px';
    this.canvasCssWidth = windowWidth;
    this.canvasCssHeight = windowHeight;
        
        // Scale context to account for device pixel ratio
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset to avoid compounding on resize
    this.ctx.scale(dpr, dpr);
        
        console.log(`Canvas dimensions forced to ${windowWidth}x${windowHeight} (DPR: ${dpr})`);
    }

    initializeGrid() {
        // Get the grid size from slider (this will be our column count)
        const gridSizeSlider = document.getElementById('gridSizeSlider');
        const requestedCols = parseInt(gridSizeSlider?.value || 50);
        
        // Calculate available space with padding so the dark background peeks through
        const padding = 40;
        const availableWidth = window.innerWidth - (padding * 2);
        const availableHeight = window.innerHeight - (padding * 2);
        
        // Calculate cell size based on requested columns
        const cellSize = Math.floor(availableWidth / requestedCols);
        
        // Calculate number of rows that will fit with this cell size
        const rows = Math.floor(availableHeight / cellSize);
        const cols = requestedCols;
        
        console.log(`Creating grid with ${rows}×${cols} cells, cell size: ${cellSize}px`);
        
        // Create new grid without preserving old state
        this.grid = new Grid(rows, cols);
        this.grid.cellSize = cellSize;
        this.adaptDisplayToGridSize();
        
        // Reset view parameters (fit-to-screen for small displays)
        this.panOffset = { x: 0, y: 0 };
        const gridPixelWidth = cols * cellSize;
        const gridPixelHeight = rows * cellSize;
        if (this.canvasCssWidth && this.canvasCssHeight) {
            const fitZoom = Math.min(
                this.canvasCssWidth / gridPixelWidth,
                this.canvasCssHeight / gridPixelHeight
            );
            // Scale down to 88% of fit so the dark background is always visible around the grid
            this.zoomLevel = Math.min(0.88, fitZoom * 0.88);
        } else {
            this.zoomLevel = 0.88;
        }
        // Store default zoom so we can use it as the minimum zoom floor
        this.defaultZoom = this.zoomLevel;
        // Update state
        if (this.state && this.state.set) this.state.set({ zoomLevel: this.zoomLevel, panOffset: this.panOffset });

        // Update the grid size label to display actual columns×rows
        const gridSizeValue = document.getElementById('gridSizeValue');
        if (gridSizeValue) {
            gridSizeValue.textContent = `${cols}×${rows}`;
        }
        
        // Force an immediate update of neighbors after grid creation
        this.grid.updateAllNeighbors();
    
        // After grid creation, update camera if in 3D mode
        if (this.is3DView) {
            this.create3DGrid();
            this.calculateCameraFit();
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } else {
            this.render();
        }
    }

    resizeCanvas() {
        // Store current camera position if in 3D
        let cameraState = null;
        if (this.is3DView && this.camera && this.controls) {
            cameraState = {
                position: this.camera.position.clone(),
                target: this.controls.target.clone()
            };
        }

        // Get the actual window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
    // Set canvas size to match window with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;
    this.canvas.width = windowWidth * dpr;
    this.canvas.height = windowHeight * dpr;
        
    // Set CSS dimensions
    this.canvas.style.width = windowWidth + 'px';
    this.canvas.style.height = windowHeight + 'px';
    this.canvasCssWidth = windowWidth;
    this.canvasCssHeight = windowHeight;
        
    // Scale context
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset to avoid compounding on resize
    this.ctx.scale(dpr, dpr);
    if (this.renderer2D && this.renderer2D.resizeToWindow) {
        this.renderer2D.resizeToWindow();
    }
        
        console.log(`Canvas resized to ${windowWidth}x${windowHeight} (DPR: ${dpr})`);
        
        // Reinitialize the grid
        this.initializeGrid();
        
        // Update 3D renderer if active
        if (this.is3DView && this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            if (this.camera) {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                
                // Restore camera position if we had it
                if (cameraState) {
                    this.camera.position.copy(cameraState.position);
                    if (this.controls) {
                        this.controls.target.copy(cameraState.target);
                        this.controls.update();
                    }
                } else {
                    // Calculate new camera position to fit grid
                    this.calculateCameraFit();
                }
                
                // Force render with updated camera
                this.renderer.render(this.scene, this.camera);
            }
        }
    }

    async loadThreeJS() {
        // Check if Three.js is already loaded
        if (typeof THREE !== 'undefined') {
            return true;
        }
        
        return new Promise((resolve, reject) => {
            console.log("Loading Three.js libraries...");
            
            // Create a global namespace for Three.js
            window.THREE = {};
            
            // Add Three.js core
            const threeScript = document.createElement('script');
            threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            document.head.appendChild(threeScript);
            
            threeScript.onload = () => {
                console.log("Three.js core loaded successfully");
                
                // Add OrbitControls
                const orbitScript = document.createElement('script');
                orbitScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js';
                document.head.appendChild(orbitScript);
                
                orbitScript.onload = () => {
                    console.log("OrbitControls loaded successfully");
                    resolve(true);
                };
                
                orbitScript.onerror = (error) => {
                    console.error("Failed to load OrbitControls:", error);
                    reject(error);
                };
            };
            
            threeScript.onerror = (error) => {
                console.error("Failed to load Three.js:", error);
                reject(error);
            };
        });
    }

    async initialize3DView() {
        try {
            // Load Three.js if needed
            await this.loadThreeJS();
            
            // Create a container for the 3D scene if it doesn't exist
            let container = document.getElementById('container3D');
            if (!container) {
                container = document.createElement('div');
                container.id = 'container3D';
                container.style.position = 'absolute';
                container.style.top = '0';
                container.style.left = '0';
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.overflow = 'hidden';
                container.style.zIndex = '0';
                document.body.appendChild(container);
            } else {
                // Clear existing content
                container.innerHTML = '';
                container.style.display = 'block';
            }
            
            // Set up the 3D scene
            this.setup3DScene(container);
            
            // Force immediate rendering after scene setup
            if (this.renderer && this.scene && this.camera) {
                // Calculate camera fit before first render
                this.calculateCameraFit();
                
                // Force immediate render to show the entire grid
                this.renderer.render(this.scene, this.camera);
                
                // Wait a small amount of time for the renderer to complete
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Calculate camera fit again after initial render
                // This helps with some browsers/GPUs that need a render cycle
                // before accurate positioning
                this.calculateCameraFit();
                this.renderer.render(this.scene, this.camera);
            }
            
        } catch (error) {
            console.error("Failed to initialize 3D view:", error);
            this.updateStatus("Unable to load 3D view. Falling back to 2D.");
            this.is3DView = false;
            
            if (this.viewToggle) {
                this.viewToggle.checked = false;
            }
        }
    }

    calculateCameraFit() {
        // Prefer a top-down view that fits the whole grid with a margin
        this.setTopDownCameraWithMargin(0.15); // 15% margin by default
    }

    // Compute a top-down camera configuration so the whole grid is visible with margin
    setTopDownCameraWithMargin(margin = 0.15) {
        if (!this.grid || !this.camera) return;

        // Compute world dimensions based on 3D cell width and spacing
        const spacingFactor = (this.cell3DWidth || 1) * 1.1;
        const gridWorldWidth = this.grid.cols * spacingFactor;
        const gridWorldDepth = this.grid.rows * spacingFactor;

        // We center the grid at origin in create3DGrid(); set target accordingly
        const centerX = 0;
        const centerZ = 0;
        const centerY = 0;

        // Desired visible size with margin
        const desiredWidth = gridWorldWidth * (1 + margin);
        const desiredHeight = gridWorldDepth * (1 + margin);

        // Perspective camera looking straight down: visible vertical span at ground
        const fovRad = (this.camera.fov * Math.PI) / 180;
        const aspect = this.renderer ? (this.renderer.domElement.width / this.renderer.domElement.height) : (window.innerWidth / window.innerHeight);

        // Height needed to fit each dimension
        const requiredHeightForVertical = desiredHeight / (2 * Math.tan(fovRad / 2));
        const requiredHeightForHorizontal = (desiredWidth / aspect) / (2 * Math.tan(fovRad / 2));
        const cameraHeight = Math.max(requiredHeightForVertical, requiredHeightForHorizontal);

        // Position camera straight above center and look down (use standard Y-up)
        this.camera.position.set(centerX, cameraHeight, centerZ);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(centerX, centerY, centerZ);
        this.camera.updateProjectionMatrix();

        // Update controls target if they exist
        if (this.controls) {
            this.controls.target.set(centerX, centerY, centerZ);
            this.controls.update();
        }
    }

    // Add this method to your PathfindingVisualizer class
    applyCameraPositioningFixes() {
        console.log("Applying camera positioning fixes...");
        
        // When grid size changes, update the 3D view properly
        const gridSizeSlider = document.getElementById('gridSizeSlider');
        if (gridSizeSlider) {
            // Override the existing event listener with improved handling
            gridSizeSlider.addEventListener('change', (e) => {
                const size = e.target.value;
                const gridSizeValue = document.getElementById('gridSizeValue');
                if (gridSizeValue) {
                    gridSizeValue.textContent = `${size}×${size}`;
                }
                
                console.log(`Grid size changed to ${size}`);
                
                // Recreate the grid with the new size
                this.initializeGrid();
                
                // Update both views appropriately
                if (this.is3DView) {
                    // Adapt display settings for the new grid size
                    this.adaptDisplayToGridSize();
                    
                    // Recreate the 3D grid with new settings
                    this.create3DGrid();
                    
                    // Recalculate camera position to fit the new grid
                    this.calculateCameraFit();
                    
                    // Force render to show updated grid
                    if (this.renderer && this.scene && this.camera) {
                        this.renderer.render(this.scene, this.camera);
                    }
                } else {
                    // Just render the 2D view
                    this.render();
                }
            });
        }
        
        // Add a reset camera position button to the UI
        const addResetCameraButton = () => {
            // Check if button already exists
            if (document.getElementById('resetCameraBtn')) {
                return;
            }
            
            const controlsPanel = document.getElementById('controlsPanel');
            if (!controlsPanel) return;
            
            const resetBtn = document.createElement('button');
            resetBtn.id = 'resetCameraBtn';
            resetBtn.className = 'btn';
            resetBtn.textContent = 'Reset Camera';
            resetBtn.title = 'Reset camera position to fit grid (or press R)';
            resetBtn.style.display = this.is3DView ? 'block' : 'none';
            
            // Add click handler
            resetBtn.addEventListener('click', () => {
                if (!this.is3DView) return;
                
                // Reset camera position to fit grid
                this.calculateCameraFit();
                
                // Force render with updated camera
                if (this.renderer && this.scene && this.camera) {
                    this.renderer.render(this.scene, this.camera);
                }
                
                this.updateStatus("Camera position reset");
            });
            
            // Insert after clear path button
            const clearPathBtn = document.getElementById('clearPathBtn');
            if (clearPathBtn && clearPathBtn.parentNode) {
                clearPathBtn.parentNode.insertBefore(resetBtn, clearPathBtn.nextSibling);
            } else {
                controlsPanel.appendChild(resetBtn);
            }
        };
        
        // Update the view toggle handler to show/hide the reset camera button
        const originalViewToggleHandler = this.viewToggleHandler;
        this.viewToggleHandler = (e) => {
            // Call the original handler
            originalViewToggleHandler.call(this, e);
            
            // Update reset camera button visibility
            const resetCameraBtn = document.getElementById('resetCameraBtn');
            if (resetCameraBtn) {
                resetCameraBtn.style.display = this.is3DView ? 'block' : 'none';
            }
        };
        
        // Add the reset camera button
        addResetCameraButton();
        
        console.log("Camera positioning fixes applied");
    }

    setup3DScene(container) {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.background3D);
        
        // Initialize camera with custom settings
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            this.camera3DConfig.fov,
            aspect,
            this.camera3DConfig.near,
            this.camera3DConfig.far
        );
        // Initial camera fit will be applied after grid creation
        
        // Create renderer with better settings
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        // Match renderer clear color to CSS-configured app background
        if (typeof THREE !== 'undefined') {
            this.renderer.setClearColor(new THREE.Color(this.background3D), 1);
        } else {
            this.renderer.setClearColor(0xf0f0f0, 1);
        }
        container.appendChild(this.renderer.domElement);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        // Add directional light
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 10, 10);
        this.scene.add(dirLight);
        
        // Create raycaster and mouse position tracker for 3D interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse3D = new THREE.Vector2();
        
    // Adjust OrbitControls for orbit + map-friendly constraints (Alt to enable)
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.15;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
        // Pan parallel to world-up (Y), i.e., across the XZ plane
        this.controls.screenSpacePanning = false;
        // Allow rotation (orbit) like original behavior; prevent flipping under the grid
        this.controls.enableRotate = true;
        const EPS = 1e-3;
        this.controls.minPolarAngle = 0 + EPS;              // near top-down
        this.controls.maxPolarAngle = Math.PI / 2 - EPS;     // don't go below horizon
        // Mouse controls similar to original, but keep right-click free for delete
        if (THREE.MOUSE) {
            this.controls.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.PAN,
                RIGHT: THREE.MOUSE.NONE
            };
        }
        this.controls.minDistance = 1;
        this.controls.maxDistance = 1000;
        // Look at origin by default
        this.controls.target.set(0, 0, 0);
        
        // Controls disabled by default; hold Alt to enable orbiting/panning
        this.controls.enabled = false;
        
        // Force an update to apply settings
        this.controls.update();
        
        // Add event listeners for 3D interaction including mousemove
        this.renderer.domElement.addEventListener('mousedown', this.handle3DMouseDown.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.handle3DMouseMove.bind(this));
        this.renderer.domElement.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.dragOperation = null;
        });
        
        // Add event listeners for 3D interaction (mousedown is already added above)
        // Avoid duplicate registrations
        
        // Alt = rotate mode; no modifier = editing mode
        this._modKeys = { alt: false };

        this._onKeyDown3D = (e) => {
            if (e.key === 'Alt') { this._modKeys.alt = true; }
            this.update3DControlMode();
        };
        this._onKeyUp3D = (e) => {
            if (e.key === 'Alt') { this._modKeys.alt = false; }
            this.update3DControlMode();
        };

        document.addEventListener('keydown', this._onKeyDown3D);
        document.addEventListener('keyup',   this._onKeyUp3D);

        // Sync mode on canvas interaction
        this.renderer.domElement.addEventListener('mousedown',  () => this.update3DControlMode());
        this.renderer.domElement.addEventListener('mouseenter', () => this.update3DControlMode());
        this.renderer.domElement.addEventListener('mouseleave', () => this.update3DControlMode());
        this.update3DControlMode();


        
        // Prevent context menu on right click
        this.renderer.domElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Create the grid
        this.create3DGrid();
        
        // Ensure camera is top-down with margin after grid is created
        this.setTopDownCameraWithMargin(0.15);
        this.renderer.render(this.scene, this.camera);

        // Start animation loop
        this.animate3D();
    }

    // Switch OrbitControls behavior based on modifier keys
    update3DControlMode() {
        if (!this.controls) return;
        const { alt } = this._modKeys || { alt: false };
        if (alt) {
            // Alt: orbit/rotate mode
            this.controls.enabled = true;
            this.controls.enableRotate = true;
            this.controls.screenSpacePanning = false;
            if (THREE.MOUSE) {
                this.controls.mouseButtons = {
                    LEFT: THREE.MOUSE.ROTATE,
                    MIDDLE: THREE.MOUSE.PAN,
                    RIGHT: THREE.MOUSE.NONE
                };
            }
        } else {
            // No modifier: disable controls so clicks edit the grid
            this.controls.enabled = false;
        }
        this.controls.update();
    }

    create3DGrid() {
        // Center the grid at origin for simpler camera math
        const spacingFactor = this.cell3DWidth * 1.1;
        const gridWidthWorld = this.grid.cols * spacingFactor;
        const gridDepthWorld = this.grid.rows * spacingFactor;
        const startX = -gridWidthWorld / 2;
        const startZ = -gridDepthWorld / 2;
    
        // Clear any existing 3D objects
        if (this.cubes && this.cubes.length > 0) {
            for (const cube of this.cubes) {
                if (cube.mesh) {
                    // Remove label sprite if it exists
                    if (cube.mesh.labelSprite) {
                        this.scene.remove(cube.mesh.labelSprite);
                        cube.mesh.labelSprite = null;
                    }
                    this.scene.remove(cube.mesh);
                    if (cube.mesh.material) {
                        cube.mesh.material.dispose();
                    }
                    if (cube.mesh.geometry) {
                        cube.mesh.geometry.dispose();
                    }
                }
            }
        }
        
        // Create new array for cubes
        this.cubes = [];
        
        // Create shared geometry for better performance
        const baseGeometry = new THREE.BoxGeometry(this.cell3DWidth, 1, this.cell3DWidth);
        
        // Create all grid cubes
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const spot = this.grid.getSpot(row, col);
                if (!spot) continue;
                
                // Get color based on spot type
                const color = this.getThreeColor(spot.color);
                
                // Create a new material for each cube to ensure independent color updates
                const material = new THREE.MeshStandardMaterial({ 
                    color: color,
                    roughness: 0.7,
                    metalness: 0.2
                });
                
                // Create mesh with the shared geometry
                const cube = new THREE.Mesh(baseGeometry, material);
                
                // Determine height based on cell type
                const height = this.getCellHeight(spot);
                
                // Position cube at the correct position - swap row/col for proper orientation
                const x = startX + (col * spacingFactor);
                const z = startZ + (row * spacingFactor);
                cube.position.set(x, height/2, z);
                
                // Scale for height
                cube.scale.set(1, height, 1);
                
                // Add to scene
                this.scene.add(cube);
                
                if ((spot.is_start() || spot.is_end()) && spot.pointLabel) {
                    // Create text sprite for the label
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = 64;
                    canvas.height = 64;
                    
                    // Draw background circle
                    context.fillStyle = 'white';
                    context.beginPath();
                    context.arc(32, 32, 16, 0, 2 * Math.PI);
                    context.fill();
                    
                    // Draw text
                    context.font = 'bold 24px Arial';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillStyle = 'black';
                    context.fillText(spot.pointLabel, 32, 32);
                    
                    // Create sprite texture
                    const texture = new THREE.CanvasTexture(canvas);
                    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
                    const sprite = new THREE.Sprite(spriteMaterial);
                    
                    // Position sprite above the cube - swap row/col here too
                    sprite.position.set(x, height + 0.5, z);
                    sprite.scale.set(1, 1, 1);
                    
                    // Add to scene
                    this.scene.add(sprite);
                    
                    // Store reference to remove later
                    cube.labelSprite = sprite;
                }
                
                // Store reference with row/col for raycasting
                this.cubes.push({ 
                    spot: spot, 
                    mesh: cube, 
                    row: row, 
                    col: col 
                });
            }
        }
        
        console.log(`Created 3D grid with ${this.cubes.length} cubes`);
        
        // Forced initial render to ensure all cubes are visible
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    update3DGrid() {
        if (!this.cubes || !this.scene) return;

        try {
            // Track if we need to force a render
            let hasChanges = false;

            // Loop through all cube representations in the 3D scene
            for (const cube of this.cubes) {
                if (!cube || !cube.spot || !cube.mesh) continue;

                // Get the current color from the spot
                const hexColor = this.getThreeColor(cube.spot.color);

                // Check if color needs updating by comparing hex values
                if (cube.mesh.material.color.getHex() !== hexColor) {
                    // Update the material color properly with the new color
                    cube.mesh.material.color.setHex(hexColor);
                    hasChanges = true;
                }

                // Determine appropriate height based on cell type
                const height = this.getCellHeight(cube.spot);

                // Calculate scaled height (with consistent scaling)
                const scaledHeight = height;

                // Update the cube's scale only if it changed significantly
                if (Math.abs(cube.mesh.scale.y - scaledHeight) > 0.01) {
                    cube.mesh.scale.y = scaledHeight;
                    cube.mesh.position.y = height / 2; // Center the cube vertically
                    hasChanges = true;
                }

                // Handle label visibility for points
                if ((cube.spot.is_start() || cube.spot.is_end()) && cube.mesh.labelSprite) {
                    if (cube.spot.pointLabel) {
                        cube.mesh.labelSprite.visible = true;
                    } else {
                        cube.mesh.labelSprite.visible = false;
                    }
                }
            }

            // Force a render if changes were made to ensure visibility
            if (hasChanges && this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (error) {
            console.error("Error updating 3D grid:", error);
            // Fall back to 2D view on error
            this.is3DView = false;
            if (this.viewToggle) {
                this.viewToggle.checked = false;
            }
            this.updateStatus("Error updating 3D view. Switched to 2D mode.");
        }
    }

    adaptDisplayToGridSize() {
        // Compute base scale for cell visuals relative to window and grid size
        const gridSize = Math.max(this.grid.rows, this.grid.cols);
        const padding = 40;
        const availableWidth = window.innerWidth - (padding * 2);
        const availableHeight = window.innerHeight - (padding * 2);
        const baseScale = Math.min(
            availableWidth / (gridSize * 30),
            availableHeight / (gridSize * 30)
        );

        this.cell3DSizes = {
            barrier: 1.5 * baseScale,
            startEnd: 0.8 * baseScale,
            path: 0.4 * baseScale,
            visited: 0.25 * baseScale,
            empty: 0.1 * baseScale
        };
        this.cell3DWidth = 1.5 * baseScale;
    }

    animate3D() {
        // Only run animation if in 3D mode
        if (!this.is3DView) return;
        
        // Schedule next frame with proper binding
        this.animationFrameId = requestAnimationFrame(() => this.animate3D());
        
        try {
            // Update controls with damping for smooth camera movement
            if (this.controls) {
                this.controls.update();
            }
            
            // Update debug info if enabled
            if (this.isDebugMode) {
                this.updateDebugInfo();
            }
            
            // Only render when camera is moving
            if (this.renderer && this.scene && this.camera && this.controls.enableDamping) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (error) {
            console.error("Error in 3D animation:", error);
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            this.is3DView = false;
            if (this.viewToggle) {
                this.viewToggle.checked = false;
            }
            this.updateStatus("3D rendering error. Switched to 2D mode.");
        }
    }

    getCellHeight(spot) {
        if (spot.is_barrier()) {
            return this.cell3DSizes.barrier;
        } else if (spot.is_start() || spot.is_end()) {
            return this.cell3DSizes.startEnd;
        } else if (spot.is_path()) {
            return this.cell3DSizes.path;
        } else if (spot.is_open() || spot.is_closed()) {
            return this.cell3DSizes.visited;
        } else {
            return this.cell3DSizes.empty;
        }
    }

    getThreeColor(colorStr) {
        // Convert color string to proper THREE.js color format
        if (colorStr.startsWith('#')) {
            // Handle hex format properly - THREE.js wants numerical value
            return parseInt(colorStr.substring(1), 16);
        }
        
        // Handle RGB format
        if (colorStr.startsWith('rgb')) {
            const matches = colorStr.match(/\d+/g);
            if (matches && matches.length >= 3) {
                const r = parseInt(matches[0]);
                const g = parseInt(matches[1]);
                const b = parseInt(matches[2]);
                return (r << 16) | (g << 8) | b;
            }
        }
        
        // Handle color constants
        switch (colorStr) {
            case COLORS.WHITE: return 0xFFFFFF;
            case COLORS.BLACK: return 0x000000;
            case COLORS.RED: return 0xFF3333;
            case COLORS.GREEN: return 0x33FF33;
            case COLORS.BLUE: return 0x3333FF;
            case COLORS.YELLOW: return 0xFFFF33;
            case COLORS.PURPLE: return 0x9933FF;
            case COLORS.ORANGE: return 0xFF9900;
            case COLORS.TURQUOISE: return 0x33FFEE;
            case COLORS.GREY: return 0xAAAAAA;
            case COLORS.GOLD: return 0xFFD700;
            default: return 0xCCCCCC;
        }
    }

    handle3DMouseDown(event) {
        if (this.isRunning) return;
        // Skip editing when orbit controls are active (Alt held)
        if (this.controls && this.controls.enabled) return;
        
        // Calculate mouse position for raycasting
        this.mouse3D.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse3D.y = - (event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray
        this.raycaster.setFromCamera(this.mouse3D, this.camera);
        
        // Find intersections
        const intersects = this.raycaster.intersectObjects(this.cubes.map(cube => cube.mesh));
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            const cubeInfo = this.cubes.find(cube => cube.mesh === clickedObject);
            
            if (cubeInfo) {
                const spot = cubeInfo.spot;
                
                if (event.button === 0) { // Left click
                    if (spot.is_start() || spot.is_end()) {
                        // Don't do anything if clicking on existing point
                        return;
                    } else if (this.grid.startSpots.length === 0) {
                        // Place start point
                        spot.make_start();
                        spot.setPointLabel('S');
                        this.grid.startSpots.push(spot);
                        this.updateStatus(`Start point placed at (${cubeInfo.row}, ${cubeInfo.col})`);
                    } else if (this.grid.endSpots.length === 0) {
                        // Place end point
                        spot.make_end();
                        spot.setPointLabel('E');
                        this.grid.endSpots.push(spot);
                        this.updateStatus(`End point placed at (${cubeInfo.row}, ${cubeInfo.col})`);
                    } else {
                        // Place barrier and start drag operation
                        this.isDragging = true;
                        this.dragOperation = 'place';
                        spot.make_barrier();
                        this.updateStatus(`Wall placed at (${cubeInfo.row}, ${cubeInfo.col})`);
                    }
                    this.create3DGrid(); // Recreate to ensure labels are shown
                } else if (event.button === 2) { // Right click
                    // Start delete dragging operation
                    this.isDragging = true;
                    this.dragOperation = 'delete';
                    
                    // Handle removing start/end points
                    if (spot.is_start()) {
                        this.grid.startSpots = this.grid.startSpots.filter(s => 
                            s.row !== spot.row || s.col !== spot.col
                        );
                        spot.pointLabel = null;
                    } else if (spot.is_end()) {
                        this.grid.endSpots = this.grid.endSpots.filter(s => 
                            s.row !== spot.row || s.col !== spot.col
                        );
                        spot.pointLabel = null;
                    }
                    
                    // Reset the spot
                    spot.reset();
                    this.updateStatus(`Node removed at (${cubeInfo.row}, ${cubeInfo.col})`);
                    this.create3DGrid(); // Recreate to ensure labels are removed
                }
            }
        }
    }

    handle3DMouseMove(event) {
        if (!this.isDragging || !this.dragOperation) return;
        
        // Calculate mouse position for raycasting
        this.mouse3D.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse3D.y = - (event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray
        this.raycaster.setFromCamera(this.mouse3D, this.camera);
        
        // Find intersections
        const intersects = this.raycaster.intersectObjects(this.cubes.map(cube => cube.mesh));
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            const cubeInfo = this.cubes.find(cube => cube.mesh === clickedObject);
            
            if (cubeInfo) {
                const spot = cubeInfo.spot;
                if (!spot.is_start() && !spot.is_end()) {
                    if (this.dragOperation === 'place') {
                        spot.make_barrier();
                    } else if (this.dragOperation === 'delete') {
                        spot.reset();
                    }
                    this.update3DGrid();
                }
            }
        }
    }

    handleMouseDown(e) {
        if (this.isRunning) return;
        
        // Don't handle mouse in 3D mode
        if (this.is3DView) return;
        
        // Get canvas-relative mouse position
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Get grid position first (for all button clicks)
        const gridPos = this.getGridPosition(mouseX, mouseY);
        
        // If click is outside the grid, ignore
        if (gridPos.row < 0 || gridPos.col < 0) return;
        
        const spot = this.grid.getSpot(gridPos.row, gridPos.col);
        if (!spot) return;
        
        if (e.button === 0) { // Left click
            if (e.shiftKey) {
                // Shift+drag pans only when zoomed in past the default level
                if (this.zoomLevel > (this.defaultZoom || 0.88) + 0.01) {
                    this.isDragging = true;
                    this.dragStart = { x: mouseX, y: mouseY };
                    this.dragOperation = 'pan';
                    this.canvas.style.cursor = 'grabbing';
                }
                return; // always suppress wall-placement when shift held
            } else if (spot.is_start() || spot.is_end()) {
                // Don't do anything if clicking on existing start/end point
                return;
            } else if (this.grid.startSpots.length === 0) {
                // Place start point if none exists
                spot.make_start();
                this.grid.startSpots = [spot]; // Replace array with single spot
                spot.setPointLabel('S');
                this.updateStatus(`Start point placed at (${gridPos.row}, ${gridPos.col})`);
            } else if (this.grid.endSpots.length === 0) {
                // Place end point if none exists
                spot.make_end();
                this.grid.endSpots = [spot]; // Replace array with single spot
                spot.setPointLabel('E');
                this.updateStatus(`End point placed at (${gridPos.row}, ${gridPos.col})`);
            } else if (!spot.is_start() && !spot.is_end()) {
                // Place wall
                spot.make_barrier();
                this.dragStart = { x: mouseX, y: mouseY };
                this.isDragging = true;
                this.dragOperation = 'place';  // Track the operation
                this.updateStatus(`Wall placed at (${gridPos.row}, ${gridPos.col})`);
            }
            
            // Update grid visualization
            this.render();
        } else if (e.button === 2) { // Right click - delete any type of node
            // Remove node from appropriate collection
            if (spot.is_start()) {
                this.grid.startSpots = this.grid.startSpots.filter(s => 
                    s.row !== spot.row || s.col !== spot.col
                );
            } else if (spot.is_end()) {
                this.grid.endSpots = this.grid.endSpots.filter(s => 
                    s.row !== spot.row || s.col !== spot.col
                );
            }
            
            // Reset the spot
            spot.reset();
            this.updateStatus(`Node removed at (${gridPos.row}, ${gridPos.col})`);
            this.render();
            
            // Enable dragging for deletion
            this.isDragging = true;
            this.dragOperation = 'delete';  // Track delete operation
            
            // Prevent context menu
            e.preventDefault();
            return false;
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
    }      

    handleMouseMove(e) {
        // Get canvas-relative mouse position
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.mousePos = { x: mouseX, y: mouseY };
        
        // Don't handle mouse in 3D mode (use orbit controls instead)
        if (this.is3DView) return;
        
        // Update cursor based on action
        const { row, col } = this.getGridPosition(mouseX, mouseY);
        const spot = this.grid.getSpot(row, col);
        
        if (spot) {
            if (e.shiftKey) {
                // Only allow panning with shift when zoomed in
                if (this.zoomLevel > 1.0) {
                    this.canvas.style.cursor = this.isDragging ? 'grabbing' : 'grab';
                } else {
                    this.canvas.style.cursor = 'default';
                }
            } else if (spot.is_start() || spot.is_end()) {
                this.canvas.style.cursor = 'not-allowed';
            } else {
                this.canvas.style.cursor = 'pointer';
            }
        }
        
        if (this.isDragging) {
            if (this.is3DView) return;
            
            if (this.dragOperation === 'pan') {
                // Pan the view — works at any zoom level
                const deltaX = mouseX - this.dragStart.x;
                const deltaY = mouseY - this.dragStart.y;
                
                const cellSize = this.grid.cellSize || 20;
                const gridWidth  = this.grid.cols * cellSize;
                const gridHeight = this.grid.rows * cellSize;
                const maxPanX = (gridWidth  * this.zoomLevel - this.canvasCssWidth)  / (2 * this.zoomLevel) + (gridWidth  * 0.25);
                const maxPanY = (gridHeight * this.zoomLevel - this.canvasCssHeight) / (2 * this.zoomLevel) + (gridHeight * 0.25);
                
                this.panOffset.x = Math.min(maxPanX, Math.max(-maxPanX, this.panOffset.x + deltaX / this.zoomLevel));
                this.panOffset.y = Math.min(maxPanY, Math.max(-maxPanY, this.panOffset.y + deltaY / this.zoomLevel));
                
                this.dragStart = { x: mouseX, y: mouseY };
                this.render();
            } else {
                // Draw or delete walls by dragging
                const { row, col } = this.getGridPosition(mouseX, mouseY);
                const spot = this.grid.getSpot(row, col);
                
                if (spot && !spot.is_start() && !spot.is_end()) {
                    if (this.dragOperation === 'place') {
                        spot.make_barrier();
                    } else if (this.dragOperation === 'delete') {
                        spot.reset();
                    }
                    this.render();
                }
            }
        }
    }

    handleMouseWheel(e) {
        e.preventDefault();
        
        // Skip if in 3D mode (handled by OrbitControls)
        if (this.is3DView) return;
        
        // Calculate zoom direction based on wheel delta
        const delta = -Math.sign(e.deltaY);
        const zoomFactor = delta > 0 ? 1.1 : 0.9;
        
        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
    // Transform to grid space coordinates (use CSS pixel size)
    const gridX = (mouseX - this.panOffset.x * this.zoomLevel - this.canvasCssWidth/2) / this.zoomLevel;
    const gridY = (mouseY - this.panOffset.y * this.zoomLevel - this.canvasCssHeight/2) / this.zoomLevel;
        
        // Save old zoom level for comparison
        const oldZoom = this.zoomLevel;
        
        // Apply zoom
        this.zoomLevel *= zoomFactor;
        
        // Calculate dynamic zoom limits based on grid and window size
        const cellSize = this.grid.cellSize || 20;
        const gridWidth = this.grid.cols * cellSize;
        const gridHeight = this.grid.rows * cellSize;
        
        const minZoom = this.defaultZoom || 0.88; // Floor is always the default zoom level
        const maxZoom = 5.0;
        
        this.zoomLevel = Math.max(minZoom, Math.min(maxZoom, this.zoomLevel));
        
        // Snap back to default and reset pan when we reach the floor
        if (this.zoomLevel <= minZoom + 0.01) {
            this.zoomLevel = minZoom;
            this.panOffset = { x: 0, y: 0 };
        } else {
            // Only apply pan adjustment if zoom actually changed
            if (oldZoom !== this.zoomLevel) {
                // Adjust pan to keep mouse position fixed in grid space
                const newGridX = (mouseX - this.panOffset.x * this.zoomLevel - this.canvasCssWidth/2) / this.zoomLevel;
                const newGridY = (mouseY - this.panOffset.y * this.zoomLevel - this.canvasCssHeight/2) / this.zoomLevel;
                
                this.panOffset.x += (gridX - newGridX) * this.zoomLevel / oldZoom;
                this.panOffset.y += (gridY - newGridY) * this.zoomLevel / oldZoom;
                
                // Constrain pan offsets to ensure grid remains visible
                const maxPanX = (gridWidth * this.zoomLevel - this.canvasCssWidth) / (2 * this.zoomLevel);
                const maxPanY = (gridHeight * this.zoomLevel - this.canvasCssHeight) / (2 * this.zoomLevel);
                
                this.panOffset.x = Math.min(maxPanX, Math.max(-maxPanX, this.panOffset.x));
                this.panOffset.y = Math.min(maxPanY, Math.max(-maxPanY, this.panOffset.y));
            }
        }
        
        // Update status and render
        this.updateStatus(`Zoom: ${Math.round(this.zoomLevel * 100)}%`);
        this.render();
    }

    handleKeyDown(e) {
        if (this.isRunning && e.key !== 'Escape') return;
        
        switch (e.key.toLowerCase()) {
            case ' ': // Space
                e.preventDefault(); // Prevent scrolling
                this.runAlgorithm();
                break;
            case 'c': // Clear all
                this.grid.clearAll();
                this.updateStatus('Grid cleared. Click to place start point.');
                
                // Update grid in 3D if active
                if (this.is3DView) {
                    this.update3DGrid();
                } else {
                    this.render();
                }
                break;
            case 'p': // Clear path
                this.grid.clearPath();
                this.updateStatus('Path cleared');
                
                // Update grid in 3D if active
                if (this.is3DView) {
                    this.update3DGrid();
                } else {
                    this.render();
                }
                break;
            case 'm': // Remove multi-point toggle handler
                break;
            case 'v': // Toggle 2D/3D (changed from "https://esm.sh/d" to match HTML)
                if (this.viewToggle) {
                    this.viewToggle.checked = !this.viewToggle.checked;
                    this.viewToggleHandler({ target: this.viewToggle });
                }
                break;
            case 'escape': // Cancel algorithm
                if (this.isRunning) {
                    this.isCancelled = true;
                    this.updateStatus('Algorithm cancelled');
                }
                break;
            case 'a': // Run A* Algorithm
                if (!this.isRunning) {
                    this.selectedAlgorithm = 'astar';
                    if (this.algorithmSelect) {
                        this.algorithmSelect.value = 'astar';
                    }
                    this.updateAlgorithmInfo();
                    this.runAlgorithm();
                }
                break;
            case 'd': // Run Dijkstra's Algorithm
                if (!this.isRunning) {
                    this.selectedAlgorithm = 'dijkstra';
                    if (this.algorithmSelect) {
                        this.algorithmSelect.value = 'dijkstra';
                    }
                    this.updateAlgorithmInfo();
                    this.runAlgorithm();
                }
                break;
            case 'g': // Run Greedy Algorithm
                if (!this.isRunning) {
                    this.selectedAlgorithm = 'greedy';
                    if (this.algorithmSelect) {
                        this.algorithmSelect.value = 'greedy';
                    }
                    this.updateAlgorithmInfo();
                    this.runAlgorithm();
                }
                break;
            case 'r': // Reset view (set zoom to 1 and center)
                this.zoomLevel = 1;
                this.panOffset = { x: 0, y: 0 };
                this.updateStatus("View reset");
                this.render();
                break;
            case '`': // Toggle debug mode with backtick key
                this.toggleDebugMode();
                break;
        }
    }

    getGridPosition(x, y) {
        // Exit early if grid is not initialized
        if (!this.grid) return { row: -1, col: -1 };
        if (this.renderer2D && this.renderer2D.getGridPosition) {
            return this.renderer2D.getGridPosition(this.grid, x, y, this.zoomLevel, this.panOffset);
        }
        return { row: -1, col: -1 };
    }

    viewToggleHandler(e) {
        const newMode = e.target.checked;
        
        // Don't do anything if mode hasn't changed
        if (this.is3DView === newMode) return;
        
        // Ensure spot labels are synced with their states before switching views
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const spot = this.grid.getSpot(row, col);
                if (spot) {
                    if (spot.is_start()) {
                        spot.setPointLabel('S');
                    } else if (spot.is_end()) {
                        spot.setPointLabel('E');
                    } else {
                        spot.pointLabel = null;
                    }
                }
            }
        }
        
        // Clean up existing view
        if (this.is3DView) {
            // Cleanup 3D resources
            if (this.pathAnimationId) {
                cancelAnimationFrame(this.pathAnimationId);
                this.pathAnimationId = null;
            }
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            if (this.controls) {
                this.controls.dispose();
            }
            if (this.renderer) {
                this.renderer.dispose();
            }
            // Clear all 3D objects
            if (this.scene) {
                while(this.scene.children.length > 0) { 
                    const object = this.scene.children[0];
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(m => m.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                    this.scene.remove(object);
                }
            }
        }
        
        this.is3DView = newMode;
        
        if (this.is3DView) {
            this.adaptDisplayToGridSize();
            // Hide 2D canvas
            this.canvas.style.display = 'none';
            
            // Initialize 3D view with proper label state
            this.initialize3DView();
            // Pull camera back a bit for a top view with margin
            if (this.camera && this.renderer) {
                this.setTopDownCameraWithMargin(0.15);
                this.renderer.render(this.scene, this.camera);
            }
            this.showViewToast('SWITCHED TO 3D VIEW');
        } else {
            // Show 2D canvas
            this.canvas.style.display = 'block';
            
            // Hide 3D container
            const container = document.getElementById('container3D');
            if (container) {
                container.style.display = 'none';
            }
            
            this.showViewToast('SWITCHED TO 2D VIEW');
            this.render();
        }
    }

    showViewToast(message) {
        // Remove any existing toast
        const existing = document.getElementById('viewToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'viewToast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            background: rgba(5, 5, 8, 0.92);
            color: var(--accent-primary, #00f3ff);
            border: 1px solid var(--accent-primary, #00f3ff);
            padding: 18px 40px;
            font-family: 'VT323', monospace;
            font-size: 28px;
            letter-spacing: 4px;
            text-transform: uppercase;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.2s ease, transform 0.2s ease;
            pointer-events: none;
            box-shadow: 0 0 30px rgba(0, 243, 255, 0.3), inset 0 0 20px rgba(0, 243, 255, 0.05);
        `;
        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        // Animate out and remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => toast.remove(), 250);
        }, 1400);
    }

    initUIElements() {
        // Algorithm selection
        this.algorithmSelect = document.getElementById('algorithm');
        this.algorithmInfo = document.getElementById('algorithmInfo');
        this.speedSelect = document.getElementById('speedSelect');
        
        // Buttons
        this.startButton = document.getElementById('startBtn');
        this.clearButton = document.getElementById('clearBtn');
        this.clearPathButton = document.getElementById('clearPathBtn');
        
        // Toggles
        this.multiPointToggle = document.getElementById('multiPointToggle');
        this.viewToggle = document.getElementById('viewToggle');
        
        // Grid size selector
        this.gridSizeSelect = document.getElementById('gridSizeSelect');
        
        // Panel and status
        this.controlsPanel = document.getElementById('controlsPanel');
        this.togglePanelButton = document.getElementById('togglePanel');
        this.statusInfo = document.getElementById('statusInfo');
        
        // Tutorial
        this.tutorialCloseButton = document.getElementById('tutorialCloseBtn');
        
        // Set initial UI state
        this.algorithmSelect.value = this.selectedAlgorithm;
        this.updateAlgorithmInfo();
        this.viewToggle.checked = this.is3DView;
    }
    
    updateAlgorithmInfo() {
        this.algorithmInfo.textContent = ALGORITHM_INFO[this.selectedAlgorithm];
    }

    updateNotchLine() {
        const notch = document.getElementById('notchLine');
        const panel = this.controlsPanel;
        if (!notch || !panel) return;

        // Hide notch when panel is collapsed
        if (panel.classList.contains('collapsed')) {
            notch.style.display = 'none';
            return;
        }

        // Get panel's bounding rect and position the notch at
        // the bottom-right clip-path corner
        const rect = panel.getBoundingClientRect();
        // The clip cuts at 15px from bottom-right
        // Position the notch line's right-center transform-origin at that corner
        notch.style.display = 'block';
        notch.style.top  = (rect.bottom - 10) + 'px';   // just above the bottom clip point
        notch.style.left = (rect.right  - 11) + 'px';   // centered on the diagonal
    }
    
    setupEventListeners() {
        // Canvas events
        if (this.canvas) {
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.addEventListener('wheel', this.handleMouseWheel.bind(this));
            
            // Prevent context menu on right click
            this.canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        }

        // 3D-specific event handling for right-click
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.addEventListener('mousedown', (event) => {
                if (event.button === 2) { // Right mouse button
                    this.handle3DMouseDown(event); // Pass to our handler
                    event.preventDefault();
                    return false;
                }
            });
            
            // Ensure context menu is prevented
            this.renderer.domElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
        }
        
        // Algorithm selection
        if (this.algorithmSelect) {
            this.algorithmSelect.addEventListener('change', (e) => {
                this.selectedAlgorithm = e.target.value;
                this.updateAlgorithmInfo();
                this.updateStatus(`Algorithm changed to ${ALGORITHM_INFO[this.selectedAlgorithm]}`);
            });
        }
        
        // Animation speed
        if (this.speedSelect) {
            this.speedSelect.addEventListener('change', (e) => {
                this.animationDelay = parseInt(e.target.value);
                this.updateStatus(`Animation speed set to ${this.speedSelect.options[this.speedSelect.selectedIndex].text}`);
            });
        }
        
        // Action buttons - Make sure they update both 2D and 3D views
        if (this.startButton) {
            this.startButton.addEventListener('click', () => {
                this.runAlgorithm();
            });
        }
        
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                // Clear start/end spots arrays explicitly
                this.grid.startSpots = [];
                this.grid.endSpots = [];
                
                // Remove point labels from all spots
                for (let row = 0; row < this.grid.rows; row++) {
                    for (let col = 0; col < this.grid.cols; col++) {
                        const spot = this.grid.getSpot(row, col);
                        if (spot) {
                            spot.pointLabel = null;
                        }
                    }
                }
                
                this.grid.clearAll();
                this.updateStatus('Grid cleared. Click to place start point.');

                // Update the appropriate view
                if (this.is3DView) {
                    const cameraState = {
                        position: this.camera.position.clone(),
                        target: this.controls.target.clone()
                    };
                    
                    // Full rebuild of 3D grid with clean labels
                    this.create3DGrid();
                    
                    // Restore camera state
                    this.camera.position.copy(cameraState.position);
                    this.controls.target.copy(cameraState.target);
                    this.camera.updateProjectionMatrix();
                    this.controls.update();
                    this.renderer.render(this.scene, this.camera);
                } else {
                    this.render();
                }
            });
        }
        
        if (this.clearPathButton) {
            this.clearPathButton.addEventListener('click', () => {
                this.grid.clearPath();
                if (this.grid.unifiedPath && this.grid.unifiedPath.length > 0) {
                    this.grid.clearUnifiedPath();
                }
                
                // Stop any existing path animation
                if (this.pathAnimationId) {
                    cancelAnimationFrame(this.pathAnimationId);
                    this.pathAnimationId = null;
                }
                
                // Reset animation properties
                this.pathAnimationTime = 0;
                this.pathCubes = [];
                
                this.updateStatus('Path cleared');
                
                // Update the appropriate view
                if (this.is3DView) {
                    this.update3DGrid();
                } else {
                    this.render();
                }
            });
        }
        
        // Toggles
        if (this.viewToggle) {
            this.viewToggle.addEventListener('change', this.viewToggleHandler.bind(this)); 
        }
        
        // Add grid size slider event listener
        const gridSizeSlider = document.getElementById('gridSizeSlider');
        const gridSizeValue = document.getElementById('gridSizeValue');

        if (gridSizeSlider) {
            gridSizeSlider.addEventListener('input', (e) => {
                const cols = parseInt(e.target.value, 10);
                const padding = 5;
                const availableWidth = window.innerWidth - (padding * 1.5);
                const availableHeight = window.innerHeight - (padding * 1.5);
                const cellSize = Math.max(1, Math.floor(availableWidth / cols));
                const predictedRows = Math.max(1, Math.floor(availableHeight / cellSize));
                gridSizeValue.textContent = `${cols}×${predictedRows}`;
                
                // Debounce the grid recreation to avoid performance issues while sliding
                if (this.gridResizeTimeout) {
                    clearTimeout(this.gridResizeTimeout);
                }
                this.gridResizeTimeout = setTimeout(() => {
                    this.initializeGrid();
                    if (this.is3DView) {
                        this.create3DGrid();
                    } else {
                        this.render();
                    }
                }, 100);
            });
        }
        
        // Panel toggle
        if (this.togglePanelButton && this.controlsPanel) {
            this.togglePanelButton.addEventListener('click', () => {
                this.controlsPanel.classList.toggle('collapsed');
                if (this.controlsPanel.classList.contains('collapsed')) {
                    this.togglePanelButton.textContent = '⟩';
                } else {
                    this.togglePanelButton.textContent = '☰';
                }
                this.updateNotchLine();
            });
        }

        // Position the notch-line element
        this.updateNotchLine();
        window.addEventListener('resize', () => this.updateNotchLine());
        
        // Tutorial close
        if (this.tutorialCloseButton) {
            this.tutorialCloseButton.addEventListener('click', () => {
                const tutorial = document.getElementById('tutorial');
                if (tutorial) {
                    tutorial.classList.remove('show');
                }
            });
        }
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            
            // Update 3D renderer if active
            if (this.is3DView && this.renderer) {
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                if (this.camera) {
                    this.camera.aspect = window.innerWidth / window.innerHeight;
                    this.camera.updateProjectionMatrix();
                    // Re-fit top-down camera with margin after aspect change
                    this.setTopDownCameraWithMargin(0.15);
                    this.renderer.render(this.scene, this.camera);
                }
            }
        });
    }

    updateStatus(message) {
        this.statusInfo.textContent = message;
        
        // Auto-hide status after a few seconds
        clearTimeout(this.statusTimeout);
        this.statusInfo.style.opacity = 1;
        
        this.statusTimeout = setTimeout(() => {
            this.statusInfo.style.opacity = 0.7;
        }, 3000);
    }
    
    async draw() {
        // Check if we need to skip drawing based on runtime context
        if (this.isCancelled) {
            return Promise.reject(new Error('Algorithm cancelled'));
        }
    
        // Force update based on current view mode
        if (this.is3DView) {
            // Update the 3D grid
            this.update3DGrid();
            
            // Force a render of the 3D scene
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } else {
            // 2D rendering
            this.render();
        }
        
        // Add delay if animation speed is set
        if (this.animationDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.animationDelay));
        }
        
        // Return a promise that resolves on the next animation frame for smooth animation
        return new Promise(resolve => requestAnimationFrame(resolve));
    }       

    async runAlgorithm() {
        if (this.isRunning) return;
        
        console.log("runAlgorithm called");
        
        // Check for valid start and end points
        if (this.grid.startSpots.length === 0) {
            this.updateStatus('Please place a start point');
            return;
        }
        
        if (this.grid.endSpots.length === 0) {
            this.updateStatus('Please place an end point');
            return;
        }
        
        this.isRunning = true;
        this.isCancelled = false;
        
        // Update UI to show algorithm is running
        if (this.startButton) this.startButton.disabled = true;
        if (this.clearButton) this.clearButton.disabled = true;
        if (this.clearPathButton) this.clearPathButton.disabled = true;
        
        this.updateStatus(`Running ${this.selectedAlgorithm} algorithm...`);
        
        // Clear previous paths
        this.grid.clearPath();
        
        // Update all neighbors (crucial step that might be missing)
        this.grid.updateAllNeighbors();
        
        console.log("Grid prepared, neighbors updated");
        
        // Choose algorithm
        let algorithm;
        switch (this.selectedAlgorithm) {
            case 'astar':
                algorithm = aStarAlgorithm;
                break;
            case 'dijkstra':
                algorithm = dijkstraAlgorithm;
                break;
            case 'greedy':
                algorithm = greedyAlgorithm;
                break;
            default:
                algorithm = aStarAlgorithm;
        }
        
        console.log(`Selected algorithm: ${this.selectedAlgorithm}`);
        
    let pathsFound = 0;
    let pathsNotFound = 0;
        
        // Performance timer
        const startTime = performance.now();
        
        try {
            console.log("Starting algorithm execution");
            
            const start = this.grid.startSpots[0];
            const end = this.grid.endSpots[0];
            
            // Run algorithm between single start and end point
            const path = await algorithm(
                this.grid,
                start,
                end,
                this.animationDelay,
                this.draw.bind(this)
            );
            if (path) {
                console.log(`Path found with length: ${path.length}`);
                this.markPath(path);
                this.grid.paths = [path];
                pathsFound = 1;
            } else {
                console.log("No path found");
                pathsNotFound = 1;
            }
            
        } catch (error) {
            console.error('Algorithm error:', error);
        } finally {
            // Calculate run time
            const endTime = performance.now();
            const runTime = ((endTime - startTime) / 1000).toFixed(2);
            
            this.isRunning = false;
            
            if (this.startButton) this.startButton.disabled = false;
            if (this.clearButton) this.clearButton.disabled = false;
            if (this.clearPathButton) this.clearPathButton.disabled = false;
            
            // Force final render
            if (this.is3DView) {
                this.update3DGrid();
                
                // Initialize path animation for 3D view
                if (pathsFound > 0) {
                    this.initPathAnimation();
                }
            } else {
                this.render();
            }
            
            // Update status
            if (this.isCancelled) {
                this.updateStatus('Algorithm cancelled');
            } else if (pathsFound > 0 && pathsNotFound === 0) {
                this.updateStatus(`Found all paths! (${pathsFound} total) in ${runTime}s`);
            } else if (pathsFound > 0 && pathsNotFound > 0) {
                this.updateStatus(`Found ${pathsFound} paths, ${pathsNotFound} paths not found (${runTime}s)`);
            } else if (pathsNotFound > 0) {
                this.updateStatus(`No paths found (${runTime}s)`);
            }
            
            console.log("Algorithm execution completed");
        }
    }

    async markPath(path) {
        if (!path || !Array.isArray(path)) return;
        
        // First mark all paths without visual update to determine shared paths
        for (let i = 0; i < path.length; i++) {
            const spot = path[i];
            if (!spot) continue;
            
            // Skip start and end points
            if (spot.is_start() || spot.is_end()) continue;
            
            // Check if this spot is already part of another path
            const pathCount = this.grid.getPathCount(spot.row, spot.col);
            
            if (pathCount > 0) {
                spot.make_shared_path();
            } else {
                spot.make_path();
            }
        }
        
        // Add path to grid's paths
        this.grid.paths.push(path);
        
        // Update visualization immediately
        if (this.is3DView) {
            this.update3DGrid();
        } else {
            this.render();
        }
    }

    render() {
        if (!this.ctx || !this.grid || !this.grid.spots) {
            console.error("Cannot render - context or grid not initialized");
            return;
        }
        
        // Skip rendering if in 3D mode
        if (this.is3DView) {
            return;
        }
        
        // Delegate to 2D renderer if available
        if (this.renderer2D && this.renderer2D.renderGrid) {
            this.renderer2D.renderGrid(this.grid, {
                zoomLevel: this.zoomLevel,
                panOffset: this.panOffset,
                background: this.background2D
            });
            return;
        }
        
        // Get cell size from grid
        const cellSize = this.grid.cellSize || 20;
        
        // Calculate actual grid dimensions
        const gridWidth = this.grid.cols * cellSize;
        const gridHeight = this.grid.rows * cellSize;
        
    // Calculate centering offset - properly center the grid on screen (CSS pixels)
    const offsetX = Math.floor((this.canvasCssWidth - gridWidth * this.zoomLevel) / 2) + this.panOffset.x * this.zoomLevel;
    const offsetY = Math.floor((this.canvasCssHeight - gridHeight * this.zoomLevel) / 2) + this.panOffset.y * this.zoomLevel;
        
        // Save current transform
        this.ctx.save();
        
        // Apply transformations - position at center of screen with zoom
        this.ctx.translate(offsetX, offsetY);
        this.ctx.scale(this.zoomLevel, this.zoomLevel);
        
        // Draw cells
        for (let i = 0; i < this.grid.cols; i++) {
            for (let j = 0; j < this.grid.rows; j++) {
                const spot = this.grid.getSpot(j, i);
                if (!spot) continue;
                
                const x = i * cellSize;
                const y = j * cellSize;
                
                // Draw cell with proper color
                this.ctx.fillStyle = spot.color || COLORS.WHITE;
                this.ctx.fillRect(x, y, cellSize, cellSize);
                
                // Draw grid lines (lighter for better visibility)
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.strokeRect(x, y, cellSize, cellSize);
                
                // Draw labels for start/end points
                if ((spot.is_start() || spot.is_end()) && spot.pointLabel) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.font = `bold ${Math.max(10, cellSize/2)}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(spot.pointLabel, x + cellSize/2, y + cellSize/2);
                }
            }
        }
        
        // Draw outer grid border
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.grid.cols * cellSize, this.grid.rows * cellSize);
        
        // Restore transformation
        this.ctx.restore();
    }

    toggleDebugMode() {
        this.isDebugMode = !this.isDebugMode;
        if (this.isDebugMode) {
            this.initDebugOverlay();
        } else if (this.debugOverlay) {
            this.debugOverlay.remove();
            this.debugOverlay = null;
        }
    }

    initDebugOverlay() {
        if (this.debugOverlay) return;
        
        this.debugOverlay = document.createElement('div');
        this.debugOverlay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(this.debugOverlay);
    }

    updateDebugInfo() {
        if (!this.isDebugMode || !this.debugOverlay || !this.camera) return;
        
        const pos = this.camera.position;
        const rot = this.camera.rotation;
        const target = this.controls ? this.controls.target : {x: 0, y: 0, z: 0};
        
        this.debugOverlay.innerHTML = `
            Camera Position:
            X: ${pos.x.toFixed(2)}
            Y: ${pos.y.toFixed(2)}
            Z: ${pos.z.toFixed(2)}
            
            Camera Rotation:
            X: ${rot.x.toFixed(2)}
            Y: ${rot.y.toFixed(2)}
            Z: ${rot.z.toFixed(2)}
            
            Look Target:
            X: ${target.x.toFixed(2)}
            Y: ${target.y.toFixed(2)}
            Z: ${target.z.toFixed(2)}
        `.replace(/\n/g, '<br>');
    }
}


// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.pathVisualizer = new PathfindingVisualizer();
});
