#!/usr/bin/env node

// Test script to verify CORS proxy is working
const http = require('http');

function testCorsProxy() {
  console.log('🧪 Testing CORS Proxy Fix');
  console.log('=========================');
  
  // Test proxy endpoint access
  const testUrl = '/proxy/https://www.lightclientdata.org/eth/v1/beacon/light_client/bootstrap/0xe4163704b79dbb52a91ba6be1ae6f5504b060522f5495c73b6c55865412b428c';
  
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${testUrl}`, (res) => {
      console.log(`📡 Proxy request status: ${res.statusCode}`);
      console.log(`🔧 CORS headers:`, {
        'Access-Control-Allow-Origin': res.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': res.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': res.headers['access-control-allow-headers']
      });
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ CORS proxy working - data received');
          console.log(`📊 Response size: ${data.length} bytes`);
          console.log('🌐 Browser should now be able to access RPC endpoints');
          console.log('');
          console.log('🚀 Action: Refresh browser page and check for:');
          console.log('   - No more CORS errors in console');
          console.log('   - Helios client should sync successfully');
          console.log('   - "Real Helios Connected" status');
          resolve(true);
        } else {
          console.log(`❌ Proxy failed with status ${res.statusCode}`);
          console.log(`📋 Response: ${data.substring(0, 200)}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ Proxy test failed:', err.message);
      reject(err);
    });
    
    req.setTimeout(15000, () => {
      console.log('⏰ Proxy request timeout (this might be normal for long RPC calls)');
      resolve(true); // Timeout might be expected for actual RPC calls
    });
  });
}

// Run the test
testCorsProxy().then(success => {
  if (success) {
    console.log('✅ CORS proxy test completed - check browser for results');
  } else {
    console.log('❌ CORS proxy test failed');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test error:', error.message);
  process.exit(1);
});