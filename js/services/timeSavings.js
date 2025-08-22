// Service for calculating and tracking time savings
class TimeSavingsService {
    constructor() {
        this.timeSavings = {
            'generate_outline': 5, // minutes
            'create_powerpoint': 15, // minutes
            'update_powerpoint': 10, // minutes
            'generate_chart': 5, // minutes
            'generate_visual': 5 // minutes
        };
    }

    /**
     * Track time saved for a specific action
     * @param {string} action - The action performed
     */
    trackTimeSaved(action) {
        const timeSaved = this.timeSavings[action];
        if (timeSaved) {
            if (window.analyticsService) {
                window.analyticsService.track('time_saved', {
                    action: action,
                    time_saved: timeSaved
                });
            }
        }
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
