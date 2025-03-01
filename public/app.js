// public/app.js - גרסה מיועלת ומשופרת

/**
 * מערכת איסוף נתונים רפואיים - צד לקוח
 * ====================================
 * 
 * קובץ זה מכיל את כל הלוגיקה של צד הלקוח: טפסים, שאלות, תצוגה וסיכום.
 * גרסה משופרת הכוללת:
 * - אופטימיזציה לביצועים טובים יותר
 * - שיפור שדות הקלט המרובים
 * - מנגנון איפוס חכם
 * - אפשרות להוספת הערות לכל שדה
 * - שיפור הניסוח באנמנזה הסופית
 */

// מצב הנוכחי של המערכת - שימוש בסינגלטון לחיסכון בזיכרון
const state = {
    currentStep: 1,
    patientRecord: null,
    darkMode: localStorage.getItem('darkMode') === 'true' || false,
    lastSelectedOptions: {}, // מעקב אחר בחירות אחרונות
    unsavedChanges: false,   // מעקב אחר שינויים לא שמורים
    pendingSaves: [],        // תור שמירות ממוטבת
    
    // ממטמון פנימי לשיפור ביצועים
    cachedElements: new Map(),
    cachedQuestions: new Map()
};

// מאגר תלונות רלוונטיות לשאלון משרדי - צומצם למה שרלוונטי
const relevantComplaints = [
    "כאב גרון",
    "כאב ראש",
    "כאב בטן",
    "כאב גב",
    "כאב שרירים",
    "כאב פרקים",
    "שיעול",
    "קוצר נשימה",
    "סחרחורת",
    "בחילה",
    "חום",
    "חולשה כללית",
    "כאב אוזניים",
    "כאב חזה",
    "פציעת שריר", 
    "פציעת רצועה",
    "פציעת ספורט",
    "נקע",
    "דלקת גידים",
    "פריחה בעור",
    "אלרגיה",
    "אחר"
];

// ======== פונקציות ממוטבות של רכיבי ממשק ========

/**
 * פונקציית הלפר לאחזור וקישור אלמנטים מה-DOM
 * ממוטבת עם מטמון פנימי לביצועים טובים יותר
 */
function getElement(selector) {
    // בדיקה במטמון תחילה
    if (state.cachedElements.has(selector)) {
        return state.cachedElements.get(selector);
    }
    
    // אחרת, זיהוי האלמנט ושמירה במטמון
    const element = document.querySelector(selector);
    if (element) {
        state.cachedElements.set(selector, element);
    }
    
    return element;
}

/**
 * פונקציית עזר ליצירת אלמנטים - מצמצמת קריאות DOM
 */
