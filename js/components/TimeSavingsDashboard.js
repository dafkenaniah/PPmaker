// Time Savings Dashboard Component - Sophisticated dashboard similar to PlayStation Conference Matcher
class TimeSavingsDashboard {
    constructor() {
        this.isInitialized = false;
        this.timeSavingsService = window.timeSavingsService;
        this.updateInterval = null;
        
        console.log('TimeSavingsDashboard constructor called');
    }

    /**
     * Initialize the dashboard
     */
    init() {
        if (this.isInitialized) {
            console.log('TimeSavingsDashboard already initialized');
            return;
        }

        console.log('TimeSavingsDashboard initializing...');

        const attemptInitialization = () => {
            try {
                const dashboardContainer = document.getElementById('dashboard-tab');
                
                if (!dashboardContainer) {
                    console.warn('TimeSavingsDashboard: Container not ready, retrying...');
                    setTimeout(attemptInitialization, 100);
                    return;
                }

                this.renderDashboard();
                this.setupEventListeners();
                this.startAutoUpdate();
                this.isInitialized = true;
                
                console.log('TimeSavingsDashboard initialization complete');
                
            } catch (error) {
                console.error('TimeSavingsDashboard initialization error:', error);
                setTimeout(attemptInitialization, 500);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attemptInitialization);
        } else {
            setTimeout(attemptInitialization, 50);
        }
    }

