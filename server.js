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

// קבלת שאלות דינמיות
app.post('/api/dynamic-questions', async (req, res) => {
  try {
    const patientRecord = req.body;
    
    // לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "api_access",
      endpoint: "/api/dynamic-questions",
      timestamp: new Date().toISOString()
    });
    
    // הכנת פרומפט למודל השפה
    const prompt = llmService.createFollowupQuestionsPrompt(patientRecord);
    
    // שליחת הפרומפט למודל השפה
    const response = await llmService.sendPrompt(prompt);
    
    // עיבוד התשובה והחזרת השאלות
    const questions = llmService.parseFollowupQuestions(response);
    
    res.json({ questions });
  } catch (error) {
    console.error('שגיאה בקבלת שאלות דינמיות:', error);
    res.status(500).json({ error: 'שגיאה בהפקת שאלות דינמיות' });
  }
});

// יצירת סיכום אנמנזה
app.post('/api/generate-summary', async (req, res) => {
  try {
    const patientRecord = req.body;
    
    // לוג אירוע אבטחה
    securityManager.logSecurityEvent({
      eventType: "api_access",
      endpoint: "/api/generate-summary",
      timestamp: new Date().toISOString()
    });
    
    // הכנת פרומפט למודל השפה
    const prompt = llmService.createSummaryPrompt(patientRecord);
    
    // שליחת הפרומפט למודל השפה
    const summaryText = await llmService.sendPrompt(prompt);
    
    // עיבוד הסיכום
    const summary = llmService.processSummary(summaryText);
    
    res.json({ summary });
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

// הפעלת השרת
const PORT = config.server.port || 3000;
app.listen(PORT, () => {
  console.log(`השרת פועל בכתובת http://localhost:${PORT}`);
  console.log(`גש ל-http://localhost:${PORT} בדפדפן כדי להשתמש במערכת`);
});