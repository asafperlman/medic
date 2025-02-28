// src/core/medicalDataSystem.js

/**
 * מערכת איסוף נתונים רפואיים
 * מודול זה מכיל את הפונקציות העיקריות לניהול רשומות מטופלים,
 * איסוף נתונים, ויצירת סיכומים
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
    "כאב חזה",
    // פציעות נוספות
    "שבר", 
    "נקע",
    "פציעת ספורט",
    "חתך", 
    "שריטה",
    "כוויה",
    "תאונת דרכים",
    "נפילה מגובה",
    "פציעת ראש",
    "דימום",
    "חבלה",
    "מכה",
    "עקיצה",
    "הכשת נחש",
    "הכשת עקרב",
    "הרעלה",
    "התייבשות",
    "היפותרמיה",
    "היפרתרמיה",
    "טביעה",
    "התקף חרדה",
    "התקף אפילפסיה",
    "פגיעה בעין",
    "גוף זר בעין",
    "פגיעה בשן",
    "דלקת עיניים",
    "דלקת אוזניים",
    "אחר"
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
    "כאב גב": [
      "כמה זמן נמשך הכאב?",
      "היכן ממוקם הכאב בדיוק?",
      "האם הכאב מקרין לרגליים?",
      "האם יש חולשה או נימול ברגליים?",
      "האם הכאב משתנה עם תנועה או מנוחה?"
    ],
    "שיעול": [
      "כמה זמן נמשך השיעול?",
      "האם השיעול יבש או עם ליחה?",
      "מה צבע הליחה אם יש?",
      "האם יש קוצר נשימה?",
      "האם היית במגע עם אנשים חולים?"
    ],
    "קוצר נשימה": [
      "מתי התחיל קוצר הנשימה?",
      "האם זה קורה במנוחה או במאמץ?",
      "האם יש כאב בחזה?",
      "האם יש שיעול או ליחה?",
      "האם אתה סובל ממחלת ריאות או לב?"
    ],
    "סחרחורת": [
      "מתי התחילה הסחרחורת?",
      "האם יש תחושה שהחדר מסתובב?",
      "האם איבדת שיווי משקל או נפלת?",
      "האם הרגשת בחילה?",
      "האם יש בעיות שמיעה או צפצופים באוזניים?"
    ],
    "חום": [
      "מה גובה החום שנמדד?",
      "כמה זמן יש חום?",
      "האם יש סימפטומים נוספים?",
      "האם נטלת תרופות להורדת חום?",
      "האם ידוע על חשיפה למחלה מדבקת?"
    ],
    "שבר": [
      "היכן ממוקם הכאב?",
      "האם מרגיש/ה עיוות או עקמומיות באזור?",
      "האם יש נפיחות באזור?",
      "האם יש שינוי צבע (שטף דם)?",
      "האם יש הגבלה בתנועה?",
      "מתי ואיך אירעה הפציעה?"
    ],
    "נקע": [
      "באיזה מפרק מדובר?",
      "האם המפרק נראה עקום או שונה מהרגיל?",
      "האם יש כאב חזק בתנועה?",
      "האם יש נפיחות באזור?",
      "מתי ואיך אירעה הפציעה?"
    ],
    "חתך": [
      "היכן נמצא החתך?",
      "מה גודל החתך (אורך ועומק)?",
      "האם הדימום נמשך?",
      "כיצד נגרם החתך?",
      "מתי אירעה הפציעה?",
      "האם הפצע נקי או שיש בו גופים זרים?"
    ],
    "כוויה": [
      "היכן נמצאת הכוויה?",
      "מה גודל הכוויה (אחוז משטח הגוף)?",
      "כיצד נגרמה הכוויה (חום, כימיקלים, חשמל)?",
      "האם יש שלפוחיות?",
      "האם האזור אדום, לבן או שחור?",
      "האם ננקטו פעולות עזרה ראשונה?"
    ],
    "פציעת ראש": [
      "האם היה אובדן הכרה?",
      "האם יש בחילה או הקאות?",
      "האם יש סחרחורת?",
      "האם יש אי-שקט או בלבול?",
      "האם זרם דם או נוזל שקוף מהאף או האוזניים?",
      "האם יש כאב ראש חזק?",
      "האם יש טשטוש ראייה?"
    ],
    "דימום": [
      "מהיכן מגיע הדימום?",
      "מה צבע הדם (אדום בהיר או כהה)?",
      "האם הדימום נמשך כעת?",
      "כמה זמן נמשך הדימום?",
      "האם המטופל חיוור או מסוחרר?",
      "האם ננקטו פעולות עזרה ראשונה?"
    ],
    "עקיצה": [
      "מה גרם לעקיצה (דבורה, צרעה, יתוש, אחר)?",
      "האם ידועה אלרגיה לעקיצות?",
      "האם יש נפיחות משמעותית באזור?",
      "האם יש קושי בנשימה או תחושת לחץ בחזה?",
      "האם הוצא העוקץ (אם רלוונטי)?"
    ],
    "הכשת נחש": [
      "מתי התרחשה ההכשה?",
      "האם זוהה סוג הנחש?",
      "היכן נמצאת ההכשה?",
      "האם יש סימני שיניים או נקודות דימום?",
      "האם יש נפיחות או שינוי צבע באזור?",
      "האם יש הקאות, סחרחורת או הזעה מוגברת?",
      "האם ננקטו פעולות עזרה ראשונה?"
    ],
    "התקף חרדה": [
      "האם יש קושי בנשימה או תחושת מחנק?",
      "האם יש לחץ או כאב בחזה?",
      "האם יש דופק מהיר או הרגשת דפיקות לב?",
      "האם יש רעד, הזעה או צמרמורות?",
      "האם יש סחרחורת או תחושת עילפון?",
      "האם יש תחושת ניתוק מהמציאות?",
      "האם היו התקפים דומים בעבר?"
    ],
    "פציעת ספורט": [
      "איזה ספורט גרם לפציעה?",
      "באיזה חלק בגוף הפציעה?",
      "האם שמעת קול נקישה או קרע?",
      "האם יש נפיחות באזור הפציעה?",
      "האם יכול/ה להזיז את האזור הפגוע?",
      "האם ניסית טיפול עזרה ראשונה (קרח, מנוחה וכו')?"
    ],
    "תאונת דרכים": [
      "האם היית נהג, נוסע או הולך רגל?",
      "האם היית חגור?",
      "האם נפגעת מכיוון מסוים?",
      "האם איבדת הכרה?",
      "האם יש כאבים ספציפיים?",
      "האם קיבלת טיפול בזירת התאונה?"
    ],
    "נפילה מגובה": [
      "מאיזה גובה בערך נפלת?",
      "על איזה משטח נפלת?",
      "האם נחבטת בראש?",
      "האם יש כאבים ספציפיים?",
      "האם יש הגבלות תנועה?"
    ],
    "חבלה": [
      "איך נגרמה החבלה?",
      "האם יש נפיחות או שטף דם?",
      "האם יש הגבלת תנועה?",
      "האם טיפלת בחבלה בעצמך?",
      "האם החבלה החמירה מאז שקרתה?"
    ],
    // תבנית שאלות כללית לכל סוגי הפציעות/מחלות שלא הוגדרו ספציפית
    "אחר": [
      "מתי התחילו הסימפטומים?",
      "האם הסימפטומים מחמירים או משתפרים?",
      "האם יש גורמים שמחמירים את המצב?",
      "האם ניסית טיפול כלשהו עד כה?",
      "האם יש רקע רפואי שיכול להיות קשור למצב הנוכחי?"
    ]
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
    // אם יש שאלות מוגדרות לתלונה, החזר אותן
    if (this.standardQuestions[complaint]) {
      return this.standardQuestions[complaint];
    }
    
    // אחרת החזר שאלות כלליות
    return this.standardQuestions["אחר"] || [
      "מתי התחילו הסימפטומים?",
      "האם הסימפטומים מחמירים או משתפרים?",
      "האם יש גורמים שמחמירים את המצב?",
      "האם ניסית טיפול כלשהו עד כה?",
      "האם יש רקע רפואי שיכול להיות קשור למצב הנוכחי?"
    ];
  },

  // פונקציה לשמירת תשובות לשאלות סטנדרטיות
  saveStandardAnswers: function(patientRecord, answers) {
    patientRecord.standardAnswers = answers;
    return patientRecord;
  },

  // פונקציה לשליחת בקשה ל-LLM לקבלת שאלות דינמיות
  getDynamicQuestions: async function(patientRecord) {
    try {
      // הכנת הפרומפט עבור המודל
      const prompt = `התלונה העיקרית היא: ${patientRecord.patientInfo.mainComplaint}. 
מידע נוסף: גיל ${patientRecord.patientInfo.age}, מין ${patientRecord.patientInfo.gender === 'male' ? 'זכר' : 'נקבה'}.
תשובות לשאלות ראשוניות:
${Object.entries(patientRecord.standardAnswers).map(([q, a]) => `- ${q} ${a}`).join('\n')}

אנא הצע 5 שאלות המשך רלוונטיות ומקצועיות שיעזרו לחובש לקבל תמונה מלאה יותר של המצב.`;

      // במצב פיתוח, נחזיר שאלות דמה
      const demoQuestions = this._getDemoQuestions(patientRecord.patientInfo.mainComplaint);
      return demoQuestions;
      
      // בסביבת ייצור תהיה כאן קריאה אמיתית ל-LLM
      // const llmResponse = await this._callLLMApi(prompt);
      // return this._parseQuestions(llmResponse);
    } catch (error) {
      console.error("שגיאה בקבלת שאלות דינמיות:", error);
      return this._getFallbackQuestions();
    }
  },

  // פונקציה לקבלת שאלות דוגמה - לצורך פיתוח בלבד
  _getDemoQuestions: function(complaint) {
    // שאלות לפי סוג התלונה
    const demoQuestionsMap = {
      "כאב ראש": [
        "האם יש גורמים מחמירים כמו אור או רעש?",
        "האם יש הפרעות ראייה?",
        "האם הכאב ממוקד בצד אחד או בשני הצדדים?",
        "האם היו לך כאבי ראש דומים בעבר?",
        "האם הכאב הופיע בפתאומיות או בהדרגה?"
      ],
      "כאב בטן": [
        "האם הכאב מקרין לאזורים אחרים?",
        "האם יש תיאבון?",
        "האם הכאב משתנה אחרי אכילה?",
        "האם יש גזים או נפיחות?",
        "האם היו אירועים דומים בעבר?"
      ],
      "כאב גרון": [
        "האם יש נקודות לבנות בגרון?",
        "האם יש נפיחות בבלוטות הלימפה בצוואר?",
        "האם הכאב מחמיר בבליעה?",
        "האם היית במגע עם אנשים חולים?",
        "האם יש כאבים באוזניים?"
      ],
      "פציעת ראש": [
        "האם איבדת הכרה אחרי הפגיעה?",
        "האם יש בלבול או טשטוש?",
        "האם אתה זוכר את האירוע שגרם לפציעה?",
        "האם יש רגישות לאור או רעש?",
        "האם ישנת מאז הפציעה ואם כן, היה קושי להעיר אותך?"
      ],
      "שבר": [
        "האם יש דפורמציה באזור הפגוע?",
        "האם יש כאב בתנועה פסיבית (כשמזיזים לך)?",
        "האם ניתן לשאת משקל על האזור הפגוע?",
        "האם היו פגיעות דומות באותו מקום בעבר?",
        "האם יש תחושת נימול או חוסר תחושה מתחת לאזור הפגיעה?"
      ]
    };
    
    // אם יש שאלות ספציפיות לתלונה
    if (demoQuestionsMap[complaint]) {
      return demoQuestionsMap[complaint];
    }
    
    // שאלות כלליות
    return [
      "האם יש סימפטומים נוספים שלא הזכרת?",
      "האם המצב משפיע על התפקוד היומיומי?",
      "האם ניסית טיפול כלשהו בבית?",
      "האם יש רקע רפואי שעשוי להיות רלוונטי?",
      "האם אתה נוטל תרופות באופן קבוע?"
    ];
  },

  // פונקציה לשמירת תשובות לשאלות דינמיות
  saveDynamicAnswers: function(patientRecord, answers) {
    patientRecord.dynamicAnswers = answers;
    return patientRecord;
  },

  // פונקציה ליצירת סיכום אנמנזה
  generateSummary: async function(patientRecord) {
    try {
      const { age, gender, mainComplaint } = patientRecord.patientInfo;
      const genderText = gender === 'male' ? 'זכר' : 'נקבה';
      
      // יצירת טקסט מהתשובות
      let answerText = "תשובות לשאלות:\n";
      
      for (const [question, answer] of Object.entries(patientRecord.standardAnswers)) {
        if (answer && answer.trim()) {
          answerText += `- ${question} ${answer}\n`;
        }
      }
      
      for (const [question, answer] of Object.entries(patientRecord.dynamicAnswers)) {
        if (answer && answer.trim()) {
          answerText += `- ${question} ${answer}\n`;
        }
      }
      
      // פרומפט לחלק של ה-LLM
      const prompt = `צור סיכום אנמנזה רפואי מקצועי ומסודר עבור מטופל בגיל ${age}, ${genderText}, עם תלונה עיקרית של ${mainComplaint}.
${answerText}

פורמט הסיכום:
1. שורה ראשונה: פרטים דמוגרפיים ותלונה עיקרית.
2. פסקה שנייה: תיאור התלונה העיקרית, כולל משך, אופי והגורמים המחמירים/מקלים.
3. פסקה שלישית: ממצאים משמעותיים נוספים.
4. פסקה רביעית (אם רלוונטי): דגלים אדומים או ממצאים מדאיגים שדורשים התייחסות דחופה.

הסיכום צריך להיות בהיר, תמציתי ומקצועי. אם יש דגלים אדומים, ציין אותם בבירור בתחילת הפסקה המתאימה במילים "דגלים אדומים: ".`;

      // במצב פיתוח, נשתמש בסיכום לדוגמה
      const demoSummary = this._createDemoSummary(patientRecord);
      patientRecord.summary = demoSummary;
      
      // בסביבת ייצור, היינו קוראים ל-LLM
      // const summary = await this._callLLMApiForSummary(prompt);
      // patientRecord.summary = summary;
      
      return patientRecord;
    } catch (error) {
      console.error("שגיאה ביצירת סיכום:", error);
      
      // אם יש שגיאה, יצירת סיכום בסיסי
      const { age, gender, mainComplaint } = patientRecord.patientInfo;
      const genderText = gender === 'male' ? 'זכר' : 'נקבה';
      
      patientRecord.summary = `מטופל/ת בגיל ${age}, ${genderText}, עם תלונה עיקרית של ${mainComplaint}.\n\nלא ניתן היה ליצור סיכום מפורט עקב בעיה טכנית.`;
      
      return patientRecord;
    }
  },

  // יצירת סיכום דמה לפיתוח
  _createDemoSummary: function(patientRecord) {
    const { age, gender, mainComplaint } = patientRecord.patientInfo;
    const genderText = gender === 'male' ? 'זכר' : 'נקבה';
    
    // איסוף מידע משמעותי מהתשובות
    let duration = "לא ידוע";
    let painLocation = "";
    let severityFactors = [];
    let otherSymptoms = [];
    let treatments = [];
    
    // חיפוש תשובות רלוונטיות
    for (const [question, answer] of Object.entries(patientRecord.standardAnswers)) {
      if (!answer) continue;
      
      if (question.includes("זמן") || question.includes("מתי")) {
        duration = answer;
      } else if (question.includes("היכן") || question.includes("מיקום") || question.includes("איפה")) {
        painLocation = answer;
      } else if (question.includes("מחמיר") || question.includes("מקל")) {
        severityFactors.push(answer);
      } else if (question.includes("סימפטומים") || question.includes("תסמינים")) {
        otherSymptoms.push(answer);
      } else if (question.includes("טיפול") || question.includes("תרופות")) {
        treatments.push(answer);
      }
    }
    
    for (const [question, answer] of Object.entries(patientRecord.dynamicAnswers)) {
      if (!answer) continue;
      
      if (question.includes("זמן") || question.includes("מתי")) {
        duration = answer;
      } else if (question.includes("היכן") || question.includes("מיקום") || question.includes("איפה")) {
        painLocation = answer;
      } else if (question.includes("מחמיר") || question.includes("מקל")) {
        severityFactors.push(answer);
      } else if (question.includes("סימפטומים") || question.includes("תסמינים")) {
        otherSymptoms.push(answer);
      } else if (question.includes("טיפול") || question.includes("תרופות")) {
        treatments.push(answer);
      }
    }
    
    // בדיקה לדגלים אדומים
    const redFlags = this._checkForRedFlags(patientRecord);
    
    // יצירת הסיכום
    let summary = `מטופל/ת בגיל ${age}, ${genderText}, עם תלונה עיקרית של ${mainComplaint}.\n\n`;
    
    summary += `התלונה החלה ${duration || "לפני זמן לא ידוע"}`;
    if (painLocation) {
      summary += ` ומתמקדת ב${painLocation}`;
    }
    if (severityFactors.length > 0) {
      summary += `. הגורמים המשפיעים על עוצמת התלונה כוללים: ${severityFactors.join(", ")}`;
    }
    summary += ".\n\n";
    
    if (otherSymptoms.length > 0 || treatments.length > 0) {
      summary += "מידע נוסף: ";
      if (otherSymptoms.length > 0) {
        summary += `סימפטומים נלווים - ${otherSymptoms.join(", ")}. `;
      }
      if (treatments.length > 0) {
        summary += `טיפולים שננקטו - ${treatments.join(", ")}. `;
      }
      summary += "\n\n";
    }
    
    if (redFlags.length > 0) {
      summary += `דגלים אדומים: ${redFlags.join("; ")}.`;
    }
    
    return summary;
  },

  // בדיקה לדגלים אדומים על בסיס התלונה והתשובות
  _checkForRedFlags: function(patientRecord) {
    const redFlags = [];
    const { mainComplaint } = patientRecord.patientInfo;
    
    // פונקציית עזר לבדיקה אם מילת מפתח מופיעה בשאלות ותשובות
    const hasKeyword = (keyword) => {
      for (const [question, answer] of Object.entries({
        ...patientRecord.standardAnswers,
        ...patientRecord.dynamicAnswers
      })) {
        if ((question.toLowerCase().includes(keyword.toLowerCase()) ||
             answer.toLowerCase().includes(keyword.toLowerCase())) && 
            answer.toLowerCase().includes("כן")) {
          return true;
        }
      }
      return false;
    };
    
    // דגלים אדומים לפי תלונה עיקרית
    if (mainComplaint.includes("כאב ראש")) {
      if (hasKeyword("הקאות")) redFlags.push("הקאות בשילוב עם כאב ראש");
      if (hasKeyword("פתאומי")) redFlags.push("כאב ראש שהופיע בפתאומיות");
      if (hasKeyword("הכרה")) redFlags.push("איבוד הכרה בשילוב עם כאב ראש");
    } 
    else if (mainComplaint.includes("כאב חזה")) {
      if (hasKeyword("קוצר נשימה")) redFlags.push("כאב חזה בשילוב עם קוצר נשימה");
      if (hasKeyword("זיעה")) redFlags.push("כאב חזה בשילוב עם הזעה");
      if (hasKeyword("לחץ")) redFlags.push("תחושת לחץ בחזה");
    }
    else if (mainComplaint.includes("פציעת ראש")) {
      if (hasKeyword("הכרה")) redFlags.push("איבוד הכרה לאחר פציעת ראש");
      if (hasKeyword("הקאות")) redFlags.push("הקאות לאחר פציעת ראש");
      if (hasKeyword("שקוף") || hasKeyword("נוזל") || hasKeyword("אוזניים")) 
        redFlags.push("נוזל שקוף מהאף או האוזניים");
    }
    
    // דגלים אדומים כלליים
    if (hasKeyword("נשימה")) redFlags.push("קשיי נשימה");
    if (hasKeyword("דם") && hasKeyword("הקאות")) redFlags.push("הקאות דמיות");
    
    return redFlags;
  },

  // פונקציה לשליחת הסיכום לרופא/ה
  sendSummaryToDoctor: async function(patientRecord, doctorEmail) {
    // מדמה שליחת דוא"ל או שמירה במסד נתונים
    return new Promise((resolve) => {
      // מדמה זמן תגובה מהשרת
      setTimeout(() => {
        resolve({
          success: true,
          timestamp: new Date().toISOString(),
          message: `הסיכום נשלח בהצלחה לרופא/ה ${doctorEmail || "המטפל/ת"}`
        });
      }, 1000); // שנייה אחת לדמות זמן תגובה
    });
  },

  // פונקציה הלקוחת שאלות ברירת מחדל במקרה של שגיאה
  _getFallbackQuestions: function() {
    return [
      "האם יש סימפטומים נוספים שלא הזכרת?",
      "האם המצב השתפר או החמיר לאחרונה?",
      "האם המצב משפיע על תפקודך היומיומי?",
      "האם ניסית טיפול כלשהו עד כה?",
      "האם יש משהו נוסף שחשוב לך שאדע?"
    ];
  }
};

module.exports = MedicalDataSystem;