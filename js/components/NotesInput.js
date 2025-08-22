// Notes Input Component - Handles user input and validation
class NotesInput {
    constructor() {
        this.textarea = null;
        this.charCounter = null;
        this.clearButton = null;
        this.autoSaveTimer = null;
        this.debounceTimer = null;
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.textarea = document.getElementById('notes-input');
        this.charCounter = document.getElementById('char-count');
        this.clearButton = document.getElementById('clear-btn');

        if (!this.textarea || !this.charCounter || !this.clearButton) {
            console.error('NotesInput: Required elements not found');
            return;
        }

        this.setupEventListeners();
        this.loadSavedNotes();
        this.updateCharacterCount();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Input event with debouncing
        this.textarea.addEventListener('input', (e) => {
            this.handleInput(e);
        });

        // Paste event
        this.textarea.addEventListener('paste', (e) => {
            setTimeout(() => this.handleInput(e), 10);
        });

        // Clear button
        this.clearButton.addEventListener('click', () => {
            this.clearNotes();
        });

        // Keyboard shortcuts
        this.textarea.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        // Focus and blur events
        this.textarea.addEventListener('focus', () => {
            this.onFocus();
        });

        this.textarea.addEventListener('blur', () => {
            this.onBlur();
        });

        // Auto-save setup
        this.setupAutoSave();
    }

    /**
     * Handle input events
     * @param {Event} event - Input event
     */
    handleInput(event) {
        // Clear existing debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Update character count immediately
        this.updateCharacterCount();

        // Debounce validation and other operations
        const debounceDelay = (typeof CONFIG !== 'undefined') ? CONFIG.APP.DEBOUNCE_DELAY : 500;
        this.debounceTimer = setTimeout(() => {
            this.validateInput();
            this.updateGenerateButton();
            this.saveNotes();
        }, debounceDelay);
    }

    /**
     * Handle keydown events for shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeydown(event) {
        // Ctrl+Enter to generate outline
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            const generateBtn = document.getElementById('generate-outline-btn');
            if (generateBtn && !generateBtn.disabled) {
                generateBtn.click();
            }
        }

        // Ctrl+A to select all
        if (event.ctrlKey && event.key === 'a') {
            // Let default behavior handle this
            return;
        }

        // Tab key handling for better UX
        if (event.key === 'Tab') {
            event.preventDefault();
            const start = this.textarea.selectionStart;
            const end = this.textarea.selectionEnd;
            
            // Insert tab character
            this.textarea.value = this.textarea.value.substring(0, start) + 
                                 '    ' + 
                                 this.textarea.value.substring(end);
            
            // Move cursor
            this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
            
            this.handleInput(event);
        }
    }

    /**
     * Handle focus event
     */
    onFocus() {
        this.textarea.parentElement.classList.add('focused');
    }

    /**
     * Handle blur event
     */
    onBlur() {
        this.textarea.parentElement.classList.remove('focused');
        this.saveNotes(); // Save on blur
    }

    /**
     * Update character count display
     */
    updateCharacterCount() {
        const text = this.textarea.value;
        const count = text.length;
        
        // Format with fallback
        let countInfo;
        if (typeof Formatters !== 'undefined') {
            countInfo = Formatters.formatCharacterCount(count);
        } else {
            const minLength = 100;
            const maxLength = 10000;
            countInfo = {
                formatted: count.toLocaleString(),
                className: count >= minLength && count <= maxLength ? 'text-green-600' : 'text-red-500'
            };
        }
        
        this.charCounter.textContent = countInfo.formatted;
        this.charCounter.className = `character-counter ${countInfo.className}`;
        
        // Update counter with additional info
        const minLength = (typeof CONFIG !== 'undefined') ? CONFIG.APP.MIN_NOTES_LENGTH : 100;
        const maxLength = (typeof CONFIG !== 'undefined') ? CONFIG.APP.MAX_NOTES_LENGTH : 10000;
        
        if (count < minLength) {
            const remaining = minLength - count;
            this.charCounter.title = `${remaining} more characters needed`;
        } else if (count > maxLength) {
            const excess = count - maxLength;
            this.charCounter.title = `${excess} characters over limit`;
        } else {
            this.charCounter.title = `${count} characters (valid length)`;
        }
    }

    /**
     * Validate input and show feedback
     */
    validateInput() {
        const text = this.textarea.value;
        
        // Validate with fallback
        let validation;
        if (typeof Validators !== 'undefined') {
            validation = Validators.validateNotes(text);
        } else {
            validation = {
                isValid: text.length >= 100,
                errors: text.length < 100 ? ['Please enter at least 100 characters'] : [],
                warnings: [],
                suggestions: []
            };
        }
        
        // Remove existing validation classes
        this.textarea.classList.remove('invalid', 'warning', 'valid');
        
        // Add appropriate class
        if (!validation.isValid) {
            this.textarea.classList.add('invalid');
        } else if (validation.warnings && validation.warnings.length > 0) {
            this.textarea.classList.add('warning');
        } else {
            this.textarea.classList.add('valid');
        }

        // Show validation messages (could be expanded to show in UI)
        if (validation.errors && validation.errors.length > 0) {
            console.log('Validation errors:', validation.errors);
        }
        
        if (validation.warnings && validation.warnings.length > 0) {
            console.log('Validation warnings:', validation.warnings);
        }
        
        if (validation.suggestions && validation.suggestions.length > 0) {
            console.log('Validation suggestions:', validation.suggestions);
        }

        return validation;
    }