function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    // הגדרת מאפיינים
    if (options.className) element.className = options.className;
    if (options.id) element.id = options.id;
    if (options.type) element.type = options.type;
    if (options.text) element.textContent = options.text;
    if (options.html) element.innerHTML = options.html;
    if (options.value) element.value = options.value;
    
    // הגדרת מאפיינים מותאמים
    if (options.dataset) {
        for (const [key, value] of Object.entries(options.dataset)) {
            element.dataset[key] = value;
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
    
    return element;
}

/**
 * פונקציה להצגת שלב מסוים, ממוטבת לביצועים
 * @param {number} stepNumber - מספר השלב להצגה
 * @param {boolean} skipConfirm - האם לדלג על אישור שינויים
 */
function showStep(stepNumber, skipConfirm = false) {
    // בדיקת שינויים לא שמורים
    if (!skipConfirm && state.unsavedChanges && state.currentStep !== stepNumber) {
        const confirmMove = confirm("יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעבור לשלב אחר?");
        if (!confirmMove) {
            return;
        }
    }

    // מסתיר את כל השלבים (מבצע DOM update אחד לכל שלב במקום רבים)
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => step.classList.remove('active'));
    
    // מציג את השלב הנבחר
    const targetStep = getElement(`#step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
        
        // מעדכן את המצב הנוכחי
        state.currentStep = stepNumber;
        
        // עדכון סרגל ההתקדמות
        updateProgressBar();
        
        // עדכון תצוגת לחצנים לפי השלב הנוכחי
        updateButtonsVisibility();
        
        // להפחתת reflow, נבצע ריצוד בלעדי לכל השלבים (צמצום פעולות DOM)
        requestAnimationFrame(() => {
            // טריגר למעברי אנימציה (אם יש)
            targetStep.querySelectorAll('.fade-in').forEach(element => {
                element.classList.remove('fade-in');
                void element.offsetWidth; // Trigger reflow
                element.classList.add('fade-in');
            });
        });
    }
}

/**
 * עדכון סרגל התקדמות - ממוטב לצמצום DOM updates
 */
function updateProgressBar() {
    const progressContainer = getElement('#progress-bar-container');
    if (!progressContainer) return;
    
    // בודקים אם צריך לעדכן
    if (progressContainer.dataset.currentStep === String(state.currentStep)) {
        return; // אותו שלב, אין צורך בעדכון
    }
    
    // יצירת תצוגת התקדמות בצעד אחד בלבד
    const totalSteps = 5;
    let progressHTML = '<div class="progress-bar">';
    
    for (let i = 1; i <= totalSteps; i++) {
        let statusClass = '';
        if (i < state.currentStep) statusClass = 'completed';
        if (i === state.currentStep) statusClass = 'active';
        
        progressHTML += `<div class="progress-step ${statusClass}">${i}</div>`;
    }
    
    progressHTML += '</div>';
    progressContainer.innerHTML = progressHTML;
    progressContainer.dataset.currentStep = state.currentStep;
}

/**
 * עדכון לחצני ניווט בהתאם לשלב - ממוטב לפחות DOM updates
 */
function updateButtonsVisibility() {
    const backButtons = document.querySelectorAll('.btn-back');
    const nextButtons = document.querySelectorAll('.btn-next');
    const completeBtn = getElement('#complete-process');
    
    // עדכון במקבץ
    requestAnimationFrame(() => {
        // לחצני חזרה נראים בכל השלבים למעט הראשון
        backButtons.forEach(btn => {
            btn.style.visibility = state.currentStep > 1 ? 'visible' : 'hidden';
        });
    
        // לחצני המשך לשלב הבא נראים בכל השלבים למעט האחרון
        nextButtons.forEach(btn => {
            btn.style.visibility = state.currentStep < 5 ? 'visible' : 'hidden';
        });
    
        // לחצן סיום נראה רק בשלב האחרון
        if (completeBtn) {
            completeBtn.style.display = state.currentStep === 5 ? 'block' : 'none';
        }
    });
}

// ======== פונקציות יצירת רכיבי שאלות מתקדמים ========

/**
 * יצירת אלמנט שאלה משופר התומך בכל סוגי הקלט
 * @param {object} questionData - נתוני השאלה
 * @param {number} index - אינדקס השאלה ברשימה
 * @param {boolean} isStandard - האם השאלה סטנדרטית או דינמית
 * @returns {HTMLElement} - אלמנט השאלה המוכן
 */
function createQuestionElement(questionData, index, isStandard = true) {
    // נוצר container אחד ונמלא אותו תוך צמצום פעולות DOM
    const container = createElement('li', {
        className: 'question-item fade-in',
        dataset: { 
            index: index,
            type: questionData.type,
            isStandard: isStandard
        }
    });
    
    // ראש השאלה
    const questionHeader = createElement('div', {
        className: 'question-header',
        text: questionData.question
    });
    
    // אזור התשובה
    const answerContainer = createElement('div', {
        className: 'answer-container'
    });
    
    // מזהה ייחודי לשאלה
    const questionId = `question-${index}-${isStandard ? 'std' : 'dyn'}`;
    
    // בניית רכיב התשובה לפי סוג השאלה
    switch (questionData.type) {
        case 'yesNo':
            createYesNoInput(answerContainer, questionData, questionId, index, isStandard);
            break;
            
        case 'multiselect':
        case 'location':
        case 'characteristic':
            createMultiSelectInput(answerContainer, questionData, questionId, index, isStandard);
            break;
            
        case 'scale':
            createScaleInput(answerContainer, questionData, questionId, index, isStandard);
            break;
            
        case 'duration':
        case 'value':
        case 'quantity':
            createTextInput(answerContainer, questionData, questionId, index, isStandard);
            break;
            
        case 'multiline':
            createTextareaInput(answerContainer, questionData, questionId, index, isStandard);
            break;
            
        default:
            // ברירת מחדל - שדה טקסט רגיל
            createTextInput(answerContainer, questionData, questionId, index, isStandard);
            break;
    }
    
    // הוספת אזור הערות לכל שאלה
    const notesContainer = createNotesSection(questionData, index, isStandard);
    
    // הרכבת מבנה השאלה
    container.appendChild(questionHeader);
    container.appendChild(answerContainer);
    container.appendChild(notesContainer);
    
    return container;
}

/**
 * יצירת רכיב תשובה יוצר-לא עם אלמנטים משופרים
 */
function createYesNoInput(container, questionData, questionId, index, isStandard) {
    const radioGroup = createElement('div', {
        className: 'radio-group question-radio-group'
    });
    
    // אפשרות "כן" - עם אירוע שינוי חכם
    const yesLabel = createElement('label', {
        className: 'radio-option radio-yes'
    });
    
    // שינוי: וידוא ששם הרדיו מכיל את מזהה השאלה לייחודיות
    const yesInput = createElement('input', {
        type: 'radio',
        id: `${questionId}-yes`,
        name: questionId, // חשוב! משתמש ב-questionId כשם לקבוצת הרדיו
        value: 'כן',
        dataset: {
            question: questionData.question,
            index: index,
            type: 'yesNo',
            standard: isStandard ? 'true' : null,
            dynamic: !isStandard ? 'true' : null
        },
        events: {
            change: function() {
                if (this.checked) {
                    highlightSelectedOption(this.parentElement, true);
                    
                    // הצגת שדה מעקב אם קיים
                    const followUpContainer = container.querySelector('.follow-up-container');
                    if (followUpContainer) {
                        followUpContainer.style.display = 'block';
                    }
                    
                    // סימון שינויים
                    state.unsavedChanges = true;
                }
            }
        }
    });
    
    yesLabel.appendChild(yesInput);
    yesLabel.appendChild(document.createTextNode('כן'));
    
    // אפשרות "לא"
    const noLabel = createElement('label', {
        className: 'radio-option radio-no'
    });
    
    const noInput = createElement('input', {
        type: 'radio',
        id: `${questionId}-no`,
        name: questionId, // אותו name כמו רדיו כן
        value: 'לא',
        // שאר הקוד...
    });
    
    noLabel.appendChild(noInput);
    noLabel.appendChild(document.createTextNode('לא'));
    
    radioGroup.appendChild(yesLabel);
    radioGroup.appendChild(noLabel);
    container.appendChild(radioGroup);
    
    // הוספת שדה מעקב נוסף לתשובת "כן" אם נדרש
    if (questionData.followUp) {
        const followUpContainer = createElement('div', {
            className: 'follow-up-container',
            styles: { display: 'none' }
        });
        
        const followUpInput = createElement('input', {
            type: 'text',
            className: 'follow-up-input',
            placeholder: questionData.followUp,
            dataset: {
                parentQuestion: questionData.question,
                standard: isStandard ? 'true' : null,
                dynamic: !isStandard ? 'true' : null
            },
            events: {
                input: () => { state.unsavedChanges = true; }
            }
        });
        
        followUpContainer.appendChild(followUpInput);
        container.appendChild(followUpContainer);
    }
}

/**
 * יצירת רכיב בחירה מרובה משופר
 */
function createMultiSelectInput(container, questionData, questionId, index, isStandard) {
    const multiSelectContainer = createElement('div', {
        className: 'multiselect-container'
    });
    
    // יצירת שדה חבוי לשמירת הערך המרובה
    const hiddenInput = createElement('input', {
        type: 'hidden',
        className: `${questionData.type}-value`,
        dataset: {
            question: questionData.question,
            index: index,
            type: questionData.type,
            standard: isStandard ? 'true' : null,
            dynamic: !isStandard ? 'true' : null
        }
    });
    
    // יצירת תיבות סימון לאפשרויות
    if (questionData.options && Array.isArray(questionData.options)) {
        const optionsContainer = createElement('div', {
            className: 'checkbox-group'
        });
        
        // יצירת האפשרויות
        questionData.options.forEach(option => {
            const optionLabel = createElement('label', {
                className: 'checkbox-option'
            });
            
            const optionInput = createElement('input', {
                type: 'checkbox',
                value: option,
                dataset: {
                    question: questionData.question,
                    option: option,
                    type: questionData.type,
                    standard: isStandard ? 'true' : null,
                    dynamic: !isStandard ? 'true' : null
                },
                events: {
                    change: function() {
                        highlightSelectedOption(this.parentElement, this.checked);
                        updateMultiSelectValue(questionData.question, questionData.type, multiSelectContainer);
                        state.unsavedChanges = true;
                    }
                }
            });
            
            optionLabel.appendChild(optionInput);
            optionLabel.appendChild(document.createTextNode(option));
            optionsContainer.appendChild(optionLabel);
        });
        
        multiSelectContainer.appendChild(optionsContainer);
    }
    
    // הוספת אפשרות "אחר" לקלט חופשי
    const otherContainer = createElement('div', {
        className: 'other-option-container'
    });
    
    const otherLabel = createElement('label', {
        className: 'checkbox-option'
    });
    
    const otherCheckbox = createElement('input', {
        type: 'checkbox',
        className: 'other-checkbox',
        value: 'אחר',
        events: {
            change: function() {
                const otherInput = otherContainer.querySelector('.other-input');
                if (otherInput) {
                    otherInput.style.display = this.checked ? 'block' : 'none';
                    if (!this.checked) otherInput.value = '';
                    
                    updateMultiSelectValue(questionData.question, questionData.type, multiSelectContainer);
                    state.unsavedChanges = true;
                }
                
                highlightSelectedOption(this.parentElement, this.checked);
            }
        }
    });
    
    otherLabel.appendChild(otherCheckbox);
    otherLabel.appendChild(document.createTextNode('אחר:'));
    otherContainer.appendChild(otherLabel);
    
    // יצירת שדה קלט טקסט לאפשרות "אחר"
    const otherInput = createElement('input', {
        type: 'text',
        className: 'other-input',
        placeholder: `אפשרות אחרת...`,
        dataset: {
            question: questionData.question,
            standard: isStandard ? 'true' : null,
            dynamic: !isStandard ? 'true' : null
        },
        styles: { display: 'none' },
        events: {
            input: function() {
                updateMultiSelectValue(questionData.question, questionData.type, multiSelectContainer);
                state.unsavedChanges = true;
            }
        }
    });
    
    otherContainer.appendChild(otherInput);
    
    // הרכבת הרכיב
    multiSelectContainer.appendChild(otherContainer);
    multiSelectContainer.appendChild(hiddenInput);
    container.appendChild(multiSelectContainer);
}

/**
 * יצירת סקאלה (סולם 1-10) משופרת
 */
function createScaleInput(container, questionData, questionId, index, isStandard) {
    const scaleContainer = createElement('div', {
        className: 'scale-container'
    });
    
    const scaleLabel = createElement('div', {
        className: 'scale-label',
        text: 'דרג/י מ-1 (קל) עד 10 (חמור מאוד)'
    });
    
    const scaleButtons = createElement('div', {
        className: 'scale-buttons'
    });
    
    // יצירת שדה חבוי לשמירת הערך הנבחר
    const scaleInput = createElement('input', {
        type: 'hidden',
        className: 'scale-input',
        dataset: {
            question: questionData.question,
            index: index,
            type: 'scale',
            standard: isStandard ? 'true' : null,
            dynamic: !isStandard ? 'true' : null
        }
    });
    
    // יצירת כפתורי בחירה
    for (let i = 1; i <= 10; i++) {
        const button = createElement('button', {
            type: 'button',
            className: 'scale-button',
            text: i,
            dataset: {
                value: i,
                question: questionData.question
            },
            events: {
                click: function() {
                    // הסרת סימון מכל הכפתורים
                    scaleButtons.querySelectorAll('.scale-button').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    // סימון הכפתור הנוכחי
                    this.classList.add('selected');
                    
                    // עדכון הערך המוסתר
                    scaleInput.value = i;
                    state.unsavedChanges = true;
                }
            }
        });
        
        scaleButtons.appendChild(button);
    }
    
    // הרכבת הרכיב
    scaleContainer.appendChild(scaleLabel);
    scaleContainer.appendChild(scaleButtons);
    scaleContainer.appendChild(scaleInput);
    container.appendChild(scaleContainer);
}

/**
 * יצירת שדה קלט טקסט חד-שורתי משופר
 */
function createTextInput(container, questionData, questionId, index, isStandard) {
    const input = createElement('input', {
        type: 'text',
        className: 'answer-input',
        placeholder: questionData.placeholder || 'הזן תשובה...',
        dataset: {
            question: questionData.question,
            index: index,
            type: questionData.type,
            standard: isStandard ? 'true' : null,
            dynamic: !isStandard ? 'true' : null
        },
        events: {
            input: () => { state.unsavedChanges = true; }
        }
    });
    
    container.appendChild(input);
}

/**
 * יצירת שדה קלט טקסט רב-שורתי משופר
 */
function createTextareaInput(container, questionData, questionId, index, isStandard) {
    const textarea = createElement('textarea', {
        className: 'answer-textarea',
        rows: 4,
        placeholder: questionData.placeholder || 'הזן תשובה מפורטת...',
        dataset: {
            question: questionData.question,
            index: index,
            type: 'multiline',
            standard: isStandard ? 'true' : null,
            dynamic: !isStandard ? 'true' : null
        },
        events: {
            input: () => { state.unsavedChanges = true; }
        }
    });
    
    container.appendChild(textarea);
}

/**
 * יצירת אזור הערות לשאלה
 */
function createNotesSection(questionData, index, isStandard) {
    const notesContainer = createElement('div', {
        className: 'notes-container'
    });
    
    const notesToggle = createElement('button', {
        type: 'button',
        className: 'notes-toggle',
        html: '<i class="fas fa-sticky-note"></i> הוסף הערה',
        events: {
            click: function() {
                const notesField = notesContainer.querySelector('.notes-field');
                if (notesField) {
                    const isHidden = notesField.style.display === 'none';
                    notesField.style.display = isHidden ? 'block' : 'none';
                    this.innerHTML = isHidden ? 
                        '<i class="fas fa-times"></i> הסתר הערה' : 
                        '<i class="fas fa-sticky-note"></i> הוסף הערה';
                }
            }
        }
    });
    
    const notesField = createElement('textarea', {
        className: 'notes-field',
        placeholder: 'הוסף הערה או מידע נוסף...',
        dataset: {
            question: questionData.question,
            notes: 'true',
            standard: isStandard ? 'true' : null,
            dynamic: !isStandard ? 'true' : null
        },
        styles: { display: 'none' },
        events: {
            input: () => { state.unsavedChanges = true; }
        }
    });
    
    notesContainer.appendChild(notesToggle);
    notesContainer.appendChild(notesField);
    
    return notesContainer;
}

/**
 * עדכון תצוגת אפשרות נבחרת
 */
function highlightSelectedOption(optionElement, isSelected) {
    if (isSelected) {
        optionElement.classList.add('selected');
    } else {
        optionElement.classList.remove('selected');
    }
}

/**
 * עדכון ערך בחירה מרובה
 */
function updateMultiSelectValue(question, type, container) {
    const hiddenInput = container.querySelector(`.${type}-value`);
    if (!hiddenInput) return;
    
    const options = [];
    
    // איסוף אפשרויות רגילות שנבחרו
    container.querySelectorAll(`input[type="checkbox"][data-option]`).forEach(checkbox => {
        if (checkbox.checked) {
            options.push(checkbox.dataset.option);
        }
    });
    
    // בדיקת אפשרות "אחר"
    const otherCheckbox = container.querySelector('.other-checkbox');
    const otherInput = container.querySelector('.other-input');
    
    if (otherCheckbox && otherCheckbox.checked && otherInput && otherInput.value.trim()) {
        options.push(otherInput.value.trim());
    }
    
    // עדכון ערך הקלט החבוי
    hiddenInput.value = options.join(', ');
}

// ======== פונקציות איסוף ועיבוד נתונים משופרות ========

/**
 * איסוף תשובות מהטופס - גרסה משופרת וממוטבת
 * @param {string} selector - בורר CSS לאיתור האלמנטים
 * @returns {object} - מילון התשובות
 */
function collectAnswers(selector) {
    const answers = {};
    const inputs = document.querySelectorAll(selector);
    
    // טכניקת איסוף מקובצת לביצועים טובים
    inputs.forEach(input => {
        // דילוג על שדות ריקים
        if (!input.value && !input.checked) {
            return;
        }
        
        // קבלת הערך בהתאם לסוג הפקד
        let value = '';
        
        if (input.type === 'hidden') {
            // שדות מיוחדים (סקאלה, בחירה מרובה)
            value = input.value;
        } else if (input.type === 'radio') {
            // דילוג על פקדי רדיו לא מסומנים
            if (!input.checked) return;
            
            value = input.value;
            
            // טיפול מיוחד בתשובת "כן" עם שדה מעקב
            if (value === 'כן') {
                const followUpInput = document.querySelector(`.follow-up-input[data-parent-question="${input.dataset.question}"]`);
                if (followUpInput && followUpInput.value.trim() !== '') {
                    value = `כן, ${followUpInput.value.trim()}`;
                }
            }
        } else if (input.tagName === 'SELECT') {
            value = input.value;
        } else if (input.tagName === 'TEXTAREA' || input.type === 'text') {
            value = input.value.trim();
        } else {
            value = input.value.trim();
        }
        
        // הוספת הערך למילון התשובות
        if (value !== '') {
            answers[input.dataset.question] = value;
        }
    });
    
    // איסוף הערות (נוסף כחלק מהשיפור)
    const notes = document.querySelectorAll(`${selector.split(',')[0]}[data-notes="true"]`);
    notes.forEach(noteField => {
        if (noteField.value.trim()) {
            const questionText = noteField.dataset.question;
            answers[`הערה: ${questionText}`] = noteField.value.trim();
        }
    });
    
    return answers;
}

/**
 * איסוף מדדים חיוניים - גרסה משופרת
 * @returns {object} - מילון מדדים חיוניים
 */
function collectVitalSigns() {
    const vitalSigns = {};
    
    // איסוף המדדים בשיטה ממוטבת
    document.querySelectorAll('.vital-sign-input').forEach(input => {
        if (input.value.trim() !== '') {
            vitalSigns[input.dataset.vitalSign] = input.value.trim();
        }
    });
    
    return vitalSigns;
}

/**
 * קבלת ערך נבחר מפקדי רדיו
 * @param {string} name - שם קבוצת הרדיו
 * @returns {string|null} - הערך הנבחר
 */
function getSelectedRadioValue(name) {
    const selectedRadio = document.querySelector(`input[name="${name}"]:checked`);
    return selectedRadio ? selectedRadio.value : null;
}

/**
 * פונקציה לטיפול בשדה בחירה (כן/לא) וחשיפת שדות נוספים
 * @param {string} fieldName - שם השדה
 * @param {boolean} show - האם להציג
 */
function toggleFieldVisibility(fieldName, show) {
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

// ======== יצירת רכיבי ממשק נוספים ========

/**
 * יצירת כפתורי גיל מהירים - ממוטב
 * @returns {HTMLElement} - אלמנט המכיל את הכפתורים
 */
function createAgeButtons() {
    // גילאים שימושיים למשרד רפואי
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
                        state.unsavedChanges = true;
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
 * יצירת ממשק חיפוש לתלונות - משופר לביצועים
 * @param {HTMLSelectElement} complaintSelect - אלמנט הבחירה של התלונות
 * @param {Array} complaints - רשימת התלונות
 */
function createComplaintSearchInterface(complaintSelect, complaints) {
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
                clearTimeout(state.searchDelay);
                state.searchDelay = setTimeout(() => {
                    // יצירת אפשרויות חדשות
                    const filteredComplaints = searchTerm ? 
                        complaints.filter(complaint => complaint.toLowerCase().includes(searchTerm)) : 
                        complaints;
                    
                    // עדכון אלמנט ה-select באופן יעיל
                    updateComplaintOptions(complaintSelect, filteredComplaints, searchTerm);
                }, 200); // דיליי של 200ms למניעת עומס
            }
        }
    });
    
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);
    
    // הוספת ממשק החיפוש לפני אלמנט הבחירה
    complaintSelect.parentElement.insertBefore(searchContainer, complaintSelect);
}

/**
 * עדכון אפשרויות התלונות ביעילות
 */
function updateComplaintOptions(selectElement, filteredComplaints, searchTerm) {
    // יצירת פרגמנט לביצועים טובים
    const fragment = document.createDocumentFragment();
    
    // אפשרות ריקה ראשונה
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'בחר תלונה עיקרית';
    emptyOption.disabled = true;
    emptyOption.selected = true;
    fragment.appendChild(emptyOption);
    
    // הוספת האפשרויות המסוננות
    filteredComplaints.forEach(complaint => {
        const option = document.createElement('option');
        option.value = complaint;
        option.textContent = complaint;
        fragment.appendChild(option);
    });
    
    // אם אין תוצאות ויש מונח חיפוש, מוסיף אפשרות "אחר"
    if (filteredComplaints.length === 0 && searchTerm) {
        const otherOption = document.createElement('option');
        otherOption.value = searchTerm;
        otherOption.textContent = `הוסף: "${searchTerm}"`;
        fragment.appendChild(otherOption);
    }
    
    // וידוא שתמיד יש אפשרות "אחר"
    if (!filteredComplaints.includes('אחר')) {
        const otherOption = document.createElement('option');
        otherOption.value = 'אחר';
        otherOption.textContent = 'אחר';
        fragment.appendChild(otherOption);
    }
    
    // ריקון ועדכון ה-select פעם אחת בלבד
    selectElement.innerHTML = '';
    selectElement.appendChild(fragment);
}

/**
 * יצירת כפתור מצב לילה משופר עם מיקום טוב יותר
 * @returns {HTMLElement} - כפתור מצב לילה
 */
function createImprovedDarkModeToggle() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    const darkModeToggle = createElement('button', {
        id: 'dark-mode-toggle',
        className: 'dark-mode-toggle floating',
        attributes: { 'aria-label': 'החלף מצב תצוגה' },
        html: isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>',
        events: {
            click: function() {
                const currentDarkMode = localStorage.getItem('darkMode') === 'true';
                state.darkMode = !currentDarkMode;
                localStorage.setItem('darkMode', state.darkMode);
                document.body.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
                
                this.innerHTML = state.darkMode ? 
                    '<i class="fas fa-sun"></i>' : 
                    '<i class="fas fa-moon"></i>';
            }
        }
    });
    
    return darkModeToggle;
}

/**
 * יצירת אזור בחירת מיקום פציעה מתקדם
 * @returns {HTMLElement} - אזור בחירת מיקום
 */
function createAdvancedInjuryLocationSelector() {
    const container = createElement('div', {
        className: 'injury-location-container fade-in'
    });
    
    // יצירת כותרת
    const title = createElement('h3', {
        text: 'מיקום הפציעה'
    });
    container.appendChild(title);
    
    // אזור לבחירת מיקום פציעה עם ממשק חזותי
    const bodyPartSelector = createElement('div', {
        className: 'body-part-selector'
    });
    
    // יצירת אזורי גוף לבחירה
    const bodyParts = [
        { id: 'head', name: 'ראש' },
        { id: 'neck', name: 'צוואר' },
        { id: 'shoulder-right', name: 'כתף ימין' },
        { id: 'shoulder-left', name: 'כתף שמאל' },
        { id: 'arm-upper-right', name: 'זרוע ימין' },
        { id: 'arm-upper-left', name: 'זרוע שמאל' },
        { id: 'elbow-right', name: 'מרפק ימין' },
        { id: 'elbow-left', name: 'מרפק שמאל' },
        { id: 'arm-lower-right', name: 'אמה ימין' },
        { id: 'arm-lower-left', name: 'אמה שמאל' },
        { id: 'wrist-right', name: 'שורש כף יד ימין' },
        { id: 'wrist-left', name: 'שורש כף יד שמאל' },
        { id: 'hand-right', name: 'כף יד ימין' },
        { id: 'hand-left', name: 'כף יד שמאל' },
        { id: 'chest', name: 'חזה' },
        { id: 'back-upper', name: 'גב עליון' },
        { id: 'back-lower', name: 'גב תחתון' },
        { id: 'hip-right', name: 'מפרק ירך ימין' },
        { id: 'hip-left', name: 'מפרק ירך שמאל' },
        { id: 'leg-upper-right', name: 'ירך ימין' },
        { id: 'leg-upper-left', name: 'ירך שמאל' },
        { id: 'knee-right', name: 'ברך ימין' },
        { id: 'knee-left', name: 'ברך שמאל' },
        { id: 'leg-lower-right', name: 'שוק ימין' },
        { id: 'leg-lower-left', name: 'שוק שמאל' },
        { id: 'ankle-right', name: 'קרסול ימין' },
        { id: 'ankle-left', name: 'קרסול שמאל' },
        { id: 'foot-right', name: 'כף רגל ימין' },
        { id: 'foot-left', name: 'כף רגל שמאל' }
    ];
    
    // יצירת לחצני אזורי גוף יעילה
    const bodyPartsFragment = document.createDocumentFragment();
    bodyParts.forEach(part => {
        const button = createElement('button', {
            type: 'button',
            className: 'body-part-button',
            text: part.name,
            dataset: { partId: part.id },
            events: {
                click: function() {
                    toggleBodyPartSelection(this, part.id, part.name);
                }
            }
        });
        
        bodyPartsFragment.appendChild(button);
    });
    
    bodyPartSelector.appendChild(bodyPartsFragment);
    container.appendChild(bodyPartSelector);
    
    // אזור להצגת אזורי הגוף שנבחרו
    const selectedContainer = createElement('div', {
        className: 'selected-parts-container'
    });
    
    const selectedTitle = createElement('h4', {
        text: 'אזורי פציעה שנבחרו:'
    });
    
    const selectedList = createElement('ul', {
        id: 'selected-body-parts'
    });
    
    // שדה קלט מוסתר לשמירת הערך המלא
    const hiddenInput = createElement('input', {
        type: 'hidden',
        id: 'injury-location-value',
        name: 'injury-location',
        dataset: {
            standard: 'true',
            type: 'location'
        }
    });
    
    selectedContainer.appendChild(selectedTitle);
    selectedContainer.appendChild(selectedList);
    selectedContainer.appendChild(hiddenInput);
    container.appendChild(selectedContainer);
    
    // אזור להוספת פרטים ספציפיים
    const specificDetails = createElement('div', {
        className: 'specific-details-container'
    });
    
    const specificTitle = createElement('h4', {
        text: 'פרטים נוספים על הפציעה:'
    });
    
    const specificInput = createElement('textarea', {
        id: 'injury-specific-details',
        className: 'specific-details-input',
        placeholder: 'הזן פרטים נוספים על הפציעה (לדוגמה: נפיחות, שטף דם, הגבלת תנועה וכו\')',
        rows: 3,
        events: {
            input: function() {
                updateInjuryLocation();
                state.unsavedChanges = true;
            }
        }
    });
    
    specificDetails.appendChild(specificTitle);
    specificDetails.appendChild(specificInput);
    container.appendChild(specificDetails);
    
    return container;
}

/**
 * טיפול בבחירת אזור גוף
 */
function toggleBodyPartSelection(buttonElement, partId, partName) {
    const selectedList = getElement('#selected-body-parts');
    if (!selectedList) return;
    
    // חיפוש אם כבר קיים
    const existingItem = selectedList.querySelector(`[data-part-id="${partId}"]`);
    
    if (existingItem) {
        // אם קיים - הסר
        existingItem.remove();
        buttonElement.classList.remove('selected');
    } else {
        // אם לא קיים - הוסף
        const listItem = createElement('li', {
            dataset: { partId: partId, partName: partName },
            text: partName
        });
        
        // יצירת כפתור הסרה
        const removeButton = createElement('button', {
            type: 'button',
            className: 'remove-part-btn',
            html: '&times;',
            attributes: { title: 'הסר מהרשימה' },
            events: {
                click: function(e) {
                    e.stopPropagation();
                    listItem.remove();
                    
                    // הסרת הדגשה מהכפתור המקורי
                    const originalButton = document.querySelector(`.body-part-button[data-part-id="${partId}"]`);
                    if (originalButton) {
                        originalButton.classList.remove('selected');
                    }
                    
                    updateInjuryLocation();
                    state.unsavedChanges = true;
                }
            }
        });
        
        listItem.appendChild(removeButton);
        selectedList.appendChild(listItem);
        buttonElement.classList.add('selected');
    }
    
    // עדכון שדה הקלט המוסתר
    updateInjuryLocation();
    state.unsavedChanges = true;
}

/**
 * עדכון ערך מיקום הפציעה המלא
 */
function updateInjuryLocation() {
    const selectedParts = [];
    
    // איסוף האזורים שנבחרו
    document.querySelectorAll('#selected-body-parts li').forEach(item => {
        selectedParts.push(item.dataset.partName);
    });
    
    // הוספת פרטים ספציפיים אם קיימים
    const specificDetails = getElement('#injury-specific-details');
    let specificText = specificDetails ? specificDetails.value.trim() : '';
    
    // יצירת ערך משולב
    let finalValue = selectedParts.join(', ');
    if (specificText) {
        finalValue += selectedParts.length > 0 ? '; ' + specificText : specificText;
    }
    
    // עדכון השדה המוסתר
    const hiddenInput = getElement('#injury-location-value');
    if (hiddenInput) {
        hiddenInput.value = finalValue;
    }
    
    return finalValue;
}

/**
 * ליצירת שאלות ספציפיות לפציעות ספורט
 * @returns {Array} - מערך של שאלות ייעודיות
 */
function createSportsInjuryQuestions() {
    return [
        {
            type: "multiselect",
            question: "כיצד אירעה הפציעה?",
            options: ["במהלך ריצה", "במהלך קפיצה", "עצירה פתאומית", "מכה/מגע", "תנועה מסתובבת", "מתיחה יתרה"]
        },
        {
            type: "duration",
            question: "מתי אירעה הפציעה?",
            placeholder: "לדוגמה: לפני שעתיים, אתמול בערב, לפני שבוע..."
        },
        {
            type: "multiselect",
            question: "מהו אופי הכאב?",
            options: ["חד", "מתמשך", "פועם", "שורף", "דוקר", "עמום"]
        },
        {
            type: "scale",
            question: "מהי עוצמת הכאב בסולם 1-10?",
            placeholder: "דרג מ-1 (קל) עד 10 (חמור ביותר)"
        },
        {
            type: "yesNo",
            question: "האם יש נפיחות באזור הפציעה?",
            followUp: "תאר את מידת הנפיחות"
        },
        {
            type: "yesNo",
            question: "האם יש שינוי צבע (כחול/אדום) באזור הפציעה?",
            followUp: "תאר את שינוי הצבע"
        },
        {
            type: "yesNo",
            question: "האם יש הגבלה בטווח התנועה?",
            followUp: "תאר את המגבלה (לדוגמה: לא יכול להרים יד מעל הראש)"
        },
        {
            type: "yesNo",
            question: "האם יש תחושת חוסר יציבות או רפיון באזור הפציעה?",
            followUp: "תאר את התחושה"
        },
        {
            type: "multiline",
            question: "תאר את הפעילות שבמהלכה נפצעת (סוג הספורט, עוצמה, משך)",
            placeholder: "לדוגמה: משחק כדורגל תחרותי, אימון אישי בחדר כושר..."
        },
        {
            type: "yesNo",
            question: "האם טיפלת בפציעה באופן כלשהו עד כה?",
            followUp: "פרט איזה טיפול ננקט (קרח, חבישה, תרופות)"
        }
    ];
}

/**
 * קבלת מדדים חיוניים רלוונטיים לפי תלונה
 * @param {string} complaint - התלונה העיקרית
 * @returns {Array} - מערך מדדים רלוונטיים
 */
function getRelevantVitalSigns(complaint) {
    // מיפוי מדדים רלוונטיים לפי תלונה - מותאם לשאלון משרדי
    const vitalSignsByComplaint = {
        "כאב ראש": ["דופק", "לחץ דם"],
        "כאב חזה": ["דופק", "לחץ דם", "סטורציה"],
        "קוצר נשימה": ["דופק", "סטורציה", "קצב נשימה"],
        "כאב בטן": ["דופק", "לחץ דם"],
        "חום": ["חום", "דופק"],
        "כאב גרון": ["חום"],
        "שיעול": ["חום", "סטורציה"],
        "סחרחורת": ["דופק", "לחץ דם"]
    };
    
    // החזרת המדדים הרלוונטיים או ברירת מחדל
    return vitalSignsByComplaint[complaint] || ["דופק", "לחץ דם"];
}

/**
 * יצירת טופס מדדים חיוניים
 * @param {Array} relevantVitalSigns - מערך מדדים רלוונטיים 
 * @returns {HTMLElement} - טופס מדדים
 */
function createVitalSignsForm(relevantVitalSigns) {
    const container = createElement('div', {
        className: 'vital-signs-container fade-in'
    });
    
    const title = createElement('h3', {
        text: 'מדדים חיוניים'
    });
    
    const form = createElement('div', {
        className: 'vital-signs-form'
    });
    
    // מיפוי המדדים ופקדיהם
    const vitalSignsMap = {
        'דופק': {
            id: 'pulse',
            placeholder: 'דופק (פעימות לדקה)',
            type: 'number',
            min: 30,
            max: 250
        },
        'לחץ דם': {
            id: 'bloodPressure',
            placeholder: 'לחץ דם (סיסטולי/דיאסטולי)',
            type: 'text',
            pattern: '[0-9]{2,3}/[0-9]{2,3}'
        },
        'חום': {
            id: 'temperature',
            placeholder: 'מעלות צלזיוס (37.0)',
            type: 'number',
            min: 35,
            max: 43,
            step: 0.1
        },
        'סטורציה': {
            id: 'saturation',
            placeholder: 'אחוז (%)',
            type: 'number',
            min: 70,
            max: 100
        },
        'קצב נשימה': {
            id: 'respiratoryRate',
            placeholder: 'נשימות לדקה',
            type: 'number',
            min: 8,
            max: 60
        }
    };
    
    // יצירת פרגמנט לביצועים טובים
    const formFragment = document.createDocumentFragment();
    
    // יצירת שדות עבור המדדים הרלוונטיים
    relevantVitalSigns.forEach(vitalSign => {
        const signConfig = vitalSignsMap[vitalSign];
        if (!signConfig) return;
        
        const formGroup = createElement('div', {
            className: 'form-group vital-sign-group'
        });
        
        const label = createElement('label', {
            htmlFor: `vital-${signConfig.id}`,
            text: vitalSign
        });
        
        const input = createElement('input', {
            type: signConfig.type,
            id: `vital-${signConfig.id}`,
            className: 'vital-sign-input',
            placeholder: signConfig.placeholder,
            dataset: { vitalSign: signConfig.id },
            attributes: {
                min: signConfig.min,
                max: signConfig.max,
                step: signConfig.step,
                pattern: signConfig.pattern
            },
            events: {
                input: () => { state.unsavedChanges = true; }
            }
        });
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        formFragment.appendChild(formGroup);
    });
    
    form.appendChild(formFragment);
    container.appendChild(title);
    container.appendChild(form);
    
    return container;
}

/**
 * זיהוי וסימון דגלים אדומים בסיכום
 */
function highlightRedFlags() {
    const summaryElement = getElement('#summary-text');
    if (!summaryElement) return;
    
    const summaryText = summaryElement.textContent;
    
    // בדיקה אם יש דגלים אדומים בסיכום
    if (summaryText.includes('דגלים אדומים:')) {
        // חלק את הטקסט לפסקאות
        const paragraphs = summaryText.split('\n\n');
        let updatedHtml = '';
        
        for (const paragraph of paragraphs) {
            if (paragraph.includes('דגלים אדומים:')) {
                // עטוף את הפסקה של הדגלים האדומים ב-div מיוחד
                updatedHtml += `<div class="red-flag">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="red-flag-content">${paragraph}</div>
                </div>`;
            } else if (paragraph.includes('המלצות לטיפול')) {
                // עטוף את ההמלצות ב-div מיוחד
                updatedHtml += `<div class="treatment-recommendations">
                    <i class="fas fa-clipboard-list"></i>
                    <div class="recommendations-content">${paragraph.replace(/\n/g, '<br>')}</div>
                </div>`;
            } else {
                updatedHtml += `<p>${paragraph}</p>`;
            }
        }
        
        // עדכון התצוגה עם ההדגשות
        summaryElement.innerHTML = updatedHtml;
    }
}

/**
 * הדגשת דגלים אדומים בסיכום הסופי
 */
function highlightRedFlagsInFinalSummary() {
    const summaryElement = getElement('#final-summary-text');
    if (!summaryElement) return;
    
    // שימוש באותה לוגיקה של highlightRedFlags
    const summaryText = summaryElement.textContent;
    
    // בדיקה אם יש דגלים אדומים בסיכום
    if (summaryText.includes('דגלים אדומים:')) {
        // חלק את הטקסט לפסקאות
        const paragraphs = summaryText.split('\n\n');
        let updatedHtml = '';
        
        for (const paragraph of paragraphs) {
            if (paragraph.includes('דגלים אדומים:')) {
                // עטוף את הפסקה של הדגלים האדומים ב-div מיוחד
                updatedHtml += `<div class="red-flag">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="red-flag-content">${paragraph}</div>
                </div>`;
            } else if (paragraph.includes('המלצות לטיפול')) {
                // עטוף את ההמלצות ב-div מיוחד
                updatedHtml += `<div class="treatment-recommendations">
                    <i class="fas fa-clipboard-list"></i>
                    <div class="recommendations-content">${paragraph.replace(/\n/g, '<br>')}</div>
                </div>`;
            } else {
                updatedHtml += `<p>${paragraph}</p>`;
            }
        }
        
        // עדכון התצוגה עם ההדגשות
        summaryElement.innerHTML = updatedHtml;
    }
}

/**
 * פונקציה לבדיקת תקינות כתובת דוא"ל
 * @param {string} email - כתובת הדוא"ל לבדיקה
 * @returns {boolean} - האם הכתובת תקינה
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * פונקציה משופרת לאיפוס הטופס והתחלה מחדש
 * @param {boolean} confirmReset - האם לבקש אישור לאיפוס
 * @returns {boolean} - האם האיפוס הצליח
 */
function resetForm(confirmReset = true) {
    // בדיקה אם יש שינויים לא שמורים
    if (state.unsavedChanges && confirmReset) {
        const confirmAction = confirm("יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לאפס את הטופס?");
        if (!confirmAction) {
            return false;
        }
    }
    
    // איפוס טופס בסיסי - בצע בקבוצות לביצועים טובים יותר
    const resetGroups = [
        // איפוס שדות פרופיל בסיסיים
        () => {
            getElement('#patient-age').value = '';
            document.querySelectorAll('input[name="gender"]')[0].checked = true;
            getElement('#main-complaint').selectedIndex = 0;
            getElement('#other-complaint').value = '';
            getElement('#other-complaint-container').style.display = 'none';
            getElement('#doctor-email').value = '';
        },
        
        // איפוס שדות פרופיל רפואי
        () => {
            document.querySelectorAll('input[name="profile"]')[0].checked = true;
            getElement('#medical-sections').value = '';
            
            // איפוס אלרגיות, תרופות ועישון
            ['allergies', 'medications', 'smoking'].forEach(field => {
                document.querySelectorAll(`input[name="${field}"]`)[0].checked = true;
                getElement(`#${field}-details`).value = '';
                getElement(`#${field}-details-container`).style.display = 'none';
            });
        },
        
        // איפוס תיבות בחירה וסולמות
        () => {
            // איפוס תיבות סימון
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // איפוס כפתורי סקאלה
            document.querySelectorAll('.scale-button.selected').forEach(button => {
                button.classList.remove('selected');
            });
            
            // איפוס שדות "אחר"
            document.querySelectorAll('.other-input').forEach(input => {
                input.value = '';
                input.style.display = 'none';
            });
        },
        
        // איפוס שדות הערות
        () => {
            document.querySelectorAll('.notes-field').forEach(field => {
                field.value = '';
                field.style.display = 'none';
            });
            
            // איפוס כפתורי הערות
            document.querySelectorAll('.notes-toggle').forEach(toggle => {
                toggle.innerHTML = '<i class="fas fa-sticky-note"></i> הוסף הערה';
            });
        },
        
        // איפוס אזורי פציעה בגוף
        () => {
            const selectedBodyParts = getElement('#selected-body-parts');
            if (selectedBodyParts) {
                selectedBodyParts.innerHTML = '';
            }
            
            // איפוס הדגשות בכפתורי אזורי גוף
            document.querySelectorAll('.body-part-button.selected').forEach(button => {
                button.classList.remove('selected');
            });
        }
    ];
    
    // ביצוע איפוס בקבוצות עם דחיית מרווחים לטיפול בUIזץ
    requestAnimationFrame(() => {
        resetGroups.forEach((resetFunction, index) => {
            setTimeout(() => {
                resetFunction();
            }, index * 5); // דחייה קלה בין הקבוצות (5ms)
        });
        
        // איפוס המצב
        state.patientRecord = null;
        state.unsavedChanges = false;
        
        // חזרה לשלב הראשון
        showStep(1, true);
        
        // הצגת הודעת איפוס
        showToast('info', 'הטופס אופס בהצלחה');
    });
    
    return true;
}

