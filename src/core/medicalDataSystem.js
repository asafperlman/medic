// מערכת איסוף נתונים רפואיים
// ===========================

/**
 * תכנון המערכת:
 * 
 * 1. הזנת מידע בסיסי:
 *    - פרטים דמוגרפיים (גיל, מין)
 *    - תלונה עיקרית
 * 
 * 2. שאלות סטנדרטיות:
 *    - מותאמות לתלונה העיקרית
 *    - נשמרות במסד נתונים
 * 
 * 3. שאלות דינמיות באמצעות LLM:
 *    - שליחת המידע הקיים למודל
 *    - קבלת שאלות המשך רלוונטיות
 * 
 * 4. יצירת סיכום ושליחה:
 *    - עיבוד כל הנתונים לכדי סיכום
 *    - שליחה לרופא/ה
 */

// נתחיל בהגדרת המבנה הבסיסי של המערכת
const MedicalDataSystem = {
  // מאגר תלונות נפוצות
  commonComplaints: [
    "כאב גרון",
    "כאב ראש",
    "כאב בטן",
    "כאב גב",
    "שיעול",
    "קוצר נשימה",
    "סחרחורת",
    "בחילה",
    "הקאות",
    "פריחה בעור",
    "חום",
    "חולשה כללית",
    "כאב אוזניים",
    "כאב חזה"
  ],

  // מאגר שאלות סטנדרטיות לפי תלונה עיקרית
  standardQuestions: {
    "כאב גרון": [
      "כמה זמן נמשך הכאב?",
      "האם יש חום?",
      "האם יש קושי בבליעה?",
      "האם יש צרידות?",
      "האם נוטל/ת תרופות כלשהן?"
    ],
    "כאב ראש": [
      "כמה זמן נמשך הכאב?",
      "היכן ממוקם הכאב?",
      "האם יש חום?",
      "האם יש בחילה או הקאות?",
      "האם הכאב מפריע לשינה?"
    ],
    "כאב בטן": [
      "כמה זמן נמשך הכאב?",
      "היכן ממוקם הכאב?",
      "האם יש שינויים ביציאות?",
      "האם יש הקאות?",
      "האם יש חום?"
    ],
    // ניתן להוסיף תלונות נוספות בהמשך
  },

  // פונקציה ליצירת רשומת מטופל חדשה
  createPatientRecord: function(age, gender, mainComplaint) {
    return {
      patientInfo: {
        age: age,
        gender: gender,
        mainComplaint: mainComplaint,
        timestamp: new Date().toISOString()
      },
      standardAnswers: {},
      dynamicAnswers: {},
      summary: ""
    };
  },

  // פונקציה לקבלת שאלות סטנדרטיות לפי תלונה
  getStandardQuestions: function(complaint) {
    return this.standardQuestions[complaint] || [];
  },

  // פונקציה לשמירת תשובות לשאלות סטנדרטיות
  saveStandardAnswers: function(patientRecord, answers) {
    patientRecord.standardAnswers = answers;
    return patientRecord;
  },

  // פונקציה לשליחת בקשה ל-LLM לקבלת שאלות דינמיות
  getDynamicQuestions: async function(patientRecord) {
    // כאן תהיה קריאה ל-API של מודל השפה (OpenAI לדוגמה)
    
    // הכנת הפרומפט עבור המודל
    const prompt = this.prepareLLMPrompt(patientRecord);
    
    // קריאה למודל (יש להחליף בקוד אמיתי לקריאה ל-API)
    const llmResponse = await this.callLLMApi(prompt);
    
    // עיבוד התשובה מהמודל וחילוץ השאלות
    const dynamicQuestions = this.parseLLMResponse(llmResponse);
    
    return dynamicQuestions;
  },

  // פונקציה להכנת הפרומפט עבור מודל השפה
  prepareLLMPrompt: function(patientRecord) {
    const { age, gender, mainComplaint } = patientRecord.patientInfo;
    let prompt = `מטופל בן ${age}, ${gender === 'male' ? 'זכר' : 'נקבה'}, מתלונן על ${mainComplaint}.\n`;
    
    prompt += "מידע נוסף שנאסף:\n";
    
    // הוספת התשובות לשאלות הסטנדרטיות
    for (const [question, answer] of Object.entries(patientRecord.standardAnswers)) {
      prompt += `- ${question} ${answer}\n`;
    }
    
    prompt += "\nאילו שאלות נוספות כדאי לשאול את המטופל כדי לקבל תמונה רפואית מלאה יותר? הצע 3-5 שאלות ספציפיות שיעזרו לרופא לאבחן את המצב.";
    
    return prompt;
  },

  // פונקציה לקריאה ל-API של מודל השפה
  callLLMApi: async function(prompt) {
    // כאן יהיה קוד שקורא ל-API של מודל השפה כמו OpenAI
    // לדוגמה, שימוש ב-fetch לשליחת בקשה:
    
    /*
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'אתה עוזר רפואי מקצועי שמייצר שאלות המשך רלוונטיות למצב רפואי.' },
          { role: 'user', content: prompt }
        ]
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
    */
    
    // כרגע נחזיר דוגמה סטטית לצורך הדגמה
    if (prompt.includes("כאב גרון")) {
      return `1. האם יש נפיחות בצוואר?
2. האם יש הפרשות מהגרון?
3. האם יש קושי בנשימה?
4. האם יש כאבי אוזניים?
5. האם היה מגע עם אנשים חולים לאחרונה?`;
    } else {
      return `1. שאלה דינמית 1?
2. שאלה דינמית 2?
3. שאלה דינמית 3?`;
    }
  },

  // פונקציה לעיבוד התשובה מהמודל וחילוץ השאלות
  parseLLMResponse: function(llmResponse) {
    // פשוט נפצל לפי שורות ונסנן שורות ריקות
    return llmResponse.split('\n').filter(line => line.trim() !== '');
  },

  // פונקציה לשמירת תשובות לשאלות דינמיות
  saveDynamicAnswers: function(patientRecord, answers) {
    patientRecord.dynamicAnswers = answers;
    return patientRecord;
  },

  // פונקציה ליצירת סיכום אנמנזה
  generateSummary: async function(patientRecord) {
    // כאן ניתן לבחור באחת משתי גישות:
    // 1. ליצור סיכום באופן פרוגרמטי על סמך הנתונים
    // 2. לשלוח את כל הנתונים למודל השפה ולבקש ממנו ליצור סיכום
    
    // נדגים את הגישה השנייה:
    const { age, gender, mainComplaint } = patientRecord.patientInfo;
    let prompt = `צור סיכום רפואי קצר ומקצועי על סמך המידע הבא:
- מטופל בן ${age}, ${gender === 'male' ? 'זכר' : 'נקבה'}, מתלונן על ${mainComplaint}.
`;

    // הוספת התשובות לשאלות הסטנדרטיות
    prompt += "תשובות לשאלות סטנדרטיות:\n";
    for (const [question, answer] of Object.entries(patientRecord.standardAnswers)) {
      prompt += `- ${question} ${answer}\n`;
    }
    
    // הוספת התשובות לשאלות הדינמיות
    prompt += "תשובות לשאלות נוספות:\n";
    for (const [question, answer] of Object.entries(patientRecord.dynamicAnswers)) {
      prompt += `- ${question} ${answer}\n`;
    }
    
    prompt += "\nהסיכום צריך להיות תמציתי, עובדתי, ומכיל את כל המידע הרלוונטי.";
    
    // קריאה למודל (יש להחליף בקוד אמיתי לקריאה ל-API)
    const summary = await this.callLLMApiForSummary(prompt);
    
    patientRecord.summary = summary;
    return patientRecord;
  },

  // פונקציה לקריאה ל-API של מודל השפה עבור יצירת סיכום
  callLLMApiForSummary: async function(prompt) {
    // דומה לפונקציה callLLMApi, אבל עם פרומפט ספציפי ליצירת סיכום
    // כרגע נחזיר דוגמה סטטית
    return "מטופל בן 21, זכר, מתלונן על כאב גרון שנמשך יומיים, עם קושי בבליעה ונפיחות בצוואר, ללא חום וללא שיעול. המטופל לא נוטל תרופות כלשהן והיה במגע עם אדם חולה לפני כשלושה ימים.";
  },

  // פונקציה לשליחת הסיכום לרופא/ה
  sendSummaryToDoctor: async function(patientRecord, doctorEmail) {
    // כאן יהיה קוד שישלח את הסיכום לרופא, למשל באמצעות API של שירות מיילים
    // או שמירה במסד נתונים שהרופא/ה יכול/ה לגשת אליו
    
    console.log(`שולח סיכום לרופא/ה בכתובת ${doctorEmail}`);
    console.log(`סיכום: ${patientRecord.summary}`);
    
    // מחזיר אישור שליחה (יש להחליף בקוד אמיתי)
    return {
      success: true,
      timestamp: new Date().toISOString(),
      message: `הסיכום נשלח בהצלחה לרופא/ה ${doctorEmail}`
    };
  }
};

