// Audience Settings Manager Component
class AudienceManager {
    constructor() {
        this.selectedAudiences = new Set();
        this.audienceTypes = {
            executive: {
                name: 'Executive Leadership',
                description: 'CEOs, VPs, Studio Heads - Focus on high-level strategy, ROI, and business impact',
                focus: 'Business metrics, market impact, strategic alignment',
                promptModifier: 'Focus on high-level business strategy, ROI, market impact, and executive decision-making. Use business terminology and emphasize strategic outcomes.'
            },
            development: {
                name: 'Development Teams',
                description: 'Engineers, Designers, Artists - Technical implementation and creative details',
                focus: 'Technical specifications, workflows, implementation details',
                promptModifier: 'Focus on technical implementation details, development workflows, architecture decisions, and creative processes. Include technical specifications and development methodologies.'
            },
            product: {
                name: 'Product Management',
                description: 'Product Managers, Producers - Feature roadmaps, user experience, market fit',
                focus: 'User experience, feature prioritization, market analysis',
                promptModifier: 'Focus on product strategy, user experience, feature prioritization, market analysis, and product-market fit. Emphasize user needs and product roadmaps.'
            },
            marketing: {
                name: 'Marketing & Publishing',
                description: 'Marketing Teams, Publishers - Brand positioning, audience reach, campaign strategy',
                focus: 'Market positioning, audience demographics, promotional strategy',
                promptModifier: 'Focus on marketing strategy, brand positioning, target audience analysis, promotional campaigns, and market reach. Emphasize marketing metrics and audience engagement.'
            },
            qa: {
                name: 'Quality Assurance',
                description: 'QA Teams, Test Engineers - Testing strategies, quality metrics, bug tracking',
                focus: 'Testing methodologies, quality standards, risk assessment',
                promptModifier: 'Focus on quality assurance processes, testing methodologies, quality metrics, risk assessment, and bug tracking. Emphasize quality standards and testing strategies.'
            },
            partners: {
                name: 'External Partners',
                description: 'Publishers, Investors, Platform Holders - Partnership opportunities and requirements',
                focus: 'Partnership benefits, compliance requirements, mutual value',
                promptModifier: 'Focus on partnership opportunities, mutual benefits, compliance requirements, platform considerations, and external stakeholder value. Emphasize collaboration and mutual success.'
            }
        };
        this.init();
    }

    /**
     * Initialize audience manager
     */
    init() {
        this.setupAudienceCards();
        this.setupSaveButton();
        this.setupResetButton();
        this.loadSavedSettings();
    }

