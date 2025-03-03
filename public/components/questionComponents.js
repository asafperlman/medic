// components/questionComponents.js

/**
 * מודול זה אחראי על יצירת רכיבי שאלות ומדדים חיוניים לממשק המשתמש
 * =================================================================
 * 
 * מספק פונקציות ליצירת רכיבי שאלות מסוגים שונים (כן/לא, בחירה מרובה, סולם וכו'),
 * מדדים חיוניים, וממשקים מיוחדים כמו בורר מיקום פציעה.
 */

import { createElement } from '../utils/uiHelpers.js';

/**
 * יצירת אלמנט שאלה
 * @param {object} questionData - נתוני השאלה
 * @param {number} index - אינדקס השאלה
 * @param {boolean} isStandard - האם שאלה סטנדרטית או דינמית
 * @returns {HTMLElement} - אלמנט השאלה
 */
export function createQuestionElement(questionData, index, isStandard = true) {
    // יצירת container לשאלה
    const container = createElement('li', {
        className: 'question-item fade-in',
        dataset: { 
            index: index,
            type: questionData.type,
            isStandard: isStandard
        }
    });
    
    // כותרת השאלה
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
 * יצירת רכיב תשובה "כן/לא" עם אפשרות מעקב
 * @param {HTMLElement} container - האלמנט המכיל
 * @param {object} questionData - נתוני השאלה 
 * @param {string} questionId - מזהה השאלה
 * @param {number} index - אינדקס השאלה
 * @param {boolean} isStandard - האם שאלה סטנדרטית
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
                    
                    // סימון שינויים - ניתן להוסיף אירוע "שינויים" כאן
                    const event = new Event('input', { bubbles: true });
                    this.dispatchEvent(event);
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
                    
                    // הסתרת שדה מעקב אם קיים
                    const followUpContainer = container.querySelector('.follow-up-container');
                    if (followUpContainer) {
                        followUpContainer.style.display = 'none';
                    }
                    
                    // סימון שינויים - ניתן להוסיף אירוע "שינויים" כאן
                    const event = new Event('input', { bubbles: true });
                    this.dispatchEvent(event);
                }
            }
        }
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
                input: function() {
                    // סימון שינויים - ניתן להוסיף אירוע "שינויים" כאן
                    const event = new Event('input', { bubbles: true });
                    this.dispatchEvent(event);
                }
            }
        });
        
        followUpContainer.appendChild(followUpInput);
        container.appendChild(followUpContainer);
    }
}

/**
 * יוצר רכיב בחירה מרובה
 * @param {HTMLElement} container - האלמנט המכיל
 * @param {object} questionData - נתוני השאלה 
 * @param {string} questionId - מזהה השאלה
 * @param {number} index - אינדקס השאלה
 * @param {boolean} isStandard - האם שאלה סטנדרטית
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
                        
                        // סימון שינויים - ניתן להוסיף אירוע "שינויים" כאן
                        const event = new Event('input', { bubbles: true });
                        this.dispatchEvent(event);
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
                    
                    // סימון שינויים - ניתן להוסיף אירוע "שינויים" כאן
                    const event = new Event('input', { bubbles: true });
                    this.dispatchEvent(event);
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
                
                // סימון שינויים - ניתן להוסיף אירוע "שינויים" כאן
                const event = new Event('input', { bubbles: true });
                this.dispatchEvent(event);
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
 * יוצר רכיב סולם 1-10
 * @param {HTMLElement} container - האלמנט המכיל
 * @param {object} questionData - נתוני השאלה 
 * @param {string} questionId - מזהה השאלה
 * @param {number} index - אינדקס השאלה
 * @param {boolean} isStandard - האם שאלה סטנדרטית
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
                    
                    // סימון שינויים - ניתן להוסיף אירוע "שינויים" כאן
                    const event = new Event('input', { bubbles: true });
                    scaleInput.dispatchEvent(event);
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
 * יוצר שדה טקסט פשוט
 * @param {HTMLElement} container - האלמנט המכיל
 * @param {object} questionData - נתוני השאלה 
 * @param {string} questionId - מזהה השאלה
 * @param {number} index - אינדקס השאלה
 * @param {boolean} isStandard - האם שאלה סטנדרטית
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
            input: function() {
                // סימון שינויים - ניתן להוסיף אירוע "שינויים" כאן
                const event = new Event('input', { bubbles: true });
                this.dispatchEvent(event);
            }
        }
    });
    
    container.appendChild(input);
}

/**
 * יוצר שדה טקסט רב-שורתי
 * @param {HTMLElement} container - האלמנט המכיל
 * @param {object} questionData - נתוני השאלה 
 * @param {string} questionId - מזהה השאלה
 * @param {number} index - אינדקס השאלה
 * @param {boolean} isStandard - האם שאלה סטנדרטית
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
            input: function() {
                // סימון שינויים - ניתן להוסיף אירוע "שינויים" כאן
                const event = new Event('input', { bubbles: true });
                this.dispatchEvent(event);
            }
        }
    });
    
    container.appendChild(textarea);
}

/**
 * יוצר אזור הערות לשאלה
 * @param {object} questionData - נתוני השאלה
 * @param {number} index - אינדקס השאלה
 * @param {boolean} isStandard - האם שאלה סטנדרטית
 * @returns {HTMLElement} - אזור ההערות
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
            input: function() {
                // סימון שינויים - ניתן להוסיף אירוע "שינויים" כאן
                const event = new Event('input', { bubbles: true });
                this.dispatchEvent(event);
            }
        }
    });
    
    notesContainer.appendChild(notesToggle);
    notesContainer.appendChild(notesField);
    
    return notesContainer;
}

/**
 * מדגיש אפשרות נבחרת
 * @param {HTMLElement} optionElement - אלמנט האפשרות
 * @param {boolean} isSelected - האם נבחר
 */
