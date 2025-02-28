// src/utils/cacheManager.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * מנהל מטמון מתקדם עם תמיכה במספר שכבות אחסון
 */
class CacheManager {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.options = {
      useMemory: true,
      useDisk: options.useDisk || false,
      diskCachePath: options.diskCachePath || './cache',
      defaultTTL: options.defaultTTL || 86400000 // 24 שעות
    };
    
    if (this.options.useDisk) {
      // יצירת תיקיית מטמון אם אינה קיימת
      this._ensureDiskCacheExists();
    }
  }
  
  async _ensureDiskCacheExists() {
    try {
      await fs.mkdir(this.options.diskCachePath, { recursive: true });
    } catch (error) {
      console.error('שגיאה ביצירת תיקיית מטמון:', error);
    }
  }
  
  _getCacheKey(key) {
    return crypto.createHash('md5').update(JSON.stringify(key)).digest('hex');
  }
  
  async get(key) {
    const cacheKey = this._getCacheKey(key);
    
    // ניסיון לקבל מהזיכרון
    if (this.options.useMemory) {
      const memoryItem = this.memoryCache.get(cacheKey);
      if (memoryItem && memoryItem.expiry > Date.now()) {
        return memoryItem.value;
      }
    }
    
    // ניסיון לקבל מהדיסק אם לא נמצא בזיכרון
    if (this.options.useDisk) {
      try {
        const filePath = path.join(this.options.diskCachePath, cacheKey);
        const data = await fs.readFile(filePath, 'utf8');
        const item = JSON.parse(data);
        
        if (item.expiry > Date.now()) {
          // שמירה בזיכרון גם כן אם אפשר
          if (this.options.useMemory) {
            this.memoryCache.set(cacheKey, item);
          }
          return item.value;
        } else {
          // הסרת פריט פג תוקף
          await fs.unlink(filePath).catch(() => {});
        }
      } catch (error) {
        // ייתכן שהקובץ לא קיים או שגיאת קריאה אחרת
      }
    }
    
    return null;
  }
  
  async set(key, value, ttl = this.options.defaultTTL) {
    const cacheKey = this._getCacheKey(key);
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    
    // שמירה בזיכרון
    if (this.options.useMemory) {
      this.memoryCache.set(cacheKey, item);
    }
    
    // שמירה בדיסק
    if (this.options.useDisk) {
      try {
        const filePath = path.join(this.options.diskCachePath, cacheKey);
        await fs.writeFile(filePath, JSON.stringify(item));
      } catch (error) {
        console.error('שגיאה בשמירת מטמון לדיסק:', error);
      }
    }
  }
  
  async remove(key) {
    const cacheKey = this._getCacheKey(key);
    
    // הסרה מהזיכרון
    if (this.options.useMemory) {
      this.memoryCache.delete(cacheKey);
    }
    
    // הסרה מהדיסק
    if (this.options.useDisk) {
      try {
        const filePath = path.join(this.options.diskCachePath, cacheKey);
        await fs.unlink(filePath).catch(() => {});
      } catch (error) {
        // התעלמות משגיאות אם הקובץ לא קיים
      }
    }
  }
  
  async clear() {
    // ניקוי זיכרון
    if (this.options.useMemory) {
      this.memoryCache.clear();
    }
    
    // ניקוי דיסק
    if (this.options.useDisk) {
      try {
        const files = await fs.readdir(this.options.diskCachePath);
        await Promise.all(files.map(file => 
          fs.unlink(path.join(this.options.diskCachePath, file)).catch(() => {})
        ));
      } catch (error) {
        console.error('שגיאה בניקוי מטמון דיסק:', error);
      }
    }
  }
}

module.exports = CacheManager;