/**
 * פונקציה להצגת הודעות toast - משופרת
 * @param {string} type - סוג ההודעה (success/error/warning/info/sending)
 * @param {string} message - תוכן ההודעה
 * @param {number} duration - משך הצגת ההודעה במילישניות
 * @returns {HTMLElement} - אלמנט ההודעה
 */
function showToast(type, message, duration = 3000) {
    // הסרת הודעות קודמות אם קיימות
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => {
        document.body.removeChild(toast);
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
 * יצירת סיכום אנמנזה משופר
 * @param {object} patientRecord - רשומת המטופל
 * @returns {Promise<object>} - רשומת המטופל המעודכנת
 */
async function generateSummary(patientRecord) {
    return new Promise((resolve, reject) => {
        try {
            // בדיקה אם יש תקשורת עם שרת - ניסיון להשתמש בשירות AI
            if (window.navigator.onLine && window.AIService) {
                // ניסיון ליצור סיכום עם שירות AI
                console.log("משתמש בשירות AI ליצירת סיכום מתקדם...");
                
                // יצירת פרומפט מותאם ושליחה למודל
                // (בסביבת פיתוח נמשיך להשתמש בפונקציית הסיכום הרגילה)
                try {
                    // בדיקה אם תוספת המלצות טיפוליות זמינה
                    let hasRecommendations = false;
                    if (window.MedicalGuide && typeof window.MedicalGuide.getRecommendations === 'function') {
                        hasRecommendations = true;
                    }
                    
                    // שימוש בפונקציית סיכום רגילה בתור fallback
                    const summary = createDetailedMedicalSummary(patientRecord, hasRecommendations);
                    patientRecord.summary = summary;
                    
                    // הוספת המלצות אם הן זמינות
                    if (hasRecommendations) {
                        const recommendations = window.MedicalGuide.generateRecommendationsText(
                            patientRecord.patientInfo.mainComplaint, 
                            patientRecord
                        );
                        
                        if (recommendations) {
                            patientRecord.summary += '\n\n' + recommendations;
                        }
                    }
                    
                    resolve(patientRecord);
                } catch (error) {
                    console.warn("נכשל בשימוש בשירות AI, משתמש בלוגיקת סיכום מקומית", error);
                    
                    // נפלבק לסיכום רגיל
                    const summary = createDetailedMedicalSummary(patientRecord);
                    patientRecord.summary = summary;
                    resolve(patientRecord);
                }
            } else {
                // אין חיבור לשרת או שירות AI לא זמין, משתמש בלוגיקה מקומית
                console.log("משתמש בלוגיקת סיכום מקומית");
                const summary = createDetailedMedicalSummary(patientRecord);
                patientRecord.summary = summary;
                resolve(patientRecord);
            }
        } catch (error) {
            console.error("שגיאה ביצירת סיכום:", error);
            
            // יצירת סיכום בסיסי במקרה של כישלון
            const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
            const genderText = gender === 'male' ? 'זכר' : 'נקבה';
            
            patientRecord.summary = `פרופיל ${profile}, ${medicalSections || "ללא סעיפים"}, ${allergies || "ללא אלרגיות ידועות"}, ${medications || "לא נוטל תרופות באופן קבוע"}.\n\nמטופל/ת בגיל ${age}, ${genderText}, ${smoking === 'yes' ? 'מעשן/ת' : 'לא מעשן/ת'}, עם תלונה עיקרית של ${mainComplaint}.\n\nלא ניתן היה ליצור סיכום מפורט עקב בעיה טכנית.`;
            
            resolve(patientRecord);
        }
    });
}

/**
 * יצירת סיכום אנמנזה רפואית מפורט ומקצועי - גרסה 2.0
 * משפר את הניסוח ומבנה האנמנזה הסופית
 * @param {object} patientRecord - רשומת המטופל
 * @param {boolean} includeRecommendations - האם לכלול גם המלצות טיפוליות
 * @returns {string} - סיכום אנמנזה
 */
function createDetailedMedicalSummary(patientRecord, includeRecommendations = false) {
    try {
        // חילוץ מידע בסיסי
        const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
        const genderText = gender === 'male' ? 'זכר' : 'נקבה';
        const smokingText = smoking === 'yes' ? 'מעשן/ת' : 'לא מעשן/ת';
        
        // 1. פתיחת האנמנזה עם פרטי הפרופיל הרפואי
        let summary = `פרופיל ${profile}, ${medicalSections || "ללא סעיפים"}, ${allergies || "ללא אלרגיות ידועות"}, ${medications || "לא נוטל/ת תרופות באופן קבוע"}.\n\n`;
        
        // 2. תיאור דמוגרפי ותלונה עיקרית
        summary += `מטופל/ת בן/בת ${age}, ${genderText}, ${smokingText}, פונה עם תלונה עיקרית של ${mainComplaint}`;
        
        // 3. הוספת המדדים אם קיימים
        if (patientRecord.vitalSigns && Object.keys(patientRecord.vitalSigns).length > 0) {
            summary += '.\n\nסימנים חיוניים בקבלה: ';
            const vitalSignsArr = [];
            
            if (patientRecord.vitalSigns.pulse) {
                vitalSignsArr.push(`דופק ${patientRecord.vitalSigns.pulse} לדקה`);
            }
            if (patientRecord.vitalSigns.bloodPressure) {
                vitalSignsArr.push(`ל"ד ${patientRecord.vitalSigns.bloodPressure} מ"מ כספית`);
            }
            if (patientRecord.vitalSigns.temperature) {
                vitalSignsArr.push(`חום ${patientRecord.vitalSigns.temperature}°C`);
            }
            if (patientRecord.vitalSigns.saturation) {
                vitalSignsArr.push(`סטורציה ${patientRecord.vitalSigns.saturation}%`);
            }
            if (patientRecord.vitalSigns.respiratoryRate) {
                vitalSignsArr.push(`קצב נשימות ${patientRecord.vitalSigns.respiratoryRate} לדקה`);
            }
            
            summary += vitalSignsArr.join(', ') + '.';
        } else {
            summary += '.';
        }
        
        // איסוף מידע אנמנסטי מהתשובות
        let duration = "";
        let location = "";
        let characteristics = [];
        let associatedSymptoms = [];
        let aggravatingFactors = [];
        let relievingFactors = [];
        let treatments = [];
        let negativeFindings = []; // ממצאים שליליים
        let notes = [];           // הערות שהתווספו
        
        // חיפוש תשובות רלוונטיות מכל השאלות
        const allAnswers = {
            ...patientRecord.standardAnswers,
            ...patientRecord.dynamicAnswers
        };
        
        // 4. עיבוד המידע מהתשובות - בצורה חכמה יותר
        for (const [question, answer] of Object.entries(allAnswers)) {
            if (!answer || answer.trim() === '') continue;
            
            // הפרדת הערות מהתשובות הרגילות
            if (question.startsWith('הערה: ')) {
                notes.push(`${question.replace('הערה: ', '')}: ${answer}`);
                continue;
            }
            
            // זיהוי קטגוריות מידע שונות לפי מילות מפתח
            if (question.match(/זמן|מתי|כמה זמן|משך|מאז מתי|התחיל לפני/i)) {
                duration = answer;
            } 
            else if (question.match(/היכן|מיקום|איפה|ממוקם|מוקד/i)) {
                location = answer;
            }
            else if (question.match(/אופי|מתאר|סוג|תיאור/i)) {
                characteristics.push(answer);
            }
            else if (question.match(/מחמיר|גורם להחמרה|הכאב גובר/i)) {
                aggravatingFactors.push(answer);
            }
            else if (question.match(/מקל|גורם להקלה|משפר|מוריד/i)) {
                relievingFactors.push(answer);
            }
            else if (question.match(/סימפטומים נוספים|תסמינים|בחילה|הקאות|חום|סחרחורת|נימול|חולשה/i)) {
                if (answer.toLowerCase().match(/^לא|אין|שולל/)) {
                    negativeFindings.push(`שולל/ת ${question.replace(/\?|האם יש|האם|יש/gi, '').trim()}`);
                } else {
                    associatedSymptoms.push(`${question.replace(/\?/g, '').trim()}: ${answer}`);
                }
            }
            else if (question.match(/טיפול|תרופות|לקחת|מדיקמנט|כדור/i)) {
                if (answer.toLowerCase().match(/^לא|אין|שולל|לא נוטל/)) {
                    negativeFindings.push("שולל/ת נטילת תרופות או טיפולים קודמים");
                } else {
                    treatments.push(`${question.replace(/\?/g, '').trim()}: ${answer}`);
                }
            }
            // תיקון: התאמת ניסוח לפי מגדר
// בערך בשורה 2000 בפונקציה createDetailedMedicalSummary
// בתוך הלולאה שעוברת על התשובות

if (answer.toLowerCase().match(/^לא|אין|שולל/)) {
    const negTermBase = question
        .replace(/\?|האם יש|האם|יש/gi, '')
        .trim()
        .replace(/^\s+|\s+$/g, ''); // הסרת רווחים מיותרים
    
    // התאם את הניסוח למגדר המטופל
    const genderPrefix = gender === 'male' ? 'שולל' : 'שוללת';
    
    if (negTermBase) {
        negativeFindings.push(`${genderPrefix} ${negTermBase}`);
    }
}

    // וכן בהמשך, כאשר בונים את המשפט של הממצאים השליליים:
    if (negativeFindings.length > 0) {
        summary += `\n\nממצאים שליליים: ${negativeFindings.join("; ")}. `;
    }

            // הוספת מידע נוסף שלא סווג לקטגוריות מוגדרות
            else if (!question.match(/אחר|נוסף|שם|גיל|כתובת|טלפון/i)) {
                // הוספת מידע נוסף שלא סווג לקטגוריות מוגדרות
                associatedSymptoms.push(`${question.replace(/\?/g, '').trim()}: ${answer}`);
            }
        }
        
        // 5. בניית תיאור משמעותי בצורה קוהרנטית
        summary += "\n\nאנמנזה: ";
        
        // תיאור עשיר של התלונה העיקרית וההיסטוריה
        const complaintDescription = [];
        
        if (duration) {
            complaintDescription.push(`החל/ה לפני ${duration}`);
        }
        
        if (location) {
            complaintDescription.push(`ממוקם ב${location}`);
        }
        
        if (characteristics.length > 0) {
            complaintDescription.push(`מתואר כ${characteristics.join(", ")}`);
        }
        
        // חיבור התיאורים בצורה טבעית
        if (complaintDescription.length > 0) {
            summary += `מטופל/ת מדווח/ת על ${mainComplaint} ש${complaintDescription.join(", ")}`;
        } else {
            summary += `מטופל/ת מדווח/ת על ${mainComplaint}`;
        }
        
        summary += '. ';
        
        // 6. הוספת סימפטומים נלווים בפורמט משופר
        if (associatedSymptoms.length > 0) {
            summary += `\n\nסימפטומים נלווים: ${associatedSymptoms.join("; ")}. `;
        }
        
        // 7. הוספת גורמים מחמירים ומקלים
        if (aggravatingFactors.length > 0 || relievingFactors.length > 0) {
            summary += "\n\n";
            
            if (aggravatingFactors.length > 0) {
                summary += `גורמים מחמירים: ${aggravatingFactors.join("; ")}. `;
            }
            
            if (relievingFactors.length > 0) {
                summary += `גורמים מקלים: ${relievingFactors.join("; ")}. `;
            }
        }
        
        // 8. הוספת מידע על טיפולים
        if (treatments.length > 0) {
            summary += `\n\nטיפולים שננקטו טרם הפנייה: ${treatments.join("; ")}. `;
        }
        
        // 9. הוספת ממצאים שליליים
        if (negativeFindings.length > 0) {
            summary += `\n\nממצאים שליליים: ${negativeFindings.join("; ")}. `;
        }
        
        // 10. הוספת הערות אם הוזנו
        if (notes.length > 0) {
            summary += `\n\nהערות נוספות: ${notes.join("; ")}. `;
        }
        
        // 11. סיום האנמנזה עם דגלים אדומים
        const redFlags = window.MedicalDataSystem && typeof window.MedicalDataSystem.checkForRedFlags === 'function' ?
            window.MedicalDataSystem.checkForRedFlags(patientRecord) : [];
        
        if (redFlags && redFlags.length > 0) {
            summary += `\n\nדגלים אדומים: ${redFlags.join("; ")}.`;
        }
        
        // 12. הוספת המלצות טיפוליות אם ביקשו
        if (includeRecommendations && window.MedicalGuide && typeof window.MedicalGuide.getRecommendations === 'function') {
            try {
                const recommendations = window.MedicalGuide.getRecommendations(mainComplaint, patientRecord);
                
                if (recommendations) {
                    summary += "\n\nהמלצות לטיפול:\n";
                    
                    // המלצות כלליות
                    if (recommendations.general && recommendations.general.length > 0) {
                        summary += "- " + recommendations.general.join("\n- ");
                    }
                    
                    // המלצות ספציפיות
                    if (recommendations.specific && recommendations.specific.length > 0) {
                        summary += "\n\nהמלצות מותאמות למצב:";
                        recommendations.specific.forEach(specificRec => {
                            summary += `\n- ${specificRec.condition}: ${specificRec.recommendations.join(", ")}`;
                        });
                    }
                }
            } catch (error) {
                console.warn("שגיאה בהוספת המלצות טיפוליות:", error);
            }
        }
        
        return summary;
    } catch (error) {
        console.error("שגיאה ביצירת סיכום מפורט:", error);
        
        // אם יש שגיאה, יצירת סיכום בסיסי
        const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
        const genderText = gender === 'male' ? 'זכר' : 'נקבה';
        
        return `פרופיל ${profile}, ${medicalSections || "ללא סעיפים"}, ${allergies || "ללא אלרגיות ידועות"}, ${medications || "לא נוטל/ת תרופות באופן קבוע"}.\n\nמטופל/ת בן/בת ${age}, ${genderText}, ${smoking === 'yes' ? 'מעשן/ת' : 'לא מעשן/ת'}, פונה עם תלונה עיקרית של ${mainComplaint}.\n\nלא ניתן היה להפיק סיכום מפורט בשל בעיה טכנית.`;
    }
}

// ======== אתחול המערכת והתחלת האפליקציה ========

/**
 * פונקציית אתחול ראשי של האפליקציה
 * שימוש בדפוס התבנית הזה מאחד את כל קריאות האתחול
 * ומאפשר ביצועים טובים יותר
 */
async function generateSummary(patientRecord) {
    try {
      // הצגת הודעה בתחילת התהליך
      console.log("מתחיל תהליך יצירת סיכום...");
      
      // שליחת בקשה לשרת
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientRecord)
      });
      
      const data = await response.json();
      
      // בדיקה אם התקבלה תשובה מ-API או מסימולציה
      if (data.source === 'api') {
        console.log("✅ סיכום התקבל מ-OpenAI API");
      } else {
        console.log("⚠️ סיכום התקבל מסימולציה מקומית");
      }
      
      patientRecord.summary = data.summary;
      return patientRecord;
    } catch (error) {
      console.error("שגיאה ביצירת סיכום:", error);
      return patientRecord;
    }
  }
