#!/usr/bin/env node

// Simple test server for Helios integration testing
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

// Create test HTML page
const testHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Helios Integration Test</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            padding: 20px; 
            max-width: 1000px; 
            margin: 0 auto;
            background: #f5f5f5;
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .status { 
            padding: 15px; 
            background: #f8f9fa; 
            border-left: 4px solid #007acc; 
            margin: 15px 0; 
        }
        .status p { margin: 5px 0; }
        button { 
            padding: 12px 20px; 
            margin: 8px; 
            border: none; 
            border-radius: 4px; 
            background: #007acc; 
            color: white; 
            cursor: pointer;
            font-size: 14px;
        }
        button:disabled { 
            background: #ccc; 
            cursor: not-allowed; 
        }
        button:hover:not(:disabled) { 
            background: #005999; 
        }
        input { 
            padding: 10px; 
            margin: 8px; 
            width: 400px; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            font-family: monospace;
        }
        .error { color: #dc3545; font-weight: bold; }
        .success { color: #28a745; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .results { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 4px; 
            margin-top: 15px; 
            min-height: 100px;
        }
        .results p { 
            margin: 8px 0; 
            padding: 5px; 
            background: white; 
            border-radius: 3px; 
        }
        .log { 
            background: #2d3748; 
            color: #e2e8f0; 
            padding: 15px; 
            border-radius: 4px; 
            font-family: monospace; 
            font-size: 12px; 
            max-height: 200px; 
            overflow-y: auto; 
            margin-top: 15px;
        }
        .checkbox { margin: 10px 0; }
        .checkbox input { width: auto; margin-right: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌟 Helios Light Client Integration Test</h1>
        
        <div class="status">
            <h2>📊 System Status</h2>
            <p>🔄 Loading: <span id="loading" class="warning">Yes</span></p>
            <p>✅ Ready: <span id="ready" class="error">No</span></p>
            <p>🌐 WebAssembly Support: <span id="wasm-support"></span></p>
            <p>📡 WASM Files: <span id="wasm-files">Checking...</span></p>
            <p id="error-display" class="error" style="display: none;"></p>
        </div>

        <div>
            <h2>🔗 Test Configuration</h2>
            <div>
                <label>📮 Test Address:</label><br>
                <input type="text" id="address" value="0x742C8D6476DD26E2fbdB8e7419B28B2c4b78C1C2" placeholder="Enter Ethereum address">
            </div>
            <div>
                <label>🔧 Status: <span id="current-mode" class="warning">Initializing Real Helios...</span></label>
            </div>
        </div>

        <div>
            <h2>⚡ Actions</h2>
            <button id="balance-btn" disabled>💰 Get Balance</button>
            <button id="block-btn" disabled>📦 Get Block Number</button>
            <button id="chain-btn" disabled>🔗 Get Chain ID</button>
            <button id="validate-btn">✅ Validate Address</button>
            <button id="debug-btn">🔬 Debug WASM</button>
            <button id="clear-btn">🗑️ Clear Results</button>
        </div>

        <div class="results" id="results">
            <h2>📋 Results</h2>
            <p><em>Results will appear here...</em></p>
        </div>

        <div class="log" id="log">
            <strong>📝 Activity Log:</strong><br>
            <span id="log-content">System initialized...<br></span>
        </div>
    </div>

    <script>
        // Logging function
        function log(message) {
            const timestamp = new Date().toLocaleTimeString();
            const logContent = document.getElementById('log-content');
            logContent.innerHTML += \`[\${timestamp}] \${message}<br>\`;
            logContent.scrollTop = logContent.scrollHeight;
            console.log(\`[Helios Test] \${message}\`);
        }

        // Update status
        function updateStatus(loading, ready, error = null) {
            document.getElementById('loading').textContent = loading ? 'Yes' : 'No';
            document.getElementById('loading').className = loading ? 'warning' : 'success';
            document.getElementById('ready').textContent = ready ? 'Yes' : 'No';
            document.getElementById('ready').className = ready ? 'success' : 'error';
            
            const errorDiv = document.getElementById('error-display');
            if (error) {
                errorDiv.textContent = \`Error: \${error}\`;
                errorDiv.style.display = 'block';
            } else {
                errorDiv.style.display = 'none';
            }
            
            // Enable/disable buttons
            document.querySelectorAll('button[id$="-btn"]:not(#validate-btn):not(#clear-btn)').forEach(btn => {
                btn.disabled = !ready;
            });
        }

        // Check WebAssembly support
        function checkWebAssembly() {
            const supported = typeof WebAssembly !== 'undefined' && typeof WebAssembly.instantiate === 'function';
            document.getElementById('wasm-support').textContent = supported ? '✅ Supported' : '❌ Not Supported';
            document.getElementById('wasm-support').className = supported ? 'success' : 'error';
            log(\`WebAssembly support: \${supported ? 'YES' : 'NO'}\`);
            return supported;
        }

        // Check WASM files
        async function checkWasmFiles() {
            try {
                const wasmResponse = await fetch('/assets/wasm/helios.wasm');
                const jsResponse = await fetch('/assets/wasm/helios.js');
                
                const wasmOk = wasmResponse.ok;
                const jsOk = jsResponse.ok;
                
                const status = (wasmOk && jsOk) ? '✅ Available' : '⚠️ Missing';
                document.getElementById('wasm-files').textContent = status;
                document.getElementById('wasm-files').className = (wasmOk && jsOk) ? 'success' : 'warning';
                
                log(\`WASM files check - WASM: \${wasmOk ? 'OK' : 'MISSING'}, JS: \${jsOk ? 'OK' : 'MISSING'}\`);
                return wasmOk && jsOk;
            } catch (error) {
                document.getElementById('wasm-files').textContent = '❌ Error checking';
                document.getElementById('wasm-files').className = 'error';
                log(\`Error checking WASM files: \${error.message}\`);
                return false;
            }
        }

        // Real Helios Integration
        let heliosIntegration = null;

        async function initializeRealHelios() {
            try {
                log('🚀 Initializing real Helios integration...');
                updateStatus(true, false);
                document.getElementById('current-mode').textContent = 'Loading WASM...';
                
                // Load the integration script
                const script = document.createElement('script');
                script.src = '/helios-real-integration.js';
                document.head.appendChild(script);
                
                // Wait for script to load
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                });
                
                if (!window.HeliosRealIntegration) {
                    throw new Error('HeliosRealIntegration not available');
                }
                
                heliosIntegration = new window.HeliosRealIntegration();
                
                document.getElementById('current-mode').textContent = 'Connecting...';
                log('🔧 Creating Helios client...');
                
                // Initialize with absolute CORS proxy URLs
                const initPromise = heliosIntegration.initialize({
                    executionRpc: 'http://localhost:3000/proxy/https://rpc.flashbots.net',
                    consensusRpc: 'http://localhost:3000/proxy/https://www.lightclientdata.org',
                    network: 'mainnet',
                    checkpoint: null
                });
                
                // Add timeout to prevent hanging
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Initialization timeout after 60 seconds')), 60000);
                });
                
                await Promise.race([initPromise, timeoutPromise]);
                
                log('✅ Real Helios integration initialized successfully!');
                return true;
                
            } catch (error) {
                log(\`❌ Failed to initialize real Helios: \${error.message}\`);
                console.error('Helios initialization error:', error);
                console.error('Stack trace:', error.stack);
                return false;
            }
        }


        // Validate address
        function validateAddress(address) {
            if (!address) return 'Address is required';
            if (!address.startsWith('0x')) return 'Address must start with 0x';
            if (address.length !== 42) return 'Address must be 42 characters long';
            if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return 'Address must contain only hex characters';
            return null;
        }

        // Add result to display
        function addResult(type, value, isError = false) {
            const results = document.getElementById('results');
            const p = document.createElement('p');
            p.innerHTML = \`<strong>\${type}:</strong> \${value}\`;
            p.className = isError ? 'error' : 'success';
            results.appendChild(p);
            log(\`Result - \${type}: \${value}\`);
        }

        // Initialize
        log('Starting Helios integration test...');
        
        const wasmSupported = checkWebAssembly();
        
        // Initialize Real Helios (no fallback to mock)
        setTimeout(async () => {
            const wasmAvailable = await checkWasmFiles();
            
            if (!wasmSupported) {
                updateStatus(false, false, 'WebAssembly not supported in this browser');
                document.getElementById('current-mode').textContent = 'WebAssembly Unsupported';
                document.getElementById('current-mode').className = 'error';
                log('❌ Cannot initialize - WebAssembly not supported');
                addResult('System Error', 'WebAssembly not supported - Real Helios cannot run', true);
                return;
            }
            
            if (!wasmAvailable) {
                updateStatus(false, false, 'WASM files not available');
                document.getElementById('current-mode').textContent = 'WASM Files Missing';
                document.getElementById('current-mode').className = 'error';
                log('❌ Cannot initialize - WASM files missing');
                addResult('System Error', 'WASM files not found - Check that helios.wasm and helios.js are available', true);
                return;
            }
            
            log('🚀 Initializing Real Helios (no mock fallback)...');
            document.getElementById('current-mode').textContent = 'Connecting to Ethereum...';
            document.getElementById('current-mode').className = 'warning';
            
            const realHeliosReady = await initializeRealHelios();
            
            if (realHeliosReady) {
                updateStatus(false, true);
                document.getElementById('current-mode').textContent = 'Real Helios Connected';
                document.getElementById('current-mode').className = 'success';
                log('✅ Real Helios client ready!');
                addResult('System Status', 'Real Helios initialized successfully - ready for blockchain queries', false);
            } else {
                updateStatus(false, false, 'Real Helios initialization failed');
                document.getElementById('current-mode').textContent = 'Initialization Failed';
                document.getElementById('current-mode').className = 'error';
                log('❌ Real Helios initialization failed completely');
                addResult('System Error', 'Real Helios failed to initialize - check console for details', true);
            }
        }, 1000);

        // Event listeners
        document.getElementById('balance-btn').onclick = async () => {
            const address = document.getElementById('address').value;
            const error = validateAddress(address);
            
            if (error) {
                addResult('Balance Error', error, true);
                return;
            }
            
            if (!heliosIntegration) {
                addResult('Balance Error', 'Real Helios not initialized - cannot get balance', true);
                return;
            }
            
            log(\`Getting real balance for \${address}...\`);
            
            try {
                const balance = await heliosIntegration.getBalance(address);
                const balanceInEth = (parseFloat(balance) / 1e18).toFixed(6);
                addResult('Balance (Real)', \`\${balance} wei (\${balanceInEth} ETH)\`);
            } catch (error) {
                addResult('Balance Error', \`Real Helios error: \${error.message}\`, true);
            }
        };

        document.getElementById('block-btn').onclick = async () => {
            if (!heliosIntegration) {
                addResult('Block Error', 'Real Helios not initialized - cannot get block number', true);
                return;
            }
            
            log('Getting real latest block number...');
            
            try {
                const blockNumber = await heliosIntegration.getBlockNumber();
                addResult('Block Number (Real)', blockNumber);
            } catch (error) {
                addResult('Block Error', \`Real Helios error: \${error.message}\`, true);
            }
        };

        document.getElementById('chain-btn').onclick = async () => {
            if (!heliosIntegration) {
                addResult('Chain Error', 'Real Helios not initialized - cannot get chain ID', true);
                return;
            }
            
            log('Getting real chain ID...');
            
            try {
                const chainId = await heliosIntegration.getChainId();
                const networkName = chainId === 1 ? 'Ethereum Mainnet' : \`Network \${chainId}\`;
                addResult('Chain ID (Real)', \`\${chainId} (\${networkName})\`);
            } catch (error) {
                addResult('Chain Error', \`Real Helios error: \${error.message}\`, true);
            }
        };

        document.getElementById('validate-btn').onclick = () => {
            const address = document.getElementById('address').value;
            const error = validateAddress(address);
            
            if (error) {
                addResult('Validation', error, true);
            } else {
                addResult('Validation', 'Address is valid! ✅');
            }
        };

        document.getElementById('clear-btn').onclick = () => {
            const results = document.getElementById('results');
            results.innerHTML = '<h2>📋 Results</h2><p><em>Results cleared...</em></p>';
            log('Results cleared');
        };

        document.getElementById('debug-btn').onclick = async () => {
            log('🔬 Starting WASM debug test...');
            addResult('Debug', 'Starting WASM debug test - check console for details');
            
            // Load and run the debug script
            const script = document.createElement('script');
            script.src = '/debug-wasm.js';
            document.head.appendChild(script);
        };


        // Set data-testid attributes for Puppeteer tests
        document.getElementById('loading').setAttribute('data-testid', 'loading-status');
        document.getElementById('ready').setAttribute('data-testid', 'ready-status');
        document.getElementById('address').setAttribute('data-testid', 'address-input');
        document.getElementById('balance-btn').setAttribute('data-testid', 'get-balance-btn');
        document.getElementById('block-btn').setAttribute('data-testid', 'get-block-number-btn');
        document.getElementById('chain-btn').setAttribute('data-testid', 'get-chain-id-btn');
        document.getElementById('results').setAttribute('data-testid', 'results');

        log('🚀 Test page ready for interaction');
    </script>
</body>
</html>`;

// Create assets directory structure
function setupAssets() {
  const assetsDir = path.join(__dirname, 'test-assets');
  const wasmDir = path.join(assetsDir, 'wasm');
  
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);
  if (!fs.existsSync(wasmDir)) fs.mkdirSync(wasmDir);
  
  // Copy WASM files if they exist
  const srcWasmDir = path.join(__dirname, 'src', 'web', 'assets', 'wasm');
  if (fs.existsSync(srcWasmDir)) {
    const files = fs.readdirSync(srcWasmDir);
    files.forEach(file => {
      const src = path.join(srcWasmDir, file);
      const dest = path.join(wasmDir, file);
      try {
        fs.copyFileSync(src, dest);
        console.log(`✅ Copied ${file}`);
      } catch (err) {
        console.log(`⚠️  Could not copy ${file}: ${err.message}`);
      }
    });
  } else {
    // Create dummy WASM files for testing
    fs.writeFileSync(path.join(wasmDir, 'helios.wasm'), 'dummy wasm content');
    fs.writeFileSync(path.join(wasmDir, 'helios.js'), '// dummy js wrapper');
    console.log('📁 Created dummy WASM files for testing');
  }
}

// CORS Proxy function
function proxyRequest(targetUrl, req, res) {
  const https = require('https');
  const urlModule = require('url');
  
  const parsedTarget = urlModule.parse(targetUrl);
  const options = {
    hostname: parsedTarget.hostname,
    port: parsedTarget.port || (parsedTarget.protocol === 'https:' ? 443 : 80),
    path: parsedTarget.path,
    method: req.method,
    headers: {
      ...req.headers,
      host: parsedTarget.hostname
    }
  };
  
  delete options.headers['host'];
  
  const proxyReq = https.request(options, (proxyRes) => {
    // Add CORS headers
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error');
  });
  
  req.pipe(proxyReq);
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Handle root path
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(testHTML);
    return;
  }
  
  // Handle assets
  if (pathname.startsWith('/assets/')) {
    const filePath = path.join(__dirname, 'test-assets', pathname.substring(8));
    
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Asset not found');
    }
    return;
  }
  
  // Handle Helios integration script
  if (pathname === '/helios-real-integration.js') {
    const filePath = path.join(__dirname, 'helios-real-integration.js');
    
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Integration script not found');
    }
    return;
  }
  
  // Handle debug script
  if (pathname === '/debug-wasm.js') {
    const filePath = path.join(__dirname, 'debug-wasm.js');
    
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Debug script not found');
    }
    return;
  }
  
  // Handle CORS proxy for RPC endpoints
  if (pathname.startsWith('/proxy/')) {
    // Get the full URL including query parameters
    const proxyPath = pathname.substring(7); // Remove '/proxy/'
    const queryString = parsedUrl.search || '';
    const targetUrl = decodeURIComponent(proxyPath) + queryString;
    
    // Allow specific RPC endpoints only for security
    const allowedHosts = [
      'www.lightclientdata.org',
      'rpc.flashbots.net',
      'eth-mainnet.g.alchemy.com',
      'mainnet.infura.io'
    ];
    
    try {
      const targetHost = new URL(targetUrl).hostname;
      if (!allowedHosts.includes(targetHost)) {
        res.writeHead(403);
        res.end('Proxy access denied for this host');
        return;
      }
      
      console.log(`📡 Proxying request to: ${targetUrl}`);
      proxyRequest(targetUrl, req, res);
      return;
    } catch (error) {
      console.error('Invalid proxy URL:', error);
      res.writeHead(400);
      res.end('Invalid proxy URL');
      return;
    }
  }
  
  // 404 for everything else
  res.writeHead(404);
  res.end('Not found');
});

// Start server
console.log('🚀 Setting up Helios test server...');
setupAssets();

server.listen(PORT, () => {
  console.log(`\n✅ Helios Test Server running!`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log(`📋 Features:`);
  console.log(`   • Interactive Helios integration testing`);
  console.log(`   • WebAssembly support detection`);
  console.log(`   • Mock responses for testing`);
  console.log(`   • Puppeteer test compatibility`);
  console.log(`\n🧪 To run tests:`);
  console.log(`   ./test-helios-puppeteer.sh`);
  console.log(`\n⏹️  Press Ctrl+C to stop`);
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});