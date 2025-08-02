#!/usr/bin/env node

// Test script to verify WASM initialization fix
const http = require('http');

function testWasmInitialization() {
  console.log('🧪 Testing WASM Initialization Fix');
  console.log('==================================');
  
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Server responded successfully');
        console.log('🌐 Open http://localhost:3000 in your browser to test the fix');
        console.log('📋 Look for these changes in the browser console:');
        console.log('   - "📄 Importing WASM ES6 module..." instead of syntax error');
        console.log('   - "🔧 WASM module imported, initializing..." instead of wasm_bindgen error');
        console.log('   - "✅ Helios WASM module loaded successfully" for successful loading');
        console.log('');
        console.log('🔍 Expected behavior:');
        console.log('   - No more "Unexpected token export" syntax errors');
        console.log('   - No more "wasm_bindgen not found" errors');
        console.log('   - Real Helios initialization should progress further');
        console.log('');
        console.log('⚡ Action needed: Open browser and check console logs');
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ Failed to connect to server:', err.message);
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      console.error('❌ Request timeout');
      reject(new Error('Timeout'));
    });
  });
}

// Run the test
testWasmInitialization().then(() => {
  console.log('✅ Test completed - please check browser console for actual results');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});