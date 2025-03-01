// public/app.js

// מצב הנוכחי של המערכת
const state = {
    currentStep: 1,
    patientRecord: null,
    darkMode: localStorage.getItem('darkMode') === 'true' || false
};

// ---------- פונקציות עזר לממשק המשתמש ----------

// פונקציה להצגת שלב מסוים
function showStep(stepNumber) {
    // מסתיר את כל השלבים
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // מציג את השלב הנבחר
    document.getElementById(`step${stepNumber}`).classList.add('active');
    
    // מעדכן את המצב הנוכחי
    state.currentStep = stepNumber;
    
    // עדכון סרגל התקדמות אם קיים
    if (window.FormComponents && window.FormComponents.createProgressBar) {
        updateProgressBar();
    }
}


// פונקציה ליצירת אלמנט שאלה במסך לפי הסוג
function createQuestionElement(questionData, index, isStandard = true) {
    const listItem = document.createElement('li');
    listItem.className = 'question-item fade-in';
    
    // כותרת השאלה
    const questionHeader = document.createElement('div');
    questionHeader.className = 'question-header';
    questionHeader.textContent = questionData.question;
    listItem.appendChild(questionHeader);
    
    // יצירת אזור תשובה בהתאם לסוג השאלה
    const answerContainer = document.createElement('div');
    answerContainer.className = 'answer-container';
    
    // שדה הזנת תשובה בהתאם לסוג השאלה
    switch (questionData.type) {
        case 'yesNo':
            // יצירת רדיו בוטונים של כן/לא
            const radioGroup = document.createElement('div');
            radioGroup.className = 'radio-group question-radio-group';
            
            // אפשרות "כן"
            const yesLabel = document.createElement('label');
            yesLabel.className = 'radio-option radio-yes';
            const yesInput = document.createElement('input');
            yesInput.type = 'radio';
            yesInput.name = `question-${index}-${isStandard ? 'std' : 'dyn'}`;
            yesInput.value = 'כן';
            yesInput.dataset.question = questionData.question;
            yesInput.dataset.index = index;
            yesInput.dataset.type = 'yesNo';
            
            if (isStandard) {
                yesInput.dataset.standard = 'true';
            } else {
                yesInput.dataset.dynamic = 'true';
            }
            
            yesLabel.appendChild(yesInput);
            yesLabel.appendChild(document.createTextNode('כן'));
            
            // אפשרות "לא"
            const noLabel = document.createElement('label');
            noLabel.className = 'radio-option radio-no';
            const noInput = document.createElement('input');
            noInput.type = 'radio';
            noInput.name = `question-${index}-${isStandard ? 'std' : 'dyn'}`;
            noInput.value = 'לא';
            noInput.dataset.question = questionData.question;
            noInput.dataset.index = index;
            noInput.dataset.type = 'yesNo';
            
            if (isStandard) {
                noInput.dataset.standard = 'true';
            } else {
                noInput.dataset.dynamic = 'true';
            }
            
            noLabel.appendChild(noInput);
            noLabel.appendChild(document.createTextNode('לא'));
            
            radioGroup.appendChild(yesLabel);
            radioGroup.appendChild(noLabel);
            answerContainer.appendChild(radioGroup);
            
            // יצירת שדה מעקב נוסף לתשובת "כן"
            if (questionData.followUp) {
                const followUpContainer = document.createElement('div');
                followUpContainer.className = 'follow-up-container';
                followUpContainer.style.display = 'none';
                
                const followUpInput = document.createElement('input');
                followUpInput.type = 'text';
                followUpInput.className = 'follow-up-input';
                followUpInput.placeholder = questionData.followUp;
                followUpInput.dataset.parentQuestion = questionData.question;
                
                if (isStandard) {
                    followUpInput.dataset.standard = 'true';
                } else {
                    followUpInput.dataset.dynamic = 'true';
                }
                
                followUpContainer.appendChild(followUpInput);
                answerContainer.appendChild(followUpContainer);
                
                // הוספת אירועים להצגת שדה המעקב
                yesInput.addEventListener('change', function() {
                    if (this.checked) {
                        followUpContainer.style.display = 'block';
                    }
                });
                
                noInput.addEventListener('change', function() {
                    if (this.checked) {
                        followUpContainer.style.display = 'none';
                    }
                });
            }
            break;
            
        case 'duration':
            // שדה הזנת משך זמן
            const durationInput = document.createElement('input');
            durationInput.type = 'text';
            durationInput.className = 'answer-input';
            durationInput.placeholder = questionData.placeholder || 'הזן משך זמן...';
            durationInput.dataset.question = questionData.question;
            durationInput.dataset.index = index;
            durationInput.dataset.type = 'duration';
            
            if (isStandard) {
                durationInput.dataset.standard = 'true';
            } else {
                durationInput.dataset.dynamic = 'true';
            }
            
            answerContainer.appendChild(durationInput);
            break;
            
        case 'location':
            // בחירת מיקום מרשימה
            const locationSelect = document.createElement('select');
            locationSelect.className = 'answer-select location-select';
            locationSelect.dataset.question = questionData.question;
            locationSelect.dataset.index = index;
            locationSelect.dataset.type = 'location';
            
            if (isStandard) {
                locationSelect.dataset.standard = 'true';
            } else {
                locationSelect.dataset.dynamic = 'true';
            }
            
            // אפשרות ריקה
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'בחר מיקום...';
            emptyOption.selected = true;
            locationSelect.appendChild(emptyOption);
            
            // אפשרויות מיקום
            if (questionData.options && Array.isArray(questionData.options)) {
                questionData.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    locationSelect.appendChild(optionElement);
                });
            }
            
            answerContainer.appendChild(locationSelect);
            break;
            
        case 'characteristic':
            // בחירת מאפיין מרשימה
            const characteristicSelect = document.createElement('select');
            characteristicSelect.className = 'answer-select characteristic-select';
            characteristicSelect.dataset.question = questionData.question;
            characteristicSelect.dataset.index = index;
            characteristicSelect.dataset.type = 'characteristic';
            
            if (isStandard) {
                characteristicSelect.dataset.standard = 'true';
            } else {
                characteristicSelect.dataset.dynamic = 'true';
            }
            
            // אפשרות ריקה
            const emptyCharOption = document.createElement('option');
            emptyCharOption.value = '';
            emptyCharOption.textContent = 'בחר אפיון...';
            emptyCharOption.selected = true;
            characteristicSelect.appendChild(emptyCharOption);
            
            // אפשרויות אפיון
            if (questionData.options && Array.isArray(questionData.options)) {
                questionData.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    characteristicSelect.appendChild(optionElement);
                });
            }
            
            answerContainer.appendChild(characteristicSelect);
            break;
            
        case 'scale':
            // סולם ערכים 1-10
            const scaleContainer = document.createElement('div');
            scaleContainer.className = 'scale-container';
            
            const scaleLabel = document.createElement('div');
            scaleLabel.className = 'scale-label';
            scaleLabel.textContent = 'דרג/י מ-1 (קל) עד 10 (חמור מאוד)';
            scaleContainer.appendChild(scaleLabel);
            
            const scaleButtons = document.createElement('div');
            scaleButtons.className = 'scale-buttons';
            
            for (let i = 1; i <= 10; i++) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'scale-button';
                button.textContent = i;
                button.dataset.value = i;
                button.dataset.question = questionData.question;
                
                if (isStandard) {
                    button.dataset.standard = 'true';
                } else {
                    button.dataset.dynamic = 'true';
                }
                
                button.addEventListener('click', function() {
                    // הסרת הסימון מכל הכפתורים
                    scaleButtons.querySelectorAll('.scale-button').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    // סימון הכפתור הנוכחי
                    this.classList.add('selected');
                    
                    // עדכון ערך מוסתר לשמירת הנתונים
                    scaleInput.value = i;
                });
                
                scaleButtons.appendChild(button);
            }
            
            scaleContainer.appendChild(scaleButtons);
            
            // שדה מוסתר לשמירת הערך
            const scaleInput = document.createElement('input');
            scaleInput.type = 'hidden';
            scaleInput.className = 'scale-input';
            scaleInput.dataset.question = questionData.question;
            scaleInput.dataset.index = index;
            scaleInput.dataset.type = 'scale';
            
            if (isStandard) {
                scaleInput.dataset.standard = 'true';
            } else {
                scaleInput.dataset.dynamic = 'true';
            }
            
            scaleContainer.appendChild(scaleInput);
            answerContainer.appendChild(scaleContainer);
            break;
            
        case 'value':
        case 'quantity':
            // שדה הזנת ערך מספרי
            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.className = 'answer-input';
            valueInput.placeholder = questionData.placeholder || 'הזן ערך...';
            valueInput.dataset.question = questionData.question;
            valueInput.dataset.index = index;
            valueInput.dataset.type = questionData.type;
            
            if (isStandard) {
                valueInput.dataset.standard = 'true';
            } else {
                valueInput.dataset.dynamic = 'true';
            }
            
            answerContainer.appendChild(valueInput);
            break;
            
        case 'onset':
        case 'mechanism':
        case 'area':
            // בחירה מרשימה אך ללא היררכיה
            const selectElement = document.createElement('select');
            selectElement.className = 'answer-select';
            selectElement.dataset.question = questionData.question;
            selectElement.dataset.index = index;
            selectElement.dataset.type = questionData.type;
            
            if (isStandard) {
                selectElement.dataset.standard = 'true';
            } else {
                selectElement.dataset.dynamic = 'true';
            }
            
            // אפשרות ריקה
            const emptySelectOption = document.createElement('option');
            emptySelectOption.value = '';
            emptySelectOption.textContent = 'בחר...';
            emptySelectOption.selected = true;
            selectElement.appendChild(emptySelectOption);
            
            // אפשרויות נוספות
            if (questionData.options && Array.isArray(questionData.options)) {
                questionData.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    selectElement.appendChild(optionElement);
                });
            }
            
            answerContainer.appendChild(selectElement);
            break;
            
        default:
            // שדה טקסט רגיל כברירת מחדל
            const defaultInput = document.createElement('input');
            defaultInput.type = 'text';
            defaultInput.className = 'answer-input';
            defaultInput.placeholder = 'הזן תשובה...';
            defaultInput.dataset.question = questionData.question;
            defaultInput.dataset.index = index;
            
            if (isStandard) {
                defaultInput.dataset.standard = 'true';
            } else {
                defaultInput.dataset.dynamic = 'true';
            }
            
            answerContainer.appendChild(defaultInput);
            break;
    }
    
    listItem.appendChild(answerContainer);
    return listItem;
}