    /**
     * Set up audience card interactions
     */
    setupAudienceCards() {
        const audienceCards = document.querySelectorAll('.audience-card');
        
        audienceCards.forEach(card => {
            const checkbox = card.querySelector('.audience-checkbox');
            const audienceType = card.getAttribute('data-audience');
            
            // Handle card click
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking directly on checkbox
                if (e.target === checkbox) return;
                
                checkbox.checked = !checkbox.checked;
                this.toggleAudience(audienceType, checkbox.checked);
            });
            
            // Handle checkbox change
            checkbox.addEventListener('change', (e) => {
                this.toggleAudience(audienceType, e.target.checked);
            });
        });
    }

    /**
     * Set up save button
     */
    setupSaveButton() {
        const saveBtn = document.getElementById('save-audience-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
    }

    /**
     * Set up reset button
     */
    setupResetButton() {
        const resetBtn = document.getElementById('reset-audience-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }

    /**
     * Toggle audience selection
     * @param {string} audienceType - Type of audience
     * @param {boolean} selected - Whether selected
     */
    toggleAudience(audienceType, selected) {
        const card = document.querySelector(`[data-audience="${audienceType}"]`);
        const checkbox = card?.querySelector('.audience-checkbox');
        
        if (selected) {
            this.selectedAudiences.add(audienceType);
            card?.classList.add('selected');
            if (checkbox) checkbox.checked = true;
        } else {
            this.selectedAudiences.delete(audienceType);
            card?.classList.remove('selected');
            if (checkbox) checkbox.checked = false;
        }
        
        this.updateSaveButtonState();
        console.log('Audience selection updated:', Array.from(this.selectedAudiences));
    }

    /**
     * Get selected audiences
     * @returns {Array} Array of selected audience types
     */
    getSelectedAudiences() {
        return Array.from(this.selectedAudiences);
    }

    /**
     * Get audience information
     * @param {string} audienceType - Type of audience
     * @returns {Object|null} Audience information
     */
    getAudienceInfo(audienceType) {
        return this.audienceTypes[audienceType] || null;
    }

    /**
     * Get all audience types
     * @returns {Object} All audience type definitions
     */
    getAllAudienceTypes() {
        return { ...this.audienceTypes };
    }

    /**
     * Generate audience-specific prompt modifier
     * @returns {string} Prompt modifier text
     */
    generatePromptModifier() {
        if (this.selectedAudiences.size === 0) {
            return '';
        }

        const selectedTypes = Array.from(this.selectedAudiences);
        const modifiers = selectedTypes.map(type => {
            const audience = this.audienceTypes[type];
            return audience ? audience.promptModifier : '';
        }).filter(modifier => modifier);

        if (modifiers.length === 0) {
            return '';
        }

        if (modifiers.length === 1) {
            return `\n\nAudience Context: ${modifiers[0]}`;
        }

        return `\n\nAudience Context: This presentation is for multiple stakeholders including ${selectedTypes.map(type => this.audienceTypes[type]?.name).join(', ')}. Please balance the content to address:\n${modifiers.map((modifier, index) => `${index + 1}. ${modifier}`).join('\n')}`;
    }

    /**
     * Get audience summary for display
     * @returns {string} Summary of selected audiences
     */
    getAudienceSummary() {
        if (this.selectedAudiences.size === 0) {
            return 'No specific audience selected';
        }

        const selectedNames = Array.from(this.selectedAudiences).map(type => {
            return this.audienceTypes[type]?.name || type;
        });

        if (selectedNames.length === 1) {
            return selectedNames[0];
        }

        if (selectedNames.length === 2) {
            return selectedNames.join(' and ');
        }

        return selectedNames.slice(0, -1).join(', ') + ', and ' + selectedNames[selectedNames.length - 1];
    }

    /**
     * Check if any audiences are selected
     * @returns {boolean} Whether any audiences are selected
     */
    hasSelectedAudiences() {
        return this.selectedAudiences.size > 0;
    }

    /**
     * Set selected audiences
     * @param {Array} audiences - Array of audience types to select
     */
    setSelectedAudiences(audiences) {
        // Clear current selection
        this.selectedAudiences.clear();
        
        // Clear UI
        document.querySelectorAll('.audience-card').forEach(card => {
            card.classList.remove('selected');
            const checkbox = card.querySelector('.audience-checkbox');
            if (checkbox) checkbox.checked = false;
        });

        // Set new selection
        audiences.forEach(audienceType => {
            if (this.audienceTypes[audienceType]) {
                this.toggleAudience(audienceType, true);
            }
        });
    }

    /**
     * Update save button state
     */
    updateSaveButtonState() {
        const saveBtn = document.getElementById('save-audience-settings');
        if (saveBtn) {
            // Enable save button if there are changes
            saveBtn.disabled = false;
        }
    }

    /**
     * Save audience settings
     */
    saveSettings() {
        try {
            const settings = {
                selectedAudiences: Array.from(this.selectedAudiences),
                savedAt: new Date().toISOString()
            };
            
            localStorage.setItem('powerpoint_generator_audience_settings', JSON.stringify(settings));
            
            // Show success notification
            if (window.app && typeof window.app.showNotification === 'function') {
                window.app.showNotification(
                    `Audience settings saved for: ${this.getAudienceSummary()}`,
                    'success'
                );
            }
            
            console.log('Audience settings saved:', settings);
            
        } catch (error) {
            console.error('Failed to save audience settings:', error);
            
            if (window.app && typeof window.app.showNotification === 'function') {
                window.app.showNotification('Failed to save audience settings', 'error');
            }
        }
    }

    /**
     * Load saved audience settings
     */
    loadSavedSettings() {
        try {
            const savedSettings = localStorage.getItem('powerpoint_generator_audience_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                if (settings.selectedAudiences && Array.isArray(settings.selectedAudiences)) {
                    this.setSelectedAudiences(settings.selectedAudiences);
                    console.log('Loaded audience settings:', settings.selectedAudiences);
                }
            }
        } catch (error) {
            console.warn('Failed to load audience settings:', error);
        }
    }

    /**
     * Reset audience settings to default
     */
    resetSettings() {
        const confirmed = confirm('Are you sure you want to reset audience settings? This will clear all selected audiences.');
        if (!confirmed) return;
        
        // Clear selection
        this.selectedAudiences.clear();
        
        // Update UI
        document.querySelectorAll('.audience-card').forEach(card => {
            card.classList.remove('selected');
            const checkbox = card.querySelector('.audience-checkbox');
            if (checkbox) checkbox.checked = false;
        });
        
        // Clear saved settings
        try {
            localStorage.removeItem('powerpoint_generator_audience_settings');
        } catch (error) {
            console.warn('Failed to clear saved audience settings:', error);
        }
        
        // Show notification
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification('Audience settings reset to default', 'success');
        }
        
        console.log('Audience settings reset');
    }

    /**
     * Get audience-specific content suggestions
     * @param {string} contentType - Type of content ('title', 'bullet', 'conclusion')
     * @returns {Array} Array of suggestions
     */
    getContentSuggestions(contentType) {
        const suggestions = [];
        
        this.selectedAudiences.forEach(audienceType => {
            const audience = this.audienceTypes[audienceType];
            if (!audience) return;
            
            switch (contentType) {
                case 'title':
                    suggestions.push(...this.getTitleSuggestions(audienceType));
                    break;
                case 'bullet':
                    suggestions.push(...this.getBulletSuggestions(audienceType));
                    break;
                case 'conclusion':
                    suggestions.push(...this.getConclusionSuggestions(audienceType));
                    break;
            }
        });
        
        return [...new Set(suggestions)]; // Remove duplicates
    }

    /**
     * Get title suggestions for audience type
     * @param {string} audienceType - Audience type
     * @returns {Array} Title suggestions
     */
    getTitleSuggestions(audienceType) {
        const suggestions = {
            executive: ['Strategic Overview', 'Business Impact', 'ROI Analysis', 'Market Opportunity'],
            development: ['Technical Implementation', 'Development Roadmap', 'Architecture Overview', 'Technical Specifications'],
            product: ['Product Strategy', 'User Experience', 'Feature Roadmap', 'Market Analysis'],
            marketing: ['Marketing Strategy', 'Brand Positioning', 'Campaign Overview', 'Audience Analysis'],
            qa: ['Quality Assurance', 'Testing Strategy', 'Quality Metrics', 'Risk Assessment'],
            partners: ['Partnership Opportunities', 'Collaboration Benefits', 'Platform Integration', 'Mutual Value']
        };
        
        return suggestions[audienceType] || [];
    }

    /**
     * Get bullet point suggestions for audience type
     * @param {string} audienceType - Audience type
     * @returns {Array} Bullet suggestions
     */
    getBulletSuggestions(audienceType) {
        const suggestions = {
            executive: ['Revenue impact', 'Cost savings', 'Market share', 'Competitive advantage'],
            development: ['Technical requirements', 'Implementation timeline', 'Resource needs', 'Technical risks'],
            product: ['User benefits', 'Feature priorities', 'User feedback', 'Product metrics'],
            marketing: ['Target demographics', 'Marketing channels', 'Campaign metrics', 'Brand messaging'],
            qa: ['Testing coverage', 'Quality standards', 'Bug metrics', 'Risk mitigation'],
            partners: ['Partnership benefits', 'Integration requirements', 'Compliance needs', 'Success metrics']
        };
        
        return suggestions[audienceType] || [];
    }

    /**
     * Get conclusion suggestions for audience type
     * @param {string} audienceType - Audience type
     * @returns {Array} Conclusion suggestions
     */
    getConclusionSuggestions(audienceType) {
        const suggestions = {
            executive: ['Next steps for leadership', 'Investment recommendations', 'Strategic decisions needed'],
            development: ['Development next steps', 'Technical milestones', 'Resource allocation'],
            product: ['Product roadmap', 'User experience improvements', 'Feature prioritization'],
            marketing: ['Marketing action items', 'Campaign launch plan', 'Success measurement'],
            qa: ['Quality assurance plan', 'Testing milestones', 'Quality gates'],
            partners: ['Partnership next steps', 'Integration timeline', 'Success criteria']
        };
        
        return suggestions[audienceType] || [];
    }

    /**
     * Export audience settings
     * @returns {Object} Exportable settings
     */
    exportSettings() {
        return {
            selectedAudiences: Array.from(this.selectedAudiences),
            audienceTypes: this.audienceTypes,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import audience settings
     * @param {Object} settings - Settings to import
     */
    importSettings(settings) {
        if (settings.selectedAudiences && Array.isArray(settings.selectedAudiences)) {
            this.setSelectedAudiences(settings.selectedAudiences);
            this.saveSettings();
        }
    }

    /**
     * Reset audience manager
     */
    reset() {
        this.selectedAudiences.clear();
        
        // Update UI
        document.querySelectorAll('.audience-card').forEach(card => {
            card.classList.remove('selected');
            const checkbox = card.querySelector('.audience-checkbox');
            if (checkbox) checkbox.checked = false;
        });
    }

    /**
     * Destroy audience manager
     */
    destroy() {
        this.reset();
        // Clean up event listeners would go here
    }
}

// Create global instance
const audienceManager = new AudienceManager();

// Make globally available
window.audienceManager = audienceManager;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudienceManager;
}
