// Service for calculating and tracking time savings with dashboard
class TimeSavingsService {
    constructor() {
        // Conservative estimates: Manual time vs Automated time (in minutes)
        this.manualEstimates = {
            'generate_outline': 30, // Manual: 30 min to create outline from scratch
            'create_powerpoint': 45, // Manual: 45 min to create presentation manually
            'update_powerpoint': 25, // Manual: 25 min to analyze and update existing PP
            'ai_analysis': 20, // Manual: 20 min to analyze presentation context
            'generate_chart': 15, // Manual: 15 min to create charts manually
            'generate_visual': 10, // Manual: 10 min to create/find visuals
            'meeting_processing': 35, // Manual: 35 min to convert meeting notes to slides
            'content_enhancement': 20 // Manual: 20 min to enhance content quality
        };

        this.automatedEstimates = {
            'generate_outline': 2, // Automated: 2 min with AI
            'create_powerpoint': 3, // Automated: 3 min to generate
            'update_powerpoint': 2, // Automated: 2 min to update
            'ai_analysis': 1, // Automated: 1 min for AI analysis
            'generate_chart': 2, // Automated: 2 min to generate charts
            'generate_visual': 1, // Automated: 1 min with DALL-E
            'meeting_processing': 3, // Automated: 3 min to process meeting
            'content_enhancement': 1 // Automated: 1 min to enhance
        };

        this.actionDescriptions = {
            'generate_outline': 'Creating presentation outline from notes',
            'create_powerpoint': 'Generating complete PowerPoint presentation',
            'update_powerpoint': 'Updating existing PowerPoint presentation',
            'ai_analysis': 'AI analysis of presentation content and context',
            'generate_chart': 'Creating charts and visual elements',
            'generate_visual': 'Generating custom visuals with AI',
            'meeting_processing': 'Converting meeting notes to presentation',
            'content_enhancement': 'Enhancing content quality and structure'
        };

        this.loadSavedData();
        this.startSession();
    }

    /**
     * Track time saved for a specific action
     * @param {string} action - The action performed
     * @param {number} slideCount - Number of slides (for calculation scaling)
     */
    trackTimeSaved(action, slideCount = 1) {
        const manualTime = this.manualEstimates[action] || 0;
        const automatedTime = this.automatedEstimates[action] || 0;
        
        // Scale time based on slide count (but cap it reasonably)
        const scaleFactor = Math.min(slideCount / 5, 2); // Max 2x scaling
        const scaledManualTime = Math.round(manualTime * scaleFactor);
        const scaledAutomatedTime = Math.round(automatedTime * scaleFactor);
        
        const timeSavedMinutes = Math.max(0, scaledManualTime - scaledAutomatedTime);
        
        if (timeSavedMinutes > 0) {
            this.addTimeSavingEntry(action, timeSavedMinutes, slideCount);
            this.updateDashboard();
            
            console.log(`Time saved: ${timeSavedMinutes} minutes for ${action} (${slideCount} slides)`);
        }
    }

    /**
     * Add a time saving entry
     * @param {string} action - Action performed
     * @param {number} timeSavedMinutes - Time saved in minutes
     * @param {number} slideCount - Number of slides
     */
    addTimeSavingEntry(action, timeSavedMinutes, slideCount) {
        const entry = {
            action: action,
            timeSaved: timeSavedMinutes,
            slideCount: slideCount,
            timestamp: new Date().toISOString(),
            description: this.actionDescriptions[action] || action
        };

        // Load existing data
        let data = this.loadSavedData();
        
        // Add new entry
        data.entries.push(entry);
        data.totalMinutesSaved += timeSavedMinutes;
        data.totalActions += 1;
        data.lastUpdated = new Date().toISOString();

        // Save updated data
        this.saveData(data);
    }

