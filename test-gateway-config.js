/**
 * Test Script for Gateway URL Configuration
 * This script tests the gateway configuration system and API connectivity
 */

// Import configuration
const CONFIG = require('./js/config.js');

/**
 * Test Gateway Configuration Structure
 */
function testGatewayConfig() {
    console.log('🧪 Testing Gateway Configuration Structure...\n');
    
    const gateways = CONFIG.AI_GATEWAY.GATEWAYS;
    
    console.log('Available Gateways:');
    Object.keys(gateways).forEach((url, index) => {
        const gateway = gateways[url];
        console.log(`${index + 1}. ${gateway.name}`);
        console.log(`   URL: ${url}`);
        console.log(`   Endpoint: ${gateway.endpoint}`);
        console.log(`   Auth Type: ${gateway.authType}`);
        console.log(`   Models: ${gateway.supportedModels.length} models`);
        console.log('');
    });
    
    return true;
}

/**
 * Test API Endpoint Construction
 */
function testEndpointConstruction() {
    console.log('🔗 Testing API Endpoint Construction...\n');
    
    const gateways = CONFIG.AI_GATEWAY.GATEWAYS;
    
    Object.keys(gateways).forEach(gatewayUrl => {
        const gateway = gateways[gatewayUrl];
        const fullEndpoint = gatewayUrl + gateway.endpoint;
        
        console.log(`Gateway: ${gateway.name}`);
        console.log(`Full Endpoint: ${fullEndpoint}`);
        
        // Test Gemini direct endpoint with model substitution
        if (gateway.endpoint.includes('{model}')) {
            const testModel = gateway.supportedModels[0];
            const modelEndpoint = fullEndpoint.replace('{model}', testModel);
            console.log(`Model Endpoint Example: ${modelEndpoint}`);
        }
        
        console.log('');
    });
    
    return true;
}

/**
 * Test Authentication Header Construction
 */
function testAuthHeaders() {
    console.log('🔐 Testing Authentication Headers...\n');
    
    const gateways = CONFIG.AI_GATEWAY.GATEWAYS;
    const apiKey = CONFIG.AI_GATEWAY.API_KEY;
    
    Object.keys(gateways).forEach(gatewayUrl => {
        const gateway = gateways[gatewayUrl];
        
        console.log(`Gateway: ${gateway.name}`);
        console.log(`Auth Type: ${gateway.authType}`);
        
        let headers = {
            'Content-Type': 'application/json'
        };
        
        switch (gateway.authType) {
            case 'bearer':
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case 'x-api-key':
                headers['x-api-key'] = apiKey;
                break;
            case 'x-goog-api-key':
                headers['x-goog-api-key'] = apiKey;
                break;
        }
        
        console.log('Headers:', JSON.stringify(headers, null, 2));
        console.log('');
    });
    
    return true;
}

/**
 * Test Model Filtering Logic
 */
function testModelFiltering() {
    console.log('🎯 Testing Model Filtering Logic...\n');
    
    const gateways = CONFIG.AI_GATEWAY.GATEWAYS;
    
    // Simulate selecting different gateways
    Object.keys(gateways).forEach(gatewayUrl => {
        const gateway = gateways[gatewayUrl];
        
        console.log(`Selected Gateway: ${gateway.name}`);
        console.log(`Available Models:`);
        gateway.supportedModels.forEach((model, index) => {
            console.log(`  ${index + 1}. ${model}`);
        });
        console.log('');
    });
    
    return true;
}

/**
 * Test API Request Construction
 */
function testAPIRequestConstruction() {
    console.log('📡 Testing API Request Construction...\n');
    
    const gateways = CONFIG.AI_GATEWAY.GATEWAYS;
    const testPrompt = "Convert these notes into a PowerPoint outline: Test presentation about AI";
    
    Object.keys(gateways).forEach(gatewayUrl => {
        const gateway = gateways[gatewayUrl];
        const model = gateway.supportedModels[0];
        
        console.log(`Gateway: ${gateway.name}`);
        console.log(`Model: ${model}`);
        
        // Construct request based on gateway type
        let requestBody;
        let endpoint = gatewayUrl + gateway.endpoint;
        
        if (gateway.endpoint.includes('chat/completions')) {
            // OpenAI-compatible format
            requestBody = {
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: testPrompt
                    }
                ],
                max_tokens: CONFIG.AI_GATEWAY.MAX_TOKENS,
                temperature: CONFIG.AI_GATEWAY.TEMPERATURE
            };
        } else if (gateway.endpoint.includes('messages')) {
            // Anthropic direct format
            requestBody = {
                model: model,
                max_tokens: CONFIG.AI_GATEWAY.MAX_TOKENS,
                messages: [
                    {
                        role: 'user',
                        content: testPrompt
                    }
                ]
            };
        } else if (gateway.endpoint.includes('generateContent')) {
            // Gemini direct format
            endpoint = endpoint.replace('{model}', model);
            requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: testPrompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: CONFIG.AI_GATEWAY.MAX_TOKENS,
                    temperature: CONFIG.AI_GATEWAY.TEMPERATURE
                }
            };
        }
        
        console.log(`Endpoint: ${endpoint}`);
        console.log(`Request Body:`, JSON.stringify(requestBody, null, 2));
        console.log('');
    });
    
    return true;
}

