/**
 * Test Script for App Integration
 * This script tests the actual app's configuration manager functionality
 */

// Test if we can access the configuration manager
function testConfigurationManagerIntegration() {
    console.log('🔧 Testing Configuration Manager Integration...\n');
    
    // Check if the configuration manager file exists and is properly structured
    try {
        const fs = require('fs');
        const path = require('path');
        
        const configManagerPath = path.join(__dirname, 'js', 'components', 'ConfigurationManager.js');
        
        if (fs.existsSync(configManagerPath)) {
            console.log('✅ ConfigurationManager.js file exists');
            
            const content = fs.readFileSync(configManagerPath, 'utf8');
            
            // Check for key functions
            const requiredFunctions = [
                'initializeGatewayDropdown',
                'updateModelDropdown',
                'testConnection',
                'loadConfiguration',
                'saveConfiguration'
            ];
            
            const missingFunctions = [];
            requiredFunctions.forEach(func => {
                if (!content.includes(func)) {
                    missingFunctions.push(func);
                }
            });
            
            if (missingFunctions.length === 0) {
                console.log('✅ All required functions found in ConfigurationManager');
            } else {
                console.log('❌ Missing functions:', missingFunctions);
            }
            
            // Check for gateway configuration usage
            if (content.includes('CONFIG.AI_GATEWAY.GATEWAYS')) {
                console.log('✅ Gateway configuration is being used');
            } else {
                console.log('❌ Gateway configuration not found in ConfigurationManager');
            }
            
            // Check for event listeners
            if (content.includes('addEventListener')) {
                console.log('✅ Event listeners are set up');
            } else {
                console.log('❌ No event listeners found');
            }
            
        } else {
            console.log('❌ ConfigurationManager.js file not found');
        }
        
    } catch (error) {
        console.log('❌ Error testing ConfigurationManager:', error.message);
    }
    
    console.log('');
}

// Test if the main app file includes the configuration manager
function testAppIntegration() {
    console.log('🔗 Testing App Integration...\n');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        const appPath = path.join(__dirname, 'js', 'app.js');
        
        if (fs.existsSync(appPath)) {
            console.log('✅ app.js file exists');
            
            const content = fs.readFileSync(appPath, 'utf8');
            
            // Check if ConfigurationManager is imported/included
            if (content.includes('ConfigurationManager') || content.includes('configurationManager')) {
                console.log('✅ ConfigurationManager is referenced in app.js');
            } else {
                console.log('❌ ConfigurationManager not found in app.js');
            }
            
            // Check if configuration is being used
            if (content.includes('CONFIG') || content.includes('config')) {
                console.log('✅ Configuration is being used in app.js');
            } else {
                console.log('❌ Configuration not found in app.js');
            }
            
        } else {
            console.log('❌ app.js file not found');
        }
        
    } catch (error) {
        console.log('❌ Error testing app integration:', error.message);
    }
    
    console.log('');
}

// Test if the HTML file includes the configuration manager
function testHTMLIntegration() {
    console.log('📄 Testing HTML Integration...\n');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        const htmlPath = path.join(__dirname, 'index.html');
        
        if (fs.existsSync(htmlPath)) {
            console.log('✅ index.html file exists');
            
            const content = fs.readFileSync(htmlPath, 'utf8');
            
            // Check if ConfigurationManager script is included
            if (content.includes('ConfigurationManager.js')) {
                console.log('✅ ConfigurationManager.js is included in HTML');
            } else {
                console.log('❌ ConfigurationManager.js not included in HTML');
            }
            
            // Check if config.js is included
            if (content.includes('config.js')) {
                console.log('✅ config.js is included in HTML');
            } else {
                console.log('❌ config.js not included in HTML');
            }
            
            // Check for configuration tab
            if (content.includes('config') || content.includes('Config')) {
                console.log('✅ Configuration tab/section found in HTML');
            } else {
                console.log('❌ Configuration tab/section not found in HTML');
            }
            
        } else {
            console.log('❌ index.html file not found');
        }
        
    } catch (error) {
        console.log('❌ Error testing HTML integration:', error.message);
    }
    
    console.log('');
}

// Test if all required files exist
function testFileStructure() {
    console.log('📁 Testing File Structure...\n');
    
    const requiredFiles = [
        'js/config.js',
        'js/components/ConfigurationManager.js',
        'js/app.js',
        'index.html',
        'js/services/aiService.js'
    ];
    
    const fs = require('fs');
    const path = require('path');
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} missing`);
        }
    });
    
    console.log('');
}

// Test configuration file structure
function testConfigFile() {
    console.log('⚙️ Testing Configuration File...\n');
    
    try {
        const CONFIG = require('./js/config.js');
        
        // Check main structure
        if (CONFIG.AI_GATEWAY) {
            console.log('✅ AI_GATEWAY configuration exists');
            
            if (CONFIG.AI_GATEWAY.GATEWAYS) {
                const gatewayCount = Object.keys(CONFIG.AI_GATEWAY.GATEWAYS).length;
                console.log(`✅ ${gatewayCount} gateways configured`);
                
                // Check each gateway
                Object.keys(CONFIG.AI_GATEWAY.GATEWAYS).forEach(url => {
                    const gateway = CONFIG.AI_GATEWAY.GATEWAYS[url];
                    console.log(`   - ${gateway.name}: ${gateway.supportedModels.length} models`);
                });
            } else {
                console.log('❌ No gateways configured');
            }
            
            if (CONFIG.AI_GATEWAY.API_KEY) {
                console.log('✅ API key is configured');
            } else {
                console.log('❌ API key is missing');
            }
            
        } else {
            console.log('❌ AI_GATEWAY configuration missing');
        }
        
    } catch (error) {
        console.log('❌ Error loading configuration:', error.message);
    }
    
    console.log('');
}

// Main test runner
async function runIntegrationTests() {
    console.log('🚀 App Integration Test Suite\n');
    console.log('=' .repeat(50));
    console.log('');
    
    const tests = [
        { name: 'File Structure', fn: testFileStructure },
        { name: 'Configuration File', fn: testConfigFile },
        { name: 'Configuration Manager', fn: testConfigurationManagerIntegration },
        { name: 'App Integration', fn: testAppIntegration },
        { name: 'HTML Integration', fn: testHTMLIntegration }
    ];
    
    for (const test of tests) {
        try {
            console.log(`Running: ${test.name}`);
            await test.fn();
        } catch (error) {
            console.log(`❌ ${test.name} - ERROR: ${error.message}\n`);
        }
    }
    
    console.log('=' .repeat(50));
    console.log('Integration tests complete!');
    console.log('=' .repeat(50));
}

// Run tests if this script is executed directly
if (require.main === module) {
    runIntegrationTests().catch(console.error);
}

module.exports = {
    testConfigurationManagerIntegration,
    testAppIntegration,
    testHTMLIntegration,
    testFileStructure,
    testConfigFile,
    runIntegrationTests
};
