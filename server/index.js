import express from "express";
import cors from "cors";
import snowflake from "snowflake-sdk";
import crypto from "crypto";
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

// Initialize Snowflake connection pool or single connection
const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  role: process.env.SNOWFLAKE_ROLE
});

// Helper function to execute queries
const executeQuery = (sqlText, binds = []) => {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error(`Failed to execute query: ${err.message}`);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    });
  });
};

// Connect to Snowflake
connection.connect((err, conn) => {
  if (err) {
    console.error("Unable to connect to Snowflake: " + err.message);
  } else {
    console.log("Successfully connected to Snowflake as ID: " + conn.getId());
  }
});

// --- API ROUTES ---

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Node backend is running." });
});

// Test Database Connection Endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT CURRENT_VERSION(), CURRENT_USER()");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to convert Snowflake uppercase keys to lowercase for the frontend
const lowerCaseKeys = (rows) => rows.map(row => {
  const newRow = {};
  for (const key in row) {
    newRow[key.toLowerCase()] = row[key];
  }
  return newRow;
});

// Get all disease reports
app.get("/api/disease-reports", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT * FROM disease_reports ORDER BY cases DESC");
    res.json({ success: true, data: lowerCaseKeys(rows) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create/Record a new disease scan report
app.post("/api/disease-reports", async (req, res) => {
  try {
    const { district, mandal, crop, disease, cases = 1, severity = 'medium', trend = 'rising', trend_pct = 5.0, latitude = 17.9689, longitude = 79.5941, reported_by = 'telegram_bot', notes = '' } = req.body;
    
    if (!district || !crop || !disease) {
      return res.status(400).json({ success: false, error: "Missing required fields: district, crop, disease" });
    }

    const insertSql = `
      INSERT INTO disease_reports (id, district, mandal, crop, disease, cases, severity, trend, trend_pct, latitude, longitude, reported_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await executeQuery(insertSql, [
      crypto.randomUUID(),
      String(district),
      String(mandal || district),
      String(crop),
      String(disease),
      Number(cases),
      String(severity),
      String(trend),
      Number(trend_pct),
      Number(latitude),
      Number(longitude),
      String(reported_by).substring(0, 36),
      String(notes).substring(0, 2000)
    ]);
    res.json({ success: true, message: "Disease report successfully logged to database." });
  } catch (err) {
    console.error("Failed to insert disease report:", err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// Get inventory
app.get("/api/inventory", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT * FROM inventory ORDER BY urgency");
    res.json({ success: true, data: lowerCaseKeys(rows) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get alerts
app.get("/api/alerts", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT * FROM alerts ORDER BY created_at DESC");
    res.json({ success: true, data: lowerCaseKeys(rows) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get unread alerts count
app.get("/api/alerts/unread-count", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT COUNT(*) as count FROM alerts WHERE is_read = false");
    // count might be returned as COUNT or something, so lowercase it
    const countData = lowerCaseKeys(rows);
    res.json({ success: true, count: countData[0].count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get analytics snapshots
app.get("/api/analytics-snapshots", async (req, res) => {
  try {
    const rows = await executeQuery("SELECT * FROM analytics_snapshots ORDER BY snapshot_date ASC");
    res.json({ success: true, data: lowerCaseKeys(rows) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Database Initialization Endpoint
app.post("/api/init-db", async (req, res) => {
  try {
    const sqlFilePath = path.join(__dirname, "../snowflake_setup.sql");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
    
    // Split the SQL file by semicolons, ignoring empty statements
    const queries = sqlContent
      .split(";")
      .map(q => q.trim())
      .filter(q => q.length > 0);

    let executed = 0;
    for (const query of queries) {
      // Execute each query sequentially
      await executeQuery(query);
      executed++;
    }

    res.json({ success: true, message: `Successfully executed ${executed} queries and initialized the database.` });
  } catch (err) {
    console.error("Database initialization failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
