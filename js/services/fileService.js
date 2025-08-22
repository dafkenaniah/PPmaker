// File Service for handling file operations and downloads
class FileService {
    constructor() {
        this.downloadHistory = [];
        this.maxHistorySize = 10;
        this.outputFolder = this.getOutputFolder();
    }

    /**
     * Get the output folder path (browser-compatible version)
     * @returns {string} Output folder path
     */
    getOutputFolder() {
        // For browser environment, just return a default name
        // The actual path will be determined by the browser's download folder
        return 'PowerPoint_Presentations';
    }

    /**
     * Ensure output folder exists (browser-compatible version)
     */
    async ensureOutputFolder() {
        try {
            // In browser environment, we can't create folders directly
            // The browser will handle download location
            console.log('Using browser default download location');
        } catch (error) {
            console.warn('Browser environment - using default downloads:', error);
        }
    }

    /**
     * Download PowerPoint file
     * @param {Blob} fileBlob - PowerPoint file blob
     * @param {string} filename - Filename for download
     * @returns {Promise<string>} - Download URL
     */
    async downloadPowerPoint(fileBlob, filename = null) {
        try {
            // Generate filename if not provided
            if (!filename) {
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
                filename = `presentation_${timestamp}.pptx`;
            }

            // Ensure .pptx extension
            if (!filename.endsWith('.pptx')) {
                filename += '.pptx';
            }

            // Create download URL
            const downloadUrl = URL.createObjectURL(fileBlob);
            
            // Create temporary download link
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';
            
            // Add to DOM, click, and remove
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Add to download history
            this.addToHistory({
                filename: filename,
                downloadUrl: downloadUrl,
                timestamp: new Date(),
                size: fileBlob.size
            });
            
            // Clean up URL after a delay to allow download to complete
            setTimeout(() => {
                URL.revokeObjectURL(downloadUrl);
            }, 10000);
            
            return downloadUrl;
        } catch (error) {
            console.error('Error downloading PowerPoint file:', error);
            throw new Error('Failed to download PowerPoint file');
        }
    }

    /**
     * Save notes to localStorage
     * @param {string} notes - Notes content
     * @param {string} key - Storage key (optional)
     */
    saveNotes(notes, key = 'powerpoint_generator_notes') {
        try {
            const saveData = {
                notes: notes,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem(key, JSON.stringify(saveData));
        } catch (error) {
            console.error('Error saving notes:', error);
            // Fail silently for localStorage errors
        }
    }

    /**
     * Load notes from localStorage
     * @param {string} key - Storage key (optional)
     * @returns {string|null} - Saved notes or null
     */
    loadNotes(key = 'powerpoint_generator_notes') {
        try {
            const savedData = localStorage.getItem(key);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                return parsed.notes || null;
            }
        } catch (error) {
            console.error('Error loading notes:', error);
        }
        return null;
    }

    /**
     * Save slide outline to localStorage
     * @param {Object} outline - Slide outline data
     * @param {string} key - Storage key (optional)
     */
    saveOutline(outline, key = 'powerpoint_generator_outline') {
        try {
            const saveData = {
                outline: outline,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem(key, JSON.stringify(saveData));
        } catch (error) {
            console.error('Error saving outline:', error);
        }
    }

    /**
     * Load slide outline from localStorage
     * @param {string} key - Storage key (optional)
     * @returns {Object|null} - Saved outline or null
     */
    loadOutline(key = 'powerpoint_generator_outline') {
        try {
            const savedData = localStorage.getItem(key);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                return parsed.outline || null;
            }
        } catch (error) {
            console.error('Error loading outline:', error);
        }
        return null;
    }

    /**
     * Clear all saved data
     */
    clearSavedData() {
        try {
            localStorage.removeItem('powerpoint_generator_notes');
            localStorage.removeItem('powerpoint_generator_outline');
            this.downloadHistory = [];
        } catch (error) {
            console.error('Error clearing saved data:', error);
        }
    }

