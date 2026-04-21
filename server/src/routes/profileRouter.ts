import express from "express";
import { requireAdmin } from "../middleware/auth";

import {
  createProfileHandler,
  listProfilesHandler,
  listAllProfilesHandler,
  listAllFullProfilesHandler,
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
router.get("/admin/all", requireAdmin, listAllProfilesHandler); // Admin-only: see all profiles
router.get("/admin/full", requireAdmin, listAllFullProfilesHandler); // Admin-only: see all profiles with full details (prompts, categories)
router.get("/:id", getProfileHandler);
router.put("/:id", updateProfileHandler);
router.delete("/:id", deleteProfileHandler);

export default router;
