import readline from "readline";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = process.env.BACKEND_API_URL || "http://localhost:3001/api";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.clear();
console.log(`
================================================================
🌾 KISAN FARMING TELEGRAM BOT - MANUAL TERMINAL TESTER 🌾
================================================================
Type any of these commands to test manually:
  • /start             - Show Welcome Message & Keyboard Buttons
  • 1 (or Mandal)     - View Live Mandal Outbreaks from Database
  • 2 (or Treatment)  - View Disease Treatment Advice & Pesticides
  • 3 (or Scan)       - Simulate Leaf Photo Scan & Auto-Log to Snowflake
  • Warangal          - Search specific District/Mandal outbreak data
  • exit              - Quit simulator
================================================================
`);

function promptUser() {
  rl.question("📱 You (Farmer): ", async (input) => {
    const text = input.trim();
    if (text.toLowerCase() === "exit") {
      console.log("👋 Exiting local bot simulator.");
      rl.close();
      return;
    }

    console.log("\n🤖 Bot Response:");
    console.log("----------------------------------------------------------------");

    if (text === "/start" || text.toLowerCase() === "start") {
      console.log(`🌾 Welcome to Kisan Farming Bot!
కిసాన్ ఫార్మింగ్ టెలిగ్రామ్ సేవలకు స్వాగతం!

I am your AI Agronomist & Crop Disease Assistant.
నేను మీ పంట వ్యాధి నిర్ధారణ మరియు నివారణ సహాయకుడిని.

📸 How to use / ఎలా ఉపయోగించాలి:
1. Send a photo of a sick leaf/crop.
2. Get disease diagnosis in Telugu, Hindi, and English with exact treatment & cost!

Menu Buttons:
[ 📸 3. Scan Crop / ఫోటో పంపండి ]  [ 📊 1. Mandal Outbreaks / మండల నివేదిక ]
[ 💡 2. Treatment Advice / సలహాలు ] [ ❓ 4. Help & Support / సహాయం ]`);
    } 
    else if (text === "1" || text.toLowerCase().includes("mandal") || text.toLowerCase().includes("outbreak")) {
      try {
        const res = await axios.get(`${API_BASE_URL}/disease-reports`);
        const reports = res.data.data || [];
        console.log("📊 LIVE MANDAL DISEASE OUTBREAKS\n");
        reports.slice(0, 5).forEach((r) => {
          const trendIcon = r.trend === "rising" ? "📈" : "📉";
          console.log(`📍 ${r.district} (${r.mandal || 'Mandal'})`);
          console.log(`   • Crop: ${r.crop} | Disease: ${r.disease}`);
          console.log(`   • Active Cases: ${r.cases} ${trendIcon} (${r.trend_pct}%)`);
          console.log(`   • Risk Level: ${r.severity.toUpperCase()}\n`);
        });
      } catch (err) {
        console.log("⚠️ Make sure backend is running (npm run server).");
      }
    } 
    else if (text === "2" || text.toLowerCase().includes("treatment") || text.toLowerCase().includes("advice")) {
      console.log(`💡 COMMON CROP DISEASE TREATMENTS

1. Tomato Late Blight: Copper Oxychloride 50% WP @ 3g/L (Est. Cost: ₹450)
2. Chilli Leaf Curl Virus: Imidacloprid 17.8 SL @ 0.5ml/L (Est. Cost: ₹320)
3. Cotton Whitefly: Diafenthiuron 50% WP @ 1.25g/L (Est. Cost: ₹580)
4. Rice Stem Rot: Hexaconazole 5% EC @ 2ml/L (Est. Cost: ₹390)`);
    } 
    else if (text === "3" || text.toLowerCase().includes("scan")) {
      try {
        const newScan = {
          district: "Warangal",
          mandal: "Hanamkonda",
          crop: "Tomato",
          disease: "Late Blight",
          cases: 1,
          severity: "high",
          trend: "rising",
          trend_pct: 12.0,
          notes: "Manual test scan via Terminal CLI",
          reported_by: "Manual_CLI_User"
        };
        const res = await axios.post(`${API_BASE_URL}/disease-reports`, newScan);
        console.log(`🔬 DISEASE DIAGNOSIS REPORT / పంట వ్యాధి నివేదిక

🌱 Crop / పంట: Tomato
🦠 Disease / తెగులు: Late Blight
⚠️ Severity / తీవ్రత: 🚨 HIGH | 🎯 AI Confidence: 94%

---
🇮🇳 Telugu Advice / తెలుగు సలహా:
మీ టమోటా పంటలో లేట్ బ్లైట్ తెగులు ఉంది. కాపర్ ఆక్సీక్లోరైడ్ 50% WP లీటరు నీటికి 3 గ్రా చొప్పున పిచికారీ చేయండి.

---
💊 Recommended Treatment: Copper Oxychloride 50% WP @ 3g/L
💰 Estimated Cost: ₹450
✅ Data Logged: ${res.data.message}`);
      } catch (err) {
        console.log("⚠️ Make sure backend is running (npm run server).");
      }
    } 
    else {
      // District search query
      try {
        const res = await axios.get(`${API_BASE_URL}/disease-reports`);
        const reports = res.data.data || [];
        const match = reports.find(r => 
          r.district.toLowerCase().includes(text.toLowerCase()) ||
          (r.mandal && r.mandal.toLowerCase().includes(text.toLowerCase())) ||
          r.crop.toLowerCase().includes(text.toLowerCase()) ||
          r.disease.toLowerCase().includes(text.toLowerCase())
        );

        if (match) {
          const trendIcon = match.trend === "rising" ? "📈" : "📉";
          console.log(`📍 OUTBREAK REPORT: ${match.district.toUpperCase()} (${match.mandal || 'Mandal'})

🌱 Crop: ${match.crop}
🦠 Disease: ${match.disease}
📊 Total Cases: ${match.cases} ${trendIcon}
⚠️ Severity: ${match.severity.toUpperCase()}
📈 7-Day Trend: ${match.trend} (${match.trend_pct}%)`);
        } else {
          console.log(`🤖 Received message: "${text}"\nTry typing /start, 1, 2, 3, or a district name like "Warangal".`);
        }
      } catch (e) {
        console.log(`🤖 Received message: "${text}"\nTry typing /start, 1, 2, 3, or a district name like "Warangal".`);
      }
    }

    console.log("----------------------------------------------------------------\n");
    promptUser();
  });
}

promptUser();
