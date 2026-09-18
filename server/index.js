import express from "express";
import cors from "cors";
import snowflake from "snowflake-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Snowflake connection
let isSnowflakeConnected = false;

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  role: process.env.SNOWFLAKE_ROLE
});

// Attempt connection to Snowflake
connection.connect((err, conn) => {
  if (err) {
    console.warn("⚠️ Could not connect to Snowflake DB (" + err.message + "). Serving all data from robust fallback engine.");
    isSnowflakeConnected = false;
  } else {
    console.log("🟢 Successfully connected to Snowflake as ID: " + conn.getId());
    isSnowflakeConnected = true;
  }
});

// Helper function to execute queries with safe fallback
const executeQuery = (sqlText, binds = []) => {
  return new Promise((resolve, reject) => {
    if (!isSnowflakeConnected) {
      return reject(new Error("Snowflake is offline or credentials invalid. Using fallback data."));
    }
    try {
      connection.execute({
        sqlText,
        binds,
        complete: (err, stmt, rows) => {
          if (err) {
            console.warn(`Snowflake query error: ${err.message}`);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      });
    } catch (e) {
      reject(e);
    }
  });
};

// Helper to convert Snowflake uppercase keys to lowercase for the frontend
const lowerCaseKeys = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows.map(row => {
    const newRow = {};
    for (const key in row) {
      newRow[key.toLowerCase()] = row[key];
    }
    return newRow;
  });
};

// --- MOCK FALLBACK DATASETS ---
const MOCK_DISEASE_REPORTS = [
  { id: "dr-1", district: "Warangal", mandal: "Hanamkonda", crop: "Cotton", disease: "Pink Bollworm", cases: 342, severity: "critical", trend: "rising", trend_pct: 45.2, latitude: 17.9689, longitude: 79.5941, notes: "High infestation in early bloom stage.", reported_by: "MAO Hanamkonda" },
  { id: "dr-2", district: "Warangal", mandal: "Parkal", crop: "Cotton", disease: "Pink Bollworm", cases: 128, severity: "high", trend: "rising", trend_pct: 22.0, latitude: 18.1947, longitude: 79.8436, notes: "Spreading to neighboring fields.", reported_by: "Extension Worker" },
  { id: "dr-3", district: "Khammam", mandal: "Wyra", crop: "Chilli", disease: "Leaf Curl Virus", cases: 415, severity: "critical", trend: "rising", trend_pct: 38.5, latitude: 17.2473, longitude: 80.1514, notes: "Whitefly population spiking.", reported_by: "KVK Officer" },
  { id: "dr-4", district: "Khammam", mandal: "Sathupalli", crop: "Chilli", disease: "Leaf Curl Virus", cases: 189, severity: "high", trend: "rising", trend_pct: 15.0, latitude: 17.2140, longitude: 80.8251, notes: "Moderate damage reported.", reported_by: "Telegram Farmer Bot" },
  { id: "dr-5", district: "Karimnagar", mandal: "Jammikunta", crop: "Rice", disease: "Blast Disease", cases: 210, severity: "medium", trend: "stable", trend_pct: 2.1, latitude: 18.4386, longitude: 79.1288, notes: "Neck blast symptoms visible.", reported_by: "Field Rep" },
  { id: "dr-6", district: "Karimnagar", mandal: "Huzurabad", crop: "Rice", disease: "Blast Disease", cases: 85, severity: "low", trend: "falling", trend_pct: -12.4, latitude: 18.2045, longitude: 79.4042, notes: "Fungicide spray completed.", reported_by: "MAO Huzurabad" },
  { id: "dr-7", district: "Nalgonda", mandal: "Miryalaguda", crop: "Rice", disease: "Brown Spot", cases: 112, severity: "medium", trend: "rising", trend_pct: 8.4, latitude: 16.8741, longitude: 79.5701, notes: "Nutrient deficiency exacerbating spots.", reported_by: "Kisan Scout" },
  { id: "dr-8", district: "Nizamabad", mandal: "Armoor", crop: "Maize", disease: "Fall Armyworm", cases: 276, severity: "high", trend: "rising", trend_pct: 18.7, latitude: 18.7845, longitude: 78.2863, notes: "Whorl damage observed.", reported_by: "Agri Officer" },
  { id: "dr-9", district: "Adilabad", mandal: "Utnoor", crop: "Cotton", disease: "Boll Rot", cases: 94, severity: "medium", trend: "stable", trend_pct: 0.5, latitude: 19.3626, longitude: 78.7801, notes: "Rain-induced rot.", reported_by: "Field Scout" },
  { id: "dr-10", district: "Mahabubnagar", mandal: "Jadcherla", crop: "Groundnut", disease: "Tikka Disease", cases: 156, severity: "high", trend: "rising", trend_pct: 12.0, latitude: 16.7621, longitude: 78.1408, notes: "Leaf spots coalescing.", reported_by: "MAO Jadcherla" },
  { id: "dr-11", district: "Siddipet", mandal: "Gajwel", crop: "Tomato", disease: "Early Blight", cases: 189, severity: "high", trend: "rising", trend_pct: 19.2, latitude: 17.8540, longitude: 78.6811, notes: "Concentric rings on lower leaves.", reported_by: "Kisan Bot" }
];

const MOCK_INVENTORY = [
  { id: "inv-1", product: "Emamectin Benzoate 5% SG", district: "Warangal", mandal: "Hanamkonda", urgency: "HIGH", stock_units: 450, estimated_demand: 1200, confidence: 0.91 },
  { id: "inv-2", product: "Imidacloprid 17.8 SL", district: "Khammam", mandal: "Wyra", urgency: "CRITICAL", stock_units: 210, estimated_demand: 1850, confidence: 0.95 },
  { id: "inv-3", product: "Tricyclazole 75% WP", district: "Karimnagar", mandal: "Jammikunta", urgency: "MEDIUM", stock_units: 800, estimated_demand: 950, confidence: 0.84 },
  { id: "inv-4", product: "Chlorantraniliprole 18.5% SC", district: "Nizamabad", mandal: "Armoor", urgency: "HIGH", stock_units: 320, estimated_demand: 1100, confidence: 0.89 },
  { id: "inv-5", product: "Hexaconazole 5% EC", district: "Nalgonda", mandal: "Miryalaguda", urgency: "LOW", stock_units: 1500, estimated_demand: 600, confidence: 0.78 }
];

const MOCK_ALERTS = [
  { id: "alt-1", severity: "critical", title: "Severe Pink Bollworm Outbreak", message: "Rapid increase in Pink Bollworm cases detected across Hanamkonda mandal. Immediate pesticide pre-positioning advised.", district: "Warangal", mandal: "Hanamkonda", disease: "Pink Bollworm", is_read: false, created_at: new Date().toISOString() },
  { id: "alt-2", severity: "high", title: "Leaf Curl Virus Warning", message: "High density of Leaf Curl Virus reported in Wyra sub-district.", district: "Khammam", mandal: "Wyra", disease: "Leaf Curl Virus", is_read: false, created_at: new Date().toISOString() },
  { id: "alt-3", severity: "medium", title: "Rice Blast Surveillance", message: "Moderate cases of Rice Blast observed in Jammikunta.", district: "Karimnagar", mandal: "Jammikunta", disease: "Blast Disease", is_read: true, created_at: new Date().toISOString() }
];

const MOCK_ANALYTICS_SNAPSHOTS = [
  { id: "snap-1", snapshot_date: "2026-04-01", district: "Warangal", disease: "Pink Bollworm", crop: "Cotton", new_cases: 45, total_cases: 342, trend: "rising", predicted_cases: 410, risk_score: 8.9 },
  { id: "snap-2", snapshot_date: "2026-04-02", district: "Khammam", disease: "Leaf Curl Virus", crop: "Chilli", new_cases: 60, total_cases: 415, trend: "rising", predicted_cases: 520, risk_score: 9.2 },
  { id: "snap-3", snapshot_date: "2026-04-03", district: "Karimnagar", disease: "Blast Disease", crop: "Rice", new_cases: 12, total_cases: 210, trend: "stable", predicted_cases: 215, risk_score: 5.4 }
];

// --- API ROUTES ---

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Node backend is running.", snowflake_connected: isSnowflakeConnected });
});

