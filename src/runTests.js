import { execSync } from "node:child_process";

export function runTests(targetRepoPath) {
  try {
    const output = execSync("npx jest --watchman=false", {
      cwd: targetRepoPath,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
    return { exitCode: 0, output };
  } catch (error) {
    const stdout = error.stdout?.toString?.() ?? "";
    const stderr = error.stderr?.toString?.() ?? "";
    return {
      exitCode: typeof error.status === "number" ? error.status : 1,
      output: `${stdout}\n${stderr}`,
    };
  }
}
