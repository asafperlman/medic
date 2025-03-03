// utils/uiHelpers.js

/**
 * מודול עזרים לממשק המשתמש
 * ==========================
 * מספק פונקציות עזר לניהול עוגנים ב-DOM, יצירת אלמנטים,
 * הצגת הודעות והתאמות ממשק שונות.
 */

// מטמון אלמנטים לשיפור ביצועים
const elementsCache = new Map();

/**
 * מאחזר אלמנט מה-DOM עם אופטימיזציה של מטמון
 * @param {string} selector - בורר CSS לאלמנט
 * @returns {HTMLElement|null} - האלמנט המבוקש או null אם לא נמצא
 */
export function getElement(selector) {
    // בדיקה במטמון תחילה
    if (elementsCache.has(selector)) {
        return elementsCache.get(selector);
    }
    
    // אחרת, זיהוי האלמנט ושמירה במטמון
    const element = document.querySelector(selector);
    if (element) {
        elementsCache.set(selector, element);
    }
    
    return element;
}

/**
 * מאחזר מספר אלמנטים מה-DOM
 * @param {string} selector - בורר CSS לאלמנטים
 * @returns {NodeList} - רשימת האלמנטים המבוקשים
 */
export function getElements(selector) {
    return document.querySelectorAll(selector);
}

/**
 * יוצר אלמנט HTML עם תכונות ואפשרויות רבות
 * @param {string} tag - סוג האלמנט
 * @param {object} options - אפשרויות ליצירת האלמנט
 * @returns {HTMLElement} - האלמנט החדש
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    // הגדרת מאפיינים בסיסיים
    if (options.className) element.className = options.className;
    if (options.id) element.id = options.id;
    if (options.type) element.type = options.type;
    if (options.text) element.textContent = options.text;
    if (options.html) element.innerHTML = options.html;
    if (options.value) element.value = options.value;
    if (options.name) element.name = options.name;
    if (options.placeholder) element.placeholder = options.placeholder;
    if (options.required !== undefined) element.required = options.required;
    if (options.disabled !== undefined) element.disabled = options.disabled;
    if (options.checked !== undefined) element.checked = options.checked;
    if (options.selected !== undefined) element.selected = options.selected;
    
    // הגדרת מאפיינים מותאמים
    if (options.dataset) {
        for (const [key, value] of Object.entries(options.dataset)) {
            if (value !== null && value !== undefined) {
                element.dataset[key] = value;
            }
        }
    }
    
    // הוספת אירועים
    if (options.events) {
        for (const [eventName, handler] of Object.entries(options.events)) {
            element.addEventListener(eventName, handler);
        }
    }
    
    // הוספת סגנונות ישירים
    if (options.styles) {
        for (const [prop, value] of Object.entries(options.styles)) {
            element.style[prop] = value;
        }
    }
    
    // הוספת תתי אלמנטים
    if (options.children) {
        for (const child of options.children) {
            element.appendChild(child);
        }
    }
    
    // הוספת מאפיינים נוספים
    if (options.attributes) {
        for (const [attr, value] of Object.entries(options.attributes)) {
            element.setAttribute(attr, value);
        }
    }
    
    return element;
}

/**
 * מציג הודעת toast למשתמש
 * @param {string} type - סוג ההודעה (success/error/warning/info/sending)
 * @param {string} message - תוכן ההודעה
 * @param {number} duration - משך הצגת ההודעה במילישניות
 * @returns {HTMLElement} - אלמנט ההודעה
 */
export function showToast(type, message, duration = 3000) {
    // הסרת הודעות קודמות אם קיימות
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    });
    
    // יצירת הודעה חדשה
    const toast = createElement('div', {
        className: `toast-notification ${type}`
    });
    
    // בחירת אייקון מתאים
    let icon = '';
    switch (type) {
        case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
        case 'error': icon = '<i class="fas fa-exclamation-circle"></i>'; break;
        case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
        case 'info': icon = '<i class="fas fa-info-circle"></i>'; break;
        case 'sending': icon = '<i class="fas fa-spinner fa-spin"></i>'; break;
    }
    
    toast.innerHTML = `${icon} ${message}`;
    document.body.appendChild(toast);
    
    // הסרת ההודעה אחרי הזמן שהוגדר (אלא אם זו הודעת טעינה)
    if (type !== 'sending') {
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.classList.add('fadeOut');
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, duration);
    }
    
    return toast;
}

