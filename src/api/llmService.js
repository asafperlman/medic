// src/api/llmService.js

/**
 * מודול זה מספק שירותי תקשורת עם מודל שפה גדול (LLM)
 * כמו OpenAI GPT לצורך יצירת שאלות דינמיות וסיכומי אנמנזה
 */

// ייבוא הקונפיגורציה
const config = require('../../config');
const axios = require('axios');
const CacheManager = require('../utils/cacheManager');
// עדכון ייבוא OpenAI Client
const openaiClient = require('./openaiClient');

// יצירת מנהל מטמון 
const cache = new CacheManager({
  useDisk: true,
  diskCachePath: './cache/llm',
  defaultTTL: config.openai.cacheTTL || 86400000 // 24 שעות במילישניות
});

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

  /**
   * בדיקת התחברות לממשק ה-API של OpenAI
   * @returns {Promise<boolean>} - האם יש חיבור תקין
   */
  testApiConnection: async function() {
    try {
      console.log('בודק חיבור ל-OpenAI API...');
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        timeout: this.config.timeout
      });
      
      if (response.status === 200) {
        console.log('החיבור ל-OpenAI API תקין!');
        return true;
      } else {
        console.error('בעיה בחיבור ל-OpenAI API:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('שגיאה בבדיקת חיבור ל-API:', error.message);
      return false;
    }
  },

  /**
   * שליחת פרומפט למודל השפה
   * @param {string} prompt - הפרומפט לשליחה למודל
   * @param {object} options - אפשרויות שליחה נוספות
   * @returns {Promise<string>} - התשובה מהמודל
   */
  sendPrompt: async function(prompt, options = {}) {
    const cacheKey = prompt + JSON.stringify(options);
    
    // בדיקה במטמון
    if (this.config.useCache) {
      const cachedResponse = await cache.get(cacheKey);
      if (cachedResponse) {
        console.log("מחזיר תשובה מהמטמון");
        return cachedResponse;
      }
    }
    
    try {
      console.log(`שולח בקשה למודל שפה עם פרומפט: ${prompt.substring(0, 100)}...`);
      
      // הגדרות ברירת מחדל
      const finalOptions = {
        model: options.model || this.config.defaultModel,
        temperature: options.temperature !== undefined ? options.temperature : this.config.temperature,
        maxTokens: options.maxTokens || this.config.maxTokens,
        ...options
      };
      
      if (process.env.NODE_ENV === 'production' || process.env.USE_OPENAI_API === 'true') {
        // שליחת בקשה אמיתית ל-OpenAI API
        console.log('שולח בקשה אמיתית ל-OpenAI API');
        
        const response = await openaiClient.sendRequest(
          finalOptions.model,
          [{ role: 'user', content: prompt }],
          {
            temperature: finalOptions.temperature,
            maxTokens: finalOptions.max_tokens,
            timeout: this.config.timeout
          }
        );
        
        const content = response.choices[0].message.content;
        
        // שמירה במטמון
        if (this.config.useCache) {
          await cache.set(cacheKey, content, this.config.cacheTTL);
        }
        
        return content;
      } else {
        // במצב פיתוח - סימולציה
        console.log('מצב פיתוח: משתמש בסימולציה במקום קריאה אמיתית ל-API');
        let response = "";
        
        // בדיקה לפי סוג הפרומפט
        if (prompt.includes("שאלות המשך") || prompt.includes("שאלות נוספות")) {
          response = this._simulateFollowupQuestions(prompt);
        } else if (prompt.includes("סיכום") || prompt.includes("אנמנזה")) {
          response = this._simulateSummary(prompt);
        } else {
          // תשובה כללית
          response = "תשובה לפרומפט כללי. בסביבת ייצור, זו הייתה תשובה אמיתית מ-LLM.";
        }
        
        // שמירה במטמון
        if (this.config.useCache) {
          await cache.set(cacheKey, response, this.config.cacheTTL);
        }
        
        return response;
      }
    } catch (error) {
      console.error("שגיאה בשליחת בקשה למודל השפה:", error.message);
      
      // ניסיון להחזיר תשובה סטטית במקרה של שגיאה
      if (prompt.includes("שאלות")) {
        return this._getFallbackQuestions(prompt);
      } else if (prompt.includes("סיכום")) {
        return this._getFallbackSummary(prompt);
      } else {
        throw new Error(`שגיאה בתקשורת עם מודל השפה: ${error.message}`);
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
      /^\d+\.?\s+(.+)\?$/.test(line)
    ).map(line => {
      // הסר את המספור והשאר רק את תוכן השאלה
      return line.replace(/^\d+\.?\s+/, '');
    });
    
    // במקרה שלא הצלחנו לחלץ שאלות, החזר שאלה כללית
    return questions.length > 0 ? questions : ["האם יש מידע נוסף שחשוב לדעת?"];
  },
/**
 * סימולציה משופרת של שאלות המשך ממודל שפה
 * @private
 * @param {string} prompt - הפרומפט שנשלח
 * @returns {string} - שאלות מדומות
 */
_simulateEnhancedFollowupQuestions: function(prompt) {
  // חילוץ תלונה וסימפטומים לסימולציה חכמה יותר
  let complaint = "";
  if (prompt.includes("כאב ראש")) complaint = "כאב ראש";
  else if (prompt.includes("כאב בטן")) complaint = "כאב בטן";
  else if (prompt.includes("כאב גרון")) complaint = "כאב גרון";
  else if (prompt.includes("פציעה") || prompt.includes("שבר") || prompt.includes("חבלה")) 
    complaint = "פציעה";
  else if (prompt.includes("קוצר נשימה")) complaint = "קוצר נשימה";
  else complaint = "כללי";
  
  const hasSymptom = (keyword) => prompt.toLowerCase().includes(keyword.toLowerCase());
  
  // שאלות מותאמות לפי סוג התלונה
  switch (complaint) {
    case "כאב ראש":
      return `האם הכאב ממוקם בצד אחד של הראש או בשני הצדדים? [location]
האם יש הפרעות ראייה כמו טשטוש או כפל ראייה? [yesNo]
מה עוצמת הכאב בסולם מ-1 עד 10, כאשר 10 הוא הכאב החמור ביותר שחווית? [scale]
${hasSymptom('בחילה') ? "האם הבחילות מופיעות לפני הכאב, במקביל לו או אחריו? [multiline]" : "האם יש רגישות לאור, רעש או ריחות? [multiselect]"}
${hasSymptom('אור') ? "באיזה אופן הרגישות לאור משפיעה על פעילותך היומיומית? [multiline]" : "האם כאב הראש מעיר אותך משינה? [yesNo]"}`;
      
    case "כאב בטן":
      return `סמן את המיקום המדויק של הכאב בבטן. [location]
תאר בדיוק את אופי הכאב: האם הוא חד, מתמשך, צורב, לוחץ או פועם? [characteristic]
${hasSymptom('שלשול') ? "כמה יציאות יש לך ביום ומה המרקם והצבע שלהן? [multiline]" : "האם הבחנת בשינוי בהרגלי המעיים לאחרונה? [yesNo]"}
האם הכאב קשור לאכילה, ואם כן - תוך כמה זמן מהאכילה הוא מופיע? [multiline]
${hasSymptom('דם') ? "באיזו כמות מופיע הדם ומה הצבע שלו? [multiline]" : "האם יש סימפטומים נוספים כמו חום, צמרמורות או הזעה? [multiselect]"}`;
      
    case "כאב גרון":
      return `כמה זמן בדיוק נמשך כאב הגרון? ציין את מספר הימים. [duration]
דרג את עוצמת הכאב בגרון בסולם מ-1 עד 10. [scale]
${hasSymptom('בליעה') ? "איזה סוג מזון או שתייה מקשה יותר על הבליעה? [multiline]" : "האם יש קושי בבליעה? [yesNo]"}
${hasSymptom('חום') ? "מה הטמפרטורה המדויקת שנמדדה ומתי היא נמדדה לאחרונה? [multiline]" : "האם יש חום? [yesNo]"}
האם יש סימפטומים נוספים כמו נזלת, שיעול, או כאבי אוזניים? [multiselect]`;
      
    case "פציעה":
      return `תאר בדיוק כיצד אירעה הפציעה ובאיזה מנגנון. [multiline]
מה עוצמת הכאב בסולם מ-1 עד 10 והאם היא משתנה עם תנועה? [scale]
${hasSymptom('נפיחות') ? "האם הנפיחות גדלה מאז הפציעה ובאיזו מידה? [multiline]" : "האם יש נפיחות, שינוי צבע או עיוות באזור הפגוע? [multiselect]"}
האם אתה מסוגל להניע את האזור הפגוע ועד כמה התנועה מוגבלת? [multiline]
${hasSymptom('דפורמציה') ? "תאר בדיוק כיצד נראה העיוות באזור הפגוע. [multiline]" : "האם היה צליל של נקישה או קריעה בזמן הפציעה? [yesNo]"}`;
      
    case "קוצר נשימה":
      return `האם קוצר הנשימה מופיע במנוחה, במאמץ קל או רק במאמץ משמעותי? [multiselect]
מה עוצמת קוצר הנשימה בסולם מ-1 עד 10? [scale]
כמה זמן בדיוק נמשך קוצר הנשימה והאם הוא מתמשך או מופיע בהתקפים? [duration]
${hasSymptom('שיעול') ? "האם השיעול יבש או ליחתי, ומה צבע הליחה אם יש? [multiline]" : "האם יש שיעול כלשהו? [yesNo]"}
האם יש תחושת לחץ או כאב בחזה? אם כן, תאר את המיקום המדויק. [yesNo]`;
      
    default:
      return `כמה זמן נמשכים הסימפטומים הנוכחיים? [duration]
תאר את עוצמת הסימפטומים בסולם מ-1 עד 10, כאשר 10 הוא החמור ביותר. [scale]
האם יש גורמים ספציפיים שמחמירים או מקלים על הסימפטומים? [multiline]
האם חווית מצבים דומים בעבר? אם כן, תאר את אופן הטיפול. [yesNo]
אילו סימפטומים נוספים אתה חווה שלא הזכרת קודם? [multiline]`;
  }
},
  /**
   * יוצר פרומפט לסיכום האנמנזה - מעודכן לפרופיל רפואי
   * @param {object} patientRecord - רשומת המטופל
   * @returns {string} - הפרומפט המוכן לשליחה
   */
  createSummaryPrompt: function(patientRecord) {
    const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
    const genderText = gender === 'male' ? 'זכר' : 'נקבה';
    const smokingText = smoking === 'yes' ? 'מעשן/ת' : 'לא מעשן/ת';
    
    // יצירת פרומפט מובנה לסיכום אנמנזה
    let prompt = `אתה עוזר רפואי מקצועי ברמת חובש/פרמדיק. עליך ליצור סיכום אנמנזה רפואית מקיף ומקצועי בהתאם למידע הבא.
    
סיכום האנמנזה צריך להיות בפורמט מובנה ומקצועי, עם דגש על:
1. ציון פרטי פרופיל רפואי בתחילת הסיכום
2. תיאור דמוגרפי והתלונה העיקרית
3. פירוט המדדים החיוניים אם נמדדו
4. פירוט אופי ומאפייני התלונה העיקרית
5. ציון כל הממצאים השליליים המשמעותיים ("שולל X")
6. פירוט גורמים מחמירים ומקלים
7. ציון טיפולים שננקטו עד כה
8. דגש על דגלים אדומים אם קיימים

הפרטים הבסיסיים:
- גיל: ${age}
- מין: ${genderText}
- מעשן: ${smokingText}
- תלונה עיקרית: ${mainComplaint}
- פרופיל רפואי: ${profile}
- סעיפים רפואיים: ${medicalSections || "ללא סעיפים"}
- אלרגיות: ${allergies || "ללא אלרגיות ידועות"}
- תרופות קבועות: ${medications || "לא נוטל תרופות באופן קבוע"}

`;
    
    // הוספת מדדים חיוניים אם קיימים
    if (patientRecord.vitalSigns && Object.keys(patientRecord.vitalSigns).length > 0) {
      prompt += "מדדים חיוניים:\n";
      if (patientRecord.vitalSigns.pulse) prompt += `- דופק: ${patientRecord.vitalSigns.pulse}\n`;
      if (patientRecord.vitalSigns.bloodPressure) prompt += `- לחץ דם: ${patientRecord.vitalSigns.bloodPressure}\n`;
      if (patientRecord.vitalSigns.temperature) prompt += `- חום: ${patientRecord.vitalSigns.temperature}\n`;
      if (patientRecord.vitalSigns.saturation) prompt += `- סטורציה: ${patientRecord.vitalSigns.saturation}%\n`;
      if (patientRecord.vitalSigns.respiratoryRate) prompt += `- קצב נשימה: ${patientRecord.vitalSigns.respiratoryRate}\n`;
      prompt += "\n";
    }
    
    // הוספת תשובות לשאלות
    prompt += "תשובות המטופל לשאלות:\n";
    
    // תשובות לשאלות סטנדרטיות
    for (const [question, answer] of Object.entries(patientRecord.standardAnswers)) {
      if (answer && answer.trim()) {
        prompt += `- ${question}: ${answer}\n`;
      }
    }
    
    // תשובות לשאלות הדינמיות
    if (patientRecord.dynamicAnswers && Object.keys(patientRecord.dynamicAnswers).length > 0) {
      prompt += "\nתשובות לשאלות נוספות:\n";
      for (const [question, answer] of Object.entries(patientRecord.dynamicAnswers)) {
        if (answer && answer.trim()) {
          prompt += `- ${question}: ${answer}\n`;
        }
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
    const smokingMatch = prompt.match(/מעשן:\s*(כן|לא)/);
    
    const profile = profileMatch ? profileMatch[1] : "97";
    const sections = sectionsMatch ? sectionsMatch[1].trim() : "ללא סעיפים";
    const allergies = allergiesMatch ? allergiesMatch[1].trim() : "ללא אלרגיות ידועות";
    const medications = medicationsMatch ? medicationsMatch[1].trim() : "לא נוטל תרופות באופן קבוע";
    
    const age = ageMatch ? ageMatch[1] : "לא ידוע";
    const gender = genderMatch ? genderMatch[1] : "לא ידוע";
    const complaint = complaintMatch ? complaintMatch[1] : "לא ידוע";
    const smoking = smokingMatch ? smokingMatch[1] : "לא ידוע";
    
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
    
    summary += `מטופל/ת בגיל ${age}, ${gender}, ${smoking === 'כן' ? 'מעשן/ת' : 'לא מעשן/ת'}, מתלונן/ת על ${complaint}`;
    
    // מדדים חיוניים - חיפוש בפרומפט
    if (prompt.includes("מדדים חיוניים")) {
      summary += ".\n\nמדדים חיוניים: ";
      
      // חיפוש מדדים חיוניים בפרומפט
      const pulseMatch = prompt.match(/דופק:\s*(\d+)/);
      const bpMatch = prompt.match(/לחץ דם:\s*([^\n]+)/);
      const tempMatch = prompt.match(/חום:\s*([^\n]+)/);
      const satMatch = prompt.match(/סטורציה:\s*(\d+)/);
      const respMatch = prompt.match(/קצב נשימה:\s*(\d+)/);
      
      const vitalSignsArr = [];
      if (pulseMatch) vitalSignsArr.push(`דופק ${pulseMatch[1]} לדקה`);
      if (bpMatch) vitalSignsArr.push(`ל"ד ${bpMatch[1]} מ"מ כספית`);
      if (tempMatch) vitalSignsArr.push(`חום ${tempMatch[1]}°C`);
      if (satMatch) vitalSignsArr.push(`סטורציה ${satMatch[1]}%`);
      if (respMatch) vitalSignsArr.push(`קצב נשימות ${respMatch[1]} לדקה`);
      
      if (vitalSignsArr.length > 0) {
        summary += vitalSignsArr.join(', ') + '.\n\n';
      } else {
        summary += "לא נמדדו.\n\n";
      }
    } else {
      summary += '.\n\n';
    }
    
    // תיאור האנמנזה
    if (duration && duration !== "לא צוין") {
      summary += `התלונה החלה לפני ${duration}`;
    } else {
      summary += `התלונה המתוארת`;
    }
    
    if (location && location !== "") {
      summary += ` ומתמקדת ב${location}`;
    }
    
    // אופי התלונה לפי סוג התלונה
    if (complaint.includes("כאב")) {
      const intensity = prompt.includes("חזק") || prompt.includes("חמור") ? "חזק" : 
                        prompt.includes("בינוני") ? "בינוני" : "קל עד בינוני";
      
      const type = prompt.includes("חד") ? "חד" : 
                  prompt.includes("פועם") ? "פועם" : 
                  prompt.includes("לוחץ") ? "לוחץ" : 
                  prompt.includes("דוקר") ? "דוקר" : "מתמשך";
      
      summary += `. הכאב מתואר כ${type} בעוצמה ${intensity}`;
    } else if (complaint.includes("שיעול")) {
      const type = prompt.includes("יבש") ? "יבש" : 
                  prompt.includes("ליחה") ? "ליחתי" : "לא מאופיין";
      
      summary += `. השיעול מתואר כ${type}`;
    }
    
    summary += ".\n\n";

    // גורמים מחמירים ומקלים
    let hasFactors = false;
    if (prompt.includes("מחמיר") || prompt.includes("מקל")) {
      hasFactors = true;
      summary += "גורמים המשפיעים על המצב: ";
      
      if (prompt.includes("מחמיר")) {
        summary += "המצב מחמיר בעת ";
        if (prompt.includes("פעילות")) summary += "פעילות גופנית";
        else if (prompt.includes("אוכל")) summary += "אכילה";
        else if (prompt.includes("שכיבה")) summary += "שכיבה";
        else if (prompt.includes("מאמץ")) summary += "מאמץ";
        else summary += "פעילות מסוימת";
      }
      
      if (prompt.includes("מקל")) {
        if (prompt.includes("מחמיר")) summary += ", ומוקל בעת ";
        else summary += "המצב מוקל בעת ";
        
        if (prompt.includes("מנוחה")) summary += "מנוחה";
        else if (prompt.includes("תרופות")) summary += "נטילת תרופות";
        else if (prompt.includes("קור")) summary += "חשיפה לקור";
        else if (prompt.includes("חום")) summary += "חשיפה לחום";
        else summary += "פעולות מסוימות";
      }
      
      summary += ".\n\n";
    }
    
    // סימפטומים נלווים
    let hasSymptoms = false;
    summary += "סימפטומים נלווים: ";
    
    if (prompt.includes("חום") && !complaint.includes("חום")) {
      summary += "חום, "; hasSymptoms = true;
    }
    if (prompt.includes("סחרחורת") && !complaint.includes("סחרחורת")) {
      summary += "סחרחורת, "; hasSymptoms = true;
    }
    if (prompt.includes("בחילה") && !complaint.includes("בחילה")) {
      summary += "בחילה, "; hasSymptoms = true;
    }
    if (prompt.includes("הקאות") && !complaint.includes("הקאות")) {
      summary += "הקאות, "; hasSymptoms = true;
    }
    if (prompt.includes("שיעול") && !complaint.includes("שיעול")) {
      summary += "שיעול, "; hasSymptoms = true;
    }
    if (prompt.includes("חולשה")) {
      summary += "חולשה כללית, "; hasSymptoms = true;
    }
    
    // הסרת הפסיק האחרון והוספת נקודה
    if (hasSymptoms) {
      summary = summary.slice(0, -2) + ".\n\n";
    } else {
      summary += "ללא סימפטומים נלווים משמעותיים.\n\n";
    }
    
    // ממצאים שליליים
    let hasNegatives = false;
    summary += "ממצאים שליליים: ";
    
    // חיפוש ושליפת תשובות שליליות מהפרומפט
    const promptLines = prompt.split('\n');
    for (const line of promptLines) {
      if (line.includes(": לא") || line.includes("שולל")) {
        const match = line.match(/- ([^:]+):/);
        if (match) {
          summary += `שולל ${match[1].trim()}, `;
          hasNegatives = true;
        }
      }
    }
    
    if (hasNegatives) {
      summary = summary.slice(0, -2) + ".\n\n";
    } else {
      summary += "לא צוינו ממצאים שליליים משמעותיים.\n\n";
    }
    
    // טיפולים שננקטו
    let hasTreatments = false;
    if (prompt.includes("טיפול") || prompt.includes("תרופות") || prompt.includes("לקח")) {
      summary += "טיפולים שננקטו: ";
      
      if (prompt.includes("אקמול") || prompt.includes("paracetamol")) {
        summary += "אקמול, "; hasTreatments = true;
      }
      if (prompt.includes("אדוויל") || prompt.includes("נורופן") || prompt.includes("ibuprofen")) {
        summary += "משככי כאבים נוגדי דלקת, "; hasTreatments = true;
      }
      if (prompt.includes("אנטיביוטיקה")) {
        summary += "אנטיביוטיקה, "; hasTreatments = true;
      }
      if (prompt.includes("ריפוי עצמי") || prompt.includes("מנוחה") || prompt.includes("חימום")) {
        summary += "אמצעי ריפוי עצמי (מנוחה, חימום), "; hasTreatments = true;
      }
      
      if (hasTreatments) {
        summary = summary.slice(0, -2) + ".\n\n";
      } else {
        summary += "לא ננקטו טיפולים משמעותיים עד כה.\n\n";
      }
    }
  }}
  