// פונקציה ליצירת אזור הזנת מדדים חיוניים
function createVitalSignsForm(relevantVitalSigns) {
    const container = document.createElement('div');
    container.className = 'vital-signs-container fade-in';
    
    const title = document.createElement('h3');
    title.textContent = 'מדדים חיוניים';
    container.appendChild(title);
    
    const form = document.createElement('div');
    form.className = 'vital-signs-form';
    
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
    
    // יצירת שדות עבור המדדים הרלוונטיים
    relevantVitalSigns.forEach(vitalSign => {
        const signConfig = vitalSignsMap[vitalSign];
        if (!signConfig) return;
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group vital-sign-group';
        
        const label = document.createElement('label');
        label.htmlFor = `vital-${signConfig.id}`;
        label.textContent = vitalSign;
        
        const input = document.createElement('input');
        input.type = signConfig.type;
        input.id = `vital-${signConfig.id}`;
        input.className = 'vital-sign-input';
        input.placeholder = signConfig.placeholder;
        input.dataset.vitalSign = signConfig.id;
        
        if (signConfig.min !== undefined) input.min = signConfig.min;
        if (signConfig.max !== undefined) input.max = signConfig.max;
        if (signConfig.step !== undefined) input.step = signConfig.step;
        if (signConfig.pattern) input.pattern = signConfig.pattern;
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        form.appendChild(formGroup);
    });
    
    container.appendChild(form);
    return container;
}

// פונקציה לאיסוף תשובות מהטופס
function collectAnswers(selector) {
    const answers = {};
    document.querySelectorAll(selector).forEach(input => {
        // קבלת הערך בהתאם לסוג הפקד
        let value = '';
        
        if (input.type === 'radio') {
            if (!input.checked) return;
            value = input.value;
            
            // אם זו תשובת "כן" עם שדה מעקב
            if (value === 'כן') {
                const followUpInput = document.querySelector(`.follow-up-input[data-parent-question="${input.dataset.question}"]`);
                if (followUpInput && followUpInput.value.trim() !== '') {
                    value = `כן, ${followUpInput.value.trim()}`;
                }
            }
        } else if (input.tagName === 'SELECT') {
            value = input.value;
        } else if (input.type === 'hidden' && input.classList.contains('scale-input')) {
            // שדה סולם
            value = input.value;
        } else {
            value = input.value.trim();
        }
        
        if (value !== '') {
            answers[input.dataset.question] = value;
        }
    });
    return answers;
}

// פונקציה לאיסוף מדדים חיוניים
function collectVitalSigns() {
    const vitalSigns = {};
    
    document.querySelectorAll('.vital-sign-input').forEach(input => {
        if (input.value.trim() !== '') {
            vitalSigns[input.dataset.vitalSign] = input.value.trim();
        }
    });
    
    return vitalSigns;
}

// פונקציה לקבלת הערך הנבחר מקבוצת רדיו
function getSelectedRadioValue(name) {
    const selectedRadio = document.querySelector(`input[name="${name}"]:checked`);
    return selectedRadio ? selectedRadio.value : null;
}

// פונקציה לזיהוי וסימון דגלים אדומים בסיכום
function highlightRedFlags() {
    const summaryElement = document.getElementById('summary-text');
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
            } else {
                updatedHtml += `<p>${paragraph}</p>`;
            }
        }
        
        // עדכון התצוגה עם ההדגשות
        summaryElement.innerHTML = updatedHtml;
    }
}

// פונקציה לעדכון סרגל התקדמות
function updateProgressBar() {
    const progressContainer = document.getElementById('progress-bar-container');
    if (!progressContainer) return;
    
    progressContainer.innerHTML = window.FormComponents.createProgressBar(state.currentStep, 5);
}

// פונקציה להדגשת דגלים אדומים בסיכום הסופי
function highlightRedFlagsInFinalSummary() {
    const summaryElement = document.getElementById('final-summary-text');
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
            } else {
                updatedHtml += `<p>${paragraph}</p>`;
            }
        }
        
        // עדכון התצוגה עם ההדגשות
        summaryElement.innerHTML = updatedHtml;
    }
}

// פונקציה להחלפת מצב תצוגה (בהיר/כהה)
function toggleDarkMode() {
    // שינוי מצב תצוגה בדף
    document.body.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
    
    // עדכון הכפתור
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.innerHTML = state.darkMode ? 
            '<i class="fas fa-sun"></i> מצב בהיר' : 
            '<i class="fas fa-moon"></i> מצב כהה';
    }
    
    // שמירת העדפה בלוקל סטורג'
    localStorage.setItem('darkMode', state.darkMode);
}

// פונקציה לקבלת גיל מהיר באמצעות כפתורים
function createAgeButtons() {
    const commonAges = [18, 19, 20, 21, 22, 25, 30, 40, 50, 60, 70];
    const container = document.createElement('div');
    container.className = 'quick-age-buttons';
    
    commonAges.forEach(age => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'age-button';
        button.textContent = age;
        button.addEventListener('click', function() {
            document.getElementById('patient-age').value = age;
        });
        container.appendChild(button);
    });
    
    return container;
}
// יש להוסיף את הקוד הבא לקובץ public/app.js

/**
 * יוצר ממשק חיפוש עבור התלונות העיקריות
 * @param {HTMLSelectElement} complaintSelect - אלמנט הבחירה של התלונות
 * @param {Array} complaints - רשימת התלונות
 */
function createComplaintSearchInterface(complaintSelect, complaints) {
    // יצירת אלמנט החיפוש
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container fade-in';
    
    const searchIcon = document.createElement('i');
    searchIcon.className = 'fas fa-search search-icon';
    searchContainer.appendChild(searchIcon);
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'complaint-search';
    searchInput.placeholder = 'חפש תלונה...';
    searchInput.setAttribute('dir', 'rtl');
    searchContainer.appendChild(searchInput);
    
    // הוספת אירוע הקלדה לחיפוש
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();
        
        // מאפס את רשימת התלונות
        complaintSelect.innerHTML = '';
        
        // אפשרות ריקה ראשונה
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'בחר תלונה עיקרית';
        emptyOption.disabled = true;
        emptyOption.selected = true;
        complaintSelect.appendChild(emptyOption);
        
        // מסנן ומוסיף תלונות תואמות
        const filteredComplaints = searchTerm ? 
            complaints.filter(complaint => complaint.toLowerCase().includes(searchTerm)) : 
            complaints;
        
        filteredComplaints.forEach(complaint => {
            const option = document.createElement('option');
            option.value = complaint;
            option.textContent = complaint;
            complaintSelect.appendChild(option);
        });
        
        // אם אין תוצאות, מוסיף אפשרות "אחר"
        if (filteredComplaints.length === 0 && searchTerm) {
            const otherOption = document.createElement('option');
            otherOption.value = searchTerm;
            otherOption.textContent = `הוסף: "${searchTerm}"`;
            complaintSelect.appendChild(otherOption);
            
            // אם נבחרה אפשרות זו, מעדכן את הערך ב"אחר"
            complaintSelect.addEventListener('change', function() {
                if (this.value === searchTerm) {
                    this.value = 'אחר';
                    document.getElementById('other-complaint').value = searchTerm;
                    document.getElementById('other-complaint-container').style.display = 'block';
                }
            });
        }
        
        // תמיד מוסיף "אחר" בסוף הרשימה
        if (!filteredComplaints.includes('אחר')) {
            const otherOption = document.createElement('option');
            otherOption.value = 'אחר';
            otherOption.textContent = 'אחר';
            complaintSelect.appendChild(otherOption);
        }
    });
    
    // הוספת ממשק החיפוש לפני אלמנט הבחירה
    complaintSelect.parentElement.insertBefore(searchContainer, complaintSelect);
}

/**
 * פונקציה משופרת לסיכום האנמנזה, המשתמשת בקריאת API לשרת
 * @param {object} patientRecord - רשומת המטופל
 * @returns {Promise} - הבטחה המחזירה את רשומת המטופל המעודכנת
 */
