import express from "express";


import {
  createProfileHandler,
  listProfilesHandler,
  getProfileHandler,
  updateProfileHandler,
  deleteProfileHandler,
} from "../controllers/profileController";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.send("OK");
});


/* profiles */
router.post("/", createProfileHandler);
router.get("/", listProfilesHandler);
router.get("/:id", getProfileHandler);
router.put("/:id", updateProfileHandler);
router.delete("/:id", deleteProfileHandler);

export default router;