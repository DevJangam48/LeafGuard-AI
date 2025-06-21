import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import "./Login.css"; // Reuse the login styles for consistency

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Signup successful! Redirecting to dashboard...");
        // Optionally, auto-login after signup:
        login(data.token);
        setTimeout(() => navigate("/dashboard"), 1200);
      } else {
        setError(data.error || data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong");
    }
  };

  return (
    <div className="login-container">
      <h2>Signup for LeafGuard AI</h2>
      {error && <p className="login-error">{error}</p>}
      {success && (
        <p style={{ color: "#22c55e", marginBottom: "10px" }}>{success}</p>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button type="submit">Signup</button>
      </form>
      <div className="login-bottom-message">
        Already have an account?
        <Link to="/login" className="login-link">
          Login
        </Link>
      </div>
    </div>
  );
}

export default Signup;