    /**
     * Update the generate button state
     */
    updateGenerateButton() {
        const generateBtn = document.getElementById('generate-outline-btn');
        if (!generateBtn) return;

        const text = this.textarea.value;
        
        // Validate with fallback
        let validation;
        if (typeof Validators !== 'undefined') {
            validation = Validators.validateNotes(text);
        } else {
            validation = {
                isValid: text.length >= 100,
                errors: text.length < 100 ? ['Please enter at least 100 characters'] : []
            };
        }
        
        generateBtn.disabled = !validation.isValid;
        
        if (validation.isValid) {
            generateBtn.title = 'Generate slide outline from your notes';
            generateBtn.classList.remove('disabled');
        } else {
            generateBtn.title = validation.errors.join(', ');
            generateBtn.classList.add('disabled');
        }
    }

    /**
     * Clear notes
     */
    clearNotes() {
        if (this.textarea.value.length > 0) {
            const confirmed = confirm('Are you sure you want to clear all notes? This action cannot be undone.');
            if (!confirmed) return;
        }

        this.textarea.value = '';
        this.updateCharacterCount();
        this.validateInput();
        this.updateGenerateButton();
        this.textarea.focus();
        
        // Clear saved notes
        fileService.saveNotes('');
        
        // Trigger input event for other components
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Also dispatch custom event
        document.dispatchEvent(new CustomEvent('notesChanged', { 
            detail: { notes: '' } 
        }));
    }

    /**
     * Get current notes text
     * @returns {string} - Current notes
     */
    getNotes() {
        return this.textarea.value;
    }

    /**
     * Set notes text
     * @param {string} notes - Notes to set
     */
    setNotes(notes) {
        this.textarea.value = notes || '';
        this.updateCharacterCount();
        this.validateInput();
        this.updateGenerateButton();
        
        // Trigger input event
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Load saved notes from storage
     */
    loadSavedNotes() {
        const savedNotes = fileService.loadNotes();
        if (savedNotes) {
            this.setNotes(savedNotes);
        }
    }

    /**
     * Save notes to storage
     */
    saveNotes() {
        const notes = this.getNotes();
        fileService.saveNotes(notes);
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        // Auto-save every 30 seconds if there are changes
        const autoSaveInterval = (typeof CONFIG !== 'undefined') ? CONFIG.APP.AUTO_SAVE_INTERVAL : 30000;
        this.autoSaveTimer = setInterval(() => {
            if (this.textarea.value.length > 0) {
                this.saveNotes();
            }
        }, autoSaveInterval);
    }

    /**
     * Insert text at cursor position
     * @param {string} text - Text to insert
     */
    insertTextAtCursor(text) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        
        this.textarea.value = this.textarea.value.substring(0, start) + 
                             text + 
                             this.textarea.value.substring(end);
        
        // Move cursor to end of inserted text
        const newPosition = start + text.length;
        this.textarea.selectionStart = this.textarea.selectionEnd = newPosition;
        
        this.handleInput(new Event('input'));
        this.textarea.focus();
    }

    /**
     * Format selected text or insert formatting
     * @param {string} format - Format type ('header', 'bullet', 'number')
     */
    formatText(format) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const selectedText = this.textarea.value.substring(start, end);
        
        let formattedText = '';
        
        switch (format) {
            case 'header':
                formattedText = selectedText ? `# ${selectedText}` : '# ';
                break;
            case 'bullet':
                formattedText = selectedText ? `- ${selectedText}` : '- ';
                break;
            case 'number':
                formattedText = selectedText ? `1. ${selectedText}` : '1. ';
                break;
            default:
                return;
        }
        
        this.textarea.value = this.textarea.value.substring(0, start) + 
                             formattedText + 
                             this.textarea.value.substring(end);
        
        // Position cursor appropriately
        const newPosition = start + formattedText.length;
        this.textarea.selectionStart = this.textarea.selectionEnd = newPosition;
        
        this.handleInput(new Event('input'));
        this.textarea.focus();
    }

    /**
     * Get text statistics
     * @returns {Object} - Text statistics
     */
    getTextStats() {
        const text = this.textarea.value;
        return {
            characters: text.length,
            words: Validators.countWords(text),
            sentences: Validators.countSentences(text),
            paragraphs: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
            lines: text.split('\n').length
        };
    }

    /**
     * Enable or disable the input
     * @param {boolean} enabled - Whether to enable the input
     */
    setEnabled(enabled) {
        this.textarea.disabled = !enabled;
        this.clearButton.disabled = !enabled;
        
        if (enabled) {
            this.textarea.classList.remove('disabled');
        } else {
            this.textarea.classList.add('disabled');
        }
    }

    /**
     * Cleanup component
     */
    destroy() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }
}

// Create and export singleton instance
const notesInput = new NotesInput();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = notesInput;
}
