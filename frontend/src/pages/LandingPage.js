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
          Upload a leaf image and get smart disease analysis powered by
          LeafGuard AI!
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

      {/* ✅ Updated Features Section */}
      <section className="landing-features">
        <h2>Why use this bot?</h2>
        <div className="feature-cards">
          <div className="feature-card fade-in delay-1">
            <h3>🌱 Instant Diagnosis</h3>
            <p>Upload a leaf image and get results in seconds.</p>
          </div>
          <div className="feature-card fade-in delay-2">
            <h3>🤖 AI-Powered</h3>
            <p>
              Uses advanced machine learning and Gemini for accurate analysis.
            </p>
          </div>
          <div className="feature-card fade-in delay-3">
            <h3>📚 Detailed Info</h3>
            <p>
              Get symptoms, explanations, and treatment suggestions for each
              disease.
            </p>
          </div>
          <div className="feature-card fade-in delay-4">
            <h3>🕒 Chat History</h3>
            <p>Review your previous uploads and results anytime.</p>
          </div>
        </div>
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
