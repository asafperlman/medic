// src/api/llmService.js

/**
 * מודול זה מספק שירותי תקשורת עם מודל שפה גדול (LLM)
 * כמו OpenAI GPT לצורך יצירת שאלות דינמיות וסיכומי אנמנזה
 */

// ייבוא הקונפיגורציה
const config = require('../../config');
const https = require('https'); // מודול מובנה של Node.js

// מודול ה-LLM
const LLMService = {
  // קונפיגורציה
  config: {
    // שימוש במודל חסכוני בעלויות
    defaultModel: config.openai.model || "gpt-3.5-turbo-0125",
    apiKey: config.openai.apiKey || process.env.OPENAI_API_KEY,
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    temperature: config.openai.temperature || 0.2,
    maxTokens: config.openai.maxTokens || 1500,
    timeout: 15000,
    maxRetries: 2,
    retryDelay: 1000,
    
    // מטמון לתוצאות שכיחות
    useCache: config.openai.useCache || true,
    cacheTTL: config.openai.cacheTTL || 86400000, // 24 שעות במילישניות
  },
  
  // מטמון תוצאות
  responseCache: new Map(),

  /**
   * שליחת פרומפט למודל השפה
   * @param {string} prompt - הפרומפט לשליחה למודל
   * @param {object} options - אפשרויות שליחה נוספות
   * @returns {string} - התשובה מהמודל
   */
  sendPrompt: async function(prompt, options = {}) {
    const cacheKey = JSON.stringify({ prompt, options });
    
    // בדיקה במטמון אם המטמון מופעל
    if (this.config.useCache) {
      const cachedResponse = this.responseCache.get(cacheKey);
      if (cachedResponse && cachedResponse.expiry > Date.now()) {
        console.log("מחזיר תשובה מהמטמון");
        return cachedResponse.data;
      }
    }
    
    try {
      console.log(`שולח בקשה למודל שפה עם פרומפט: ${prompt.substring(0, 100)}...`);
      
      // במצב פיתוח נחזיר תשובה דמה
      let response = "";
      
      // בדיקה אם הפרומפט קשור לשאלות המשך או לסיכום
      if (prompt.includes("שאלות המשך") || prompt.includes("שאלות נוספות")) {
        response = this._simulateFollowupQuestions(prompt);
      } else if (prompt.includes("סיכום") || prompt.includes("אנמנזה")) {
        response = this._simulateSummary(prompt);
      } else {
        // תשובה כללית
        response = "תשובה לפרומפט כללי. בסביבת ייצור, זו הייתה תשובה אמיתית מ-LLM.";
      }
      
      // שמירה במטמון אם המטמון מופעל
      if (this.config.useCache) {
        this.responseCache.set(cacheKey, {
          data: response,
          expiry: Date.now() + this.config.cacheTTL
        });
      }
      
      return response;
    } catch (error) {
      console.error("שגיאה בשליחת בקשה למודל השפה:", error.message);
      
      // ניסיון להחזיר תשובה סטטית במקרה של שגיאה
      if (prompt.includes("שאלות")) {
        return this._getFallbackQuestions(prompt);
      } else if (prompt.includes("סיכום")) {
        return this._getFallbackSummary(prompt);
      } else {
        throw new Error("שגיאה בתקשורת עם מודל השפה");
      }
    }
  },

  /**
   * יוצר פרומפט לקבלת שאלות המשך
   * @param {object} patientRecord - רשומת המטופל
   * @returns {string} - הפרומפט המוכן לשליחה
   */
  createFollowupQuestionsPrompt: function(patientRecord) {
    const { age, gender, mainComplaint } = patientRecord.patientInfo;
    const genderText = gender === 'male' ? 'זכר' : 'נקבה';
    
    // יצירת פרומפט מובנה לשאלות המשך
    let prompt = `אתה עוזר רפואי מקצועי ברמת חובש. עליך ליצור שאלות המשך מעמיקות למטופל.

הפרטים הבסיסיים:
- גיל: ${age}
- מין: ${genderText}
- תלונה עיקרית: ${mainComplaint}

מידע נוסף שנאסף:
`;
    
    // הוספת התשובות לשאלות הסטנדרטיות
    for (const [question, answer] of Object.entries(patientRecord.standardAnswers)) {
      if (answer && answer.trim()) {
        prompt += `- ${question} ${answer}\n`;
      }
    }
    
    // הוספת הוראות ספציפיות על פורמט התשובה
    prompt += `
בהתבסס על המידע הזה, אנא צור 5 שאלות המשך מעמיקות שיעזרו לי לקבל תמונה רפואית מלאה יותר. 
השאלות צריכות להיות ספציפיות, תוך התמקדות באפשרויות אבחנתיות עיקריות ודגלים אדומים אפשריים.
השאלות צריכות להיות ממוספרות מ-1 עד 5, עם שאלה אחת בכל שורה.

דוגמה לפורמט:
1. שאלה ראשונה?
2. שאלה שנייה?
3. שאלה שלישית?
4. שאלה רביעית?
5. שאלה חמישית?`;
    
    return prompt;
  },

  /**
   * מפרסר את התשובה מהמודל לרשימת שאלות
   * @param {string} response - התשובה מהמודל
   * @returns {array} - מערך של שאלות
   */
  parseFollowupQuestions: function(response) {
    // פיצול לשורות והסרת רווחים מיותרים
    const lines = response.split('\n').map(line => line.trim());
    
    // סינון רק שורות שהן שאלות ממוספרות
    const questions = lines.filter(line => 
      /^\d+\.\s+(.+)\?$/.test(line)
    ).map(line => {
      // הסר את המספור והשאר רק את תוכן השאלה
      return line.replace(/^\d+\.\s+/, '');
    });
    
    // במקרה שלא הצלחנו לחלץ שאלות, החזר שאלה כללית
    return questions.length > 0 ? questions : ["האם יש מידע נוסף שחשוב לדעת?"];
  },

  /**
   * יוצר פרומפט לסיכום האנמנזה
   * @param {object} patientRecord - רשומת המטופל
   * @returns {string} - הפרומפט המוכן לשליחה
   */
  createSummaryPrompt: function(patientRecord) {
    const { age, gender, mainComplaint } = patientRecord.patientInfo;
    const genderText = gender === 'male' ? 'זכר' : 'נקבה';
    
    // יצירת פרומפט מובנה לסיכום אנמנזה
    let prompt = `אתה חובש מקצועי שצריך לכתוב סיכום אנמנזה רפואית עבור רופא. כתוב סיכום מקצועי, תמציתי ומסודר בהתבסס על המידע הבא:

הפרטים הבסיסיים:
- גיל: ${age}
- מין: ${genderText}
- תלונה עיקרית: ${mainComplaint}

מידע שנאסף משאלות סטנדרטיות:
`;
    
    // הוספת התשובות לשאלות הסטנדרטיות
    for (const [question, answer] of Object.entries(patientRecord.standardAnswers)) {
      if (answer && answer.trim()) {
        prompt += `- ${question} ${answer}\n`;
      }
    }
    
    // הוספת התשובות לשאלות הדינמיות
    prompt += `\nמידע שנאסף משאלות ממוקדות:\n`;
    
    for (const [question, answer] of Object.entries(patientRecord.dynamicAnswers)) {
      if (answer && answer.trim()) {
        prompt += `- ${question} ${answer}\n`;
      }
    }
    
    // הוראות על מבנה הסיכום הרצוי
    prompt += `
מבנה הסיכום:
1. שורה ראשונה: פרטים דמוגרפיים ותלונה עיקרית.
2. פסקה שנייה: תיאור התלונה העיקרית, כולל משך, אופי והגורמים המחמירים/מקלים.
3. פסקה שלישית: ממצאים משמעותיים נוספים.
4. פסקה רביעית (אם רלוונטי): דגלים אדומים או ממצאים מדאיגים שדורשים התייחסות דחופה.

הסיכום צריך להיות בהיר, תמציתי ומקצועי, באורך של עד 10 שורות.
אם ישנם דגלים אדומים, סמן אותם בבירור בתחילת הפסקה הרביעית במילים "דגלים אדומים: ".`;
    
    return prompt;
  },

  /**
   * מעבד את הסיכום שמתקבל מהמודל
   * @param {string} summaryText - הסיכום מהמודל
   * @returns {string} - הסיכום המעובד
   */
  processSummary: function(summaryText) {
    // ניתן להוסיף כאן עיבוד נוסף לפי הצורך
    // למשל: הדגשת דגלים אדומים, פורמט טקסט, וכו'
    return summaryText;
  },

  /**
   * סימולציה של שאלות המשך ממודל שפה (לסביבת פיתוח)
   * @private
   * @param {string} prompt - הפרומפט שנשלח
   * @returns {string} - שאלות מדומות
   */
  _simulateFollowupQuestions: function(prompt) {
    // זיהוי תלונה עיקרית
    let complaint = "";
    if (prompt.includes("כאב ראש")) complaint = "כאב ראש";
    else if (prompt.includes("כאב בטן")) complaint = "כאב בטן";
    else if (prompt.includes("כאב גרון")) complaint = "כאב גרון";
    else if (prompt.includes("פציעה") || prompt.includes("שבר") || prompt.includes("חבלה")) 
      complaint = "פציעה";
    else if (prompt.includes("קוצר נשימה")) complaint = "קוצר נשימה";
    else complaint = "כללי";
    
    // שאלות לפי סוג התלונה
    switch (complaint) {
      case "כאב ראש":
        return `1. האם הכאב חד או מוצק?
2. האם יש גורמים שמחמירים את הכאב כמו אור, רעש או תנועה?
3. האם יש רגישות לאור או רעש?
4. האם יש סימפטומים נוספים כמו בחילה או הקאות?
5. האם היו בעבר כאבי ראש דומים?`;
      
      case "כאב בטן":
        return `1. האם הכאב ממוקד באזור מסוים או מפושט?
2. האם יש הקרנה של הכאב לאזורים אחרים כמו הגב?
3. האם יש שינוי בהרגלי היציאות או במראה היציאות?
4. האם יש חום או צמרמורות?
5. האם אכלת משהו חריג לאחרונה שיכול להיות קשור לכאב?`;
      
      case "כאב גרון":
        return `1. האם יש קושי או כאב בבליעה?
2. האם יש נפיחות בצוואר או בבלוטות הלימפה?
3. האם יש שינוי בקול או צרידות?
4. האם יש מראה חריג בגרון כמו נקודות לבנות או אדומות?
5. האם היה מגע עם אנשים חולים לאחרונה?`;
      
      case "פציעה":
        return `1. האם יש הגבלה בתנועה באזור הפגוע?
2. האם יש נפיחות, אודם או שטף דם באזור הפגוע?
3. האם יש תחושת חוסר יציבות או "קליק" במפרק?
4. האם יכול להיות שנחשפת לזיהום כתוצאה מהפציעה?
5. האם נקטת באמצעי עזרה ראשונה כלשהם?`;
      
      case "קוצר נשימה":
        return `1. האם קוצר הנשימה מופיע במנוחה או רק במאמץ?
2. האם יש כאב בחזה או דפיקות לב חזקות?
3. האם יש שיעול או ליחה? אם כן, מה צבע הליחה?
4. האם יש גורמים סביבתיים שעלולים להשפיע כמו אבק או אלרגנים?
5. האם יש רקע של בעיות נשימה או מחלות ריאה?`;
      
      default:
        return `1. מתי התחילו הסימפטומים?
2. האם יש גורמים מקלים או מחמירים?
3. האם יש סימפטומים נוספים?
4. האם יש רקע רפואי קודם רלוונטי?
5. האם אתה נוטל תרופות באופן קבוע?`;
    }
  },

  /**
   * סימולציה של סיכום אנמנזה ממודל שפה (לסביבת פיתוח)
   * @private
   * @param {string} prompt - הפרומפט שנשלח
   * @returns {string} - סיכום מדומה
   */
  _simulateSummary: function(prompt) {
    // חילוץ פרטים בסיסיים מהפרומפט
    const ageMatch = prompt.match(/גיל:\s*(\d+)/);
    const genderMatch = prompt.match(/מין:\s*(זכר|נקבה)/);
    const complaintMatch = prompt.match(/תלונה עיקרית:\s*([^\n]+)/);
    
    const age = ageMatch ? ageMatch[1] : "לא ידוע";
    const gender = genderMatch ? genderMatch[1] : "לא ידוע";
    const complaint = complaintMatch ? complaintMatch[1] : "לא ידוע";
    
    // בדיקה מהן התשובות העיקריות שניתנו
    const durationMatch = prompt.match(/זמן|מתי|משך([^\n]+)/);
    const locationMatch = prompt.match(/מיקום|היכן|איפה([^\n]+)/);
    
    const duration = durationMatch ? durationMatch[1].trim() : "לא צוין";
    const location = locationMatch ? locationMatch[1].trim() : "";
    
    // האם יש דגלים אדומים פוטנציאליים
    let hasRedFlags = false;
    if (
      (complaint.includes("ראש") && prompt.includes("הקאות")) ||
      (complaint.includes("חזה") && prompt.includes("קוצר נשימה")) ||
      prompt.includes("איבוד הכרה") ||
      prompt.includes("דימום חמור")
    ) {
      hasRedFlags = true;
    }
    
    // יצירת סיכום בסיסי
    let summary = `מטופל/ת בגיל ${age}, ${gender}, עם תלונה עיקרית של ${complaint}.\n\n`;
    
    summary += `התלונה החלה ${duration === "לא צוין" ? "בזמן לא ידוע" : duration}`;
    if (location) {
      summary += ` ומתמקדת ב${location}`;
    }
    summary += ". ";
    
    // פרטים נוספים כלליים
    if (complaint.includes("כאב")) {
      summary += `הכאב מתואר כ${prompt.includes("חד") ? "חד" : prompt.includes("מתמשך") ? "מתמשך" : "בינוני בעוצמתו"}. `;
    }
    
    summary += "המטופל מדווח גם על ";
    if (prompt.includes("חום")) {
      summary += "תחושת חום, ";
    }
    if (prompt.includes("סחרחורת")) {
      summary += "סחרחורת, ";
    }
    if (prompt.includes("בחילה")) {
      summary += "בחילה, ";
    }
    if (summary.endsWith("המטופל מדווח גם על ")) {
      summary += "ללא תסמינים נוספים משמעותיים.";
    } else {
      summary = summary.slice(0, -2) + ".\n\n"; // הסרת הפסיק האחרון והוספת נקודה
    }
    
    // פרטים על טיפולים קודמים
    if (prompt.includes("טיפול") || prompt.includes("תרופות")) {
      summary += "המטופל ניסה טיפולים ביתיים ללא שיפור משמעותי. ";
    }
    
    // דגלים אדומים
    if (hasRedFlags) {
      summary += "\n\nדגלים אדומים: ";
      
      if (complaint.includes("ראש") && prompt.includes("הקאות")) {
        summary += "הקאות בשילוב עם כאב ראש - יש לשקול הערכה נוירולוגית דחופה. ";
      }
      if (complaint.includes("חזה") && prompt.includes("קוצר נשימה")) {
        summary += "כאב חזה בשילוב עם קוצר נשימה - יש לשלול מצבים קרדיאליים או ריאתיים חריפים. ";
      }
      if (prompt.includes("איבוד הכרה")) {
        summary += "דיווח על איבוד הכרה - נדרשת הערכה מקיפה. ";
      }
      if (prompt.includes("דימום חמור")) {
        summary += "דימום משמעותי - יש לוודא יציבות המודינמית. ";
      }
    }
    
    return summary;
  },

  /**
   * מייצר שאלות גנריות במקרה של כישלון בתקשורת עם המודל
   * @private
   * @param {string} prompt - הפרומפט המקורי
   * @returns {string} - שאלות ברירת מחדל
   */
  _getFallbackQuestions: function(prompt) {
    // שאלות גנריות לפי סוג התלונה
    if (prompt.includes("כאב ראש")) {
      return "1. האם הכאב חד או מוצק?\n2. האם יש גורמים שמחמירים את הכאב?\n3. האם יש רגישות לאור או רעש?\n4. האם יש סימפטומים נוספים כמו בחילה?\n5. האם היו בעבר כאבי ראש דומים?";
    } else if (prompt.includes("כאב בטן")) {
      return "1. האם הכאב ממוקם או מפושט?\n2. האם יש הקרנה של הכאב?\n3. האם יש שינוי בהרגלי היציאות?\n4. האם יש חום?\n5. האם אכלת משהו חריג לאחרונה?";
    } else if (prompt.includes("פציעה") || prompt.includes("שבר") || prompt.includes("חבלה")) {
      return "1. כיצד אירעה הפציעה?\n2. האם יש הגבלה בתנועה?\n3. האם יש נפיחות או שינוי צבע?\n4. האם יש דימום?\n5. מתי בדיוק אירעה הפציעה?";
    } else {
      return "1. מתי התחילו הסימפטומים?\n2. האם יש גורמים מקלים או מחמירים?\n3. האם יש סימפטומים נוספים?\n4. האם יש רקע רפואי קודם רלוונטי?\n5. האם נוטל/ת תרופות?";
    }
  },

  /**
   * מייצר סיכום גנרי במקרה של כישלון בתקשורת עם המודל
   * @private
   * @param {string} prompt - הפרומפט המקורי
   * @returns {string} - סיכום ברירת מחדל
   */
  _getFallbackSummary: function(prompt) {
    // חילוץ מידע בסיסי מהפרומפט
    const ageMatch = prompt.match(/גיל:\s*(\d+)/);
    const genderMatch = prompt.match(/מין:\s*(זכר|נקבה)/);
    const complaintMatch = prompt.match(/תלונה עיקרית:\s*([^\n]+)/);
    
    const age = ageMatch ? ageMatch[1] : "לא ידוע";
    const gender = genderMatch ? genderMatch[1] : "לא ידוע";
    const complaint = complaintMatch ? complaintMatch[1] : "לא ידוע";
    
    return `מטופל/ת בן/בת ${age}, ${gender}, מתלונן/ת על ${complaint}. הסימפטומים התחילו לאחרונה. לא ניתן היה לייצר סיכום מפורט עקב שגיאה טכנית. מומלץ לאסוף מידע נוסף.`;
  }
};

// ייצוא המודול
module.exports = LLMService;