import path from "node:path";

const FRAME_WITH_PARENS = /\(([^()]+):(\d+):\d+\)/g;
const FRAME_BARE = /(?:^|\n)\s*at\s+([^()\n]+):(\d+):\d+/g;

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
  const filePath = path.isAbsolute(rawPath)
    ? path.normalize(rawPath)
    : path.resolve(targetRepoPath, rawPath);

  return { filePath, lineNumber: frame.lineNumber };
}
