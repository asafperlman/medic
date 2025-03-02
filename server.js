const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');

// יבוא מודולים 
const llmService = require('./src/api/llmService');
const medicalDataSystem = require('./src/core/medicalDataSystem');
const securityManager = require('./src/security/securityManager');

// יצירת שרת Express
const app = express();

// הגדרת middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// נתיבי API

// קבלת שאלות דינמיות - מעודכן לתמיכה בניתוח תשובות קודמות
app.post('/api/dynamic-questions', async (req, res) => {
  try {
    const patientRecord = req.body;
    
    // לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "api_access",
      endpoint: "/api/dynamic-questions",
      timestamp: new Date().toISOString()
    });
    
    // קבלת שאלות דינמיות מהמערכת - מעבירים גם את התשובות הקודמות לניתוח
    const questions = medicalDataSystem.getDynamicQuestions(
      patientRecord.patientInfo.mainComplaint,
      patientRecord.standardAnswers || {}
    );
    
    res.json({ questions });
  } catch (error) {
    console.error('שגיאה בקבלת שאלות דינמיות:', error);
    res.status(500).json({ error: 'שגיאה בהפקת שאלות דינמיות' });
  }
});

// יצירת סיכום אנמנזה - מעודכן לתמיכה בפרופיל
app.post('/api/generate-summary', async (req, res) => {
  try {
    const patientRecord = req.body;
    
    // לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "api_access",
      endpoint: "/api/generate-summary",
      timestamp: new Date().toISOString()
    });
    
    // יצירת סיכום אנמנזה
    const usingRealAPI = process.env.NODE_ENV === 'production' || process.env.USE_OPENAI_API === 'true';
    console.log(`יוצר סיכום באמצעות ${usingRealAPI ? 'OpenAI API' : 'סימולציה מקומית'}`);
    
    const patientRecordWithSummary = await medicalDataSystem.generateSummary(patientRecord);
    
    res.json({ 
      summary: patientRecordWithSummary.summary,
      redFlags: medicalDataSystem.checkForRedFlags(patientRecord),
      source: usingRealAPI ? 'api' : 'local'
    });
  } catch (error) {
    console.error('שגיאה ביצירת סיכום:', error);
    res.status(500).json({ error: 'שגיאה ביצירת סיכום אנמנזה' });
  }
});
// שליחת הסיכום לרופא
app.post('/api/send-summary', async (req, res) => {
  try {
    const { patientRecord, doctorEmail } = req.body;
    
    // במציאות, כאן היה קוד לשליחת הסיכום בדוא"ל
    // לצורך הדוגמה, נדמה הצלחה
    
    // לוג אירוע שליחה
    securityManager.logSecurityEvent({
      eventType: "summary_sent",
      recipient: doctorEmail,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: `הסיכום נשלח בהצלחה לרופא/ה ${doctorEmail}`
    });
  } catch (error) {
    console.error('שגיאה בשליחת הסיכום:', error);
    res.status(500).json({ error: 'שגיאה בשליחת הסיכום' });
  }
});

// נתיב API חדש לשמירת נתוני הפרופיל
app.post('/api/save-profile', async (req, res) => {
  try {
    const { patientId, profile, medicalSections, allergies, medications } = req.body;
    
    // לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "profile_update",
      patientId,
      timestamp: new Date().toISOString()
    });
    
    // במציאות היינו שומרים במסד נתונים
    // כרגע רק נחזיר הצלחה
    
    res.json({ 
      success: true, 
      message: `פרופיל רפואי נשמר בהצלחה`
    });
  } catch (error) {
    console.error('שגיאה בשמירת פרופיל רפואי:', error);
    res.status(500).json({ error: 'שגיאה בשמירת פרופיל רפואי' });
  }
});

// הפעלת השרת
const PORT = config.server.port || 3000;
app.listen(PORT, () => {
  console.log(`השרת פועל בכתובת http://localhost:${PORT}`);
  console.log(`גש ל-http://localhost:${PORT} בדפדפן כדי להשתמש במערכת`);
});
// הוסף לקובץ server.js
app.get('/api/test-openai-connection', async (req, res) => {
  try {
    const isConnected = await llmService.testApiConnection();
    res.json({ success: isConnected });
  } catch (error) {
    res.status(500).json({ error: 'שגיאה בבדיקת חיבור ל-OpenAI API' });
  }
});

