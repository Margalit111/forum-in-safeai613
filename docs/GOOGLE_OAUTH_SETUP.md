# הגדרת Google OAuth - מדריך מלא

מדריך זה מסביר כיצד להגדיר אימות Google OAuth עבור האפליקציה.

## שלב 1: יצירת פרויקט ב-Google Cloud Console

1. **גש ל-Google Cloud Console**
   - פתח את הדפדפן וגש ל: https://console.cloud.google.com/

2. **צור פרויקט חדש**
   - לחץ על התפריט הנפתח בחלק העליון של הדף
   - לחץ על "New Project" (פרויקט חדש)
   - הזן שם לפרויקט (לדוגמה: "SafeAI Authentication")
   - לחץ על "Create" (צור)

## שלב 2: הפעלת Google+ API

1. **עבור ל-API Library**
   - בתפריט הצד, לחץ על "APIs & Services" > "Library"
   
2. **חפש והפעל את Google+ API**
   - חפש "Google+ API"
   - לחץ עליו ולאחר מכן לחץ על "Enable" (הפעל)

## שלב 3: יצירת OAuth 2.0 Credentials

1. **עבור ל-Credentials**
   - בתפריט הצד, לחץ על "APIs & Services" > "Credentials"

2. **צור OAuth consent screen**
   - לחץ על "OAuth consent screen" בתפריט העליון
   - בחר "External" (חיצוני) ולחץ "Create"
   - מלא את הפרטים הבאים:
     - **App name**: SafeAI (או שם האפליקציה שלך)
     - **User support email**: האימייל שלך
     - **Developer contact information**: האימייל שלך
   - לחץ "Save and Continue"
   - בשלב "Scopes", לחץ "Add or Remove Scopes" והוסף:
     - `userinfo.email`
     - `userinfo.profile`
   - לחץ "Save and Continue"
   - בשלב "Test users", הוסף את האימיילים שברצונך לאפשר להם גישה בזמן הפיתוח
   - לחץ "Save and Continue"

3. **צור OAuth 2.0 Client ID**
   - חזור ל-"Credentials"
   - לחץ על "Create Credentials" > "OAuth client ID"
   - בחר "Web application"
   - הזן שם (לדוגמה: "SafeAI Web Client")
   - הוסף **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     http://localhost:3000
     ```
   - הוסף **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/google/callback
     ```
   - לחץ "Create"

4. **שמור את הפרטים**
   - לאחר היצירה, תקבל חלון עם:
     - **Client ID** - מזהה הלקוח
     - **Client Secret** - סוד הלקוח
   - **חשוב**: שמור את שני הערכים האלה במקום בטוח!

## שלב 4: הגדרת משתני הסביבה

1. **עדכן את קובץ `.env` בשרת**
   
   פתח את הקובץ `server/.env` והוסף/עדכן את השורות הבאות:

   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
   CLIENT_URL=http://localhost:5173
   ```

   **החלף**:
   - `YOUR_CLIENT_ID_HERE` - ב-Client ID שקיבלת
   - `YOUR_CLIENT_SECRET_HERE` - ב-Client Secret שקיבלת

2. **לסביבת ייצור (Production)**
   
   כאשר תעלה את האפליקציה לסביבת ייצור, עדכן את הערכים:

   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
   CLIENT_URL=https://yourdomain.com
   ```

   **וגם עדכן ב-Google Cloud Console**:
   - חזור ל-Credentials
   - ערוך את ה-OAuth 2.0 Client ID
   - הוסף את ה-URLs של הייצור ל:
     - Authorized JavaScript origins
     - Authorized redirect URIs

## שלב 5: בדיקת ההגדרות

1. **הפעל את השרת**
   ```bash
   cd server
   npm run dev
   ```

2. **הפעל את הקליינט**
   ```bash
   cd client
   npm run dev
   ```

3. **נסה להתחבר עם Google**
   - גש ל: http://localhost:5173/login
   - לחץ על כפתור "התחבר עם Google"
   - אשר את ההרשאות
   - אמור להתבצע redirect חזרה לאפליקציה

## פתרון בעיות נפוצות

### שגיאה: "redirect_uri_mismatch"
**פתרון**: ודא ש-redirect URI ב-Google Cloud Console תואם בדיוק ל-URL שמוגדר ב-`.env`:
```
http://localhost:3000/api/auth/google/callback
```

### שגיאה: "Access blocked: This app's request is invalid"
**פתרון**: ודא שהוספת את ה-scopes הנדרשים ב-OAuth consent screen:
- `userinfo.email`
- `userinfo.profile`

### שגיאה: "Error 403: access_denied"
**פתרון**: 
- אם האפליקציה במצב "Testing", הוסף את המשתמש ל-"Test users" ב-OAuth consent screen
- או פרסם את האפליקציה ל-"Production"

### המשתמש לא נוצר במסד הנתונים
**פתרון**: בדוק את הלוגים של השרת ב-console. ודא ש:
- MongoDB מחובר
- משתני הסביבה נטענו כראוי
- אין שגיאות ב-`googleAuthController.ts`

## אבטחה - חשוב!

1. **לעולם אל תשתף את ה-Client Secret**
   - אל תעלה אותו ל-Git
   - שמור אותו רק בקובץ `.env` (שנמצא ב-`.gitignore`)

2. **בסביבת ייצור**:
   - השתמש ב-HTTPS בלבד
   - הגדר את ה-OAuth consent screen ל-"Production"
   - הגבל את ה-redirect URIs רק לדומיינים המורשים שלך

3. **ניטור**:
   - עקוב אחר השימוש ב-Google Cloud Console
   - הגדר התראות על פעילות חשודה

## תמיכה נוספת

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) - לבדיקת ה-flow

---

**עודכן לאחרונה**: מרץ 2026
