const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  imageUrl: { type: String, required: true },
  prediction: { type: String, required: true },
  geminiInfo: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  questions: [
    {
      question: String,
      answer: String,
      askedAt: { type: Date, default: Date.now },
    },
  ],
});
module.exports = mongoose.model("Chat", chatSchema);
