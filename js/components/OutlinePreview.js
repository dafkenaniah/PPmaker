// Outline Preview Component - Displays and manages slide outline
class OutlinePreview {
    constructor() {
        this.outlineSection = null;
        this.outlinePreview = null;
        this.regenerateButton = null;
        this.currentOutline = null;
        this.editingSlide = null;
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.outlineSection = document.getElementById('outline-section');
        this.outlinePreview = document.getElementById('outline-preview');
        this.regenerateButton = document.getElementById('regenerate-outline-btn');

        if (!this.outlineSection || !this.outlinePreview || !this.regenerateButton) {
            console.error('OutlinePreview: Required elements not found');
            return;
        }

        this.setupEventListeners();
        this.loadSavedOutline();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.regenerateButton.addEventListener('click', () => {
            this.handleRegenerateOutline();
        });

        // Listen for outline updates from AI processing
        document.addEventListener('outlineGenerated', (e) => {
            this.displayOutline(e.detail.outline);
        });
    }

    /**
     * Display the generated outline
     * @param {Object} outline - Slide outline to display
     */
    displayOutline(outline) {
        if (!outline || !outline.slides) {
            console.error('Invalid outline provided');
            return;
        }

        this.currentOutline = outline;
        this.renderOutline(outline);
        this.showSection();
        
        // Enable PowerPoint generation
        this.enablePowerPointGeneration();
    }

    /**
     * Render the outline HTML
     * @param {Object} outline - Outline to render
     */
    renderOutline(outline) {
        const outlineHTML = this.generateOutlineHTML(outline);
        this.outlinePreview.innerHTML = outlineHTML;
        
        // Set up slide-specific event listeners
        this.setupSlideEventListeners();
    }

    /**
     * Generate HTML for the outline
     * @param {Object} outline - Outline data
     * @returns {string} - Generated HTML
     */
    generateOutlineHTML(outline) {
        let html = '';
        
        // Add outline metadata
        html += this.generateMetadataHTML(outline);
        
        // Add slides
        outline.slides.forEach((slide, index) => {
            html += this.generateSlideHTML(slide, index);
        });
        
        return html;
    }

    /**
     * Generate metadata HTML
     * @param {Object} outline - Outline data
     * @returns {string} - Metadata HTML
     */
    generateMetadataHTML(outline) {
        return `
            <div class="outline-metadata">
                <div class="metadata-item">
                    <strong>Total Slides:</strong> ${outline.totalSlides || outline.slides.length}
                </div>
                <div class="metadata-item">
                    <strong>Estimated Duration:</strong> ${Formatters.formatDuration(outline.estimatedDuration)}
                </div>
                <div class="metadata-item">
                    <strong>Theme:</strong> ${outline.theme || 'Professional'}
                </div>
            </div>
        `;
    }

