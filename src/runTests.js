import { spawnSync } from "node:child_process";

export function runTests(targetRepoPath) {
  const result = spawnSync("npx jest --watchman=false", {
    cwd: targetRepoPath,
    encoding: "utf8",
    shell: true,
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  return {
    exitCode: typeof result.status === "number" ? result.status : 1,
    output: `${stdout}\n${stderr}`.trim(),
  };
}
