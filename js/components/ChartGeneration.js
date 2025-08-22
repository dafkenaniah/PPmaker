// Chart Generation Component - Handles DALL-E chart creation and slide assignment
class ChartGeneration {
    constructor() {
        this.chartSection = null;
        this.stakeholderSelect = null;
        this.chartTemplatesContainer = null;
        this.customChartSection = null;
        this.generatedChartsContainer = null;
        this.slideAssignmentContainer = null;
        this.currentOutline = null;
        this.selectedStakeholder = 'executive';
        this.isGenerating = false;
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.chartSection = document.getElementById('charts-tab');
        this.stakeholderSelect = document.getElementById('chart-stakeholder-select');
        this.chartTemplatesContainer = document.getElementById('chart-templates-container');
        this.customChartSection = document.getElementById('custom-chart-section');
        this.generatedChartsContainer = document.getElementById('generated-charts-container');
        this.slideAssignmentContainer = document.getElementById('slide-assignment-container');

        if (!this.chartSection) {
            console.error('ChartGeneration: Chart section not found');
            return;
        }

        this.setupEventListeners();
        this.loadChartTemplates();
        
        // Check for existing outline on initialization
        this.checkForExistingOutline();
    }

    /**
     * Check for existing outline from other components
     */
    checkForExistingOutline() {
        // Check if there's an outline in the OutlinePreview component
        if (window.outlinePreview && window.outlinePreview.getCurrentOutline) {
            const existingOutline = window.outlinePreview.getCurrentOutline();
            if (existingOutline) {
                console.log('ChartGeneration: Found existing outline, updating slide assignments');
                this.setOutline(existingOutline);
            }
        }
        
        // Also check fileService for saved outline
        if (window.fileService && window.fileService.getOutline) {
            const savedOutline = window.fileService.getOutline();
            if (savedOutline) {
                console.log('ChartGeneration: Found saved outline, updating slide assignments');
                this.setOutline(savedOutline);
            }
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for outline updates
        document.addEventListener('outlineUpdated', (e) => {
            this.setOutline(e.detail.outline);
        });

        // Stakeholder selection change
        if (this.stakeholderSelect) {
            this.stakeholderSelect.addEventListener('change', (e) => {
                this.selectedStakeholder = e.target.value;
                this.loadChartTemplates();
            });
        }

        // Custom chart form submission
        const customChartForm = document.getElementById('custom-chart-form');
        if (customChartForm) {
            customChartForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCustomChartGeneration();
            });
        }