    /**
     * Get time savings statistics
     * @returns {Object} Time savings stats
     */
    getStatistics() {
        const data = this.loadSavedData();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));

        // Calculate today's savings
        const todayEntries = data.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= today;
        });
        const todayMinutes = todayEntries.reduce((sum, entry) => sum + entry.timeSaved, 0);

        // Calculate this week's savings
        const weekEntries = data.entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= thisWeek;
        });
        const weekMinutes = weekEntries.reduce((sum, entry) => sum + entry.timeSaved, 0);

        // Calculate efficiency (conservative estimate)
        const manualTimeWouldHave = data.entries.reduce((sum, entry) => {
            const manualTime = this.manualEstimates[entry.action] || 0;
            const scaleFactor = Math.min(entry.slideCount / 5, 2);
            return sum + (manualTime * scaleFactor);
        }, 0);
        
        const efficiency = manualTimeWouldHave > 0 ? 
            Math.round((data.totalMinutesSaved / manualTimeWouldHave) * 100) : 0;

        return {
            today: {
                minutes: todayMinutes,
                formatted: this.formatDuration(todayMinutes)
            },
            thisWeek: {
                minutes: weekMinutes,
                formatted: this.formatDuration(weekMinutes)
            },
            total: {
                minutes: data.totalMinutesSaved,
                formatted: this.formatDuration(data.totalMinutesSaved)
            },
            efficiency: Math.min(efficiency, 85), // Cap at 85% to be conservative
            totalActions: data.totalActions,
            entries: data.entries.slice(-10), // Last 10 entries
            breakdown: this.getActionBreakdown(data.entries)
        };
    }

    /**
     * Get breakdown of time savings by action type
     * @param {Array} entries - Time saving entries
     * @returns {Object} Action breakdown
     */
    getActionBreakdown(entries) {
        const breakdown = {};
        
        entries.forEach(entry => {
            if (!breakdown[entry.action]) {
                breakdown[entry.action] = {
                    count: 0,
                    totalMinutes: 0,
                    description: entry.description
                };
            }
            breakdown[entry.action].count += 1;
            breakdown[entry.action].totalMinutes += entry.timeSaved;
        });

        // Convert to array and sort by time saved
        return Object.entries(breakdown)
            .map(([action, data]) => ({
                action,
                count: data.count,
                totalMinutes: data.totalMinutes,
                formatted: this.formatDuration(data.totalMinutes),
                description: data.description
            }))
            .sort((a, b) => b.totalMinutes - a.totalMinutes);
    }

    /**
     * Format duration in human-readable format
     * @param {number} minutes - Duration in minutes
     * @returns {string} Formatted duration
     */
    formatDuration(minutes) {
        if (minutes < 1) return '0m';
        
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        
        if (hours === 0) {
            return `${mins}m`;
        } else if (mins === 0) {
            return `${hours}h`;
        } else {
            return `${hours}h ${mins}m`;
        }
    }

    /**
     * Start a new session
     */
    startSession() {
        this.sessionStart = new Date();
        this.sessionActions = 0;
    }

    /**
     * Get session statistics
     * @returns {Object} Session stats
     */
    getSessionStats() {
        const sessionDuration = this.sessionStart ? 
            Math.round((new Date() - this.sessionStart) / (1000 * 60)) : 0;
        
        return {
            duration: sessionDuration,
            actions: this.sessionActions,
            formatted: this.formatDuration(sessionDuration)
        };
    }

    /**
     * Load saved data from localStorage
     * @returns {Object} Saved time savings data
     */
    loadSavedData() {
        try {
            const saved = localStorage.getItem('powerpoint_generator_time_savings');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load time savings data:', error);
        }

        // Return default data structure
        return {
            totalMinutesSaved: 0,
            totalActions: 0,
            entries: [],
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * Save data to localStorage
     * @param {Object} data - Data to save
     */
    saveData(data) {
        try {
            localStorage.setItem('powerpoint_generator_time_savings', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save time savings data:', error);
        }
    }

    /**
     * Update dashboard display
     */
    updateDashboard() {
        const dashboard = document.getElementById('time-savings-dashboard');
        if (dashboard) {
            this.renderDashboard(dashboard);
        }
    }

    /**
     * Render time savings dashboard
     * @param {Element} container - Dashboard container
     */
    renderDashboard(container) {
        const stats = this.getStatistics();
        const session = this.getSessionStats();

        container.innerHTML = `
            <div class="time-dashboard">
                <div class="dashboard-header">
                    <h3>⏱️ Time Saved Dashboard</h3>
                    <div class="dashboard-total" title="Total time saved across all PowerPoint Generator usage">
                        ${stats.total.formatted}
                    </div>
                </div>
                
                <div class="time-metrics">
                    <div class="metric-card" title="Time saved today using PowerPoint Generator">
                        <div class="metric-label">TODAY</div>
                        <div class="metric-value">${stats.today.formatted}</div>
                    </div>
                    
                    <div class="metric-card" title="Time saved this week using PowerPoint Generator">
                        <div class="metric-label">THIS WEEK</div>
                        <div class="metric-value">${stats.thisWeek.formatted}</div>
                    </div>
                    
                    <div class="metric-card" title="Total cumulative time saved since first use">
                        <div class="metric-label">TOTAL</div>
                        <div class="metric-value">${stats.total.formatted}</div>
                    </div>
                    
                    <div class="metric-card" title="Efficiency: Time saved vs manual creation time (conservative estimate)">
                        <div class="metric-label">EFFICIENCY</div>
                        <div class="metric-value">${stats.efficiency}%</div>
                    </div>
                </div>

                <div class="breakdown-section">
                    <h4>📊 Usage Breakdown</h4>
                    <div class="breakdown-list">
                        ${stats.breakdown.map(item => `
                            <div class="breakdown-item" title="${item.description} - Used ${item.count} times, saved ${item.formatted}">
                                <span class="breakdown-action">${item.description}</span>
                                <span class="breakdown-stats">${item.count} uses — ${item.formatted}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="calculation-info">
                    <h4>🧮 How Time Savings Are Calculated</h4>
                    <div class="calculation-tooltip">
                        <p><strong>Conservative Methodology:</strong></p>
                        <ul>
                            <li><strong>Manual Baseline:</strong> Time to create presentations manually without AI</li>
                            <li><strong>Automated Time:</strong> Actual time spent using PowerPoint Generator</li>
                            <li><strong>Time Saved:</strong> Manual Time - Automated Time (conservative estimates)</li>
                            <li><strong>Scaling:</strong> Adjusted based on presentation complexity and slide count</li>
                        </ul>
                        <p class="disclaimer">*Estimates are conservative and based on industry standards for presentation creation time.</p>
                    </div>
                </div>

                <div class="session-info">
                    <p><strong>Current Session:</strong> ${session.formatted} • ${this.sessionActions} actions</p>
                </div>
            </div>
        `;
    }

    /**
     * Initialize dashboard in the header
     */
    initializeDashboard() {
        // Check if dashboard already exists
        let dashboard = document.getElementById('time-savings-dashboard');
        
        if (!dashboard) {
            // Create dashboard container
            dashboard = document.createElement('div');
            dashboard.id = 'time-savings-dashboard';
            dashboard.className = 'time-savings-widget';
            
            // Find header or create placement
            const header = document.querySelector('.app-header .header-content');
            if (header) {
                header.appendChild(dashboard);
            } else {
                // Fallback: Add to body
                document.body.appendChild(dashboard);
            }
        }

        this.renderDashboard(dashboard);
        return dashboard;
    }

    /**
     * Get tooltip content for specific action
     * @param {string} action - Action name
     * @returns {string} Tooltip content
     */
    getTooltipContent(action) {
        const manual = this.manualEstimates[action] || 0;
        const automated = this.automatedEstimates[action] || 0;
        const saved = manual - automated;
        
        return `Manual: ${manual}m | Automated: ${automated}m | Saved: ${saved}m per use`;
    }

    /**
     * Reset all time savings data
     */
    resetData() {
        const confirmed = confirm('Are you sure you want to reset all time savings data? This cannot be undone.');
        if (confirmed) {
            localStorage.removeItem('powerpoint_generator_time_savings');
            this.updateDashboard();
            console.log('Time savings data reset');
        }
    }

    /**
     * Export time savings data
     * @returns {Object} Exportable data
     */
    exportData() {
        const data = this.loadSavedData();
        const stats = this.getStatistics();
        
        return {
            ...data,
            statistics: stats,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Get detailed time calculation for specific action
     * @param {string} action - Action name
     * @param {number} slideCount - Number of slides
     * @returns {Object} Detailed calculation
     */
    getDetailedCalculation(action, slideCount = 1) {
        const manualTime = this.manualEstimates[action] || 0;
        const automatedTime = this.automatedEstimates[action] || 0;
        const scaleFactor = Math.min(slideCount / 5, 2);
        
        const scaledManualTime = Math.round(manualTime * scaleFactor);
        const scaledAutomatedTime = Math.round(automatedTime * scaleFactor);
        const timeSaved = Math.max(0, scaledManualTime - scaledAutomatedTime);
        
        return {
            action: action,
            description: this.actionDescriptions[action],
            slideCount: slideCount,
            scaleFactor: scaleFactor,
            manualTime: {
                base: manualTime,
                scaled: scaledManualTime,
                formatted: this.formatDuration(scaledManualTime)
            },
            automatedTime: {
                base: automatedTime,
                scaled: scaledAutomatedTime,
                formatted: this.formatDuration(scaledAutomatedTime)
            },
            timeSaved: {
                minutes: timeSaved,
                formatted: this.formatDuration(timeSaved)
            },
            efficiency: scaledManualTime > 0 ? Math.round((timeSaved / scaledManualTime) * 100) : 0
        };
    }
}

// Create global instance
const timeSavingsService = new TimeSavingsService();

// Make globally available
window.timeSavingsService = timeSavingsService;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = timeSavingsService;
}