// הוסף לקובץ server.js
app.get('/api/test-openai', async (req, res) => {
  try {
    const isConnected = await llmService.testApiConnection();
    if (isConnected) {
      const testResponse = await llmService.sendPrompt("טקסט קצר לדוגמה עבור בדיקת חיבור");
      res.json({ 
        success: true, 
        connected: true,
        response: testResponse,
        usingRealAPI: process.env.NODE_ENV === 'production' || process.env.USE_OPENAI_API === 'true'
      });
    } else {
      res.json({ 
        success: false, 
        connected: false,
        usingRealAPI: process.env.NODE_ENV === 'production' || process.env.USE_OPENAI_API === 'true'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'שגיאה בבדיקת חיבור ל-OpenAI API' });
  }
});

// הוסף את זה לקובץ server.js
app.get('/api/debug-openai', async (req, res) => {
  try {
    // בדיקה שמפתח API קיים
    const apiKey = process.env.OPENAI_API_KEY || config.openai.apiKey;
    
    if (!apiKey) {
      return res.json({
        success: false,
        error: "מפתח API לא קיים",
        env_key: !!process.env.OPENAI_API_KEY,
        config_key: !!config.openai.apiKey
      });
    }
    
    // ניסיון להתחבר ל-API באופן פשוט
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return res.json({
          success: true,
          models_count: data.data.length,
          first_models: data.data.slice(0, 3).map(m => m.id),
          api_key_start: apiKey.substring(0, 7) // רק תחילת המפתח לבדיקת תקינות
        });
      } else {
        return res.json({
          success: false,
          error: "תשובה שלילית מהשרת",
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (fetchError) {
      return res.json({
        success: false,
        error: "שגיאה בפנייה לשרת",
        message: fetchError.message
      });
    }
  } catch (error) {
    return res.json({
      success: false,
      error: "שגיאה כללית",
      message: error.message
    });
  }
});
// דוגמה מלאה (איחוד - merge) ב-server.js:

app.post('/api/dynamic-questions', async (req, res) => {
  try {
    const { patientInfo, standardAnswers } = req.body;

    // 1) לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "api_access",
      endpoint: "/api/dynamic-questions",
      timestamp: new Date().toISOString()
    });

    // 2) שאלות מהלוגיקה הקיימת
    const localQuestions = medicalDataSystem.getDynamicQuestions(
      patientInfo.mainComplaint,
      standardAnswers || {}
    );

    // 3) שאלות מ-ChatGPT באמצעות llmService
    const prompt = `
      התלונה העיקרית: "${patientInfo.mainComplaint}"
      תשובות קודמות: ${JSON.stringify(standardAnswers, null, 2)}

      צור 3-5 שאלות המשך בעברית, ללא מספור, שורה לכל שאלה.
    `.trim();

    const responseText = await llmService.sendPrompt(prompt);
    const lines = responseText.split('\n').map(l => l.trim()).filter(Boolean);

    const gptQuestions = lines.map(line => ({
      type: 'multiline',
      question: line
    }));

    // 4) איחוד השאלות
    const questions = [...localQuestions, ...gptQuestions];

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    console.error('שגיאה בקבלת שאלות דינמיות:', error);
    res.status(500).json({ error: 'שגיאה בהפקת שאלות דינמיות' });
  }
});

// 1. עדכן את server.js להוספת נקודת קצה לשאלות דינמיות
// הוסף למודול שרת Express הקיים:

app.post('/api/get-dynamic-questions', async (req, res) => {
  try {
    const { complaint, previousAnswers } = req.body;
    
    // לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "api_access",
      endpoint: "/api/get-dynamic-questions",
      timestamp: new Date().toISOString()
    });
    
    // בניית פרומפט לשאלות המשך
    const prompt = `
      התלונה העיקרית של המטופל/ת: "${complaint}"
      
      התשובות הקודמות שניתנו הן:
      ${JSON.stringify(previousAnswers, null, 2)}
      
      אנא צור/י 3 עד 5 שאלות המשך רפואיות נוספות, רלוונטיות וממוקדות,
      בעברית. כתוב/י כל שאלה בשורה חדשה, ללא מספור וללא פרטים נוספים.
    `.trim();
    
    // שליחת בקשה לשירות ה-LLM
    const responseText = await llmService.sendPrompt(prompt);
    
    // פרסור התשובה לשאלות נפרדות
    const lines = responseText.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(line => line.endsWith('?'));
    
    // יצירת מערך שאלות במבנה הנדרש
    const gptQuestions = lines.map(question => ({
      type: 'multiline',
      question: question
    }));
    
    // קבלת שאלות מקומיות סטנדרטיות
    const localQuestions = medicalDataSystem.getDynamicQuestions(complaint, previousAnswers);
    
    // שילוב השאלות המקומיות והשאלות מ-ChatGPT
    const combinedQuestions = [...localQuestions, ...gptQuestions];
    
    res.json({ 
      success: true, 
      questions: combinedQuestions,
      source: gptQuestions.length > 0 ? 'ai' : 'local'
    });
  } catch (error) {
    console.error('שגיאה בקבלת שאלות מ-ChatGPT:', error);
    
    // במקרה של שגיאה, החזר רק שאלות מקומיות
    const localQuestions = medicalDataSystem.getDynamicQuestions(complaint, previousAnswers);
    
    res.json({ 
      success: true, 
      questions: localQuestions,
      source: 'local',
      error: 'שימוש בשאלות מקומיות בשל שגיאה בקריאת API'
    });
  }
});


