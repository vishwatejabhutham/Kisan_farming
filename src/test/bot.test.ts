import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Telegram Bot Implementation", () => {
  it("should have valid bot.js file", () => {
    const botPath = path.join(process.cwd(), "server/bot.js");
    expect(fs.existsSync(botPath)).toBe(true);
    const content = fs.readFileSync(botPath, "utf8");
    expect(content).toContain("Telegraf");
    expect(content).toContain("analyzeCropImage");
    expect(content).toContain("saveReportToDatabase");
    expect(content).toContain("Mandal Outbreaks");
  });

  it("should have POST endpoint in index.js for disease reports", () => {
    const indexPath = path.join(process.cwd(), "server/index.js");
    const content = fs.readFileSync(indexPath, "utf8");
    expect(content).toContain('app.post("/api/disease-reports"');
  });
});
