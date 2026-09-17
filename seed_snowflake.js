import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import snowflake from "snowflake-sdk";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USERNAME,
  password: process.env.SNOWFLAKE_PASSWORD,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  role: process.env.SNOWFLAKE_ROLE
});

const executeQuery = (sqlText, binds = []) => {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      binds,
      complete: (err, stmt, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    });
  });
};

async function seed() {
  console.log("Connecting to Snowflake...");
  await new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) reject(err);
      else resolve(conn);
    });
  });
  console.log("Connected.");

  const sqlFilePath = path.join(__dirname, "snowflake_setup.sql");
  const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
  
  const queries = sqlContent
    .split(";")
    .map(q => q.trim())
    .filter(q => q.length > 0);

  let executed = 0;
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    try {
      console.log(`Executing query ${i + 1}/${queries.length}...`);
      await executeQuery(query);
      executed++;
    } catch (e) {
      console.error(`Failed at query ${i + 1}:`, e.message);
      console.error(query.substring(0, 100) + "...");
    }
  }

  console.log(`Successfully executed ${executed} queries.`);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