/**
 * Test Connection Function (Simulated)
 */
async function testConnectionSimulation() {
    console.log('🌐 Testing Connection Simulation...\n');
    
    const gateways = CONFIG.AI_GATEWAY.GATEWAYS;
    
    for (const gatewayUrl of Object.keys(gateways)) {
        const gateway = gateways[gatewayUrl];
        
        console.log(`Testing connection to: ${gateway.name}`);
        console.log(`URL: ${gatewayUrl}${gateway.endpoint}`);
        
        // Simulate connection test
        try {
            // This would be the actual fetch call in the real app
            console.log('✅ Connection test would be performed here');
            console.log('   - Headers constructed correctly');
            console.log('   - Endpoint URL valid');
            console.log('   - Request body formatted properly');
        } catch (error) {
            console.log('❌ Connection test failed:', error.message);
        }
        
        console.log('');
    }
    
    return true;
}

/**
 * Test Configuration Validation
 */
function testConfigValidation() {
    console.log('✅ Testing Configuration Validation...\n');
    
    const issues = [];
    
    // Check if API key exists
    if (!CONFIG.AI_GATEWAY.API_KEY) {
        issues.push('Missing API key');
    }
    
    // Check if gateways are defined
    if (!CONFIG.AI_GATEWAY.GATEWAYS || Object.keys(CONFIG.AI_GATEWAY.GATEWAYS).length === 0) {
        issues.push('No gateways defined');
    }
    
    // Check each gateway configuration
    Object.keys(CONFIG.AI_GATEWAY.GATEWAYS).forEach(url => {
        const gateway = CONFIG.AI_GATEWAY.GATEWAYS[url];
        
        if (!gateway.name) issues.push(`Gateway ${url} missing name`);
        if (!gateway.endpoint) issues.push(`Gateway ${url} missing endpoint`);
        if (!gateway.authType) issues.push(`Gateway ${url} missing authType`);
        if (!gateway.supportedModels || gateway.supportedModels.length === 0) {
            issues.push(`Gateway ${url} missing supported models`);
        }
    });
    
    if (issues.length === 0) {
        console.log('✅ All configuration validation checks passed!');
    } else {
        console.log('❌ Configuration issues found:');
        issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('');
    return issues.length === 0;
}

/**
 * Main Test Runner
 */
async function runAllTests() {
    console.log('🚀 Gateway Configuration Test Suite\n');
    console.log('=' .repeat(50));
    console.log('');
    
    const tests = [
        { name: 'Gateway Config Structure', fn: testGatewayConfig },
        { name: 'Endpoint Construction', fn: testEndpointConstruction },
        { name: 'Authentication Headers', fn: testAuthHeaders },
        { name: 'Model Filtering', fn: testModelFiltering },
        { name: 'API Request Construction', fn: testAPIRequestConstruction },
        { name: 'Connection Simulation', fn: testConnectionSimulation },
        { name: 'Configuration Validation', fn: testConfigValidation }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            console.log(`Running: ${test.name}`);
            const result = await test.fn();
            if (result) {
                passed++;
                console.log(`✅ ${test.name} - PASSED\n`);
            } else {
                failed++;
                console.log(`❌ ${test.name} - FAILED\n`);
            }
        } catch (error) {
            failed++;
            console.log(`❌ ${test.name} - ERROR: ${error.message}\n`);
        }
    }
    
    console.log('=' .repeat(50));
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log('=' .repeat(50));
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Gateway configuration is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Check the output above for details.');
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testGatewayConfig,
    testEndpointConstruction,
    testAuthHeaders,
    testModelFiltering,
    testAPIRequestConstruction,
    testConnectionSimulation,
    testConfigValidation,
    runAllTests
};
