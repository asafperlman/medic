// public/utils/offlineManager.js

/**
 * מנהל מצב לא מקוון - אחראי על שמירת נתונים מקומית וסנכרון כשיש חיבור
 * גרסה משופרת התומכת בפרופיל רפואי
 */
class OfflineManager {
    constructor() {
      this.storageKey = 'medical_system_offline_data';
      this.syncQueue = [];
      this.isOnline = navigator.onLine;
      
      // הקשבה לשינויים במצב החיבור
      window.addEventListener('online', this._handleConnectionChange.bind(this));
      window.addEventListener('offline', this._handleConnectionChange.bind(this));
      
      // טעינת נתונים קיימים
      this._loadFromStorage();
    }
    
    /**
     * מטפל בשינוי מצב החיבור
     */
    _handleConnectionChange() {
      this.isOnline = navigator.onLine;
      
      // הצגת הודעה לממשק המשתמש על שינוי מצב החיבור
      this._showConnectionStatusMessage();
      
      if (this.isOnline) {
        // אם יש חיבור, ננסה לסנכרן נתונים בתור
        this._syncOfflineData();
      }
    }
    
    /**
     * מציג הודעה זמנית על מצב החיבור
     * @private
     */
    _showConnectionStatusMessage() {
      // בדיקה אם קיים כבר אלמנט הודעה
      let messageElement = document.getElementById('connection-status-message');
      
      // אם לא קיים, צור אותו
      if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'connection-status-message';
        document.body.appendChild(messageElement);
      }
      
      // הגדר את תוכן ועיצוב ההודעה
      messageElement.textContent = this.isOnline ? 
        'חיבור לאינטרנט זוהה, הנתונים יסונכרנו' : 
        'אין חיבור לאינטרנט, המערכת עובדת במצב לא מקוון';
      
      messageElement.className = this.isOnline ? 
        'connection-status online' : 
        'connection-status offline';
      
      // הצג את ההודעה
      messageElement.style.display = 'block';
      
