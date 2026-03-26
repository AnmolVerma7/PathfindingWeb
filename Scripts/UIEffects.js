class UIEffects {
    constructor() {
        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.initialize();
        });
    }

    initialize() {
        // Get DOM elements
        this.tutorial = document.getElementById('tutorial');
        this.controlsPanel = document.getElementById('controlsPanel');
        this.togglePanelBtn = document.getElementById('togglePanel');
        this.tutorialCloseBtn = document.getElementById('tutorialCloseBtn');
        
        // Check if elements exist before proceeding
        if (!this.controlsPanel || !this.togglePanelBtn) {
            console.error('Required UI elements not found');
            return;
        }
        
        // Completely hide the controls panel initially
        this.controlsPanel.style.display = 'none';
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Show tutorial by default if it exists
        if (this.tutorial) {
            this.tutorial.style.display = 'block';
            this.tutorial.classList.add('show');
        }
        
        console.log('UIEffects initialized successfully');
    }

    setupEventListeners() {
        // Tutorial close button
        if (this.tutorialCloseBtn) {
            this.tutorialCloseBtn.addEventListener('click', () => this.handleTutorialClose());
        }

        // Panel toggle button
        if (this.togglePanelBtn) {
            this.togglePanelBtn.addEventListener('click', (event) => {
                this.handlePanelToggle(event);
            });
        }
    }

    handleTutorialClose() {
        if (!this.tutorial) return;
        
        // Hide the tutorial
        this.tutorial.classList.remove('show');
        this.tutorial.style.display = 'none';
        
        // Show the controls panel expanded after tutorial closes
        this.controlsPanel.style.display = 'block';
        this.controlsPanel.classList.remove('collapsed');
        this.togglePanelBtn.textContent = '☰';
    }

    handlePanelToggle(event) {
        if (!this.controlsPanel) return;
        
        const isCollapsed = this.controlsPanel.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand panel
            this.controlsPanel.classList.remove('collapsed');
            this.togglePanelBtn.textContent = '☰';
        } else {
            // Collapse panel
            this.controlsPanel.classList.add('collapsed');
            this.togglePanelBtn.textContent = '⟩';
        }
        
        // Prevent event from propagating
        event.preventDefault();
        event.stopPropagation();
    }
}