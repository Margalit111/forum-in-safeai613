import { AIProfile, AIProfileDoc } from "../models/aiProfile";

// type CreateProfileInput = Omit<AIProfileDoc, keyof Document>;

export async function createProfile(data: Partial<AIProfileDoc>) {
  return AIProfile.create(data);
}

export async function getProfiles() {
  return AIProfile.find().sort({ createdAt: -1 }).lean();
}

export async function getProfileById(profileId: string) {
  return AIProfile.findById(profileId).lean();
}

export async function getProfileByName(name: string) {
  return AIProfile.findOne({ name: name.trim() }).lean();
}

export async function updateProfile(profileId: string, data: Partial<AIProfileDoc>) {
  return AIProfile.findByIdAndUpdate(profileId, data, {
    new: true,
    runValidators: true,
  }).lean();
}

export async function deleteProfile(profileId: string) {
  return AIProfile.findByIdAndDelete(profileId).lean();
}