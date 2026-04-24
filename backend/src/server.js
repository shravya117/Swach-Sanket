import "dotenv/config.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/error.js";

import authRoutes from "./routes/auth.routes.js";
import materialsRoutes from "./routes/materials.routes.js";
import entriesRoutes from "./routes/entries.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import complianceRoutes from "./routes/compliance.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";

const app = express();

const allowedOrigins = new Set(
  [process.env.CLIENT_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"]
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, "")),
);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.has(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: false,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(rateLimit(60_000, 300));

app.use(cors(corsOptions));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.post("/superadmin", (req, res) => {
  const { username, password } = req.body;

  if (username === "mrf123" && password === "mrf1234") {
    res.status(200).json({ message: "Access accepted " });
  } else if (username === "gram123" && password === "gram1234") {
    res.status(200).json({ message: "Access accepted " });
  } else if (username === "zilla123" && password === "zilla1234") {
    res.status(200).json({ message: "Access accepted" });
  } else {
    res.status(401).json({ message: "Access denied" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/materials", materialsRoutes);
app.use("/api/entries", entriesRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/transactions", transactionsRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`),
    );
  })
  .catch(async () => {
    console.warn(
      "⚠️ Falling back to in-memory backend because MongoDB is unavailable.",
    );
    await import("./server.memory.js");
  });