// דוגמה לשימוש במערכת
async function demoMedicalSystem() {
  // שלב 1: יצירת רשומת מטופל חדשה
  let patientRecord = MedicalDataSystem.createPatientRecord(21, 'male', 'כאב גרון');
  console.log("נוצרה רשומת מטופל:", patientRecord);
  
  // שלב 2: קבלת שאלות סטנדרטיות
  const standardQuestions = MedicalDataSystem.getStandardQuestions(patientRecord.patientInfo.mainComplaint);
  console.log("שאלות סטנדרטיות:", standardQuestions);
  
  // שלב 3: שמירת תשובות לשאלות סטנדרטיות
  const standardAnswers = {
    "כמה זמן נמשך הכאב?": "יומיים",
    "האם יש חום?": "לא",
    "האם יש קושי בבליעה?": "כן",
    "האם יש צרידות?": "לא",
    "האם נוטל/ת תרופות כלשהן?": "לא"
  };
  patientRecord = MedicalDataSystem.saveStandardAnswers(patientRecord, standardAnswers);
  console.log("נשמרו תשובות לשאלות סטנדרטיות:", patientRecord);
  
  // שלב 4: קבלת שאלות דינמיות מה-LLM
  const dynamicQuestions = await MedicalDataSystem.getDynamicQuestions(patientRecord);
  console.log("שאלות דינמיות:", dynamicQuestions);
  
  // שלב 5: שמירת תשובות לשאלות דינמיות
  const dynamicAnswers = {
    "האם יש נפיחות בצוואר?": "כן",
    "האם יש הפרשות מהגרון?": "לא",
    "האם יש קושי בנשימה?": "לא",
    "האם יש כאבי אוזניים?": "לא",
    "האם היה מגע עם אנשים חולים לאחרונה?": "כן, לפני כשלושה ימים"
  };
  patientRecord = MedicalDataSystem.saveDynamicAnswers(patientRecord, dynamicAnswers);
  console.log("נשמרו תשובות לשאלות דינמיות:", patientRecord);
  
  // שלב 6: יצירת סיכום
  patientRecord = await MedicalDataSystem.generateSummary(patientRecord);
  console.log("נוצר סיכום:", patientRecord.summary);
  
  // שלב 7: שליחת הסיכום לרופא/ה
  const sendResult = await MedicalDataSystem.sendSummaryToDoctor(patientRecord, "doctor@example.com");
  console.log("תוצאת שליחה:", sendResult);
}

// הפעלת הדוגמה
// demoMedicalSystem().catch(console.error);
// בסוף הקובץ:
module.exports = MedicalDataSystem;