// src/pages/LandingPage.js
import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-root">
      <header className="landing-hero">
        <h1>🍃 LeafGuard AI</h1>
        <p className="landing-subtitle">
          Your instant plant health companion.
          <br />
          Upload a leaf image and get smart disease analysis powered by AI &
          Gemini!
        </p>
        <div className="landing-actions">
          <Link to="/login">
            <button className="landing-btn primary">Login</button>
          </Link>
          <Link to="/signup">
            <button className="landing-btn">Signup</button>
          </Link>
        </div>
      </header>

      <section className="landing-features">
        <h2>Why use this bot?</h2>
        <ul>
          <li>
            🌱 <strong>Instant Diagnosis:</strong> Upload a leaf image and get
            results in seconds.
          </li>
          <li>
            🤖 <strong>AI-Powered:</strong> Uses advanced machine learning and
            Gemini for accurate analysis.
          </li>
          <li>
            📚 <strong>Detailed Info:</strong> Get symptoms, explanations, and
            treatment suggestions.
          </li>
          <li>
            🕒 <strong>Chat History:</strong> Review your previous uploads and
            results anytime.
          </li>
        </ul>
      </section>

      <footer className="landing-footer">
        <p>
          &copy; {new Date().getFullYear()} Plant Disease Detection Bot &mdash;
          Built with ❤️ for plant lovers.
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
