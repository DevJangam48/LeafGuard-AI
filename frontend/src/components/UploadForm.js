// src/components/UploadForm.js
import React, { useState } from "react";
import axios from "axios";

function UploadForm() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => setImage(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;

    const formData = new FormData();
    formData.append("image", image);

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/predict",
        formData
      );
      setResult(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Prediction failed", err);
      setResult({ error: "Prediction failed. Try another image." });
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🌿 Upload Plant Image</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          required
        />
        <button type="submit">Predict</button>
      </form>

      {loading && <p>Predicting...</p>}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Disease: {result.disease}</h3>
          <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
          <p>
            <strong>Explanation:</strong>{" "}
            {result.geminiInfo || "No response from Gemini."}
          </p>
        </div>
      )}
    </div>
  );
}

export default UploadForm;