    /**
     * Generate HTML for a single slide
     * @param {Object} slide - Slide data
     * @param {number} index - Slide index
     * @returns {string} - Slide HTML
     */
    generateSlideHTML(slide, index) {
        const slideTypeInfo = Formatters.formatSlideType(slide.slideType);
        const formattedTitle = Formatters.formatSlideTitle(slide.title);
        const formattedBullets = Formatters.formatBulletPoints(slide.bullets);
        
        return `
            <div class="slide-preview" data-slide-index="${index}">
                <div class="slide-header">
                    <div class="slide-info">
                        <span class="slide-number">Slide ${index + 1}</span>
                        <span class="slide-type ${slideTypeInfo.className}" title="${slideTypeInfo.label}">
                            ${slideTypeInfo.icon}
                        </span>
                    </div>
                    <button class="edit-slide-btn" data-slide-index="${index}" title="Edit slide">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                    </button>
                </div>
                
                <div class="slide-content">
                    <h3 class="slide-title">${Formatters.formatTextForHTML(formattedTitle)}</h3>
                    
                    ${slide.content && slide.content.length > 0 ? `
                        <div class="slide-main-content">
                            ${slide.content.map(content => 
                                `<p>${Formatters.formatTextForHTML(content)}</p>`
                            ).join('')}
                        </div>
                    ` : ''}
                    
                    ${formattedBullets.length > 0 ? `
                        <ul class="slide-bullets">
                            ${formattedBullets.map(bullet => 
                                `<li>${Formatters.formatTextForHTML(bullet)}</li>`
                            ).join('')}
                        </ul>
                    ` : ''}
                    
                    ${slide.presenterNotes ? `
                        <div class="presenter-notes">
                            <strong>Presenter Notes:</strong>
                            <p>${Formatters.formatTextForHTML(slide.presenterNotes)}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Set up event listeners for slide interactions
     */
    setupSlideEventListeners() {
        // Edit slide buttons
        const editButtons = this.outlinePreview.querySelectorAll('.edit-slide-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const slideIndex = parseInt(e.target.closest('[data-slide-index]').dataset.slideIndex);
                this.editSlide(slideIndex);
            });
        });

        // Slide preview hover effects
        const slidePreviews = this.outlinePreview.querySelectorAll('.slide-preview');
        slidePreviews.forEach(preview => {
            preview.addEventListener('mouseenter', () => {
                preview.classList.add('hovered');
            });
            
            preview.addEventListener('mouseleave', () => {
                preview.classList.remove('hovered');
            });
        });
    }

    /**
     * Handle regenerate outline button click
     */
    async handleRegenerateOutline() {
        const confirmed = confirm('Are you sure you want to regenerate the outline? This will replace the current outline.');
        if (!confirmed) return;

        try {
            // Trigger AI processing to regenerate
            if (window.aiProcessing) {
                await window.aiProcessing.retryGeneration();
            }
        } catch (error) {
            console.error('Error regenerating outline:', error);
            this.showError('Failed to regenerate outline. Please try again.');
        }
    }

    /**
     * Edit a specific slide
     * @param {number} slideIndex - Index of slide to edit
     */
    editSlide(slideIndex) {
        if (!this.currentOutline || !this.currentOutline.slides[slideIndex]) {
            console.error('Invalid slide index:', slideIndex);
            return;
        }

        const slide = this.currentOutline.slides[slideIndex];
        this.showSlideEditor(slide, slideIndex);
    }

    /**
     * Show slide editor modal/interface
     * @param {Object} slide - Slide to edit
     * @param {number} slideIndex - Slide index
     */
    showSlideEditor(slide, slideIndex) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'slide-editor-modal';
        modal.innerHTML = this.generateSlideEditorHTML(slide, slideIndex);
        
        document.body.appendChild(modal);
        
        // Set up editor event listeners
        this.setupSlideEditorListeners(modal, slideIndex);
        
        // Focus on title input
        const titleInput = modal.querySelector('#edit-slide-title');
        if (titleInput) {
            titleInput.focus();
            titleInput.select();
        }
    }

    /**
     * Generate slide editor HTML
     * @param {Object} slide - Slide data
     * @param {number} slideIndex - Slide index
     * @returns {string} - Editor HTML
     */
    generateSlideEditorHTML(slide, slideIndex) {
        return `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Slide ${slideIndex + 1}</h3>
                        <button class="modal-close" title="Close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="edit-slide-title">Slide Title:</label>
                            <input type="text" id="edit-slide-title" value="${Formatters.formatTextForHTML(slide.title)}" maxlength="100">
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-slide-type">Slide Type:</label>
                            <select id="edit-slide-type">
                                <option value="title" ${slide.slideType === 'title' ? 'selected' : ''}>Title Slide</option>
                                <option value="content" ${slide.slideType === 'content' ? 'selected' : ''}>Content Slide</option>
                                <option value="conclusion" ${slide.slideType === 'conclusion' ? 'selected' : ''}>Conclusion</option>
                                <option value="section" ${slide.slideType === 'section' ? 'selected' : ''}>Section Break</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-slide-content">Main Content:</label>
                            <textarea id="edit-slide-content" rows="4" placeholder="Main content points (one per line)">${(slide.content || []).join('\n')}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-slide-bullets">Bullet Points:</label>
                            <textarea id="edit-slide-bullets" rows="6" placeholder="Bullet points (one per line)">${(slide.bullets || []).join('\n')}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-presenter-notes">Presenter Notes:</label>
                            <textarea id="edit-presenter-notes" rows="3" placeholder="Notes for the presenter">${slide.presenterNotes || ''}</textarea>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="secondary-button modal-cancel">Cancel</button>
                        <button class="primary-button modal-save">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Set up slide editor event listeners
     * @param {HTMLElement} modal - Modal element
     * @param {number} slideIndex - Slide index
     */
    setupSlideEditorListeners(modal, slideIndex) {
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const saveBtn = modal.querySelector('.modal-save');
        
        // Close handlers
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Escape key to close
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
        
        // Save handler
        saveBtn.addEventListener('click', () => {
            this.saveSlideChanges(modal, slideIndex);
            closeModal();
        });
    }

    /**
     * Save slide changes
     * @param {HTMLElement} modal - Modal element
     * @param {number} slideIndex - Slide index
     */
    saveSlideChanges(modal, slideIndex) {
        const title = modal.querySelector('#edit-slide-title').value.trim();
        const slideType = modal.querySelector('#edit-slide-type').value;
        const content = modal.querySelector('#edit-slide-content').value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        const bullets = modal.querySelector('#edit-slide-bullets').value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        const presenterNotes = modal.querySelector('#edit-presenter-notes').value.trim();
        
        // Update the slide in current outline
        this.currentOutline.slides[slideIndex] = {
            ...this.currentOutline.slides[slideIndex],
            title: title,
            slideType: slideType,
            content: content,
            bullets: bullets,
            presenterNotes: presenterNotes
        };
        
        // Save updated outline
        fileService.saveOutline(this.currentOutline);
        
        // Re-render the outline
        this.renderOutline(this.currentOutline);
        
        // Show success message
        this.showSuccess(`Slide ${slideIndex + 1} updated successfully`);
    }

    /**
     * Show the outline section
     */
    showSection() {
        this.outlineSection.classList.remove('hidden');
    }

    /**
     * Hide the outline section
     */
    hideSection() {
        this.outlineSection.classList.add('hidden');
    }

    /**
     * Enable PowerPoint generation
     */
    enablePowerPointGeneration() {
        const generationSection = document.getElementById('generation-section');
        if (generationSection) {
            generationSection.classList.remove('hidden');
        }
        
        // Trigger PowerPoint generation component
        if (window.powerPointGeneration) {
            window.powerPointGeneration.setOutline(this.currentOutline);
        }
    }

    /**
     * Load saved outline from storage
     */
    loadSavedOutline() {
        const savedOutline = fileService.loadOutline();
        if (savedOutline) {
            this.displayOutline(savedOutline);
        }
    }

    /**
     * Export outline as JSON
     */
    exportOutline() {
        if (!this.currentOutline) {
            this.showError('No outline to export');
            return;
        }
        
        try {
            fileService.exportOutlineAsJSON(this.currentOutline);
            this.showSuccess('Outline exported successfully');
        } catch (error) {
            this.showError('Failed to export outline: ' + error.message);
        }
    }

    /**
     * Import outline from JSON file
     * @param {File} file - JSON file to import
     */
    async importOutline(file) {
        try {
            const outline = await fileService.importOutlineFromJSON(file);
            this.displayOutline(outline);
            this.showSuccess('Outline imported successfully');
        } catch (error) {
            this.showError('Failed to import outline: ' + error.message);
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Create temporary success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create temporary error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    /**
     * Get current outline
     * @returns {Object|null} - Current outline
     */
    getCurrentOutline() {
        return this.currentOutline;
    }

    /**
     * Clear current outline
     */
    clearOutline() {
        this.currentOutline = null;
        this.outlinePreview.innerHTML = '';
        this.hideSection();
        
        // Clear saved outline
        fileService.saveOutline(null);
    }

    /**
     * Get outline statistics
     * @returns {Object} - Outline statistics
     */
    getOutlineStats() {
        if (!this.currentOutline) {
            return { hasOutline: false };
        }
        
        const slides = this.currentOutline.slides || [];
        const totalBullets = slides.reduce((sum, slide) => sum + (slide.bullets ? slide.bullets.length : 0), 0);
        const totalContent = slides.reduce((sum, slide) => sum + (slide.content ? slide.content.length : 0), 0);
        
        return {
            hasOutline: true,
            slideCount: slides.length,
            totalBullets: totalBullets,
            totalContent: totalContent,
            estimatedDuration: this.currentOutline.estimatedDuration,
            theme: this.currentOutline.theme
        };
    }

    /**
     * Reset component state
     */
    reset() {
        this.clearOutline();
    }

    /**
     * Cleanup component
     */
    destroy() {
        this.reset();
    }
}

// Create and export singleton instance
const outlinePreview = new OutlinePreview();

// Make available globally for other components
window.outlinePreview = outlinePreview;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = outlinePreview;
}
