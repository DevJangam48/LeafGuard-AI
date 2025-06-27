import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css"; // Optional: add styling
import { marked } from "marked";
// ✅ Add this

function Dashboard() {
  const { logout } = useContext(AuthContext);
  const [image, setImage] = useState(null);
  //  const [prediction, setPrediction] = useState(null);
  //const [loading, setLoading] = useState(false);
  //  const [geminiInfo, setGeminiInfo] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [query, setQuery] = useState("");
  const [queryAnswer, setQueryAnswer] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
    //    setPrediction(null);
    //    setGeminiInfo("");
  };

  const handleUpload = async () => {
    if (!image) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", image);

      const token = localStorage.getItem("token"); // <-- Get the JWT token

      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/predict`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // <-- Add the Authorization header
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        //      setPrediction(data.prediction);
        //     setGeminiInfo(data.info);
        setImageUrl(data.imageUrl);
        if (data.newChat) {
          setChatHistory((prev) => [data.newChat, ...prev]);
          setSelectedChat(data.newChat);
        } else {
          fetchHistory(); // fallback if newChat not returned
        }
      } else {
        alert(data.error || "Prediction failed");
      }
    } catch (err) {
      console.error("Prediction error:", err);
      alert("Error uploading image");
    } finally {
      setUploadLoading(false);
    }
  };

  // Move fetchHistory here so it's available everywhere in the component
  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/chat-history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      setChatHistory(Array.isArray(data) ? data : []);
      // Always select the most recent chat (first in array)
      if (data.length > 0) {
        setSelectedChat(data[0]);
      } else {
        setSelectedChat(null);
      }
    } catch (err) {
      console.error("Failed to fetch chat history", err);
    }
  };

  const handleQuery = async () => {
    if (!query) return;
    setQueryLoading(true);
    setQueryAnswer("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: query,
          imageUrl,
          chatId: selectedChat?._id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setQueryAnswer(data.answer);
        setQuery("");
        // Move updated chat to top
        if (data.updatedChat) {
          setChatHistory((prev) => [
            data.updatedChat,
            ...prev.filter((c) => c._id !== data.updatedChat._id),
          ]);
          // Find and set the updated chat from the new chatHistory array
          setSelectedChat(data.updatedChat);
        } else {
          fetchHistory();
        }
      } else {
        setQueryAnswer(data.error || "Failed to get answer");
      }
    } catch (err) {
      setQueryAnswer("Error connecting to Gemini");
    } finally {
      setQueryLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/chat/${chatId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setChatHistory((prev) => prev.filter((c) => c._id !== chatId));
        if (selectedChat?._id === chatId) {
          // Select the next most recent chat or null
          setSelectedChat((prev) => {
            const remaining = chatHistory.filter((c) => c._id !== chatId);
            return remaining[0] || null;
          });
        }
      } else {
        alert(data.error || "Failed to delete chat");
      }
    } catch (err) {
      alert("Error deleting chat");
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, []);

  const currentChat =
    chatHistory.find((c) => c._id === selectedChat?._id) || selectedChat;

  return (
    <div className="dashboard-wrapper">
      <div className="sidebar">
        <h3>Chat History</h3>
        <div className="chat-history-list">
          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`chat-item${
                selectedChat?._id === chat._id ? " selected" : ""
              }`}
              onClick={() => setSelectedChat(chat)}
              style={{ cursor: "pointer", position: "relative" }}
            >
              <img
                src={`${process.env.REACT_APP_BACKEND_URL}${chat.imageUrl}`}
                alt="Upload"
                width="100"
              />
              <p>
                <strong>{chat.prediction}</strong>
              </p>
              <small>{new Date(chat.timestamp).toLocaleString()}</small>
              <button
                className="delete-chat-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(chat._id);
                }}
                title="Delete chat"
                style={{
                  position: "absolute",
                  bottom: 8, // <-- move to bottom
                  right: 8,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                  color: "#ff1744", // a bold red
                  zIndex: 2,
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="main-content">
        <div className="dashboard-container">
          <h1 className="dashboard-heading">Welcome to LeafGuard AI!</h1>
          {selectedChat ? (
            <div className="chat-window">
              <div className="chat-message user user-right">
                <div className="avatar user-avatar">🧑</div>
                <div className="bubble">
                  <strong>You uploaded:</strong>
                  <br />
                  <img
                    src={`${process.env.REACT_APP_BACKEND_URL}${selectedChat.imageUrl}`}
                    alt="Upload"
                    width="180"
                    style={{ borderRadius: "8px", marginTop: "8px" }}
                  />
                </div>
              </div>
              <div className="chat-message ai">
                <div className="avatar ai-avatar">🤖</div>
                <div className="bubble">
                  <strong>Prediction:</strong>
                  <br />
                  {selectedChat.prediction}
                </div>
              </div>
              {selectedChat.geminiInfo && (
                <div className="chat-message gemini">
                  <div className="avatar gemini-avatar">🌱</div>
                  <div className="bubble">
                    <strong>LeafGuard AI:</strong>
                    <div
                      className="gemini-info"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(selectedChat.geminiInfo),
                      }}
                    ></div>
                  </div>
                </div>
              )}
              {queryAnswer && (
                <div className="chat-message gemini">
                  <div className="avatar gemini-avatar">🌱</div>
                  <div className="bubble">
                    <strong>LeafGuard AI:</strong>
                    <div
                      className="gemini-info"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(queryAnswer),
                      }}
                    ></div>
                  </div>
                </div>
              )}
              {currentChat?.questions?.map((q, idx) => (
                <React.Fragment key={idx}>
                  {/* User's follow-up question on the right */}
                  <div className="chat-message user user-right">
                    <div className="avatar user-avatar">🧑</div>
                    <div className="bubble">
                      <strong>You asked:</strong>
                      <br />
                      {q.question}
                    </div>
                  </div>
                  {/* Gemini's answer on the left */}
                  <div className="chat-message gemini">
                    <div className="avatar gemini-avatar">🌱</div>
                    <div className="bubble">
                      <strong>LeafGuard AI:</strong>
                      <div
                        className="gemini-info"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(q.answer),
                        }}
                      ></div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="chat-placeholder">
              <p>Select a chat from the sidebar or upload an image to start.</p>
            </div>
          )}
        </div>
        <div className="bottom-bar">
          <label className="custom-file-upload">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            Choose Image
          </label>
          <button type="button" onClick={handleUpload} disabled={uploadLoading}>
            {uploadLoading ? "Predicting..." : "Upload & Predict"}
          </button>
          <input
            type="text"
            placeholder="Ask anything about plant care..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleQuery();
              }
            }}
            className="query-input"
            style={{ marginLeft: 16, marginRight: 8, flex: 1 }}
          />
          <button
            type="button"
            onClick={handleQuery}
            disabled={!query || queryLoading}
            style={{ marginLeft: "auto" }}
          >
            {queryLoading ? "Asking..." : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