function initializeApplication() {
    console.time('app-initialization');
    
    // איפוס מטמון אלמנטים
    state.cachedElements = new Map();
    
    // אתחול במקבץ ראשון - התאמות UI בסיסיות
    
    // 1. הוספת כפתור מצב לילה משופר במיקום טוב יותר
    const darkModeToggle = createImprovedDarkModeToggle();
    document.body.appendChild(darkModeToggle);
    
    // 2. הפעלת מצב תצוגה התחלתי
    document.body.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
    
    // 3. הוספת סרגל התקדמות
    const mainContainer = getElement('.container');
    if (mainContainer) {
        const progressBar = createElement('div', {
            id: 'progress-bar-container',
            className: 'progress-bar-container'
        });
        mainContainer.insertBefore(progressBar, mainContainer.firstChild);
        updateProgressBar();
    }
    
    // אתחול מקבץ שני - מילוי נתונים בטופס
    
    // 4. הוספת כפתורי גיל מהירים
    const ageField = getElement('#patient-age');
    if (ageField) {
        const ageFieldParent = ageField.parentElement;
        const ageButtons = createAgeButtons();
        ageFieldParent.appendChild(ageButtons);
    }
    
    // 5. מילוי רשימת התלונות הנפוצות המותאמות למשרד
    const complaintSelect = getElement('#main-complaint');
    if (complaintSelect) {
        // ריקון ומילוי רשימת התלונות
        complaintSelect.innerHTML = '';
        
        // הוספת אופציה ריקה התחלתית
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'בחר תלונה עיקרית';
        emptyOption.disabled = true;
        emptyOption.selected = true;
        complaintSelect.appendChild(emptyOption);
        
        // מילוי התלונות הרלוונטיות למשרד
        const fragment = document.createDocumentFragment();
        relevantComplaints.forEach(complaint => {
            const option = document.createElement('option');
            option.value = complaint;
            option.textContent = complaint;
            fragment.appendChild(option);
        });
        
        complaintSelect.appendChild(fragment);
        
        // הוספת ממשק חיפוש לתלונות
        createComplaintSearchInterface(complaintSelect, relevantComplaints);
        
        // טיפול בתלונה "אחר"
        complaintSelect.addEventListener('change', function() {
            const otherContainer = getElement('#other-complaint-container');
            if (this.value === 'אחר') {
                otherContainer.style.display = 'block';
            } else {
                otherContainer.style.display = 'none';
            }
            
            state.unsavedChanges = true;
        });
    }
    
    // אתחול מקבץ שלישי - הוספת מאזיני אירועים
    
    // 6. הוספת אירועים לטיפול בשדות אלרגיה, תרופות ועישון
    ['allergies', 'medications', 'smoking'].forEach(field => {
        document.querySelectorAll(`input[name="${field}"]`).forEach(radio => {
            radio.addEventListener('change', function() {
                toggleFieldVisibility(field, this.value === 'yes');
                state.unsavedChanges = true;
            });
        });
    });
    
    // 7. הוספת מאזיני שינויים לכל שדות ההזנה
    document.querySelectorAll('input[type="text"], textarea, input[type="number"]').forEach(input => {
        input.addEventListener('input', () => {
            state.unsavedChanges = true;
        });
    });
    
    // 8. התראה אם המשתמש מנסה לצאת מהדף עם שינויים לא שמורים
    window.addEventListener('beforeunload', function(e) {
        if (state.unsavedChanges) {
            e.preventDefault();
            e.returnValue = 'יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב את הדף?';
            return e.returnValue;
        }
    });
    
    // אתחול מקבץ רביעי - חיבור כפתורי ניווט
    initializeNavigationButtons();
    
    console.timeEnd('app-initialization');
}

