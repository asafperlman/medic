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

// עדכון נקודת הקצה בקובץ server.js
app.post('/api/dynamic-questions', async (req, res) => {
  try {
    const { patientInfo, standardAnswers } = req.body;

    // לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "api_access",
      endpoint: "/api/dynamic-questions",
      timestamp: new Date().toISOString()
    });

    // 1. שאלות מהמערכת המקומית (כגיבוי)
    const localQuestions = medicalDataSystem.getDynamicQuestions(
      patientInfo.mainComplaint,
      standardAnswers || {}
    );
    
    // 2. שאלות מ-AI באמצעות ChatGPT
    let aiQuestions = [];
    let source = 'local';
    
    if (config.openai.apiKey) {
      try {
        // בניית פרומפט מובנה ומפורט לקבלת תשובות איכותיות
        const prompt = `
אתה רופא מומחה בעל ניסיון רב. המטופל הגיע עם התלונה העיקרית: "${patientInfo.mainComplaint}".

פרטי המטופל:
- גיל: ${patientInfo.age}
- מין: ${patientInfo.gender === 'male' ? 'זכר' : 'נקבה'}
- פרופיל רפואי: ${patientInfo.profile}
- סעיפים רפואיים: ${patientInfo.medicalSections || "ללא סעיפים"}
- אלרגיות: ${patientInfo.allergies || "ללא אלרגיות ידועות"}
- תרופות קבועות: ${patientInfo.medications || "לא נוטל תרופות באופן קבוע"}
- מעשן: ${patientInfo.smoking === 'yes' ? 'כן' : 'לא'}

המטופל כבר ענה על השאלות הבאות:
${Object.entries(standardAnswers)
  .map(([q, a]) => `- ${q}: ${a}`)
  .join('\n')}

בהתבסס על המידע הזה, צור בדיוק 5 שאלות המשך מעמיקות וספציפיות שיעזרו להבין יותר לעומק את מצבו.
השאלות צריכות להיות קשורות ישירות לתלונה ולתשובות הקודמות, ולחפש מידע קריטי.

פורמט התשובה:
החזר רק את השאלות עצמן, כל שאלה בשורה נפרדת, ללא מספור ועם סוג השאלה בסוגריים מרובעים בסוף כך:

האם יש לך כאב בצד שמאל של הראש? [yesNo]
מה עוצמת הכאב בסולם מ-1 עד 10? [scale]
היכן בדיוק ממוקם הכאב ברקה? [location]
מתי התחיל הכאב ומה משך הזמן שהוא נמשך? [duration]
תאר בפירוט את אופי הכאב - פועם, חד, מתמשך וכו'. [multiline]

סוגי השאלות האפשריים: yesNo, scale, multiline, multiselect, duration, value, location, characteristic.
`;
        
        // שליחת הפרומפט ל-ChatGPT
        const responseText = await llmService.sendPrompt(prompt);
        
        // פירוק התשובה לשאלות נפרדות
        aiQuestions = parseAIResponse(responseText);
        
        if (aiQuestions.length > 0) {
          source = 'ai';
        }
      } catch (error) {
        console.error('שגיאה בקבלת שאלות מ-AI:', error);
        // המשך עם שאלות מקומיות במקרה של שגיאה
      }
    }
    
    // 3. שילוב השאלות וסינון כפילויות
    const combinedQuestions = combineQuestions(localQuestions, aiQuestions);
    
    res.json({
      success: true,
      questions: combinedQuestions,
      source: source
    });
  } catch (error) {
    console.error('שגיאה ביצירת שאלות דינמיות:', error);
    res.status(500).json({ 
      success: false, 
      questions: medicalDataSystem.getDefaultDynamicQuestions(),
      source: 'fallback'
    });
  }
});

