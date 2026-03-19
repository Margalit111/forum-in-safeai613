import "dotenv/config";

import express from "express";
import cors from "cors";
import filterRouter from "./routes/filterRouter";
import profileRouter from "./routes/profileRouter";
import openaiRouter from "./routes/openaiRouter";
import userRouter from "./routes/userRouter";
import providerKeyRouter from "./routes/providerKeyRouter";

import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { connectDatabase } from "./config/db";
import {proxyAuth} from "./middleware/proxyAuth";

const PORT = process.env.PORT || 3001;

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use(requestLogger);



app.get("/health", (_req, res) => {
  res.send("OK");
});

app.use("/filter", filterRouter);
app.use("/profiles", profileRouter);
app.use("/users", userRouter);
app.use("/provider-keys", providerKeyRouter);
app.use("/v1",openaiRouter);



app.use(errorHandler);

async function start() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
}

start();