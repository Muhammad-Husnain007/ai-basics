// sample-target/src/app.js ko buggy code par reset karein
function calculateDiscount(price, discount) {
    return price - discount; // Buggy logic that causes failure
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
