/**
 * ai_engine.js
 * Bridges Node.js with the Python ML model (predict.py)
 */
const { exec } = require("child_process");

/**
 * Calls the Python ML model to classify nutrition and provide suggestions.
 */
const classifyNutrition = (height, weight, ageInMonths) => {
  return new Promise((resolve, reject) => {
    const inputData = JSON.stringify({
      age: ageInMonths,
      height: height,
      weight: weight,
      attendance: 100 // Default or fetch from DB if needed
    });

    // In a production environment, use spawns or a dedicated ML microservice.
    // For this project, we call the python script directly.
    exec(`python predict.py '${inputData}'`, (error, stdout, stderr) => {
      if (error) {
        console.error("AI Engine Error:", stderr);
        // Fallback to basic logic if Python fails
        return resolve(fallbackClassification(height, weight));
      }

      try {
        const result = JSON.parse(stdout);
        resolve({
          status: result.status,
          suggestions: result.solution || result.suggestions
        });
      } catch (err) {
        resolve(fallbackClassification(height, weight));
      }
    });
  });
};

/**
 * Simple rule-based fallback if the ML model is unavailable.
 */
const fallbackClassification = (height, weight) => {
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  if (bmi < 16) return { status: "Severely Malnourished", suggestions: "Immediate medical attention required." };
  if (bmi < 18.5) return { status: "Malnourished", suggestions: "Increase nutritional intake." };
  return { status: "Normal", suggestions: "Child is growing well." };
};

const predictGrowth = (history) => {
  if (!history || history.length < 2) return "Establishing baseline...";
  const last = history[0];
  const prev = history[1];
  const diff = last.weight - prev.weight;
  if (diff > 0.2) return "Healthy gain. Target reached.";
  if (diff < 0) return "Weight loss detected. Risk of malnutrition.";
  return "Stable growth.";
};

module.exports = { classifyNutrition, predictGrowth };
