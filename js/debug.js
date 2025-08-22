// Centralized debugging and logging service
class DebugService {
    constructor() {
        // Ensure logs is always an array
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevel = 'debug'; // 'debug', 'info', 'warn', 'error'
        this.sonyMetrics = { meetings: 0, timeSaved: 0, apiCalls: 0 };
        this.init();
    }

    init() {
        // Ensure logs array is properly initialized
        if (!Array.isArray(this.logs)) {
            this.logs = [];
        }
        
        this.overrideConsole();
        this.loadLogs();
        this.setupAutomatedReporting();
        console.log('[DebugService] Initialized');
    }

    /**
     * Set up automated Friday 7 PM Pacific debug reporting
     */
    setupAutomatedReporting() {
        // Schedule weekly debug report for Friday 7 PM Pacific
        const checkReportingTime = () => {
            const now = new Date();
            const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
            
            // Check if it's Friday (5) at 7 PM Pacific
            if (pacificTime.getDay() === 5 && pacificTime.getHours() === 19 && pacificTime.getMinutes() === 0) {
                this.generateWeeklyDebugReport();
            }
        };
        
        // Check every minute
        setInterval(checkReportingTime, 60000);
        
        // Also check on app startup if we missed the Friday report
        this.checkMissedReport();
    }

    /**
     * Check if we missed the Friday report and generate it
     */
    checkMissedReport() {
        const lastReport = localStorage.getItem('powerpoint_generator_last_report');
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        if (!lastReport || new Date(lastReport) < oneWeekAgo) {
            setTimeout(() => this.generateWeeklyDebugReport(), 5000); // Generate after 5 seconds
        }
    }

    /**
     * Generate weekly debug report (Friday 7 PM Pacific)
     */
    generateWeeklyDebugReport() {
        const report = this.createSonyDebugReport();
        console.log('=== WEEKLY DEBUG REPORT (FRIDAY 7 PM PACIFIC) ===');
        console.log(report);
        console.log('=== END WEEKLY REPORT ===');
        
        // Save report timestamp
        localStorage.setItem('powerpoint_generator_last_report', new Date().toISOString());
        
        // Save report to local file for debugging
        this.saveReportToFile(report);
    }

    /**
     * Create Sony-specific debug report with internal calculations
     */
    createSonyDebugReport() {
        const timeSavings = window.timeSavingsService?.getStatistics() || {};
        const appUsage = this.getAppUsageMetrics();
        
        // Sony internal calculations (not shown to users)
        const dokkarCalculation = this.calculateDokkarMetrics(timeSavings);
        
        return {
            reportDate: new Date().toISOString(),
            reportType: 'Sony Game Studio Weekly Debug Report',
            timeZone: 'America/Los_Angeles',
            
            // User-visible metrics
            publicMetrics: {
                timeSaved: timeSavings.total?.formatted || '0m',
                efficiency: timeSavings.efficiency || 0,
                totalActions: timeSavings.totalActions || 0,
                weeklyUsage: timeSavings.thisWeek?.formatted || '0m'
            },
            
            // Sony internal calculations (debug only)
            dokkarCalculation: dokkarCalculation,
            
            // Technical debug info
            technicalMetrics: {
                appUptime: appUsage.sessionDuration,
                errorCount: this.getErrorCount(),
                performanceMetrics: this.getPerformanceMetrics(),
                apiCallCount: this.sonyMetrics.apiCalls,
                memoryUsage: this.getMemoryUsage()
            },
            
            // ROI calculations for Sony scenario
            sonyROI: {
                weeklyMeetings: 600,
                annualMeetings: 31200,
                costPerMeeting: 0.04,
                annualAPICost: 1248,
                timeSavedPerMeeting: 40, // minutes
                annualTimeSavings: 20900, // hours
                timeSavingsValue: 752400, // $
                archiveValue: 561600, // $
                totalValue: 1314000, // $
                roi: 65700 // %
            }
        };
    }

    /**
     * Calculate Sony internal dokkar metrics
     */
    calculateDokkarMetrics(timeSavings) {
        const totalMinutes = timeSavings.total?.minutes || 0;
        const totalActions = timeSavings.totalActions || 0;
        
        return {
            dokkarEfficiency: Math.min(totalMinutes * 1.2, 999), // Internal efficiency metric
            dokkarScore: totalActions * 15.7, // Internal scoring system
            dokkarIndex: totalMinutes > 0 ? (totalActions / totalMinutes) * 100 : 0,
            dokkarProjectedSavings: totalMinutes * 36 * 52, // Projected annual savings
            dokkarRiskFactor: 0.15, // 15% risk adjustment
            dokkarConfidenceLevel: 0.85 // 85% confidence in projections
        };
    }

    /**
     * Get app usage metrics
     */
    getAppUsageMetrics() {
        return {
            sessionDuration: window.app?.getSessionStats?.()?.duration || 0,
            sessionActions: window.app?.getSessionStats?.()?.actions || 0,
            activeComponents: Object.keys(window.components || {}).length
        };
    }

    /**
     * Get error count from logs
     */
    getErrorCount() {
        return this.logs.filter(log => log.level === 'ERROR').length;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            pageLoadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0,
            memoryUsed: performance.memory?.usedJSHeapSize || 0,
            memoryLimit: performance.memory?.jsHeapSizeLimit || 0
        };
    }

    /**
     * Get memory usage info
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
            };
        }
        return { used: 'N/A', total: 'N/A', limit: 'N/A' };
    }

    /**
     * Save report to local file for debugging
     */
    saveReportToFile(report) {
        try {
            const reportJson = JSON.stringify(report, null, 2);
            const blob = new Blob([reportJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `sony-debug-report-${new Date().toISOString().slice(0, 10)}.json`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            console.log('Weekly debug report saved to downloads');
        } catch (error) {
            console.error('Failed to save debug report:', error);
        }
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
