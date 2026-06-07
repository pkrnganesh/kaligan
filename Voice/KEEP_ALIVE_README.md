# 🏓 Backend Keep-Alive Service

This folder contains tools to keep the Kreta-Bandhu backend server active 24/7, preventing cold starts on Render's free tier.

## 📋 Available Solutions

### 1. **GitHub Actions (Recommended) ✅**
**File:** `.github/workflows/keep-alive.yml`

**How it works:**
- Automatically pings your backend every 10 minutes
- Runs 24/7 for free using GitHub Actions
- No manual intervention required
- Prevents Render from spinning down the server

**Setup:**
1. Push this workflow file to your GitHub repository
2. The workflow will automatically start running
3. View logs at: `https://github.com/Pulastya-B/MURF_AI_VOICE_AGENT/actions`

**Configuration:**
```yaml
schedule:
  - cron: '*/10 * * * *'  # Every 10 minutes
```

**Manual Trigger:**
- Go to GitHub → Actions → "Keep Backend Alive" → Run workflow

---

### 2. **Local Node.js Pinger (Optional)**
**File:** `server/keep-alive.js`

**How it works:**
- Node.js script that pings backend every 10 minutes
- Runs on your local machine
- Useful for development or as a backup

**Usage:**
```bash
cd server
npm run keep-alive
```

**Output:**
```
[2026-01-13 15:30:00] 🚀 Kreta-Bandhu Backend Pinger Started
[2026-01-13 15:30:00] 🎯 Target: https://kreta-bandhu-backend.onrender.com/
[2026-01-13 15:30:00] ⏰ Interval: 10 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2026-01-13 15:30:01] ✅ Backend is alive! (342ms) - Status: 200
[2026-01-13 15:30:01]    💬 Message: Kreta-Bandhu Backend API is running
```

**Stop:**
- Press `Ctrl+C`

---

### 3. **Third-Party Services (Alternative)**

If GitHub Actions isn't working, use these free services:

#### **Option A: UptimeRobot** (Recommended)
1. Sign up: https://uptimerobot.com/
2. Add monitor: `https://kreta-bandhu-backend.onrender.com/`
3. Set interval: 5 minutes
4. Get email alerts if server goes down

#### **Option B: Cron-Job.org**
1. Sign up: https://cron-job.org/
2. Create job: `GET https://kreta-bandhu-backend.onrender.com/`
3. Schedule: Every 10 minutes
4. Enable notifications

#### **Option C: Freshping**
1. Sign up: https://www.freshworks.com/website-monitoring/
2. Monitor: `https://kreta-bandhu-backend.onrender.com/`
3. Check interval: 1 minute (50 checks/month free)

---

## 🔍 Monitoring Backend Health

### Check if Backend is Running:
```bash
curl https://kreta-bandhu-backend.onrender.com/
```

**Expected Response:**
```json
{
  "status": "online",
  "message": "Kreta-Bandhu Backend API is running",
  "endpoints": {
    "categories": "/api/categories",
    "subcategories": "/api/subcategories",
    "products": "/api/products",
    "orders": "/api/orders"
  }
}
```

---

## 📊 Why This Matters

### **Without Keep-Alive:**
- Render spins down server after 15 minutes of inactivity
- First user after downtime waits 30-60 seconds for cold start
- Poor user experience

### **With Keep-Alive:**
- Server always warm and ready
- Instant responses (<300ms)
- Professional user experience
- No downtime even after months of inactivity

---

## ⚙️ Configuration

### Change Ping Interval

**GitHub Actions:**
```yaml
# .github/workflows/keep-alive.yml
schedule:
  - cron: '*/5 * * * *'  # Every 5 minutes
  - cron: '*/15 * * * *' # Every 15 minutes
```

**Local Script:**
```javascript
// server/keep-alive.js
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
```

### Change Backend URL

**GitHub Actions:**
```yaml
curl https://your-backend-url.onrender.com/
```

**Local Script:**
```javascript
const BACKEND_URL = 'https://your-backend-url.onrender.com/';
```

---

## 🚨 Troubleshooting

### GitHub Actions Not Running
1. Check repository settings: Settings → Actions → Allow all actions
2. View workflow runs: Actions tab → Keep Backend Alive
3. Check for errors in workflow logs

### Local Pinger Errors
```bash
# Check if Node.js is installed
node --version

# Install dependencies (if needed)
cd server
npm install

# Run with debug output
node keep-alive.js
```

### Backend Still Cold Starting
- Reduce ping interval to 5 minutes
- Use multiple pinger services (GitHub + UptimeRobot)
- Check Render logs for errors

---

## 📈 Expected Results

| Metric | Before Keep-Alive | After Keep-Alive |
|--------|------------------|------------------|
| **Cold Start Time** | 30-60 seconds | 0 seconds |
| **First Response** | 30-60 seconds | <300ms |
| **Downtime** | Frequent | None |
| **User Experience** | Poor | Excellent |

---

## ✅ Verification Checklist

- [ ] GitHub Actions workflow pushed to repository
- [ ] Workflow is enabled in GitHub Actions settings
- [ ] First workflow run completed successfully
- [ ] Backend responds instantly (test: `curl https://kreta-bandhu-backend.onrender.com/`)
- [ ] No cold starts after 30+ minutes of inactivity

---

## 🎯 Recommended Setup

**For Production:**
1. ✅ Enable GitHub Actions keep-alive (primary)
2. ✅ Add UptimeRobot monitoring (backup + alerts)
3. ❌ Don't run local pinger (only for testing)

**Result:** Your backend will stay alive 24/7 for months without any manual intervention! 🚀

---

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Verify backend is reachable: `curl https://kreta-bandhu-backend.onrender.com/`
3. Check Render dashboard for errors
4. Review this documentation

---

**Built with ❤️ for Kreta-Bandhu**
