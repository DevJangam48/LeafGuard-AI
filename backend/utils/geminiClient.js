const axios = require("axios");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function getDiseaseInfo(diseaseName) {
  try {
    const prompt = `Provide a detailed explanation about the plant disease called "${diseaseName}". Include symptoms, causes, and possible treatments.`;

    // Replace below URL with actual Gemini API endpoint
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=GEMINI_API_KEY", // <-- Replace with actual Gemini API URL
      {
        prompt,
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generatedText = response.data.choices[0].text.trim();
    return generatedText;
  } catch (error) {
    console.error("Gemini API error:", error.response?.data || error.message);
    return "Sorry, I could not retrieve information about this disease at the moment.";
  }
}

module.exports = { getDiseaseInfo };
