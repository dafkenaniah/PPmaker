// Utility functions for formatting data and text
class Formatters {
    /**
     * Format character count with appropriate styling
     * @param {number} count - Character count
     * @param {number} minLength - Minimum required length
     * @param {number} maxLength - Maximum allowed length
     * @returns {Object} - Formatted count info
     */
    static formatCharacterCount(count, minLength = CONFIG.APP.MIN_NOTES_LENGTH, maxLength = CONFIG.APP.MAX_NOTES_LENGTH) {
        const percentage = Math.min((count / minLength) * 100, 100);
        
        let status = 'insufficient';
        let className = 'text-red-500';
        
        if (count >= minLength && count <= maxLength) {
            status = 'valid';
            className = 'text-green-600';
        } else if (count > maxLength) {
            status = 'excessive';
            className = 'text-orange-500';
        }
        
        return {
            count,
            percentage,
            status,
            className,
            formatted: count.toLocaleString()
        };
    }

    /**
     * Format slide title for display
     * @param {string} title - Raw slide title
     * @param {number} maxLength - Maximum title length
     * @returns {string} - Formatted title
     */
    static formatSlideTitle(title, maxLength = 60) {
        if (!title) return 'Untitled Slide';
        
        // Clean up title
        let formatted = title.trim();
        
        // Remove markdown headers
        formatted = formatted.replace(/^#+\s*/, '');
        
        // Capitalize first letter
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
        
        // Truncate if too long
        if (formatted.length > maxLength) {
            formatted = formatted.substring(0, maxLength - 3) + '...';
        }
        
        return formatted;
    }

    /**
     * Format bullet points for display
     * @param {Array<string>} bullets - Array of bullet points
     * @param {number} maxBullets - Maximum bullets to show
     * @returns {Array<string>} - Formatted bullets
     */
    static formatBulletPoints(bullets, maxBullets = 5) {
        if (!Array.isArray(bullets)) return [];
        
        return bullets
            .slice(0, maxBullets)
            .map(bullet => {
                let formatted = bullet.trim();
                
                // Remove bullet markers
                formatted = formatted.replace(/^[-*•]\s*/, '');
                
                // Capitalize first letter
                formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
                
                // Ensure it ends with proper punctuation
                if (!/[.!?]$/.test(formatted)) {
                    formatted += '.';
                }
                
                return formatted;
            })
            .filter(bullet => bullet.length > 1);
    }

    /**
     * Format duration string
     * @param {string|number} duration - Duration in minutes or string
     * @returns {string} - Formatted duration
     */
    static formatDuration(duration) {
        if (typeof duration === 'string') {
            return duration;
        }
        
        if (typeof duration === 'number') {
            if (duration < 1) {
                return '< 1 minute';
            } else if (duration === 1) {
                return '1 minute';
            } else if (duration < 60) {
                return `${Math.round(duration)} minutes`;
            } else {
                const hours = Math.floor(duration / 60);
                const minutes = Math.round(duration % 60);
                return `${hours}h ${minutes}m`;
            }
        }
        
        return 'Unknown duration';
    }

    /**
     * Format timestamp for display
     * @param {Date|string} timestamp - Timestamp to format
     * @param {string} format - Format type ('relative', 'short', 'long')
     * @returns {string} - Formatted timestamp
     */
    static formatTimestamp(timestamp, format = 'relative') {
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
        
        switch (format) {
            case 'relative':
                return this.getRelativeTime(date);
            case 'short':
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            case 'long':
                return date.toLocaleDateString([], { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            default:
                return date.toISOString();
        }
    }

    /**
     * Get relative time string (e.g., "2 minutes ago")
     * @param {Date} date - Date to compare
     * @returns {string} - Relative time string
     */
    static getRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSeconds < 60) {
            return 'Just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @param {number} decimals - Number of decimal places
     * @returns {string} - Formatted file size
     */
    static formatFileSize(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Format progress percentage
     * @param {number} current - Current progress value
     * @param {number} total - Total value
     * @returns {Object} - Progress info
     */
    static formatProgress(current, total) {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        const clamped = Math.max(0, Math.min(100, percentage));
        
        return {
            percentage: clamped,
            formatted: `${clamped}%`,
            fraction: `${current}/${total}`,
            decimal: clamped / 100
        };
    }

    /**
     * Format text for safe HTML display
     * @param {string} text - Text to format
     * @param {boolean} preserveLineBreaks - Whether to preserve line breaks
     * @returns {string} - HTML-safe text
     */
    static formatTextForHTML(text, preserveLineBreaks = true) {
        if (!text) return '';
        
        // Escape HTML characters
        let formatted = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        // Preserve line breaks if requested
        if (preserveLineBreaks) {
            formatted = formatted.replace(/\n/g, '<br>');
        }
        
        return formatted;
    }

    /**
     * Format slide type for display
     * @param {string} slideType - Slide type
     * @returns {Object} - Formatted slide type info
     */
    static formatSlideType(slideType) {
        const types = {
            'title': {
                label: 'Title Slide',
                icon: '📋',
                className: 'slide-type-title',
                color: '#3b82f6'
            },
            'content': {
                label: 'Content Slide',
                icon: '📄',
                className: 'slide-type-content',
                color: '#10b981'
            },
            'conclusion': {
                label: 'Conclusion',
                icon: '🎯',
                className: 'slide-type-conclusion',
                color: '#f59e0b'
            },
            'section': {
                label: 'Section Break',
                icon: '📑',
                className: 'slide-type-section',
                color: '#8b5cf6'
            }
        };
        
        return types[slideType] || types['content'];
    }

    /**
     * Format notes text for processing
     * @param {string} notes - Raw notes text
     * @returns {string} - Cleaned notes
     */
    static formatNotesForProcessing(notes) {
        if (!notes) return '';
        
        return notes
            .trim()
            .replace(/\r\n/g, '\n')  // Normalize line endings
            .replace(/\n{3,}/g, '\n\n')  // Limit consecutive line breaks
            .replace(/[ \t]+/g, ' ')  // Normalize whitespace
            .replace(/^\s+|\s+$/gm, '');  // Trim lines
    }

    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @param {string} suffix - Suffix to add (default: '...')
     * @returns {string} - Truncated text
     */
    static truncateText(text, maxLength, suffix = '...') {
        if (!text || text.length <= maxLength) {
            return text || '';
        }
        
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    /**
     * Format error message for display
     * @param {Error|string} error - Error object or message
     * @returns {string} - User-friendly error message
     */
    static formatErrorMessage(error) {
        if (typeof error === 'string') {
            return error;
        }
        
        if (error instanceof Error) {
            // Map common error types to user-friendly messages
            if (error.message.includes('fetch')) {
                return CONFIG.ERRORS.NETWORK_ERROR;
            }
            if (error.message.includes('timeout')) {
                return CONFIG.ERRORS.TIMEOUT_ERROR;
            }
            if (error.message.includes('AI') || error.message.includes('API')) {
                return CONFIG.ERRORS.AI_API_ERROR;
            }
            
            return error.message || CONFIG.ERRORS.GENERIC_ERROR;
        }
        
        return CONFIG.ERRORS.GENERIC_ERROR;
    }

    /**
     * Format success message for display
     * @param {string} type - Success type
     * @param {Object} data - Additional data
     * @returns {string} - Formatted success message
     */
    static formatSuccessMessage(type, data = {}) {
        switch (type) {
            case 'outline_generated':
                return `${CONFIG.SUCCESS.OUTLINE_GENERATED} Generated ${data.slideCount || 0} slides.`;
            case 'powerpoint_created':
                return `${CONFIG.SUCCESS.POWERPOINT_CREATED} File size: ${this.formatFileSize(data.fileSize || 0)}.`;
            case 'file_downloaded':
                return `${CONFIG.SUCCESS.FILE_DOWNLOADED} Saved as "${data.filename || 'presentation.pptx'}".`;
            default:
                return 'Operation completed successfully!';
        }
    }
}

// Make globally available
window.Formatters = Formatters;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Formatters;
}