// פונקציית עזר - פירוק תשובת AI לשאלות
function parseAIResponse(responseText) {
  // חלוקה לשורות וסינון שורות ריקות
  const lines = responseText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.includes('?'));
  
  return lines.map(line => {
    // חילוץ סוג השאלה מסוגריים מרובעים אם קיימים
    const typeMatch = line.match(/\[(.*?)\]$/);
    const type = typeMatch ? typeMatch[1].trim() : 'multiline';
    
    // הסרת הסוגריים מטקסט השאלה
    const questionText = line.replace(/\[.*?\]$/, '').trim();
    
    // בניית אובייקט השאלה
    const question = {
      type: type,
      question: questionText
    };
    
    // הוספת שדה followUp לשאלות מסוג yesNo
    if (type === 'yesNo') {
      question.followUp = 'אנא פרט';
    }
    
    // הוספת אפשרויות לשאלות מסוג multiselect
    if (type === 'multiselect') {
      // אפשר להוסיף אפשרויות ברירת מחדל לפי התוכן
      question.options = [];
    }
    
    return question;
  });
}

// פונקציית עזר - שילוב שאלות וסינון כפילויות
function combineQuestions(localQuestions, aiQuestions) {
  // מערך משולב
  const combined = [...localQuestions];
  
  // הוספת שאלות AI, הימנעות מכפילויות
  for (const aiQuestion of aiQuestions) {
    // בדיקה אם השאלה דומה לשאלה קיימת
    const isDuplicate = combined.some(q => 
      areSimilarQuestions(q.question, aiQuestion.question)
    );
    
    if (!isDuplicate) {
      combined.push(aiQuestion);
    }
  }
  
  return combined;
}

// בדיקת דמיון בין שאלות
function areSimilarQuestions(q1, q2) {
  // בדיקת דמיון פשוטה
  const normalize = text => text.toLowerCase().replace(/[.,?!]/g, '').trim();
  const sim1 = normalize(q1);
  const sim2 = normalize(q2);
  
  return sim1 === sim2 || sim1.includes(sim2) || sim2.includes(sim1);
}

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

// עדכון נקודת הקצה בקובץ server.js
app.post('/api/dynamic-questions', async (req, res) => {
  try {
    const { patientInfo, standardAnswers } = req.body;

    // לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "api_access",
      endpoint: "/api/dynamic-questions",
      timestamp: new Date().toISOString()
    });

    // 1. שאלות מהמערכת המקומית (כגיבוי)
    const localQuestions = medicalDataSystem.getDynamicQuestions(
      patientInfo.mainComplaint,
      standardAnswers || {}
    );
    
    // 2. שאלות מ-AI באמצעות ChatGPT
    let aiQuestions = [];
    let source = 'local';
    
    if (config.openai.apiKey) {
      try {
        // בניית פרומפט מובנה ומפורט לקבלת תשובות איכותיות
        const prompt = `
אתה רופא מומחה בעל ניסיון רב. המטופל הגיע עם התלונה העיקרית: "${patientInfo.mainComplaint}".

פרטי המטופל:
- גיל: ${patientInfo.age}
- מין: ${patientInfo.gender === 'male' ? 'זכר' : 'נקבה'}
- פרופיל רפואי: ${patientInfo.profile}
- סעיפים רפואיים: ${patientInfo.medicalSections || "ללא סעיפים"}
- אלרגיות: ${patientInfo.allergies || "ללא אלרגיות ידועות"}
- תרופות קבועות: ${patientInfo.medications || "לא נוטל תרופות באופן קבוע"}
- מעשן: ${patientInfo.smoking === 'yes' ? 'כן' : 'לא'}

המטופל כבר ענה על השאלות הבאות:
${Object.entries(standardAnswers)
  .map(([q, a]) => `- ${q}: ${a}`)
  .join('\n')}

בהתבסס על המידע הזה, צור בדיוק 5 שאלות המשך מעמיקות וספציפיות שיעזרו להבין יותר לעומק את מצבו.
השאלות צריכות להיות קשורות ישירות לתלונה ולתשובות הקודמות, ולחפש מידע קריטי.

פורמט התשובה:
החזר רק את השאלות עצמן, כל שאלה בשורה נפרדת, ללא מספור ועם סוג השאלה בסוגריים מרובעים בסוף כך:

האם יש לך כאב בצד שמאל של הראש? [yesNo]
מה עוצמת הכאב בסולם מ-1 עד 10? [scale]
היכן בדיוק ממוקם הכאב ברקה? [location]
מתי התחיל הכאב ומה משך הזמן שהוא נמשך? [duration]
תאר בפירוט את אופי הכאב - פועם, חד, מתמשך וכו'. [multiline]

סוגי השאלות האפשריים: yesNo, scale, multiline, multiselect, duration, value, location, characteristic.
`;
        
        // שליחת הפרומפט ל-ChatGPT
        const responseText = await llmService.sendPrompt(prompt);
        
        // פירוק התשובה לשאלות נפרדות
        aiQuestions = parseAIResponse(responseText);
        
        if (aiQuestions.length > 0) {
          source = 'ai';
        }
      } catch (error) {
        console.error('שגיאה בקבלת שאלות מ-AI:', error);
        // המשך עם שאלות מקומיות במקרה של שגיאה
      }
    }
    
    // 3. שילוב השאלות וסינון כפילויות
    const combinedQuestions = combineQuestions(localQuestions, aiQuestions);
    
    res.json({
      success: true,
      questions: combinedQuestions,
      source: source
    });
  } catch (error) {
    console.error('שגיאה ביצירת שאלות דינמיות:', error);
    res.status(500).json({ 
      success: false, 
      questions: medicalDataSystem.getDefaultDynamicQuestions(),
      source: 'fallback'
    });
  }
});