async function generateImprovedSummary(patientRecord) {
    return new Promise((resolve, reject) => {
        try {
            // הכנת פרומפט מובנה לסיכום האנמנזה
            const promptData = createAISummaryPrompt(patientRecord);
            
            // הדמיית קריאת API למודל שפה
            console.log("שולח בקשה לסיכום אנמנזה...");
            console.log("פרומפט:", promptData);
            
            // מדמה תשובה מהשרת (זמן תגובה של 1-3 שניות)
            setTimeout(() => {
                const summary = createDetailedMedicalSummary(patientRecord);
                patientRecord.summary = summary;
                resolve(patientRecord);
            }, Math.floor(Math.random() * 2000) + 1000);
        } catch (error) {
            console.error("שגיאה בסיכום האנמנזה:", error);
            reject(error);
        }
    });
}

/**
 * יוצר פרומפט מובנה לסיכום אנמנזה רפואית
 * @param {object} patientRecord - רשומת המטופל
 * @returns {string} - פרומפט מובנה
 */
function createAISummaryPrompt(patientRecord) {
    // חילוץ מידע בסיסי
    const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
    const genderText = gender === 'male' ? 'זכר' : 'נקבה';
    
    // יצירת פרומפט מובנה
    let prompt = `אתה עוזר רפואי מקצועי ברמת חובש/פרמדיק. עליך ליצור סיכום אנמנזה רפואית מקיף ומקצועי בהתאם למידע הבא.
    
סיכום האנמנזה צריך להיות בפורמט מובנה ומקצועי, עם דגש על:
1. ציון פרטי פרופיל רפואי בתחילת הסיכום
2. תיאור דמוגרפי והתלונה העיקרית
3. פירוט המדדים החיוניים אם נמדדו
4. פירוט אופי ומאפייני התלונה העיקרית
5. ציון כל הממצאים השליליים המשמעותיים ("שולל X")
6. פירוט גורמים מחמירים ומקלים
7. ציון טיפולים שננקטו עד כה
8. דגש על דגלים אדומים אם קיימים

הפרטים הבסיסיים:
- גיל: ${age}
- מין: ${genderText}
- מעשן: ${smoking === 'yes' ? 'כן' : 'לא'}
- תלונה עיקרית: ${mainComplaint}
- פרופיל רפואי: ${profile}
- סעיפים רפואיים: ${medicalSections || "ללא סעיפים"}
- אלרגיות: ${allergies || "ללא אלרגיות ידועות"}
- תרופות קבועות: ${medications || "לא נוטל תרופות באופן קבוע"}

`;
    
    // הוספת מדדים חיוניים אם קיימים
    if (patientRecord.vitalSigns && Object.keys(patientRecord.vitalSigns).length > 0) {
        prompt += "מדדים חיוניים:\n";
        if (patientRecord.vitalSigns.pulse) prompt += `- דופק: ${patientRecord.vitalSigns.pulse}\n`;
        if (patientRecord.vitalSigns.bloodPressure) prompt += `- לחץ דם: ${patientRecord.vitalSigns.bloodPressure}\n`;
        if (patientRecord.vitalSigns.temperature) prompt += `- חום: ${patientRecord.vitalSigns.temperature}\n`;
        if (patientRecord.vitalSigns.saturation) prompt += `- סטורציה: ${patientRecord.vitalSigns.saturation}%\n`;
        if (patientRecord.vitalSigns.respiratoryRate) prompt += `- קצב נשימה: ${patientRecord.vitalSigns.respiratoryRate}\n`;
        prompt += "\n";
    }
    
    // הוספת תשובות לשאלות
    prompt += "תשובות המטופל לשאלות:\n";
    
    // תשובות לשאלות סטנדרטיות
    for (const [question, answer] of Object.entries(patientRecord.standardAnswers)) {
        if (answer && answer.trim()) {
            prompt += `- ${question}: ${answer}\n`;
        }
    }
    
    // תשובות לשאלות דינמיות
    for (const [question, answer] of Object.entries(patientRecord.dynamicAnswers)) {
        if (answer && answer.trim()) {
            prompt += `- ${question}: ${answer}\n`;
        }
    }
    
    // הוספת דגלים אדומים
    const redFlags = checkForRedFlags(patientRecord);
    if (redFlags.length > 0) {
        prompt += "\nדגלים אדומים שזוהו:\n";
        redFlags.forEach(flag => {
            prompt += `- ${flag}\n`;
        });
    }
    
    // הנחיות לפורמט הסיכום
    prompt += `
יש לנסח את האנמנזה בשפה רפואית ברורה, עם הדגשת:
- ציון כל השלילות (תשובות שליליות לשאלות משמעותיות) בפורמט "שולל X"
- ניסוח קוהרנטי ורציף (לא רשימת משפטים קטועים)
- שילוב כל המידע הרלוונטי בסיכום אחד מסודר וברור
- אם זוהו דגלים אדומים, הקדש להם פסקה נפרדת בסוף הסיכום

הסיכום צריך להיות בלשון שמישה על-ידי אנשי רפואה, בפורמט שמתחיל ב"פרופיל... מטופל/ת בן/בת..."`;
    
    return prompt;
}

/**
 * יוצר סיכום אנמנזה רפואית מפורט ומקצועי
 * @param {object} patientRecord - רשומת המטופל
 * @returns {string} - סיכום אנמנזה
 */
