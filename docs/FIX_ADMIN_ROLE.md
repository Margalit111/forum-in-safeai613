# תיקון תפקיד Admin שהשתנה ל-org_owner

## הבעיה
כאשר יצרת ארגון והגדרת משתמש admin כבעלים, התפקיד שלו השתנה מ-`admin` ל-`org_owner`, מה שגרם לו לאבד גישה לסטטיסטיקות מערכת.

## הפתרון שבוצע

### 1. תיקון בקוד (כבר בוצע)
עדכנתי את `server/src/services/organizationService.ts` כך שהוא ישמור על תפקיד admin:
```typescript
// Before:
role: "org_owner"

// After:
role: owner.role === "admin" ? "admin" : "org_owner"
```

זה ימנע את הבעיה בעתיד, אבל לא יתקן את המשתמש הנוכחי.

### 2. תיקון המשתמש הנוכחי במסד הנתונים

יש לך שתי אפשרויות:

#### אפשרות א': דרך MongoDB ישירות
```javascript
// התחבר ל-MongoDB
use your_database_name

// מצא את המשתמש שלך
db.users.findOne({ email: "your-email@example.com" })

// עדכן את התפקיד חזרה ל-admin
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

#### אפשרות ב': דרך API endpoint (אם יש לך גישת admin אחרת)
אם יש לך משתמש admin אחר או גישה ישירה, תוכל לעדכן דרך endpoint של ניהול משתמשים.

### 3. התחברות מחדש
לאחר עדכון התפקיד במסד הנתונים:
1. התנתק מהמערכת
2. התחבר מחדש
3. ה-JWT החדש יכיל את התפקיד המעודכן

## בדיקה
לאחר ההתחברות מחדש, פתח את הקונסול (F12) ובדוק:
```javascript
localStorage.getItem("userRole")  // צריך להיות "admin"
```

## הערות
- השינוי בקוד ימנע את הבעיה בעתיד
- משתמשים קיימים שכבר השתנה להם התפקיד צריכים עדכון ידני במסד הנתונים
- לאחר עדכון התפקיד, יש להתחבר מחדש כדי לקבל JWT חדש
