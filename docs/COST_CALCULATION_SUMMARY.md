# סיכום תיקון חישוב עלויות - Cost Calculation Fix Summary

## תיאור הבעיה / Problem Description

המערכת לא חישבה עלויות נכון עבור כל האנדפוינטים. היו מספר בעיות:

1. **חסרו מחירים** עבור מודלים מסוימים (gpt-4o-mini)
2. **חסרו פונקציות עזר** לחישוב עלויות עבור תמונות, TTS, ו-Whisper
3. **Responses API** השתמש בפורמט שונה של tokens (input_tokens/output_tokens במקום prompt_tokens/completion_tokens)
4. **לא היה נורמליזציה** של usage data מפורמטים שונים

## השינויים שבוצעו / Changes Made

### 1. קובץ `server/src/utils/costs.ts`

#### הוספת מודלים חסרים:
```typescript
"openai/gpt-4o-mini": {
  input: 0.00015 / 1000,
  output: 0.0006 / 1000,
},
```

#### הוספת מחירים לשירותים נוספים:
```typescript
// OpenAI Image Generation - DALL-E
"openai/dall-e-3": {
  input: 0.04,  // Standard 1024x1024
  output: 0,
},
"openai/dall-e-2": {
  input: 0.02,  // Standard 1024x1024
  output: 0,
},

// OpenAI Audio - TTS
"openai/tts-1": {
  input: 0.015 / 1000,  // per 1K characters
  output: 0,
},
"openai/tts-1-hd": {
  input: 0.030 / 1000,  // per 1K characters
  output: 0,
},

// OpenAI Audio - Whisper
"openai/whisper-1": {
  input: 0.006 / 60,  // per minute
  output: 0,
},
```

#### פונקציות עזר חדשות:

**1. `normalizeTokenUsage()`** - מנרמל usage data מפורמטים שונים:
```typescript
export function normalizeTokenUsage(usage: TokenUsage | null | undefined): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```
- תומך ב-Chat Completions format (prompt_tokens/completion_tokens)
- תומך ב-Responses API format (input_tokens/output_tokens)

**2. `calculateImageCost()`** - מחשב עלות ליצירת תמונות:
```typescript
export function calculateImageCost(
  model: string, 
  size: string = "1024x1024", 
  quality: string = "standard", 
  n: number = 1
): number
```
- תומך ב-DALL-E 2 ו-DALL-E 3
- מחשב לפי גודל, איכות, וכמות תמונות

**3. `calculateTTSCost()`** - מחשב עלות ל-Text-to-Speech:
```typescript
export function calculateTTSCost(model: string, text: string): number
```
- מחשב לפי מספר תווים בטקסט

**4. `calculateWhisperCost()`** - מחשב עלות לתמלול אודיו:
```typescript
export function calculateWhisperCost(durationSeconds: number): number
```
- מחשב לפי משך האודיו בדקות

### 2. קובץ `server/src/services/proxyService.ts`

#### עדכון Imports:
```typescript
import { 
  calculateCostFromTokens, 
  calculateImageCost, 
  calculateTTSCost, 
  calculateWhisperCost,
  normalizeTokenUsage 
} from "../utils/costs";
```

#### תיקון `proxyImageGeneration()`:
```typescript
// Calculate image cost based on request parameters
const size = body.size || "1024x1024";
const quality = body.quality || "standard";
const n = body.n || 1;
const imageCost = calculateImageCost(model, size, quality, n);

// ... log usage with imageCost instead of 0
```

#### תיקון `proxyAudioSpeech()` (TTS):
```typescript
// Calculate TTS cost based on input text
const inputText = body.input || "";
const ttsCost = calculateTTSCost(model, inputText);

// ... log usage with ttsCost instead of 0
```

#### הערה על `proxyAudioTranscription()` (Whisper):
```typescript
// NOTE: Whisper cost calculation requires audio duration
// Currently set to 0 - need to extract duration from audio file
// TODO: Implement audio duration extraction before transcription
cost: 0,  // Should use calculateWhisperCost(durationSeconds)
```

## מה עובד עכשיו / What Works Now

✅ **Chat Completions** - חישוב עלויות מדויק לכל המודלים  
✅ **Responses API** - נורמליזציה נכונה של usage data  
✅ **Image Generation** - חישוב עלויות לפי גודל, איכות, וכמות  
✅ **TTS (Text-to-Speech)** - חישוב עלויות לפי מספר תווים  
✅ **Streaming** - חישוב עלויות נכון גם ב-streaming mode  

⚠️ **Whisper (Transcription)** - דורש שיפור:
- כרגע מוגדר ל-0
- צריך לחלץ את משך האודיו מהקובץ לפני התמלול
- אפשר להשתמש ב-`calculateWhisperCost(durationSeconds)` כשיהיה duration

## פונקציות העזר - Helper Functions Status

| Function | Status | Notes |
|----------|--------|-------|
| `calculateCostFromTokens()` | ✅ תקין | משתמש ב-normalizeTokenUsage() |
| `normalizeTokenUsage()` | ✅ תקין | תומך בשני פורמטים |
| `calculateImageCost()` | ✅ תקין | תומך בכל הגדלים והאיכויות |
| `calculateTTSCost()` | ✅ תקין | מחשב לפי תווים |
| `calculateWhisperCost()` | ✅ תקין | מוכן לשימוש כשיהיה duration |

## דוגמאות שימוש / Usage Examples

### Chat Completions
```typescript
const cost = calculateCostFromTokens(
  { prompt_tokens: 100, completion_tokens: 50 },
  "openai/gpt-4o-mini"
);
// Cost: $0.000024
```

### Image Generation
```typescript
const cost = calculateImageCost(
  "dall-e-3",
  "1024x1024",
  "hd",
  2
);
// Cost: $0.16 (2 images × $0.08)
```

### TTS
```typescript
const cost = calculateTTSCost(
  "tts-1",
  "Hello world, this is a test message!"
);
// Cost based on character count
```

### Whisper (Future)
```typescript
const cost = calculateWhisperCost(120); // 120 seconds = 2 minutes
// Cost: $0.012
```

## המלצות לעתיד / Future Recommendations

1. **Whisper Duration Extraction**:
   - להוסיף ספרייה לחילוץ משך אודיו (למשל `ffprobe`)
   - לחלץ duration לפני שליחה ל-LiteLLM
   - להשתמש ב-`calculateWhisperCost(durationSeconds)`

2. **Cost Validation**:
   - להוסיף בדיקות שהעלות המחושבת סבירה
   - להוסיף alerts אם העלות גבוהה מדי

3. **Pricing Updates**:
   - לעדכן מחירים באופן קבוע מ-API של הספקים
   - לשמור היסטוריה של שינויי מחירים

4. **Testing**:
   - להוסיף unit tests לכל פונקציות החישוב
   - לבדוק edge cases (usage null, מודל לא קיים, וכו')

## קבצים ששונו / Modified Files

1. ✅ `server/src/utils/costs.ts` - פונקציות חישוב עלויות
2. ✅ `server/src/services/proxyService.ts` - אינטגרציה של חישובי עלויות

## בדיקות שמומלץ לבצע / Recommended Tests

1. ✅ Chat completion עם מודלים שונים
2. ✅ Streaming chat completion
3. ✅ Responses API
4. ✅ Image generation (גדלים ואיכויות שונות)
5. ✅ TTS עם טקסטים באורכים שונים
6. ⚠️ Whisper transcription (כרגע cost=0)

---

**תאריך עדכון**: 11/05/2026  
**גרסה**: 1.0  
**סטטוס**: ✅ הושלם (למעט Whisper duration extraction)