function createDetailedMedicalSummary(patientRecord) {
    try {
        // חילוץ מידע בסיסי
        const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
        const genderText = gender === 'male' ? 'זכר' : 'נקבה';
        const smokingText = smoking === 'yes' ? 'מעשן/ת' : 'לא מעשן/ת';
        
        // פתיחת האנמנזה עם פרטי הפרופיל הרפואי
        let summary = `פרופיל ${profile}, ${medicalSections || "ללא סעיפים"}, ${allergies || "ללא אלרגיות ידועות"}, ${medications || "לא נוטל/ת תרופות באופן קבוע"}.\n\n`;
        
        // תיאור דמוגרפי ותלונה עיקרית
        summary += `מטופל/ת בן/בת ${age}, ${genderText}, ${smokingText}, פונה עם תלונה עיקרית של ${mainComplaint}`;
        
        // הוספת המדדים אם קיימים
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
        
        // חיפוש תשובות רלוונטיות מכל השאלות
        const allAnswers = {
            ...patientRecord.standardAnswers,
            ...patientRecord.dynamicAnswers
        };
        
        // עיבוד המידע מהתשובות
        for (const [question, answer] of Object.entries(allAnswers)) {
            if (!answer || answer.trim() === '') continue;
            
            // זיהוי קטגוריות מידע שונות
            if (question.includes("זמן") || question.includes("מתי") || question.includes("כמה זמן") || question.includes("משך")) {
                duration = answer;
            } 
            else if (question.includes("היכן") || question.includes("מיקום") || question.includes("איפה") || question.includes("ממוקם")) {
                location = answer;
            }
            else if (question.includes("אופי") || question.includes("מתאר") || question.includes("סוג")) {
                characteristics.push(answer);
            }
            else if (question.includes("מחמיר") || question.includes("גורם להחמרה")) {
                aggravatingFactors.push(`${question.replace('?', '')}: ${answer}`);
            }
            else if (question.includes("מקל") || question.includes("גורם להקלה")) {
                relievingFactors.push(`${question.replace('?', '')}: ${answer}`);
            }
            else if (question.includes("סימפטומים נוספים") || question.includes("תסמינים") || 
                    question.includes("בחילה") || question.includes("הקאות") || 
                    question.includes("חום") || question.includes("סחרחורת") ||
                    question.includes("דם") || question.includes("כאב")) {
                
                if (answer.toLowerCase() === 'לא') {
                    // שולל תופעה
                    let negTerm = question
                        .replace('האם', '')
                        .replace('יש', '')
                        .replace('?', '')
                        .trim();
                    negativeFindings.push(`שולל/ת ${negTerm}`);
                } else {
                    // מדווח על תופעה
                    associatedSymptoms.push(`${question.replace('?', '')}: ${answer}`);
                }
            }
            else if (question.includes("טיפול") || question.includes("תרופות") || question.includes("לקחת")) {
                if (answer.toLowerCase() === 'לא') {
                    negativeFindings.push("שולל/ת נטילת תרופות קודמות");
                } else {
                    treatments.push(`${question.replace('?', '')}: ${answer}`);
                }
            }
            else if (answer.toLowerCase() === 'לא') {
                // הוספת שלילות נוספות
                let negTerm = question
                    .replace('האם', '')
                    .replace('יש', '')
                    .replace('?', '')
                    .trim();
                negativeFindings.push(`שולל/ת ${negTerm}`);
            }
        }
        
        // יצירת תיאור האנמנזה
        summary += "\n\nאנמנזה: ";
        
        if (duration) {
            summary += `מדווח/ת על ${mainComplaint} שהחל/ה לפני ${duration}`;
        } else {
            summary += `מדווח/ת על ${mainComplaint}`;
        }
        
        if (location) {
            summary += ` ומתמקם/ת ב${location}`;
        }
        
        if (characteristics.length > 0) {
            summary += `. אופי ה${mainComplaint.includes('כאב') ? 'כאב' : 'תלונה'} מתואר כ${characteristics.join(", ")}`;
        }
        
        summary += '. ';
        
        // הוספת סימפטומים נלווים
        if (associatedSymptoms.length > 0) {
            summary += `\n\nסימפטומים נלווים: ${associatedSymptoms.join("; ")}. `;
        }
        
        // הוספת גורמים מחמירים ומקלים
        if (aggravatingFactors.length > 0 || relievingFactors.length > 0) {
            summary += "\n\n";
            
            if (aggravatingFactors.length > 0) {
                summary += `גורמים מחמירים: ${aggravatingFactors.join("; ")}. `;
            }
            
            if (relievingFactors.length > 0) {
                summary += `גורמים מקלים: ${relievingFactors.join("; ")}. `;
            }
        }
        
        // הוספת מידע על טיפולים
        if (treatments.length > 0) {
            summary += `\n\nטיפולים שננקטו טרם הפנייה: ${treatments.join("; ")}. `;
        }
        
        // הוספת ממצאים שליליים
        if (negativeFindings.length > 0) {
            summary += `\n\nממצאים שליליים: ${negativeFindings.join("; ")}. `;
        }
        
        // סיום האנמנזה עם דגלים אדומים
        const redFlags = checkForRedFlags(patientRecord);
        
        if (redFlags.length > 0) {
            summary += `\n\nדגלים אדומים: ${redFlags.join("; ")}.`;
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
// קוד להוספה לקובץ app.js - סעיף מיקום פציעה מתקדם

// פונקציה ליצירת בורר מיקום פציעה מתקדם - להוספה בסיום קובץ app.js
function createAdvancedInjuryLocationSelector() {
    const container = document.createElement('div');
    container.className = 'injury-location-container fade-in';
    
    const title = document.createElement('h3');
    title.textContent = 'מיקום הפציעה';
    container.appendChild(title);
    
    // יצירת אזור לבחירת מיקום הפציעה עם תמונה אינטראקטיבית
    const bodyMapContainer = document.createElement('div');
    bodyMapContainer.className = 'body-map-container';
    
    // כפתורים לבחירת צד קדמי/אחורי
    const viewToggle = document.createElement('div');
    viewToggle.className = 'body-view-toggle';
    
    const frontButton = document.createElement('button');
    frontButton.type = 'button';
    frontButton.className = 'view-toggle-btn active';
    frontButton.textContent = 'מבט קדמי';
    frontButton.dataset.view = 'front';
    
    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'view-toggle-btn';
    backButton.textContent = 'מבט אחורי';
    backButton.dataset.view = 'back';
    
    frontButton.addEventListener('click', function() {
        // הפעלת המבט הקדמי
        this.classList.add('active');
        backButton.classList.remove('active');
        document.getElementById('body-map-front').style.display = 'block';
        document.getElementById('body-map-back').style.display = 'none';
    });
    
    backButton.addEventListener('click', function() {
        // הפעלת המבט האחורי
        this.classList.add('active');
        frontButton.classList.remove('active');
        document.getElementById('body-map-front').style.display = 'none';
        document.getElementById('body-map-back').style.display = 'block';
    });
    
    viewToggle.appendChild(frontButton);
    viewToggle.appendChild(backButton);
    bodyMapContainer.appendChild(viewToggle);
    
    // יצירת מפת גוף קדמית
    const frontMap = document.createElement('div');
    frontMap.id = 'body-map-front';
    frontMap.className = 'body-map';
    
    const bodyPartsFront = [
        { id: 'head', name: 'ראש', coords: '50,15,65,35', shape: 'circle' },
        { id: 'chest', name: 'חזה', coords: '50,70,30', shape: 'circle' },
        { id: 'abdomen', name: 'בטן', coords: '50,120,30', shape: 'circle' },
        { id: 'right-arm', name: 'זרוע ימין', coords: '25,70,15', shape: 'circle' },
        { id: 'left-arm', name: 'זרוע שמאל', coords: '75,70,15', shape: 'circle' },
        { id: 'right-hand', name: 'כף יד ימין', coords: '15,100,10', shape: 'circle' },
        { id: 'left-hand', name: 'כף יד שמאל', coords: '85,100,10', shape: 'circle' },
        { id: 'right-leg', name: 'רגל ימין', coords: '40,180,20', shape: 'circle' },
        { id: 'left-leg', name: 'רגל שמאל', coords: '60,180,20', shape: 'circle' },
        { id: 'right-foot', name: 'כף רגל ימין', coords: '40,240,15', shape: 'circle' },
        { id: 'left-foot', name: 'כף רגל שמאל', coords: '60,240,15', shape: 'circle' }
    ];
    
    const frontImg = document.createElement('img');
    frontImg.src = 'assets/body-front.svg';
    frontImg.alt = 'מבט קדמי של הגוף';
    frontImg.useMap = '#body-map-front';
    
    const frontImageMap = document.createElement('map');
    frontImageMap.name = 'body-map-front';
    
    // יצירת אזורים לחיצים במפה הקדמית
    bodyPartsFront.forEach(part => {
        const area = document.createElement('area');
        area.shape = part.shape;
        area.coords = part.coords;
        area.alt = part.name;
        area.title = part.name;
        area.href = 'javascript:void(0)';
        
        area.addEventListener('click', function(e) {
            e.preventDefault();
            selectBodyPart(part.id, part.name, 'front');
        });
        
        frontImageMap.appendChild(area);
    });
    
    frontMap.appendChild(frontImg);
    frontMap.appendChild(frontImageMap);
    bodyMapContainer.appendChild(frontMap);
    
    // יצירת מפת גוף אחורית
    const backMap = document.createElement('div');
    backMap.id = 'body-map-back';
    backMap.className = 'body-map';
    backMap.style.display = 'none';
    
    const bodyPartsBack = [
        { id: 'back-head', name: 'חלק אחורי של הראש', coords: '50,15,65,35', shape: 'circle' },
        { id: 'upper-back', name: 'גב עליון', coords: '50,70,30', shape: 'circle' },
        { id: 'lower-back', name: 'גב תחתון', coords: '50,120,30', shape: 'circle' },
        { id: 'right-shoulder', name: 'כתף ימין', coords: '35,55,10', shape: 'circle' },
        { id: 'left-shoulder', name: 'כתף שמאל', coords: '65,55,10', shape: 'circle' },
        { id: 'right-arm-back', name: 'זרוע ימין אחורית', coords: '25,70,15', shape: 'circle' },
        { id: 'left-arm-back', name: 'זרוע שמאל אחורית', coords: '75,70,15', shape: 'circle' },
        { id: 'right-leg-back', name: 'רגל ימין אחורית', coords: '40,180,20', shape: 'circle' },
        { id: 'left-leg-back', name: 'רגל שמאל אחורית', coords: '60,180,20', shape: 'circle' }
    ];
    
    const backImg = document.createElement('img');
    backImg.src = 'assets/body-back.svg';
    backImg.alt = 'מבט אחורי של הגוף';
    backImg.useMap = '#body-map-back';
    
    const backImageMap = document.createElement('map');
    backImageMap.name = 'body-map-back';
    
    // יצירת אזורים לחיצים במפה האחורית
    bodyPartsBack.forEach(part => {
        const area = document.createElement('area');
        area.shape = part.shape;
        area.coords = part.coords;
        area.alt = part.name;
        area.title = part.name;
        area.href = 'javascript:void(0)';
        
        area.addEventListener('click', function(e) {
            e.preventDefault();
            selectBodyPart(part.id, part.name, 'back');
        });
        
        backImageMap.appendChild(area);
    });
    
    backMap.appendChild(backImg);
    backMap.appendChild(backImageMap);
    bodyMapContainer.appendChild(backMap);
    
    container.appendChild(bodyMapContainer);
    
    // אזור להצגת החלקים שנבחרו
    const selectedPartsContainer = document.createElement('div');
    selectedPartsContainer.className = 'selected-parts-container';
    selectedPartsContainer.innerHTML = '<h4>אזורי פציעה שנבחרו:</h4>';
    
    const selectedPartsList = document.createElement('ul');
    selectedPartsList.id = 'selected-body-parts';
    selectedPartsContainer.appendChild(selectedPartsList);
    
    // שדה מוסתר לשמירת הערך הסופי
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.id = 'injury-location-value';
    hiddenInput.name = 'injury-location';
    selectedPartsContainer.appendChild(hiddenInput);
    
    container.appendChild(selectedPartsContainer);
    
    // אפשרות להוספת פרטים ספציפיים יותר
    const specificDetailsContainer = document.createElement('div');
    specificDetailsContainer.className = 'specific-details-container';
    
    const specificDetailsTitle = document.createElement('h4');
    specificDetailsTitle.textContent = 'פרטים ספציפיים נוספים על הפציעה:';
    specificDetailsContainer.appendChild(specificDetailsTitle);
    
    const specificDetailsInput = document.createElement('textarea');
    specificDetailsInput.id = 'injury-specific-details';
    specificDetailsInput.className = 'specific-details-input';
    specificDetailsInput.placeholder = 'הזן פרטים נוספים על הפציעה (לדוגמה: פציעת שריר ביד ימין, כאב בקרסול שמאל, וכו\')';
    specificDetailsInput.rows = 3;
    
    specificDetailsInput.addEventListener('input', function() {
        updateInjuryLocation();
        state.unsavedChanges = true;
    });
    
    specificDetailsContainer.appendChild(specificDetailsInput);
    container.appendChild(specificDetailsContainer);
    
    return container;
}

// פונקציה לבחירת חלק גוף על המפה
function selectBodyPart(partId, partName, view) {
    // בדיקה אם החלק כבר נבחר
    const existingItem = document.querySelector(`#selected-body-parts li[data-part-id="${partId}"]`);
    if (existingItem) {
        // הסרת החלק אם כבר נבחר
        existingItem.remove();
    } else {
        // הוספת החלק לרשימת הנבחרים
        const listItem = document.createElement('li');
        listItem.textContent = partName;
        listItem.dataset.partId = partId;
        listItem.dataset.partName = partName;
        listItem.dataset.partView = view;
        
        // יצירת כפתור הסרה
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-part-btn';
        removeButton.innerHTML = '&times;';
        removeButton.title = 'הסר מהרשימה';
        
        removeButton.addEventListener('click', function() {
            listItem.remove();
            updateInjuryLocation();
            state.unsavedChanges = true;
        });
        
        listItem.appendChild(removeButton);
        document.getElementById('selected-body-parts').appendChild(listItem);
    }
    
    // עדכון השדה הסופי
    updateInjuryLocation();
    state.unsavedChanges = true;
}

// פונקציה לעדכון ערך מיקום הפציעה הסופי
function updateInjuryLocation() {
    const selectedParts = [];
    
    // איסוף החלקים שנבחרו
    document.querySelectorAll('#selected-body-parts li').forEach(item => {
        selectedParts.push(item.dataset.partName);
    });
    
    // הוספת פרטים ספציפיים אם קיימים
    const specificDetails = document.getElementById('injury-specific-details').value.trim();
    
    let finalValue = selectedParts.join(', ');
    if (specificDetails) {
        finalValue += specificDetails ? (finalValue ? '; ' : '') + specificDetails : '';
    }
    
    // עדכון השדה הסופי
    document.getElementById('injury-location-value').value = finalValue;
    
    return finalValue;
}

// פונקציה ליצירת שאלות ספציפיות לפציעות ספורט
function createSportsInjuryQuestions() {
    const questions = [
        {
            type: "mechanism",
            question: "כיצד אירעה הפציעה?",
            options: ["במהלך ריצה", "במהלך קפיצה", "עצירה פתאומית", "מכה/מגע", "תנועה מסתובבת", "מתיחה יתרה", "אחר"]
        },
        {
            type: "duration",
            question: "מתי אירעה הפציעה?",
            placeholder: "לדוגמה: לפני שעתיים, אתמול בערב, לפני שבוע..."
        },
        {
            type: "characteristic",
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
    
    return questions;
}
// ---------- יוזמות אתחול הדף ----------

document.addEventListener('DOMContentLoaded', function() {
    // הוספת כפתור מצב תצוגה
    const header = document.querySelector('header');
    if (header) {
        const darkModeToggle = document.createElement('button');
        darkModeToggle.id = 'dark-mode-toggle';
        darkModeToggle.className = 'dark-mode-toggle';
        darkModeToggle.innerHTML = state.darkMode ? 
            '<i class="fas fa-sun"></i> מצב בהיר' : 
            '<i class="fas fa-moon"></i> מצב כהה';
        
        darkModeToggle.addEventListener('click', function() {
            state.darkMode = !state.darkMode;
            toggleDarkMode();
        });
        
        header.appendChild(darkModeToggle);
        toggleDarkMode(); // הפעלת מצב התצוגה ההתחלתי
    }
    
    // הוספת סרגל התקדמות
    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
        const progressBar = document.createElement('div');
        progressBar.id = 'progress-bar-container';
        progressBar.className = 'progress-bar-container';
        mainContainer.insertBefore(progressBar, mainContainer.firstChild);
        updateProgressBar();
    }
    
    // הוספת כפתורי גיל מהירים
    const ageField = document.getElementById('patient-age');
    if (ageField) {
        const ageFieldParent = ageField.parentElement;
        const ageButtons = createAgeButtons();
        ageFieldParent.appendChild(ageButtons);
    }
    
    // מילוי רשימת התלונות הנפוצות
    const complaintSelect = document.getElementById('main-complaint');
    if (!complaintSelect) {
        console.error("לא נמצא אלמנט 'main-complaint' בדף!");
        return;
    }
    
    // רשימת תלונות נפוצות
    const complaints = [
        "כאב גרון",
        "כאב ראש",
        "כאב בטן",
        "כאב גב",
        "שיעול",
        "קוצר נשימה",
        "סחרחורת",
        "בחילה",
        "הקאות",
        "פריחה בעור",
        "חום",
        "חולשה כללית",
        "כאב אוזניים",
        "כאב חזה",
        "שבר", 
        "נקע",
        "פציעת ספורט",
        "חתך", 
        "שריטה",
        "כוויה",
        "תאונת דרכים",
        "נפילה מגובה",
        "פציעת ראש",
        "דימום",
        "חבלה",
        "מכה",
        "עקיצה",
        "הכשת נחש",
        "הכשת עקרב",
        "הרעלה",
        "התייבשות",
        "היפותרמיה",
        "היפרתרמיה",
        "טביעה",
        "התקף חרדה",
        "התקף אפילפסיה",
        "פגיעה בעין",
        "גוף זר בעין",
        "פגיעה בשן",
        "דלקת עיניים",
        "דלקת אוזניים",
        "אחר"
    ];
    
    // מילוי התלונות
    complaints.forEach(complaint => {
        const option = document.createElement('option');
        option.value = complaint;
        option.textContent = complaint;
        complaintSelect.appendChild(option);
    });
    
    // טיפול בתלונה "אחר"
    complaintSelect.addEventListener('change', function() {
        const otherContainer = document.getElementById('other-complaint-container');
        if (this.value === 'אחר') {
            otherContainer.style.display = 'block';
        } else {
            otherContainer.style.display = 'none';
        }
    });
    
    // ---------- כפתורי ניווט בין השלבים ----------
    
    // שלב 1 -> שלב 2
    document.getElementById('next-to-step2').addEventListener('click', function() {
        // איסוף נתוני הפרופיל הרפואי
        const profile = getSelectedRadioValue('profile');
        const medicalSections = document.getElementById('medical-sections').value.trim();
        
        const hasAllergies = getSelectedRadioValue('allergies') === 'yes';
        let allergiesDetails = "ללא אלרגיות ידועות";
        if (hasAllergies) {
            allergiesDetails = document.getElementById('allergies-details').value.trim();
            if (!allergiesDetails) {
                alert('נא לפרט את האלרגיות');
                return;
            }
        }
        
        const takesMedications = getSelectedRadioValue('medications') === 'yes';
        let medicationsDetails = "לא נוטל תרופות באופן קבוע";
        if (takesMedications) {
            medicationsDetails = document.getElementById('medications-details').value.trim();
            if (!medicationsDetails) {
                alert('נא לפרט את התרופות');
                return;
            }
        }
        
        const isSmoking = getSelectedRadioValue('smoking') === 'yes';
        let smokingDetails = "לא מעשן";
        if (isSmoking) {
            smokingDetails = document.getElementById('smoking-details').value.trim();
            smokingDetails = smokingDetails ? `מעשן, ${smokingDetails}` : "מעשן";
        }
        
        // וידוא שכל השדות מולאו
        const age = document.getElementById('patient-age').value;
        const gender = getSelectedRadioValue('gender');
        const mainComplaintSelect = document.getElementById('main-complaint');
        let mainComplaint = mainComplaintSelect.value;
        
        // בדיקת תקינות הנתונים
        if (!age || age < 0 || age > 120) {
            alert('יש להזין גיל תקין (0-120)');
            return;
        }
        
        if (!gender) {
            alert('יש לבחור מין');
            return;
        }
        
        if (!mainComplaint) {
            alert('יש לבחור תלונה עיקרית');
            return;
        }
        
        // אם נבחר "אחר", לקחת את הערך מהשדה הנוסף
        if (mainComplaint === 'אחר') {
            const otherComplaint = document.getElementById('other-complaint').value.trim();
            if (!otherComplaint) {
                alert('יש לפרט את התלונה האחרת');
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
                // מידע פרופיל חדש
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
        
        // קבלת שאלות סטנדרטיות לפי התלונה
        let standardQuestions = getStandardQuestions(mainComplaint);
        
        // יצירת אלמנטי שאלות במסך
        const questionsList = document.getElementById('standard-questions-list');
        questionsList.innerHTML = '';
        
        if (standardQuestions.length === 0) {
            // אם אין שאלות סטנדרטיות לתלונה זו
            const noQuestionsItem = document.createElement('li');
            noQuestionsItem.className = 'question-item';
            noQuestionsItem.textContent = 'אין שאלות סטנדרטיות לתלונה זו. נא לעבור לשלב הבא.';
            questionsList.appendChild(noQuestionsItem);
        } else {
            // הוספת השאלות הסטנדרטיות
            standardQuestions.forEach((question, index) => {
                const questionElement = createQuestionElement(question, index, true);
                questionsList.appendChild(questionElement);
            });
        }
        
        // הוספת טופס מדדים חיוניים
        const vitalSignsContainer = document.getElementById('vital-signs-container');
        vitalSignsContainer.innerHTML = '';
        if (relevantVitalSigns.length > 0) {
            const vitalSignsForm = createVitalSignsForm(relevantVitalSigns);
            vitalSignsContainer.appendChild(vitalSignsForm);
        }
        
        // מעבר לשלב הבא
        showStep(2);
    });
    
    // שלב 2 -> שלב 1
    document.getElementById('back-to-step1').addEventListener('click', function() {
        showStep(1);
    });
    
    // שלב 2 -> שלב 3
    document.getElementById('next-to-step3').addEventListener('click', function() {
        // איסוף תשובות לשאלות סטנדרטיות
        const standardAnswers = collectAnswers('input[data-standard="true"], select[data-standard="true"]');
        
        // שמירת התשובות ברשומת המטופל
        state.patientRecord.standardAnswers = standardAnswers;
        
        // שמירת מדדים חיוניים
        state.patientRecord.vitalSigns = collectVitalSigns();
        
        // הצגת אנימציית טעינה
        document.getElementById('dynamic-questions-loading').style.display = 'block';
        document.getElementById('dynamic-questions-container').style.display = 'none';
        
        // מעבר לשלב הבא
        showStep(3);
        
        // קבלת שאלות דינמיות בהתאם לתשובות הקודמות
        setTimeout(() => {
            const dynamicQuestions = getDynamicQuestions(state.patientRecord.patientInfo.mainComplaint, standardAnswers);
            
            // יצירת אלמנטי שאלות במסך
            const questionsList = document.getElementById('dynamic-questions-list');
            questionsList.innerHTML = '';
            
            if (dynamicQuestions.length === 0) {
                const noQuestionsItem = document.createElement('li');
                noQuestionsItem.className = 'question-item';
                noQuestionsItem.textContent = 'אין שאלות נוספות לתלונה זו. נא לעבור לשלב הבא.';
                questionsList.appendChild(noQuestionsItem);
            } else {
                dynamicQuestions.forEach((question, index) => {
                    const questionElement = createQuestionElement(question, index, false);
                    questionsList.appendChild(questionElement);
                });
            }
            
            // הסתרת אנימציית הטעינה והצגת השאלות
            document.getElementById('dynamic-questions-loading').style.display = 'none';
            document.getElementById('dynamic-questions-container').style.display = 'block';
        }, 1000); // המתנה של שנייה אחת
    });
    
    // שלב 3 -> שלב 2
    document.getElementById('back-to-step2').addEventListener('click', function() {
        showStep(2);
    });
    
    // שלב 3 -> שלב 4
    document.getElementById('next-to-step4').addEventListener('click', function() {
        // איסוף תשובות לשאלות דינמיות
        const dynamicAnswers = collectAnswers('input[data-dynamic="true"], select[data-dynamic="true"]');
        
        // שמירת התשובות ברשומת המטופל
        state.patientRecord.dynamicAnswers = dynamicAnswers;
        
        // הצגת אנימציית טעינה
        document.getElementById('summary-loading').style.display = 'block';
        document.getElementById('summary-container').style.display = 'none';
        
        // מעבר לשלב הבא
        showStep(4);
        
        // יצירת סיכום אנמנזה
        setTimeout(() => {
            const patientRecord = generateSummary(state.patientRecord);
            state.patientRecord = patientRecord;
            
            // הצגת הסיכום במסך
            document.getElementById('summary-text').textContent = patientRecord.summary;
            
            // הדגשת דגלים אדומים
            highlightRedFlags();
            
            // הסתרת אנימציית הטעינה והצגת הסיכום
            document.getElementById('summary-loading').style.display = 'none';
            document.getElementById('summary-container').style.display = 'block';
        }, 1500); // המתנה של 1.5 שניות
    });
    
    // שלב 4 -> שלב 3
    document.getElementById('back-to-step3').addEventListener('click', function() {
        showStep(3);
    });
    
    // כפתור העתקת הסיכום
    document.getElementById('copy-summary').addEventListener('click', function() {
        const summaryText = document.getElementById('summary-text').textContent;
        
        // העתקה ללוח
        navigator.clipboard.writeText(summaryText)
            .then(() => {
                // אנימציה להצלחת ההעתקה
                this.classList.add('copy-success');
                
                // הודעת הצלחה
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i> הועתק בהצלחה';
                
                // החזרת הטקסט המקורי אחרי 2 שניות
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('copy-success');
                }, 2000);
            })
            .catch(err => {
                console.error('שגיאה בהעתקה:', err);
                alert('שגיאה בהעתקה. נסה שוב.');
            });
    });
    
    // כפתור סיום בלי צורך בדוא"ל
    document.getElementById('complete-summary').addEventListener('click', function() {
        // העבר ישירות לשלב 5 (סיום)
        document.getElementById('final-summary-text').textContent = state.patientRecord.summary;
        
        // הוסף יכולת העתקה גם בשלב הסיום
        highlightRedFlagsInFinalSummary();
        
        showStep(5);
    });
    
    // שלב 4 -> שלב 5 (עם שליחה לרופא אופציונלית)
    document.getElementById('send-summary').addEventListener('click', function() {
        // בדיקה אם הוזן דוא"ל
        const doctorEmail = document.getElementById('doctor-email').value.trim();
        
        // העברה לשלב 5 עם הסיכום
        document.getElementById('final-summary-text').textContent = state.patientRecord.summary;
        
        // הוסף יכולת העתקה גם בשלב הסיום
        highlightRedFlagsInFinalSummary();
        
        // התקדם לשלב הסיום
        showStep(5);
        
        // סימולציית שליחה אם הוזן דוא"ל
        if (doctorEmail) {
            // הצגת הודעת טעינת שליחה
            const sendingToast = document.createElement('div');
            sendingToast.className = 'toast-notification sending';
            sendingToast.innerHTML = `<i class="fas fa-spinner fa-spin"></i> שולח סיכום לכתובת ${doctorEmail}...`;
            document.body.appendChild(sendingToast);
            
            // סימולציית שליחה
            setTimeout(() => {
                // הסרת הודעת השליחה
                document.body.removeChild(sendingToast);
                
                // הצגת הודעת הצלחה
                const successToast = document.createElement('div');
                successToast.className = 'toast-notification success';
                successToast.innerHTML = `<i class="fas fa-check"></i> הסיכום נשלח בהצלחה לכתובת: ${doctorEmail}`;
                document.body.appendChild(successToast);
                
                // הסרת הודעת ההצלחה לאחר 3 שניות
                setTimeout(() => {
                    document.body.removeChild(successToast);
                }, 3000);
            }, 2000);
        }
    });
    
    // כפתור העתקת הסיכום הסופי
    document.getElementById('copy-final-summary').addEventListener('click', function() {
        const summaryText = document.getElementById('final-summary-text').textContent;
        
        // העתקה ללוח
        navigator.clipboard.writeText(summaryText)
            .then(() => {
                // אנימציה להצלחת ההעתקה
                this.classList.add('copy-success');
                
                // הודעת הצלחה
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i> הועתק בהצלחה';
                
                // החזרת הטקסט המקורי אחרי 2 שניות
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('copy-success');
                }, 2000);
            })
            .catch(err => {
                console.error('שגיאה בהעתקה:', err);
                alert('שגיאה בהעתקה. נסה שוב.');
            });
    });
    
    // התחלת רשומה חדשה
    document.getElementById('start-new').addEventListener('click', function() {
        // איפוס הטופס - כולל השדות החדשים
        document.getElementById('patient-age').value = '';
        document.querySelectorAll('input[name="gender"]')[0].checked = true;
        document.getElementById('main-complaint').selectedIndex = 0;
        document.getElementById('other-complaint').value = '';
        document.getElementById('other-complaint-container').style.display = 'none';
        document.getElementById('doctor-email').value = '';
        
        // איפוס שדות פרופיל
        document.querySelectorAll('input[name="profile"]')[0].checked = true;
        document.getElementById('medical-sections').value = '';
        document.querySelectorAll('input[name="allergies"]')[0].checked = true;
        document.getElementById('allergies-details').value = '';
        document.getElementById('allergies-details-container').style.display = 'none';
        document.querySelectorAll('input[name="medications"]')[0].checked = true;
        document.getElementById('medications-details').value = '';
        document.getElementById('medications-details-container').style.display = 'none';
        document.querySelectorAll('input[name="smoking"]')[0].checked = true;
        document.getElementById('smoking-details').value = '';
        document.getElementById('smoking-details-container').style.display = 'none';
        
        // איפוס המצב
        state.patientRecord = null;
        
        // חזרה לשלב הראשון
        showStep(1);
        
        // הצגת הודעת איפוס
        const resetToast = document.createElement('div');
        resetToast.className = 'toast-notification info';
        resetToast.innerHTML = '<i class="fas fa-info-circle"></i> התחלת רשומה חדשה';
        document.body.appendChild(resetToast);
        
        // הסרת ההודעה לאחר 2 שניות
        setTimeout(() => {
            document.body.removeChild(resetToast);
        }, 2000);
    });
    
    // הוספת אירועים לטיפול בשדות אלרגיה ותרופות
    document.querySelectorAll('input[name="allergies"]').forEach(radio => {
        radio.addEventListener('change', function() {
            toggleFieldVisibility('allergies', this.value === 'yes');
        });
    });
    
    document.querySelectorAll('input[name="medications"]').forEach(radio => {
        radio.addEventListener('change', function() {
            toggleFieldVisibility('medications', this.value === 'yes');
        });
    });
    
    document.querySelectorAll('input[name="smoking"]').forEach(radio => {
        radio.addEventListener('change', function() {
            toggleFieldVisibility('smoking', this.value === 'yes');
        });
    });
});

// פונקציות עזר

// פונקציה להצגת/הסתרת שדה הזנה לפי בחירה
function toggleFieldVisibility(fieldName, show) {
    const detailsContainer = document.getElementById(`${fieldName}-details-container`);
    detailsContainer.style.display = show ? 'block' : 'none';
    
    if (!show) {
        document.getElementById(`${fieldName}-details`).value = '';
    }
}

// פונקציית עזר להשגת שאלות סטנדרטיות לפי תלונה
function getStandardQuestions(complaint) {
    // פונקציה זו אמורה להשתמש בשירות מהשרת
    // במצב פיתוח/דמו, נשתמש בנתונים קבועים
    
    // מיפוי שאלות מפורטות יותר לפי סוג התלונה
    const standardQuestions = {
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
                type: "yesNo",
                question: "האם יש קושי בבליעה?",
                followUp: "באיזו רמה (קל/בינוני/חמור)?"
            },
            {
                type: "yesNo",
                question: "האם יש נפיחות בצוואר או בבלוטות הלימפה?",
                followUp: "היכן בדיוק ומה גודל הנפיחות?"
            },
            {
                type: "yesNo",
                question: "האם אתה מעשן?",
                followUp: "כמה סיגריות ביום?"
            }
        ],
        "כאב ראש": [
            {
                type: "duration",
                question: "כמה זמן נמשך כאב הראש?",
                placeholder: "שעה / יום / יומיים..."
            },
            {
                type: "location",
                question: "היכן ממוקם הכאב?",
                options: ["מצח", "רקות", "עורף", "חד צדדי", "דו-צדדי", "כל הראש"]
            },
            {
                type: "characteristic",
                question: "כיצד היית מתאר את אופי הכאב?",
                options: ["לוחץ", "פועם", "דוקר", "צורב"]
            },
            {
                type: "yesNo",
                question: "האם יש רגישות לאור או רעש?",
                followUp: "באיזו עוצמה?"
            },
            {
                type: "yesNo",
                question: "האם יש בחילה או הקאות?",
                followUp: "תאר את התדירות והעוצמה"
            },
            {
                type: "yesNo",
                question: "האם לקחת תרופות כלשהן להקלה?",
                followUp: "אילו תרופות והאם הועילו?"
            },
            {
                type: "yesNo",
                question: "האם אתה מעשן?",
                followUp: "כמה סיגריות ביום?"
            }
        ],
        "כאב בטן": [
            {
                type: "duration",
                question: "כמה זמן נמשך כאב הבטן?",
                placeholder: "שעה / יום / יומיים..."
            },
            {
                type: "location",
                question: "היכן ממוקם הכאב בבטן?",
                options: ["בטן עליונה", "בטן תחתונה", "ימין", "שמאל", "סביב הטבור", "כל הבטן"]
            },
            {
                type: "characteristic",
                question: "כיצד היית מתאר את אופי הכאב?",
                options: ["חד", "מתמשך", "התקפי", "צורב", "לוחץ"]
            },
            {
                type: "yesNo",
                question: "האם יש שינויים ביציאות?",
                followUp: "איזה סוג של שינויים (שלשול/עצירות)?"
            },
            {
                type: "yesNo",
                question: "האם יש בחילה או הקאות?",
                followUp: "תאר את התדירות והעוצמה"
            },
            {
                type: "yesNo",
                question: "האם אתה מעשן?",
                followUp: "כמה סיגריות ביום?"
            }
        ],
        "כאב גב": [
            {
                type: "duration",
                question: "כמה זמן נמשך כאב הגב?",
                placeholder: "יום / שבוע / חודש..."
            },
            {
                type: "location",
                question: "היכן ממוקם הכאב בגב?",
                options: ["גב עליון", "גב תחתון", "אמצע הגב", "צד ימין", "צד שמאל", "מרכז עמוד השדרה"]
            },
            {
                type: "characteristic",
                question: "כיצד היית מתאר את אופי הכאב?",
                options: ["חד", "מתמשך", "צורב", "התכווצותי", "מקרין"]
            },
            {
                type: "yesNo",
                question: "האם הכאב מקרין לגפיים?",
                followUp: "לאן הכאב מקרין ומה עוצמתו?"
            },
            {
                type: "yesNo",
                question: "האם אתה חש חולשה או נימול בגפיים?",
                followUp: "איפה בדיוק ומה עוצמת התופעה?"
            },
            {
                type: "yesNo",
                question: "האם אתה מעשן?",
                followUp: "כמה סיגריות ביום?"
            }
        ],
        // שאר התלונות יש להמשיך באותו פורמט
    };
    
    // אם יש שאלות מוגדרות לתלונה, החזר אותן
    if (standardQuestions[complaint]) {
        return standardQuestions[complaint];
    }
    
    // אחרת החזר שאלות כלליות
    return [
        {
            type: "duration",
            question: "כמה זמן נמשכים הסימפטומים?",
            placeholder: "שעות / ימים / שבועות..."
        },
        {
            type: "onset",
            question: "כיצד התחילו הסימפטומים?",
            options: ["בפתאומיות", "בהדרגה", "לאחר אירוע מסוים"]
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
            type: "yesNo",
            question: "האם יש סימפטומים נוספים מלבד התלונה העיקרית?",
            followUp: "אילו סימפטומים נוספים?"
        },
        {
            type: "yesNo",
            question: "האם אתה מעשן?",
            followUp: "כמה סיגריות ביום?"
        }
    ];
}

