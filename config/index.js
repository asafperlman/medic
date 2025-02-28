// config/index.js

require('dotenv').config();

module.exports = {
openai: {
    apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY, // ודא שהמפתח מגיע מהסביבה
    model: "gpt-3.5-turbo-0125", // מודל חסכוני יותר
    temperature: 0.2,            // ערך נמוך לתשובות עקביות
    maxTokens: 150,              // הגבלת אורך תשובה לחיסכון
    useCache: true,              // הפעלת מטמון
    cacheTTL: 86400000           // תוקף המטמון (24 שעות במילישניות)
},
    
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || "your_secure_encryption_key_min_32_chars",
    useHttps: false,             // בפיתוח - שנה ל-true בייצור
    enableAuditLog: true
  },
  server: {
    port: process.env.PORT || 3000,
    host: "localhost"
  },
  ui: {
    enableDarkMode: true,        // אפשרות למצב לילה
    responsiveDesign: true,      // תמיכה במכשירים ניידים
    autoSave: true,              // שמירה אוטומטית
    offlineSupport: true         // תמיכה בעבודה לא מקוונת
  }
};