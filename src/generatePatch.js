import fs from "node:fs";

// Simulated patch for this proof. Live GPT-4o is not called.
// The learner chose this after OpenAI returned credit_balance_exhausted.
const DISCOUNT_BUG = "const total = price + price * rate;";
const DISCOUNT_FIX = "const total = price - price * rate;";

export function restoreFile(filePath, original) {
  fs.writeFileSync(filePath, original);
}

export async function generatePatch({ filePath }) {
  const original = fs.readFileSync(filePath, "utf8");
  if (!original.includes(DISCOUNT_BUG)) {
    return { original, applied: false };
  }

  const repaired = original.replace(DISCOUNT_BUG, DISCOUNT_FIX);
  const next = repaired.endsWith("\n") ? repaired : `${repaired}\n`;
  fs.writeFileSync(filePath, next);
  return { original, applied: true };
}
