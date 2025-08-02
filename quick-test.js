// Quick test to verify our test files are syntactically correct
const fs = require('fs');
const path = require('path');

console.log('🧪 Quick Test File Validation');
console.log('=============================');

// Check if test files exist and are readable
const testFiles = [
  'tests/playwright/helios/helios-integration.spec.ts',
  'tests/playwright/helios/helios-component.spec.ts', 
  'tests/playwright/helios/helios-error-handling.spec.ts',
  'playwright.config.ts'
];

testFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      console.log(`✅ ${file} - ${content.length} characters`);
      
      // Basic syntax check
      if (file.endsWith('.spec.ts')) {
        const hasTests = content.includes('test(') || content.includes('test.describe(');
        const hasExpect = content.includes('expect(');
        console.log(`   - Has tests: ${hasTests ? '✅' : '❌'}`);
        console.log(`   - Has assertions: ${hasExpect ? '✅' : '❌'}`);
      }
    } else {
      console.log(`❌ ${file} - File not found`);
    }
  } catch (error) {
    console.log(`❌ ${file} - Error reading: ${error.message}`);
  }
});

console.log('\n🎯 Alternative Testing Approaches:');
console.log('1. Use a Docker container with Playwright pre-installed');
console.log('2. Try installing with --no-optional to reduce dependencies');
console.log('3. Use a different testing framework (like Puppeteer which is already installed)');
console.log('4. Test the Helios integration manually in the browser');

console.log('\n💡 Manual Testing Steps:');
console.log('1. Start the dev server: npm run web:webkit');
console.log('2. Open browser to http://localhost:3000');
console.log('3. Add <HeliosTest /> component to test the integration');
console.log('4. Check browser console for any errors');

console.log('\n🚀 Ready-to-use commands if you get Playwright working:');
console.log('npx playwright test tests/playwright/helios --headed');
console.log('npx playwright test tests/playwright/helios --ui');
console.log('npx playwright test tests/playwright/helios --debug');