/**
 * אתחול כפתורי הניווט בין השלבים
 * ממוטב לביצועים טובים יותר
 */
function initializeNavigationButtons() {
    // שלב 1 -> שלב 2
    getElement('#next-to-step2').addEventListener('click', handleStep1to2);
    
    // שלב 2 -> שלב 1
    getElement('#back-to-step1').addEventListener('click', function() {
        showStep(1);
    });
    
    // שלב 2 -> שלב 3
    getElement('#next-to-step3').addEventListener('click', handleStep2to3);
    
    // שלב 3 -> שלב 2
    getElement('#back-to-step2').addEventListener('click', function() {
        showStep(2);
    });
    
    // שלב 3 -> שלב 4
    getElement('#next-to-step4').addEventListener('click', handleStep3to4);
    
    // שלב 4 -> שלב 3
    getElement('#back-to-step3').addEventListener('click', function() {
        showStep(3);
    });
    
    // כפתור העתקת הסיכום
    getElement('#copy-summary').addEventListener('click', handleCopySummary);
    
    // כפתור סיום בלי צורך בדוא"ל
    getElement('#complete-summary').addEventListener('click', handleCompleteSummary);
    
    // שלב 4 -> שלב 5 (עם שליחה לרופא אופציונלית)
    getElement('#send-summary').addEventListener('click', handleSendSummary);
    
    // כפתור העתקת הסיכום הסופי
    getElement('#copy-final-summary').addEventListener('click', handleCopyFinalSummary);
    
    // התחלת רשומה חדשה
    getElement('#start-new').addEventListener('click', function() {
        resetForm();
    });
    
    // כפתור הדפסה אם קיים
    const printButton = getElement('#print-summary');
    if (printButton) {
        printButton.addEventListener('click', handlePrintSummary);
    }
    
    // כפתור ייצוא PDF אם קיים
    const exportPdfButton = getElement('#export-pdf');
    if (exportPdfButton) {
        exportPdfButton.addEventListener('click', handleExportPdf);
    }
}

/**
 * טיפול במעבר משלב 1 לשלב 2
 * אוסף נתוני פרופיל ותלונה עיקרית ומכין את שלב השאלות
 */
