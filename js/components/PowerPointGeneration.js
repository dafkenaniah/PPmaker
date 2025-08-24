// PowerPoint Generation Component - Handles PowerPoint creation and download
class PowerPointGeneration {
    constructor() {
        this.generationSection = null;
        this.createButton = null;
        this.generationProgress = null;
        this.progressFill = null;
        this.progressText = null;
        this.downloadSection = null;
        this.downloadLink = null;
        this.currentOutline = null;
        this.isGenerating = false;
    }

    /**
     * Initialize the component
     */
    init() {
        this.generationSection = document.getElementById('generation-section');
        this.createButton = document.getElementById('create-powerpoint-btn');
        this.generationProgress = document.getElementById('generation-progress');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.downloadSection = document.getElementById('download-section');
        this.downloadLink = document.getElementById('download-link');

        if (!this.generationSection || !this.createButton || !this.generationProgress) {
            console.error('PowerPointGeneration: Required elements not found');
            return;
        }

        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.createButton.addEventListener('click', () => {
            this.handleCreatePowerPoint();
        });

        // Listen for outline updates
        document.addEventListener('outlineUpdated', (e) => {
            this.setOutline(e.detail.outline);
        });
    }

    /**
     * Set the current outline for PowerPoint generation
     * @param {Object} outline - Slide outline
     */
    setOutline(outline) {
        this.currentOutline = outline;
        this.updateButtonState();
        this.showSection();
    }

    /**
     * Handle create PowerPoint button click
     */
    async handleCreatePowerPoint() {
        console.log('[PowerPointGeneration] Create PowerPoint button clicked');
        console.log('[PowerPointGeneration] Current generating state:', this.isGenerating);
        console.log('[PowerPointGeneration] Current outline:', this.currentOutline);

        if (this.isGenerating) {
            console.log('[PowerPointGeneration] Already generating, cancelling...');
            this.cancelGeneration();
            return;
        }

        if (!this.currentOutline) {
            console.error('[PowerPointGeneration] No outline available');
            this.showError('No outline available. Please generate an outline first.');
            return;
        }

        console.log('[PowerPointGeneration] Outline validation passed');
        console.log('[PowerPointGeneration] Slide count:', this.currentOutline.slides?.length);

        // Check for PptxGenJS library
        if (typeof PptxGenJS === 'undefined') {
            console.error('[PowerPointGeneration] PptxGenJS library not available');
            this.showError('PowerPoint generation library (PptxGenJS) is not loaded. Please refresh the page.');
            return;
        }

        console.log('[PowerPointGeneration] PptxGenJS available, starting generation...');

        try {
            await this.generatePowerPoint();
        } catch (error) {
            console.error('[PowerPointGeneration] Error creating PowerPoint:', error);
            console.error('[PowerPointGeneration] Error stack:', error.stack);
            const errorMessage = (window.Formatters && window.Formatters.formatErrorMessage) 
                ? window.Formatters.formatErrorMessage(error)
                : error.message || 'Failed to create PowerPoint';
            this.showError(errorMessage);
        }
    }

