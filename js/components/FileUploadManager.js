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
            updateBtn.addEventListener('click', () => {
                this.processUpdate();
            });
        }

        // Monitor update notes input
        const updateInput = document.getElementById('update-notes-input');
        if (updateInput) {
            updateInput.addEventListener('input', () => {
                this.updateButtonState();
            });
        }
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
        if (!this.uploadedFile || this.isProcessing) {
            return;
        }

        const updateNotes = document.getElementById('update-notes-input')?.value?.trim();
        if (!updateNotes) {
            this.showError('Please enter update instructions.');
            return;
        }

        try {
            this.isProcessing = true;
            this.showUpdateProgress();

            // Extract PowerPoint content
            this.updateProgressStatus('Extracting presentation content...');
            const extractedContent = await this.extractPowerPointContent();

            // Generate update instructions
            this.updateProgressStatus('Generating update instructions...');
            const updateInstructions = await this.generateUpdateInstructions(extractedContent, updateNotes);

            // Create updated PowerPoint
            this.updateProgressStatus('Creating updated presentation...');
            const updatedPresentation = await this.createUpdatedPresentation(updateInstructions);

            // Show success and download
            this.showUpdateSuccess(updatedPresentation);
            if (window.timeSavingsService) {
                window.timeSavingsService.trackTimeSaved('update_powerpoint');
            }

        } catch (error) {
            console.error('Update processing error:', error);
            this.showError('Failed to process updates. Please try again.');
        } finally {
            this.isProcessing = false;
            this.hideUpdateProgress();
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
        const prompt = `
        You are a PowerPoint update assistant. I have an existing presentation and need to make updates based on user instructions.

        Current presentation structure:
        ${JSON.stringify(content, null, 2)}

        User update instructions:
        ${updateNotes}

        Please provide detailed instructions for updating the presentation, including:
        1. Which slides to modify, add, or remove
        2. Specific content changes for each slide
        3. Any formatting or layout adjustments needed
        4. New slide content if slides need to be added

        Return the response in JSON format with the updated presentation structure.
        `;

        const response = await aiService.generateContent(prompt);
        return JSON.parse(response.content);
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
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'update-success';
        successDiv.innerHTML = `
            <div class="success-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Presentation updated successfully!</span>
            </div>
        `;
        successDiv.appendChild(downloadLink);
        
        // Insert into progress section
        const progressSection = document.getElementById('update-progress-section');
        if (progressSection) {
            progressSection.innerHTML = '';
            progressSection.appendChild(successDiv);
        }
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
