// File Upload and Update Manager Component
class FileUploadManager {
    constructor() {
        this.uploadedFile = null;
        this.isProcessing = false;
        this.supportedFormats = ['.pptx', '.ppt'];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.init();
    }

    /**
     * Initialize file upload manager
     */
    init() {
        // Prevent double initialization
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        
        this.setupFileInput();
        this.setupDropZone();
        this.setupUpdateButton();
        this.setupRemoveButton();
        this.loadSavedFile();
    }

    /**
     * Set up file input event listeners
     */
    setupFileInput() {
        const fileInput = document.getElementById('ppt-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileSelection(file);
                }
            });
        }
    }

    /**
     * Set up drag and drop zone
     */
    setupDropZone() {
        const dropZone = document.getElementById('file-drop-zone');
        if (!dropZone) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            }, false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        }, false);

        // Handle click to browse
        dropZone.addEventListener('click', () => {
            const fileInput = document.getElementById('ppt-file-input');
            if (fileInput) {
                fileInput.click();
            }
        });
    }

    /**
     * Set up update processing button
     */
    setupUpdateButton() {
        const updateBtn = document.getElementById('process-update-btn');
        if (updateBtn) {
            // Create debounced function once if it doesn't exist
            if (!this.debouncedProcessUpdate) {
                this.debouncedProcessUpdate = this.debounce(() => {
                    this.processUpdate();
                }, 2000); // 2 second debounce for more safety
            }
            
            // Remove any existing listeners to prevent duplicates
            updateBtn.removeEventListener('click', this.debouncedProcessUpdate);
            updateBtn.addEventListener('click', this.debouncedProcessUpdate);
        }

        // Monitor update notes input
        const updateInput = document.getElementById('update-notes-input');
        if (updateInput) {
            // Create input handler once if it doesn't exist
            if (!this.inputChangeHandler) {
                this.inputChangeHandler = () => {
                    this.updateButtonState();
                };
            }
            
            updateInput.removeEventListener('input', this.inputChangeHandler);
            updateInput.addEventListener('input', this.inputChangeHandler);
        }
    }

    /**
     * Debounce function to prevent rapid consecutive calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Set up remove file button
     */
    setupRemoveButton() {
        const removeBtn = document.getElementById('remove-file-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeFile();
            });
        }
    }

    /**
     * Prevent default drag behaviors
     * @param {Event} e - Event object
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Handle file selection
     * @param {File} file - Selected file
     */
    async handleFileSelection(file) {
        try {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.valid) {
                this.showError(validation.error);
                return;
            }

            // Show processing state
            this.showProcessingState('Analyzing file...');

            // Process file
            const fileData = await this.processFile(file);
            
            // Store file data
            this.uploadedFile = {
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                data: fileData
            };

            // Update UI
            this.displayFileInfo();
            this.updateButtonState();
            this.saveFileInfo();

            // Hide processing state
            this.hideProcessingState();

            console.log('File uploaded successfully:', this.uploadedFile.name);

        } catch (error) {
            console.error('File upload error:', error);
            this.showError('Failed to process file. Please try again.');
            this.hideProcessingState();
        }
    }

    /**
     * Validate uploaded file
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        // Check file type
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(fileExtension)) {
            return {
                valid: false,
                error: `Unsupported file format. Please upload ${this.supportedFormats.join(' or ')} files.`
            };
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `File too large. Maximum size is ${Formatters.formatFileSize(this.maxFileSize)}.`
            };
        }

        // Check if file is empty
        if (file.size === 0) {
            return {
                valid: false,
                error: 'File appears to be empty. Please select a valid PowerPoint file.'
            };
        }

        return { valid: true };
    }

    /**
     * Process uploaded file
     * @param {File} file - File to process
     * @returns {Promise<Object>} File data
     */
    async processFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    
                    // Convert to base64 for storage/transmission
                    const base64 = this.arrayBufferToBase64(arrayBuffer);
                    
                    resolve({
                        arrayBuffer: arrayBuffer,
                        base64: base64,
                        processedAt: new Date().toISOString()
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Convert ArrayBuffer to Base64
     * @param {ArrayBuffer} buffer - Buffer to convert
     * @returns {string} Base64 string
     */
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return btoa(binary);
    }

    /**
     * Display file information in UI
     */
    displayFileInfo() {
        const fileInfo = document.getElementById('uploaded-file-info');
        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        const dropZone = document.getElementById('file-drop-zone');

        if (this.uploadedFile && fileInfo && fileName && fileSize) {
            fileName.textContent = this.uploadedFile.name;
            fileSize.textContent = Formatters.formatFileSize(this.uploadedFile.size);
            
            fileInfo.classList.remove('hidden');
            if (dropZone) {
                dropZone.style.display = 'none';
            }
        }
    }

    /**
     * Remove uploaded file
     */
    removeFile() {
        this.uploadedFile = null;
        
        // Update UI
        const fileInfo = document.getElementById('uploaded-file-info');
        const dropZone = document.getElementById('file-drop-zone');
        const fileInput = document.getElementById('ppt-file-input');
        
        if (fileInfo) {
            fileInfo.classList.add('hidden');
        }
        
        if (dropZone) {
            dropZone.style.display = 'block';
        }
        
        if (fileInput) {
            fileInput.value = '';
        }

        // Clear update notes
        const updateInput = document.getElementById('update-notes-input');
        if (updateInput) {
            updateInput.value = '';
        }

        this.updateButtonState();
        this.clearSavedFile();
        
        console.log('File removed');
    }

    /**
     * Process update request
     */
    async processUpdate() {
        // Strict duplicate prevention
        if (!this.uploadedFile || this.isProcessing) {
            console.log('Update already in progress or no file uploaded');
            return;
        }

        const updateNotes = document.getElementById('update-notes-input')?.value?.trim();
        if (!updateNotes) {
            this.showError('Please enter update instructions.');
            return;
        }

        // Set processing flag immediately and disable button
        this.isProcessing = true;
        const updateBtn = document.getElementById('process-update-btn');
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.textContent = 'Processing...';
        }

        try {
            this.showUpdateProgress();
            console.log('Starting update process...');

            // Extract PowerPoint content
            this.updateProgressStatus('Extracting presentation content...');
            const extractedContent = await this.extractPowerPointContent();
            console.log('Content extracted successfully');

            // Generate update instructions
            this.updateProgressStatus('Generating update instructions...');
            const updateInstructions = await this.generateUpdateInstructions(extractedContent, updateNotes);
            console.log('Update instructions generated');

            // Create updated PowerPoint
            this.updateProgressStatus('Creating updated presentation...');
            const updatedPresentation = await this.createUpdatedPresentation(updateInstructions);
            console.log('Updated presentation created');

            // Show success and download
            this.showUpdateSuccess(updatedPresentation);
            if (window.timeSavingsService) {
                window.timeSavingsService.trackTimeSaved('update_powerpoint');
            }

        } catch (error) {
            console.error('Update processing error:', error);
            this.showError(`Failed to process updates: ${error.message}`);
        } finally {
            this.isProcessing = false;
            if (updateBtn) {
                updateBtn.disabled = false;
                updateBtn.textContent = 'Update Presentation';
            }
            this.hideUpdateProgress();
            console.log('Update process completed');
        }
    }

    /**
     * Extract content from PowerPoint file
     * @returns {Promise<Object>} Extracted content
     */
    async extractPowerPointContent() {
        if (!window.pythonService) {
            throw new Error('Python service is not available.');
        }
        return await window.pythonService.extractPowerPointContent(
            this.uploadedFile.data.base64,
            this.uploadedFile.name
        );
    }

    /**
     * Generate update instructions using AI
     * @param {Object} content - Extracted content
     * @param {string} updateNotes - User update notes
     * @returns {Promise<Object>} Update instructions
     */
    async generateUpdateInstructions(content, updateNotes) {
        try {
            // Create optimized prompt for AI analysis
            const aiPrompt = this.buildOptimizedUpdatePrompt(content, updateNotes);
            
            // Use AI service to generate enhanced content
            if (window.aiService) {
                const aiResponse = await window.aiService.generateContent(aiPrompt);
                return this.parseAIUpdateResponse(aiResponse, content, updateNotes);
            }
        } catch (error) {
            console.warn('AI service failed, using fallback method:', error);
        }

        // Fallback: Create enhanced instructions without AI
        return this.generateFallbackInstructions(content, updateNotes);
    }

    /**
     * Build optimized prompt for AI content generation
     * @param {Object} content - Extracted content
     * @param {string} updateNotes - User update notes
     * @returns {string} Optimized AI prompt
     */
    buildOptimizedUpdatePrompt(content, updateNotes) {
        const slidesSummary = content.slides.map(slide => 
            `Slide ${slide.slide_number}: "${slide.title}" - ${slide.content.slice(0, 100)}...`
        ).join('\n');

        return `
TASK: Enhance PowerPoint presentation based on user request

CURRENT PRESENTATION CONTEXT:
Total Slides: ${content.slides.length}
${slidesSummary}

USER REQUEST: "${updateNotes}"

INSTRUCTIONS:
1. Analyze the existing presentation content and structure
2. Based on the user's request, determine what enhancements are needed:
   - Add new slides with relevant content
   - Enhance existing slide content
   - Improve slide titles and bullet points
   - Maintain professional tone and structure

3. Generate response in this EXACT JSON format:
{
  "action": "add_slides" | "enhance_existing" | "mixed",
  "newSlides": [
    {
      "title": "Slide Title",
      "content": [
        "• Bullet point 1",
        "• Bullet point 2", 
        "• Bullet point 3"
      ]
    }
  ],
  "enhancedSlides": [
    {
      "slideNumber": 1,
      "title": "Enhanced Title",
      "content": [
        "• Enhanced bullet point 1",
        "• Enhanced bullet point 2"
      ]
    }
  ]
}

4. Ensure all content is:
   - Professional and business-appropriate
   - Structured with clear bullet points
   - Relevant to the presentation context
   - Actionable and informative

Generate comprehensive content that addresses the user's request while maintaining the presentation's coherence.
`;
    }

    /**
     * Parse AI response and format for presentation generation
     * @param {string} aiResponse - AI generated response
     * @param {Object} originalContent - Original presentation content
     * @param {string} updateNotes - User update notes
     * @returns {Object} Formatted update instructions
     */
    parseAIUpdateResponse(aiResponse, originalContent, updateNotes) {
        try {
            // Try to parse JSON response from AI
            const aiData = JSON.parse(aiResponse);
            
            const instructions = {
                slides: [...originalContent.slides], // Start with original slides
                updateInstructions: updateNotes,
                timestamp: new Date().toISOString(),
                aiGenerated: true
            };

            // Add new slides if specified
            if (aiData.newSlides && aiData.newSlides.length > 0) {
                aiData.newSlides.forEach(newSlide => {
                    instructions.slides.push({
                        slide_number: instructions.slides.length + 1,
                        title: newSlide.title,
                        content: Array.isArray(newSlide.content) ? newSlide.content.join('\n') : newSlide.content
                    });
                });
            }

            // Enhance existing slides if specified
            if (aiData.enhancedSlides && aiData.enhancedSlides.length > 0) {
                aiData.enhancedSlides.forEach(enhanced => {
                    const slideIndex = enhanced.slideNumber - 1;
                    if (slideIndex >= 0 && slideIndex < instructions.slides.length) {
                        instructions.slides[slideIndex].title = enhanced.title;
                        instructions.slides[slideIndex].content = Array.isArray(enhanced.content) ? 
                            enhanced.content.join('\n') : enhanced.content;
                    }
                });
            }

            return instructions;
        } catch (error) {
            console.warn('Failed to parse AI response, using fallback:', error);
            return this.generateFallbackInstructions(originalContent, updateNotes);
        }
    }

    /**
     * Generate fallback instructions when AI is not available
     * @param {Object} content - Extracted content
     * @param {string} updateNotes - User update notes
     * @returns {Object} Fallback update instructions
     */
    generateFallbackInstructions(content, updateNotes) {
        // Create meaningful fallback content based on user notes
        const instructions = {
            slides: [...content.slides], // Keep original slides
            updateInstructions: updateNotes,
            timestamp: new Date().toISOString(),
            aiGenerated: false
        };

        // Add a new slide with user's request as content
        instructions.slides.push({
            slide_number: instructions.slides.length + 1,
            title: this.generateSlideTitle(updateNotes),
            content: this.generateSlideContent(updateNotes)
        });

        return instructions;
    }

    /**
     * Generate slide title from user notes
     * @param {string} updateNotes - User update notes
     * @returns {string} Generated slide title
     */
    generateSlideTitle(updateNotes) {
        // Extract key phrases and create a professional title
        const words = updateNotes.toLowerCase().split(' ');
        const keyWords = words.filter(word => 
            word.length > 3 && 
            !['about', 'more', 'some', 'with', 'that', 'this', 'they', 'them', 'from', 'will', 'have'].includes(word)
        );
        
        if (keyWords.length > 0) {
            const title = keyWords.slice(0, 3).map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            return title + (updateNotes.includes('?') ? '' : ' Overview');
        }
        
        return 'Additional Information';
    }

    /**
     * Generate slide content from user notes
     * @param {string} updateNotes - User update notes
     * @returns {string} Generated slide content
     */
    generateSlideContent(updateNotes) {
        // Split user notes into bullet points
        const sentences = updateNotes.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        if (sentences.length > 1) {
            return sentences.map(sentence => `• ${sentence.trim()}`).join('\n');
        } else {
            // Create bullet points based on key concepts
            const content = [
                `• ${updateNotes.trim()}`,
                '• Key considerations and implementation details',
                '• Next steps and action items'
            ];
            return content.join('\n');
        }
    }

    /**
     * Create updated PowerPoint presentation
     * @param {Object} instructions - Update instructions
     * @returns {Promise<Object>} Updated presentation data
     */
    async createUpdatedPresentation(instructions) {
        if (!window.pythonService) {
            throw new Error('Python service is not available.');
        }
        return await window.pythonService.createUpdatedPresentation(
            this.uploadedFile.data.base64,
            instructions,
            this.uploadedFile.name
        );
    }

    /**
     * Update button state based on current conditions
     */
    updateButtonState() {
        const updateBtn = document.getElementById('process-update-btn');
        const updateInput = document.getElementById('update-notes-input');
        
        if (updateBtn && updateInput) {
            const hasFile = !!this.uploadedFile;
            const hasNotes = updateInput.value.trim().length > 0;
            const canProcess = hasFile && hasNotes && !this.isProcessing;
            
            updateBtn.disabled = !canProcess;
        }
    }

    /**
     * Show processing state
     * @param {string} message - Processing message
     */
    showProcessingState(message) {
        // Implementation would show loading state in UI
        console.log('Processing:', message);
    }

    /**
     * Hide processing state
     */
    hideProcessingState() {
        // Implementation would hide loading state in UI
        console.log('Processing complete');
    }

    /**
     * Show update progress
     */
    showUpdateProgress() {
        const progressSection = document.getElementById('update-progress-section');
        if (progressSection) {
            progressSection.classList.remove('hidden');
        }
    }

    /**
     * Hide update progress
     */
    hideUpdateProgress() {
        const progressSection = document.getElementById('update-progress-section');
        if (progressSection) {
            progressSection.classList.add('hidden');
        }
    }

    /**
     * Update progress status text
     * @param {string} status - Status message
     */
    updateProgressStatus(status) {
        const statusText = document.getElementById('update-status-text');
        if (statusText) {
            statusText.textContent = status;
        }
    }

    /**
     * Show update success
     * @param {Blob} presentationBlob - Updated presentation blob
     */
    showUpdateSuccess(presentationBlob) {
        // Create download link
        const url = URL.createObjectURL(presentationBlob);
        const fileName = this.uploadedFile.name.replace(/\.(pptx?)/i, '_updated.$1');
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.textContent = 'Download Updated Presentation';
        downloadLink.className = 'download-button';
        downloadLink.style.display = 'none'; // Hide the link initially
        
        // Add to DOM temporarily and trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Clean up the temporary link after a short delay
        setTimeout(() => {
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        }, 100);
        
        // Create visible download link for manual download if needed
        const visibleDownloadLink = document.createElement('a');
        visibleDownloadLink.href = url;
        visibleDownloadLink.download = fileName;
        visibleDownloadLink.textContent = 'Download Updated Presentation Again';
        visibleDownloadLink.className = 'download-button';
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'update-success';
        successDiv.innerHTML = `
            <div class="success-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Presentation updated successfully! Download should start automatically.</span>
            </div>
        `;
        successDiv.appendChild(visibleDownloadLink);
        
        // Insert into progress section
        const progressSection = document.getElementById('update-progress-section');
        if (progressSection) {
            progressSection.innerHTML = '';
            progressSection.appendChild(successDiv);
        }
        
        console.log('Download triggered for:', fileName);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * Save file info to localStorage
     */
    saveFileInfo() {
        if (!this.uploadedFile) return;
        
        try {
            const fileInfo = {
                name: this.uploadedFile.name,
                size: this.uploadedFile.size,
                type: this.uploadedFile.type,
                lastModified: this.uploadedFile.lastModified,
                uploadedAt: new Date().toISOString()
            };
            
            localStorage.setItem('powerpoint_generator_uploaded_file', JSON.stringify(fileInfo));
        } catch (error) {
            console.warn('Failed to save file info:', error);
        }
    }

    /**
     * Load saved file info
     */
    loadSavedFile() {
        try {
            const savedInfo = localStorage.getItem('powerpoint_generator_uploaded_file');
            if (savedInfo) {
                const fileInfo = JSON.parse(savedInfo);
                console.log('Found saved file info:', fileInfo.name);
                // Note: We can't restore the actual file data, only show the info
            }
        } catch (error) {
            console.warn('Failed to load saved file info:', error);
        }
    }

    /**
     * Clear saved file info
     */
    clearSavedFile() {
        try {
            localStorage.removeItem('powerpoint_generator_uploaded_file');
        } catch (error) {
            console.warn('Failed to clear saved file info:', error);
        }
    }

    /**
     * Get current uploaded file
     * @returns {Object|null} Uploaded file data
     */
    getUploadedFile() {
        return this.uploadedFile;
    }

    /**
     * Check if file is uploaded
     * @returns {boolean} Whether file is uploaded
     */
    hasUploadedFile() {
        return !!this.uploadedFile;
    }

    /**
     * Reset file upload manager
     */
    reset() {
        this.removeFile();
        this.isProcessing = false;
        this.hideUpdateProgress();
    }

    /**
     * Destroy file upload manager
     */
    destroy() {
        this.reset();
        // Clean up event listeners would go here
    }
}

// Create global instance
const fileUploadManager = new FileUploadManager();

// Make globally available
window.fileUploadManager = fileUploadManager;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploadManager;
}