    /**
     * Generate PowerPoint presentation
     */
    async generatePowerPoint() {
        // Set up timeout to prevent infinite hangs
        const timeout = 60000; // 60 seconds timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('PowerPoint generation timed out. Please try again.'));
            }, timeout);
        });

        try {
            this.startGeneration();
            
            // Wrap the entire generation process in a timeout
            await Promise.race([
                this.performPowerPointGeneration(),
                timeoutPromise
            ]);
            
        } catch (error) {
            console.error('Error in PowerPoint generation:', error);
            throw error;
        } finally {
            this.stopGeneration();
        }
    }

    /**
     * Perform the actual PowerPoint generation steps
     */
    async performPowerPointGeneration() {
        // Step 1: Validate outline
        this.updateProgress(10, 'Validating slide outline...');
        if (window.Validators) {
            const validation = window.Validators.validateSlideOutline(this.currentOutline);
            if (!validation.isValid) {
                throw new Error('Invalid outline: ' + validation.errors.join(', '));
            }
        }

        // Step 2: Get chart assignments
        this.updateProgress(20, 'Gathering chart assignments...');
        const chartAssignments = window.chartGeneration ? window.chartGeneration.exportForPowerPoint() : {};

        // Step 3: Create PowerPoint using PptxGenJS
        this.updateProgress(40, 'Creating PowerPoint presentation...');
        
        // Create new presentation
        const pptx = new PptxGenJS();
        
        // Set presentation properties
        pptx.author = 'PowerPoint Generator';
        pptx.company = 'PowerPoint Generator';
        pptx.subject = 'Generated Presentation';
        pptx.title = this.currentOutline.slides?.[0]?.title || 'Presentation';
        
        // Configure layout settings to work better with themes
        pptx.layout = 'LAYOUT_16x9'; // Use 16:9 aspect ratio
        pptx.defineSlideMaster({
            title: 'Custom Master',
            bkgd: 'FFFFFF' // White background to avoid theme conflicts
        });

        // Add slides from outline
        this.updateProgress(50, 'Adding slides...');
        this.currentOutline.slides.forEach((slideData, index) => {
            this.updateProgress(50 + (index * 30 / this.currentOutline.slides.length), `Creating slide ${index + 1}...`);
            
            // Create slide - let PptxGenJS handle layout automatically
            const slide = pptx.addSlide();
            
            // Check if this slide has assigned images/charts
            const slideImages = chartAssignments[index] || [];
            const hasImages = slideImages.length > 0;
            
            // Add title with hard-coded positioning to prevent overlap
            if (slideData.title) {
                slide.addText(slideData.title, {
                    x: 0.5,
                    y: 0.3,  // Fixed position at top
                    w: 9.0,
                    h: 1.2,
                    fontSize: 28,
                    bold: true,
                    align: 'left',
                    color: '333333',
                    isTextBox: true
                });
            }
            
            // Calculate content area based on whether images are present
            const contentY = hasImages ? '25%' : '25%';
            const contentWidth = hasImages ? '45%' : '90%';
            const contentHeight = hasImages ? '70%' : '70%';
            
            // Add content with hard-coded positioning to ensure proper spacing
            if (slideData.bullets && slideData.bullets.length > 0) {
                const contentWidthInches = hasImages ? 4.0 : 8.5;
                const bulletText = slideData.bullets.map(bullet => `• ${bullet}`).join('\n');
                
                slide.addText(bulletText, {
                    x: 0.5,
                    y: 1.8,  // Well below title to prevent overlap
                    w: contentWidthInches,
                    h: 5.0,
                    fontSize: 16,
                    align: 'left',
                    color: '333333',
                    isTextBox: true,
                    bullet: { type: 'bullet' }
                });
            } else if (slideData.content && slideData.content.length > 0) {
                const contentWidthInches = hasImages ? 4.0 : 8.5;
                
                slide.addText(slideData.content.join('\n'), {
                    x: 0.5,
                    y: 1.8,  // Well below title
                    w: contentWidthInches,
                    h: 5.0,
                    fontSize: 16,
                    align: 'left',
                    color: '333333',
                    isTextBox: true
                });
            }
            
                // Add assigned images/charts to the slide with theme-safe positioning
                if (hasImages) {
                    slideImages.forEach((imageData, imgIndex) => {
                        try {
                            // Position images using inches for better theme compatibility
                            const imageY = 2.0 + (imgIndex * 2.5); // Stack images vertically
                            slide.addImage({
                                data: imageData.blob,
                                x: 5.5,  // Position in inches from left
                                y: imageY,
                                w: 3.5,  // Width in inches
                                h: 2.0,  // Height in inches
                                sizing: {
                                    type: 'contain', // Maintain aspect ratio
                                    w: 3.5,
                                    h: 2.0
                                }
                            });
                            
                            console.log(`Added image "${imageData.title}" to slide ${index + 1} at position (${5.5}, ${imageY})`);
                        } catch (error) {
                            console.warn(`Failed to add image to slide ${index + 1}:`, error);
                        }
                    });
                }
            
            // Build comprehensive presenter notes with meeting context
            const presenterNotes = this.buildEnhancedPresenterNotes(slideData, index, this.currentOutline);
            slide.addNotes(presenterNotes);
        });

        // Step 4: Generate and download
        this.updateProgress(80, 'Generating PowerPoint file...');
        const filename = this.generateFilename();
        
        // Write the PowerPoint file
        await pptx.writeFile({ fileName: filename });
        
        // Show success - PptxGenJS handles the download automatically
        this.updateProgress(100, 'PowerPoint created successfully!');
        
        // Show notification
        this.showSuccess(`PowerPoint "${filename}" has been downloaded!`);
    }

    /**
     * Start generation process
     */
    startGeneration() {
        this.isGenerating = true;
        this.createButton.textContent = 'Cancel';
        this.createButton.classList.add('generating');
        this.generationProgress.classList.remove('hidden');
        this.downloadSection.classList.add('hidden');
        
        // Disable other components during generation
        this.setOtherComponentsEnabled(false);
    }

    /**
     * Stop generation process
     */
    stopGeneration() {
        this.isGenerating = false;
        this.createButton.textContent = 'Create PowerPoint';
        this.createButton.classList.remove('generating');
        
        // Re-enable other components
        this.setOtherComponentsEnabled(true);
        
        // Hide progress after delay
        setTimeout(() => {
            if (!this.isGenerating) {
                this.generationProgress.classList.add('hidden');
                this.resetProgress();
            }
        }, 3000);
    }

    /**
     * Cancel generation process
     */
    cancelGeneration() {
        this.stopGeneration();
        this.updateProgress(0, 'Generation cancelled');
        
        setTimeout(() => {
            this.generationProgress.classList.add('hidden');
        }, 2000);
    }

    /**
     * Update progress bar and text
     * @param {number} percentage - Progress percentage (0-100)
     * @param {string} message - Progress message
     */
    updateProgress(percentage, message) {
        if (this.progressFill) {
            this.progressFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
        }
        
        if (this.progressText) {
            this.progressText.textContent = message;
        }
    }

    /**
     * Reset progress bar
     */
    resetProgress() {
        this.updateProgress(0, '');
    }

    /**
     * Show download section with file information
     * @param {string} downloadUrl - Download URL
     * @param {string} filename - Generated filename
     * @param {number} fileSize - File size in bytes
     */
    showDownloadSection(downloadUrl, filename, fileSize) {
        if (!this.downloadSection || !this.downloadLink) return;
        
        // Update download link with proper MIME type
        this.downloadLink.href = downloadUrl;
        this.downloadLink.download = filename;
        
        // Force the correct MIME type for PowerPoint files
        this.downloadLink.setAttribute('type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        
        // Update filename display
        const filenameDisplay = this.downloadSection.querySelector('.filename-display');
        if (filenameDisplay) {
            filenameDisplay.textContent = filename;
        }
        
        // Update file size display
        const fileSizeDisplay = this.downloadSection.querySelector('.filesize-display');
        if (fileSizeDisplay) {
            fileSizeDisplay.textContent = this.formatFileSize(fileSize);
        }
        
        // Show download section
        this.downloadSection.classList.remove('hidden');
        
        // Scroll to download section
        setTimeout(() => {
            this.downloadSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 500);
        
        // Add download event listener with proper blob handling
        this.downloadLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.triggerPowerPointDownload(downloadUrl, filename);
            this.handleDownload(filename, fileSize);
        }, { once: true });
    }

    /**
     * Trigger PowerPoint download with proper handling
     * @param {string} downloadUrl - Blob URL
     * @param {string} filename - Filename
     */
    triggerPowerPointDownload(downloadUrl, filename) {
        try {
            console.log(`Triggering download for: ${filename}`);
            console.log(`Download URL: ${downloadUrl}`);
            
            // Method 1: Direct download using anchor element
            const tempLink = document.createElement('a');
            tempLink.href = downloadUrl;
            tempLink.download = filename;
            tempLink.style.display = 'none';
            
            // Force the browser to treat this as a download
            tempLink.setAttribute('target', '_blank');
            tempLink.setAttribute('rel', 'noopener noreferrer');
            
            // Add to DOM, click, and remove
            document.body.appendChild(tempLink);
            
            // Use both click methods for maximum compatibility
            if (tempLink.click) {
                tempLink.click();
            } else {
                // Fallback for older browsers
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                tempLink.dispatchEvent(clickEvent);
            }
            
            // Clean up
            setTimeout(() => {
                if (document.body.contains(tempLink)) {
                    document.body.removeChild(tempLink);
                }
            }, 100);
            
            console.log('PowerPoint download triggered successfully');
            
        } catch (error) {
            console.error('Error triggering download:', error);
            
            // Fallback method: Try to force download using window.open
            try {
                const newWindow = window.open(downloadUrl, '_blank');
                if (!newWindow) {
                    throw new Error('Popup blocked');
                }
                console.log('Fallback download method used');
            } catch (fallbackError) {
                console.error('Fallback download also failed:', fallbackError);
                
                // Last resort: Show user the URL to manually download
                const message = `Download failed. Please right-click this link and select "Save As": ${downloadUrl}`;
                alert(message);
            }
        }
    }

    /**
     * Handle download click
     * @param {string} filename - Downloaded filename
     * @param {number} fileSize - File size
     */
    handleDownload(filename, fileSize) {
        // Show success message
        const message = `PowerPoint file "${filename}" downloaded successfully!`;
        this.showSuccess(message);
        
        // Log download for debugging
        console.log(`PowerPoint downloaded: ${filename} (${fileSize} bytes)`);
    }

    /**
     * Generate filename for the presentation
     * @returns {string} - Generated filename
     */
    generateFilename() {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const slideCount = this.currentOutline.slides ? this.currentOutline.slides.length : 0;
        
        // Try to use first slide title as base name
        let baseName = 'presentation';
        if (this.currentOutline.slides && this.currentOutline.slides.length > 0) {
            const firstSlideTitle = this.currentOutline.slides[0].title;
            if (firstSlideTitle) {
                baseName = firstSlideTitle
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, '_')
                    .substring(0, 30);
            }
        }
        
        return `${baseName}_${slideCount}slides_${timestamp}.pptx`;
    }

    /**
     * Format file size in human readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Update button state based on outline availability
     */
    updateButtonState() {
        if (this.isGenerating) return;
        
        // Add null check to prevent errors during initialization
        if (!this.createButton) {
            console.warn('[PowerPointGeneration] createButton not found, skipping button state update');
            return;
        }
        
        const hasOutline = this.currentOutline && this.currentOutline.slides && this.currentOutline.slides.length > 0;
        
        this.createButton.disabled = !hasOutline;
        
        if (hasOutline) {
            const slideCount = this.currentOutline.slides.length;
            this.createButton.title = `Create PowerPoint with ${slideCount} slides`;
            this.createButton.classList.remove('disabled');
        } else {
            this.createButton.title = 'Generate an outline first to create PowerPoint';
            this.createButton.classList.add('disabled');
        }
    }

    /**
     * Generate PowerPoint from outline - called by FileUploadManager
     * @param {Object} outline - Slide outline to generate from
     * @returns {Promise<Blob>} - Generated PowerPoint blob
     */
    async generateFromOutline(outline) {
        console.log('[PowerPointGeneration] generateFromOutline called with outline:', outline);
        
        if (!outline || !outline.slides || outline.slides.length === 0) {
            throw new Error('Invalid outline provided for PowerPoint generation');
        }
        
        // Set the outline
        this.setOutline(outline);
        
        try {
            // Create PowerPoint using PptxGenJS
            const pptx = new PptxGenJS();
            
            // Set presentation properties
            pptx.author = 'PowerPoint Generator';
            pptx.company = 'PowerPoint Generator';
            pptx.subject = 'Generated Presentation';
            pptx.title = outline.title || outline.slides[0]?.title || 'Presentation';

            // Get chart assignments for this outline
            const chartAssignments = window.chartGeneration ? window.chartGeneration.exportForPowerPoint() : {};

            // Add slides from outline
            outline.slides.forEach((slideData, index) => {
                console.log(`[PowerPointGeneration] Creating slide ${index + 1}: ${slideData.title}`);
                
                // Create slide
                const slide = pptx.addSlide();
                
                // Check if this slide has assigned images/charts
                const slideImages = chartAssignments[index] || [];
                const hasImages = slideImages.length > 0;
                
                // Add title with hard-coded positioning to prevent overlap
                if (slideData.title) {
                    slide.addText(slideData.title, {
                        x: 0.5,
                        y: 0.3,  // Fixed position at top
                        w: 9.0,
                        h: 1.2,
                        fontSize: 28,
                        bold: true,
                        align: 'left',
                        color: '333333',
                        isTextBox: true
                    });
                }
                
                // Add content with hard-coded positioning to ensure proper spacing
                if (slideData.bullets && slideData.bullets.length > 0) {
                    const contentWidthInches = hasImages ? 4.0 : 8.5;
                    const bulletText = slideData.bullets.map(bullet => `• ${bullet}`).join('\n');
                    
                    slide.addText(bulletText, {
                        x: 0.5,
                        y: 1.8,  // Well below title to prevent overlap
                        w: contentWidthInches,
                        h: 5.0,
                        fontSize: 16,
                        align: 'left',
                        color: '333333',
                        isTextBox: true,
                        bullet: { type: 'bullet' }
                    });
                } else if (slideData.content && slideData.content.length > 0) {
                    const contentWidthInches = hasImages ? 4.0 : 8.5;
                    
                    slide.addText(slideData.content.join('\n'), {
                        x: 0.5,
                        y: 1.8,  // Well below title
                        w: contentWidthInches,
                        h: 5.0,
                        fontSize: 16,
                        align: 'left',
                        color: '333333',
                        isTextBox: true
                    });
                }
                
                // Add assigned images/charts with theme-safe positioning
                if (hasImages) {
                    slideImages.forEach((imageData, imgIndex) => {
                        try {
                            // Position images using inches for better theme compatibility
                            const imageY = 2.0 + (imgIndex * 2.5);
                            slide.addImage({
                                data: imageData.blob,
                                x: 5.5,
                                y: imageY,
                                w: 3.5,
                                h: 2.0,
                                sizing: {
                                    type: 'contain',
                                    w: 3.5,
                                    h: 2.0
                                }
                            });
                            
                            console.log(`Added image "${imageData.title}" to slide ${index + 1} at position (${5.5}, ${imageY})`);
                        } catch (error) {
                            console.warn(`Failed to add image to slide ${index + 1}:`, error);
                        }
                    });
                }
                
                // Add presenter notes
                if (slideData.presenterNotes) {
                    slide.addNotes(slideData.presenterNotes);
                }
            });

            // Generate filename
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const slideCount = outline.slides.length;
            let baseName = 'ai_improved_presentation';
            
            if (outline.title) {
                baseName = outline.title
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, '_')
                    .substring(0, 30);
            }
            
            const filename = `${baseName}_${slideCount}slides_${timestamp}.pptx`;
            
            console.log(`[PowerPointGeneration] Writing PowerPoint file: ${filename}`);
            
            // Write the PowerPoint file - this will trigger download
            await pptx.writeFile({ fileName: filename });
            
            console.log('[PowerPointGeneration] PowerPoint generated and download triggered');
            
            // Return a mock blob since PptxGenJS handles download internally
            return new Blob(['PowerPoint generated'], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
            
        } catch (error) {
            console.error('[PowerPointGeneration] Error in generateFromOutline:', error);
            throw new Error(`Failed to generate PowerPoint: ${error.message}`);
        }
    }

    /**
     * Show the generation section
     */
    showSection() {
        if (this.generationSection) {
            this.generationSection.classList.remove('hidden');
        } else {
            console.warn('[PowerPointGeneration] generationSection not found, skipping show');
        }
    }

    /**
     * Hide the generation section
     */
    hideSection() {
        if (this.generationSection) {
            this.generationSection.classList.add('hidden');
        } else {
            console.warn('[PowerPointGeneration] generationSection not found, skipping hide');
        }
    }

    /**
     * Enable or disable other components during generation
     * @param {boolean} enabled - Whether to enable components
     */
    setOtherComponentsEnabled(enabled) {
        // Disable notes input
        if (window.notesInput) {
            window.notesInput.setEnabled(enabled);
        }
        
        // Disable AI processing
        if (window.aiProcessing) {
            window.aiProcessing.setEnabled(enabled);
        }
        
        // Disable outline editing
        const editButtons = document.querySelectorAll('.edit-slide-btn');
        editButtons.forEach(button => {
            button.disabled = !enabled;
        });
        
        const regenerateButton = document.getElementById('regenerate-outline-btn');
        if (regenerateButton) {
            regenerateButton.disabled = !enabled;
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
     * Get generation statistics
     * @returns {Object} - Generation stats
     */
    getGenerationStats() {
        return {
            isGenerating: this.isGenerating,
            hasOutline: !!this.currentOutline,
            slideCount: this.currentOutline ? this.currentOutline.slides.length : 0,
            estimatedTime: this.currentOutline ? pythonService.estimateExecutionTime(this.currentOutline) : 0
        };
    }

    /**
     * Retry PowerPoint generation
     */
    async retryGeneration() {
        if (!this.currentOutline) {
            this.showError('No outline available for retry');
            return;
        }
        
        try {
            await this.generatePowerPoint();
        } catch (error) {
            this.showError('Retry failed: ' + Formatters.formatErrorMessage(error));
        }
    }

    /**
     * Preview generated Python script (for debugging)
     */
    async previewPythonScript() {
        if (!this.currentOutline) {
            this.showError('No outline available');
            return;
        }
        
        try {
            const pythonScript = await pythonService.generatePythonScript(this.currentOutline);
            
            // Create modal to show script
            const modal = document.createElement('div');
            modal.className = 'script-preview-modal';
            modal.innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <h3>Generated Python Script</h3>
                            <button class="modal-close" title="Close">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div class="modal-body">
                            <pre><code>${Formatters.formatTextForHTML(pythonScript)}</code></pre>
                        </div>
                        <div class="modal-footer">
                            <button class="secondary-button modal-close">Close</button>
                            <button class="primary-button copy-script">Copy Script</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Set up modal event listeners
            const closeButtons = modal.querySelectorAll('.modal-close');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
            });
            
            const copyButton = modal.querySelector('.copy-script');
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(pythonScript).then(() => {
                    this.showSuccess('Python script copied to clipboard');
                });
            });
            
        } catch (error) {
            this.showError('Failed to generate Python script: ' + error.message);
        }
    }

    /**
     * Clear current state
     */
    clear() {
        this.currentOutline = null;
        this.downloadSection.classList.add('hidden');
        this.generationProgress.classList.add('hidden');
        this.resetProgress();
        this.updateButtonState();
        this.hideSection();
    }

    /**
     * Reset component state
     */
    reset() {
        if (this.isGenerating) {
            this.cancelGeneration();
        }
        this.clear();
    }

    /**
     * Cleanup component
     */
    destroy() {
        this.reset();
    }

    /**
     * Build enhanced presenter notes with meeting context
     * @param {Object} slideData - Slide data
     * @param {number} index - Slide index
     * @param {Object} outline - Full outline
     * @returns {string} - Enhanced presenter notes
     */
    buildEnhancedPresenterNotes(slideData, index, outline) {
        let notes = '';
        
        // Meeting Header Information (for intro slide)
        if (index === 0) {
            const currentDate = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            notes += `=== MEETING INFORMATION ===\n`;
            notes += `Date: ${currentDate}\n`;
            notes += `Meeting: ${outline.title || 'Presentation'}\n`;
            notes += `Duration: ${outline.estimatedDuration || 'Variable'}\n`;
            
            // Get meeting context if available
            const meetingContent = document.getElementById('meeting-content-input')?.value || 
                                 document.getElementById('notes-input')?.value || '';
            
            if (meetingContent) {
                // Extract attendees from meeting content
                const attendees = this.extractAttendeesFromContent(meetingContent);
                if (attendees.length > 0) {
                    notes += `Attendees: ${attendees.join(', ')}\n`;
                }
                
                // Extract key meeting themes
                const themes = this.extractMeetingThemes(meetingContent);
                if (themes.length > 0) {
                    notes += `Key Topics: ${themes.join(', ')}\n`;
                }
            }
            
            notes += `\n=== AGENDA ===\n`;
            outline.slides.forEach((slide, i) => {
                notes += `${i + 1}. ${slide.title}\n`;
            });
            notes += '\n';
        }
        
        // Slide-specific context
        notes += `=== SLIDE ${index + 1}: ${slideData.title} ===\n\n`;
        
        if (slideData.presenterNotes) {
            notes += `Speaker Notes: ${slideData.presenterNotes}\n\n`;
        }
        
        // Key points with meeting context
        if (slideData.bullets && slideData.bullets.length > 0) {
            notes += `=== KEY POINTS ===\n`;
            slideData.bullets.forEach((bullet, i) => {
                notes += `${i + 1}. ${bullet}\n`;
            });
            notes += '\n';
        }
        
        // Meeting context integration
        const meetingContent = document.getElementById('meeting-content-input')?.value || 
                             document.getElementById('notes-input')?.value || '';
        
        if (meetingContent && slideData.title) {
            const relevantContext = this.extractRelevantMeetingContext(meetingContent, slideData.title);
            if (relevantContext) {
                notes += `=== MEETING CONTEXT ===\n`;
                notes += `${relevantContext}\n\n`;
            }
        }
        
        // Timing and transition
        const estimatedTime = Math.ceil(2 + (slideData.bullets?.length || slideData.content?.length || 1) * 0.5);
        notes += `=== PRESENTATION GUIDANCE ===\n`;
        notes += `Time: ${estimatedTime} minutes\n`;
        
        if (index < outline.slides.length - 1) {
            const nextSlide = outline.slides[index + 1];
            notes += `Next: "${nextSlide.title}"\n`;
        }
        
        return notes.trim();
    }

    /**
     * Extract attendees from meeting content
     * @param {string} content - Meeting content
     * @returns {Array} - List of attendees
     */
    extractAttendeesFromContent(content) {
        const attendees = new Set();
        
        // Look for common name patterns in meeting transcripts
        const namePatterns = [
            /\[[\d:]+\]\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g, // [10:00] John Smith
            /^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?):/gm, // John Smith:
            /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+said/gi // John Smith said
        ];
        
        namePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const name = match[1].trim();
                if (name.length > 1 && name !== 'AM' && name !== 'PM') {
                    attendees.add(name);
                }
            }
        });
        
        return Array.from(attendees).slice(0, 8); // Limit to 8 attendees
    }

    /**
     * Extract meeting themes from content
     * @param {string} content - Meeting content
     * @returns {Array} - List of themes
     */
    extractMeetingThemes(content) {
        const themes = new Set();
        const commonThemes = [
            'roadmap', 'planning', 'budget', 'timeline', 'project', 'goals', 
            'strategy', 'review', 'status', 'update', 'launch', 'development',
            'marketing', 'qa', 'testing', 'release', 'features', 'performance'
        ];
        
        const contentLower = content.toLowerCase();
        commonThemes.forEach(theme => {
            if (contentLower.includes(theme)) {
                themes.add(theme.charAt(0).toUpperCase() + theme.slice(1));
            }
        });
        
        return Array.from(themes).slice(0, 5); // Limit to 5 themes
    }

    /**
     * Extract relevant meeting context for specific slide
     * @param {string} content - Meeting content
     * @param {string} slideTitle - Slide title
     * @returns {string} - Relevant context
     */
    extractRelevantMeetingContext(content, slideTitle) {
        const titleWords = slideTitle.toLowerCase().split(' ');
        const contentLines = content.split('\n');
        const relevantLines = [];
        
        // Find lines that contain words from the slide title
        contentLines.forEach(line => {
            const lineLower = line.toLowerCase();
            const hasRelevantContent = titleWords.some(word => 
                word.length > 3 && lineLower.includes(word)
            );
            
            if (hasRelevantContent && line.trim().length > 20) {
                relevantLines.push(line.trim());
            }
        });
        
        // Return first few relevant lines
        return relevantLines.slice(0, 3).join('\n');
    }
}

// Create and export singleton instance
const powerPointGeneration = new PowerPointGeneration();

// Make available globally for other components
window.powerPointGeneration = powerPointGeneration;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = powerPointGeneration;
}
