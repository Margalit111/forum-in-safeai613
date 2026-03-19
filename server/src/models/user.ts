import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: String,

    // --- שדות עבור המפתח שהמשתמש מקבל ממך (App Level) ---
    proxyKeyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    proxyKeyPrefix: {
      type: String,
      required: true,
      index: true,
    },

    // --- שדות עבור התקשורת הפנימית מול LiteLLM (Infrastructure Level) ---
    litellmKeyEncrypted: {
      type: String, // המפתח הגלוי (sk-safeai-...) אחרי הצפנה ב-userService
      required: true,
    },
    litellmPrefix: {
      type: String, // key_name שחזר מ-LiteLLM
      required: true,
    },
    litellmToken: {
      type: String, // ה-token (ההאש) שחזר מ-LiteLLM לניהול המפתח
      required: true,
    },

    // --- הגדרות פרופיל ומודלים ---
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIProfile",
    },
    mode: {
      type: String,
      enum: ["BYOK", "MANAGED"],
      default: "BYOK",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const obj = ret as any;

    // אנחנו לא רוצים לחשוף את ההאש או את המפתח המוצפן ב-API החיצוני
    delete obj.proxyKeyHash;
    delete obj.litellmKeyEncrypted;
    delete obj.litellmToken;
    delete obj.__v;
    return obj;
  },
});

export const User = mongoose.model("User", UserSchema);
