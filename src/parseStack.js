import path from "node:path";

// Match path:line:col where the path may use / or \ (Windows).
// Optional drive letter so "C:" is not treated as the line separator.
const FRAME_WITH_PARENS =
  /\(((?:[A-Za-z]:)?[^()\n]*[/\\][^()\n]*?):(\d+):\d+\)/g;
const FRAME_BARE =
  /(?:^|\n)\s*at\s+((?:[A-Za-z]:)?[^()\n]*[/\\][^()\n]*?):(\d+):\d+/g;

function isUsablePath(filePath) {
  if (!filePath) return false;
  const trimmed = filePath.trim();
  if (!trimmed || trimmed.startsWith("node:")) return false;
  if (trimmed.includes("node:internal")) return false;
  return true;
}

export function parseStack(stack, targetRepoPath) {
  if (typeof stack !== "string" || !stack.trim()) return null;
  if (typeof targetRepoPath !== "string" || !targetRepoPath.trim()) return null;

  const frames = [];
  for (const match of stack.matchAll(FRAME_WITH_PARENS)) {
    frames.push({ filePath: match[1], lineNumber: Number(match[2]) });
  }
  if (frames.length === 0) {
    for (const match of stack.matchAll(FRAME_BARE)) {
      frames.push({ filePath: match[1], lineNumber: Number(match[2]) });
    }
  }

  const frame = frames.find(
    (item) => isUsablePath(item.filePath) && Number.isInteger(item.lineNumber) && item.lineNumber > 0
  );
  if (!frame) return null;

  const rawPath = frame.filePath.trim();
  let filePath = path.isAbsolute(rawPath)
    ? path.normalize(rawPath)
    : path.resolve(targetRepoPath, rawPath);

  // Stacks sometimes include the repo folder (sample-target/src/app.js) while
  // targetRepoPath already points at that folder — strip the duplicate prefix.
  if (!path.isAbsolute(rawPath)) {
    const segments = rawPath.split(/[/\\]+/).filter(Boolean);
    const targetBase = path.basename(path.resolve(targetRepoPath));
    if (segments.length > 1 && segments[0] === targetBase) {
      filePath = path.resolve(targetRepoPath, ...segments.slice(1));
    }
  }

  return { filePath, lineNumber: frame.lineNumber };
}
