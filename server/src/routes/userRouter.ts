import express from "express";
import {
  createUserHandler,
  listUsersHandler,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler
} from "../controllers/userController";

const router = express.Router();

router.post("/", createUserHandler);
router.get("/", listUsersHandler);
router.get("/:id", getUserHandler);
router.put("/:id", updateUserHandler);
router.patch("/:id", updateUserHandler);
router.delete("/:id", deleteUserHandler);

export default router;
