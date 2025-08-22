// Centralized debugging and logging service
class DebugService {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevel = 'debug'; // 'debug', 'info', 'warn', 'error'
        this.init();
    }

    init() {
        this.overrideConsole();
        this.loadLogs();
        console.log('[DebugService] Initialized');
    }

    overrideConsole() {
        const originalConsole = {
            log: console.log.bind(console),
            info: console.info.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console),
            debug: console.debug.bind(console)
        };

        console.log = (...args) => { this.log('info', ...args); originalConsole.log(...args); };
        console.info = (...args) => { this.log('info', ...args); originalConsole.info(...args); };
        console.warn = (...args) => { this.log('warn', ...args); originalConsole.warn(...args); };
        console.error = (...args) => { this.log('error', ...args); originalConsole.error(...args); };
        console.debug = (...args) => { this.log('debug', ...args); originalConsole.debug(...args); };
    }

    log(level, message, data = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message: message,
            data: data,
            stack: new Error().stack
        };

        this.logs.push(logEntry);

        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.saveLogs();
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
        this.saveLogs();
    }

    saveLogs() {
        try {
            localStorage.setItem('powerpoint_generator_debug_logs', JSON.stringify(this.logs));
        } catch (error) {
            console.error('[DebugService] Failed to save logs to localStorage:', error);
        }
    }

    loadLogs() {
        try {
            const storedLogs = localStorage.getItem('powerpoint_generator_debug_logs');
            if (storedLogs) {
                this.logs = JSON.parse(storedLogs);
            }
        } catch (error) {
            console.error('[DebugService] Failed to load logs from localStorage:', error);
        }
    }
}

// Initialize immediately
window.debugService = new DebugService();