function handleStep1to2() {
    // איסוף נתוני הפרופיל הרפואי
    const profile = getSelectedRadioValue('profile');
    const medicalSections = getElement('#medical-sections').value.trim();
    
    // בדיקה והכנת אלרגיות
    const hasAllergies = getSelectedRadioValue('allergies') === 'yes';
    let allergiesDetails = "ללא אלרגיות ידועות";
    if (hasAllergies) {
        allergiesDetails = getElement('#allergies-details').value.trim();
        if (!allergiesDetails) {
            showToast('error', 'נא לפרט את האלרגיות');
            return;
        }
    }
    
    // בדיקה והכנת תרופות
    const takesMedications = getSelectedRadioValue('medications') === 'yes';
    let medicationsDetails = "לא נוטל תרופות באופן קבוע";
    if (takesMedications) {
        medicationsDetails = getElement('#medications-details').value.trim();
        if (!medicationsDetails) {
            showToast('error', 'נא לפרט את התרופות');
            return;
        }
    }
    
    // בדיקה והכנת עישון
    const isSmoking = getSelectedRadioValue('smoking') === 'yes';
    let smokingDetails = "לא מעשן";
    if (isSmoking) {
        smokingDetails = getElement('#smoking-details').value.trim();
        smokingDetails = smokingDetails ? `מעשן, ${smokingDetails}` : "מעשן";
    }
    
    // וידוא שכל השדות הנדרשים מולאו
    const age = getElement('#patient-age').value;
    const gender = getSelectedRadioValue('gender');
    const mainComplaintSelect = getElement('#main-complaint');
    let mainComplaint = mainComplaintSelect.value;
    
    // בדיקת תקינות הנתונים
    if (!age || age < 0 || age > 120) {
        showToast('error', 'יש להזין גיל תקין (0-120)');
        return;
    }
    
    if (!gender) {
        showToast('error', 'יש לבחור מין');
        return;
    }
    
    if (!mainComplaint) {
        showToast('error', 'יש לבחור תלונה עיקרית');
        return;
    }
    
    // אם נבחר "אחר", לקחת את הערך מהשדה הנוסף
    if (mainComplaint === 'אחר') {
        const otherComplaint = getElement('#other-complaint').value.trim();
        if (!otherComplaint) {
            showToast('error', 'יש לפרט את התלונה האחרת');
            return;
        }
        mainComplaint = otherComplaint;
    }
    
    // יצירת רשומת מטופל חדשה
    state.patientRecord = {
        patientInfo: {
            age: parseInt(age),
            gender: gender,
            mainComplaint: mainComplaint,
            timestamp: new Date().toISOString(),
            profile: profile,
            medicalSections: medicalSections || "ללא סעיפים",
            allergies: hasAllergies ? allergiesDetails : "ללא אלרגיות ידועות",
            medications: takesMedications ? medicationsDetails : "לא נוטל תרופות באופן קבוע",
            smoking: isSmoking ? "yes" : "no"
        },
        standardAnswers: {},
        dynamicAnswers: {},
        vitalSigns: {},
        summary: ""
    };
    
    // קבלת מדדים חיוניים רלוונטיים לתלונה
    const relevantVitalSigns = getRelevantVitalSigns(mainComplaint);
    
    // בדיקת מטמון שאלות - לשיפור ביצועים
    let standardQuestions;
    if (state.cachedQuestions.has(mainComplaint)) {
        standardQuestions = state.cachedQuestions.get(mainComplaint);
    } else {
        // קבלת שאלות סטנדרטיות לפי התלונה
        standardQuestions = getStandardQuestions(mainComplaint);
        state.cachedQuestions.set(mainComplaint, standardQuestions);
    }
    
    // הכנת רשימת השאלות הסטנדרטיות - בצורה יעילה
    const questionsList = getElement('#standard-questions-list');
    questionsList.innerHTML = '';
    
    // יצירת פרגמנט לביצועים טובים
    const questionsFragment = document.createDocumentFragment();
    
    if (standardQuestions.length === 0) {
        // אם אין שאלות סטנדרטיות לתלונה זו
        const noQuestionsItem = createElement('li', {
            className: 'question-item',
            text: 'אין שאלות סטנדרטיות לתלונה זו. נא לעבור לשלב הבא.'
        });
        questionsFragment.appendChild(noQuestionsItem);
    } else {
        // הוספת השאלות הסטנדרטיות
        standardQuestions.forEach((question, index) => {
            const questionElement = createQuestionElement(question, index, true);
            questionsFragment.appendChild(questionElement);
        });
    }
    
    questionsList.appendChild(questionsFragment);
    
    // הוספת אפשרות מיקום פציעה מפורט אם רלוונטי
    if (mainComplaint.includes("פציעה") || mainComplaint.includes("שבר") || 
        mainComplaint.includes("נקע") || mainComplaint.includes("ספורט") ||
        mainComplaint.includes("כאב שריר")) {
        
        const injurySectionContainer = createElement('div', {
            className: 'additional-section',
            id: 'injury-location-section'
        });
        
        const injurySectionTitle = createElement('h3', {
            text: 'פרטי מיקום הפציעה'
        });
        
        injurySectionContainer.appendChild(injurySectionTitle);
        
        // יצירת בורר מיקום פציעה אינטראקטיבי
        const injuryLocationSelector = createAdvancedInjuryLocationSelector();
        injurySectionContainer.appendChild(injuryLocationSelector);
        
        // הוספה לפני אזור המדדים החיוניים
        const vitalSignsContainer = getElement('#vital-signs-container');
        vitalSignsContainer.parentNode.insertBefore(injurySectionContainer, vitalSignsContainer);
    }
    
    // הוספת טופס מדדים חיוניים
    const vitalSignsContainer = getElement('#vital-signs-container');
    vitalSignsContainer.innerHTML = '';
    if (relevantVitalSigns.length > 0) {
        const vitalSignsForm = createVitalSignsForm(relevantVitalSigns);
        vitalSignsContainer.appendChild(vitalSignsForm);
    }
    
    // מעבר לשלב הבא
    showStep(2);
}

/**
 * טיפול במעבר משלב 2 לשלב 3
 * אוסף תשובות סטנדרטיות ומכין שאלות המשך דינמיות
 */
function handleStep2to3() {
    // איסוף תשובות לשאלות סטנדרטיות
    const standardAnswers = collectAnswers('input[data-standard="true"], select[data-standard="true"], textarea[data-standard="true"], input[type="hidden"][data-standard="true"]');
    
    // שמירת התשובות ברשומת המטופל
    state.patientRecord.standardAnswers = standardAnswers;
    
    // שמירת מדדים חיוניים
    state.patientRecord.vitalSigns = collectVitalSigns();
    
    // שמירת מיקום פציעה אם רלוונטי
    const injuryLocationValue = getElement('#injury-location-value');
    if (injuryLocationValue && injuryLocationValue.value) {
        state.patientRecord.standardAnswers['מיקום הפציעה המדויק'] = injuryLocationValue.value;
    }
    
    // הצגת אנימציית טעינה
    getElement('#dynamic-questions-loading').style.display = 'block';
    getElement('#dynamic-questions-container').style.display = 'none';
    
    // מעבר לשלב הבא
    showStep(3);
    
    // ייעול התהליך - יצירת שאלות דינמיות רק לאחר סיום מעבר ה-DOM
    setTimeout(() => {
        let dynamicQuestions = [];
        
        // בדיקה אם מדובר בפציעת ספורט או שריר ושימוש בשאלות ייעודיות
        if (state.patientRecord.patientInfo.mainComplaint.includes("פציעת ספורט") || 
            state.patientRecord.patientInfo.mainComplaint.includes("כאב שריר") ||
            state.patientRecord.patientInfo.mainComplaint.includes("פציעת שריר")) {
            dynamicQuestions = createSportsInjuryQuestions();
        } else {
            // בדיקת מטמון
            const cacheKey = state.patientRecord.patientInfo.mainComplaint;
            if (state.cachedQuestions.has(`dynamic_${cacheKey}`)) {
                dynamicQuestions = state.cachedQuestions.get(`dynamic_${cacheKey}`);
            } else {
                dynamicQuestions = getDynamicQuestions(
                    state.patientRecord.patientInfo.mainComplaint, 
                    standardAnswers
                );
                state.cachedQuestions.set(`dynamic_${cacheKey}`, dynamicQuestions);
            }
        }
        
        // יצירת אלמנטי שאלות דינמיות
        const questionsList = getElement('#dynamic-questions-list');
        questionsList.innerHTML = '';
        
        // יצירת פרגמנט לביצועים טובים
        const questionsFragment = document.createDocumentFragment();
        
        if (dynamicQuestions.length === 0) {
            const noQuestionsItem = createElement('li', {
                className: 'question-item',
                text: 'אין שאלות נוספות לתלונה זו. נא לעבור לשלב הבא.'
            });
            questionsFragment.appendChild(noQuestionsItem);
        } else {
            dynamicQuestions.forEach((question, index) => {
                const questionElement = createQuestionElement(question, index, false);
                questionsFragment.appendChild(questionElement);
            });
        }
        
        // הוספת אפשרות להערות חופשיות
        const freeTextContainer = createElement('div', {
            className: 'free-notes-container'
        });
        
        const freeTextTitle = createElement('h3', {
            text: 'מידע נוסף'
        });
        
        const freeTextArea = createElement('textarea', {
            className: 'free-text-area',
            rows: 5,
            placeholder: 'הוסף כל מידע נוסף שלא נכלל בשאלות הקודמות...',
            dataset: {
                question: 'מידע נוסף',
                dynamic: 'true',
                type: 'multiline'
            },
            events: {
                input: () => { state.unsavedChanges = true; }
            }
        });
        
        freeTextContainer.appendChild(freeTextTitle);
        freeTextContainer.appendChild(freeTextArea);
        questionsFragment.appendChild(freeTextContainer);
        
        // הוספת כל השאלות במהלך אחד לצמצום reflows
        questionsList.appendChild(questionsFragment);
        
        // הסתרת אנימציית הטעינה והצגת השאלות
        getElement('#dynamic-questions-loading').style.display = 'none';
        getElement('#dynamic-questions-container').style.display = 'block';
    }, 100); // דחייה מינימלית לשיפור חוויית המשתמש
}

/**
 * טיפול במעבר משלב 3 לשלב 4
 * אוסף תשובות דינמיות ומכין את הסיכום
 */
function handleStep3to4() {
    // איסוף תשובות לשאלות דינמיות
    const dynamicAnswers = collectAnswers('input[data-dynamic="true"], select[data-dynamic="true"], textarea[data-dynamic="true"], input[type="hidden"][data-dynamic="true"]');
    
    // שמירת התשובות ברשומת המטופל
    state.patientRecord.dynamicAnswers = dynamicAnswers;
    
    // הצגת אנימציית טעינה
    getElement('#summary-loading').style.display = 'block';
    getElement('#summary-container').style.display = 'none';
    
    // מעבר לשלב הבא
    showStep(4);
    
    // יצירת סיכום אנמנזה - שיפור: ניצול תהליך אסינכרוני
    generateSummary(state.patientRecord)
        .then(patientRecord => {
            state.patientRecord = patientRecord;
            
            // הצגת הסיכום במסך
            getElement('#summary-text').textContent = patientRecord.summary;
            
            // הדגשת דגלים אדומים
            highlightRedFlags();
            
            // הסתרת אנימציית הטעינה והצגת הסיכום
            getElement('#summary-loading').style.display = 'none';
            getElement('#summary-container').style.display = 'block';
        })
        .catch(error => {
            console.error("שגיאה ביצירת סיכום:", error);
            showToast('error', 'אירעה שגיאה ביצירת הסיכום');
            
            // הצגת סיכום בסיסי במקרה של כישלון
            const basicSummary = `סיכום בסיסי של המטופל/ת: ${state.patientRecord.patientInfo.age} שנים, עם תלונה עיקרית של ${state.patientRecord.patientInfo.mainComplaint}.`;
            getElement('#summary-text').textContent = basicSummary;
            
            // הסתרת אנימציית הטעינה והצגת הסיכום
            getElement('#summary-loading').style.display = 'none';
            getElement('#summary-container').style.display = 'block';
        });
}

/**
 * טיפול בלחיצה על כפתור העתקת הסיכום
 */
function handleCopySummary() {
    const summaryText = getElement('#summary-text').textContent;
    
    // העתקה ללוח - ממוטב בעזרת מודל הבטחות
    navigator.clipboard.writeText(summaryText)
        .then(() => {
            // אנימציה להצלחת ההעתקה
            this.classList.add('copy-success');
            
            // הודעת הצלחה
            showToast('success', 'הסיכום הועתק בהצלחה');
            
            // החזרת הטקסט המקורי אחרי 2 שניות
            setTimeout(() => {
                this.classList.remove('copy-success');
            }, 2000);
        })
        .catch(err => {
            console.error('שגיאה בהעתקה:', err);
            showToast('error', 'שגיאה בהעתקה. נסה שוב.');
        });
}

/**
 * טיפול בלחיצה על כפתור סיום בלי צורך בדוא"ל
 */
function handleCompleteSummary() {
    // העבר ישירות לשלב 5 (סיום)
    getElement('#final-summary-text').textContent = state.patientRecord.summary;
    
    // הוסף יכולת העתקה גם בשלב הסיום
    highlightRedFlagsInFinalSummary();
    
    showStep(5);
    
    // איפוס דגל השינויים
    state.unsavedChanges = false;
}

/**
 * טיפול בלחיצה על כפתור שליחת הסיכום לרופא
 */
