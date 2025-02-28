// public/utils/offlineManager.js

/**
 * מנהל מצב לא מקוון - אחראי על שמירת נתונים מקומית וסנכרון כשיש חיבור
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
      
      if (this.isOnline) {
        // אם יש חיבור, ננסה לסנכרן נתונים בתור
        this._syncOfflineData();
      }
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
      this.syncQueue.push({
        endpoint,
        data,
        timestamp: Date.now()
      });
      
      this._saveToStorage();
      
      // אם מחובר, ננסה לסנכרן מיד
      if (this.isOnline) {
        this._syncOfflineData();
      }
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
  }
  
  // יצירת מופע גלובלי
  window.offlineManager = new OfflineManager();