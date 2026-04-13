import { Request, Response } from "express";
import {
  createProfile,
 getProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
} from "../services/profileService";

export async function createProfileHandler(req: Request, res: Response) {
  try {
    const profile = await createProfile(req.body);
    res.json({ success: true, profile });
  } catch {
    res.status(500).json({ error: "Failed to create profile" });
  }
}

export async function listProfilesHandler(_req: Request, res: Response) {
    console.log("➡️ handler start");

  try {
    const profiles = await getProfiles();
        console.log("✅ got profiles");

    res.json(profiles);
  } catch (err) {
        console.error("❌ error:", err);

    res.status(500).json({ error: "Failed to fetch profiles" });
  }
}

export async function getProfileHandler(req: Request<{ id: string }>, res: Response) {
  try {
    const profile = await getProfileById(req.params.id);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(profile);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

export async function updateProfileHandler(req: Request<{ id: string }>, res: Response) {
  try {
    const profile = await updateProfile(req.params.id, req.body);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({ success: true, profile });
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
}

export async function deleteProfileHandler(req: Request<{ id: string }>, res: Response) {
  try {
    await deleteProfile(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}
