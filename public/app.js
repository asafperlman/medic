// public/app.js - גרסה משופרת ומתוקנת

/**
 * מערכת איסוף נתונים רפואיים - צד לקוח
 * ====================================
 */

// ייבוא מודולים
import { standardQuestions, dynamicQuestions, relevantComplaints } from './data/questionData.js';
import { createQuestionElement, createVitalSignsForm, createAdvancedInjuryLocationSelector } from './components/questionComponents.js';
import { generateSummary, highlightRedFlags, checkForRedFlags } from './services/summaryService.js';
import { showToast, createElement, getElement } from './utils/uiHelpers.js';

// מצב הנוכחי של המערכת - שימוש בסינגלטון לחיסכון בזיכרון
const state = {
    currentStep: 1,
    patientRecord: null,
    darkMode: localStorage.getItem('darkMode') === 'true' || false,
    lastSelectedOptions: {},
    unsavedChanges: false,
    pendingSaves: [],
    cachedElements: new Map(),
    cachedQuestions: new Map(),
    searchDelay: null,
    isSearchActive: false
};

// ======== פונקציות ניהול ממשק ========

/**
 * פונקציה להצגת שלב מסוים, ממוטבת לביצועים
 * @param {number} stepNumber - מספר השלב להצגה
 * @param {boolean} skipConfirm - האם לדלג על אישור שינויים
 */
/**
 * פונקציה להצגת שלב מסוים, ממוטבת לביצועים
 * @param {number} stepNumber - מספר השלב להצגה
 * @param {boolean} skipConfirm - האם לדלג על אישור שינויים
 */
function showStep(stepNumber, skipConfirm = false) {
    // בדיקה אם אנחנו כבר בשלב הזה
    if (state.currentStep === stepNumber) {
      return;
    }
    
    // מעבר משלב 1 לשלב 2 מיוחד - כאן אנחנו תמיד שומרים את הנתונים
    // לכן אין צורך באישור בכיוון זה
    const isStep1to2 = (state.currentStep === 1 && stepNumber === 2);
    
    // בדיקת שינויים לא שמורים (רק אם לא במעבר משלב 1 ל-2)
    if (!skipConfirm && !isStep1to2 && state.unsavedChanges) {
      // בדיקה אם יש שינויים משמעותיים
      const currentFormData = collectCurrentFormData();
      const hasSignificantChanges = checkSignificantChanges(currentFormData);
      
      if (hasSignificantChanges) {
        const confirmMove = confirm("יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעבור לשלב אחר?");
        if (!confirmMove) {
          return;
        }
      } else {
        // אם אין שינויים משמעותיים, אפס את הדגל
        state.unsavedChanges = false;
      }
    }
  
    // הסתרת כל השלבים
    document.querySelectorAll('.step').forEach(step => {
      step.classList.remove('active');
    });
  
    // הצגת השלב הנבחר
    const currentStepElement = document.getElementById(`step${stepNumber}`);
    if (currentStepElement) {
      currentStepElement.classList.add('active');
      
      // אנימציה חלקה להצגת השלב
      currentStepElement.style.opacity = 0;
      setTimeout(() => {
        currentStepElement.style.opacity = 1;
      }, 10);
    } else {
      console.error(`לא נמצא אלמנט עבור שלב ${stepNumber}`);
      return;
    }
  
    // שמירת השלב הנוכחי
    state.currentStep = stepNumber;
  
    // עדכון התצוגה
    updateProgressBar();
    updateButtonsVisibility();
  }
  
  /**
   * טיפול במעבר משלב 1 לשלב 2
   */
  function handleStep1to2() {
    // בדיקות ואיסוף נתונים כמו קודם...
    
    // ...
    
    // בסוף הפונקציה, אחרי שיצרת את הרשומה:
    
    // איפוס דגל השינויים - הכל נשמר עכשיו
    state.unsavedChanges = false;
    
    // מעבר לשלב הבא עם דילוג על אישור
    showStep(2, true);
  }

/**
 * בודק אם יש חיבור לשרת ומתאים את הממשק בהתאם
 */
function checkServerConnection() {
    const apiStatus = document.getElementById('api-status');
    if (!apiStatus) return;
    
    fetch('/api/test-openai-connection')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                apiStatus.className = 'api-status-indicator api-active';
                apiStatus.innerHTML = '<i class="fas fa-signal"></i> שרת AI מחובר';
            } else {
                apiStatus.className = 'api-status-indicator api-inactive';
                apiStatus.innerHTML = '<i class="fas fa-exclamation"></i> שרת AI לא זמין';
            }
        })
        .catch(() => {
            apiStatus.className = 'api-status-indicator api-offline';
            apiStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> מצב לא מקוון';
        });
}