// פונקציה להשגת שאלות דינמיות בהתאם לתשובות הקודמות
function getDynamicQuestions(complaint, previousAnswers) {
    // פונקציה זו אמורה להשתמש בשירות מהשרת
    // במצב פיתוח/דמו, נשתמש בנתונים קבועים
    
    // ניתוח התשובות הקודמות לזיהוי סימפטומים ייחודיים
    const hasSymptom = (keyword) => {
        return Object.entries(previousAnswers).some(([question, answer]) => 
            (question.toLowerCase().includes(keyword.toLowerCase()) || 
             answer.toLowerCase().includes(keyword.toLowerCase())) &&
            answer.toLowerCase().includes('כן')
        );
    };
    
    // שאלות דינמיות לפי תלונה ותשובות קודמות
    if (complaint === 'כאב ראש') {
        return [
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
                type: "yesNo",
                question: "האם הכאב החל לאחר מאמץ או אירוע מסוים?",
                followUp: "תאר את האירוע"
            }
        ];
    }
    
    else if (complaint === 'כאב בטן') {
        return [
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
                type: "yesNo",
                question: "האם הכאב קשור לאכילה?",
                followUp: "האם מופיע לפני, בזמן או אחרי אכילה?"
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
            }
        ];
    }
    
    // שאלות דינמיות כלליות
    return [
        {
            type: "yesNo",
            question: "האם חל שינוי ברמת האנרגיה שלך לאחרונה?",
            followUp: "תאר את השינוי"
        },
        {
            type: "yesNo",
            question: "האם יש שינויים בהרגלי האכילה או השתייה שלך?",
            followUp: "איזה שינויים?"
        },
        {
            type: "yesNo",
            question: "האם יש לך מחלות כרוניות?",
            followUp: "אילו מחלות?"
        },
        {
            type: "yesNo",
            question: "האם חווית מצבים דומים בעבר?",
            followUp: "מתי והאם טופלו?"
        }
    ];
}

