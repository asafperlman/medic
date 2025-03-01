// src/core/medicalDataSystem.js

/**
 * מערכת איסוף נתונים רפואיים
 * מודול זה מכיל את הפונקציות העיקריות לניהול רשומות מטופלים,
 * איסוף נתונים ממוקדים, ויצירת סיכומים
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

  // מאגר שאלות סטנדרטיות לפי תלונה עיקרית - שאלות ממוקדות
  standardQuestions: {
    "כאב גרון": [
      {
        type: "duration",
        question: "כמה זמן נמשך הכאב בגרון?",
        placeholder: "יום / יומיים / שבוע..."
      },
      {
        type: "yesNo",
        question: "האם יש לך חום?",
        followUp: "מה גובה החום ומתי נמדד לאחרונה?"
      },
      {
        type: "yesNo",
        question: "האם יש קושי בבליעה?",
        followUp: "באיזו רמה (קל/בינוני/חמור)?"
      },
      {
        type: "yesNo",
        question: "האם יש נפיחות בצוואר או בבלוטות הלימפה?",
        followUp: "היכן בדיוק ומה גודל הנפיחות?"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום?"
      }
    ],
    "כאב ראש": [
      {
        type: "duration",
        question: "כמה זמן נמשך כאב הראש?",
        placeholder: "שעה / יום / יומיים..."
      },
      {
        type: "location",
        question: "היכן ממוקם הכאב?",
        options: ["מצח", "רקות", "עורף", "חד צדדי", "דו-צדדי", "כל הראש"]
      },
      {
        type: "characteristic",
        question: "כיצד היית מתאר את אופי הכאב?",
        options: ["לוחץ", "פועם", "דוקר", "צורב"]
      },
      {
        type: "yesNo",
        question: "האם יש רגישות לאור או רעש?",
        followUp: "באיזו עוצמה?"
      },
      {
        type: "yesNo",
        question: "האם יש בחילה או הקאות?",
        followUp: "תאר את התדירות והעוצמה"
      },
      {
        type: "yesNo",
        question: "האם לקחת תרופות כלשהן להקלה?",
        followUp: "אילו תרופות והאם הועילו?"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום?"
      }
    ],
    "כאב בטן": [
      {
        type: "duration",
        question: "כמה זמן נמשך כאב הבטן?",
        placeholder: "שעה / יום / יומיים..."
      },
      {
        type: "location",
        question: "היכן ממוקם הכאב בבטן?",
        options: ["בטן עליונה", "בטן תחתונה", "ימין", "שמאל", "סביב הטבור", "כל הבטן"]
      },
      {
        type: "characteristic",
        question: "כיצד היית מתאר את אופי הכאב?",
        options: ["חד", "מתמשך", "התקפי", "צורב", "לוחץ"]
      },
      {
        type: "yesNo",
        question: "האם יש שינויים ביציאות?",
        followUp: "איזה סוג של שינויים (שלשול/עצירות)?"
      },
      {
        type: "yesNo",
        question: "האם יש בחילה או הקאות?",
        followUp: "תאר את התדירות והעוצמה"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום?"
      }
    ],
    "כאב גב": [
      {
        type: "duration",
        question: "כמה זמן נמשך כאב הגב?",
        placeholder: "יום / שבוע / חודש..."
      },
      {
        type: "location",
        question: "היכן ממוקם הכאב בגב?",
        options: ["גב עליון", "גב תחתון", "אמצע הגב", "צד ימין", "צד שמאל", "מרכז עמוד השדרה"]
      },
      {
        type: "characteristic",
        question: "כיצד היית מתאר את אופי הכאב?",
        options: ["חד", "מתמשך", "צורב", "התכווצותי", "מקרין"]
      },
      {
        type: "yesNo",
        question: "האם הכאב מקרין לגפיים?",
        followUp: "לאן הכאב מקרין ומה עוצמתו?"
      },
      {
        type: "yesNo",
        question: "האם אתה חש חולשה או נימול בגפיים?",
        followUp: "איפה בדיוק ומה עוצמת התופעה?"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום?"
      }
    ],
    "שיעול": [
      {
        type: "duration",
        question: "כמה זמן נמשך השיעול?",
        placeholder: "ימים / שבוע / שבועות..."
      },
      {
        type: "characteristic",
        question: "מהו אופי השיעול?",
        options: ["יבש", "עם ליחה", "עם דם", "התקפי"]
      },
      {
        type: "yesNo",
        question: "האם יש ליחה?",
        followUp: "מה צבע הליחה ומרקמה?"
      },
      {
        type: "yesNo",
        question: "האם יש חום?",
        followUp: "מה גובה החום ומתי התחיל?"
      },
      {
        type: "yesNo",
        question: "האם יש קוצר נשימה?",
        followUp: "מה עוצמת קוצר הנשימה?"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום ובמשך כמה שנים?"
      }
    ],
    "קוצר נשימה": [
      {
        type: "duration",
        question: "כמה זמן נמשך קוצר הנשימה?",
        placeholder: "דקות / שעות / ימים..."
      },
      {
        type: "onset",
        question: "כיצד התחיל קוצר הנשימה?",
        options: ["בפתאומיות", "בהדרגה", "במאמץ", "במנוחה"]
      },
      {
        type: "characteristic",
        question: "מהי עוצמת קוצר הנשימה?",
        options: ["קלה", "בינונית", "חמורה", "קשה מאוד"]
      },
      {
        type: "yesNo",
        question: "האם יש כאב בחזה?",
        followUp: "היכן בדיוק ומה עוצמתו?"
      },
      {
        type: "yesNo",
        question: "האם אתה משתעל?",
        followUp: "איזה סוג שיעול (יבש/ליחתי)?"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום ובמשך כמה שנים?"
      }
    ],
    "פציעת ראש": [
      {
        type: "duration",
        question: "מתי אירעה הפציעה?",
        placeholder: "דקות / שעות / ימים לפני..."
      },
      {
        type: "mechanism",
        question: "מה גרם לפציעה?",
        options: ["נפילה", "תאונה", "חבטה", "אחר"]
      },
      {
        type: "yesNo",
        question: "האם היה אובדן הכרה?",
        followUp: "למשך כמה זמן?"
      },
      {
        type: "yesNo",
        question: "האם יש כאב ראש?",
        followUp: "מה עוצמת הכאב ומיקומו?"
      },
      {
        type: "yesNo",
        question: "האם יש בחילה או הקאות?",
        followUp: "כמה פעמים הקאת מאז הפציעה?"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום?"
      }
    ],
    "שבר": [
      {
        type: "duration",
        question: "מתי אירעה הפציעה?",
        placeholder: "דקות / שעות / ימים לפני..."
      },
      {
        type: "location",
        question: "היכן ממוקם השבר החשוד?",
        options: ["יד", "רגל", "אצבע", "כף רגל", "אגן", "צלע", "אחר"]
      },
      {
        type: "mechanism",
        question: "כיצד אירעה הפציעה?",
        options: ["נפילה", "תאונה", "חבטה", "פעילות ספורטיבית", "אחר"]
      },
      {
        type: "yesNo",
        question: "האם יש עיוות נראה לעין?",
        followUp: "תאר את העיוות"
      },
      {
        type: "yesNo",
        question: "האם יש נפיחות או שינוי צבע?",
        followUp: "תאר את הנפיחות ו/או שינוי הצבע"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום?"
      }
    ],
    "כוויה": [
      {
        type: "duration",
        question: "מתי אירעה הכוויה?",
        placeholder: "דקות / שעות / ימים לפני..."
      },
      {
        type: "mechanism",
        question: "מה גרם לכוויה?",
        options: ["חום יבש", "נוזל חם", "כימיקלים", "חשמל", "שמש", "אחר"]
      },
      {
        type: "location",
        question: "היכן ממוקמת הכוויה?",
        options: ["יד", "רגל", "גו", "פנים", "צוואר", "אחר"]
      },
      {
        type: "area",
        question: "מהו אחוז משוער משטח הגוף שנפגע?",
        options: ["קטן (פחות מ-5%)", "בינוני (5-10%)", "גדול (יותר מ-10%)"]
      },
      {
        type: "yesNo",
        question: "האם יש שלפוחיות?",
        followUp: "מה גודלן ומה צבע הנוזל בהן?"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום?"
      }
    ],
    "סחרחורת": [
      {
        type: "duration",
        question: "כמה זמן נמשכת הסחרחורת?",
        placeholder: "דקות / שעות / ימים..."
      },
      {
        type: "onset",
        question: "כיצד התחילה הסחרחורת?",
        options: ["פתאום", "בהדרגה", "בשינוי תנוחה", "אחרי ארוחה"]
      },
      {
        type: "characteristic",
        question: "איך היית מתאר את אופי הסחרחורת?",
        options: ["תחושת סיבוב", "חוסר יציבות", "תחושת עילפון", "טשטוש"]
      },
      {
        type: "yesNo",
        question: "האם יש בחילה או הקאות?",
        followUp: "מה עוצמת הבחילה ותדירות ההקאות?"
      },
      {
        type: "yesNo",
        question: "האם יש תסמינים באוזניים (צלצולים, אטימות)?",
        followUp: "תאר את התסמינים"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום?"
      }
    ],
    "חום": [
      {
        type: "duration",
        question: "כמה זמן יש לך חום?",
        placeholder: "שעות / ימים / שבוע..."
      },
      {
        type: "value",
        question: "מה גובה החום שנמדד?",
        placeholder: "לדוגמה: 38.5"
      },
      {
        type: "yesNo",
        question: "האם יש שיעול?",
        followUp: "איזה סוג שיעול (יבש/ליחתי)?"
      },
      {
        type: "yesNo",
        question: "האם יש כאבי גרון?",
        followUp: "מה עוצמת הכאב בגרון?"
      },
      {
        type: "yesNo",
        question: "האם יש כאבי שרירים או מפרקים?",
        followUp: "היכן הכאבים ומה עוצמתם?"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום?"
      }
    ],
    // תבנית שאלות כללית לכל סוגי הפציעות/מחלות שלא הוגדרו ספציפית
    "אחר": [
      {
        type: "duration",
        question: "כמה זמן נמשכים הסימפטומים?",
        placeholder: "שעות / ימים / שבועות..."
      },
      {
        type: "onset",
        question: "כיצד התחילו הסימפטומים?",
        options: ["בפתאומיות", "בהדרגה", "לאחר אירוע מסוים"]
      },
      {
        type: "scale",
        question: "מהי עוצמת הסימפטומים בסולם 1-10?",
        placeholder: "דרג מ-1 (קל) עד 10 (חמור ביותר)"
      },
      {
        type: "yesNo",
        question: "האם ניסית טיפול כלשהו עד כה?",
        followUp: "איזה טיפול והאם הועיל?"
      },
      {
        type: "yesNo",
        question: "האם יש סימפטומים נוספים מלבד התלונה העיקרית?",
        followUp: "אילו סימפטומים נוספים?"
      },
      {
        type: "yesNo",
        question: "האם אתה מעשן?",
        followUp: "כמה סיגריות ביום?"
      }
    ]
  },

  // מדדים רלוונטיים לפי תלונה
  vitalSignsByComplaint: {
    "כאב ראש": ["דופק", "לחץ דם", "חום", "סטורציה"],
    "כאב חזה": ["דופק", "לחץ דם", "חום", "סטורציה", "קצב נשימה"],
    "קוצר נשימה": ["דופק", "לחץ דם", "חום", "סטורציה", "קצב נשימה"],
    "כאב בטן": ["דופק", "לחץ דם", "חום"],
    "חום": ["דופק", "לחץ דם", "חום", "סטורציה"],
    "פציעת ראש": ["דופק", "לחץ דם", "סטורציה"],
    "כאב גרון": ["חום"],
    "שיעול": ["חום", "סטורציה", "קצב נשימה"],
    "סחרחורת": ["דופק", "לחץ דם", "חום"],
    // ברירת מחדל לכל תלונה אחרת
    "default": ["דופק", "לחץ דם", "חום"]
  },

  // פונקציה לקבלת מדדים רלוונטיים לפי תלונה
  getRelevantVitalSigns: function(complaint) {
    return this.vitalSignsByComplaint[complaint] || this.vitalSignsByComplaint["default"];
  },

  // פונקציה ליצירת רשומת מטופל חדשה - מעודכנת עם שדות פרופיל ועישון
  createPatientRecord: function(age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking = "לא") {
    return {
      patientInfo: {
        age: age,
        gender: gender,
        mainComplaint: mainComplaint,
        timestamp: new Date().toISOString(),
        // שדות פרופיל חדשים
        profile: profile || "97",
        medicalSections: medicalSections || "ללא סעיפים",
        allergies: allergies || "ללא אלרגיות ידועות",
        medications: medications || "לא נוטל תרופות באופן קבוע",
        smoking: smoking
      },
      standardAnswers: {},
      dynamicAnswers: {},
      vitalSigns: {},
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
    return this.standardQuestions["אחר"];
  },

  // פונקציה לשמירת תשובות לשאלות סטנדרטיות
  saveStandardAnswers: function(patientRecord, answers) {
    patientRecord.standardAnswers = answers;
    return patientRecord;
  },

  // פונקציה להשגת שאלות דינמיות על בסיס התשובות הקודמות
  getDynamicQuestions: function(complaint, previousAnswers) {
    // ניתוח התשובות הקודמות לזיהוי סימפטומים ייחודיים
    const hasSymptom = (keyword) => {
      return Object.entries(previousAnswers).some(([question, answer]) => 
        (question.toLowerCase().includes(keyword.toLowerCase()) || 
         answer.toLowerCase().includes(keyword.toLowerCase())) &&
        answer.toLowerCase().includes('כן')
      );
    };
    
    // מיפוי שאלות המשך מותאמות לפי סוג התלונה ותשובות קודמות
    const dynamicQuestionsMap = {
      "כאב ראש": [
        {
          type: "yesNo",
          question: "האם יש הפרעות ראייה?",
          followUp: "איזה סוג של הפרעות (טשטוש, כפל ראייה)?"
        },
        hasSymptom('בחילה') ? {
          type: "yesNo",
          question: "האם הבחילות הולכות ומחמירות?",
          followUp: "תאר את ההחמרה"
        } : {
          type: "yesNo",
          question: "האם יש רגישות לריחות?",
          followUp: "לאילו ריחות?"
        },
        hasSymptom('אור') ? {
          type: "yesNo",
          question: "האם הרגישות לאור מופיעה רק בזמן הכאב?",
          followUp: "מתי מופיעה הרגישות לאור?"
        } : {
          type: "yesNo",
          question: "האם כאב הראש מעיר אותך משינה?",
          followUp: "באיזו תדירות?"
        },
        {
          type: "yesNo",
          question: "האם הכאב החל לאחר מאמץ או אירוע מסוים?",
          followUp: "תאר את האירוע"
        }
      ],
      "כאב בטן": [
        hasSymptom('שלשול') ? {
          type: "quantity",
          question: "כמה יציאות ביום?",
          placeholder: "מספר משוער של יציאות"
        } : {
          type: "yesNo",
          question: "האם יש עצירות?",
          followUp: "מתי הייתה היציאה האחרונה?"
        },
        {
          type: "yesNo",
          question: "האם הכאב קשור לאכילה?",
          followUp: "האם מופיע לפני, בזמן או אחרי אכילה?"
        },
        hasSymptom('דם') ? {
          type: "yesNo",
          question: "האם הדם ביציאות או בהקאות עדיין נמשך?",
          followUp: "מתי הופיע לאחרונה?"
        } : {
          type: "yesNo",
          question: "האם יש שינוי בצבע היציאות?",
          followUp: "מהו הצבע?"
        },
        {
          type: "yesNo",
          question: "האם הכאב מקרין לאזורים אחרים?",
          followUp: "לאן הכאב מקרין?"
        }
      ],
      "כאב גרון": [
        hasSymptom('בליעה') ? {
          type: "yesNo",
          question: "האם הקושי בבליעה מתייחס לנוזלים, מוצקים או שניהם?",
          followUp: "פרט"
        } : {
          type: "yesNo",
          question: "האם יש קושי בבליעת רוק?",
          followUp: "תאר את הקושי"
        },
        hasSymptom('חום') ? {
          type: "yesNo",
          question: "האם החום נמשך יותר מ-3 ימים?",
          followUp: "כמה ימים בדיוק?"
        } : {
          type: "yesNo",
          question: "האם יש צמרמורות?",
          followUp: "מתי הופיעו לראשונה?"
        },
        {
          type: "yesNo",
          question: "האם יש שינוי בקול?",
          followUp: "איזה סוג של שינוי?"
        },
        {
          type: "yesNo",
          question: "האם היו אירועים דומים בעבר?",
          followUp: "מתי ובאיזו תדירות?"
        }
      ],
      "פציעת ראש": [
        hasSymptom('הכרה') ? {
          type: "duration",
          question: "למשך כמה זמן היה אובדן ההכרה?",
          placeholder: "שניות / דקות / לא ידוע"
        } : {
          type: "yesNo",
          question: "האם יש בלבול או קושי בהתמצאות?",
          followUp: "תאר את הבלבול"
        },
        hasSymptom('הקאות') ? {
          type: "yesNo",
          question: "האם ההקאות חוזרות?",
          followUp: "כמה פעמים הקאת?"
        } : {
          type: "yesNo",
          question: "האם יש בחילות?",
          followUp: "תאר את הבחילות"
        },
        {
          type: "yesNo",
          question: "האם יש שינויים בראייה?",
          followUp: "איזה סוג של שינויים?"
        },
        {
          type: "yesNo",
          question: "האם ניתן להעיר אותך משינה בקלות?",
          followUp: "תאר את הקושי"
        }
      ]
    };
    
    // אם יש שאלות ספציפיות לתלונה
    if (dynamicQuestionsMap[complaint]) {
      return dynamicQuestionsMap[complaint];
    }
    
    // שאלות המשך כלליות משופרות
    return [
      {
        type: "yesNo",
        question: "האם חל שינוי ברמת האנרגיה שלך לאחרונה?",
        followUp: "תאר את השינוי"
      },
      {
        type: "yesNo",
        question: "האם יש שינויים בהרגלי האכילה או השתייה שלך?",
        followUp: "איזה שינויים?"
      },
      {
        type: "yesNo",
        question: "האם יש לך מחלות כרוניות?",
        followUp: "אילו מחלות?"
      },
      {
        type: "yesNo",
        question: "האם חווית מצבים דומים בעבר?",
        followUp: "מתי והאם טופלו?"
      }
    ];
  },

  // פונקציה לשמירת תשובות לשאלות דינמיות
  saveDynamicAnswers: function(patientRecord, answers) {
    patientRecord.dynamicAnswers = answers;
    return patientRecord;
  },

  // פונקציה לשמירת מדדים חיוניים
  saveVitalSigns: function(patientRecord, vitalSigns) {
    patientRecord.vitalSigns = vitalSigns;
    return patientRecord;
  },

  // פונקציה ליצירת סיכום אנמנזה משופר
  generateSummary: function(patientRecord) {
    try {
      // חילוץ מידע בסיסי
      const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
      const genderText = gender === 'male' ? 'זכר' : 'נקבה';
      
      // פתיחת האנמנזה עם פרטי הפרופיל הרפואי
      let summary = `פרופיל ${profile}, ${medicalSections}, ${allergies}, ${medications}.\n\n`;
      
      // תיאור דמוגרפי ותלונה עיקרית
      summary += `מטופל/ת בגיל ${age}, ${genderText}, ${smoking === 'yes' ? 'מעשן/ת' : 'לא מעשן/ת'}, מתלונן/ת על ${mainComplaint}`;
      
      // הוספת המדדים אם קיימים
      if (patientRecord.vitalSigns && Object.keys(patientRecord.vitalSigns).length > 0) {
        summary += '\n\nמדדים חיוניים: ';
        const vitalSignsArr = [];
        
        if (patientRecord.vitalSigns.pulse) {
          vitalSignsArr.push(`דופק ${patientRecord.vitalSigns.pulse}`);
        }
        if (patientRecord.vitalSigns.bloodPressure) {
          vitalSignsArr.push(`לחץ דם ${patientRecord.vitalSigns.bloodPressure}`);
        }
        if (patientRecord.vitalSigns.temperature) {
          vitalSignsArr.push(`חום ${patientRecord.vitalSigns.temperature}`);
        }
        if (patientRecord.vitalSigns.saturation) {
          vitalSignsArr.push(`סטורציה ${patientRecord.vitalSigns.saturation}%`);
        }
        if (patientRecord.vitalSigns.respiratoryRate) {
          vitalSignsArr.push(`קצב נשימה ${patientRecord.vitalSigns.respiratoryRate}`);
        }
        
        summary += vitalSignsArr.join(', ') + '.\n\n';
      } else {
        summary += '.\n\n';
      }
      
      // איסוף מידע משמעותי מהתשובות
      let duration = "";
      let location = "";
      let characteristics = [];
      let associatedSymptoms = [];
      let aggravatingFactors = [];
      let relievingFactors = [];
      let treatments = [];
      let negativeFindings = []; // ממצאים שליליים
      
      // חיפוש תשובות רלוונטיות מהשאלות הסטנדרטיות והדינמיות
      const allAnswers = {
        ...patientRecord.standardAnswers,
        ...patientRecord.dynamicAnswers
      };
      
      // עיבוד המידע מהתשובות
      for (const [question, answer] of Object.entries(allAnswers)) {
        if (!answer || answer.trim() === '') continue;
        
        // זיהוי קטגוריות מידע שונות
        if (question.includes("זמן") || question.includes("מתי") || question.includes("כמה זמן") || question.includes("משך")) {
          duration = answer;
        } 
        else if (question.includes("היכן") || question.includes("מיקום") || question.includes("איפה") || question.includes("ממוקם")) {
          location = answer;
        }
        else if (question.includes("אופי") || question.includes("מתאר") || question.includes("סוג")) {
          characteristics.push(answer);
        }
        else if (question.includes("מחמיר") || question.includes("גורם להחמרה")) {
          aggravatingFactors.push(answer);
        }
        else if (question.includes("מקל") || question.includes("גורם להקלה")) {
          relievingFactors.push(answer);
        }
        else if (question.includes("סימפטומים נוספים") || question.includes("תסמינים") || 
                 question.includes("בחילה") || question.includes("הקאות") || 
                 question.includes("חום") || question.includes("סחרחורת")) {
          if (answer.toLowerCase() === 'לא') {
            negativeFindings.push(`שולל ${question.replace('?', '').replace('האם', '')}`);
          } else {
            associatedSymptoms.push(`${question.replace('?', '')}: ${answer}`);
          }
        }
        else if (question.includes("טיפול") || question.includes("תרופות") || question.includes("לקחת")) {
          if (answer.toLowerCase() === 'לא') {
            negativeFindings.push("שולל נטילת תרופות קודמות");
          } else {
            treatments.push(`${question.replace('?', '')}: ${answer}`);
          }
        }
        else if (answer.toLowerCase() === 'לא') {
          // הוספת ממצאים שליליים נוספים
          negativeFindings.push(`שולל ${question.replace('?', '').replace('האם', '')}`);
        }
      }
      
      // בניית משפט משמעותי על התלונה העיקרית
      if (duration) {
        summary += `התלונה החלה לפני ${duration}`;
      }
      
      if (location) {
        summary += ` ומתמקמת ב${location}`;
      }
      
      if (characteristics.length > 0) {
        summary += `. התלונה מתוארת כ${characteristics.join(", ")}`;
      }
      
      summary += '. ';
      
      // הוספת גורמים מחמירים ומקלים
      if (aggravatingFactors.length > 0 || relievingFactors.length > 0) {
        if (aggravatingFactors.length > 0) {
          summary += `גורמים מחמירים: ${aggravatingFactors.join(", ")}. `;
        }
        
        if (relievingFactors.length > 0) {
          summary += `גורמים מקלים: ${relievingFactors.join(", ")}. `;
        }
        
        summary += '\n\n';
      }
      
      // הוספת סימפטומים נלווים
      if (associatedSymptoms.length > 0) {
        summary += `סימפטומים נלווים: ${associatedSymptoms.join("; ")}. \n\n`;
      }
      
      // הוספת מידע על טיפולים
      if (treatments.length > 0) {
        summary += `טיפולים שננקטו: ${treatments.join("; ")}. \n\n`;
      }
      
      // הוספת ממצאים שליליים
      if (negativeFindings.length > 0) {
        summary += `ממצאים שליליים: ${negativeFindings.join("; ")}. \n\n`;
      }
      
      // בדיקה לדגלים אדומים
      const redFlags = this.checkForRedFlags(patientRecord);
      
      if (redFlags.length > 0) {
        summary += `דגלים אדומים: ${redFlags.join("; ")}.`;
      }
      
      patientRecord.summary = summary;
      return patientRecord;
    } catch (error) {
      console.error("שגיאה ביצירת סיכום:", error);
      
      // אם יש שגיאה, יצירת סיכום בסיסי
      const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
      const genderText = gender === 'male' ? 'זכר' : 'נקבה';
      
      patientRecord.summary = `פרופיל ${profile}, ${medicalSections}, ${allergies}, ${medications}.\n\nמטופל/ת בגיל ${age}, ${genderText}, ${smoking === 'yes' ? 'מעשן/ת' : 'לא מעשן/ת'}, עם תלונה עיקרית של ${mainComplaint}.\n\nלא ניתן היה ליצור סיכום מפורט עקב בעיה טכנית.`;
      
      return patientRecord;
    }
  },

  // פונקציית בדיקת דגלים אדומים משופרת
  checkForRedFlags: function(patientRecord) {
    const redFlags = [];
    const { mainComplaint } = patientRecord.patientInfo;
    const allAnswers = { ...patientRecord.standardAnswers, ...patientRecord.dynamicAnswers };
    
    // פונקציית עזר משופרת לבדיקת תשובות
    const containsKeyword = (keywords, positiveTerms = ['כן', 'חיובי', 'נכון']) => {
      if (!Array.isArray(keywords)) keywords = [keywords];
      
      for (const [question, answer] of Object.entries(allAnswers)) {
        if (!answer) continue;
        
        // בדיקה אם השאלה או התשובה מכילות את אחת ממילות המפתח
        const questionOrAnswerContainsKeyword = keywords.some(keyword => 
          question.toLowerCase().includes(keyword.toLowerCase()) || 
          answer.toLowerCase().includes(keyword.toLowerCase())
        );
        
        // בדיקה אם התשובה חיובית
        const isPositiveResponse = positiveTerms.some(term => 
          answer.toLowerCase().includes(term.toLowerCase())
        ) || !['לא', 'שלילי', 'אין'].some(term => 
          answer.toLowerCase().includes(term.toLowerCase())
        );
        
        if (questionOrAnswerContainsKeyword && isPositiveResponse) {
          return true;
        }
      }
      return false;
    };
    
    // בדיקות ספציפיות לתלונות שונות לפי מדריך הטיפול הרפואי
    
    // כאב ראש - דגלים אדומים
    if (mainComplaint.includes("כאב ראש")) {
      if (containsKeyword(["הופעה פתאומית", "פתאומי", "חד"]) || 
          this._isRedFlagAnswer("האם הכאב החל באופן פתאומי?", allAnswers)) 
        redFlags.push("כאב ראש שהופיע בפתאומיות - יש לשקול הערכה נוירולוגית דחופה");
      
      if ((containsKeyword(["הקאות", "בחילות"]) && containsKeyword(["מרובות", "חוזרות"])) ||
          this._isRedFlagAnswer("האם ההקאות חוזרות או מרובות?", allAnswers))
        redFlags.push("הקאות חוזרות בשילוב עם כאב ראש - חשד למצב נוירולוגי דחוף");
      
      if (containsKeyword(["חמור", "חזק ביותר", "הכי גרוע"]) ||
          this._checkPainIntensity(allAnswers, 8))
        redFlags.push("כאב ראש בעוצמה גבוהה מאוד - נדרשת הערכה רפואית");
      
      if (containsKeyword(["הפרעות ראייה", "טשטוש", "כפל ראייה"]) ||
          this._isRedFlagAnswer("האם יש הפרעות ראייה?", allAnswers))
        redFlags.push("הפרעות ראייה המלוות כאב ראש - מצריך בירור דחוף");
      
      if (containsKeyword(["נימול", "חולשה בגפיים"]) ||
          this._isRedFlagAnswer("האם יש תחושת נימול או חולשה בגפיים?", allAnswers))
        redFlags.push("תסמינים נוירולוגיים המלווים כאב ראש - חשד לאירוע מוחי");
      
      if (containsKeyword(["מעיר משינה", "מתעורר בגלל הכאב"]) ||
          this._isRedFlagAnswer("האם כאב הראש מעיר אותך משינה?", allAnswers))
        redFlags.push("כאב ראש המעיר משינה - סימן למצב דחוף");
      
      // בדיקת מדדים חיוניים
      if (patientRecord.vitalSigns) {
        const bp = patientRecord.vitalSigns.bloodPressure;
        if (bp && this._isHighBloodPressure(bp))
          redFlags.push("לחץ דם גבוה במטופל עם כאב ראש - חשד ליתר לחץ דם משני");
      }
    }
    
    // כאב חזה - דגלים אדומים
    else if (mainComplaint.includes("כאב חזה")) {
      if (containsKeyword(["קוצר נשימה", "קשיי נשימה"]) ||
          this._isRedFlagAnswer("האם יש קוצר נשימה?", allAnswers))
        redFlags.push("כאב חזה בשילוב עם קוצר נשימה - יש לשלול מצב לבבי או ריאתי חריף");
      
      if (containsKeyword(["זיעה", "הזעה", "זיעה קרה"]) ||
          this._isRedFlagAnswer("האם יש הזעה?", allAnswers))
        redFlags.push("כאב חזה בשילוב עם הזעה - חשד למצב לבבי חריף");
      
      if (containsKeyword(["לחץ", "מועקה", "כבדות"]) ||
          this._isRedFlagAnswer("האם מרגיש לחץ או מועקה?", allAnswers))
        redFlags.push("תחושת לחץ או מועקה בחזה - חשד לבעיה לבבית");
      
      if (containsKeyword(["הקרנה", "מקרין", "פשט", "התפשט"], ["ליד", "לזרוע", "לכתף", "ללסת"]) ||
          this._isRedFlagAnswer("האם הכאב מקרין?", allAnswers))
        redFlags.push("כאב חזה המקרין לזרוע, כתף או לסת - חשד לבעיה לבבית");
      
      // בדיקת מדדים חיוניים
      if (patientRecord.vitalSigns) {
        const pulse = patientRecord.vitalSigns.pulse;
        if (pulse && (pulse > 100 || pulse < 50))
          redFlags.push(`דופק חריג (${pulse}) במטופל עם כאב חזה - מצריך הערכה דחופה`);
        
        const saturation = patientRecord.vitalSigns.saturation;
        if (saturation && saturation < 94)
          redFlags.push(`סטורציה נמוכה (${saturation}%) במטופל עם כאב חזה - מצריך הערכה דחופה`);
      }
    }
    
    // פציעת ראש - דגלים אדומים
    else if (mainComplaint.includes("פציעת ראש")) {
      if (containsKeyword(["איבוד הכרה", "התעלפות", "איבד הכרה"]) ||
          this._isRedFlagAnswer("האם היה אובדן הכרה?", allAnswers))
        redFlags.push("איבוד הכרה לאחר פציעת ראש - מצריך הערכה נוירולוגית דחופה");
      
      if ((containsKeyword(["הקאות", "בחילות"]) && containsKeyword(["חוזרות", "מרובות"])) ||
          this._isRedFlagAnswer("האם יש הקאות חוזרות?", allAnswers))
        redFlags.push("הקאות חוזרות לאחר פציעת ראש - חשד לעליית לחץ תוך גולגולתי");
      
      if (containsKeyword(["בלבול", "חוסר התמצאות", "חוסר זיכרון"]) ||
          this._isRedFlagAnswer("האם יש בלבול או חוסר התמצאות?", allAnswers))
        redFlags.push("בלבול או חוסר התמצאות לאחר פציעת ראש - חשד לפגיעה מוחית משמעותית");
      
      if ((containsKeyword(["נוזל", "דימום"]) && containsKeyword(["אוזניים", "אף", "פה"])) ||
          this._isRedFlagAnswer("האם יש נוזל או דימום מהאוזניים או האף?", allAnswers))
        redFlags.push("נוזל או דימום מהאוזניים או האף - חשד לשבר בבסיס הגולגולת");
      
      if (containsKeyword(["אישונים לא שווים", "תגובת אישונים"]) ||
          this._isRedFlagAnswer("האם האישונים שווים ומגיבים לאור?", allAnswers, true))
        redFlags.push("אישונים לא שווים או תגובה לא תקינה לאור - חשד לפגיעה נוירולוגית חמורה");
      
      // בדיקת זמן שעבר
      if (this._isRecentInjury(allAnswers, 24))
        redFlags.push("פציעת ראש טרייה (פחות מ-24 שעות) - נדרש מעקב צמוד");
    }
    
    // כאב בטן - דגלים אדומים
    else if (mainComplaint.includes("כאב בטן")) {
      if ((containsKeyword(["דם", "דמי"]) && (containsKeyword(["צואה", "יציאות"]) || containsKeyword(["הקאה", "הקאות"]))) ||
          this._isRedFlagAnswer("האם יש דם בצואה או בהקאות?", allAnswers))
        redFlags.push("דם בצואה או בהקאות - מצריך הערכה דחופה");
      
      if ((containsKeyword(["כאב חזק", "כאב חמור"]) && containsKeyword(["ימין תחתונה", "צד ימין למטה"])) ||
          (this._checkPainLocation(allAnswers, "ימין תחתונה") && this._checkPainIntensity(allAnswers, 7)))
        redFlags.push("כאב חזק בבטן ימין תחתונה - יש לשלול אפנדיציט");
      
      if (containsKeyword(["בטן קשה", "בטן מתוחה", "נוקשות"]) ||
          this._isRedFlagAnswer("האם הבטן קשה או מתוחה למגע?", allAnswers))
        redFlags.push("בטן קשה או מתוחה - יש לשלול מצב כירורגי חריף");
      
      if (containsKeyword(["חום"]) && containsKeyword(["בטן"]) ||
          (this._checkTemperature(patientRecord.vitalSigns, 38) && mainComplaint.includes("כאב בטן")))
        redFlags.push("כאב בטן המלווה בחום - יש לשלול זיהום חמור");
      
      // בדיקת מדדים חיוניים
      if (patientRecord.vitalSigns) {
        const pulse = patientRecord.vitalSigns.pulse;
        if (pulse && pulse > 100)
          redFlags.push(`דופק מהיר (${pulse}) במטופל עם כאב בטן - חשד להלם או זיהום`);
      }
    }
    
    // קוצר נשימה - דגלים אדומים
    else if (mainComplaint.includes("קוצר נשימה")) {
      if (containsKeyword(["במנוחה", "ללא מאמץ"]) ||
          this._isRedFlagAnswer("האם קוצר הנשימה מופיע במנוחה?", allAnswers))
        redFlags.push("קוצר נשימה במנוחה - מצריך הערכה דחופה");
      
      if (containsKeyword(["כחלון", "שפתיים כחולות"]) ||
          this._isRedFlagAnswer("האם יש כחלון בשפתיים או בציפורניים?", allAnswers))
        redFlags.push("כחלון - סימן לחמצון נמוך, מצריך טיפול דחוף");
      
      if (containsKeyword(["דיבור קטוע", "לא מסוגל לדבר משפט"]) ||
          this._isRedFlagAnswer("האם יש קושי לדבר משפט שלם בנשימה אחת?", allAnswers))
        redFlags.push("קוצר נשימה המקשה על הדיבור - מצב חמור המצריך הערכה מיידית");
      
      // בדיקת מדדים חיוניים
      if (patientRecord.vitalSigns) {
        const saturation = patientRecord.vitalSigns.saturation;
        if (saturation && saturation < 92)
          redFlags.push(`סטורציה נמוכה (${saturation}%) במטופל עם קוצר נשימה - מצב חירום`);
        
        const respiratoryRate = patientRecord.vitalSigns.respiratoryRate;
        if (respiratoryRate && respiratoryRate > 24)
          redFlags.push(`קצב נשימה מוגבר (${respiratoryRate}) - מצב חירום`);
      }
    }
    
    // דגלים אדומים כלליים
    if (containsKeyword(["קשיי נשימה", "קוצר נשימה חמור"]) ||
        this._isRedFlagAnswer("האם יש קשיי נשימה חמורים?", allAnswers))
      redFlags.push("קשיי נשימה משמעותיים - מצריכים הערכה דחופה");
    
    if (containsKeyword(["הקאות", "דם"]) && !containsKeyword(["שלילי", "אין"]) ||
        this._isRedFlagAnswer("האם יש הקאות דמיות?", allAnswers))
      redFlags.push("הקאות דמיות - מצריכות הערכה דחופה");
    
    if (containsKeyword(["חום גבוה", "חום מעל 39"]) ||
        this._checkTemperature(patientRecord.vitalSigns, 39))
      redFlags.push("חום גבוה מעל 39 מעלות - דורש התייחסות");
    
    if (containsKeyword(["בלבול", "חוסר התמצאות", "הזיות"]) ||
        this._isRedFlagAnswer("האם יש בלבול או חוסר התמצאות?", allAnswers))
      redFlags.push("שינוי במצב ההכרה או בלבול - מצריך הערכה נוירולוגית");
    
    if (containsKeyword(["אובדן הכרה", "התעלפות"]) ||
        this._isRedFlagAnswer("האם היה אובדן הכרה?", allAnswers))
      redFlags.push("אובדן הכרה - מצריך הערכה רפואית");
    
    return redFlags;
  },

  /**
   * בודק אם תשובה לשאלה ספציפית מעידה על דגל אדום
   * @private
   * @param {string} question - השאלה לבדיקה
   * @param {object} answers - כל התשובות
   * @param {boolean} negativeIsFlag - האם תשובה שלילית נחשבת כדגל אדום
   * @returns {boolean} - האם זוהה דגל אדום
   */
  _isRedFlagAnswer: function(question, answers, negativeIsFlag = false) {
    for (const [q, a] of Object.entries(answers)) {
      if (q.includes(question)) {
        const isPositive = a.toLowerCase().includes('כן') || 
                          !a.toLowerCase().includes('לא');
        
        return negativeIsFlag ? !isPositive : isPositive;
      }
    }
    return false;
  },

  /**
   * בודק אם עוצמת הכאב גבוהה מהסף שהוגדר
   * @private
   * @param {object} answers - כל התשובות
   * @param {number} threshold - סף עוצמת כאב
   * @returns {boolean} - האם עוצמת הכאב גבוהה מהסף
   */
  _checkPainIntensity: function(answers, threshold) {
    for (const [question, answer] of Object.entries(answers)) {
      if (question.includes("עוצמת") && question.includes("כאב")) {
        const painLevel = parseInt(answer.match(/\d+/));
        if (!isNaN(painLevel) && painLevel >= threshold) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * בודק אם מיקום הכאב תואם למיקום שהוגדר
   * @private
   * @param {object} answers - כל התשובות
   * @param {string} location - המיקום לבדיקה
   * @returns {boolean} - האם המיקום תואם
   */
  _checkPainLocation: function(answers, location) {
    for (const [question, answer] of Object.entries(answers)) {
      if ((question.includes("היכן") || question.includes("מיקום") || question.includes("איפה")) && 
          question.includes("כאב")) {
        if (answer.toLowerCase().includes(location.toLowerCase())) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * בודק אם הפציעה התרחשה לפני פחות זמן מהסף שהוגדר
   * @private
   * @param {object} answers - כל התשובות
   * @param {number} hoursThreshold - סף שעות
   * @returns {boolean} - האם הפציעה טרייה
   */
  _isRecentInjury: function(answers, hoursThreshold) {
    for (const [question, answer] of Object.entries(answers)) {
      if (question.includes("מתי") && (question.includes("פציעה") || question.includes("אירע"))) {
        // בדיקת מילות מפתח המעידות על זמן קרוב
        if (answer.includes("עכשיו") || 
            answer.includes("כרגע") || 
            answer.includes("לפני שעה") || 
            answer.includes("לפני שעתיים") || 
            answer.includes("היום")) {
          return true;
        }
        
        // ניסיון לחלץ שעות משיחת טקסט חופשי
        const hourMatch = answer.match(/לפני (\d+) שע(ה|ות)/);
        if (hourMatch && parseInt(hourMatch[1]) < hoursThreshold) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * בודק אם החום גבוה מהסף שהוגדר
   * @private
   * @param {object} vitalSigns - המדדים החיוניים
   * @param {number} tempThreshold - סף חום
   * @returns {boolean} - האם החום גבוה מהסף
   */
  _checkTemperature: function(vitalSigns, tempThreshold) {
    if (!vitalSigns || !vitalSigns.temperature) return false;
    
    const temp = parseFloat(vitalSigns.temperature);
    return !isNaN(temp) && temp >= tempThreshold;
  },

  /**
   * בודק אם לחץ הדם גבוה
   * @private
   * @param {string} bp - לחץ הדם (במבנה סיסטולי/דיאסטולי)
   * @returns {boolean} - האם לחץ הדם גבוה
   */
  _isHighBloodPressure: function(bp) {
    const parts = bp.split('/');
    if (parts.length !== 2) return false;
    
    const systolic = parseInt(parts[0]);
    const diastolic = parseInt(parts[1]);
    
    return !isNaN(systolic) && !isNaN(diastolic) && 
           (systolic > 160 || diastolic > 100);
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

  /**
   * יוצר פרומפט מותאם עבור AI לסיכום אנמנזה רפואית
   * @param {object} patientRecord - רשומת המטופל
   * @returns {string} - פרומפט מובנה לסיכום
   */
  createAISummaryPrompt: function(patientRecord) {
    // חילוץ מידע בסיסי
    const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
    const genderText = gender === 'male' ? 'זכר' : 'נקבה';
    
    // יצירת פרומפט מובנה
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
- מעשן: ${smoking === 'yes' ? 'כן' : 'לא'}
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
    
    // תשובות לשאלות דינמיות
    for (const [question, answer] of Object.entries(patientRecord.dynamicAnswers)) {
      if (answer && answer.trim()) {
        prompt += `- ${question}: ${answer}\n`;
      }
    }
    
    // הוספת דגלים אדומים
    const redFlags = this.checkForRedFlags(patientRecord);
    if (redFlags.length > 0) {
      prompt += "\nדגלים אדומים שזוהו:\n";
      redFlags.forEach(flag => {
        prompt += `- ${flag}\n`;
      });
    }
    
    // הנחיות לפורמט הסיכום
    prompt += `
יש לנסח את האנמנזה בשפה רפואית ברורה, עם הדגשת:
- ציון כל השלילות (תשובות שליליות לשאלות משמעותיות) בפורמט "שולל X"
- ניסוח קוהרנטי ורציף (לא רשימת משפטים קטועים)
- שילוב כל המידע הרלוונטי בסיכום אחד מסודר וברור
- אם זוהו דגלים אדומים, הקדש להם פסקה נפרדת בסוף הסיכום

הסיכום צריך להיות בלשון שמישה על-ידי אנשי רפואה, בפורמט שמתחיל ב"פרופיל... מטופל/ת בן/בת..."`;
    
    return prompt;
  }
};

module.exports = MedicalDataSystem;