// Service for interacting with the Python backend for file processing
class PythonService {
    constructor(baseUrl = 'http://127.0.0.1:5001') {
        this.baseUrl = baseUrl;
    }

    /**
     * Check if the Python server is running
     * @returns {Promise<boolean>}
     */
    async checkServerStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/status`);
            return response.ok;
        } catch (error) {
            console.error('Python server is not running:', error);
            return false;
        }
    }

    /**
     * Extract content from a PowerPoint file
     * @param {string} base64File - Base64 encoded file content
     * @param {string} fileName - Original file name
     * @returns {Promise<Object>}
     */
    async extractPowerPointContent(base64File, fileName) {
        const response = await this.makeRequest('/extract-powerpoint', {
            method: 'POST',
            body: JSON.stringify({
                file_data: base64File,
                file_name: fileName
            })
        });
        return response;
    }

    /**
     * Create an updated PowerPoint presentation
     * @param {string} base64File - Base64 encoded original file
     * @param {Object} updateInstructions - Instructions for updating
     * @param {string} fileName - Original file name
     * @returns {Promise<Blob>}
     */
    async createUpdatedPresentation(base64File, updateInstructions, fileName) {
        console.log('[PythonService] createUpdatedPresentation called');
        console.log('[PythonService] Parameters:', {
            hasOriginalFile: !!base64File,
            updateInstructions: updateInstructions,
            fileName: fileName,
            slideCount: updateInstructions?.slides?.length
        });

        try {
            console.log('[PythonService] Making API request to /update-powerpoint');
            const response = await this.makeRequest('/update-powerpoint', {
                method: 'POST',
                body: JSON.stringify({
                    original_file: base64File,
                    update_instructions: updateInstructions,
                    file_name: fileName
                })
            }, 'blob');
            
            console.log('[PythonService] API request successful, blob received');
            console.log('[PythonService] Response type:', response.type);
            console.log('[PythonService] Response size:', response.size);
            
            return response;
        } catch (error) {
            console.error('[PythonService] Error in createUpdatedPresentation:', error);
            throw error;
        }
    }

    /**
     * Make a request to the Python backend
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @param {string} responseType - 'json' or 'blob'
     * @returns {Promise<any>}
     */
    async makeRequest(endpoint, options, responseType = 'json') {
        const url = `${this.baseUrl}${endpoint}`;
        
        console.log('[PythonService] makeRequest called');
        console.log('[PythonService] URL:', url);
        console.log('[PythonService] Endpoint:', endpoint);
        console.log('[PythonService] Response type:', responseType);
        console.log('[PythonService] Base URL:', this.baseUrl);
        
        try {
            console.log('[PythonService] Preparing fetch request...');
            const fetchOptions = {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };
            console.log('[PythonService] Fetch options:', fetchOptions);
            
            console.log('[PythonService] Making fetch request to:', url);
            const response = await fetch(url, fetchOptions);
            
            console.log('[PythonService] Fetch request completed');
            console.log('[PythonService] Response status:', response.status);
            console.log('[PythonService] Response statusText:', response.statusText);
            console.log('[PythonService] Response ok:', response.ok);
            console.log('[PythonService] Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                console.error('[PythonService] Response not OK, reading error text...');
                const errorText = await response.text().catch(() => 'Unable to read error response');
                console.error('[PythonService] Error text:', errorText);
                throw new Error(`Python service error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            if (responseType === 'blob') {
                console.log('[PythonService] Converting response to blob...');
                const blob = await response.blob();
                console.log('[PythonService] Blob created successfully');
                console.log('[PythonService] Blob type:', blob.type);
                console.log('[PythonService] Blob size:', blob.size);
                return blob;
            }
            
            console.log('[PythonService] Converting response to JSON...');
            const jsonData = await response.json();
            console.log('[PythonService] JSON data received:', jsonData);
            return jsonData;

        } catch (error) {
            console.error(`[PythonService] CRITICAL ERROR calling endpoint ${endpoint}:`, error);
            console.error(`[PythonService] Error type:`, error.constructor.name);
            console.error(`[PythonService] Error message:`, error.message);
            console.error(`[PythonService] Error stack:`, error.stack);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.error('[PythonService] This appears to be a network/fetch error');
                console.error('[PythonService] Check if Python server is running on:', this.baseUrl);
            }
            
            throw error;
        }
    }
}

// Create global instance
const pythonService = new PythonService();

// Make globally available
window.pythonService = pythonService;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pythonService;
}
