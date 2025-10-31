// Tab Manager Component - Singleton pattern matching other components
class TabManager {
    constructor() {
        this.currentTab = 'create-new';
        this.tabs = ['create-new', 'meeting', 'update', 'charts', 'dashboard', 'audience', 'config'];
        this.isInitialized = false;
        
        console.log('TabManager constructor called');
    }

    /**
     * Initialize tab management
     */
    init() {
        if (this.isInitialized) {
            console.log('TabManager already initialized');
            return;
        }
        
        console.log('TabManager initializing...');
        
        // Enhanced DOM readiness check for packaged apps
        const attemptInitialization = () => {
            try {
                // Check if required DOM elements exist
                const tabButtons = document.querySelectorAll('.tab-button');
                const tabContents = document.querySelectorAll('.tab-content');
                
                if (tabButtons.length === 0 || tabContents.length === 0) {
                    console.warn('TabManager: DOM elements not ready, retrying...');
                    setTimeout(attemptInitialization, 100);
                    return;
                }
                
                console.log(`TabManager: Found ${tabButtons.length} tab buttons and ${tabContents.length} tab contents`);
                
                this.setupTabButtons();
                this.loadSavedTab();
                this.isInitialized = true;
                console.log('TabManager initialization complete');
                
            } catch (error) {
                console.error('TabManager initialization error:', error);
                // Retry after delay
                setTimeout(attemptInitialization, 500);
            }
        };
        
        // Try initialization immediately, or wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attemptInitialization);
        } else {
            // Give a small delay for packaged apps
            setTimeout(attemptInitialization, 50);
        }
    }

    /**
     * Set up tab button event listeners
     */
    setupTabButtons() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        console.log(`Setting up ${tabButtons.length} tab button listeners`);
        
        // Remove any existing event listeners by cloning elements
        tabButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
        
        // Get fresh references after cloning
        const freshTabButtons = document.querySelectorAll('.tab-button');
        
        freshTabButtons.forEach(button => {
            const tabId = button.getAttribute('data-tab');
            console.log(`Setting up button for tab: ${tabId}`);
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`Tab button clicked: ${tabId}`);
                this.switchTab(tabId);
            });
        });
    }

    /**
     * Switch to a specific tab
     * @param {string} tabId - Tab identifier
     */
    switchTab(tabId) {
        if (!this.tabs.includes(tabId)) {
            console.warn(`Invalid tab ID: ${tabId}`);
            return;
        }

        console.log(`Switching to tab: ${tabId}`);

        // Update current tab
        this.currentTab = tabId;

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-tab') === tabId) {
                button.classList.add('active');
                console.log(`Activated button for tab: ${tabId}`);
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const targetContent = document.getElementById(`${tabId}-tab`);
        if (targetContent) {
            targetContent.classList.add('active');
            console.log(`Activated content for tab: ${tabId}`);
        } else {
            console.error(`Tab content not found: ${tabId}-tab`);
        }

        // Save current tab
        this.saveCurrentTab();

        // Trigger tab change event
        this.dispatchTabChangeEvent(tabId);

        console.log(`Successfully switched to tab: ${tabId}`);
    }

    /**
     * Get current active tab
     * @returns {string} Current tab ID
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * Save current tab to localStorage
     */
    saveCurrentTab() {
        try {
            localStorage.setItem('powerpoint_generator_current_tab', this.currentTab);
            console.log(`Saved tab: ${this.currentTab}`);
        } catch (error) {
            console.warn('Failed to save current tab:', error);
        }
    }

    /**
     * Load saved tab from localStorage
     */
    loadSavedTab() {
        try {
            const savedTab = localStorage.getItem('powerpoint_generator_current_tab');
            console.log(`Loaded saved tab: ${savedTab}`);
            if (savedTab && this.tabs.includes(savedTab)) {
                this.switchTab(savedTab);
            } else {
                this.switchTab('create-new');
            }
        } catch (error) {
            console.warn('Failed to load saved tab:', error);
            this.switchTab('create-new');
        }
    }

    /**
     * Dispatch tab change event
     * @param {string} tabId - New tab ID
     */
    dispatchTabChangeEvent(tabId) {
        const event = new CustomEvent('tabChanged', {
            detail: {
                newTab: tabId,
                previousTab: this.currentTab
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Check if a specific tab is active
     * @param {string} tabId - Tab to check
     * @returns {boolean} Whether tab is active
     */
    isTabActive(tabId) {
        return this.currentTab === tabId;
    }

    /**
     * Get all available tabs
     * @returns {Array} Array of tab IDs
     */
    getAllTabs() {
        return [...this.tabs];
    }

    /**
     * Enable or disable a tab
     * @param {string} tabId - Tab to enable/disable
     * @param {boolean} enabled - Whether to enable the tab
     */
    setTabEnabled(tabId, enabled) {
        const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (tabButton) {
            if (enabled) {
                tabButton.removeAttribute('disabled');
                tabButton.classList.remove('disabled');
            } else {
                tabButton.setAttribute('disabled', 'true');
                tabButton.classList.add('disabled');
                
                // If disabling current tab, switch to first available tab
                if (this.currentTab === tabId) {
                    const firstEnabledTab = this.tabs.find(tab => {
                        const btn = document.querySelector(`[data-tab="${tab}"]`);
                        return btn && !btn.hasAttribute('disabled');
                    });
                    
                    if (firstEnabledTab) {
                        this.switchTab(firstEnabledTab);
                    }
                }
            }
        }
    }

    /**
     * Add badge/notification to tab
     * @param {string} tabId - Tab to add badge to
     * @param {string} text - Badge text
     * @param {string} type - Badge type ('info', 'warning', 'error', 'success')
     */
    addTabBadge(tabId, text, type = 'info') {
        const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (tabButton) {
            // Remove existing badge
            const existingBadge = tabButton.querySelector('.tab-badge');
            if (existingBadge) {
                existingBadge.remove();
            }

            // Add new badge
            const badge = document.createElement('span');
            badge.className = `tab-badge ${type}`;
            badge.textContent = text;
            tabButton.appendChild(badge);
        }
    }

    /**
     * Remove badge from tab
     * @param {string} tabId - Tab to remove badge from
     */
    removeTabBadge(tabId) {
        const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (tabButton) {
            const badge = tabButton.querySelector('.tab-badge');
            if (badge) {
                badge.remove();
            }
        }
    }

    /**
     * Reset tab manager to initial state
     */
    reset() {
        this.switchTab('create-new');
        
        // Remove all badges
        this.tabs.forEach(tabId => {
            this.removeTabBadge(tabId);
            this.setTabEnabled(tabId, true);
        });
    }

    /**
     * Test tab switching functionality
     */
    testTabSwitching() {
        console.log('Testing tab switching...');
        const tabs = ['create-new', 'meeting', 'update', 'charts', 'audience', 'config'];
        
        tabs.forEach((tabId, index) => {
            setTimeout(() => {
                console.log(`Testing switch to: ${tabId}`);
                this.switchTab(tabId);
            }, index * 1500);
        });
    }

    /**
     * Destroy tab manager
     */
    destroy() {
        // Remove event listeners by cloning buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
        
        this.isInitialized = false;
    }
}

// Create and export singleton instance
const tabManager = new TabManager();

// Make globally available
window.tabManager = tabManager;

// Make standalone functions available for backward compatibility
window.switchToTab = (tabId) => tabManager.switchTab(tabId);
window.getCurrentTab = () => tabManager.getCurrentTab();
window.testTabSwitching = () => tabManager.testTabSwitching();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = tabManager;
}

console.log('TabManager component loaded and ready');