// פונקציה לקבלת מדדים חיוניים רלוונטיים לתלונה
function getRelevantVitalSigns(complaint) {
    // מיפוי מדדים רלוונטיים לפי תלונה
    const vitalSignsByComplaint = {
        "כאב ראש": ["דופק", "לחץ דם", "חום", "סטורציה"],
        "כאב חזה": ["דופק", "לחץ דם", "חום", "סטורציה", "קצב נשימה"],
        "קוצר נשימה": ["דופק", "לחץ דם", "חום", "סטורציה", "קצב נשימה"],
        "כאב בטן": ["דופק", "לחץ דם", "חום"],
        "חום": ["דופק", "לחץ דם", "חום", "סטורציה"],
        "פציעת ראש": ["דופק", "לחץ דם", "סטורציה"],
        "כאב גרון": ["חום"],
        "שיעול": ["חום", "סטורציה", "קצב נשימה"],
        "סחרחורת": ["דופק", "לחץ דם", "חום"]
    };
    
    // החזרת המדדים הרלוונטיים או ברירת מחדל
    return vitalSignsByComplaint[complaint] || ["דופק", "לחץ דם", "חום"];
}

// פונקציה ליצירת סיכום אנמנזה
function generateSummary(patientRecord) {
    // פונקציה זו אמורה להשתמש בשירות מהשרת
    // במצב פיתוח/דמו, נחקה את הסיכום שהתקבל מהשרת
    
    try {
        // חילוץ מידע בסיסי
        const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
        const genderText = gender === 'male' ? 'זכר' : 'נקבה';
        
        // פתיחת האנמנזה עם פרטי הפרופיל הרפואי
        let summary = `פרופיל ${profile}, ${medicalSections}, ${allergies}, ${medications}.\n\n`;
        
        // תיאור דמוגרפי ותלונה עיקרית
        summary += `מטופל/ת בגיל ${age}, ${genderText}, ${smoking === 'yes' ? 'מעשן/ת' : 'לא מעשן/ת'}, מתלונן/ת על ${mainComplaint}`;
        
        // הוספת המדדים אם קיימים
        if (patientRecord.vitalSigns && Object.keys(patientRecord.vitalSigns).length > 0) {
            summary += '\n\nמדדים חיוניים: ';
            const vitalSignsArr = [];
            
            if (patientRecord.vitalSigns.pulse) {
                vitalSignsArr.push(`דופק ${patientRecord.vitalSigns.pulse}`);
            }
            if (patientRecord.vitalSigns.bloodPressure) {
                vitalSignsArr.push(`לחץ דם ${patientRecord.vitalSigns.bloodPressure}`);
            }
            if (patientRecord.vitalSigns.temperature) {
                vitalSignsArr.push(`חום ${patientRecord.vitalSigns.temperature}`);
            }
            if (patientRecord.vitalSigns.saturation) {
                vitalSignsArr.push(`סטורציה ${patientRecord.vitalSigns.saturation}%`);
            }
            if (patientRecord.vitalSigns.respiratoryRate) {
                vitalSignsArr.push(`קצב נשימה ${patientRecord.vitalSigns.respiratoryRate}`);
            }
            
            summary += vitalSignsArr.join(', ') + '.\n\n';
        } else {
            summary += '.\n\n';
        }
        
        // איסוף מידע משמעותי מהתשובות
        let duration = "";
        let location = "";
        let characteristics = [];
        let associatedSymptoms = [];
        let aggravatingFactors = [];
        let relievingFactors = [];
        let treatments = [];
        let negativeFindings = []; // ממצאים שליליים
        
        // חיפוש תשובות רלוונטיות מהשאלות הסטנדרטיות והדינמיות
        const allAnswers = {
            ...patientRecord.standardAnswers,
            ...patientRecord.dynamicAnswers
        };
        
        // עיבוד המידע מהתשובות
        for (const [question, answer] of Object.entries(allAnswers)) {
            if (!answer || answer.trim() === '') continue;
            
            // זיהוי קטגוריות מידע שונות
            if (question.includes("זמן") || question.includes("מתי") || question.includes("כמה זמן") || question.includes("משך")) {
                duration = answer;
            } 
            else if (question.includes("היכן") || question.includes("מיקום") || question.includes("איפה") || question.includes("ממוקם")) {
                location = answer;
            }
            else if (question.includes("אופי") || question.includes("מתאר") || question.includes("סוג")) {
                characteristics.push(answer);
            }
            else if (question.includes("מחמיר") || question.includes("גורם להחמרה")) {
                aggravatingFactors.push(answer);
            }
            else if (question.includes("מקל") || question.includes("גורם להקלה")) {
                relievingFactors.push(answer);
            }
            else if (question.includes("סימפטומים נוספים") || question.includes("תסמינים") || 
                    question.includes("בחילה") || question.includes("הקאות") || 
                    question.includes("חום") || question.includes("סחרחורת")) {
                if (answer.toLowerCase() === 'לא') {
                    negativeFindings.push(`שולל ${question.replace('?', '').replace('האם', '')}`);
                } else {
                    associatedSymptoms.push(`${question.replace('?', '')}: ${answer}`);
                }
            }
            else if (question.includes("טיפול") || question.includes("תרופות") || question.includes("לקחת")) {
                if (answer.toLowerCase() === 'לא') {
                    negativeFindings.push("שולל נטילת תרופות קודמות");
                } else {
                    treatments.push(`${question.replace('?', '')}: ${answer}`);
                }
            }
            else if (answer.toLowerCase() === 'לא') {
                // הוספת ממצאים שליליים נוספים
                negativeFindings.push(`שולל ${question.replace('?', '').replace('האם', '')}`);
            }
        }
        
        // בניית משפט משמעותי על התלונה העיקרית
        if (duration) {
            summary += `התלונה החלה לפני ${duration}`;
        }
        
        if (location) {
            summary += ` ומתמקמת ב${location}`;
        }
        
        if (characteristics.length > 0) {
            summary += `. התלונה מתוארת כ${characteristics.join(", ")}`;
        }
        
        summary += '. ';
        
        // הוספת גורמים מחמירים ומקלים
        if (aggravatingFactors.length > 0 || relievingFactors.length > 0) {
            if (aggravatingFactors.length > 0) {
                summary += `גורמים מחמירים: ${aggravatingFactors.join(", ")}. `;
            }
            
            if (relievingFactors.length > 0) {
                summary += `גורמים מקלים: ${relievingFactors.join(", ")}. `;
            }
            
            summary += '\n\n';
        }
        
        // הוספת סימפטומים נלווים
        if (associatedSymptoms.length > 0) {
            summary += `סימפטומים נלווים: ${associatedSymptoms.join("; ")}. \n\n`;
        }
        
        // הוספת מידע על טיפולים
        if (treatments.length > 0) {
            summary += `טיפולים שננקטו: ${treatments.join("; ")}. \n\n`;
        }
        
        // הוספת ממצאים שליליים
        if (negativeFindings.length > 0) {
            summary += `ממצאים שליליים: ${negativeFindings.join("; ")}. \n\n`;
        }
        
        // בדיקה לדגלים אדומים
        const redFlags = checkForRedFlags(patientRecord);
        
        if (redFlags.length > 0) {
            summary += `דגלים אדומים: ${redFlags.join("; ")}.`;
        }
        
        patientRecord.summary = summary;
        return patientRecord;
    } catch (error) {
        console.error("שגיאה ביצירת סיכום:", error);
        
        // אם יש שגיאה, יצירת סיכום בסיסי
        const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
        const genderText = gender === 'male' ? 'זכר' : 'נקבה';
        
        patientRecord.summary = `פרופיל ${profile}, ${medicalSections}, ${allergies}, ${medications}.\n\nמטופל/ת בגיל ${age}, ${genderText}, ${smoking === 'yes' ? 'מעשן/ת' : 'לא מעשן/ת'}, עם תלונה עיקרית של ${mainComplaint}.\n\nלא ניתן היה ליצור סיכום מפורט עקב בעיה טכנית.`;
        
        return patientRecord;
    }
}