function handleSendSummary() {
    // בדיקה אם הוזן דוא"ל
    const doctorEmail = getElement('#doctor-email').value.trim();
    
    // בדיקת תקינות הדוא"ל אם הוזן
    if (doctorEmail && !isValidEmail(doctorEmail)) {
        showToast('error', 'כתובת דואר אלקטרוני לא תקינה');
        return;
    }
    
    // העברה לשלב 5 עם הסיכום
    getElement('#final-summary-text').textContent = state.patientRecord.summary;
    
    // הוסף יכולת העתקה גם בשלב הסיום
    highlightRedFlagsInFinalSummary();
    
    // התקדם לשלב הסיום
    showStep(5);
    
    // סימולציית שליחה אם הוזן דוא"ל
    if (doctorEmail) {
        // הצגת הודעת טעינת שליחה
        const sendingToast = showToast('sending', `שולח סיכום לכתובת ${doctorEmail}...`);
        
        // סימולציית שליחה
        setTimeout(() => {
            // הסרת הודעת השליחה אם קיימת
            if (document.body.contains(sendingToast)) {
                document.body.removeChild(sendingToast);
            }
            
            // הצגת הודעת הצלחה
            showToast('success', `הסיכום נשלח בהצלחה לכתובת: ${doctorEmail}`);
            
            // איפוס דגל השינויים
            state.unsavedChanges = false;
        }, 2000);
    } else {
        // איפוס דגל השינויים
        state.unsavedChanges = false;
    }
}

/**
 * טיפול בלחיצה על כפתור העתקת הסיכום הסופי
 */
function handleCopyFinalSummary() {
    const summaryText = getElement('#final-summary-text').textContent;
    
    // העתקה ללוח - ממוטב
    navigator.clipboard.writeText(summaryText)
        .then(() => {
            // אנימציה להצלחת ההעתקה
            this.classList.add('copy-success');
            
            // הודעת הצלחה
            showToast('success', 'הסיכום הועתק בהצלחה');
            
            // החזרת הטקסט המקורי אחרי 2 שניות
            setTimeout(() => {
                this.classList.remove('copy-success');
            }, 2000);
        })
        .catch(err => {
            console.error('שגיאה בהעתקה:', err);
            showToast('error', 'שגיאה בהעתקה. נסה שוב.');
        });
}

/**
 * טיפול בלחיצה על כפתור הדפסת הסיכום
 */
