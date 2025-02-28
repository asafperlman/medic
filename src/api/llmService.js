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
   * יוצר פרומפט לקבלת שאלות המשך - מעודכן לכלול פרטי פרופיל
   * @param {object} patientRecord - רשומת המטופל
   * @returns {string} - הפרומפט המוכן לשליחה
   */
  createFollowupQuestionsPrompt: function(patientRecord) {
    const { age, gender, mainComplaint, profile, medicalSections, allergies, medications } = patientRecord.patientInfo;
    const genderText = gender === 'male' ? 'זכר' : 'נקבה';
    
    // יצירת פרומפט מובנה לשאלות המשך
    let prompt = `אתה עוזר רפואי מקצועי ברמת חובש. עליך ליצור שאלות המשך מעמיקות למטופל.

הפרטים הבסיסיים:
- גיל: ${age}
- מין: ${genderText}
- תלונה עיקרית: ${mainComplaint}
- פרופיל רפואי: ${profile}
- סעיפים רפואיים: ${medicalSections || "ללא סעיפים"}
- אלרגיות: ${allergies || "ללא אלרגיות ידועות"}
- תרופות קבועות: ${medications || "לא נוטל תרופות באופן קבוע"}

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
בהתבסס על המידע הזה, אנא צור 5 שאלות המשך מעמיקות שיעזרו לקבל תמונה רפואית מלאה יותר. 
השאלות צריכות להיות ספציפיות, תוך התמקדות באפשרויות אבחנתיות עיקריות ודגלים אדומים אפשריים
בהתאם למדריך הטיפול הרפואי של חובשים.
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
   * יוצר פרומפט לסיכום האנמנזה - מעודכן לפרופיל רפואי
   * @param {object} patientRecord - רשומת המטופל
   * @returns {string} - הפרומפט המוכן לשליחה
   */
  createSummaryPrompt: function(patientRecord) {
    const { age, gender, mainComplaint, profile, medicalSections, allergies, medications } = patientRecord.patientInfo;
    const genderText = gender === 'male' ? 'זכר' : 'נקבה';
    
    // יצירת פרומפט מובנה לסיכום אנמנזה
    let prompt = `אתה חובש מקצועי שצריך לכתוב סיכום אנמנזה רפואית עבור רופא. כתוב סיכום מקצועי, מפורט ומסודר בהתבסס על המידע הבא:

הפרטים הבסיסיים:
- גיל: ${age}
- מין: ${genderText}
- תלונה עיקרית: ${mainComplaint}
- פרופיל רפואי: ${profile}
- סעיפים רפואיים: ${medicalSections || "ללא סעיפים"}
- אלרגיות: ${allergies || "ללא אלרגיות ידועות"}
- תרופות קבועות: ${medications || "לא נוטל תרופות באופן קבוע"}

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
1. שורה ראשונה: פרטי פרופיל רפואי בפורמט "פרופיל [מספר פרופיל], [סעיפים], [אלרגיות], [תרופות קבועות]."
2. פסקה שנייה: המטופל בן/בת [גיל], [מין], מתלונן/ת על [תלונה עיקרית] ותיאור מפורט של מאפייני התלונה.
3. פסקה שלישית: גורמים מחמירים ומקלים (אם יש).
4. פסקה רביעית: סימפטומים נלווים ומידע נוסף משמעותי.
5. פסקה חמישית: טיפולים שננקטו עד כה.
6. פסקה שישית (אם רלוונטי): דגלים אדומים או ממצאים מדאיגים שדורשים התייחסות דחופה.

הסיכום צריך להיות מפורט, בהיר ומקצועי, כמו אנמנזה רפואית מלאה.
פתח את הסיכום תמיד עם שורת הפרופיל הרפואי כפי שצוין לעיל.
אם ישנם דגלים אדומים, סמן אותם בבירור בפסקה המתאימה במילים "דגלים אדומים: ".`;
    
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
   * סימולציה של שאלות המשך ממודל שפה (לסביבת פיתוח) - מעודכנת
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
    
    // זיהוי תשובות קודמות שניתנו
    const hasSymptom = (keyword) => prompt.toLowerCase().includes(keyword.toLowerCase());
    
    // שאלות לפי סוג התלונה
    switch (complaint) {
      case "כאב ראש":
        return `1. האם יש הפרעות ראייה כמו טשטוש או כפל ראייה?
2. האם הכאב מתגבר בשכיבה או התכופפות?
3. האם יש תחושה של לחץ מאחורי העיניים?
4. ${hasSymptom('הקאות') ? "האם ההקאות התגברו בשעות האחרונות?" : "האם יש רגישות יתר לריחות במהלך הכאב?"}
5. ${hasSymptom('אור') ? "האם הרגישות לאור מופיעה רק בזמן הכאב או גם לפני?" : "האם יש רגישות לאור או רעש?"}`;
      
      case "כאב בטן":
        return `1. האם אכלת משהו חדש או חריג לאחרונה?
2. האם יש תחושת ׳מלאות׳ או כבדות בבטן?
3. ${hasSymptom('שלשול') ? "כמה יציאות יש ביום וכיצד הן נראות?" : "האם יש שינוי בתדירות או בצורת היציאות?"}
4. ${hasSymptom('דם') ? "האם ראית דם ביציאות או בהקאות?" : "האם הבחנת בדם ביציאות או שהיציאות כהות באופן חריג?"}
5. ${hasSymptom('הקאות') ? "האם ההקאות מכילות מזון שאכלת לאחרונה או נוזל אחר?" : "האם יש בחילות או הקאות?"}`;
      
      case "כאב גרון":
        return `1. האם אתה מרגיש גוש או נפיחות בגרון?
2. האם הקושי בבליעה מתייחס לנוזלים, מוצקים או שניהם?
3. ${hasSymptom('חום') ? "האם החום נמשך יותר מ-3 ימים?" : "האם יש תחושת חמימות או חום?"}
4. ${hasSymptom('נקודות') ? "האם הנקודות הלבנות בגרון גדלות או משתנות?" : "האם הבחנת בנקודות לבנות או כתמים בגרון?"}
5. ${hasSymptom('בלוטות') ? "האם הבלוטות הנפוחות רגישות למגע?" : "האם יש נפיחות בבלוטות הצוואר?"}`;
      
      case "פציעה":
        return `1. האם יש בשבר החשוד חדירה של העצם דרך העור?
2. האם יכול/ה להזיז את האצבעות/כף הרגל מתחת לאזור הפגוע?
3. ${hasSymptom('נפיחות') ? "האם הנפיחות גוברת או יציבה?" : "האם יש נפיחות באזור?"}
4. ${hasSymptom('דפורמציה') ? "האם העיוות באזור השבר בולט או מוסתר?" : "האם יש עיוות נראה לעין באזור?"}
5. ${hasSymptom('תנועה') ? "האם התנועה באזור הפגוע גורמת לכאב חד?" : "האם יש הגבלה בתנועה?"}`;
      
      case "קוצר נשימה":
        return `1. האם קוצר הנשימה מופיע במנוחה או רק במאמץ?
2. האם יש כאב בחזה או דפיקות לב חזקות?
3. ${hasSymptom('שיעול') ? "האם השיעול מלווה בליחה, ומה צבעה?" : "האם יש שיעול?"}
4. ${hasSymptom('כחלון') ? "האם הכחלון נראה בשפתיים או בקצות האצבעות?" : "האם יש כחלון (שפתיים או ציפורניים כחולות)?"}
5. ${hasSymptom('תרופות') ? "האם הטיפול התרופתי שאתה נוטל משפיע על הנשימה?" : "האם אתה נוטל תרופות לריאות או ללב?"}`;
      
      default:
        return `1. האם יש שינויים ברמת האנרגיה או העייפות שלך לאחרונה?
2. האם יש שינויים בהרגלי האכילה או השתייה שלך?
3. האם יש שינויים בהרגלי השינה שלך לאחרונה?
4. האם חווית מצבים דומים בעבר? אם כן, כיצד טופלו?
5. האם יש משהו נוסף שחשוב שנדע על מצבך הבריאותי?`;
    }
  },

  /**
   * סימולציה של סיכום אנמנזה ממודל שפה (לסביבת פיתוח) - מעודכן לפורמט פרופיל
   * @private
   * @param {string} prompt - הפרומפט שנשלח
   * @returns {string} - סיכום מדומה
   */
  _simulateSummary: function(prompt) {
    // חילוץ פרטים בסיסיים מהפרומפט
    const profileMatch = prompt.match(/פרופיל רפואי:\s*(\d+)/);
    const sectionsMatch = prompt.match(/סעיפים רפואיים:\s*([^\n]+)/);
    const allergiesMatch = prompt.match(/אלרגיות:\s*([^\n]+)/);
    const medicationsMatch = prompt.match(/תרופות קבועות:\s*([^\n]+)/);
    
    const ageMatch = prompt.match(/גיל:\s*(\d+)/);
    const genderMatch = prompt.match(/מין:\s*(זכר|נקבה)/);
    const complaintMatch = prompt.match(/תלונה עיקרית:\s*([^\n]+)/);
    
    const profile = profileMatch ? profileMatch[1] : "97";
    const sections = sectionsMatch ? sectionsMatch[1].trim() : "ללא סעיפים";
    const allergies = allergiesMatch ? allergiesMatch[1].trim() : "ללא אלרגיות ידועות";
    const medications = medicationsMatch ? medicationsMatch[1].trim() : "לא נוטל תרופות באופן קבוע";
    
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
    
    // יצירת סיכום משופר בפורמט החדש
    let summary = `פרופיל ${profile}, ${sections}, ${allergies}, ${medications}.\n\n`;
    
    summary += `מטופל/ת בגיל ${age}, ${gender}, מתלונן/ת על ${complaint}`;
    
    if (duration !== "לא צוין") {
      summary += ` המתחיל/ה לפני ${duration}`;
    }
    
    if (location) {
      summary += ` ומתמקם ב${location}`;
    }
    
    // פרטים נוספים כלליים
    if (complaint.includes("כאב")) {
      summary += `. הכאב מתואר כ${prompt.includes("חד") ? "חד" : prompt.includes("מתמשך") ? "מתמשך" : "בינוני בעוצמתו"}`;
    }
    
    summary += ".\n\n";
    
    // גורמים מחמירים ומקלים
    if (prompt.includes("מחמיר") || prompt.includes("מקל")) {
      summary += "גורמים המשפיעים על המצב: ";
      
      if (prompt.includes("מחמיר")) {
        summary += "המצב מחמיר בעת ";
        if (prompt.includes("פעילות")) summary += "פעילות גופנית";
        else if (prompt.includes("אוכל")) summary += "אכילה";
        else if (prompt.includes("שכיבה")) summary += "שכיבה";
        else summary += "פעילות מסוימת";
      }
      
      if (prompt.includes("מקל")) {
        summary += ", ומוקל בעת ";
        if (prompt.includes("מנוחה")) summary += "מנוחה";
        else if (prompt.includes("תרופות")) summary += "נטילת תרופות";
        else summary += "פעולות מסוימות";
      }
      
      summary += ".\n\n";
    }
    
    // סימפטומים נלווים
    summary += "סימפטומים נלווים: ";
    if (prompt.includes("חום")) {
      summary += "חום, ";
    }
    if (prompt.includes("סחרחורת")) {
      summary += "סחרחורת, ";
    }
    if (prompt.includes("בחילה")) {
      summary += "בחילה, ";
    }
    if (prompt.includes("הקאות")) {
      summary += "הקאות, ";
    }
    
    // הסרת הפסיק האחרון והוספת נקודה
    if (summary.endsWith(", ")) {
      summary = summary.slice(0, -2) + ".\n\n";
    } else if (summary === "סימפטומים נלווים: ") {
      summary += "ללא סימפטומים נלווים משמעותיים.\n\n";
    }
    
    // פרטים על טיפולים קודמים
    if (prompt.includes("טיפול") || prompt.includes("תרופות")) {
      summary += "טיפולים שננקטו: ";
      
      if (prompt.includes("אקמול") || prompt.includes("paracetamol")) {
        summary += "אקמול, ";
      }
      if (prompt.includes("אדוויל") || prompt.includes("נורופן") || prompt.includes("ibuprofen")) {
        summary += "משככי כאבים נוגדי דלקת, ";
      }
      if (prompt.includes("אנטיביוטיקה")) {
        summary += "אנטיביוטיקה, ";
      }
      
      // הסרת הפסיק האחרון והוספת נקודה
      if (summary.endsWith(", ")) {
        summary = summary.slice(0, -2) + ".\n\n";
      } else if (summary === "טיפולים שננקטו: ") {
        summary += "לא ננקטו טיפולים משמעותיים עד כה.\n\n";
      }
    }
    
    // דגלים אדומים
    if (hasRedFlags) {
      summary += "דגלים אדומים: ";
      
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
      return "1. האם יש הפרעות ראייה כמו טשטוש או כפל ראייה?\n2. האם הכאב מתגבר בשכיבה או התכופפות?\n3. האם יש תחושה של לחץ מאחורי העיניים?\n4. האם זהו כאב ראש חזק יותר מכאבים קודמים?\n5. האם יש רגישות לאור או רעש?";
    } else if (prompt.includes("כאב בטן")) {
      return "1. האם אכלת משהו חדש או חריג לאחרונה?\n2. האם יש תחושת ׳מלאות׳ או כבדות בבטן?\n3. האם הכאב מפריע לשינה?\n4. האם יש שינוי בתדירות או בצורת היציאות?\n5. האם יש בחילות או הקאות?";
    } else if (prompt.includes("פציעה") || prompt.includes("שבר") || prompt.includes("חבלה")) {
      return "1. האם יש בשבר החשוד חדירה של העצם דרך העור?\n2. האם יכול/ה להזיז את האצבעות/כף הרגל מתחת לאזור הפגוע?\n3. האם יש סימנים של פגיעה בכלי דם (חיוורון, קור, דופק חלש)?\n4. האם יש נפיחות באזור?\n5. האם יש הגבלה בתנועה?";
    } else {
      return "1. האם יש שינויים ברמת האנרגיה או העייפות שלך לאחרונה?\n2. האם יש שינויים בהרגלי האכילה או השתייה שלך?\n3. האם יש שינויים בהרגלי השינה שלך לאחרונה?\n4. האם חווית מצבים דומים בעבר? אם כן, כיצד טופלו?\n5. האם יש משהו נוסף שחשוב שנדע על מצבך הבריאותי?";
    }
  },

  /**
   * מייצר סיכום גנרי במקרה של כישלון בתקשורת עם המודל - מעודכן לפורמט פרופיל
   * @private
   * @param {string} prompt - הפרומפט המקורי
   * @returns {string} - סיכום ברירת מחדל
   */
  _getFallbackSummary: function(prompt) {
    // חילוץ מידע בסיסי מהפרומפט
    const profileMatch = prompt.match(/פרופיל רפואי:\s*(\d+)/);
    const sectionsMatch = prompt.match(/סעיפים רפואיים:\s*([^\n]+)/);
    const allergiesMatch = prompt.match(/אלרגיות:\s*([^\n]+)/);
    const medicationsMatch = prompt.match(/תרופות קבועות:\s*([^\n]+)/);
    
    const ageMatch = prompt.match(/גיל:\s*(\d+)/);
    const genderMatch = prompt.match(/מין:\s*(זכר|נקבה)/);
    const complaintMatch = prompt.match(/תלונה עיקרית:\s*([^\n]+)/);
    
    const profile = profileMatch ? profileMatch[1] : "97";
    const sections = sectionsMatch ? sectionsMatch[1].trim() : "ללא סעיפים";
    const allergies = allergiesMatch ? allergiesMatch[1].trim() : "ללא אלרגיות ידועות";
    const medications = medicationsMatch ? medicationsMatch[1].trim() : "לא נוטל תרופות באופן קבוע";
    
    const age = ageMatch ? ageMatch[1] : "לא ידוע";
    const gender = genderMatch ? genderMatch[1] : "לא ידוע";
    const complaint = complaintMatch ? complaintMatch[1] : "לא ידוע";
    
    return `פרופיל ${profile}, ${sections}, ${allergies}, ${medications}.\n\nמטופל/ת בגיל ${age}, ${gender}, מתלונן/ת על ${complaint}. הסימפטומים התחילו לאחרונה. לא ניתן היה ליצור סיכום מפורט עקב שגיאה טכנית. מומלץ לאסוף מידע נוסף.`;
  }
};

// ייצוא המודול
module.exports = LLMService;