// פונקציה לבדיקת דגלים אדומים בהתאם לתלונה
function checkForRedFlags(patientRecord) {
    const { mainComplaint } = patientRecord.patientInfo;
    const allAnswers = { ...patientRecord.standardAnswers, ...patientRecord.dynamicAnswers };
    const redFlags = [];
    
    // פונקציית עזר לבדיקת תשובות
    const containsKeyword = (keywords, answer) => {
        if (!Array.isArray(keywords)) keywords = [keywords];
        return keywords.some(keyword => answer.toLowerCase().includes(keyword.toLowerCase()));
    };
    
    // בדיקת תשובות בהתאם לתלונה
    if (mainComplaint.includes("כאב ראש")) {
        // בדיקת עוצמת כאב גבוהה
        Object.entries(allAnswers).forEach(([question, answer]) => {
            if (question.includes("עוצמת") && answer.match(/\d+/) && parseInt(answer.match(/\d+/)[0]) >= 8) {
                redFlags.push("כאב ראש בעוצמה גבוהה - נדרשת הערכה רפואית");
            }
            
            if (question.includes("הקאות") && containsKeyword(["כן", "מרובות", "חוזרות"], answer)) {
                redFlags.push("הקאות בשילוב עם כאב ראש - חשד למצב נוירולוגי דחוף");
            }
            
            if (question.includes("ראייה") && containsKeyword(["כן", "טשטוש", "כפל"], answer)) {
                redFlags.push("הפרעות ראייה המלוות כאב ראש - מצריך בירור דחוף");
            }
            
            if (question.includes("פתאומי") && containsKeyword(["כן", "פתאום"], answer)) {
                redFlags.push("כאב ראש שהופיע בפתאומיות - יש לשקול הערכה נוירולוגית דחופה");
            }
        });
    }
    
    else if (mainComplaint.includes("כאב בטן")) {
        Object.entries(allAnswers).forEach(([question, answer]) => {
            if ((question.includes("דם") || question.includes("דמית")) && containsKeyword(["כן"], answer)) {
                redFlags.push("דם בצואה או בהקאות - מצריך הערכה דחופה");
            }
            
            if (question.includes("בטן קשה") && containsKeyword(["כן"], answer)) {
                redFlags.push("בטן קשה או מתוחה - יש לשלול מצב כירורגי חריף");
            }
        });
        
        // בדיקת מדדים חיוניים
        if (patientRecord.vitalSigns) {
            const pulse = patientRecord.vitalSigns.pulse;
            if (pulse && parseInt(pulse) > 100) {
                redFlags.push(`דופק מהיר (${pulse}) במטופל עם כאב בטן - חשד להלם או זיהום`);
            }
        }
    }
    
    // דגלים אדומים כלליים
    if (patientRecord.vitalSigns) {
        const temp = patientRecord.vitalSigns.temperature;
        if (temp && parseFloat(temp) >= 39) {
            redFlags.push(`חום גבוה ${temp} - דורש התייחסות`);
        }
        
        const saturation = patientRecord.vitalSigns.saturation;
        if (saturation && parseInt(saturation) < 92) {
            redFlags.push(`סטורציה נמוכה (${saturation}%) - מצריך הערכה דחופה`);
        }
    }
    
    return redFlags;
}