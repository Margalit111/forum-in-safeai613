/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response } from "express";
import * as authService from "../services/authService";
import { validateRequest } from "../utils/validation";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../utils/validation";

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function registerHandler(req: Request, res: Response) {
  try {
    const data = validateRequest(registerSchema, req.body);
    const result = await authService.register({
      email: data.email,
      password: data.password,
      name: data.name,
      ...(data.organization && { organization: data.organization }),
      ...(data.profileId && { profileId: data.profileId }),
      mode: data.mode,
    });

    res.status(201).json({
      success: true,
      message: "נשלח אימייל אימות לכתובת שהזנת. אנא אמת את האימייל שלך כדי להתחבר.",
      user: result.user,
      proxyApiKey: result.proxyApiKey,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "ההרשמה נכשלה",
    });
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function loginHandler(req: Request, res: Response) {
  try {
    const data = validateRequest(loginSchema, req.body);
    const result = await authService.login(data.email, data.password);

    res.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(401).json({
      success: false,
      error: error.message || "ההתחברות נכשלה",
    });
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const data = validateRequest(refreshTokenSchema, req.body);
    const result = await authService.refreshAccessToken(data.refreshToken);

    res.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      error: error.message || "רענון הטוקן נכשל",
    });
  }
}

/**
 * Logout user
 * POST /api/auth/logout
 */
export async function logoutHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user; // From authenticateToken middleware
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    await authService.logout(user.userId, refreshToken);

    res.json({
      success: true,
      message: "התנתקת בהצלחה",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "ההתנתקות נכשלה",
    });
  }
}

/**
 * Verify email
 * GET /api/auth/verify-email/:token
 */
export async function verifyEmailHandler(req: Request, res: Response) {
  try {
    const data = validateRequest(verifyEmailSchema, { token: req.params.token });
    const result = await authService.verifyEmail(data.token);

    res.json({
      success: true,
      message: "האימייל אומת בהצלחה! כעת תוכל להתחבר למערכת.",
      user: result.user,
    });
  } catch (error: any) {
    console.error("Email verification error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "אימות האימייל נכשל",
    });
  }
}

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export async function forgotPasswordHandler(req: Request, res: Response) {
  try {
    const data = validateRequest(forgotPasswordSchema, req.body);
    await authService.forgotPassword(data.email);

    res.json({
      success: true,
      message: "אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: "אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה",
    });
  }
}

/**
 * Reset password
 * POST /api/auth/reset-password
 */
export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const data = validateRequest(resetPasswordSchema, req.body);
    await authService.resetPassword(data.token, data.newPassword);

    res.json({
      success: true,
      message: "הסיסמה אופסה בהצלחה! כעת תוכל להתחבר עם הסיסמה החדשה.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "איפוס הסיסמה נכשל",
    });
  }
}

/**
 * Get current user
 * GET /api/auth/me
 */
export async function getCurrentUserHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user; // From authenticateToken middleware
    const userData = await authService.getCurrentUser(user.userId);

    res.json({
      success: true,
      user: userData,
    });
  } catch (error: any) {
    console.error("Get current user error:", error);
    res.status(404).json({
      success: false,
      error: error.message || "המשתמש לא נמצא",
    });
  }
}