function highlightSelectedOption(optionElement, isSelected) {
    if (isSelected) {
        optionElement.classList.add('selected');
    } else {
        optionElement.classList.remove('selected');
    }
}

/**
 * מעדכן ערך קלט מוסתר של בחירה מרובה
 * @param {string} question - השאלה
 * @param {string} type - סוג הקלט
 * @param {HTMLElement} container - אלמנט המכיל
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

/**
 * יוצר טופס מדדים חיוניים
 * @param {Array} relevantVitalSigns - רשימת המדדים החיוניים הרלוונטיים
 * @returns {HTMLElement} - טופס המדדים החיוניים
 */
export function createVitalSignsForm(relevantVitalSigns) {
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
            events: {
                input: function() {
                    // סימון שינויים - ניתן להוסיף אירוע "שינויים" כאן
                    const event = new Event('input', { bubbles: true });
                    this.dispatchEvent(event);
                }
            }
        });
        
        // הוספת מאפיינים מיוחדים לפי הסוג
        if (signConfig.min !== undefined) input.min = signConfig.min;
        if (signConfig.max !== undefined) input.max = signConfig.max;
        if (signConfig.step !== undefined) input.step = signConfig.step;
        if (signConfig.pattern !== undefined) input.pattern = signConfig.pattern;
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        formFragment.appendChild(formGroup);
    });
    
    form.appendChild(formFragment);
    container.appendChild(title);
    container.appendChild(form);
    
    // עדכון מאפייני הקלט לאחר שהכל נוסף ל-DOM
    setTimeout(() => {
        updateVitalSignInputAttributes();
    }, 0);
    
    return container;
}

/**
 * מעדכן מאפיינים מיוחדים של שדות מדדים חיוניים
 */
function updateVitalSignInputAttributes() {
    // קבלת כל שדות המדדים החיוניים
    const vitalInputs = document.querySelectorAll('.vital-sign-input');
    
    // עדכון כל שדה לפי סוג המדד
    vitalInputs.forEach(input => {
        const vitalSign = input.dataset.vitalSign;
        
        switch (vitalSign) {
            case 'pulse':
                input.min = '40';
                input.max = '200';
                input.placeholder = 'פעימות לדקה (60-100)';
                break;
            case 'bloodPressure':
                input.pattern = '[0-9]{2,3}/[0-9]{2,3}';
                input.placeholder = 'לדוגמה: 120/80';
                break;
            case 'temperature':
                input.min = '35';
                input.max = '43';
                input.step = '0.1';
                input.placeholder = 'טמפרטורה (36-38°C)';
                break;
            case 'saturation':
                input.min = '70';
                input.max = '100';
                input.placeholder = 'אחוז חמצן (94-100%)';
                break;
            case 'respiratoryRate':
                input.min = '8';
                input.max = '40';
                input.placeholder = 'נשימות לדקה (12-20)';
                break;
        }
    });
}

/**
 * יוצר בורר מיקום פציעה מתקדם
 * @returns {HTMLElement} - בורר מיקום פציעה אינטראקטיבי
 */
export function createAdvancedInjuryLocationSelector() {
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
        className: 'selecte