    /**
     * Render the sophisticated dashboard
     */
    renderDashboard() {
        const container = document.getElementById('dashboard-tab');
        if (!container) return;

        const stats = this.timeSavingsService.getStatistics();
        const data = this.timeSavingsService.loadSavedData();
        
        // Calculate additional metrics
        const manualVsAutomated = this.calculateManualVsAutomated(data);
        const processBreakdown = this.getProcessBreakdown(data);
        const efficiencyGain = Math.min(stats.efficiency, 99.6); // Cap at 99.6% like PlayStation Conference Matcher
        
        container.innerHTML = `
            <div class="sophisticated-dashboard">
                <!-- Dashboard Header -->
                <div class="dashboard-hero">
                    <div class="hero-content">
                        <h1 class="dashboard-title">PowerPoint Generator Time Savings</h1>
                        <p class="dashboard-subtitle">Automated presentation creation efficiency analysis</p>
                        <div class="hero-stats">
                            <div class="hero-stat">
                                <div class="stat-number">${stats.total.formatted}</div>
                                <div class="stat-label">Total Time Saved</div>
                            </div>
                            <div class="hero-stat">
                                <div class="stat-number">${efficiencyGain}%</div>
                                <div class="stat-label">Efficiency Gain</div>
                            </div>
                            <div class="hero-stat">
                                <div class="stat-number">${stats.totalActions}</div>
                                <div class="stat-label">Presentations Created</div>
                            </div>
                        </div>
                    </div>
                    <div class="hero-visual">
                        <div class="efficiency-circle">
                            <svg width="120" height="120" class="circular-progress">
                                <circle 
                                    cx="60" 
                                    cy="60" 
                                    r="50" 
                                    stroke="#e5e7eb" 
                                    stroke-width="8" 
                                    fill="none"
                                />
                                <circle 
                                    cx="60" 
                                    cy="60" 
                                    r="50" 
                                    stroke="#0066cc" 
                                    stroke-width="8" 
                                    fill="none" 
                                    stroke-dasharray="${2 * Math.PI * 50}" 
                                    stroke-dashoffset="${2 * Math.PI * 50 * (1 - efficiencyGain / 100)}"
                                    stroke-linecap="round"
                                    transform="rotate(-90 60 60)"
                                />
                            </svg>
                            <div class="circle-text">
                                <span class="circle-percentage">${efficiencyGain}%</span>
                                <span class="circle-label">Efficiency</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Dashboard Grid -->
                <div class="dashboard-grid">
                    <!-- Manual vs Automated Comparison -->
                    <div class="dashboard-panel comparison-panel">
                        <div class="panel-header">
                            <h2 class="panel-title">Manual vs Automated Process</h2>
                            <div class="panel-badge">Comparison Analysis</div>
                        </div>
                        <div class="comparison-container">
                            <div class="process-column manual-process">
                                <div class="process-header">
                                    <div class="process-icon manual">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                    </div>
                                    <h3>Manual Process</h3>
                                    <div class="time-estimate">${manualVsAutomated.manual.formatted}</div>
                                </div>
                                <div class="process-steps">
                                    <div class="step-item">
                                        <div class="step-number">1</div>
                                        <div class="step-content">
                                            <div class="step-title">Research & Planning</div>
                                            <div class="step-time">15-20 min</div>
                                        </div>
                                    </div>
                                    <div class="step-item">
                                        <div class="step-number">2</div>
                                        <div class="step-content">
                                            <div class="step-title">Content Creation</div>
                                            <div class="step-time">30-45 min</div>
                                        </div>
                                    </div>
                                    <div class="step-item">
                                        <div class="step-number">3</div>
                                        <div class="step-content">
                                            <div class="step-title">Slide Design</div>
                                            <div class="step-time">20-30 min</div>
                                        </div>
                                    </div>
                                    <div class="step-item">
                                        <div class="step-number">4</div>
                                        <div class="step-content">
                                            <div class="step-title">Review & Polish</div>
                                            <div class="step-time">10-15 min</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="vs-divider">
                                <div class="vs-circle">VS</div>
                                <div class="efficiency-arrow">
                                    <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
                                        <path d="M2 10h32m0 0l-8-8m8 8l-8 8" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div class="process-column automated-process">
                                <div class="process-header">
                                    <div class="process-icon automated">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="3"/>
                                            <path d="M12 1v6m0 6v6"/>
                                            <path d="m21 12-6-3-6 3-6-3"/>
                                        </svg>
                                    </div>
                                    <h3>Automated Process</h3>
                                    <div class="time-estimate">${manualVsAutomated.automated.formatted}</div>
                                </div>
                                <div class="process-steps">
                                    <div class="step-item">
                                        <div class="step-number">1</div>
                                        <div class="step-content">
                                            <div class="step-title">AI Analysis</div>
                                            <div class="step-time">30 sec</div>
                                        </div>
                                    </div>
                                    <div class="step-item">
                                        <div class="step-number">2</div>
                                        <div class="step-content">
                                            <div class="step-title">Content Generation</div>
                                            <div class="step-time">1-2 min</div>
                                        </div>
                                    </div>
                                    <div class="step-item">
                                        <div class="step-number">3</div>
                                        <div class="step-content">
                                            <div class="step-title">Slide Creation</div>
                                            <div class="step-time">1 min</div>
                                        </div>
                                    </div>
                                    <div class="step-item">
                                        <div class="step-number">4</div>
                                        <div class="step-content">
                                            <div class="step-title">Final Export</div>
                                            <div class="step-time">15 sec</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="comparison-summary">
                            <div class="summary-stat">
                                <strong>Time Reduction:</strong> ${manualVsAutomated.timeSaved.formatted}
                            </div>
                            <div class="summary-stat">
                                <strong>Speed Improvement:</strong> ${manualVsAutomated.speedMultiplier}x faster
                            </div>
                        </div>
                    </div>

                    <!-- Process Breakdown -->
                    <div class="dashboard-panel breakdown-panel">
                        <div class="panel-header">
                            <h2 class="panel-title">Detailed Process Breakdown</h2>
                            <div class="panel-badge">Activity Analysis</div>
                        </div>
                        <div class="breakdown-content">
                            ${processBreakdown.map(item => `
                                <div class="breakdown-row">
                                    <div class="breakdown-info">
                                        <div class="breakdown-title">${item.description}</div>
                                        <div class="breakdown-meta">${item.count} uses • Avg ${item.avgTime} per use</div>
                                    </div>
                                    <div class="breakdown-stats">
                                        <div class="breakdown-time">${item.formatted}</div>
                                        <div class="breakdown-bar">
                                            <div class="bar-fill" style="width: ${item.percentage}%"></div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="breakdown-summary">
                            <div class="summary-row">
                                <span>Total Activities:</span>
                                <span>${stats.totalActions}</span>
                            </div>
                            <div class="summary-row">
                                <span>Average Time per Presentation:</span>
                                <span>${this.formatDuration(stats.total.minutes / Math.max(stats.totalActions, 1))}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Usage Metrics -->
                    <div class="dashboard-panel metrics-panel">
                        <div class="panel-header">
                            <h2 class="panel-title">Usage Metrics</h2>
                            <div class="panel-badge">Performance</div>
                        </div>
                        <div class="metrics-grid">
                            <div class="metric-item">
                                <div class="metric-icon today">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12,6 12,12 16,14"/>
                                    </svg>
                                </div>
                                <div class="metric-content">
                                    <div class="metric-value">${stats.today.formatted}</div>
                                    <div class="metric-label">Today</div>
                                </div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-icon week">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M8 2v4"/>
                                        <path d="M16 2v4"/>
                                        <rect width="18" height="18" x="3" y="4" rx="2"/>
                                        <path d="M3 10h18"/>
                                    </svg>
                                </div>
                                <div class="metric-content">
                                    <div class="metric-value">${stats.thisWeek.formatted}</div>
                                    <div class="metric-label">This Week</div>
                                </div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-icon total">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="12" y1="20" x2="12" y2="10"/>
                                        <line x1="18" y1="20" x2="18" y2="4"/>
                                        <line x1="6" y1="20" x2="6" y2="16"/>
                                    </svg>
                                </div>
                                <div class="metric-content">
                                    <div class="metric-value">${stats.total.formatted}</div>
                                    <div class="metric-label">All Time</div>
                                </div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-icon efficiency">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                    </svg>
                                </div>
                                <div class="metric-content">
                                    <div class="metric-value">${efficiencyGain}%</div>
                                    <div class="metric-label">Efficiency</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Additional Benefits -->
                    <div class="dashboard-panel benefits-panel">
                        <div class="panel-header">
                            <h2 class="panel-title">Additional Benefits</h2>
                            <div class="panel-badge">Impact Analysis</div>
                        </div>
                        <div class="benefits-content">
                            <div class="benefit-item">
                                <div class="benefit-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                </div>
                                <div class="benefit-content">
                                    <div class="benefit-title">Consistent Quality</div>
                                    <div class="benefit-description">AI ensures uniform presentation standards and professional formatting across all outputs</div>
                                </div>
                            </div>
                            <div class="benefit-item">
                                <div class="benefit-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                </div>
                                <div class="benefit-content">
                                    <div class="benefit-title">Reduced Cognitive Load</div>
                                    <div class="benefit-description">Team members can focus on strategic thinking rather than presentation formatting</div>
                                </div>
                            </div>
                            <div class="benefit-item">
                                <div class="benefit-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 6v6l4 2"/>
                                    </svg>
                                </div>
                                <div class="benefit-content">
                                    <div class="benefit-title">Faster Iteration</div>
                                    <div class="benefit-description">Quick regeneration enables rapid refinement and multiple presentation versions</div>
                                </div>
                            </div>
                            <div class="benefit-item">
                                <div class="benefit-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M9 12l2 2 4-4"/>
                                        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                        <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                    </svg>
                                </div>
                                <div class="benefit-content">
                                    <div class="benefit-title">Error Reduction</div>
                                    <div class="benefit-description">Automated process eliminates common formatting and consistency errors</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dashboard Actions -->
                <div class="dashboard-actions">
                    <button id="export-dashboard-data" class="dashboard-button primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export Dashboard Data
                    </button>
                    <button id="reset-dashboard-data" class="dashboard-button secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                        Reset All Data
                    </button>
                    <button id="refresh-dashboard" class="dashboard-button secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 4 23 10 17 10"/>
                            <polyline points="1 20 1 14 7 14"/>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                        </svg>
                        Refresh Data
                    </button>
                </div>

                <!-- Dashboard Footer -->
                <div class="dashboard-footer">
                    <div class="footer-info">
                        <p class="methodology-note">
                            <strong>Methodology:</strong> Time savings calculated using conservative industry estimates. 
                            Manual times based on presentation creation benchmarks from enterprise productivity studies.
                        </p>
                        <p class="last-updated">
                            Last updated: ${new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Calculate manual vs automated comparison
     */
    calculateManualVsAutomated(data) {
        // Calculate total manual time that would have been spent
        const totalManualMinutes = data.entries.reduce((sum, entry) => {
            const manualTime = this.timeSavingsService.manualEstimates[entry.action] || 0;
            const scaleFactor = Math.min(entry.slideCount / 5, 2);
            return sum + (manualTime * scaleFactor);
        }, 0);

        // Calculate total automated time actually spent
        const totalAutomatedMinutes = totalManualMinutes - data.totalMinutesSaved;
        
        // Calculate speed multiplier
        const speedMultiplier = totalAutomatedMinutes > 0 ? 
            Math.round((totalManualMinutes / totalAutomatedMinutes) * 10) / 10 : 0;

        return {
            manual: {
                minutes: totalManualMinutes,
                formatted: this.formatDuration(totalManualMinutes)
            },
            automated: {
                minutes: totalAutomatedMinutes,
                formatted: this.formatDuration(totalAutomatedMinutes)
            },
            timeSaved: {
                minutes: data.totalMinutesSaved,
                formatted: this.formatDuration(data.totalMinutesSaved)
            },
            speedMultiplier: speedMultiplier
        };
    }

    /**
     * Get process breakdown with percentages
     */
    getProcessBreakdown(data) {
        const breakdown = {};
        
        data.entries.forEach(entry => {
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

        const maxTime = Math.max(...Object.values(breakdown).map(b => b.totalMinutes), 1);
        
        return Object.entries(breakdown)
            .map(([action, data]) => ({
                action,
                count: data.count,
                totalMinutes: data.totalMinutes,
                formatted: this.formatDuration(data.totalMinutes),
                avgTime: this.formatDuration(data.totalMinutes / data.count),
                description: data.description,
                percentage: Math.round((data.totalMinutes / maxTime) * 100)
            }))
            .sort((a, b) => b.totalMinutes - a.totalMinutes);
    }

    /**
     * Format duration helper
     */
    formatDuration(minutes) {
        return this.timeSavingsService.formatDuration(minutes);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Export dashboard data
        const exportBtn = document.getElementById('export-dashboard-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportDashboardData());
        }

        // Reset dashboard data
        const resetBtn = document.getElementById('reset-dashboard-data');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetDashboardData());
        }

        // Refresh dashboard
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }

        // Listen for tab changes to refresh when dashboard becomes active
        document.addEventListener('tabChanged', (event) => {
            if (event.detail.newTab === 'dashboard') {
                this.refreshDashboard();
            }
        });
    }

    /**
     * Export dashboard data
     */
    exportDashboardData() {
        try {
            const data = this.timeSavingsService.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `powerpoint-generator-dashboard-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            console.log('Dashboard data exported successfully');
        } catch (error) {
            console.error('Failed to export dashboard data:', error);
        }
    }

    /**
     * Reset dashboard data
     */
    resetDashboardData() {
        if (confirm('Are you sure you want to reset all time savings data? This action cannot be undone.')) {
            this.timeSavingsService.resetData();
            this.refreshDashboard();
        }
    }

    /**
     * Refresh dashboard
     */
    refreshDashboard() {
        console.log('Refreshing dashboard data...');
        this.renderDashboard();
    }

    /**
     * Start auto-update interval
     */
    startAutoUpdate() {
        // Update dashboard every 30 seconds
        this.updateInterval = setInterval(() => {
            if (window.tabManager && window.tabManager.isTabActive('dashboard')) {
                this.refreshDashboard();
            }
        }, 30000);
    }

    /**
     * Stop auto-update interval
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Destroy dashboard
     */
    destroy() {
        this.stopAutoUpdate();
        this.isInitialized = false;
    }
}

// Create and export singleton instance
const timeSavingsDashboard = new TimeSavingsDashboard();

// Make globally available
window.timeSavingsDashboard = timeSavingsDashboard;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = timeSavingsDashboard;
}

console.log('TimeSavingsDashboard component loaded and ready');
