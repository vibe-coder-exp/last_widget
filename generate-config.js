// Generate config.js from .env file
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse .env
const config = {};
envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        config[key] = value;
    }
});

// Generate config.js
const configJs = `// Auto-generated from .env - DO NOT EDIT MANUALLY
// Run: node generate-config.js to regenerate

window.SUPABASE_CONFIG = {
    url: '${config.SUPABASE_URL || ''}',
    anonKey: '${config.SUPABASE_ANON_KEY || ''}'
};
`;

// Write config.js
const configPath = path.join(__dirname, 'config.js');
fs.writeFileSync(configPath, configJs, 'utf-8');

console.log('✅ config.js generated successfully!');
console.log('📍 Config file created at:', configPath);
console.log('🔑 Supabase URL:', config.SUPABASE_URL || '(not set)');
console.log('🔑 Anon Key:', config.SUPABASE_ANON_KEY ? config.SUPABASE_ANON_KEY.substring(0, 20) + '...' : '(not set)');
