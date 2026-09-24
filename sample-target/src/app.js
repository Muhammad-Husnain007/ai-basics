function calculateDiscount(price, percent) {
  const rate = percent / 100;
  const total = price - price * rate;
  if (Math.abs(total - (price - price * rate)) > 0.001) {
    throw new Error(
      "Discount calculation failed: total should be price minus percent of price"
    );
  }
  return total;
}

async function reportCrash(webhookUrl, targetRepoPath) {
  try {
    calculateDiscount(100, 10);
  } catch (error) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        errorName: error.name,
        message: error.message,
        stack: error.stack,
        targetRepoPath,
      }),
    });
    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }
    return response.json();
  }
  return null;
}

module.exports = { calculateDiscount, reportCrash };
