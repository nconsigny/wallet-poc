// Debug script to test WASM loading directly
console.log('🔬 Starting WASM debug test...');

async function debugWasmLoading() {
  try {
    console.log('1. 🔍 Checking WebAssembly support...');
    const wasmSupported = typeof WebAssembly !== 'undefined';
    console.log(`   WebAssembly supported: ${wasmSupported}`);
    
    if (!wasmSupported) {
      throw new Error('WebAssembly not supported');
    }
    
    console.log('2. 📄 Checking WASM files availability...');
    
    // Test WASM file access
    const wasmResponse = await fetch('/assets/wasm/helios.wasm');
    console.log(`   WASM file response: ${wasmResponse.status} ${wasmResponse.statusText}`);
    console.log(`   WASM file size: ${wasmResponse.headers.get('content-length')} bytes`);
    
    const jsResponse = await fetch('/assets/wasm/helios.js');
    console.log(`   JS file response: ${jsResponse.status} ${jsResponse.statusText}`);
    console.log(`   JS file size: ${jsResponse.headers.get('content-length')} bytes`);
    
    if (!wasmResponse.ok || !jsResponse.ok) {
      throw new Error('WASM files not accessible');
    }
    
    console.log('3. 🔄 Loading JS wrapper...');
    
    // Load the JS wrapper
    const jsContent = await jsResponse.text();
    console.log(`   JS content preview: ${jsContent.substring(0, 200)}...`);
    
    // Check if it looks like a proper WASM wrapper
    if (!jsContent.includes('wasm_bindgen') && !jsContent.includes('WebAssembly')) {
      console.warn('   ⚠️ JS file does not appear to be a WASM wrapper');
    }
    
    // Execute the JS wrapper
    const script = document.createElement('script');
    script.textContent = jsContent;
    document.head.appendChild(script);
    
    console.log('4. ⏳ Waiting for WASM module to be available...');
    
    // Wait for the module to load
    let attempts = 0;
    while (attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check what's available in the global scope
      const wasmRelated = Object.keys(window).filter(key => 
        key.includes('wasm') || key.includes('bindgen') || key.includes('helios')
      );
      
      console.log(`   Attempt ${attempts + 1}: WASM-related globals:`, wasmRelated);
      
      if (window.wasm_bindgen) {
        console.log('   ✅ wasm_bindgen found!');
        break;
      }
      
      if (wasmRelated.length > 0) {
        console.log('   🔍 Found potential WASM globals:', wasmRelated);
        // Try to find the actual initialization function
        for (const key of wasmRelated) {
          if (typeof window[key] === 'function') {
            console.log(`   🧪 Trying ${key} as initialization function...`);
            try {
              await window[key]('/assets/wasm/helios.wasm');
              console.log(`   ✅ Successfully initialized with ${key}`);
              window.wasm_bindgen = window[key];
              break;
            } catch (err) {
              console.log(`   ❌ ${key} failed:`, err.message);
            }
          }
        }
      }
      
      attempts++;
    }
    
    if (!window.wasm_bindgen) {
      throw new Error('WASM module initialization failed - no wasm_bindgen found');
    }
    
    console.log('5. 🧩 Initializing WASM binary...');
    
    try {
      await window.wasm_bindgen('/assets/wasm/helios.wasm');
      console.log('   ✅ WASM binary loaded successfully');
    } catch (error) {
      console.error('   ❌ WASM binary loading failed:', error);
      throw error;
    }
    
    console.log('6. 🔍 Checking available exports...');
    
    const exports = Object.keys(window.wasm_bindgen);
    console.log(`   Available exports (${exports.length}):`, exports);
    
    // Look for Helios-related exports
    const heliosExports = exports.filter(name => 
      name.includes('Ethereum') || 
      name.includes('Client') || 
      name.includes('Helios')
    );
    console.log('   Helios-related exports:', heliosExports);
    
    if (heliosExports.length === 0) {
      console.warn('   ⚠️ No obvious Helios exports found');
      console.log('   All exports:', exports);
    }
    
    // Try to create an EthereumClient
    if (window.wasm_bindgen.EthereumClient) {
      console.log('7. 🚀 Testing EthereumClient creation...');
      
      try {
        const client = new window.wasm_bindgen.EthereumClient(
          'https://rpc.flashbots.net',
          null,
          'https://www.lightclientdata.org',
          'mainnet',
          null,
          'memory'
        );
        console.log('   ✅ EthereumClient created successfully!');
        console.log('   Client methods:', Object.getOwnPropertyNames(client.__proto__));
        
        // Clean up
        if (client.free) {
          client.free();
        }
        
      } catch (error) {
        console.error('   ❌ EthereumClient creation failed:', error);
        throw error;
      }
    } else {
      throw new Error('EthereumClient not found in exports');
    }
    
    console.log('🎉 WASM debug test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ WASM debug test failed:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the debug test
debugWasmLoading().then(success => {
  if (success) {
    document.body.innerHTML += '<div style="color: green; font-weight: bold; padding: 20px;">✅ WASM Debug Test PASSED - Check console for details</div>';
  } else {
    document.body.innerHTML += '<div style="color: red; font-weight: bold; padding: 20px;">❌ WASM Debug Test FAILED - Check console for details</div>';
  }
});

// Also make it available globally for manual testing
window.debugWasmLoading = debugWasmLoading;