// נתיב API חדש להמלצות טיפוליות מבוססות AI
app.post('/api/get-treatment-recommendations', async (req, res) => {
  try {
    const { patientRecord } = req.body;
    
    // לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "api_access",
      endpoint: "/api/get-treatment-recommendations",
      timestamp: new Date().toISOString()
    });
    
    // יצירת פרומפט מותאם להמלצות טיפוליות
    const prompt = `
      אתה יועץ רפואי מקצועי. בהתבסס על המידע הבא, ספק המלצות טיפוליות מפורטות וברורות.
      
      פרטי המטופל:
      - גיל: ${patientRecord.patientInfo.age}
      - מין: ${patientRecord.patientInfo.gender === 'male' ? 'זכר' : 'נקבה'}
      - תלונה עיקרית: ${patientRecord.patientInfo.mainComplaint}
      - פרופיל רפואי: ${patientRecord.patientInfo.profile}
      - אלרגיות: ${patientRecord.patientInfo.allergies}
      - תרופות קבועות: ${patientRecord.patientInfo.medications}
      ${patientRecord.patientInfo.smoking === 'yes' ? '- מעשן/ת' : '- לא מעשן/ת'}
      
      מידע מהאנמנזה:
      ${Object.entries(patientRecord.standardAnswers || {})
        .map(([q, a]) => `- ${q}: ${a}`)
        .join('\n')}
      ${Object.entries(patientRecord.dynamicAnswers || {})
        .map(([q, a]) => `- ${q}: ${a}`)
        .join('\n')}
      
      מדדים חיוניים:
      ${Object.entries(patientRecord.vitalSigns || {})
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n')}
      
      ספק המלצות טיפוליות שכוללות:
      1. המלצות טיפול עצמי והקלה בבית
      2. המלצות לגבי תרופות ללא מרשם (אם רלוונטי)
      3. מתי מומלץ לפנות לרופא/ה (סימנים מדאיגים)
      4. מידע על משך זמן צפוי להחלמה והמשך טיפול
      
      פורמט את התשובה תחת הכותרת "המלצות לטיפול:" וארגן אותה בסעיפים ברורים.
    `;
    
    // שליחת הפרומפט ל-LLM
    const recommendations = await llmService.sendPrompt(prompt);
    
    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('שגיאה בהפקת המלצות טיפוליות:', error);
    
    // במקרה של שגיאה, שימוש בפונקציה מקומית
    const localRecommendations = medicalDataSystem.generateRecommendations 
      ? medicalDataSystem.generateRecommendations(req.body.patientRecord)
      : "לא ניתן היה להפיק המלצות טיפוליות בשל תקלה טכנית.";
    
    res.json({
      success: true,
      recommendations: localRecommendations,
      source: 'local'
    });
  }
});