function handlePrintSummary() {
    // הכנת גרסת הדפסה
    const printWindow = window.open('', '_blank');
    
    // יצירת HTML מותאם להדפסה
    const printContent = `
        <!DOCTYPE html>
        <html lang="he" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>סיכום רפואי להדפסה</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    padding: 20px;
                    direction: rtl;
                }
                h1 {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #0056b3;
                }
                .header {
                    border-bottom: 2px solid #0056b3;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .summary {
                    white-space: pre-line;
                    margin-bottom: 30px;
                    font-size: 14px;
                }
                .red-flag {
                    background-color: #fff0f0;
                    border-right: 4px solid #dc3545;
                    padding: 10px;
                    margin: 10px 0;
                }
                .treatment-recommendations {
                    background-color: #f0fff0;
                    border-right: 4px solid #28a745;
                    padding: 10px;
                    margin: 10px 0;
                }
                .footer {
                    margin-top: 30px;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                }
                @media print {
                    body { font-size: 12pt; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>סיכום רפואי</h1>
                <p>תאריך: ${new Date().toLocaleDateString('he-IL')}</p>
            </div>
            <div class="summary">
                ${getElement('#final-summary-text').innerHTML}
            </div>
            <div class="footer">
                <p>מסמך זה הופק באמצעות מערכת איסוף נתונים רפואיים</p>
            </div>
            <div class="no-print">
                <button onclick="window.print()">להדפסה לחץ כאן</button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // הדפסה אוטומטית אחרי טעינת החלון
    printWindow.addEventListener('load', function() {
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    });
}

/**
 * טיפול בלחיצה על כפתור ייצוא לקובץ PDF
 */
function handleExportPdf() {
    showToast('info', 'מייצא סיכום כקובץ PDF...');
    
    // סימולציית ייצוא
    setTimeout(() => {
        showToast('success', 'הסיכום יוצא בהצלחה כקובץ PDF');
    }, 1500);
}

/**
 * פונקציות קבלת שאלות סטנדרטיות ודינמיות
 * (ממוטבות לשימוש בשאלות המותאמות למשרד רפואי)
 */
function getStandardQuestions(complaint) {
    // פונקציה זו יכולה לטעון שאלות מהשרת בסביבת ייצור
    // במצב פיתוח/דמו, נשתמש בנתונים קבועים
    
    // הגדרת שאלות סטנדרטיות לפי סוגי תלונות נפוצות במשרד
    const standardQuestionsMap = {
        // כאב גרון
        "כאב גרון": [
            {
                type: "duration",
                question: "כמה זמן נמשך הכאב בגרון?",
                placeholder: "יום / יומיים / שבוע..."
            },
            {
                type: "yesNo",
                question: "האם יש לך חום?",
                followUp: "מה גובה החום ומתי נמדד לאחרונה?"
            },
            {
                type: "multiselect",
                question: "סימפטומים נלווים",
                options: ["שיעול", "נזלת", "גודש באף", "כאב באוזניים", "צרידות", "קשיי בליעה"]
            },
            {
                type: "yesNo",
                question: "האם לקחת תרופות להקלה?",
                followUp: "אילו תרופות והאם הן עזרו?"
            }
        ],
        
        // כאב ראש
        "כאב ראש": [
            {
                type: "duration",
                question: "כמה זמן נמשך כאב הראש?",
                placeholder: "שעות / ימים / שבועות"
            },
            {
                type: "multiselect",
                question: "היכן ממוקם הכאב?",
                options: ["מצח", "רקות", "עורף", "צד ימין", "צד שמאל", "כל הראש"]
            },
            {
                type: "multiselect",
                question: "מהו אופי הכאב?",
                options: ["לוחץ", "פועם", "דוקר", "צורב", "מתמשך", "משתנה בעוצמה"]
            },
            {
                type: "scale",
                question: "מהי עוצמת הכאב בסולם 1-10?",
                placeholder: "דרג מ-1 (קל) עד 10 (חמור ביותר)"
            },
            {
                type: "multiselect",
                question: "האם יש סימפטומים נלווים?",
                options: ["בחילה", "הקאות", "רגישות לאור", "רגישות לרעש", "סחרחורת", "טשטוש ראייה"]
            },
            {
                type: "yesNo",
                question: "האם לקחת תרופות להקלה?",
                followUp: "אילו תרופות והאם הן עזרו?"
            }
        ],
        
        // כאב בטן
        "כאב בטן": [
            {
                type: "duration",
                question: "כמה זמן נמשך כאב הבטן?",
                placeholder: "שעות / ימים / שבועות"
            },
            {
                type: "multiselect",
                question: "היכן ממוקם הכאב?",
                options: ["בטן עליונה", "בטן תחתונה", "צד ימין", "צד שמאל", "סביב הטבור", "כל הבטן"]
            },
            {
                type: "multiselect",
                question: "מהו אופי הכאב?",
                options: ["חד", "מתמשך", "התקפי", "צורב", "לוחץ", "כמו עוויתות"]
            },
            {
                type: "scale",
                question: "מהי עוצמת הכאב בסולם 1-10?",
                placeholder: "דרג מ-1 (קל) עד 10 (חמור ביותר)"
            },
            {
                type: "multiselect",
                question: "האם יש סימפטומים נלווים?",
                options: ["בחילה", "הקאות", "שלשול", "עצירות", "חוסר תיאבון", "נפיחות", "צרבת", "גזים"]
            },
            {
                type: "yesNo",
                question: "האם הכאב קשור לאכילה?",
                followUp: "מתי ביחס לאכילה (לפני/בזמן/אחרי)?"
            },
            {
                type: "yesNo",
                question: "האם לקחת תרופות להקלה?",
                followUp: "אילו תרופות והאם הן עזרו?"
            }
        ],
        
        // כאב גב
        "כאב גב": [
            {
                type: "duration",
                question: "כמה זמן נמשך כאב הגב?",
                placeholder: "ימים / שבועות / חודשים"
            },
            {
                type: "multiselect",
                question: "היכן ממוקם הכאב?",
                options: ["גב עליון", "גב תחתון", "צד ימין", "צד שמאל", "מרכז עמוד השדרה"]
            },
            {
                type: "multiselect",
                question: "מהו אופי הכאב?",
                options: ["חד", "מתמשך", "צורב", "התכווצותי", "מקרין"]
            },
            {
                type: "scale",
                question: "מהי עוצמת הכאב בסולם 1-10?",
                placeholder: "דרג מ-1 (קל) עד 10 (חמור ביותר)"
            },
            {
                type: "yesNo",
                question: "האם הכאב מקרין לגפיים?",
                followUp: "לאן הכאב מקרין ומה עוצמתו?"
            },
            {
                type: "multiselect",
                question: "מה מחמיר את הכאב?",
                options: ["ישיבה ממושכת", "עמידה ממושכת", "הליכה", "התכופפות", "הרמת משאות", "פעילות גופנית"]
            },
            {
                type: "multiselect",
                question: "מה מקל על הכאב?",
                options: ["מנוחה", "שכיבה", "תנוחה מסוימת", "חימום", "קירור", "תרופות", "עיסוי"]
            }
        ],
        
        // כאב שרירים
        "כאב שרירים": [
            {
                type: "duration",
                question: "כמה זמן נמשך כאב השרירים?",
                placeholder: "שעות / ימים / שבועות"
            },
            {
                type: "multiselect",
                question: "באילו שרירים אתה חש כאב?",
                options: ["ידיים", "רגליים", "גב", "צוואר", "כתפיים", "בטן", "כל הגוף"]
            },
            {
                type: "multiselect",
                question: "מהו אופי הכאב?",
                options: ["חד", "מתמשך", "כהות", "התכווצותי", "צורב", "עמום"]
            },
            {
                type: "scale",
                question: "מהי עוצמת הכאב בסולם 1-10?",
                placeholder: "דרג מ-1 (קל) עד 10 (חמור ביותר)"
            },
            {
                type: "yesNo",
                question: "האם הכאב החל לאחר פעילות גופנית?",
                followUp: "איזו פעילות ומתי?"
            },
            {
                type: "multiselect",
                question: "האם יש סימפטומים נלווים?",
                options: ["חולשה", "נפיחות", "חום", "אדמומיות", "הגבלה בתנועה"]
            }
        ],
        
        // כאב פרקים
        "כאב פרקים": [
            {
                type: "duration",
                question: "כמה זמן נמשך כאב הפרקים?",
                placeholder: "ימים / שבועות / חודשים"
            },
            {
                type: "multiselect",
                question: "באילו פרקים אתה חש כאב?",
                options: ["ברכיים", "קרסוליים", "מפרקי הירך", "אצבעות ידיים", "מפרקי כף יד", "מרפקים", "כתפיים", "מפרקי הגב"]
            },
            {
                type: "multiselect",
                question: "מהו אופי הכאב?",
                options: ["חד", "מתמשך", "לוחץ", "צורב", "פועם"]
            },
            {
                type: "scale",
                question: "מהי עוצמת הכאב בסולם 1-10?",
                placeholder: "דרג מ-1 (קל) עד 10 (חמור ביותר)"
            },
            {
                type: "multiselect",
                question: "האם קיימים סימנים נלווים באזור הכאב?",
                options: ["נפיחות", "חום מקומי", "אדמומיות", "הגבלה בתנועה", "רגישות למגע"]
            },
            {
                type: "yesNo",
                question: "האם הכאב משתנה במהלך היום?",
                followUp: "מתי הכאב חמור יותר?"
            },
            {
                type: "multiselect",
                question: "מה מחמיר את הכאב?",
                options: ["תנועה", "עומס", "מזג אוויר", "בוקר", "ערב", "שינה"]
            }
        ],
        
        // פציעת ספורט / פציעת שריר / פציעת רצועה / נקע / דלקת גידים
        "פציעת ספורט": [
            {
                type: "duration",
                question: "מתי אירעה הפציעה?",
                placeholder: "שעות / ימים / שבועות"
            },
            {
                type: "multiselect",
                question: "כיצד אירעה הפציעה?",
                options: ["במהלך ריצה", "במהלך קפיצה", "עצירה פתאומית", "מכה/מגע", "תנועה מסתובבת", "מתיחה יתרה"]
            },
            {
                type: "multiselect",
                question: "מהו אופי הכאב?",
                options: ["חד", "מתמשך", "פועם", "שורף", "דוקר", "עמום"]
            },
            {
                type: "scale",
                question: "מהי עוצמת הכאב בסולם 1-10?",
                placeholder: "דרג מ-1 (קל) עד 10 (חמור ביותר)"
            },
            {
                type: "yesNo",
                question: "האם יש נפיחות באזור הפציעה?",
                followUp: "תאר את מידת הנפיחות"
            },
            {
                type: "yesNo",
                question: "האם יש שינוי צבע (כחול/אדום) באזור הפציעה?",
                followUp: "תאר את שינוי הצבע"
            },
            {
                type: "yesNo",
                question: "האם יש הגבלה בטווח התנועה?",
                followUp: "תאר את המגבלה"
            }
        ],
        
        // סחרחורת
        "סחרחורת": [
            {
                type: "duration",
                question: "כמה זמן נמשכת הסחרחורת?",
                placeholder: "דקות / שעות / ימים..."
            },
            {
                type: "multiselect",
                question: "איך היית מתאר את אופי הסחרחורת?",
                options: ["תחושת סיבוב", "חוסר יציבות", "תחושת עילפון", "טשטוש", "כבדות בראש"]
            },
            {
                type: "multiselect",
                question: "מה מעורר את הסחרחורת?",
                options: ["שינוי תנוחה", "קימה מהירה", "תנועות ראש", "צפייה במסך", "רעש חזק", "ללא גורם ברור"]
            },
            {
                type: "multiselect",
                question: "האם יש סימפטומים נלווים?",
                options: ["בחילה", "הקאות", "כאב ראש", "טשטוש ראייה", "צלצולים באוזניים", "חולשה"]
            },
            {
                type: "yesNo",
                question: "האם את/ה נוטל/ת תרופות באופן קבוע?",
                followUp: "אילו תרופות?"
            }
        ],
        
        // תבנית שאלות כללית לכל סוגי הפציעות/מחלות שלא הוגדרו ספציפית
        "default": [
            {
                type: "duration",
                question: "כמה זמן נמשכים הסימפטומים?",
                placeholder: "שעות / ימים / שבועות..."
            },
            {
                type: "multiselect",
                question: "כיצד התחילו הסימפטומים?",
                options: ["בפתאומיות", "בהדרגה", "לאחר אירוע מסוים", "ללא סיבה ברורה"]
            },
            {
                type: "scale",
                question: "מהי עוצמת הסימפטומים בסולם 1-10?",
                placeholder: "דרג מ-1 (קל) עד 10 (חמור ביותר)"
            },
            {
                type: "yesNo",
                question: "האם ניסית טיפול כלשהו עד כה?",
                followUp: "איזה טיפול והאם הועיל?"
            },
            {
                type: "multiselect",
                question: "האם יש סימפטומים נוספים מלבד התלונה העיקרית?",
                options: ["חום", "חולשה", "עייפות", "כאב", "בעיות שינה", "חוסר תיאבון"]
            }
        ]
    };
    
    // שיפור - התאמה על סמך מילות מפתח בתלונה
    let questionsKey = "default";
    
    // חיפוש התאמות תלונה לפי מילות מפתח
    if (complaint.includes("שריר")) {
        questionsKey = "כאב שרירים";
    } else if (complaint.includes("פרק")) {
        questionsKey = "כאב פרקים";
    } else if (complaint.includes("גב")) {
        questionsKey = "כאב גב";
    } else if (complaint.includes("ראש")) {
        questionsKey = "כאב ראש";
    } else if (complaint.includes("בטן")) {
        questionsKey = "כאב בטן";
    } else if (complaint.includes("גרון")) {
        questionsKey = "כאב גרון";
    } else if (complaint.includes("ספורט") || complaint.includes("פציעה") || complaint.includes("נקע") || 
               complaint.includes("מתיחה") || complaint.includes("רצועה") || complaint.includes("גיד")) {
        questionsKey = "פציעת ספורט";
    } else if (complaint.includes("סחרחורת") || complaint.includes("סחרחור")) {
        questionsKey = "סחרחורת";
    } else {
        // חיפוש התאמה ישירה
        questionsKey = Object.keys(standardQuestionsMap).find(key => 
            complaint.includes(key) || key.includes(complaint)
        ) || "default";
    }
    
    return standardQuestionsMap[questionsKey] || standardQuestionsMap["default"];
}

/**
 * קבלת שאלות דינמיות - מותאמות אישית לפי התשובות הקודמות
 * @param {string} complaint - התלונה העיקרית
 * @param {object} previousAnswers - תשובות קודמות לשאלות
 * @returns {Array} - מערך שאלות דינמיות
 */
/**
 * קבלת שאלות דינמיות - מותאמות אישית לפי התשובות הקודמות
 * @param {string} complaint - התלונה העיקרית
 * @param {object} previousAnswers - תשובות קודמות לשאלות
 * @returns {Promise<Array>} - מערך שאלות דינמיות (א-סינכרוני!).
 */

/**
 * קריאה אמיתית ל-OpenAI API כדי לנסות להפיק שאלות המשך דינמיות
 * על בסיס תשובות המשתמש בשלב 2.
 * כדי למנוע בעיות אבטחה, מומלץ להריץ בצד שרת (Node.js),
 * ולא לחשוף מפתח API בצד הלקוח.
 */
/**
 * פונקציה זו פונה ישירות ל-OpenAI API מתוך הדפדפן (צד לקוח),
 * ומבקשת 3-5 שאלות המשך בעברית על סמך התלונה והתשובות הקודמות.
 * שים לב שעליך להחליף את הטקסט "YOUR_OPENAI_API_KEY" במפתח אמיתי.
 */
async function getDynamicQuestionsFromChatGPT(complaint, previousAnswers) {
    try {
      // 1. בניית מחרוזת תשובות (JSON).
      const answersString = JSON.stringify(previousAnswers, null, 2);
  
      // 2. בניית prompt: מה אנחנו רוצים לדרוש מ-ChatGPT?
      const prompt = `
  התלונה העיקרית של המטופל/ת: "${complaint}"
  
  התשובות הקודמות שניתנו הן:
  ${answersString}
  
  אנא ניסח 3 עד 5 שאלות המשך רפואיות נוספות, רלוונטיות וממוקדות,
  עבור המטופל/ת, בעברית. כתוב כל שאלה בשורה חדשה, ללא מספור וללא פרטים נוספים.
      `.trim();
  
      // 3. קריאה ל-OpenAI API ישירות (צד לקוח) – לא מומלץ לפרודקשן
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // החלף במפתח האמיתי שלך:
          'Authorization': process.env.OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // או גרסה אחרת
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });
  
      const data = await response.json();
  
      // 4. בדיקה שהתקבלה תשובה תקינה
      if (!data.choices || !data.choices[0]) {
        console.warn('No valid response from ChatGPT:', data);
        return []; // מחזיר מערך ריק
      }
  
      // מקבל את הטקסט של המודל
      const content = data.choices[0].message.content || '';
  
      // מפצל לשורות, מסנן ריקות
      const lines = content
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
  
      // 5. יוצר מערך אובייקטים בסגנון השאלות
      // כאן, לדוגמה, הופך כל שורה לשאלה type="multiline"
      const gptGeneratedQuestions = lines.map(q => {
        return {
          type: 'multiline',
          question: q
        };
      });
  
      // 6. מחזיר את המערך
      return gptGeneratedQuestions;
    } catch (error) {
      console.error('ChatGPT API error:', error);
      return [];
    }
  }
  
  /**
   * פונקציה שמחזירה "שאלות דינמיות" משולבות:
   * 1. שאלות "סטטיות" ממפה קיימת (ע"פ complaint ותשובות קודמות)
   * 2. שאלות ChatGPT (ע"י קריאה ל-getDynamicQuestionsFromChatGPT)
   */
  async function getDynamicQuestions(complaint, previousAnswers) {
    // פונקציית עזר שמזהה אם מילה כלשהי הופיעה בתשובה
    const hasSymptom = (keyword) => {
      return Object.entries(previousAnswers).some(([question, answer]) =>
        question.toLowerCase().includes(keyword.toLowerCase()) ||
        answer.toLowerCase().includes(keyword.toLowerCase())
      );
    };
  
    // מפה של שאלות סטטיות
    const dynamicQuestionsMap = {
      "כאב ראש": [
        {
          type: "yesNo",
          question: "האם יש הפרעות ראייה?",
          followUp: "איזה סוג של הפרעות (טשטוש, כפל ראייה)?"
        },
        hasSymptom('בחילה') ? {
          type: "yesNo",
          question: "האם הבחילות הולכות ומחמירות?",
          followUp: "תאר את ההחמרה"
        } : {
          type: "yesNo",
          question: "האם יש רגישות לריחות?",
          followUp: "לאילו ריחות?"
        },
        hasSymptom('אור') ? {
          type: "yesNo",
          question: "האם הרגישות לאור מופיעה רק בזמן הכאב?",
          followUp: "מתי מופיעה הרגישות לאור?"
        } : {
          type: "yesNo",
          question: "האם כאב הראש מעיר אותך משינה?",
          followUp: "באיזו תדירות?"
        },
        {
          type: "multiselect",
          question: "האם זיהית גורמים שמחמירים את הכאב?",
          options: ["מאמץ", "לחץ נפשי", "אוכל מסוים", "אלכוהול", "קפאין", "ריחות חזקים", "תאורה חזקה"]
        },
        {
          type: "multiselect",
          question: "האם זיהית גורמים שמקלים על הכאב?",
          options: ["מנוחה", "שינה", "חשיכה", "שקט", "תרופות", "קפאין", "אוכל"]
        }
      ],
      "כאב בטן": [
        hasSymptom('שלשול') ? {
          type: "quantity",
          question: "כמה יציאות ביום?",
          placeholder: "מספר משוער של יציאות"
        } : {
          type: "yesNo",
          question: "האם יש עצירות?",
          followUp: "מתי הייתה היציאה האחרונה?"
        },
        {
          type: "multiselect",
          question: "האם הכאב קשור לאכילה?",
          options: ["מופיע לפני אכילה", "מופיע בזמן אכילה", "מופיע אחרי אכילה", "מוחמר ע״י סוגי מזון מסוימים", "אין קשר לאכילה"]
        },
        hasSymptom('דם') ? {
          type: "yesNo",
          question: "האם הדם ביציאות או בהקאות עדיין נמשך?",
          followUp: "מתי הופיע לאחרונה?"
        } : {
          type: "yesNo",
          question: "האם יש שינוי בצבע היציאות?",
          followUp: "מהו הצבע?"
        },
        {
          type: "yesNo",
          question: "האם הכאב מקרין לאזורים אחרים?",
          followUp: "לאן הכאב מקרין?"
        },
        {
          type: "multiselect",
          question: "האם זיהית גורמים שמחמירים את הכאב?",
          options: ["מזון מסוים", "שתייה", "תרופות", "לחץ", "תנוחה מסוימת", "תנועה"]
        }
      ],
      "כאב גב": [
        {
          type: "yesNo",
          question: "האם הכאב מקרין לרגליים?",
          followUp: "האם לרגל אחת או לשתיהן, ועד היכן?"
        },
        hasSymptom('כאב') && hasSymptom('בוקר') ? {
          type: "yesNo",
          question: "האם קיימת נוקשות בוקר?",
          followUp: "כמה זמן נמשכת הנוקשות?"
        } : {
          type: "yesNo",
          question: "האם הכאב גובר בלילה או בשכיבה?",
          followUp: "באיזו תנוחת שכיבה?"
        },
        {
          type: "multiselect",
          question: "מה מקל על הכאב?",
          options: ["מנוחה", "תנועה", "תרופות", "חימום", "קירור", "עיסוי", "שינוי תנוחה"]
        },
        {
          type: "yesNo",
          question: "האם יש הגבלה בטווח התנועה?",
          followUp: "איזו תנועה מוגבלת?"
        },
        {
          type: "yesNo",
          question: "האם יש חולשה ברגליים או בעיות בשליטה בשתן/צואה?",
          followUp: "פרט"
        }
      ],
      "כאב שרירים": [
        {
          type: "yesNo",
          question: "האם הכאב החל לאחר פעילות גופנית?",
          followUp: "איזו פעילות ומתי?"
        },
        {
          type: "multiselect",
          question: "האם יש סימנים נוספים באזור הכאוב?",
          options: ["נפיחות", "חום מקומי", "אדמומיות", "כחלון", "רגישות למגע"]
        },
        {
          type: "multiselect",
          question: "מה מקל על הכאב?",
          options: ["מנוחה", "תנועה", "חימום", "קירור", "עיסוי", "תרופות"]
        },
        {
          type: "yesNo",
          question: "האם יש הגבלה בטווח התנועה?",
          followUp: "איזו תנועה מוגבלת?"
        },
        {
          type: "yesNo",
          question: "האם יש חולשה באזור הפגוע?",
          followUp: "פרט את מידת החולשה"
        }
      ]
    };
  
    // זיהוי המפתח המתאים
    let questionsKey = "default";
    if (complaint.includes("שריר")) {
      questionsKey = "כאב שרירים";
    } else if (complaint.includes("גב")) {
      questionsKey = "כאב גב";
    } else if (complaint.includes("ראש")) {
      questionsKey = "כאב ראש";
    } else if (complaint.includes("בטן")) {
      questionsKey = "כאב בטן";
    } else {
      // חיפוש התאמה ישירה
      const foundKey = Object.keys(dynamicQuestionsMap).find(key =>
        complaint.includes(key) || key.includes(complaint)
      );
      if (foundKey) questionsKey = foundKey;
    }
  
    // שאלות סטטיות
    let staticQuestions = [];
    if (questionsKey && dynamicQuestionsMap[questionsKey]) {
      staticQuestions = dynamicQuestionsMap[questionsKey];
    } else {
      // ברירת מחדל
      staticQuestions = [
        {
          type: "multiselect",
          question: "האם חל שינוי ברמת האנרגיה שלך לאחרונה?",
          options: ["ירידה באנרגיה", "עייפות מוגברת", "קשיי שינה", "חוסר מנוחה", "אין שינוי"]
        },
        {
          type: "multiselect",
          question: "האם יש שינויים בהרגלי האכילה או השתייה שלך?",
          options: ["ירידה בתיאבון", "עלייה בתיאבון", "צמא מוגבר", "קושי בבליעה", "אין שינוי"]
        },
        {
          type: "yesNo",
          question: "האם חווית מצבים דומים בעבר?",
          followUp: "מתי והאם טופלו?"
        },
        {
          type: "yesNo",
          question: "האם יש משהו נוסף שחשוב שנדע על מצבך הבריאותי?",
          followUp: "פרט"
        }
      ];
    }
  
    // כעת נוסיף שאלות גם מ-ChatGPT
    const gptQuestions = await getDynamicQuestionsFromChatGPT(complaint, previousAnswers);
  
    // מאחדים את שתיהן
    const combined = [...staticQuestions, ...gptQuestions];
  
    // מחזירים את הכול
    return combined;
  }
  
  

// ======== הפעלת האפליקציה בטעינת הדף ========

document.addEventListener('DOMContentLoaded', initializeApplication);