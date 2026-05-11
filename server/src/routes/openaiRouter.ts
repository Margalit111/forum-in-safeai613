import express from "express";
import { proxyAuth } from "../middleware/proxyAuth";
import { audioSpeechHandler, audioTranscriptionHandler, chatCompletionHandler, imageGenerationHandler } from "../controllers/openaiController";
import { rateLimiter } from "../middleware/rateLimiter";
import { responsesHandler } from "../controllers/openaiController";
import multer from "multer"; // npm install multer @types/multer


const router = express.Router();

// multer עם memory storage - הקובץ נשמר ב-RAM (מתאים לקבצי אודיו קטנים)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB - מגבלת Whisper
});



router.post(
  "/chat/completions",
  proxyAuth,
  rateLimiter,
  chatCompletionHandler
);


router.post("/responses", 
  proxyAuth,
  rateLimiter,
  responsesHandler);



  router.post("/images/generations",
      proxyAuth,
  rateLimiter,
    imageGenerationHandler);
// router.post(
//   "/audio/transcriptions",
//   proxyAuth,
//   rateLimiter,
//   upload.single("file"), // שם השדה חייב להיות "file" - תואם OpenAI API
//   audioTranscriptionHandler
// );
// router.post("/audio/speech", 
//    proxyAuth,
//   rateLimiter,
//   audioSpeechHandler);
export default router;