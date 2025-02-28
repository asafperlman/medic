// אינטגרציה עם מודל שפה (LLM)
// ===========================

/**
 * מודול זה מספק פונקציות לתקשורת עם מודל שפה גדול (LLM)
 * באמצעות API של OpenAI או ספקים אחרים.
 * 
 * הוא מטפל ביצירת פרומפטים, שליחת בקשות ועיבוד תשובות.
 */

// קונפיגורציה
const config = require('../../config');

const LLMConfig = {
    // API מפתח של OpenAI (בסביבת ייצור יש לאחסן בצורה מאובטחת יותר)
    apiKey: "your_openai_api_key_here",
    
    // מודל ברירת מחדל
    defaultModel: "gpt-3.5-turbo",
    
    // כתובת API
    apiEndpoint: "https://api.openai.com/v1/chat/completions",
    
    // זמן המתנה מקסימלי (במילישניות)
    timeout: 15000,
    
    // מספר ניסיונות חוזרים במקרה של כישלון
    maxRetries: 3,
    
    // זמן המתנה בין ניסיונות חוזרים (במילישניות)
    retryDelay: 1000
  };
  
  // מודול ה-LLM
  const LLMService = {
    
    // קונפיגורציה
    config: {
      // שימוש במודל חסכוני בעלויות
      defaultModel: config.openai.model || "gpt-3.5-turbo-0125",
      apiEndpoint: "https://api.openai.com/v1/chat/completions",
      timeout: 15000,
      maxRetries: 2,
      retryDelay: 1000,
      
      // מטמון לתוצאות שכיחות
      useCache: config.openai.useCache,
      cacheTTL: config.openai.cacheTTL || 86400000, // 24 שעות במילישניות
    },
    
    // מטמון תוצאות
    responseCache: new Map(),
    
    // [כל הקוד מהקובץ שיצרנו]...
  };
  
  async function sendOptimizedPrompt(prompt, task = 'basic') {
    const modelsByTask = {
      'basic': 'gpt-3.5-turbo-0125',
      'advanced': 'gpt-3.5-turbo-0125',
      'complex': 'gpt-3.5-turbo-0125'
    };
    
    return this.sendPrompt(prompt, { model: modelsByTask[task] });
  }
  module.exports = LLMService;

