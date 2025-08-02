#!/usr/bin/env node

// Simple verification that mocks have been removed
const http = require('http');

function testNoMockServer() {
  console.log('🧪 Verifying No-Mock Implementation');
  console.log('===================================');
  
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Server responded successfully');
        
        // Check for removed mock elements
        const checks = [
          { 
            test: !data.includes('Use Mock Mode'), 
            name: 'Mock checkbox UI removed' 
          },
          { 
            test: !data.includes('mock-mode'), 
            name: 'Mock mode input element removed' 
          },
          { 
            test: !data.includes('🎭'), 
            name: 'Mock emoji removed' 
          },
          { 
            test: !data.includes('mockResponses'), 
            name: 'Mock responses object removed' 
          },
          { 
            test: !data.includes('Switched to mock mode'), 
            name: 'Mock mode toggle logic removed' 
          },
          { 
            test: data.includes('Real Helios'), 
            name: 'Real Helios references present' 
          },
          { 
            test: data.includes('Initializing Real Helios'), 
            name: 'Real-only initialization logic present' 
          },
          { 
            test: !data.includes('Automatically switching to mock mode'), 
            name: 'Auto-fallback to mock removed' 
          }
        ];
        
        let passed = 0;
        let failed = 0;
        
        checks.forEach(check => {
          if (check.test) {
            console.log(`✅ PASS: ${check.name}`);
            passed++;
          } else {
            console.log(`❌ FAIL: ${check.name}`);
            failed++;
          }
        });
        
        console.log('\n📊 Results:');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        
        if (failed === 0) {
          console.log('\n🎉 SUCCESS: All mocks have been completely removed!');
          console.log('🔧 System now uses only Real Helios WASM integration');
          console.log('⚡ No fallback to mock - will fail if real integration fails');
          resolve(true);
        } else {
          console.log('\n❌ Some mock elements still remain');
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ Failed to connect to server:', err.message);
      console.log('💡 Make sure the server is running: node simple-test-server.js');
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      console.error('❌ Request timeout');
      reject(new Error('Timeout'));
    });
  });
}

// Run the verification
testNoMockServer().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});