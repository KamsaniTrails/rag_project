require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const queryRoutes = require("./routes/query");
const chatRoutes = require("./routes/chat");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", uploadRoutes);
app.use("/api/query", queryRoutes);
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`RAG Document Q&A backend running on port ${PORT}`);
  });
});
