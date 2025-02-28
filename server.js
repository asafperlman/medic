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
    
    // יצירת סיכום אנמנזה עם הגדרות הפרופיל החדשות
    const patientRecordWithSummary = medicalDataSystem.generateSummary(patientRecord);
    
    res.json({ 
      summary: patientRecordWithSummary.summary,
      redFlags: medicalDataSystem.checkForRedFlags(patientRecord)
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