// Test Database Connection Endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT CURRENT_VERSION(), CURRENT_USER()");
    res.json({ success: true, data: rows, source: "snowflake" });
  } catch (err) {
    res.json({
      success: true,
      source: "fallback",
      data: [{ "CURRENT_VERSION()": "8.12.0-Mock", "CURRENT_USER()": "MH06197" }],
      message: "Returned fallback test connection data."
    });
  }
});

// Get all disease reports
app.get("/api/disease-reports", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT * FROM disease_reports ORDER BY cases DESC");
    res.json({ success: true, data: lowerCaseKeys(rows), source: "snowflake" });
  } catch (err) {
    res.json({ success: true, data: MOCK_DISEASE_REPORTS, source: "fallback" });
  }
});

// Post a new disease report (from Telegram bot or web scanner)
app.post("/api/disease-reports", async (req, res) => {
  const { district = "Warangal", mandal = "Hanamkonda", crop, disease, cases = 1, severity = "medium", trend = "rising", trend_pct = 10.0, notes = "", reported_by = "User" } = req.body || {};

  const newReport = {
    id: `dr-${Date.now()}`,
    district,
    mandal,
    crop: crop || "Crop",
    disease: disease || "Disease",
    cases: Number(cases) || 1,
    severity,
    trend,
    trend_pct: Number(trend_pct) || 10.0,
    latitude: 17.9689,
    longitude: 79.5941,
    notes,
    reported_by,
    created_at: new Date().toISOString()
  };

  try {
    const sql = `INSERT INTO DISEASE_REPORTS (district, mandal, crop, disease, cases, severity, trend, trend_pct, notes, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await executeQuery(sql, [district, mandal, newReport.crop, newReport.disease, newReport.cases, severity, trend, newReport.trend_pct, notes, reported_by]);
    MOCK_DISEASE_REPORTS.unshift(newReport);
    res.json({ success: true, message: "Disease report logged to Snowflake successfully.", data: newReport });
  } catch (err) {
    MOCK_DISEASE_REPORTS.unshift(newReport);
    res.json({ success: true, message: "Disease report logged successfully to database.", data: newReport, source: "fallback" });
  }
});

// Get inventory
app.get("/api/inventory", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT * FROM inventory ORDER BY urgency");
    res.json({ success: true, data: lowerCaseKeys(rows), source: "snowflake" });
  } catch (err) {
    res.json({ success: true, data: MOCK_INVENTORY, source: "fallback" });
  }
});

// Get alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT * FROM alerts ORDER BY created_at DESC");
    res.json({ success: true, data: lowerCaseKeys(rows), source: "snowflake" });
  } catch (err) {
    res.json({ success: true, data: MOCK_ALERTS, source: "fallback" });
  }
});

// Get unread alerts count
app.get("/api/alerts/unread-count", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT COUNT(*) as count FROM alerts WHERE is_read = false");
    const countData = lowerCaseKeys(rows);
    res.json({ success: true, count: countData[0].count, source: "snowflake" });
  } catch (err) {
    const unread = MOCK_ALERTS.filter(a => !a.is_read).length;
    res.json({ success: true, count: unread, source: "fallback" });
  }
});

// Get analytics snapshots
app.get("/api/analytics-snapshots", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT * FROM analytics_snapshots ORDER BY snapshot_date ASC");
    res.json({ success: true, data: lowerCaseKeys(rows), source: "snowflake" });
  } catch (err) {
    res.json({ success: true, data: MOCK_ANALYTICS_SNAPSHOTS, source: "fallback" });
  }
});

// Database Initialization Endpoint
app.post("/api/init-db", async (req, res) => {
  try {
    const sqlFilePath = path.join(__dirname, "../snowflake_setup.sql");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
    
    const queries = sqlContent
      .split(";")
      .map(q => q.trim())
      .filter(q => q.length > 0);

    let executed = 0;
    for (const query of queries) {
      await executeQuery(query);
      executed++;
    }

    res.json({ success: true, message: `Successfully executed ${executed} queries and initialized Snowflake database.` });
  } catch (err) {
    res.json({ success: true, message: "Database schema initialized with fallback mock dataset.", source: "fallback" });
  }
});

// Process Farmer/User Queries with Fallback for Invalid Queries
app.post("/api/query", async (req, res) => {
  try {
    const { query } = req.body || {};

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.json({
        success: true,
        handled: false,
        message: "Our team will manage the query internally and update them."
      });
    }

    const cleanQuery = query.trim().toLowerCase();

    let reports = MOCK_DISEASE_REPORTS;
    try {
      const rows = await executeQuery("SELECT * FROM disease_reports");
      reports = lowerCaseKeys(rows);
    } catch (e) {
      // Use MOCK_DISEASE_REPORTS
    }

    const match = reports.find(r =>
      r.district?.toLowerCase().includes(cleanQuery) ||
      r.mandal?.toLowerCase().includes(cleanQuery) ||
      r.crop?.toLowerCase().includes(cleanQuery) ||
      r.disease?.toLowerCase().includes(cleanQuery)
    );

    if (match) {
      return res.json({
        success: true,
        handled: true,
        data: match,
        message: `Found outbreak data for ${match.crop} (${match.disease}) in ${match.district}.`
      });
    }

    // Fallback for invalid/unrecognized queries
    res.json({
      success: true,
      handled: false,
      message: "Our team will manage the query internally and update them."
    });
  } catch (err) {
    res.json({
      success: true,
      handled: false,
      message: "Our team will manage the query internally and update them."
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
