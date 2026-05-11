# Token Management Implementation

## Overview
This document describes the token management system implemented to handle JWT token expiration, automatic refresh, and session management in the SafeAI application.

## Problem Statement
Previously, when a user's access token expired (after 15 minutes), the client would continue to display the UI normally, but all API calls would fail with 401 errors. This created a poor user experience where users could see components they shouldn't have access to and couldn't interact with them.

## Solution
A comprehensive token management system that:
1. **Automatically refreshes tokens** when they expire during API calls
2. **Tracks user activity** to determine if the session should be kept alive
3. **Shows a confirmation dialog** when the session is about to expire due to inactivity
4. **Redirects to home page** if the user doesn't confirm or if token refresh fails
5. **Prevents UI from showing protected components** when tokens are invalid

## Implementation Details

### 1. Token Manager Utility (`client/src/utils/tokenManager.ts`)

#### Key Features:
- **Activity Tracking**: Monitors user interactions (mouse, keyboard, scroll, touch)
- **Automatic Token Refresh**: Refreshes tokens every 10 minutes if user is active
- **Inactivity Warning**: Shows a confirmation dialog after 14 minutes of inactivity
- **Session Cleanup**: Properly cleans up event listeners and timers

#### Configuration:
```typescript
const INACTIVITY_WARNING_TIME = 14 * 60 * 1000; // 14 minutes
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000;  // 10 minutes
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];
```

#### Main Functions:
- `initializeTokenManager()`: Starts activity tracking when user logs in
- `startActivityTracking()`: Sets up event listeners and timers
- `stopActivityTracking()`: Cleans up all listeners and timers
- `refreshAccessToken()`: Refreshes the access token using the refresh token
- `handleSessionExpired()`: Clears tokens and redirects to home page
- `cleanupTokenManager()`: Cleanup function called on logout

### 2. Enhanced API Call Handler (`client/src/config/api.ts`)

The `apiCall` function now includes automatic token refresh logic:

```typescript
// If we get a 401 and have a refresh token, try to refresh
if (response.status === 401 && accessToken) {
  const refreshToken = localStorage.getItem("refreshToken");
  
  if (refreshToken) {
    try {
      // Try to refresh the token
      const refreshResponse = await fetch(/* refresh endpoint */);
      
      if (refreshResponse.ok) {
        // Update tokens and retry the original request
        response = await makeRequest(refreshData.accessToken);
      }
    } catch (refreshError) {
      // Clear tokens and redirect to home
    }
  }
}
```

### 3. App Component Integration (`client/src/App.tsx`)

The token manager is initialized when the app loads:

```typescript
useEffect(() => {
  // Initialize token manager when app loads
  initializeTokenManager();

  // Cleanup on unmount
  return () => {
    cleanupTokenManager();
  };
}, []);
```

### 4. Login Integration (`client/src/features/auth/LoginForm.tsx`)

After successful login, activity tracking is started:

```typescript
// Start activity tracking for token management
startActivityTracking();
```

### 5. Logout Integration (`client/src/components/TopNavigation.tsx`)

On logout, the token manager is properly cleaned up:

```typescript
const handleLogout = () => {
  // Cleanup token manager
  cleanupTokenManager();
  
  // Clear local storage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
  
  navigate("/");
};
```

## User Experience Flow

### Active User Scenario:
1. User logs in → Activity tracking starts
2. User interacts with the app → Activity is recorded
3. Every 10 minutes → Token is automatically refreshed in the background
4. User continues working seamlessly

### Inactive User Scenario:
1. User logs in → Activity tracking starts
2. User stops interacting with the app
3. After 14 minutes of inactivity → Confirmation dialog appears:
   - **User clicks "OK"**: Token is refreshed, session continues
   - **User clicks "Cancel"**: User is logged out and redirected to home page
4. If user doesn't respond → Session expires after token lifetime

### Token Expiration During API Call:
1. API call receives 401 error
2. System attempts to refresh token automatically
3. If refresh succeeds → Original request is retried with new token
4. If refresh fails → User is logged out and redirected to home page

## Security Considerations

1. **Refresh Token Storage**: Refresh tokens are stored in localStorage (consider httpOnly cookies for production)
2. **Token Rotation**: Each refresh generates a new refresh token, invalidating the old one
3. **Automatic Cleanup**: All tokens are cleared on logout or session expiration
4. **Activity-Based Refresh**: Tokens are only refreshed if user is actively using the app

## Testing Recommendations

1. **Test Token Expiration**: Wait for 15 minutes and verify automatic refresh
2. **Test Inactivity Warning**: Don't interact for 14 minutes and verify dialog appears
3. **Test API Call Retry**: Make an API call with an expired token and verify it's retried
4. **Test Logout Cleanup**: Verify all timers and listeners are cleaned up on logout
5. **Test Multiple Tabs**: Verify behavior when user has multiple tabs open

## Future Enhancements

1. **Visual Session Timer**: Show a countdown timer in the UI
2. **Configurable Timeouts**: Allow admins to configure inactivity timeouts
3. **Remember Me**: Option to extend session duration
4. **Secure Token Storage**: Move to httpOnly cookies for better security
5. **Token Refresh Queue**: Handle multiple simultaneous API calls during token refresh
6. **Offline Support**: Handle token refresh when network is unavailable

## Related Files

- `client/src/utils/tokenManager.ts` - Token management utility
- `client/src/config/api.ts` - API call handler with token refresh
- `client/src/App.tsx` - App initialization
- `client/src/features/auth/LoginForm.tsx` - Login integration
- `client/src/components/TopNavigation.tsx` - Logout integration
- `server/src/utils/jwt.ts` - JWT token generation and verification
- `server/src/middleware/auth.ts` - Server-side authentication middleware
- `server/src/controllers/authController.ts` - Authentication endpoints

## Configuration

### Server-Side Token Expiry:
```typescript
const ACCESS_TOKEN_EXPIRY = "15m";  // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d";  // 7 days
```

### Client-Side Timings:
```typescript
const INACTIVITY_WARNING_TIME = 14 * 60 * 1000; // 14 minutes
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000;  // 10 minutes
```

## Troubleshooting

### Issue: User gets logged out unexpectedly
- Check if refresh token is being stored correctly
- Verify server refresh endpoint is working
- Check browser console for token refresh errors

### Issue: Inactivity dialog doesn't appear
- Verify activity tracking is initialized after login
- Check if event listeners are properly attached
- Verify timer is not being cleared prematurely

### Issue: API calls fail after token refresh
- Check if new token is being used in retry
- Verify token is being stored in localStorage
- Check server logs for token validation errors
