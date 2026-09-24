function calculateDiscount(price, ratePercent) {
  const rate = ratePercent / 100;
  const total = price + price * rate;
  if (total < 0) {
    throw new Error("Calculated negative total");
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
=======
function calculateDiscount(price, ratePercent) {
  const rate = ratePercent / 100;
  const total = price + price * rate;
  if (total < 0) {
    throw new Error("Calculated negative total");
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
>>>>>>> 7d9fcf35af3cf323a3a04d4d5008cc91a5a8b15c
