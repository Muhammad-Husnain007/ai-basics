import express from "express";
import { pathToFileURL } from "node:url";
import { parseStack } from "./parseStack.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.post("/webhook/crash", (req, res) => {
    const { message, stack, targetRepoPath } = req.body ?? {};
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
    res.status(200).json({
      aborted: null,
      filePath: parsed.filePath,
      lineNumber: parsed.lineNumber,
    });
  });

  return app;
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => {
    console.log(`Listening on ${port}`);
  });
}
