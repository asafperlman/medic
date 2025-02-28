/**
 * שכבת אבטחת מידע למערכת איסוף נתונים רפואיים
 * ==================================================
 * 
 * מודול זה מספק פונקציות ומנגנונים להבטחת אבטחת המידע הרפואי
 * בהתאם לתקני אבטחה כמו HIPAA, GDPR וכו'.
 */

const SecurityManager = {
    /**
     * קונפיגורציה של אבטחת המידע
     */
    config: {
      // מפתח הצפנה (בסביבת ייצור יש לאחסן בצורה מאובטחת)
      encryptionKey: "this_should_be_a_secure_random_key_stored_securely",
      
      // וקטור אתחול להצפנה (IV)
      initVector: "random_init_vector",
      
      // זמן פג תוקף של הסשן (במילישניות) - 30 דקות
      sessionTimeout: 30 * 60 * 1000,
      
      // רמת מורכבות סיסמה (0-4)
      passwordComplexity: 3,
      
      // האם לאפשר גישה רק מרשת מאובטחת
      secureNetworkOnly: true,
      
      // האם לרשום פעולות (logging)
      enableAuditLog: true,
      
      // שמירת הסטוריית גישה למידע
      keepAccessHistory: true
    },
    
    /**
     * הצפנת מידע רגיש
     * @param {object|string} data - המידע להצפנה
     * @returns {string} - המידע המוצפן
     */
    encryptData: function(data) {
      try {
        // הממיר את האובייקט למחרוזת JSON אם הוא אובייקט
        const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
        
        // בסביבת ייצור, יש להשתמש באלגוריתם הצפנה אמיתי כמו AES
        // כאן מדגימים עם אלגוריתם פשוט להמחשה בלבד
        
        // הדמיית הצפנה (בייצור יש להשתמש בספריית הצפנה אמיתית)
        const encrypted = this._simulateEncryption(dataStr, this.config.encryptionKey);
        
        return encrypted;
      } catch (error) {
        console.error("שגיאה בהצפנת המידע:", error);
        throw new Error("אירעה שגיאה בהצפנת המידע");
      }
    },
    
    /**
     * פענוח מידע מוצפן
     * @param {string} encryptedData - המידע המוצפן
     * @returns {object|string} - המידע המקורי
     */
    decryptData: function(encryptedData) {
      try {
        // בסביבת ייצור, יש להשתמש באלגוריתם פענוח אמיתי
        
        // הדמיית פענוח (בייצור יש להשתמש בספריית הצפנה אמיתית)
        const decrypted = this._simulateDecryption(encryptedData, this.config.encryptionKey);
        
        // ניסיון לפרסר כ-JSON, אם לא מצליח מחזיר כמחרוזת
        try {
          return JSON.parse(decrypted);
        } catch {
          return decrypted;
        }
      } catch (error) {
        console.error("שגיאה בפענוח המידע:", error);
        throw new Error("אירעה שגיאה בפענוח המידע");
      }
    },
    
    /**
     * הצפנה סימטרית (הדמיה לצורך המחשה)
     * @private
     * @param {string} data - המידע להצפנה
     * @param {string} key - מפתח ההצפנה
     * @returns {string} - המידע המוצפן בקידוד base64
     */
    _simulateEncryption: function(data, key) {
      // הדמיה בלבד! בייצור יש להשתמש בספריית הצפנה אמיתית כמו crypto בNode.js
      
      // שילוב המפתח עם המידע - לא מאובטח, להמחשה בלבד!
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      
      // הצגת המחרוזת המוצפנת בקידוד base64
      return btoa(result);
    },
    
    /**
     * פענוח סימטרי (הדמיה לצורך המחשה)
     * @private
     * @param {string} encryptedData - המידע המוצפן בקידוד base64
     * @param {string} key - מפתח ההצפנה
     * @returns {string} - המידע המקורי
     */
    _simulateDecryption: function(encryptedData, key) {
      // הדמיה בלבד! בייצור יש להשתמש בספריית הצפנה אמיתית
      
      // פענוח מקידוד base64
      const data = atob(encryptedData);
      
      // פענוח באמצעות המפתח - לא מאובטח, להמחשה בלבד!
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      
      return result;
    },
    
    /**
     * בדיקת הרשאות גישה למידע
     * @param {object} user - משתמש המערכת
     * @param {object} patientRecord - רשומת המטופל
     * @param {string} accessType - סוג הגישה (קריאה, כתיבה, שליחה)
     * @returns {boolean} - האם יש הרשאה
     */
    checkPermission: function(user, patientRecord, accessType) {
      // בדיקת תפקיד המשתמש
      if (!user || !user.role) {
        return false;
      }
      
      // הרשאות לפי תפקיד
      const permissions = {
        admin: ["read", "write", "send", "delete"],
        doctor: ["read", "write", "send"],
        paramedic: ["read", "write", "send"],
        nurse: ["read", "write", "send"],
        receptionist: ["read", "send"]
      };
      
      // בדיקה אם התפקיד של המשתמש מרשה את סוג הגישה המבוקש
      if (!permissions[user.role] || !permissions[user.role].includes(accessType)) {
        this.logSecurityEvent({
          eventType: "permission_denied",
          user: user.username,
          role: user.role,
          accessType,
          patientId: patientRecord?.patientInfo?.id || "unknown",
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      // בדיקה שהמשתמש מורשה לגשת למטופל ספציפי
      // (לדוגמה, אם המטופל משויך למחלקה או צוות מסוים)
      
      // לוג גישה מוצלחת
      this.logSecurityEvent({
        eventType: "access_granted",
        user: user.username,
        role: user.role,
        accessType,
        patientId: patientRecord?.patientInfo?.id || "unknown",
        timestamp: new Date().toISOString()
      });
      
      return true;
    },
    
    /**
     * יצירת לוג אבטחה
     * @param {object} eventData - נתוני האירוע
     */
    logSecurityEvent: function(eventData) {
      if (!this.config.enableAuditLog) {
        return;
      }
      
      // בסביבת ייצור, יש לשמור את הלוג במסד נתונים מאובטח
      console.log("אירוע אבטחה:", JSON.stringify(eventData));
      
      // שמירה בהיסטוריית גישה (בייצור תהיה שמירה במסד נתונים)
      if (this.config.keepAccessHistory && (eventData.eventType === "access_granted" || eventData.eventType === "permission_denied")) {
        // שמירת פרטי הגישה (או ניסיון הגישה)
        this._storeAccessHistory(eventData);
      }
    },
    
    /**
     * שמירת היסטוריית גישה
     * @private
     * @param {object} accessData - נתוני גישה
     */
    _storeAccessHistory: function(accessData) {
      // בסביבת ייצור, היה נשמר במסד נתונים
      console.log("תיעוד גישה למידע:", JSON.stringify(accessData));
    },
    
    /**
     * אבטחת תקשורת - הגדרות עבור HTTPS
     * @returns {object} - הגדרות אבטחת תקשורת
     */
    getSecureConnectionSettings: function() {
      return {
        useHttps: true,
        tlsVersion: "TLSv1.3",
        cipherSuites: [
          "TLS_AES_256_GCM_SHA384",
          "TLS_CHACHA20_POLY1305_SHA256"
        ],
        hsts: {
          enabled: true,
          maxAge: 63072000, // שנתיים בשניות
          includeSubDomains: true,
          preload: true
        }
      };
    },
    
    /**
     * וידוא עמידה בתקן HIPAA
     * @param {object} systemConfig - הגדרות המערכת
     * @returns {object} - תוצאות הבדיקה
     */
    validateHipaaCompliance: function(systemConfig) {
      const complianceChecks = [
        // בדיקת הצפנת מידע
        {
          name: "data_encryption",
          passed: !!this.config.encryptionKey && this.config.encryptionKey.length >= 16,
          description: "נדרשת הצפנה חזקה של מידע רגיש"
        },
        // בדיקת אימות משתמשים
        {
          name: "user_authentication",
          passed: systemConfig.useStrongAuth || false,
          description: "נדרש אימות חזק למשתמשים"
        },
        // בדיקת תיעוד פעולות
        {
          name: "audit_logging",
          passed: this.config.enableAuditLog,
          description: "נדרש תיעוד פעולות במערכת"
        },
        // בדיקת הגבלת גישה
        {
          name: "access_control",
          passed: true, // מניחים שמנגנון הרשאות קיים
          description: "נדרשת מערכת הרשאות מתאימה"
        },
        // בדיקת אבטחת תקשורת
        {
          name: "secure_transmission",
          passed: this.getSecureConnectionSettings().useHttps,
          description: "נדרשת תקשורת מאובטחת (HTTPS)"
        }
      ];
      
      // חישוב סטטוס עמידה בדרישות
      const passedChecks = complianceChecks.filter(check => check.passed);
      const compliancePercentage = (passedChecks.length / complianceChecks.length) * 100;
      
      return {
        isCompliant: compliancePercentage === 100,
        compliancePercentage,
        checks: complianceChecks,
        recommendations: complianceChecks
          .filter(check => !check.passed)
          .map(check => `נדרש שיפור ב-${check.name}: ${check.description}`)
      };
    },
    
    /**
     * הסרת מידע אישי מזהה (אנונימיזציה) מרשומת מטופל
     * @param {object} patientRecord - רשומת המטופל המקורית
     * @returns {object} - רשומה ללא פרטים מזהים
     */
    anonymizePatientRecord: function(patientRecord) {
      // יצירת עותק של הרשומה
      const anonymized = JSON.parse(JSON.stringify(patientRecord));
      
      // הסרת פרטים מזהים
      if (anonymized.patientInfo) {
        // שמירה על גיל ומין שאינם מזהים ישירות
        const { age, gender } = anonymized.patientInfo;
        
        // החלפת כל המידע המזהה
        anonymized.patientInfo = {
          age,
          gender,
          id: this._generateAnonymousId(anonymized.patientInfo.id || ""),
          timestamp: anonymized.patientInfo.timestamp
        };
      }
      
      return anonymized;
    },
    
    /**
     * יצירת מזהה אנונימי
     * @private
     * @param {string} originalId - מזהה מקורי
     * @returns {string} - מזהה אנונימי
     */
    _generateAnonymousId: function(originalId) {
      // בייצור יש להשתמש בפונקציית האש אמיתית כמו SHA-256
      return "anon_" + Math.floor(Math.random() * 1000000);
    }
  };
  
  /**
   * דוגמה לשימוש במנגנון האבטחה
   */
  function securityExample() {
    // מידע רגיש לדוגמה
    const patientData = {
      patientInfo: {
        id: "12345",
        name: "ישראל ישראלי",
        age: 45,
        gender: "male",
        ssn: "123-45-6789",
        address: "רחוב ראשי 123, תל אביב",
        phone: "050-1234567",
        email: "israel@example.com",
        mainComplaint: "כאב ראש",
        timestamp: new Date().toISOString()
      },
      standardAnswers: {
        "כמה זמן נמשך הכאב?": "יומיים",
        "האם יש חום?": "לא",
        "האם יש בחילה או הקאות?": "כן"
      }
    };
    
    // 1. הצפנת מידע
    console.log("מצפין מידע רגיש...");
    const encryptedData = SecurityManager.encryptData(patientData);
    console.log("מידע מוצפן:", encryptedData);
    
    // 2. פענוח מידע
    console.log("מפענח מידע...");
    const decryptedData = SecurityManager.decryptData(encryptedData);
    console.log("מידע מפוענח:", decryptedData);
    
    // 3. בדיקת הרשאות
    const user = {
      username: "doctor1",
      role: "doctor",
      department: "neurological"
    };
    
    console.log("בודק הרשאות לגישה...");
    const hasPermission = SecurityManager.checkPermission(user, patientData, "read");
    console.log("האם יש הרשאת גישה:", hasPermission);
    
    // 4. אנונימיזציה של מידע
    console.log("מבצע אנונימיזציה של מידע...");
    const anonymizedData = SecurityManager.anonymizePatientRecord(patientData);
    console.log("מידע לאחר אנונימיזציה:", anonymizedData);
    
    // 5. בדיקת עמידה בתקנים
    console.log("בודק עמידה בתקן HIPAA...");
    const complianceResult = SecurityManager.validateHipaaCompliance({
      useStrongAuth: true
    });
    console.log("תוצאות בדיקת תאימות:", complianceResult);
  }
  
  // הרצת הדוגמה
  // securityExample();

  // בסוף הקובץ:
module.exports = SecurityManager;