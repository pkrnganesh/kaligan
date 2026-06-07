const https = require('https');

// Configuration
const BACKEND_URL = 'https://kreta-bandhu-backend.onrender.com/';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    hour12: false 
  });
  console.log(`${colors.gray}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

function pingBackend() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    https.get(BACKEND_URL, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          log(`✅ Backend is alive! (${duration}ms) - Status: ${res.statusCode}`, colors.green);
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.message) {
              log(`   💬 Message: ${parsed.message}`, colors.cyan);
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
          
          resolve({ success: true, duration, statusCode: res.statusCode });
        } else {
          log(`⚠️  Backend returned status: ${res.statusCode}`, colors.yellow);
          resolve({ success: false, duration, statusCode: res.statusCode });
        }
      });
    }).on('error', (err) => {
      const duration = Date.now() - startTime;
      log(`❌ Ping failed: ${err.message}`, colors.red);
      reject({ success: false, duration, error: err.message });
    });
  });
}

async function startPinger() {
  log('🚀 Kreta-Bandhu Backend Pinger Started', colors.cyan);
  log(`🎯 Target: ${BACKEND_URL}`, colors.cyan);
  log(`⏰ Interval: ${PING_INTERVAL / 1000 / 60} minutes`, colors.cyan);
  log('━'.repeat(60), colors.gray);
  
  // Ping immediately on start
  await pingBackend().catch(() => {});
  
  // Then ping at regular intervals
  setInterval(async () => {
    await pingBackend().catch(() => {});
  }, PING_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Pinger stopped by user', colors.yellow);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n👋 Pinger terminated', colors.yellow);
  process.exit(0);
});

// Start the pinger
startPinger();

module.exports = { pingBackend };
