// Main Application - PowerPoint Generator
class PowerPointGeneratorApp {
    constructor() {
        this.components = {};
        this.isInitialized = false;
        this.errorHandler = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showCriticalError('Application failed to initialize. Please refresh the page.');
        }
    }

    /**
     * Initialize the application after DOM is ready
     */
    async initializeApp() {
        try {
            // Set up global error handling
            this.setupErrorHandling();
            
            // Initialize components
            this.initializeComponents();

            // Manually initialize each component
            Object.values(this.components).forEach(component => {
                if (component && typeof component.init === 'function') {
                    component.init();
                }
            });
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            // Load saved state
            await this.loadSavedState();
            
            // Set up keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Initialize time savings dashboard
            this.initializeTimeSavingsDashboard();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Show welcome message if first time
            this.showWelcomeIfFirstTime();
            
            console.log('PowerPoint Generator App initialized successfully');
            
        } catch (error) {
            console.error('Error during app initialization:', error);
            this.showCriticalError('Failed to initialize application components.');
        }
    }

    /**
     * Initialize all components
     */
    initializeComponents() {
        // Components are already initialized as singletons
        // Just store references for easy access, with fallback handling
        this.components = {};
        
        try {
            this.components.notesInput = window.notesInput || (typeof notesInput !== 'undefined' ? notesInput : null);
            this.components.aiProcessing = window.aiProcessing || (typeof aiProcessing !== 'undefined' ? aiProcessing : null);
            this.components.outlinePreview = window.outlinePreview || (typeof outlinePreview !== 'undefined' ? outlinePreview : null);
            this.components.powerPointGeneration = window.powerPointGeneration || (typeof powerPointGeneration !== 'undefined' ? powerPointGeneration : null);
            this.components.tabManager = window.tabManager || (typeof tabManager !== 'undefined' ? tabManager : null);
            this.components.fileUploadManager = window.fileUploadManager || (typeof fileUploadManager !== 'undefined' ? fileUploadManager : null);
            this.components.audienceManager = window.audienceManager || (typeof audienceManager !== 'undefined' ? audienceManager : null);
            this.components.configurationManager = window.configurationManager || (typeof configurationManager !== 'undefined' ? configurationManager : null);
            this.components.meetingProcessor = window.meetingProcessor || (typeof meetingProcessor !== 'undefined' ? meetingProcessor : null);
            
            // Initialize services
            this.components.aiService = window.aiService || (typeof aiService !== 'undefined' ? aiService : null);
            this.components.fileService = window.fileService || (typeof fileService !== 'undefined' ? fileService : null);
            this.components.pythonService = window.pythonService || (typeof pythonService !== 'undefined' ? pythonService : null);
            this.components.timeSavingsService = window.timeSavingsService || (typeof timeSavingsService !== 'undefined' ? timeSavingsService : null);
            
            // Initialize utilities
            this.components.formatters = window.Formatters || (typeof Formatters !== 'undefined' ? Formatters : null);
            this.components.validators = window.Validators || (typeof Validators !== 'undefined' ? Validators : null);
        } catch (error) {
            console.error('Error initializing components:', error);
        }

        // Log which components were successfully initialized
        Object.keys(this.components).forEach(key => {
            if (this.components[key]) {
                console.log(`✓ ${key} component initialized`);
            } else {
                console.warn(`✗ ${key} component not found`);
            }
        });

        // Make components and services globally available
        window.app = this;
        window.components = this.components;
        
        // Ensure services are globally available
        if (this.components.aiService) {
            window.aiService = this.components.aiService;
            console.log('✓ aiService made globally available');
        }
        
        if (this.components.fileService) {
            window.fileService = this.components.fileService;
            console.log('✓ fileService made globally available');
        }
        
        if (this.components.pythonService) {
            window.pythonService = this.components.pythonService;
            console.log('✓ pythonService made globally available');
        }
        
        // Ensure utilities are globally available
        if (this.components.formatters) {
            window.Formatters = this.components.formatters;
            console.log('✓ Formatters made globally available');
        }
        
        if (this.components.validators) {
            window.Validators = this.components.validators;
            console.log('✓ Validators made globally available');
        }
        
        // Force update button states after a short delay
        setTimeout(() => {
            this.updateAllButtonStates();
        }, 500);
    }

    /**
     * Initialize time savings dashboard
     */
    initializeTimeSavingsDashboard() {
        if (this.components.timeSavingsService) {
            // Initialize dashboard widget in header
            const widget = document.getElementById('time-savings-widget');
            if (widget) {
                this.setupTimeSavingsWidget(widget);
            }
            console.log('✓ Time savings dashboard initialized');
        }
    }

    /**
     * Set up time savings widget in header
     * @param {Element} widget - Widget container
     */
    setupTimeSavingsWidget(widget) {
        const timeSavings = this.components.timeSavingsService;
        const stats = timeSavings.getStatistics();
        
        // Update the time display
        const timeDisplay = widget.querySelector('#total-time-saved');
        if (timeDisplay) {
            timeDisplay.textContent = stats.total.formatted;
            timeDisplay.title = `Total time saved: ${stats.total.formatted} | Click for detailed dashboard`;
        }
        
        // Set up click handler to show full dashboard
        widget.addEventListener('click', () => {
            this.showTimeSavingsDashboard();
        });
        
        // Update widget every time an action is performed
        this.updateTimeSavingsWidget = () => {
            const newStats = timeSavings.getStatistics();
            if (timeDisplay) {
                timeDisplay.textContent = newStats.total.formatted;
            }
        };
    }

    /**
     * Show detailed time savings dashboard
     */
    showTimeSavingsDashboard() {
        const modal = document.createElement('div');
        modal.className = 'time-dashboard-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>⏱️ Time Saved Dashboard</h3>
                        <button class="modal-close" title="Close">×</button>
                    </div>
                    <div class="modal-body">
                        <div id="time-savings-dashboard"></div>
                    </div>
                    <div class="modal-footer">
                        <button id="export-time-data" class="secondary-button">Export Data</button>
                        <button id="reset-time-data" class="secondary-button">Reset Data</button>
                        <button class="primary-button modal-close">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize dashboard in modal
        const dashboardContainer = modal.querySelector('#time-savings-dashboard');
        if (dashboardContainer && this.components.timeSavingsService) {
            this.components.timeSavingsService.renderDashboard(dashboardContainer);
        }
        
        // Set up event handlers
        const closeButtons = modal.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });
        
        const exportBtn = modal.querySelector('#export-time-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = this.components.timeSavingsService.exportData();
                const dataStr = JSON.stringify(data, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `powerpoint-generator-time-savings-${new Date().toISOString().slice(0, 10)}.json`;
                link.click();
                
                URL.revokeObjectURL(url);
                this.showNotification('Time savings data exported', 'success');
            });
        }
        
        const resetBtn = modal.querySelector('#reset-time-data');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.components.timeSavingsService.resetData();
                this.updateTimeSavingsWidget();
                document.body.removeChild(modal);
            });
        }
    }

    /**
     * Update all button states
     */
    updateAllButtonStates() {
        // This method would update button states based on current app state
        console.log('Updating button states...');
    }

    /**
     * Set up global error handling
     */
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error, 'Unexpected error occurred');
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason, 'An unexpected error occurred during processing');
            event.preventDefault();
        });

        // Network error detection
        window.addEventListener('offline', () => {
            this.showNetworkStatus(false);
        });

        window.addEventListener('online', () => {
            this.showNetworkStatus(true);
        });
    }

    /**
     * Set up global event listeners
     */
    setupGlobalEventListeners() {
        // Listen for component communication
        document.addEventListener('outlineGenerated', (e) => {
            this.handleOutlineGenerated(e.detail.outline);
        });

        document.addEventListener('powerpointCreated', (e) => {
            this.handlePowerPointCreated(e.detail);
        });

        // Listen for visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handleAppVisible();
            } else {
                this.handleAppHidden();
            }
        });

        // Listen for beforeunload to save state
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });

        // Listen for resize events
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Set up Electron menu action listeners
        this.setupElectronMenuListeners();
    }

    /**
     * Set up Electron menu action listeners
     */
    setupElectronMenuListeners() {
        if (window.electronAPI) {
            window.electronAPI.onMenuAction((action, ...args) => {
                this.handleMenuAction(action, ...args);
            });
        }
    }

    /**
     * Handle menu actions from Electron
     * @param {string} action - Menu action
     * @param {...any} args - Action arguments
     */
    handleMenuAction(action, ...args) {
        console.log('Menu action:', action, args);
        
        switch (action) {
            case 'new-presentation':
                this.resetApp();
                this.components.tabManager?.switchTab('create-new');
                break;
                
            case 'open-file':
                if (args[0]) {
                    this.components.tabManager?.switchTab('update');
                    // Handle file opening logic here
                    this.showNotification(`File selected: ${args[0]}`, 'info');
                }
                break;
                
            case 'save-config':
                this.saveCurrentState();
                if (this.components.configurationManager) {
                    this.components.configurationManager.saveConfiguration();
                }
                break;
                
            case 'export-settings':
                if (args[0]) {
                    this.exportSettings(args[0]);
                }
                break;
                
            case 'import-settings':
                if (args[0]) {
                    this.importSettings(args[0]);
                }
                break;
                
            case 'clear-all-data':
                this.resetApp();
                break;
                
            case 'switch-tab':
                if (args[0] && this.components.tabManager) {
                    this.components.tabManager.switchTab(args[0]);
                }
                break;
                
            case 'generate-outline':
                const generateBtn = document.getElementById('generate-outline-btn');
                if (generateBtn && !generateBtn.disabled) {
                    generateBtn.click();
                }
                break;
                
            case 'test-connection':
                if (this.components.configurationManager) {
                    this.components.configurationManager.testConnection();
                }
                break;
                
            case 'reset-app':
                this.resetApp();
                break;
                
            case 'show-help':
                this.showHelp();
                break;
                
            default:
                console.warn('Unknown menu action:', action);
        }
    }

    /**
     * Export application settings
     * @param {string} filePath - Export file path
     */
    async exportSettings(filePath) {
        try {
            const settings = {
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                configuration: this.components.configurationManager?.exportConfiguration(),
                audience: this.components.audienceManager?.exportSettings(),
                appState: {
                    currentTab: this.components.tabManager?.getCurrentTab()
                }
            };
            
            const settingsJson = JSON.stringify(settings, null, 2);
            
            if (window.electronAPI) {
                const result = await window.electronAPI.saveFile(settingsJson, filePath);
                if (result.success) {
                    this.showNotification('Settings exported successfully', 'success');
                } else {
                    this.showNotification('Failed to export settings', 'error');
                }
            }
        } catch (error) {
            console.error('Export settings error:', error);
            this.showNotification('Failed to export settings', 'error');
        }
    }

    /**
     * Import application settings
     * @param {string} filePath - Import file path
     */
    async importSettings(filePath) {
        try {
            // In a real implementation, you would read the file
            // For now, show a placeholder message
            this.showNotification('Settings import functionality would be implemented here', 'info');
        } catch (error) {
            console.error('Import settings error:', error);
            this.showNotification('Failed to import settings', 'error');
        }
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter: Generate outline
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const generateBtn = document.getElementById('generate-outline-btn');
                if (generateBtn && !generateBtn.disabled) {
                    generateBtn.click();
                }
            }

            // Ctrl/Cmd + S: Save (prevent default and show message)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveCurrentState();
                this.showNotification('State saved automatically', 'success');
            }

            // Ctrl/Cmd + R: Regenerate outline
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                const regenerateBtn = document.getElementById('regenerate-outline-btn');
                if (regenerateBtn && !regenerateBtn.disabled) {
                    e.preventDefault();
                    regenerateBtn.click();
                }
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }

            // F1: Show help
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelp();
            }
        });
    }

    /**
     * Load saved application state
     */
    async loadSavedState() {
        try {
            // Components handle their own state loading
            // This is for any app-level state
            const appState = localStorage.getItem('powerpoint_generator_app_state');
            if (appState) {
                const state = JSON.parse(appState);
                // Apply any app-level state here
                console.log('Loaded app state:', state);
            }
        } catch (error) {
            console.warn('Failed to load saved state:', error);
        }
    }

    /**
     * Save current application state
     */
    saveCurrentState() {
        try {
            const appState = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                // Add any app-level state here
            };
            
            localStorage.setItem('powerpoint_generator_app_state', JSON.stringify(appState));
            
            // Trigger component saves
            if (this.components.notesInput) {
                this.components.notesInput.saveNotes();
            }
            
        } catch (error) {
            console.warn('Failed to save app state:', error);
        }
    }

    /**
     * Handle outline generation completion
     * @param {Object} outline - Generated outline
     */
    handleOutlineGenerated(outline) {
        console.log('Outline generated:', outline);
        
        // Update components
        if (this.components.outlinePreview) {
            this.components.outlinePreview.displayOutline(outline);
        }
        
        if (this.components.powerPointGeneration) {
            this.components.powerPointGeneration.setOutline(outline);
        }
        
        // Show success notification
        this.showNotification(
            `Generated outline with ${outline.slides.length} slides`, 
            'success'
        );
    }

    /**
     * Handle PowerPoint creation completion
     * @param {Object} details - Creation details
     */
    handlePowerPointCreated(details) {
        console.log('PowerPoint created:', details);
        
        // Show success notification
        this.showNotification(
            `PowerPoint created successfully! File size: ${details.fileSize}`, 
            'success'
        );
    }

    /**
     * Handle app becoming visible
     */
    handleAppVisible() {
        // Check for any updates or refresh data if needed
        console.log('App became visible');
    }

    /**
     * Handle app becoming hidden
     */
    handleAppHidden() {
        // Save state when app is hidden
        this.saveCurrentState();
        console.log('App became hidden');
    }

    /**
     * Handle before unload event
     * @param {BeforeUnloadEvent} e - Before unload event
     */
    handleBeforeUnload(e) {
        // Save current state
        this.saveCurrentState();
        
        // Check if there's unsaved work
        const hasUnsavedWork = this.hasUnsavedWork();
        
        if (hasUnsavedWork) {
            const message = 'You have unsaved work. Are you sure you want to leave?';
            e.returnValue = message;
            return message;
        }
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Debounce resize handling
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.updateLayoutForScreenSize();
        }, 250);
    }

    /**
     * Update layout based on screen size
     */
    updateLayoutForScreenSize() {
        const width = window.innerWidth;
        const appContainer = document.querySelector('.app-container');
        
        if (appContainer) {
            if (width < 768) {
                appContainer.classList.add('mobile-layout');
            } else {
                appContainer.classList.remove('mobile-layout');
            }
        }
    }

    /**
     * Check if there's unsaved work
     * @returns {boolean} - Whether there's unsaved work
     */
    hasUnsavedWork() {
        // Check if there are notes that haven't been processed
        const notes = this.components.notesInput?.getNotes() || '';
        const hasOutline = this.components.outlinePreview?.getCurrentOutline();
        
        return notes.length > 100 && !hasOutline;
    }

    /**
     * Handle errors gracefully
     * @param {Error} error - Error object
     * @param {string} userMessage - User-friendly message
     */
    handleError(error, userMessage = null) {
        console.error('App error:', error);
        
        const message = userMessage || error.message || 'An unexpected error occurred';
        this.showNotification(message, 'error');
        
        // Log error for debugging
        this.logError(error);
    }

    /**
     * Log error for debugging
     * @param {Error} error - Error to log
     */
    logError(error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('Error log:', errorLog);
        
        // In a real app, you might send this to an error tracking service
    }

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" title="Close">×</button>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Set up close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
    }

    /**
     * Remove notification
     * @param {HTMLElement} notification - Notification element
     */
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    /**
     * Show critical error
     * @param {string} message - Error message
     */
    showCriticalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'critical-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h2>Application Error</h2>
                <p>${message}</p>
                <button onclick="window.location.reload()">Reload Page</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }

    /**
     * Show network status
     * @param {boolean} isOnline - Whether online
     */
    showNetworkStatus(isOnline) {
        const message = isOnline ? 'Connection restored' : 'No internet connection';
        const type = isOnline ? 'success' : 'warning';
        
        this.showNotification(message, type, isOnline ? 2000 : 0);
    }

    /**
     * Close all open modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay, .slide-editor-modal, .script-preview-modal');
        modals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
    }

    /**
     * Show help information
     */
    showHelp() {
        const helpModal = document.createElement('div');
        helpModal.className = 'help-modal';
        helpModal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>PowerPoint Generator Help</h3>
                        <button class="modal-close" title="Close">×</button>
                    </div>
                    <div class="modal-body">
                        <h4>How to Use:</h4>
                        <ol>
                            <li>Enter your presentation notes in the text area</li>
                            <li>Use # for slide titles, - for bullet points</li>
                            <li>Click "Generate Slide Outline" to create structure</li>
                            <li>Review and edit the generated outline</li>
                            <li>Click "Create PowerPoint" to generate the file</li>
                        </ol>
                        
                        <h4>Keyboard Shortcuts:</h4>
                        <ul>
                            <li><kbd>Ctrl+Enter</kbd> - Generate outline</li>
                            <li><kbd>Ctrl+S</kbd> - Save current state</li>
                            <li><kbd>Ctrl+R</kbd> - Regenerate outline</li>
                            <li><kbd>Esc</kbd> - Close modals</li>
                            <li><kbd>F1</kbd> - Show this help</li>
                        </ul>
                        
                        <h4>Tips:</h4>
                        <ul>
                            <li>Write at least 100 characters for better results</li>
                            <li>Structure your notes with clear sections</li>
                            <li>Use bullet points for key information</li>
                            <li>Your work is automatically saved</li>
                        </ul>
                    </div>
                    <div class="modal-footer">
                        <button class="primary-button modal-close">Got it!</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpModal);
        
        // Set up close handlers
        const closeButtons = helpModal.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(helpModal);
            });
        });
        
        // Close on outside click
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                document.body.removeChild(helpModal);
            }
        });
    }

    /**
     * Show welcome message for first-time users
     */
    showWelcomeIfFirstTime() {
        const hasVisited = localStorage.getItem('powerpoint_generator_visited');
        
        if (!hasVisited) {
            setTimeout(() => {
                this.showNotification(
                    'Welcome! Start by entering your presentation notes below. Press F1 for help.',
                    'info',
                    6000
                );
                
                localStorage.setItem('powerpoint_generator_visited', 'true');
            }, 1000);
        }
    }

    /**
     * Get application statistics
     * @returns {Object} - App statistics
     */
    getAppStats() {
        return {
            isInitialized: this.isInitialized,
            components: Object.keys(this.components),
            notesLength: this.components.notesInput?.getNotes().length || 0,
            hasOutline: !!this.components.outlinePreview?.getCurrentOutline(),
            isProcessing: this.components.aiProcessing?.isProcessing || false,
            isGenerating: this.components.powerPointGeneration?.isGenerating || false
        };
    }

    /**
     * Reset the entire application
     */
    resetApp() {
        const confirmed = confirm('Are you sure you want to reset the entire application? This will clear all data.');
        if (!confirmed) return;
        
        // Reset all components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.reset === 'function') {
                component.reset();
            }
        });
        
        // Clear localStorage
        const keys = Object.keys(localStorage).filter(key => 
            key.startsWith('powerpoint_generator_')
        );
        keys.forEach(key => localStorage.removeItem(key));
        
        // Show confirmation
        this.showNotification('Application reset successfully', 'success');
    }

    /**
     * Cleanup and destroy the application
     */
    destroy() {
        // Cleanup components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        
        // Clear timers
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Remove event listeners
        // (Most are handled by component cleanup)
        
        this.isInitialized = false;
    }
}

// Global function to open debug panel
function openDebugPanel() {
    if (window.logger) {
        window.logger.log('info', '[APP] Opening debug panel');
    }
    
    const debugWindow = window.open('debug-panel.html', 'debug-panel', 
        'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
    );
    
    if (debugWindow) {
        debugWindow.focus();
        if (window.logger) {
            window.logger.log('info', '[APP] Debug panel opened successfully');
        }
    } else {
        alert('Debug panel could not be opened. Please check if popups are blocked.');
        if (window.logger) {
            window.logger.log('error', '[APP] Failed to open debug panel - popup blocked?');
        }
    }
}

// Make openDebugPanel globally available
window.openDebugPanel = openDebugPanel;

// Create global instance
const app = new PowerPointGeneratorApp();

// Make app globally available for debugging
window.app = app;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PowerPointGeneratorApp;
}