/**
 * יוצר כפתורי גיל מהירים
 * @returns {HTMLElement} - אלמנט המכיל את כפתורי הגיל המהירים
 */
export function createAgeButtons() {
    // גילאים שימושיים
    const commonAges = [18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
    
    const container = createElement('div', {
        className: 'quick-age-buttons'
    });
    
    // יצירת דוקומנט פרגמנט למניעת reflows מרובים
    const fragment = document.createDocumentFragment();
    
    commonAges.forEach(age => {
        const button = createElement('button', {
            type: 'button',
            className: 'age-button',
            text: age,
            events: {
                click: function() {
                    const ageField = getElement('#patient-age');
                    if (ageField) {
                        ageField.value = age;
                        // ניתן להוסיף כאן אירוע שינוי אם נדרש
                        const event = new Event('input', { bubbles: true });
                        ageField.dispatchEvent(event);
                    }
                }
            }
        });
        
        fragment.appendChild(button);
    });
    
    container.appendChild(fragment);
    return container;
}

/**
 * ממלא תיבת בחירה של תלונות עיקריות
 * @param {HTMLSelectElement} selectElement - אלמנט הבחירה
 * @param {Array} complaints - רשימת התלונות
 */
export function populateComplaintSelect(selectElement, complaints) {
    // ריקון תיבת הבחירה
    selectElement.innerHTML = '';
    
    // הוספת אופציה ריקה התחלתית
    const emptyOption = createElement('option', {
        value: '',
        text: 'בחר תלונה עיקרית',
        disabled: true,
        selected: true
    });
    
    selectElement.appendChild(emptyOption);
    
    // יצירת פרגמנט לביצועים טובים
    const fragment = document.createDocumentFragment();
    
    // הוספת התלונות כאפשרויות
    complaints.forEach(complaint => {
        const option = createElement('option', {
            value: complaint,
            text: complaint
        });
        fragment.appendChild(option);
    });
    
    selectElement.appendChild(fragment);
}

/**
 * יוצר ממשק חיפוש לתלונות
 * @param {HTMLSelectElement} complaintSelect - אלמנט הבחירה של התלונות
 * @param {Array} complaints - רשימת התלונות
 */
export function createComplaintSearchInterface(complaintSelect, complaints) {
    // יצירת אלמנט החיפוש
    const searchContainer = createElement('div', {
        className: 'search-container fade-in'
    });
    
    const searchIcon = createElement('i', {
        className: 'fas fa-search search-icon'
    });
    
    const searchInput = createElement('input', {
        type: 'text',
        className: 'complaint-search',
        placeholder: 'חפש תלונה...',
        attributes: { dir: 'rtl' },
        events: {
            input: function() {
                const searchTerm = this.value.trim().toLowerCase();
                
                // דחיית סינון כדי למנוע עומס על ה-UI
                clearTimeout(window.searchDelay);
                window.searchDelay = setTimeout(() => {
                    // סימון מצב פעיל לחיפוש
                    window.isSearchActive = searchTerm.length > 0;
                    
                    // יצירת אפשרויות חדשות
                    const filteredComplaints = searchTerm ? 
                        complaints.filter(complaint => complaint.toLowerCase().includes(searchTerm)) : 
                        complaints;
                    
                    // עדכון אלמנט ה-select באופן יעיל
                    updateComplaintOptions(complaintSelect, filteredComplaints, searchTerm);
                }, 200); // דיליי של 200ms למניעת עומס
            },
            focus: function() {
                // הוספת קלאס למיקוד על שדה החיפוש
                searchContainer.classList.add('focused');
            },
            blur: function() {
                // הסרת קלאס למיקוד כשעוזבים את השדה
                searchContainer.classList.remove('focused');
                
                // אם אין מונח חיפוש והמשתמש עזב את השדה, נציג את כל האפשרויות
                if (!this.value.trim()) {
                    updateComplaintOptions(complaintSelect, complaints, '');
                    window.isSearchActive = false;
                }
            }
        }
    });
    
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);
    
    // הוספת ממשק החיפוש לפני אלמנט הבחירה
    if (complaintSelect.parentElement) {
        complaintSelect.parentElement.insertBefore(searchContainer, complaintSelect);
    }
}

/**
 * עדכון אפשרויות תיבת הבחירה
 * @param {HTMLSelectElement} selectElement - אלמנט הבחירה
 * @param {Array} filteredComplaints - רשימת התלונות המסוננת
 * @param {string} searchTerm - מונח החיפוש
 */
