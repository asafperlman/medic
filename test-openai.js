// test-openai.js
// סקריפט לבדיקת התקשורת עם OpenAI API

// ייבוא המודול
const llmService = require('./src/api/llmService');

async function testOpenAI() {
  console.log('======== בדיקת אינטגרציה עם OpenAI ========');
  console.log('בודק חיבור ל-OpenAI API...');
  
  // בדיקת התחברות
  const connected = await llmService.testApiConnection();
  
  if (!connected) {
    console.error('❌ אין חיבור ל-OpenAI API. אנא בדוק את מפתח ה-API והחיבור לאינטרנט.');
    console.log('טיפ: 1. וודא שקיים קובץ .env תקין עם OPENAI_API_KEY');
    console.log('     2. וודא שיש גישה לאינטרנט');
    console.log('     3. וודא שמפתח ה-API בתוקף');
    return;
  }
  
  console.log('✅ חיבור ל-OpenAI API תקין!');
  
  // בדיקת קבלת מודלים זמינים
  console.log('\nבודק מודלים זמינים...');
  try {
    const models = await llmService.getAvailableModels();
    console.log('✅ מודלים זמינים:');
    models.forEach(model => {
      console.log(`   - ${model.name} (${model.id})`);
    });
  } catch (error) {
    console.error('❌ שגיאה בקבלת מודלים זמינים:', error.message);
  }
  
  // דוגמת נתוני מטופל לבדיקה
  const testPatientRecord = {
    patientInfo: {
      age: 35,
      gender: 'male',
      mainComplaint: 'כאב ראש',
      profile: '97',
      medicalSections: '',
      allergies: 'ללא אלרגיות ידועות',
      medications: 'ללא תרופות קבועות',
      smoking: 'no'
    },
    standardAnswers: {
      'כמה זמן נמשך כאב הראש?': 'יומיים',
      'האם יש רגישות לאור?': 'כן',
      'האם יש בחילה או הקאות?': 'לא',
      'האם לקחת תרופות כלשהן להקלה?': 'אקמול לפני שעתיים'
    },
    vitalSigns: {
      pulse: '72',
      bloodPressure: '120/80',
      temperature: '36.8',
      saturation: '98'
    }
  };

  // בדיקת יצירת שאלות המשך
  console.log('\nבודק יצירת שאלות המשך...');
  
  try {
    // יצירת פרומפט לשאלות המשך
    const questionPrompt = llmService.createFollowupQuestionsPrompt(testPatientRecord);
    console.log('✅ פרומפט לשאלות המשך נוצר בהצלחה');
    
    // בקשת שאלות המשך מהמודל
    console.log('שולח בקשה למודל...');
    const questionsResponse = await llmService.sendPrompt(questionPrompt);
    console.log('✅ תשובת המודל התקבלה:');
    console.log('----------');
    console.log(questionsResponse);
    console.log('----------');
    
    // פרסור השאלות מתוך התשובה
    const parsedQuestions = llmService.parseFollowupQuestions(questionsResponse);
    console.log('✅ שאלות שחולצו מהתשובה:');
    parsedQuestions.forEach((q, i) => console.log(`${i+1}. ${q}`));
  } catch (error) {
    console.error('❌ שגיאה בבדיקת שאלות המשך:', error.message);
  }
  
  // בדיקת יצירת סיכום
  console.log('\nבודק יצירת סיכום אנמנזה...');
  
  try {
    // הוספת תשובות לשאלות דינמיות
    testPatientRecord.dynamicAnswers = {
      'האם יש הפרעות ראייה?': 'כן, טשטוש קל',
      'האם הכאב מתגבר בשכיבה?': 'כן',
      'האם יש תחושת לחץ מאחורי העיניים?': 'לא'
    };
    
    // יצירת פרומפט לסיכום
    const summaryPrompt = llmService.createSummaryPrompt(testPatientRecord);
    console.log('✅ פרומפט לסיכום אנמנזה נוצר בהצלחה');
    
    // בקשת סיכום מהמודל
    console.log('שולח בקשה למודל...');
    const summaryResponse = await llmService.sendPrompt(summaryPrompt);
    console.log('✅ תשובת המודל התקבלה:');
    console.log('----------');
    console.log(summaryResponse);
    console.log('----------');
    
    // עיבוד הסיכום
    const processedSummary = llmService.processSummary(summaryResponse);
    if (processedSummary === summaryResponse) {
      console.log('✅ הסיכום התקבל ללא עיבוד נוסף (כמצופה)');
    } else {
      console.log('✅ הסיכום עובד בהצלחה');
    }
  } catch (error) {
    console.error('❌ שגיאה בבדיקת סיכום אנמנזה:', error.message);
  }
  
  // בדיקת מטמון
  console.log('\nבודק מטמון תשובות...');
  try {
    // ניקוי המטמון לבדיקה
    await llmService.clearCache();
    console.log('✅ מטמון נוקה בהצלחה');
    
    // פרומפט בסיסי לבדיקה
    const testPrompt = "תן לי 3 סוגים שונים של כאבי ראש";
    
    // שליחת פרומפט פעם ראשונה - אמור לקרוא לשרת
    console.log('שולח פרומפט ראשון (ללא מטמון)...');
    const firstResponse = await llmService.sendPrompt(testPrompt);
    console.log('✅ תשובה ראשונה התקבלה');
    
    // שליחת אותו פרומפט פעם שנייה - אמור להשתמש במטמון
    console.log('שולח פרומפט זהה (אמור להשתמש במטמון)...');
    const secondResponse = await llmService.sendPrompt(testPrompt);
    console.log('✅ תשובה שנייה התקבלה');
    
    // בדיקה אם התשובות זהות
    if (firstResponse === secondResponse) {
      console.log('✅ המטמון פועל כראוי (התשובות זהות)');
    } else {
      console.log('❌ המטמון אינו פועל כמצופה (התשובות שונות)');
    }
  } catch (error) {
    console.error('❌ שגיאה בבדיקת המטמון:', error.message);
  }
  
  console.log('\n✅✅✅ הבדיקה הושלמה! ✅✅✅');
}

// הרצת הבדיקה
testOpenAI().catch(error => {
  console.error('שגיאה לא צפויה במהלך הבדיקה:', error);
});