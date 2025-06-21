const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const axios = require("axios");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Chat = require("./models/Chat");

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Multer setup for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// ✅ Signup Route
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ email: user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Prediction Route
app.post("/predict", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  const imagePath = req.file.path;

  const pythonProcess = spawn("python", [
    "../ml_models/cnn_model.py",
    imagePath,
  ]);

  let predictionOutput = "";
  pythonProcess.stdout.on("data", (data) => {
    predictionOutput += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("Python Error:", data.toString());
  });

  pythonProcess.on("close", async () => {
    try {
      const lines = predictionOutput.trim().split("\n");
      const jsonLine = lines
        .reverse()
        .find((line) => line.trim().startsWith("{"));
      if (!jsonLine) throw new Error("No valid JSON from Python");

      const parsed = JSON.parse(jsonLine);
      const predictedLabel = parsed.predicted_label;

      // Call Gemini API
      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Tell me about plant disease: ${predictedLabel}. Include detailed explanation, symptoms, and treatments.`,
                },
              ],
            },
          ],
        }
      );

      const geminiText =
        geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No info found.";

      // === Save chat history ===
      const token = req.headers.authorization?.split(" ")[1];
      let userEmail = "anonymous";
      if (token) {
        try {
          const decoded = jwt.verify(token, SECRET_KEY);
          userEmail = decoded.email;
        } catch (err) {
          console.error("JWT decode failed:", err);
        }
      }
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

      const newChat = await Chat.create({
        userEmail,
        imageUrl,
        prediction: predictedLabel,
        geminiInfo: geminiText,
        // timestamp will be set automatically
      });

      res.json({
        prediction: predictedLabel,
        confidence: parsed.confidence,
        info: geminiText,
        imageUrl,
        newChat, // Return the new chat object
      });

      //  fs.unlinkSync(imagePath);  Cleanup uploaded image
    } catch (err) {
      console.error("Prediction error:", err);
      res.status(500).json({ error: "Failed to parse prediction output" });
    }
  });
});

app.get("/chat-history", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const chats = await Chat.find({ userEmail: decoded.email }).sort({
      timestamp: -1,
    });
    res.json(chats);
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.post("/ask", async (req, res) => {
  const { question, imageUrl, chatId } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  let userEmail = "anonymous";
  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      userEmail = decoded.email;
    } catch (err) {
      console.error("JWT decode failed:", err);
    }
  }
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Compose a contextual prompt
    const prompt = `The detected disease is "${chat.prediction}". The user's question is: ${question}`;

    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }
    );
    const geminiText =
      geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No info found.";

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: {
          questions: {
            question,
            answer: geminiText,
            askedAt: new Date(),
          },
        },
        $set: { timestamp: new Date() }, // <-- update timestamp
      },
      { new: true }
    );
    // Optionally, save the question/answer to chat history
    /*await Chat.create({
      userEmail,
      imageUrl: imageUrl,
      prediction: "",
      geminiInfo: geminiText,
      question,
    });*/
    if (!updatedChat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ answer: geminiText, updatedChat });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Failed to get answer from Gemini" });
  }
});

app.delete("/chat/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const chat = await Chat.findOneAndDelete({
      _id: req.params.id,
      userEmail: decoded.email,
    });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: "Unauthorized or failed to delete" });
  }
});

// ✅ Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

const fetchHistory = async () => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch("http://localhost:5000/chat-history", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) {
      setChatHistory(data);
    } else {
      setChatHistory([]); // fallback to empty array on error
    }
  } catch (err) {
    setChatHistory([]); // fallback on network error
  }
};
