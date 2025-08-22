// Comprehensive logging system for PowerPoint Generator
class Logger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevel = 'debug';
        this.timers = new Set();
        this.intervals = new Set();
        this.eventListeners = new Map();
        this.isInitialized = false;
        
        // Initialize safely
        try {
            this.init();
        } catch (error) {
            console.error('Logger initialization failed:', error);
        }
    }
    
    init() {
        if (this.isInitialized) return;
        
        // Store original console methods safely
        this.originalConsole = {
            log: console.log.bind(console),
            info: console.info.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console),
            debug: console.debug.bind(console)
        };
        
        // Track timers and intervals
        this.interceptTimers();
        
        // Track window/app lifecycle
        this.trackLifecycle();
        
        this.isInitialized = true;
        this.originalConsole.log('[LOGGER] Logging system initialized');
    }
    
    log(level, ...args) {
        const timestamp = new Date().toISOString();
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        const logEntry = {
            timestamp,
            level,
            message,
            stack: new Error().stack
        };
        
        this.logs.push(logEntry);
        
        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        
        // Also log to original console with prefix
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        this.originalConsole.log(prefix, ...args);
    }
    
    interceptTimers() {
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        const originalClearTimeout = window.clearTimeout;
        const originalClearInterval = window.clearInterval;
        
        window.setTimeout = (callback, delay, ...args) => {
            const id = originalSetTimeout(callback, delay, ...args);
            this.timers.add(id);
            this.log('debug', `[TIMER] setTimeout created: ${id}, delay: ${delay}ms`);
            return id;
        };
        
        window.setInterval = (callback, delay, ...args) => {
            const id = originalSetInterval(callback, delay, ...args);
            this.intervals.add(id);
            this.log('debug', `[TIMER] setInterval created: ${id}, delay: ${delay}ms`);
            return id;
        };
        
        window.clearTimeout = (id) => {
            originalClearTimeout(id);
            this.timers.delete(id);
            this.log('debug', `[TIMER] clearTimeout: ${id}`);
        };
        
        window.clearInterval = (id) => {
            originalClearInterval(id);
            this.intervals.delete(id);
            this.log('debug', `[TIMER] clearInterval: ${id}`);
        };
    }
    
    interceptEventListeners() {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
        
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            try {
                const key = `${this.constructor.name}-${type}`;
                if (window.logger && window.logger.eventListeners) {
                    if (!window.logger.eventListeners.has(key)) {
                        window.logger.eventListeners.set(key, new Set());
                    }
                    window.logger.eventListeners.get(key).add(listener);
                    window.logger.log('debug', `[EVENT] addEventListener: ${key}`);
                }
            } catch (e) {
                // Silently fail to avoid breaking the app
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
        
        EventTarget.prototype.removeEventListener = function(type, listener, options) {
            try {
                const key = `${this.constructor.name}-${type}`;
                if (window.logger && window.logger.eventListeners && window.logger.eventListeners.has(key)) {
                    window.logger.eventListeners.get(key).delete(listener);
                    window.logger.log('debug', `[EVENT] removeEventListener: ${key}`);
                }
            } catch (e) {
                // Silently fail to avoid breaking the app
            }
            return originalRemoveEventListener.call(this, type, listener, options);
        };
    }
    
    trackLifecycle() {
        // Track window events
        window.addEventListener('beforeunload', (e) => {
            this.log('warn', '[LIFECYCLE] beforeunload event triggered');
            this.generateCloseReport();
        });
        
        window.addEventListener('unload', (e) => {
            this.log('warn', '[LIFECYCLE] unload event triggered');
        });
        
        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            this.log('info', `[LIFECYCLE] visibilitychange: ${document.visibilityState}`);
        });
        
        // Track focus changes
        window.addEventListener('focus', () => {
            this.log('info', '[LIFECYCLE] window focus gained');
        });
        
        window.addEventListener('blur', () => {
            this.log('info', '[LIFECYCLE] window focus lost');
        });
        
        // Track errors
        window.addEventListener('error', (e) => {
            this.log('error', `[ERROR] Global error: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.log('error', `[ERROR] Unhandled promise rejection: ${e.reason}`);
        });
    }
    
    generateCloseReport() {
        this.log('warn', '[CLOSE REPORT] Generating app close diagnostic report...');
        
        // Active timers
        this.log('warn', `[CLOSE REPORT] Active setTimeout timers: ${this.timers.size}`);
        this.log('warn', `[CLOSE REPORT] Active setInterval timers: ${this.intervals.size}`);
        
        if (this.timers.size > 0) {
            this.log('warn', `[CLOSE REPORT] Active setTimeout IDs: ${Array.from(this.timers).join(', ')}`);
        }
        
        if (this.intervals.size > 0) {
            this.log('warn', `[CLOSE REPORT] Active setInterval IDs: ${Array.from(this.intervals).join(', ')}`);
        }
        
        // Event listeners
        this.log('warn', `[CLOSE REPORT] Event listener types: ${this.eventListeners.size}`);
        for (const [key, listeners] of this.eventListeners) {
            if (listeners.size > 0) {
                this.log('warn', `[CLOSE REPORT] ${key}: ${listeners.size} listeners`);
            }
        }
        
        // Active network requests
        if (window.fetch && window.fetch.activeRequests) {
            this.log('warn', `[CLOSE REPORT] Active fetch requests: ${window.fetch.activeRequests}`);
        }
        
        // WebSocket connections
        if (window.WebSocket && window.WebSocket.activeConnections) {
            this.log('warn', `[CLOSE REPORT] Active WebSocket connections: ${window.WebSocket.activeConnections}`);
        }
        
        // Check for common blocking patterns
        this.checkForBlockingPatterns();
        
        // Export logs for debugging
        this.exportLogs();
    }
    
    checkForBlockingPatterns() {
        this.log('warn', '[CLOSE REPORT] Checking for common blocking patterns...');
        
        // Check for infinite loops in recent logs
        const recentLogs = this.logs.slice(-50);
        const messageFrequency = {};
        
        recentLogs.forEach(log => {
            const key = log.message.substring(0, 100); // First 100 chars
            messageFrequency[key] = (messageFrequency[key] || 0) + 1;
        });
        
        for (const [message, count] of Object.entries(messageFrequency)) {
            if (count > 10) {
                this.log('warn', `[CLOSE REPORT] Potential infinite loop detected: "${message}" (${count} times)`);
            }
        }
        
        // Check for pending promises
        if (window.Promise && window.Promise.allSettled) {
            this.log('warn', '[CLOSE REPORT] Checking for pending promises...');
        }
        
        // Check for active components
        if (window.components) {
            this.log('warn', '[CLOSE REPORT] Active components:', Object.keys(window.components));
        }
        
        // Check for active AI requests
        if (window.aiService && window.aiService.activeRequests) {
            this.log('warn', `[CLOSE REPORT] Active AI requests: ${window.aiService.activeRequests}`);
        }
    }
    
    clearAllTimers() {
        this.log('warn', '[CLEANUP] Clearing all active timers...');
        
        // Clear all tracked timers
        this.timers.forEach(id => {
            clearTimeout(id);
            this.log('debug', `[CLEANUP] Cleared setTimeout: ${id}`);
        });
        
        this.intervals.forEach(id => {
            clearInterval(id);
            this.log('debug', `[CLEANUP] Cleared setInterval: ${id}`);
        });
        
        this.timers.clear();
        this.intervals.clear();
        
        this.log('warn', '[CLEANUP] All timers cleared');
    }
    
    removeAllEventListeners() {
        this.log('warn', '[CLEANUP] Removing all tracked event listeners...');
        
        // Note: We can't automatically remove all listeners without references
        // This is more for reporting what's still active
        let totalListeners = 0;
        for (const [key, listeners] of this.eventListeners) {
            totalListeners += listeners.size;
        }
        
        this.log('warn', `[CLEANUP] Total active event listeners: ${totalListeners}`);
    }
    
    exportLogs() {
        try {
            const logData = {
                timestamp: new Date().toISOString(),
                logs: this.logs,
                timers: Array.from(this.timers),
                intervals: Array.from(this.intervals),
                eventListeners: Object.fromEntries(
                    Array.from(this.eventListeners.entries()).map(([key, set]) => [key, set.size])
                )
            };
            
            // Save to localStorage for debugging
            localStorage.setItem('powerpoint_generator_debug_logs', JSON.stringify(logData));
            
            // Also try to save to console for copy-paste
            this.originalConsole.log('[CLOSE REPORT] Debug logs saved to localStorage key: powerpoint_generator_debug_logs');
            this.originalConsole.log('[CLOSE REPORT] Full log data:', logData);
            
        } catch (error) {
            this.log('error', '[CLOSE REPORT] Failed to export logs:', error);
        }
    }
    
    forceCleanup() {
        this.log('warn', '[FORCE CLEANUP] Starting force cleanup procedure...');
        
        // Clear all timers
        this.clearAllTimers();
        
        // Remove event listeners (best effort)
        this.removeAllEventListeners();
        
        // Cancel any pending AI requests
        if (window.aiService && typeof window.aiService.cancelAllRequests === 'function') {
            window.aiService.cancelAllRequests();
        }
        
        // Close any open modals or overlays
        const modals = document.querySelectorAll('.modal-overlay, .modal, .overlay');
        modals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        
        // Stop any animations
        const animations = document.getAnimations ? document.getAnimations() : [];
        animations.forEach(animation => {
            animation.cancel();
        });
        
        this.log('warn', '[FORCE CLEANUP] Force cleanup completed');
        
        // Generate final report
        this.generateCloseReport();
    }
    
    // Public methods for manual debugging
    getActiveCounts() {
        return {
            timers: this.timers.size,
            intervals: this.intervals.size,
            eventListeners: Array.from(this.eventListeners.values()).reduce((sum, set) => sum + set.size, 0),
            logs: this.logs.length
        };
    }
    
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }
    
    searchLogs(query) {
        return this.logs.filter(log => 
            log.message.toLowerCase().includes(query.toLowerCase())
        );
    }
}

// Initialize logger immediately
window.logger = new Logger();

// Add global cleanup function
window.forceAppCleanup = () => {
    console.log('[FORCE CLEANUP] Manual force cleanup triggered');
    window.logger.forceCleanup();
    
    // Try to close the app after cleanup
    setTimeout(() => {
        if (window.electronAPI && window.electronAPI.closeApp) {
            window.electronAPI.closeApp();
        } else {
            window.close();
        }
    }, 1000);
};

// Add debug functions to window
window.debugApp = {
    getActiveCounts: () => window.logger.getActiveCounts(),
    getRecentLogs: (count) => window.logger.getRecentLogs(count),
    searchLogs: (query) => window.logger.searchLogs(query),
    forceCleanup: () => window.logger.forceCleanup(),
    generateReport: () => window.logger.generateCloseReport(),
    clearTimers: () => window.logger.clearAllTimers()
};

console.log('[LOGGER] Comprehensive logging and debugging system loaded');
console.log('[LOGGER] Use window.debugApp for debugging functions');
console.log('[LOGGER] Use window.forceAppCleanup() to force cleanup and close');