    /**
     * Export slide outline as JSON file
     * @param {Object} outline - Slide outline to export
     * @param {string} filename - Filename for export
     */
    exportOutlineAsJSON(outline, filename = null) {
        try {
            if (!filename) {
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
                filename = `slide_outline_${timestamp}.json`;
            }

            const jsonContent = JSON.stringify(outline, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json' });
            
            const downloadUrl = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            setTimeout(() => {
                URL.revokeObjectURL(downloadUrl);
            }, 5000);
            
        } catch (error) {
            console.error('Error exporting outline:', error);
            throw new Error('Failed to export outline as JSON');
        }
    }

    /**
     * Import slide outline from JSON file
     * @param {File} file - JSON file to import
     * @returns {Promise<Object>} - Imported outline
     */
    async importOutlineFromJSON(file) {
        return new Promise((resolve, reject) => {
            try {
                if (!file.type.includes('json')) {
                    reject(new Error('Please select a valid JSON file'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const outline = JSON.parse(e.target.result);
                        
                        // Basic validation
                        if (!outline.slides || !Array.isArray(outline.slides)) {
                            reject(new Error('Invalid outline format'));
                            return;
                        }
                        
                        resolve(outline);
                    } catch (parseError) {
                        reject(new Error('Invalid JSON format'));
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('Failed to read file'));
                };
                
                reader.readAsText(file);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Add download to history
     * @param {Object} downloadInfo - Download information
     */
    addToHistory(downloadInfo) {
        this.downloadHistory.unshift(downloadInfo);
        
        // Limit history size
        if (this.downloadHistory.length > this.maxHistorySize) {
            const removed = this.downloadHistory.splice(this.maxHistorySize);
            // Clean up old URLs
            removed.forEach(item => {
                if (item.downloadUrl) {
                    URL.revokeObjectURL(item.downloadUrl);
                }
            });
        }
    }

    /**
     * Get download history
     * @returns {Array} - Download history
     */
    getDownloadHistory() {
        return [...this.downloadHistory];
    }

    /**
     * Clear download history
     */
    clearDownloadHistory() {
        // Clean up URLs
        this.downloadHistory.forEach(item => {
            if (item.downloadUrl) {
                URL.revokeObjectURL(item.downloadUrl);
            }
        });
        
        this.downloadHistory = [];
    }

    /**
     * Format file size for display
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
     * Validate file type
     * @param {File} file - File to validate
     * @param {Array<string>} allowedTypes - Allowed MIME types
     * @returns {boolean} - Whether file type is valid
     */
    validateFileType(file, allowedTypes = ['application/json']) {
        return allowedTypes.some(type => file.type.includes(type));
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} - Whether localStorage is available
     */
    isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get storage usage information
     * @returns {Object} - Storage usage info
     */
    getStorageInfo() {
        if (!this.isLocalStorageAvailable()) {
            return { available: false };
        }

        try {
            let totalSize = 0;
            let itemCount = 0;
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                    itemCount++;
                }
            }
            
            return {
                available: true,
                totalSize: totalSize,
                itemCount: itemCount,
                formattedSize: this.formatFileSize(totalSize)
            };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    /**
     * Create backup of all app data
     * @returns {string} - Backup data as JSON string
     */
    createBackup() {
        try {
            const backup = {
                notes: this.loadNotes(),
                outline: this.loadOutline(),
                downloadHistory: this.getDownloadHistory().map(item => ({
                    filename: item.filename,
                    timestamp: item.timestamp,
                    size: item.size
                    // Exclude downloadUrl as it's temporary
                })),
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            return JSON.stringify(backup, null, 2);
        } catch (error) {
            console.error('Error creating backup:', error);
            throw new Error('Failed to create backup');
        }
    }

    /**
     * Restore from backup
     * @param {string} backupData - Backup data as JSON string
     */
    restoreFromBackup(backupData) {
        try {
            const backup = JSON.parse(backupData);
            
            if (backup.notes) {
                this.saveNotes(backup.notes);
            }
            
            if (backup.outline) {
                this.saveOutline(backup.outline);
            }
            
            // Note: Download history URLs can't be restored as they're temporary
            
        } catch (error) {
            console.error('Error restoring from backup:', error);
            throw new Error('Failed to restore from backup');
        }
    }
}

// Create and export singleton instance
const fileService = new FileService();

// Make globally available
window.fileService = fileService;

// Export for use in other modules (browser-compatible)
if (typeof window !== 'undefined') {
    window.fileService = fileService;
}