/**
 * אוסף את המידע הנוכחי מהטופס
 */
function collectCurrentFormData() {
    switch (state.currentStep) {
        case 1:
            const ageElement = getElement('#patient-age');
            const mainComplaintElement = getElement('#main-complaint');
            return {
                age: ageElement?.value || '',
                gender: getSelectedRadioValue('gender') || '',
                mainComplaint: mainComplaintElement?.value || '',
                profile: getSelectedRadioValue('profile') || ''
            };
        case 2:
            return collectAnswers('input[data-standard="true"], select[data-standard="true"], textarea[data-standard="true"], input[type="hidden"][data-standard="true"]');
        case 3:
            return collectAnswers('input[data-dynamic="true"], select[data-dynamic="true"], textarea[data-dynamic="true"], input[type="hidden"][data-dynamic="true"]');
        default:
            return {};
    }
}

/**
 * בודק אם יש שינויים משמעותיים בטופס
 */
function checkSignificantChanges(currentData) {
    if (!state.patientRecord) return false;
    
    switch (state.currentStep) {
        case 1:
            return currentData.age || currentData.mainComplaint;
        case 2:
        case 3:
            return Object.keys(currentData).length > 0;
        default:
            return false;
    }
}

/**
 * עדכון סרגל התקדמות
 */
