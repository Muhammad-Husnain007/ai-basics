import fs from "node:fs";

// Simulated patch for this proof. Live GPT-4o is not called.
// The learner chose this after OpenAI returned credit_balance_exhausted.
export const DISCOUNT_BUG = "const total = price + price * rate;";
export const DISCOUNT_FIX = "const total = price - price * rate;";

/** Apply only the known one-line discount fix. Preserves the rest of the file (including EOLs). */
export function applyDiscountFix(content) {
  if (typeof content !== "string" || !content.includes(DISCOUNT_BUG)) {
    return { content, changed: false };
  }
  return {
    content: content.replace(DISCOUNT_BUG, DISCOUNT_FIX),
    changed: true,
  };
}

export function restoreFile(filePath, original) {
  fs.writeFileSync(filePath, original);
}

export async function generatePatch({ filePath }) {
  const original = fs.readFileSync(filePath, "utf8");
  const { content: repaired, changed } = applyDiscountFix(original);
  if (!changed) {
    return { original, applied: false };
  }

  fs.writeFileSync(filePath, repaired);
  return { original, applied: true };
}
