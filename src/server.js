import fs from "node:fs";
import path from "node:path";
import express from "express";
import { pathToFileURL } from "node:url";
import { parseStack } from "./parseStack.js";
import { runTests } from "./runTests.js";
import { generatePatch, restoreFile } from "./generatePatch.js";

function loadEnvFile() {
  const envPath = path.resolve(".env");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function createApp() {
  const app = express();
  app.use(express.json());

  app.post("/webhook/crash", async (req, res) => {
    const { errorName, message, stack, targetRepoPath } = req.body ?? {};
    console.log("[DevLens Agent] Crash Received.");

    const parsed = parseStack(stack, targetRepoPath);
    if (!parsed) {
      console.log("[DevLens Agent] Error: Unable to parse file and line number from crash payload.");
      res.status(200).json({ aborted: "parse" });
      return;
    }

    console.log(message ?? "");
    console.log(stack);
    console.log(`${parsed.filePath}:${parsed.lineNumber}`);
    console.log("[DevLens Agent] Running local unit tests (Jest) to replicate bug....");

    const first = runTests(targetRepoPath);
    if (first.exitCode === 0) {
      console.log("[DevLens Agent] Error: Unable to replicate crash with existing test suite.");
      res.status(200).json({ aborted: "replicate" });
      return;
    }

    console.log("[DevLens Agent] Formulating AI fix patch & re-running tests....");
    let original = null;
    try {
      const result = await generatePatch({
        errorName,
        message,
        stack,
        filePath: parsed.filePath,
        lineNumber: parsed.lineNumber,
      });
      original = result.original;
      if (!result.applied) {
        console.log("[DevLens Agent] Error: Generated fix failed unit tests. Aborting PR creation.");
        res.status(200).json({ aborted: "fix" });
        return;
      }

      const second = runTests(targetRepoPath);
      if (second.exitCode !== 0) {
        restoreFile(parsed.filePath, original);
        console.log("[DevLens Agent] Error: Generated fix failed unit tests. Aborting PR creation.");
        res.status(200).json({ aborted: "fix" });
        return;
      }

      res.status(200).json({ aborted: null, verified: true });
    } catch (error) {
      if (original !== null) restoreFile(parsed.filePath, original);
      console.log("[DevLens Agent] Error: Generated fix failed unit tests. Aborting PR creation.");
      res.status(200).json({ aborted: "fix", reason: error.code ?? "patch" });
    }
  });

  return app;
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  loadEnvFile();
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => {
    console.log(`Listening on ${port}`);
  });
}