// פונקציית עזר - פירוק תשובת AI לשאלות
function parseAIResponse(responseText) {
  // חלוקה לשורות וסינון שורות ריקות
  const lines = responseText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.includes('?'));
  
  return lines.map(line => {
    // חילוץ סוג השאלה מסוגריים מרובעים אם קיימים
    const typeMatch = line.match(/\[(.*?)\]$/);
    const type = typeMatch ? typeMatch[1].trim() : 'multiline';
    
    // הסרת הסוגריים מטקסט השאלה
    const questionText = line.replace(/\[.*?\]$/, '').trim();
    
    // בניית אובייקט השאלה
    const question = {
      type: type,
      question: questionText
    };
    
    // הוספת שדה followUp לשאלות מסוג yesNo
    if (type === 'yesNo') {
      question.followUp = 'אנא פרט';
    }
    
    // הוספת אפשרויות לשאלות מסוג multiselect
    if (type === 'multiselect') {
      // אפשר להוסיף אפשרויות ברירת מחדל לפי התוכן
      question.options = [];
    }
    
    return question;
  });
}

// פונקציית עזר - שילוב שאלות וסינון כפילויות
function combineQuestions(localQuestions, aiQuestions) {
  // מערך משולב
  const combined = [...localQuestions];
  
  // הוספת שאלות AI, הימנעות מכפילויות
  for (const aiQuestion of aiQuestions) {
    // בדיקה אם השאלה דומה לשאלה קיימת
    const isDuplicate = combined.some(q => 
      areSimilarQuestions(q.question, aiQuestion.question)
    );
    
    if (!isDuplicate) {
      combined.push(aiQuestion);
    }
  }
  
  return combined;
}

// בדיקת דמיון בין שאלות
function areSimilarQuestions(q1, q2) {
  // בדיקת דמיון פשוטה
  const normalize = text => text.toLowerCase().replace(/[.,?!]/g, '').trim();
  const sim1 = normalize(q1);
  const sim2 = normalize(q2);
  
  return sim1 === sim2 || sim1.includes(sim2) || sim2.includes(sim1);
}


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


// הוסף לקובץ server.js