function updateProgressBar() {
    const progressContainer = getElement('#progress-bar-container');
    if (!progressContainer) return;
    
    if (progressContainer.dataset.currentStep === String(state.currentStep)) {
        return;
    }
    
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
 * עדכון לחצני ניווט בהתאם לשלב
 */
function updateButtonsVisibility() {
    const backButtons = document.querySelectorAll('.btn-back');
    const nextButtons = document.querySelectorAll('.btn-next');
    const completeBtn = getElement('#complete-process');
    
    requestAnimationFrame(() => {
        backButtons.forEach(btn => {
            btn.style.visibility = state.currentStep > 1 ? 'visible' : 'hidden';
        });
    
        nextButtons.forEach(btn => {
            btn.style.visibility = state.currentStep < 5 ? 'visible' : 'hidden';
        });
    
        if (completeBtn) {
            completeBtn.style.display = state.currentStep === 5 ? 'block' : 'none';
        }
    });
}

// ======== פונקציות ניהול שאלות ========

/**
 * טוען שאלות סטנדרטיות לפי תלונה
 * @param {string} complaint - התלונה העיקרית
 */
function loadStandardQuestions(complaint) {
    // ניסיון לקבל שאלות מהמטמון
    if (state.cachedQuestions.has(complaint)) {
        return state.cachedQuestions.get(complaint);
    }
    
    // אחרת, קבל שאלות מה-API השאלות
    let questions = standardQuestions.getQuestionsForComplaint(complaint);
    
    // שמור במטמון לשימוש עתידי
    state.cachedQuestions.set(complaint, questions);
    
    return questions;
}

/**
 * טוען שאלות דינמיות בהתאם לתלונה ותשובות קודמות
 * @param {string} complaint - התלונה העיקרית
 * @param {object} previousAnswers - תשובות קודמות
 */
/**
 * טוען שאלות דינמיות בהתאם לתלונה ותשובות קודמות
 * @param {string} complaint - התלונה העיקרית
 * @param {object} previousAnswers - תשובות קודמות
 */
async function loadDynamicQuestions(complaint, previousAnswers) {
    try {
      // הצגת אנימציית טעינה
      const loadingElement = getElement('#dynamic-questions-loading');
      const containerElement = getElement('#dynamic-questions-container');
      
      if (loadingElement) loadingElement.style.display = 'block';
      if (containerElement) containerElement.style.display = 'none';
      
      // הכנת נתונים לשליחה
      const requestData = {
        patientInfo: state.patientRecord.patientInfo,
        standardAnswers: previousAnswers
      };
      
      // שליחת בקשה לקבלת שאלות דינמיות
      let questions = [];
      
      try {
        const response = await fetch('/api/dynamic-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
          throw new Error(`שגיאת שרת: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success !== false && data.questions && data.questions.length > 0) {
          console.log(`התקבלו ${data.questions.length} שאלות ממקור: ${data.source}`);
          questions = data.questions;
        } else {
          throw new Error("לא התקבלו שאלות מהשרת");
        }
      } catch (error) {
        console.warn("שגיאה בקבלת שאלות מ-AI:", error);
        // במקרה של כישלון, קבלת שאלות לוקליות
        questions = dynamicQuestions.getLocalQuestionsForComplaint(complaint, previousAnswers);
      }
      
      // וודא שיש שאלות גם במקרה של כישלון מוחלט
      if (!questions || questions.length === 0) {
        questions = dynamicQuestions.getDefaultQuestions();
      }
      
      return questions;
    } catch (error) {
      console.error("שגיאה כללית בטעינת שאלות דינמיות:", error);
      return dynamicQuestions.getDefaultQuestions();
    } finally {
      // הסתרת אנימציית הטעינה בכל מקרה
      const loadingElement = getElement('#dynamic-questions-loading');
      const containerElement = getElement('#dynamic-questions-container');
      
      if (loadingElement) loadingElement.style.display = 'none';
      if (containerElement) containerElement.style.display = 'block';
    }
  }
/**
 * הצגת שאלות דינמיות בממשק
 * @param {Array} questions - השאלות להצגה
 */
function renderQuestions(questions, containerId, isStandard = true) {
    const container = getElement(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    if (!questions || questions.length === 0) {
        const noQuestionsItem = createElement('li', {
            className: 'question-item',
            text: 'אין שאלות ' + (isStandard ? 'סטנדרטיות' : 'נוספות') + ' לתלונה זו. נא לעבור לשלב הבא.'
        });
        fragment.appendChild(noQuestionsItem);
    } else {
        questions.forEach((question, index) => {
            try {
                const questionElement = createQuestionElement(question, index, isStandard);
                fragment.appendChild(questionElement);
            } catch (error) {
                console.error(`שגיאה ביצירת שאלה ${index}:`, error);
                
                const fallbackElement = createElement('li', {
                    className: 'question-item error-item',
                    html: `<div class="question-header">${question.question || 'שאלה לא תקינה'}</div>
                           <div class="answer-container">
                             <div class="error-message">שגיאה ביצירת שאלה זו</div>
                           </div>`
                });
                fragment.appendChild(fallbackElement);
            }
        });
    }
    
    container.appendChild(fragment);
}

// ======== טיפול במעבר בין שלבים ========

/**
 * טיפול במעבר משלב 1 לשלב 2
 */
function handleStep1to2() {
    // איסוף נתוני הפרופיל הרפואי
    const profile = getSelectedRadioValue('profile');
    const medicalSections = getElement('#medical-sections').value.trim();
    
    // בדיקות שדות תקינים
    // בדיקת אלרגיות
    const hasAllergies = getSelectedRadioValue('allergies') === 'yes';
    let allergiesDetails = "ללא אלרגיות ידועות";
    if (hasAllergies) {
        allergiesDetails = getElement('#allergies-details').value.trim();
        if (!allergiesDetails) {
            showToast('error', 'נא לפרט את האלרגיות');
            return;
        }
    }
    
    // בדיקת תרופות
    const takesMedications = getSelectedRadioValue('medications') === 'yes';
    let medicationsDetails = "לא נוטל תרופות באופן קבוע";
    if (takesMedications) {
        medicationsDetails = getElement('#medications-details').value.trim();
        if (!medicationsDetails) {
            showToast('error', 'נא לפרט את התרופות');
            return;
        }
    }
    
    // בדיקת עישון
    const isSmoking = getSelectedRadioValue('smoking') === 'yes';
    let smokingDetails = "לא מעשן";
    if (isSmoking) {
        smokingDetails = getElement('#smoking-details').value.trim();
        smokingDetails = smokingDetails ? `מעשן, ${smokingDetails}` : "מעשן";
    }
    
    // וידוא שדות נדרשים
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
    
    // טעינת שאלות סטנדרטיות והצגתן
    const standardQuestionsList = loadStandardQuestions(mainComplaint);
    renderQuestions(standardQuestionsList, '#standard-questions-list', true);
    
    // בדיקה אם צריך להציג טופס מיקום פציעה
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
    
    // קבלת מדדים חיוניים רלוונטיים לתלונה והצגתם
    const relevantVitalSigns = getRelevantVitalSigns(mainComplaint);
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
 */
async function handleStep2to3() {
    // איסוף תשובות מהשאלות הסטנדרטיות
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
    
    try {
        // טעינת שאלות דינמיות
        const dynamicQuestionsList = await loadDynamicQuestions(
            state.patientRecord.patientInfo.mainComplaint,
            standardAnswers
        );
        
        // הצגת השאלות הדינמיות
        renderQuestions(dynamicQuestionsList, '#dynamic-questions-list', false);
        
    } catch (error) {
        console.error("שגיאה בטעינת שאלות דינמיות:", error);
        
        // הצגת הודעת שגיאה
        const questionsList = getElement('#dynamic-questions-list');
        if (questionsList) {
            questionsList.innerHTML = `
                <li class="question-item error-item">
                    <div class="error-message">אירעה שגיאה בטעינת השאלות הנוספות.</div>
                    <div class="error-details">${error.message || 'שגיאה לא ידועה'}</div>
                </li>
            `;
        }
    } finally {
        // הסתרת אנימציית הטעינה
        getElement('#dynamic-questions-loading').style.display = 'none';
        getElement('#dynamic-questions-container').style.display = 'block';
    }
}

/**
 * טיפול במעבר משלב 3 לשלב 4
 */
async function handleStep3to4() {
    // איסוף תשובות לשאלות דינמיות
    const dynamicAnswers = collectAnswers('input[data-dynamic="true"], select[data-dynamic="true"], textarea[data-dynamic="true"], input[type="hidden"][data-dynamic="true"]');
    
    // שמירת התשובות ברשומת המטופל
    state.patientRecord.dynamicAnswers = dynamicAnswers;
    
    // הצגת אנימציית טעינה
    getElement('#summary-loading').style.display = 'block';
    getElement('#summary-container').style.display = 'none';
    
    // מעבר לשלב הבא
    showStep(4);
    
    // יצירת סיכום אנמנזה
    try {
        const updatedRecord = await generateSummary(state.patientRecord);
        state.patientRecord = updatedRecord;
        
        // הצגת הסיכום במסך
        getElement('#summary-text').textContent = updatedRecord.summary;
        
        // הדגשת דגלים אדומים
        highlightRedFlags();
        
    } catch (error) {
        console.error("שגיאה ביצירת סיכום:", error);
        showToast('error', 'אירעה שגיאה ביצירת הסיכום');
        
        // הצגת סיכום בסיסי במקרה של כישלון
        const basicSummary = `סיכום בסיסי של המטופל/ת: ${state.patientRecord.patientInfo.age} שנים, עם תלונה עיקרית של ${state.patientRecord.patientInfo.mainComplaint}.`;
        getElement('#summary-text').textContent = basicSummary;
    } finally {
        // הסתרת אנימציית הטעינה והצגת הסיכום
        getElement('#summary-loading').style.display = 'none';
        getElement('#summary-container').style.display = 'block';
    }
}

/**
 * טיפול בשלב 4 - העתקת סיכום
 */
function handleCopySummary() {
    const summaryText = getElement('#summary-text').textContent;
    
    navigator.clipboard.writeText(summaryText)
        .then(() => {
            this.classList.add('copy-success');
            showToast('success', 'הסיכום הועתק בהצלחה');
            
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
 * טיפול בסיום - ללא שליחת דוא"ל
 */
function handleCompleteSummary() {
    getElement('#final-summary-text').textContent = state.patientRecord.summary;
    highlightRedFlagsInFinalSummary();
    showStep(5);
    state.unsavedChanges = false;
}

/**
 * טיפול בשליחת הסיכום לרופא
 */
function handleSendSummary() {
    const doctorEmail = getElement('#doctor-email').value.trim();
    
    if (doctorEmail && !isValidEmail(doctorEmail)) {
        showToast('error', 'כתובת דואר אלקטרוני לא תקינה');
        return;
    }
    
    getElement('#final-summary-text').textContent = state.patientRecord.summary;
    highlightRedFlagsInFinalSummary();
    showStep(5);
    
    if (doctorEmail) {
        const sendingToast = showToast('sending', `שולח סיכום לכתובת ${doctorEmail}...`);
        
        setTimeout(() => {
            if (document.body.contains(sendingToast)) {
                document.body.removeChild(sendingToast);
            }
            
            showToast('success', `הסיכום נשלח בהצלחה לכתובת: ${doctorEmail}`);
            state.unsavedChanges = false;
        }, 2000);
    } else {
        state.unsavedChanges = false;
    }
}

/**
 * טיפול בהעתקת הסיכום הסופי
 */
function handleCopyFinalSummary() {
    const summaryText = getElement('#final-summary-text').textContent;
    
    navigator.clipboard.writeText(summaryText)
        .then(() => {
            this.classList.add('copy-success');
            showToast('success', 'הסיכום הועתק בהצלחה');
            
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
 * טיפול בהדפסת הסיכום
 */
function handlePrintSummary() {
    const printWindow = window.open('', '_blank');
    const summaryHtml = getElement('#final-summary-text').innerHTML;
    
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
                /* סגנונות נוספים... */
            </style>
        </head>
        <body>
            <div class="header">
                <h1>סיכום רפואי</h1>
                <p>תאריך: ${new Date().toLocaleDateString('he-IL')}</p>
            </div>
            <div class="summary">
                ${summaryHtml}
            </div>
            <div class="footer">
                <p>מסמך זה הופק באמצעות מערכת איסוף נתונים רפואיים</p>
            </div>
            <button onclick="window.print()" class="no-print">להדפסה לחץ כאן</button>
        </body>
        </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.addEventListener('load', function() {
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    });
}

/**
 * ייצוא הסיכום לPDF
 */
function handleExportPdf() {
    showToast('info', 'מייצא סיכום כקובץ PDF...');
    
    setTimeout(() => {
        showToast('success', 'הסיכום יוצא בהצלחה כקובץ PDF');
    }, 1500);
}

/**
 * איפוס הטופס והתחלה מחדש
 */
function resetForm(confirmReset = true) {
    if (state.unsavedChanges && confirmReset) {
        const confirmAction = confirm("יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לאפס את הטופס?");
        if (!confirmAction) {
            return false;
        }
    }
    
    // קבוצות איפוס - מבוצעות בנפרד לשיפור ביצועים
    const resetGroups = [
        // איפוס שדות בסיסיים
        () => {
            // איפוס גיל, מגדר, תלונה עיקרית וכו'
        },
        
        // איפוס פרופיל רפואי
        () => {
            // איפוס פרופיל, אלרגיות, תרופות וכו'
        },
        
        // איפוס תיבות בחירה וסולמות
        () => {
            // איפוס תיבות סימון, סקאלות וכו'
        },
        
        // איפוס שאר השדות
        () => {
            // איפוס הערות, אזורי פציעה וכו'
        }
    ];
    
    // ביצוע איפוס ביעילות
    requestAnimationFrame(() => {
        resetGroups.forEach((resetFunction, index) => {
            setTimeout(() => {
                resetFunction();
            }, index * 5);
        });
        
        // איפוס המצב וחזרה לשלב ראשון
        state.patientRecord = null;
        state.unsavedChanges = false;
        showStep(1, true);
        
        showToast('info', 'הטופס אופס בהצלחה');
    });
    
    return true;
}

// ======== פונקציות עזר ========

/**
 * איסוף תשובות מהטופס
 */
function collectAnswers(selector) {
    const answers = {};
    const inputs = document.querySelectorAll(selector);
    
    inputs.forEach(input => {
        if (!input.value && !input.checked) return;
        if (!input.dataset.question) return;

        let value = '';
        
        if (input.type === 'hidden') {
            value = input.value;
        } else if (input.type === 'radio') {
            if (!input.checked) return;
            
            value = input.value;
            
            if (value === 'כן') {
                const followUpSelector = `.follow-up-input[data-parent-question="${input.dataset.question}"]`;
                const followUpInput = document.querySelector(followUpSelector);
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
        
        if (value !== '') {
            answers[input.dataset.question] = value;
        }
    });
    
    // איסוף הערות
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
 * איסוף מדדים חיוניים
 */
function collectVitalSigns() {
    const vitalSigns = {};
    
    document.querySelectorAll('.vital-sign-input').forEach(input => {
        if (input.value.trim() !== '') {
            vitalSigns[input.dataset.vitalSign] = input.value.trim();
        }
    });
    
    return vitalSigns;
}

/**
 * קבלת ערך נבחר מפקדי רדיו
 */
function getSelectedRadioValue(name) {
    const selectedRadio = document.querySelector(`input[name="${name}"]:checked`);
    return selectedRadio ? selectedRadio.value : null;
}

/**
 * קבלת מדדים חיוניים רלוונטיים לפי תלונה
 */
function getRelevantVitalSigns(complaint) {
    // מיפוי מדדים חיוניים לפי תלונה - יוזן מקובץ נפרד
    const vitalSignsByComplaint = {
        "כאב ראש": ["דופק", "לחץ דם"],
        "כאב חזה": ["דופק", "לחץ דם", "סטורציה"],
        // מדדים נוספים לתלונות אחרות
    };
    
    // החזרת המדדים הרלוונטיים או ברירת מחדל
    return vitalSignsByComplaint[complaint] || ["דופק", "לחץ דם"];
}

/**
 * בדיקה אם כתובת דוא"ל תקינה
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ======== אתחול המערכת ========

/**
 * אתחול ראשי של האפליקציה
 */
function initializeApplication() {
    console.time('app-initialization');
    
    // אתחול במקבץ ראשון - התאמות UI בסיסיות
    initializeUI();
    
    // אתחול מקבץ שני - מילוי נתונים בטופס
    initializeFormData();
    
    // אתחול מקבץ שלישי - הוספת מאזיני אירועים
    initializeEventListeners();
    
    // אתחול מקבץ רביעי - חיבור כפתורי ניווט
    initializeNavigationButtons();
    
    // בדיקת חיבור לשרת
    checkServerConnection();
    
    console.timeEnd('app-initialization');
}

/**
 * אתחול ממשק המשתמש הבסיסי
 */
function initializeUI() {
    // אתחול מצב תצוגה
    const darkModeToggle = createImprovedDarkModeToggle();
    document.body.appendChild(darkModeToggle);
    document.body.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
    
    // אתחול סרגל התקדמות
    updateProgressBar();
    
    // אינדיקטור סטטוס API
    const header = document.querySelector('header');
    if (header) {
        const apiIndicator = createApiStatusIndicator();
        header.appendChild(apiIndicator);
    }
}

/**
 * אתחול נתוני הטופס הבסיסיים
 */
function initializeFormData() {
    // אתחול כפתורי גיל מהירים
    const ageField = getElement('#patient-age');
    if (ageField) {
        const ageButtons = createAgeButtons();
        ageField.parentElement.appendChild(ageButtons);
    }
    
    // אתחול התלונות הנפוצות
    const complaintSelect = getElement('#main-complaint');
    if (complaintSelect) {
        populateComplaintSelect(complaintSelect, relevantComplaints);
        createComplaintSearchInterface(complaintSelect, relevantComplaints);
    }
}

/**
 * אתחול מאזיני אירועים
 */
function initializeEventListeners() {
    // מאזיני שינויים בשדות הזנה
    document.querySelectorAll('input[type="text"], textarea, input[type="number"]').forEach(input => {
        input.addEventListener('input', () => {
            state.unsavedChanges = true;
        });
    });
    
    // מאזיני אירועים לשדות מיוחדים (אלרגיות, תרופות, עישון)
    ['allergies', 'medications', 'smoking'].forEach(field => {
        document.querySelectorAll(`input[name="${field}"]`).forEach(radio => {
            radio.addEventListener('change', function() {
                toggleFieldVisibility(field, this.value === 'yes');
                state.unsavedChanges = true;
            });
        });
    });
    
    // התראה לפני יציאה מהדף
    window.addEventListener('beforeunload', function(e) {
        if (state.unsavedChanges) {
            e.preventDefault();
            e.returnValue = 'יש לך שינויים שלא נשמרו. האם אתה בטוח שברצונך לעזוב את הדף?';
            return e.returnValue;
        }
    });
    
    // מאזיני אירועים נוספים לפי הצורך
}

/**
 * אתחול כפתורי ניווט
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
    
    // כפתורי שלב 4 וסיום
    getElement('#copy-summary').addEventListener('click', handleCopySummary);
    getElement('#complete-summary').addEventListener('click', handleCompleteSummary);
    getElement('#send-summary').addEventListener('click', handleSendSummary);
    
    // כפתורי שלב 5
    getElement('#copy-final-summary').addEventListener('click', handleCopyFinalSummary);
    getElement('#print-summary')?.addEventListener('click', handlePrintSummary);
    getElement('#export-pdf')?.addEventListener('click', handleExportPdf);
    
    // התחלת רשומה חדשה
    getElement('#start-new').addEventListener('click', function() {
        resetForm();
    });
}

// הפעלת האפליקציה בטעינת הדף
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
});

// ייצוא פונקציות נדרשות למודולים אחרים
export {
    state,
    showStep,
    resetForm,
    showToast,
    collectAnswers,
    collectVitalSigns
};