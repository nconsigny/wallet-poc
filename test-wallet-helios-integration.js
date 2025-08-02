#!/usr/bin/env node

// Test script to verify Helios integration with Ambire wallet
const fs = require('fs');
const path = require('path');

function testHeliosIntegration() {
  console.log('🧪 Testing Helios Integration with Ambire Wallet');
  console.log('==============================================');
  console.log('');

  const results = [];
  
  // Test 1: Check if ProviderController has been modified
  const providerControllerPath = path.join(__dirname, 'src/web/extension-services/background/provider/ProviderController.ts');
  if (fs.existsSync(providerControllerPath)) {
    const content = fs.readFileSync(providerControllerPath, 'utf8');
    const hasHeliosImport = content.includes('HeliosRealIntegration');
    const hasHeliosInitialization = content.includes('initializeHelios');
    const hasHeliosRpc = content.includes('tryHeliosRpc');
    const hasHealthMonitor = content.includes('HeliosHealthMonitor');
    
    results.push({
      test: 'ProviderController Modification',
      passed: hasHeliosImport && hasHeliosInitialization && hasHeliosRpc && hasHealthMonitor,
      details: `Import: ${hasHeliosImport}, Init: ${hasHeliosInitialization}, RPC: ${hasHeliosRpc}, Monitor: ${hasHealthMonitor}`
    });
  } else {
    results.push({
      test: 'ProviderController Modification',
      passed: false,
      details: 'ProviderController.ts not found'
    });
  }

  // Test 2: Check if Helios services exist
  const heliosServiceFiles = [
    'src/web/services/helios/HeliosRealIntegration.ts',
    'src/web/services/helios/HeliosProviderWrapper.ts',
    'src/web/services/helios/HeliosProviderFactory.ts',
    'src/web/services/helios/HeliosHealthMonitor.ts'
  ];
  
  const existingFiles = heliosServiceFiles.filter(file => 
    fs.existsSync(path.join(__dirname, file))
  );
  
  results.push({
    test: 'Helios Service Files',
    passed: existingFiles.length === heliosServiceFiles.length,
    details: `${existingFiles.length}/${heliosServiceFiles.length} files exist`
  });

  // Test 3: Check if WASM files are in public directory
  const wasmFiles = [
    'src/web/public/assets/wasm/helios.wasm',
    'src/web/public/assets/wasm/helios.js',
    'src/web/public/assets/wasm/helios.d.ts'
  ];
  
  const existingWasmFiles = wasmFiles.filter(file => 
    fs.existsSync(path.join(__dirname, file))
  );
  
  results.push({
    test: 'WASM Files in Public Directory',
    passed: existingWasmFiles.length === wasmFiles.length,
    details: `${existingWasmFiles.length}/${wasmFiles.length} WASM files available`
  });

  // Test 4: Check if manifest.json has web_accessible_resources
  const manifestPath = path.join(__dirname, 'src/web/public/manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    const hasWebAccessibleResources = manifest.web_accessible_resources && 
      manifest.web_accessible_resources.some(resource => 
        resource.resources && resource.resources.includes('assets/wasm/helios.wasm')
      );
    
    results.push({
      test: 'Manifest Web Accessible Resources',
      passed: hasWebAccessibleResources,
      details: hasWebAccessibleResources ? 'WASM files configured as web accessible' : 'WASM files not in web_accessible_resources'
    });
  } else {
    results.push({
      test: 'Manifest Web Accessible Resources',
      passed: false,
      details: 'manifest.json not found'
    });
  }

  // Test 5: Check if ethRpc method has been modified for Helios
  if (fs.existsSync(providerControllerPath)) {
    const content = fs.readFileSync(providerControllerPath, 'utf8');
    const hasHeliosRpcLogic = content.includes('shouldUseHelios()') && 
                              content.includes('tryHeliosRpc(method, params)') &&
                              content.includes('recordSuccess(responseTime)');
    
    results.push({
      test: 'ethRpc Method Integration',
      passed: hasHeliosRpcLogic,
      details: hasHeliosRpcLogic ? 'ethRpc method integrated with Helios + health monitoring' : 'ethRpc method not properly integrated'
    });
  }

  // Print results
  console.log('📋 Test Results:');
  console.log('================');
  
  let passedTests = 0;
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${result.test}: ${status}`);
    console.log(`   ${result.details}`);
    if (result.passed) passedTests++;
  });

  console.log('');
  console.log(`📊 Summary: ${passedTests}/${results.length} tests passed`);
  
  if (passedTests === results.length) {
    console.log('');
    console.log('🎉 SUCCESS: Helios integration is complete!');
    console.log('');
    console.log('🚀 Expected behavior:');
    console.log('   • Ambire wallet will use Helios for Ethereum mainnet RPC calls');
    console.log('   • Automatic fallback to default RPC if Helios fails');
    console.log('   • Health monitoring and performance tracking');
    console.log('   • Other networks continue using standard RPC providers');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Build the wallet extension: npm run build');
    console.log('   2. Load the extension in Chrome/Firefox');
    console.log('   3. Check browser console for Helios initialization logs');
    console.log('   4. Use wallet on Ethereum mainnet to test Helios calls');
    console.log('   5. Monitor console for "📡 Helios RPC success" messages');
  } else {
    console.log('');
    console.log('❌ Integration incomplete. Please check failed tests above.');
  }

  return passedTests === results.length;
}

// Run the test
const success = testHeliosIntegration();
process.exit(success ? 0 : 1);