export function updateComplaintOptions(selectElement, filteredComplaints, searchTerm) {
    if (!selectElement) return;
    
    // שמירת הערך הנוכחי לפני שינוי האפשרויות
    const currentValue = selectElement.value;
    
    // יצירת פרגמנט לביצועים טובים
    const fragment = document.createDocumentFragment();
    
    // אפשרות ריקה ראשונה
    const emptyOption = createElement('option', {
        value: '',
        text: 'בחר תלונה עיקרית',
        disabled: true,
        selected: !currentValue || window.isSearchActive
    });
    
    fragment.appendChild(emptyOption);
    
    // הוספת האפשרויות המסוננות
    filteredComplaints.forEach(complaint => {
        const option = createElement('option', {
            value: complaint,
            text: complaint,
            selected: complaint === currentValue && !window.isSearchActive
        });
        
        fragment.appendChild(option);
    });
    
    // אם יש מונח חיפוש ואין תוצאות, מוסיף אפשרות "אחר" עם המונח
    if (searchTerm && filteredComplaints.length === 0) {
        const otherOption = createElement('option', {
            value: searchTerm,
            text: `הוסף: "${searchTerm}"`,
            selected: true
        });
        fragment.appendChild(otherOption);
    }
    
    // וידוא שתמיד יש אפשרות "אחר" אם עוד לא נמצאה
    if (!filteredComplaints.includes('אחר')) {
        const otherOption = createElement('option', {
            value: 'אחר',
            text: 'אחר',
            selected: currentValue === 'אחר'
        });
        fragment.appendChild(otherOption);
    }
    
    // ריקון ועדכון ה-select פעם אחת בלבד
    selectElement.innerHTML = '';
    selectElement.appendChild(fragment);
    
    // בדיקה אם נבחר ערך "אחר" כדי להציג את שדה "אחר"
    if (selectElement.value === 'אחר') {
        const otherContainer = getElement('#other-complaint-container');
        if (otherContainer) {
            otherContainer.style.display = 'block';
        }
    }
    
    // הפעלת אירוע שינוי כדי שהמערכת תגיב לשינוי באפשרויות
    const event = new Event('change');
    selectElement.dispatchEvent(event);
}

/**
 * יוצר כפתור מצב לילה משופר
 * @returns {HTMLElement} - כפתור מצב לילה
 */
export function createImprovedDarkModeToggle() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    const darkModeToggle = createElement('button', {
        id: 'dark-mode-toggle',
        className: 'dark-mode-toggle floating',
        attributes: { 'aria-label': 'החלף מצב תצוגה' },
        html: isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>',
        events: {
            click: function() {
                const currentDarkMode = localStorage.getItem('darkMode') === 'true';
                const newDarkMode = !currentDarkMode;
                localStorage.setItem('darkMode', newDarkMode);
                document.body.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
                
                this.innerHTML = newDarkMode ? 
                    '<i class="fas fa-sun"></i>' : 
                    '<i class="fas fa-moon"></i>';
            }
        }
    });
    
    return darkModeToggle;
}

/**
 * פונקציה לטיפול בשדה בחירה (כן/לא) וחשיפת שדות נוספים
 * @param {string} fieldName - שם השדה
 * @param {boolean} show - האם להציג
 */
export function toggleFieldVisibility(fieldName, show) {
    const detailsContainer = getElement(`#${fieldName}-details-container`);
    if (!detailsContainer) return;
    
    // ממזערים עדכוני DOM ע"י שינוי התצוגה רק אם יש הבדל
    if ((detailsContainer.style.display === 'block') !== show) {
        detailsContainer.style.display = show ? 'block' : 'none';
        
        if (!show) {
            const detailsInput = getElement(`#${fieldName}-details`);
            if (detailsInput) detailsInput.value = '';
        }
    }
}

/**
 * יוצר אינדיקטור סטטוס API
 * @returns {HTMLElement} - אלמנט האינדיקטור
 */
export function createApiStatusIndicator() {
    const indicator = createElement('div', {
        className: 'api-status-indicator',
        id: 'api-status',
        html: '<i class="fas fa-circle-notch fa-spin"></i> בודק חיבור...'
    });
    
    return indicator;
}

/**
 * בדיקה אם כתובת דוא"ל תקינה
 * @param {string} email - כתובת הדוא"ל לבדיקה
 * @returns {boolean} - האם הכתובת תקינה
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * מנקה את מטמון האלמנטים
 */
export function clearElementsCache() {
    elementsCache.clear();
}