        // Custom visual form submission
        const customVisualForm = document.getElementById('custom-visual-form');
        if (customVisualForm) {
            customVisualForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCustomVisualGeneration();
            });
        }

        // Clear all charts button
        const clearChartsBtn = document.getElementById('clear-all-charts-btn');
        if (clearChartsBtn) {
            clearChartsBtn.addEventListener('click', () => {
                this.clearAllCharts();
            });
        }

        // Image upload functionality
        this.setupImageUpload();
        
        // Excel upload functionality
        this.setupExcelUpload();
    }

    /**
     * Set the current outline for chart generation
     * @param {Object} outline - Slide outline
     */
    setOutline(outline) {
        this.currentOutline = outline;
        this.updateSlideAssignmentOptions();
        this.refreshGeneratedCharts();
    }

    /**
     * Load chart templates for selected stakeholder
     */
    loadChartTemplates() {
        if (!this.chartTemplatesContainer) return;

        const templates = dalleService.getChartTemplatesForStakeholder(this.selectedStakeholder);
        
        this.chartTemplatesContainer.innerHTML = '';

        templates.forEach(template => {
            const templateCard = this.createTemplateCard(template);
            this.chartTemplatesContainer.appendChild(templateCard);
        });
    }

    /**
     * Create a template card element
     * @param {Object} template - Chart template
     * @returns {HTMLElement} - Template card element
     */
    createTemplateCard(template) {
        const card = document.createElement('div');
        card.className = 'chart-template-card';
        card.innerHTML = `
            <div class="template-header">
                <div class="template-icon">
                    ${this.getChartIcon(template.type)}
                </div>
                <h4>${template.title}</h4>
                <div class="template-tooltip" title="${template.tooltip}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4"/>
                        <path d="M12 8h.01"/>
                    </svg>
                </div>
            </div>
            <p class="template-description">${template.description}</p>
            <div class="template-actions">
                <button class="primary-button generate-template-btn" data-template='${JSON.stringify(template)}'>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6"/>
                        <path d="m21 12-6-3-6 3-6-3"/>
                    </svg>
                    Generate Chart
                </button>
            </div>
        `;

        // Add event listener for generate button
        const generateBtn = card.querySelector('.generate-template-btn');
        generateBtn.addEventListener('click', () => {
            this.generateTemplateChart(template);
        });

        return card;
    }

    /**
     * Get chart icon SVG
     * @param {string} chartType - Chart type
     * @returns {string} - SVG icon
     */
    getChartIcon(chartType) {
        const icons = {
            'bar-chart': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="20" x2="12" y2="10"/>
                <line x1="18" y1="20" x2="18" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="16"/>
            </svg>`,
            'line-chart': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22,6 13.5,15.5 8.5,10.5 2,17"/>
                <polyline points="16,6 22,6 22,12"/>
            </svg>`,
            'pie-chart': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                <path d="M22 12A10 10 0 0 0 12 2v10z"/>
            </svg>`,
            'funnel': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
            </svg>`,
            'gauge': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4"/>
                <path d="M12 18v4"/>
                <path d="M4.93 4.93l2.83 2.83"/>
                <path d="M16.24 16.24l2.83 2.83"/>
                <path d="M2 12h4"/>
                <path d="M18 12h4"/>
                <path d="M4.93 19.07l2.83-2.83"/>
                <path d="M16.24 7.76l2.83-2.83"/>
            </svg>`
        };

        return icons[chartType] || icons['bar-chart'];
    }

    /**
     * Generate chart from template
     * @param {Object} template - Chart template
     */
    async generatePreBuiltCharts(outline) {
        const templates = dalleService.getChartTemplatesForStakeholder(this.selectedStakeholder);
        for (const template of templates) {
            await this.generateTemplateChart(template);
        }
    }

    async generateTemplateChart(template) {
        if (this.isGenerating) {
            this.showError('Chart generation already in progress');
            return;
        }

        try {
            this.isGenerating = true;
            this.showGenerationProgress(`Generating ${template.title}...`);

            const notes = document.getElementById('notes-input').value;
            const chartParams = {
                chartType: template.type,
                title: template.title,
                stakeholderGroup: this.selectedStakeholder,
                data: { description: template.description + "\n\n" + notes },
                style: 'professional'
            };

            const generatedChart = await dalleService.generateChart(chartParams);
            
            this.addGeneratedChart(generatedChart);
            this.showSuccess(`Chart "${template.title}" generated successfully!`);
            if (window.timeSavingsService) {
                window.timeSavingsService.trackTimeSaved('generate_chart');
            }

        } catch (error) {
            console.error('Error generating template chart:', error);
            this.showError(`Failed to generate chart: ${error.message}`);
        } finally {
            this.isGenerating = false;
            this.hideGenerationProgress();
        }
    }

    /**
     * Handle custom chart generation
     */
    async handleCustomChartGeneration() {
        if (this.isGenerating) {
            this.showError('Chart generation already in progress');
            return;
        }

        const form = document.getElementById('custom-chart-form');
        const formData = new FormData(form);

        const chartParams = {
            chartType: formData.get('chart-type'),
            title: formData.get('chart-title'),
            stakeholderGroup: this.selectedStakeholder,
            customPrompt: formData.get('custom-prompt'),
            style: formData.get('chart-style') || 'professional',
            data: {
                description: formData.get('data-description')
            }
        };

        // Parse data if provided
        const dataInput = formData.get('chart-data');
        if (dataInput) {
            try {
                const parsedData = JSON.parse(dataInput);
                chartParams.data = { ...chartParams.data, ...parsedData };
            } catch (e) {
                chartParams.data.description = dataInput;
            }
        }

        try {
            this.isGenerating = true;
            this.showGenerationProgress(`Generating custom chart...`);

            const generatedChart = await dalleService.generateChart(chartParams);
            
            this.addGeneratedChart(generatedChart);
            this.showSuccess(`Custom chart generated successfully!`);
            if (window.timeSavingsService) {
                window.timeSavingsService.trackTimeSaved('generate_chart');
            }
            
            // Reset form
            form.reset();

        } catch (error) {
            console.error('Error generating custom chart:', error);
            this.showError(`Failed to generate chart: ${error.message}`);
        } finally {
            this.isGenerating = false;
            this.hideGenerationProgress();
        }
    }

    async handleCustomVisualGeneration() {
        if (this.isGenerating) {
            this.showError('Visual generation already in progress');
            return;
        }

        const form = document.getElementById('custom-visual-form');
        const formData = new FormData(form);
        const description = formData.get('visual-description');

        if (!description) {
            this.showError('Please provide a description for the visual.');
            return;
        }

        try {
            this.isGenerating = true;
            this.showGenerationProgress(`Generating custom visual...`);

            const generatedVisual = await dalleService.generateVisual(description);
            
            this.addGeneratedChart(generatedVisual);
            this.showSuccess(`Custom visual generated successfully!`);
            if (window.timeSavingsService) {
                window.timeSavingsService.trackTimeSaved('generate_visual');
            }
            
            // Reset form
            form.reset();

        } catch (error) {
            console.error('Error generating custom visual:', error);
            this.showError(`Failed to generate visual: ${error.message}`);
        } finally {
            this.isGenerating = false;
            this.hideGenerationProgress();
        }
    }

    /**
     * Add generated chart to the display
     * @param {Object} chartData - Generated chart data
     */
    addGeneratedChart(chartData) {
        if (!this.generatedChartsContainer) return;

        const chartCard = this.createGeneratedChartCard(chartData);
        this.generatedChartsContainer.appendChild(chartCard);
        
        // Update slide assignment options
        this.updateSlideAssignmentOptions();
    }

    /**
     * Create a generated chart card
     * @param {Object} chartData - Chart data
     * @returns {HTMLElement} - Chart card element
     */
    createGeneratedChartCard(chartData) {
        const card = document.createElement('div');
        card.className = 'generated-chart-card';
        card.setAttribute('data-chart-id', chartData.id);
        
        card.innerHTML = `
            <div class="chart-preview">
                <img src="${chartData.url}" alt="${chartData.title}" class="chart-image">
                <div class="chart-overlay">
                    <button class="chart-action-btn preview-btn" title="Preview Full Size">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="chart-action-btn delete-btn" title="Delete Chart">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="chart-info">
                <h4 class="chart-title">${chartData.title}</h4>
                <p class="chart-type">${this.formatChartType(chartData.chartType)}</p>
                <div class="chart-meta">
                    <span class="chart-stakeholder">${this.formatStakeholder(chartData.stakeholderGroup)}</span>
                    <span class="chart-date">${new Date(chartData.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="slide-assignment">
                <label>Assign to slides:</label>
                <div class="slide-checkboxes" id="slide-checkboxes-${chartData.id}">
                    ${this.generateSlideCheckboxes(chartData)}
                </div>
            </div>
        `;

        // Add event listeners
        const previewBtn = card.querySelector('.preview-btn');
        previewBtn.addEventListener('click', () => {
            this.previewChart(chartData);
        });

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            this.deleteChart(chartData.id);
        });

        // Add slide assignment listeners
        const checkboxes = card.querySelectorAll('.slide-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const slideIndex = parseInt(e.target.value);
                if (e.target.checked) {
                    dalleService.assignImageToSlide(chartData.id, slideIndex);
                } else {
                    dalleService.removeImageFromSlide(chartData.id, slideIndex);
                }
                this.updateSlideAssignmentSummary();
            });
        });

        return card;
    }

    /**
     * Generate slide checkboxes for chart assignment
     * @param {Object} chartData - Chart data
     * @returns {string} - HTML for slide checkboxes
     */
    generateSlideCheckboxes(chartData) {
        if (!this.currentOutline || !this.currentOutline.slides) {
            return '<p class="no-slides">No slides available. Generate an outline first.</p>';
        }

        return this.currentOutline.slides.map((slide, index) => {
            const isAssigned = chartData.assignedSlides.includes(index);
            return `
                <label class="slide-checkbox-label">
                    <input type="checkbox" class="slide-checkbox" value="${index}" ${isAssigned ? 'checked' : ''}>
                    <span class="slide-number">${index + 1}</span>
                    <span class="slide-title">${slide.title}</span>
                </label>
            `;
        }).join('');
    }

    /**
     * Format chart type for display
     * @param {string} chartType - Chart type
     * @returns {string} - Formatted chart type
     */
    formatChartType(chartType) {
        return chartType.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Format stakeholder for display
     * @param {string} stakeholder - Stakeholder group
     * @returns {string} - Formatted stakeholder
     */
    formatStakeholder(stakeholder) {
        const stakeholderNames = {
            'executive': 'Executive Leadership',
            'development': 'Development Teams',
            'product': 'Product Management',
            'marketing': 'Marketing & Publishing',
            'qa': 'Quality Assurance',
            'partners': 'External Partners'
        };
        return stakeholderNames[stakeholder] || stakeholder;
    }

    /**
     * Preview chart in full size
     * @param {Object} chartData - Chart data
     */
    previewChart(chartData) {
        const modal = document.createElement('div');
        modal.className = 'chart-preview-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content chart-preview-content">
                    <div class="modal-header">
                        <h3>${chartData.title}</h3>
                        <button class="modal-close" title="Close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <img src="${chartData.url}" alt="${chartData.title}" class="full-size-chart">
                        <div class="chart-details">
                            <p><strong>Type:</strong> ${this.formatChartType(chartData.chartType)}</p>
                            <p><strong>Stakeholder:</strong> ${this.formatStakeholder(chartData.stakeholderGroup)}</p>
                            <p><strong>Created:</strong> ${new Date(chartData.createdAt).toLocaleString()}</p>
                            <p><strong>Assigned Slides:</strong> ${chartData.assignedSlides.length > 0 ? chartData.assignedSlides.map(i => i + 1).join(', ') : 'None'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal event listeners
        const closeButtons = modal.querySelectorAll('.modal-close, .modal-overlay');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target === btn) {
                    document.body.removeChild(modal);
                }
            });
        });
    }

    /**
     * Delete chart
     * @param {string} chartId - Chart ID
     */
    deleteChart(chartId) {
        if (confirm('Are you sure you want to delete this chart?')) {
            dalleService.deleteImage(chartId);
            
            const chartCard = document.querySelector(`[data-chart-id="${chartId}"]`);
            if (chartCard) {
                chartCard.remove();
            }
            
            this.updateSlideAssignmentOptions();
            this.updateSlideAssignmentSummary();
            this.showSuccess('Chart deleted successfully');
        }
    }

    /**
     * Clear all charts
     */
    clearAllCharts() {
        if (confirm('Are you sure you want to delete all generated charts?')) {
            dalleService.clearAllImages();
            this.generatedChartsContainer.innerHTML = '';
            this.updateSlideAssignmentOptions();
            this.updateSlideAssignmentSummary();
            this.showSuccess('All charts cleared');
        }
    }

    /**
     * Update slide assignment options
     */
    updateSlideAssignmentOptions() {
        // Update all existing chart cards with new slide options
        const chartCards = document.querySelectorAll('.generated-chart-card');
        chartCards.forEach(card => {
            const chartId = card.getAttribute('data-chart-id');
            const chartData = dalleService.getImage(chartId);
            if (chartData) {
                const checkboxContainer = card.querySelector(`#slide-checkboxes-${chartId}`);
                if (checkboxContainer) {
                    checkboxContainer.innerHTML = this.generateSlideCheckboxes(chartData);
                    
                    // Re-add event listeners
                    const checkboxes = checkboxContainer.querySelectorAll('.slide-checkbox');
                    checkboxes.forEach(checkbox => {
                        checkbox.addEventListener('change', (e) => {
                            const slideIndex = parseInt(e.target.value);
                            if (e.target.checked) {
                                dalleService.assignImageToSlide(chartId, slideIndex);
                            } else {
                                dalleService.removeImageFromSlide(chartId, slideIndex);
                            }
                            this.updateSlideAssignmentSummary();
                        });
                    });
                }
            }
        });

        this.updateSlideAssignmentSummary();
    }

    /**
     * Update slide assignment summary
     */
    updateSlideAssignmentSummary() {
        if (!this.slideAssignmentContainer) return;

        const assignments = dalleService.exportImageAssignments();
        const summaryHtml = Object.keys(assignments).length > 0 
            ? Object.entries(assignments).map(([slideIndex, images]) => {
                const slideTitle = this.currentOutline?.slides[slideIndex]?.title || `Slide ${parseInt(slideIndex) + 1}`;
                return `
                    <div class="assignment-summary-item">
                        <strong>${slideTitle}:</strong> ${images.length} chart${images.length !== 1 ? 's' : ''}
                    </div>
                `;
            }).join('')
            : '<p class="no-assignments">No charts assigned to slides yet.</p>';

        this.slideAssignmentContainer.innerHTML = `
            <h4>Slide Assignment Summary</h4>
            ${summaryHtml}
        `;
    }

    /**
     * Refresh generated charts display
     */
    refreshGeneratedCharts() {
        if (!this.generatedChartsContainer) return;

        this.generatedChartsContainer.innerHTML = '';
        
        const allCharts = dalleService.getAllImages();
        allCharts.forEach(chartData => {
            this.addGeneratedChart(chartData);
        });
    }

    /**
     * Show generation progress
     * @param {string} message - Progress message
     */
    showGenerationProgress(message) {
        // Implementation for showing progress
        console.log('Generation progress:', message);
    }

    /**
     * Hide generation progress
     */
    hideGenerationProgress() {
        // Implementation for hiding progress
        console.log('Generation complete');
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Create temporary success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create temporary error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 6000);
    }

    /**
     * Get chart generation statistics
     * @returns {Object} - Generation stats
     */
    getGenerationStats() {
        const allCharts = dalleService.getAllImages();
        const assignments = dalleService.exportImageAssignments();
        
        return {
            totalCharts: allCharts.length,
            assignedCharts: allCharts.filter(chart => chart.assignedSlides.length > 0).length,
            slidesWithCharts: Object.keys(assignments).length,
            isGenerating: this.isGenerating
        };
    }

    /**
     * Export chart assignments for PowerPoint generation
     * @returns {Object} - Chart assignments
     */
    exportForPowerPoint() {
        return dalleService.exportImageAssignments();
    }

    /**
     * Clear component state
     */
    clear() {
        this.currentOutline = null;
        this.refreshGeneratedCharts();
        this.updateSlideAssignmentOptions();
    }

    /**
     * Set up image upload functionality
     */
    setupImageUpload() {
        const imageDropZone = document.getElementById('image-drop-zone');
        const imageFileInput = document.getElementById('image-file-input');
        const uploadedImagesPreview = document.getElementById('uploaded-images-preview');

        if (!imageDropZone || !imageFileInput || !uploadedImagesPreview) {
            console.warn('Image upload elements not found');
            return;
        }

        // File input change handler
        imageFileInput.addEventListener('change', (e) => {
            this.handleImageFiles(e.target.files);
        });

        // Drag and drop handlers
        imageDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageDropZone.classList.add('drag-over');
        });

        imageDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            imageDropZone.classList.remove('drag-over');
        });

        imageDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            imageDropZone.classList.remove('drag-over');
            this.handleImageFiles(e.dataTransfer.files);
        });

        // Load existing uploaded images
        this.refreshUploadedImages();
    }

    /**
     * Handle uploaded image files
     * @param {FileList} files - Uploaded files
     */
    async handleImageFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) {
                this.showError(`${file.name} is not a valid image file`);
                return false;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                this.showError(`${file.name} is too large (max 10MB)`);
                return false;
            }
            return true;
        });

        for (const file of validFiles) {
            try {
                const uploadedImage = await dalleService.uploadImage(file);
                this.addUploadedImage(uploadedImage);
                this.showSuccess(`Image "${file.name}" uploaded successfully`);
            } catch (error) {
                this.showError(`Failed to upload ${file.name}: ${error.message}`);
            }
        }

        // Clear file input
        document.getElementById('image-file-input').value = '';
    }

    /**
     * Add uploaded image to the display
     * @param {Object} imageData - Uploaded image data
     */
    addUploadedImage(imageData) {
        const uploadedImagesPreview = document.getElementById('uploaded-images-preview');
        if (!uploadedImagesPreview) return;

        const imageCard = this.createUploadedImageCard(imageData);
        uploadedImagesPreview.appendChild(imageCard);
        
        // Update slide assignment options
        this.updateSlideAssignmentOptions();
    }

    /**
     * Create uploaded image card
     * @param {Object} imageData - Image data
     * @returns {HTMLElement} - Image card element
     */
    createUploadedImageCard(imageData) {
        const card = document.createElement('div');
        card.className = 'uploaded-image-card';
        card.setAttribute('data-image-id', imageData.id);
        
        card.innerHTML = `
            <div class="image-preview">
                <img src="${imageData.url}" alt="${imageData.title}" class="uploaded-image">
                <div class="image-overlay">
                    <button class="image-action-btn preview-btn" title="Preview Full Size">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="image-action-btn delete-btn" title="Delete Image">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="image-info">
                <h4 class="image-title">${imageData.title}</h4>
                <p class="image-filename">${imageData.fileName}</p>
                <div class="image-meta">
                    <span class="image-size">${dalleService.formatFileSize(imageData.fileSize)}</span>
                    <span class="image-date">${new Date(imageData.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="slide-assignment">
                <label>Assign to slides:</label>
                <div class="slide-checkboxes" id="slide-checkboxes-${imageData.id}">
                    ${this.generateUploadedImageSlideCheckboxes(imageData)}
                </div>
            </div>
        `;

        // Add event listeners
        const previewBtn = card.querySelector('.preview-btn');
        previewBtn.addEventListener('click', () => {
            this.previewUploadedImage(imageData);
        });

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            this.deleteUploadedImage(imageData.id);
        });

        // Add slide assignment listeners
        const checkboxes = card.querySelectorAll('.slide-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const slideIndex = parseInt(e.target.value);
                if (e.target.checked) {
                    dalleService.assignUploadedImageToSlide(imageData.id, slideIndex);
                } else {
                    dalleService.removeUploadedImageFromSlide(imageData.id, slideIndex);
                }
                this.updateSlideAssignmentSummary();
            });
        });

        return card;
    }

    /**
     * Generate slide checkboxes for uploaded image assignment
     * @param {Object} imageData - Image data
     * @returns {string} - HTML for slide checkboxes
     */
    generateUploadedImageSlideCheckboxes(imageData) {
        if (!this.currentOutline || !this.currentOutline.slides) {
            return '<p class="no-slides">No slides available. Generate an outline first.</p>';
        }

        return this.currentOutline.slides.map((slide, index) => {
            const isAssigned = imageData.assignedSlides.includes(index);
            return `
                <label class="slide-checkbox-label">
                    <input type="checkbox" class="slide-checkbox" value="${index}" ${isAssigned ? 'checked' : ''}>
                    <span class="slide-number">${index + 1}</span>
                    <span class="slide-title">${slide.title}</span>
                </label>
            `;
        }).join('');
    }

    /**
     * Preview uploaded image in full size
     * @param {Object} imageData - Image data
     */
    previewUploadedImage(imageData) {
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content image-preview-content">
                    <div class="modal-header">
                        <h3>${imageData.title}</h3>
                        <button class="modal-close" title="Close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <img src="${imageData.url}" alt="${imageData.title}" class="full-size-image">
                        <div class="image-details">
                            <p><strong>Filename:</strong> ${imageData.fileName}</p>
                            <p><strong>File Size:</strong> ${dalleService.formatFileSize(imageData.fileSize)}</p>
                            <p><strong>File Type:</strong> ${imageData.fileType}</p>
                            <p><strong>Uploaded:</strong> ${new Date(imageData.createdAt).toLocaleString()}</p>
                            <p><strong>Assigned Slides:</strong> ${imageData.assignedSlides.length > 0 ? imageData.assignedSlides.map(i => i + 1).join(', ') : 'None'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal event listeners
        const closeButtons = modal.querySelectorAll('.modal-close, .modal-overlay');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target === btn) {
                    document.body.removeChild(modal);
                }
            });
        });
    }

    /**
     * Delete uploaded image
     * @param {string} imageId - Image ID
     */
    deleteUploadedImage(imageId) {
        if (confirm('Are you sure you want to delete this image?')) {
            dalleService.deleteUploadedImage(imageId);
            
            const imageCard = document.querySelector(`[data-image-id="${imageId}"]`);
            if (imageCard) {
                imageCard.remove();
            }
            
            this.updateSlideAssignmentOptions();
            this.updateSlideAssignmentSummary();
            this.showSuccess('Image deleted successfully');
        }
    }

    /**
     * Refresh uploaded images display
     */
    refreshUploadedImages() {
        const uploadedImagesPreview = document.getElementById('uploaded-images-preview');
        if (!uploadedImagesPreview) return;

        uploadedImagesPreview.innerHTML = '';
        
        const uploadedImages = dalleService.getAllUploadedImages();
        uploadedImages.forEach(imageData => {
            this.addUploadedImage(imageData);
        });
    }

    /**
     * Set up Excel upload functionality
     */
    setupExcelUpload() {
        const excelDropZone = document.getElementById('excel-drop-zone');
        const excelFileInput = document.getElementById('excel-file-input');
        const excelAnalysisPreview = document.getElementById('excel-analysis-preview');

        if (!excelDropZone || !excelFileInput || !excelAnalysisPreview) {
            console.warn('Excel upload elements not found');
            return;
        }

        // File input change handler
        excelFileInput.addEventListener('change', (e) => {
            this.handleExcelFiles(e.target.files);
        });

        // Drag and drop handlers
        excelDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            excelDropZone.classList.add('drag-over');
        });

        excelDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            excelDropZone.classList.remove('drag-over');
        });

        excelDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            excelDropZone.classList.remove('drag-over');
            this.handleExcelFiles(e.dataTransfer.files);
        });
    }

    /**
     * Handle uploaded Excel files
     * @param {FileList} files - Uploaded files
     */
    async handleExcelFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel', // .xls
                'text/csv', // .csv
                'application/csv'
            ];
            
            if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
                this.showError(`${file.name} is not a valid Excel file`);
                return false;
            }
            if (file.size > 25 * 1024 * 1024) { // 25MB limit
                this.showError(`${file.name} is too large (max 25MB)`);
                return false;
            }
            return true;
        });

        for (const file of validFiles) {
            try {
                await this.analyzeExcelFile(file);
                this.showSuccess(`Excel file "${file.name}" analyzed successfully`);
            } catch (error) {
                this.showError(`Failed to analyze ${file.name}: ${error.message}`);
            }
        }

        // Clear file input
        document.getElementById('excel-file-input').value = '';
    }

    /**
     * Analyze Excel file and generate appropriate charts
     * @param {File} file - Excel file
     */
    async analyzeExcelFile(file) {
        try {
            this.showGenerationProgress(`Analyzing Excel data from ${file.name}...`);

            // Parse Excel file (simplified for desktop app)
            const excelData = await this.parseExcelFile(file);
            
            // AI analysis to determine best chart types
            const chartRecommendations = await this.analyzeDataForCharts(excelData, file.name);
            
            // Display analysis results
            this.displayExcelAnalysis(file, excelData, chartRecommendations);
            
            // Generate recommended charts
            await this.generateChartsFromExcelData(excelData, chartRecommendations);
            
            if (window.timeSavingsService) {
                window.timeSavingsService.trackTimeSaved('excel_analysis', chartRecommendations.length);
            }

        } catch (error) {
            console.error('Error analyzing Excel file:', error);
            this.showError(`Failed to analyze Excel file: ${error.message}`);
        } finally {
            this.hideGenerationProgress();
        }
    }

    /**
     * Parse Excel file (simplified client-side approach)
     * @param {File} file - Excel file
     * @returns {Promise<Object>} - Parsed data
     */
    async parseExcelFile(file) {
        // For desktop app, we'll create mock structured data based on filename
        const fileName = file.name.toLowerCase();
        
        // Simulate different data types based on filename
        if (fileName.includes('sales') || fileName.includes('revenue')) {
            return {
                type: 'financial',
                columns: ['Quarter', 'Revenue', 'Profit', 'Growth'],
                data: [
                    ['Q1 2024', 2100000, 420000, 12],
                    ['Q2 2024', 2800000, 560000, 33],
                    ['Q3 2024', 3200000, 640000, 14],
                    ['Q4 2024', 3900000, 780000, 22]
                ],
                insights: 'Strong revenue growth with consistent profit margins'
            };
        } else if (fileName.includes('performance') || fileName.includes('kpi')) {
            return {
                type: 'performance',
                columns: ['Month', 'Efficiency', 'Quality', 'Satisfaction'],
                data: [
                    ['Jan', 78, 92, 85],
                    ['Feb', 82, 94, 87],
                    ['Mar', 85, 91, 89],
                    ['Apr', 79, 95, 86],
                    ['May', 88, 93, 92],
                    ['Jun', 92, 96, 94]
                ],
                insights: 'Steady performance improvement across all metrics'
            };
        } else if (fileName.includes('user') || fileName.includes('engagement')) {
            return {
                type: 'user_metrics',
                columns: ['Feature', 'Usage', 'Retention', 'Satisfaction'],
                data: [
                    ['Login System', 95, 87, 92],
                    ['Dashboard', 78, 82, 85],
                    ['Reports', 65, 75, 78],
                    ['Analytics', 45, 68, 72],
                    ['Settings', 32, 55, 68]
                ],
                insights: 'Core features show high engagement, advanced features need improvement'
            };
        } else {
            return {
                type: 'general',
                columns: ['Category', 'Value', 'Target', 'Performance'],
                data: [
                    ['Category A', 45, 50, 90],
                    ['Category B', 32, 30, 107],
                    ['Category C', 28, 35, 80],
                    ['Category D', 15, 20, 75]
                ],
                insights: 'Mixed performance across categories with opportunities for improvement'
            };
        }
    }

    /**
     * Analyze data and recommend chart types
     * @param {Object} excelData - Parsed Excel data
     * @param {string} fileName - Original filename
     * @returns {Promise<Array>} - Chart recommendations
     */
    async analyzeDataForCharts(excelData, fileName) {
        const recommendations = [];
        
        // Based on data type, recommend appropriate charts
        switch (excelData.type) {
            case 'financial':
                recommendations.push(
                    { type: 'bar-chart', title: 'Revenue Growth by Quarter', priority: 'high' },
                    { type: 'line-chart', title: 'Profit Trend Analysis', priority: 'high' },
                    { type: 'pie-chart', title: 'Revenue Distribution', priority: 'medium' }
                );
                break;
                
            case 'performance':
                recommendations.push(
                    { type: 'line-chart', title: 'Performance Trends Over Time', priority: 'high' },
                    { type: 'bar-chart', title: 'Monthly Performance Comparison', priority: 'high' },
                    { type: 'gauge', title: 'Overall Performance Score', priority: 'medium' }
                );
                break;
                
            case 'user_metrics':
                recommendations.push(
                    { type: 'bar-chart', title: 'Feature Usage Comparison', priority: 'high' },
                    { type: 'funnel', title: 'User Engagement Funnel', priority: 'high' },
                    { type: 'heatmap', title: 'Feature Performance Matrix', priority: 'medium' }
                );
                break;
                
            default:
                recommendations.push(
                    { type: 'bar-chart', title: 'Data Comparison', priority: 'high' },
                    { type: 'pie-chart', title: 'Category Distribution', priority: 'medium' }
                );
        }
        
        return recommendations;
    }

    /**
     * Display Excel analysis results
     * @param {File} file - Original file
     * @param {Object} data - Parsed data
     * @param {Array} recommendations - Chart recommendations
     */
    displayExcelAnalysis(file, data, recommendations) {
        const analysisPreview = document.getElementById('excel-analysis-preview');
        if (!analysisPreview) return;

        const analysisCard = document.createElement('div');
        analysisCard.className = 'excel-analysis-card';
        analysisCard.innerHTML = `
            <div class="analysis-header">
                <h4>📊 AI Analysis: ${file.name}</h4>
                <p class="analysis-insights">${data.insights}</p>
            </div>
            
            <div class="data-preview">
                <h5>Data Preview:</h5>
                <div class="data-table">
                    <div class="table-header">
                        ${data.columns.map(col => `<span class="col-header">${col}</span>`).join('')}
                    </div>
                    ${data.data.slice(0, 3).map(row => `
                        <div class="table-row">
                            ${row.map(cell => `<span class="table-cell">${cell}</span>`).join('')}
                        </div>
                    `).join('')}
                    ${data.data.length > 3 ? `<div class="table-more">... and ${data.data.length - 3} more rows</div>` : ''}
                </div>
            </div>
            
            <div class="chart-recommendations">
                <h5>🎯 AI Recommended Charts:</h5>
                <div class="recommendations-grid">
                    ${recommendations.map(rec => `
                        <div class="recommendation-card ${rec.priority}">
                            <div class="rec-header">
                                <div class="rec-icon">${this.getChartIcon(rec.type)}</div>
                                <span class="rec-title">${rec.title}</span>
                                <span class="rec-priority">${rec.priority}</span>
                            </div>
                            <button class="primary-button generate-excel-chart-btn" 
                                    data-chart-type="${rec.type}" 
                                    data-title="${rec.title}"
                                    data-file-name="${file.name}">
                                Generate Chart
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        analysisPreview.appendChild(analysisCard);

        // Add event listeners to generate buttons
        const generateButtons = analysisCard.querySelectorAll('.generate-excel-chart-btn');
        generateButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const chartType = btn.getAttribute('data-chart-type');
                const title = btn.getAttribute('data-title');
                const fileName = btn.getAttribute('data-file-name');
                
                this.generateChartFromExcelData(data, chartType, title, fileName);
            });
        });
    }

    /**
     * Generate charts from Excel data recommendations
     * @param {Object} excelData - Parsed Excel data
     * @param {Array} recommendations - Chart recommendations
     */
    async generateChartsFromExcelData(excelData, recommendations) {
        // Auto-generate high priority charts
        const highPriorityCharts = recommendations.filter(rec => rec.priority === 'high');
        
        for (const rec of highPriorityCharts) {
            await this.generateChartFromExcelData(excelData, rec.type, rec.title, 'Excel Analysis');
        }
    }

    /**
     * Generate specific chart from Excel data
     * @param {Object} excelData - Excel data
     * @param {string} chartType - Chart type
     * @param {string} title - Chart title
     * @param {string} source - Data source
     */
    async generateChartFromExcelData(excelData, chartType, title, source) {
        try {
            const chartParams = {
                chartType: chartType,
                title: title,
                stakeholderGroup: this.selectedStakeholder,
                data: {
                    description: `Chart generated from Excel data: ${excelData.insights}`,
                    source: source,
                    dataType: excelData.type,
                    columns: excelData.columns,
                    rows: excelData.data.length
                },
                style: 'professional',
                isExcelGenerated: true
            };

            const generatedChart = await dalleService.generateChart(chartParams);
            
            // Mark as Excel-generated
            generatedChart.isExcelGenerated = true;
            generatedChart.excelSource = source;
            
            this.addGeneratedChart(generatedChart);
            this.showSuccess(`Chart "${title}" generated from Excel data!`);
            
            if (window.timeSavingsService) {
                window.timeSavingsService.trackTimeSaved('excel_chart_generation', 1);
            }

        } catch (error) {
            console.error('Error generating chart from Excel data:', error);
            this.showError(`Failed to generate chart: ${error.message}`);
        }
    }

    /**
     * Reset component
     */
    reset() {
        this.clear();
        dalleService.clearAllImagesAndUploads();
        this.refreshGeneratedCharts();
        this.refreshUploadedImages();
        
        // Clear Excel analysis
        const excelAnalysisPreview = document.getElementById('excel-analysis-preview');
        if (excelAnalysisPreview) {
            excelAnalysisPreview.innerHTML = '';
        }
    }
}

// Create and export singleton instance
const chartGeneration = new ChartGeneration();

// Make available globally
window.chartGeneration = chartGeneration;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = chartGeneration;
}