      // הסתר את ההודעה אחרי 3 שניות
      setTimeout(() => {
        messageElement.style.display = 'none';
      }, 3000);
    }
    
    /**
     * טוען נתונים מאחסון מקומי
     * @private
     */
    _loadFromStorage() {
      try {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          this.syncQueue = JSON.parse(data);
        }
      } catch (error) {
        console.error('שגיאה בטעינת נתונים מקומיים:', error);
        this.syncQueue = [];
      }
    }
    
    /**
     * שומר נתונים באחסון מקומי
     * @private
     */
    _saveToStorage() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.syncQueue));
      } catch (error) {
        console.error('שגיאה בשמירת נתונים מקומיים:', error);
      }
    }
    
    /**
     * מוסיף נתונים לתור סנכרון
     * @param {string} endpoint - נקודת הקצה לשליחה
     * @param {object} data - הנתונים לשליחה
     */
    addToSyncQueue(endpoint, data) {
      // הוספת מידע פרופיל לכל רשומה שנשמרת
      const profileInfo = this._extractProfileInfo(data);
      
      this.syncQueue.push({
        endpoint,
        data,
        profileInfo,
        timestamp: Date.now()
      });
      
      this._saveToStorage();
      
      // אם מחובר, ננסה לסנכרן מיד
      if (this.isOnline) {
        this._syncOfflineData();
      }
    }
    
    /**
     * מחלץ מידע פרופיל מהנתונים
     * @private
     * @param {object} data - הנתונים המלאים
     * @returns {object} - מידע פרופיל מחולץ
     */
    _extractProfileInfo(data) {
      const profileInfo = {};
      
      // אם זה רשומת מטופל עם פרטי פרופיל
      if (data.patientInfo) {
        profileInfo.profile = data.patientInfo.profile || "97";
        profileInfo.medicalSections = data.patientInfo.medicalSections;
        profileInfo.allergies = data.patientInfo.allergies;
        profileInfo.medications = data.patientInfo.medications;
      }
      
      return profileInfo;
    }
    
    /**
     * מסנכרן נתונים לא מקוונים עם השרת
     * @private
     */
    async _syncOfflineData() {
      if (this.syncQueue.length === 0) {
        return;
      }
      
      console.log(`מנסה לסנכרן ${this.syncQueue.length} פריטים`);
      
      const itemsToProcess = [...this.syncQueue];
      this.syncQueue = [];
      this._saveToStorage();
      
      for (const item of itemsToProcess) {
        try {
          await fetch(item.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(item.data)
          });
          
          console.log(`פריט סונכרן בהצלחה: ${item.endpoint}`);
        } catch (error) {
          console.error(`שגיאה בסנכרון פריט: ${item.endpoint}`, error);
          
          // החזרת הפריט לתור אם נכשל
          this.syncQueue.push(item);
          this._saveToStorage();
        }
      }
      
      // עדכון הממשק המשתמש אם יש
      this._updateUiSyncStatus();
    }
    
    /**
     * מעדכן את הממשק המשתמש עם סטטוס סנכרון
     * @private
     */
    _updateUiSyncStatus() {
      const syncStatusElement = document.getElementById('sync-status');
      if (syncStatusElement) {
        if (this.syncQueue.length > 0) {
          syncStatusElement.textContent = `ממתין לסנכרון: ${this.syncQueue.length} פריטים`;
          syncStatusElement.classList.remove('synced');
          syncStatusElement.classList.add('pending');
        } else {
          syncStatusElement.textContent = 'כל הנתונים מסונכרנים';
          syncStatusElement.classList.remove('pending');
          syncStatusElement.classList.add('synced');
        }
      }
    }
    
    /**
     * בודק אם יש חיבור אינטרנט
     * @returns {boolean} - האם יש חיבור
     */
    isConnected() {
      return this.isOnline;
    }
    
    /**
     * מחזיר את מספר הפריטים הממתינים לסנכרון
     * @returns {number} - מספר הפריטים
     */
    getPendingItemsCount() {
      return this.syncQueue.length;
    }
    
    /**
     * מחפש רשומות מטופלים שנשמרו לוקלית לפי פרופיל
     * @param {string} profile - מספר פרופיל לחיפוש
     * @returns {Array} - רשימת רשומות מתאימות
     */
    findPatientsByProfile(profile) {
      return this.syncQueue
        .filter(item => item.profileInfo && item.profileInfo.profile === profile)
        .map(item => item.data);
    }
    
    /**
     * שומר רשומת מטופל מקומית (גם אם יש חיבור)
     * @param {object} patientRecord - רשומת המטופל לשמירה
     * @returns {string} - מזהה ייחודי של הרשומה
     */
    savePatientRecord(patientRecord) {
      // יצירת מזהה ייחודי עבור הרשומה
      const recordId = `patient_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // שמירת הרשומה בלוקל סטורג' ייעודי
      try {
        const patientRecords = this._getStoredPatientRecords();
        patientRecords[recordId] = patientRecord;
        localStorage.setItem('medical_system_patient_records', JSON.stringify(patientRecords));
        
        // הוספה לתור סנכרון לשרת (כשיש חיבור)
        this.addToSyncQueue('/api/save-patient-record', {
          recordId,
          patientRecord
        });
        
        return recordId;
      } catch (error) {
        console.error('שגיאה בשמירת רשומת מטופל:', error);
        return null;
      }
    }
    
    /**
     * מקבל את רשומות המטופלים השמורות
     * @private
     * @returns {object} - מילון רשומות מטופלים
     */
    _getStoredPatientRecords() {
      try {
        const records = localStorage.getItem('medical_system_patient_records');
        return records ? JSON.parse(records) : {};
      } catch (error) {
        console.error('שגיאה בקריאת רשומות מטופלים:', error);
        return {};
      }
    }
    
    /**
     * מקבל רשומת מטופל לפי מזהה
     * @param {string} recordId - מזהה הרשומה
     * @returns {object|null} - רשומת המטופל או null אם לא נמצאה
     */
    getPatientRecord(recordId) {
      const records = this._getStoredPatientRecords();
      return records[recordId] || null;
    }
    
    /**
     * מוחק רשומת מטופל מקומית
     * @param {string} recordId - מזהה הרשומה למחיקה
     * @returns {boolean} - האם המחיקה הצליחה
     */
    deletePatientRecord(recordId) {
      try {
        const records = this._getStoredPatientRecords();
        
        if (!records[recordId]) {
          return false;
        }
        
        delete records[recordId];
        localStorage.setItem('medical_system_patient_records', JSON.stringify(records));
        
        // הוספה לתור סנכרון מחיקה בשרת (כשיש חיבור)
        this.addToSyncQueue('/api/delete-patient-record', {
          recordId
        });
        
        return true;
      } catch (error) {
        console.error('שגיאה במחיקת רשומת מטופל:', error);
        return false;
      }
    }
    
    /**
     * מנקה את כל הנתונים המקומיים (בזהירות)
     * @param {boolean} confirmClear - אישור נוסף לניקוי
     * @returns {boolean} - האם הניקוי הצליח
     */
    clearAllLocalData(confirmClear = false) {
      if (!confirmClear) {
        console.warn('ניקוי נתונים מקומיים דורש אישור נוסף');
        return false;
      }
      
      try {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem('medical_system_patient_records');
        this.syncQueue = [];
        
        console.log('כל הנתונים המקומיים נוקו בהצלחה');
        return true;
      } catch (error) {
        console.error('שגיאה בניקוי נתונים מקומיים:', error);
        return false;
      }
    }
  }
  
  // יצירת מופע גלובלי
  window.offlineManager = new OfflineManager();