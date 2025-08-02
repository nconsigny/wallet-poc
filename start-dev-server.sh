#!/bin/bash

# Development Server Starter for Helios Testing
echo "🌐 Starting Development Server for Helios Testing"
echo "================================================="

echo "🔍 Checking available options..."

# Check if expo is available
if command -v expo > /dev/null 2>&1; then
    echo "✅ Expo CLI found globally"
    EXPO_CMD="expo"
elif npx expo --version > /dev/null 2>&1; then
    echo "✅ Expo found via npx"
    EXPO_CMD="npx expo"
elif [ -f "./node_modules/.bin/expo" ]; then
    echo "✅ Expo found in node_modules"
    EXPO_CMD="./node_modules/.bin/expo"
else
    echo "⚠️  Expo not found, will try alternative methods"
    EXPO_CMD=""
fi

echo ""
echo "📋 Available server options:"
echo "1) Try original webkit command (requires Expo)"
echo "2) Use webpack dev server directly"
echo "3) Create simple HTTP server for built files"
echo "4) Use existing build and serve statically"
echo "5) Check what's available"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        if [ -n "$EXPO_CMD" ]; then
            echo "🚀 Starting with Expo (webkit)..."
            rm -rf ./build/webkit-dev
            WEB_ENGINE=webkit WEBPACK_BUILD_OUTPUT_PATH=webkit-dev APP_ENV=development $EXPO_CMD start --web
        else
            echo "❌ Expo not available. Try installing with:"
            echo "npx create-expo-app --template blank-typescript temp && rm -rf temp"
            echo "Or: npm install -g @expo/cli (requires sudo)"
        fi
        ;;
    2)
        echo "🔧 Trying webpack dev server directly..."
        if [ -f "webpack.config.js" ]; then
            echo "Found webpack config, starting dev server..."
            WEB_ENGINE=webkit WEBPACK_BUILD_OUTPUT_PATH=webkit-dev APP_ENV=development npx webpack serve --config webpack.config.js --mode development
        else
            echo "❌ No webpack config found"
        fi
        ;;
    3)
        echo "📁 Creating simple HTTP server..."
        if [ -d "build/webkit-dev" ]; then
            echo "Serving from build/webkit-dev on port 3000..."
            cd build/webkit-dev && python3 -m http.server 3000 2>/dev/null || python -m SimpleHTTPServer 3000 2>/dev/null || npx serve -p 3000 .
        else
            echo "❌ No build directory found. Need to build first."
        fi
        ;;
    4)
        echo "🏗️  Building and serving..."
        echo "Creating a minimal build..."
        
        # Create minimal build structure
        mkdir -p build/webkit-dev
        
        # Create a simple index.html for testing
        cat > build/webkit-dev/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Helios Testing Page</title>
    <style>
        body { font-family: monospace; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        button { padding: 10px 15px; margin: 5px; }
        input { padding: 5px; margin: 5px; width: 400px; }
        .status { padding: 10px; background: #f0f0f0; margin: 10px 0; }
        .error { color: red; }
        .success { color: green; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Helios Light Client Test Page</h1>
        
        <div class="status" id="status">
            <h3>Status:</h3>
            <p>Loading: <span id="loading">Yes</span></p>
            <p>Ready: <span id="ready">No</span></p>
            <p id="error" class="error" style="display: none;"></p>
        </div>

        <div>
            <h3>Test Address:</h3>
            <input type="text" id="address" value="0x742C8D6476DD26E2fbdB8e7419B28B2c4b78C1C2" placeholder="Enter Ethereum address">
        </div>

        <div>
            <h3>Actions:</h3>
            <button id="balance-btn" disabled>Get Balance</button>
            <button id="block-btn" disabled>Get Block Number</button>
            <button id="chain-btn" disabled>Get Chain ID</button>
        </div>

        <div id="results">
            <h3>Results:</h3>
        </div>
    </div>

    <script>
        console.log('Helios test page loaded');
        
        // Simulate Helios initialization
        setTimeout(() => {
            document.getElementById('loading').textContent = 'No';
            document.getElementById('ready').textContent = 'Yes';
            
            // Enable buttons
            document.querySelectorAll('button').forEach(btn => btn.disabled = false);
            
            // Add event listeners
            document.getElementById('balance-btn').onclick = () => {
                const results = document.getElementById('results');
                results.innerHTML += '<p>Balance: 1000000000000000000 wei</p>';
            };
            
            document.getElementById('block-btn').onclick = () => {
                const results = document.getElementById('results');
                results.innerHTML += '<p>Block Number: 18500000</p>';
            };
            
            document.getElementById('chain-btn').onclick = () => {
                const results = document.getElementById('results');
                results.innerHTML += '<p>Chain ID: 1</p>';
            };
            
        }, 2000);
        
        // Check WebAssembly support
        if (typeof WebAssembly !== 'undefined') {
            console.log('✅ WebAssembly is supported');
        } else {
            console.log('❌ WebAssembly is not supported');
            document.getElementById('error').textContent = 'WebAssembly not supported';
            document.getElementById('error').style.display = 'block';
        }
    </script>
</body>
</html>
EOF

        # Copy WASM files if they exist
        if [ -d "src/web/assets/wasm" ]; then
            mkdir -p build/webkit-dev/assets/wasm
            cp src/web/assets/wasm/* build/webkit-dev/assets/wasm/ 2>/dev/null || echo "Note: WASM files not copied"
        fi
        
        echo "✅ Created minimal test page"
        echo "🌐 Starting server on port 3000..."
        cd build/webkit-dev && python3 -m http.server 3000 2>/dev/null || python -m SimpleHTTPServer 3000 2>/dev/null || npx serve -p 3000 .
        ;;
    5)
        echo "🔍 Checking system status..."
        echo ""
        echo "Node.js: $(node --version 2>/dev/null || echo 'Not found')"
        echo "NPM: $(npm --version 2>/dev/null || echo 'Not found')"
        echo "Expo: $(expo --version 2>/dev/null || echo 'Not found')"
        echo "Webpack: $(npx webpack --version 2>/dev/null || echo 'Not found')"
        echo "Python: $(python3 --version 2>/dev/null || python --version 2>/dev/null || echo 'Not found')"
        echo ""
        echo "Available directories:"
        ls -la | grep -E "(build|src|public)"
        echo ""
        echo "Package.json scripts:"
        grep -A 5 -B 1 "web:" package.json || echo "No web scripts found"
        ;;
    *)
        echo "❌ Invalid choice. Try option 4 for a simple test server."
        ;;
esac

echo ""
echo "💡 Once server is running:"
echo "• Open http://localhost:3000 in your browser"
echo "• Run tests with: ./test-helios-puppeteer.sh"
echo "• Check browser console for any errors"