// הוסף גם את הנתיב הבא
app.post('/api/get-dynamic-questions', async (req, res) => {
  try {
    const { complaint, previousAnswers } = req.body;
    
    // לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "api_access",
      endpoint: "/api/get-dynamic-questions",
      timestamp: new Date().toISOString()
    });
    
    // בניית פרומפט לשאלות המשך
    const prompt = `
      התלונה העיקרית של המטופל/ת: "${complaint}"
      
      התשובות הקודמות שניתנו הן:
      ${JSON.stringify(previousAnswers, null, 2)}
      
      אנא צור/י 3 עד 5 שאלות המשך רפואיות נוספות, רלוונטיות וממוקדות,
      בעברית. כתוב/י כל שאלה בשורה חדשה, ללא מספור וללא פרטים נוספים.
    `.trim();
    
    // שליחת בקשה לשירות ה-LLM
    const responseText = await llmService.sendPrompt(prompt);
    
    // פרסור התשובה לשאלות נפרדות
    const lines = responseText.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(line => line.endsWith('?'));
    
    // יצירת מערך שאלות במבנה הנדרש
    const gptQuestions = lines.map(question => ({
      type: 'multiline',
      question: question
    }));
    
    // קבלת שאלות מקומיות סטנדרטיות
    const localQuestions = medicalDataSystem.getDynamicQuestions(complaint, previousAnswers);
    
    // שילוב השאלות המקומיות והשאלות מ-ChatGPT
    const combinedQuestions = [...localQuestions, ...gptQuestions];
    
    res.json({ 
      success: true, 
      questions: combinedQuestions,
      source: gptQuestions.length > 0 ? 'ai' : 'local'
    });
  } catch (error) {
    console.error('שגיאה בקבלת שאלות מ-ChatGPT:', error);
    
    // במקרה של שגיאה, החזר רק שאלות מקומיות
    const localQuestions = medicalDataSystem.getDynamicQuestions(req.body.complaint, req.body.previousAnswers);
    
    res.json({ 
      success: true, 
      questions: localQuestions,
      source: 'local',
      error: 'שימוש בשאלות מקומיות בשל שגיאה בקריאת API'
    });
  }
});
// הוסף לקובץ server.js
app.post('/api/get-dynamic-questions', async (req, res) => {
  try {
    const { complaint, previousAnswers } = req.body;
    
    // לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "api_access",
      endpoint: "/api/get-dynamic-questions",
      timestamp: new Date().toISOString()
    });
    
    // בניית פרומפט לשאלות המשך
    const prompt = `
      התלונה העיקרית של המטופל/ת: "${complaint}"
      
      התשובות הקודמות שניתנו הן:
      ${JSON.stringify(previousAnswers, null, 2)}
      
      אנא צור/י 3 עד 5 שאלות המשך רפואיות נוספות, רלוונטיות וממוקדות,
      בעברית. כתוב/י כל שאלה בשורה חדשה, ללא מספור וללא פרטים נוספים.
    `.trim();
    
    // שליחת בקשה לשירות ה-LLM
    const responseText = await llmService.sendPrompt(prompt);
    
    // פרסור התשובה לשאלות נפרדות
    const lines = responseText.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(line => line.endsWith('?'));
    
    // יצירת מערך שאלות במבנה הנדרש
    const gptQuestions = lines.map(question => ({
      type: 'multiline',
      question: question
    }));
    
    // קבלת שאלות מקומיות סטנדרטיות
    const localQuestions = medicalDataSystem.getDynamicQuestions(complaint, previousAnswers);
    
    // שילוב השאלות המקומיות והשאלות מ-ChatGPT
    const combinedQuestions = [...localQuestions, ...gptQuestions];
    
    res.json({ 
      success: true, 
      questions: combinedQuestions,
      source: gptQuestions.length > 0 ? 'ai' : 'local'
    });
  } catch (error) {
    console.error('שגיאה בקבלת שאלות מ-ChatGPT:', error);
    
    // במקרה של שגיאה, החזר רק שאלות מקומיות
    const localQuestions = medicalDataSystem.getDynamicQuestions(req.body.complaint, req.body.previousAnswers);
    
    res.json({ 
      success: true, 
      questions: localQuestions,
      source: 'local',
      error: 'שימוש בשאלות מקומיות בשל שגיאה בקריאת API'
    });
  }
});