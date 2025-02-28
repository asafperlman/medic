
// מצב הנוכחי של המערכת
const state = {
    currentStep: 1,
    patientRecord: null
};

// מערכת איסוף נתונים רפואיים - כאן יבוא הקוד שהגדרנו קודם
const MedicalDataSystem = {
    // מאגר תלונות נפוצות
    commonComplaints: [
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
        "אחר"
    ],
    
    // מאגר שאלות סטנדרטיות לפי תלונה עיקרית
    standardQuestions: {
        "כאב גרון": [
            "כמה זמן נמשך הכאב?",
            "האם יש חום?",
            "האם יש קושי בבליעה?",
            "האם יש צרידות?",
            "האם נוטל/ת תרופות כלשהן?"
        ],
        "כאב ראש": [
            "כמה זמן נמשך הכאב?",
            "היכן ממוקם הכאב?",
            "האם יש חום?",
            "האם יש בחילה או הקאות?",
            "האם הכאב מפריע לשינה?"
        ],
        "כאב בטן": [
            "כמה זמן נמשך הכאב?",
            "היכן ממוקם הכאב?",
            "האם יש שינויים ביציאות?",
            "האם יש הקאות?",
            "האם יש חום?"
        ],
        "כאב גב": [
            "כמה זמן נמשך הכאב?",
            "היכן ממוקם הכאב בדיוק?",
            "האם הכאב מקרין לרגליים?",
            "האם יש חולשה או נימול ברגליים?",
            "האם הכאב משתנה עם תנועה או מנוחה?"
        ],
        // ניתן להוסיף תלונות נוספות בהמשך
    },
    
    // פונקציה ליצירת רשומת מטופל חדשה

            
    createPatientRecord: function(age, gender, mainComplaint) {
        return {
            patientInfo: {
                age: age,
                gender: gender,
                mainComplaint: mainComplaint,
                timestamp: new Date().toISOString()
            },
            standardAnswers: {},
            dynamicAnswers: {},
            summary: ""
        };
    },
    
    // פונקציה לקבלת שאלות סטנדרטיות לפי תלונה
    getStandardQuestions: function(complaint) {
        return this.standardQuestions[complaint] || [];
    },
    
    // פונקציה לשמירת תשובות לשאלות סטנדרטיות
    saveStandardAnswers: function(patientRecord, answers) {
        patientRecord.standardAnswers = answers;
        return patientRecord;
    },
    
    // פונקציה לשליחת בקשה לשרת לקבלת שאלות דינמיות (שלב 3)
    getDynamicQuestions: async function(patientRecord) {
        const response = await fetch('/api/dynamic-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientRecord)
        });
        
        if (!response.ok) {
            throw new Error('שגיאה בקבלת שאלות דינמיות');
        }
        
        const data = await response.json();
        return data.questions; // צפוּי מערך של שאלות
    },
    
    // פונקציה לשמירת תשובות לשאלות דינמיות
    saveDynamicAnswers: function(patientRecord, answers) {
        patientRecord.dynamicAnswers = answers;
        return patientRecord;
    },
    
    // פונקציה ליצירת סיכום אנמנזה (שלב 4 - קריאה לשרת)
    generateSummary: async function(patientRecord) {
        const response = await fetch('/api/generate-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientRecord)
        });
        
        if (!response.ok) {
            throw new Error('שגיאה ביצירת סיכום');
        }
        
        const data = await response.json();
        // נניח שהשרת מחזיר אובייקט בצורה { summary: "טקסט הסיכום" }
        // נוסיף אותו לתוך הרשומה עצמה
        patientRecord.summary = data.summary;
        return patientRecord; 
    },
    
    // פונקציה לשליחת הסיכום לרופא/ה (שלב 5)
    sendSummaryToDoctor: async function(patientRecord, doctorEmail) {
        // מדמה שליחת דוא"ל או שמירה במסד נתונים
        return new Promise((resolve) => {
            // מדמה זמן תגובה מהשרת
            setTimeout(() => {
                resolve({
                    success: true,
                    timestamp: new Date().toISOString(),
                    message: `הסיכום נשלח בהצלחה לרופא/ה ${doctorEmail}`
                });
            }, 1000); // שנייה אחת לדמות זמן תגובה
        });
    }
};

// פונקציות עזר לממשק המשתמש

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
}

// פונקציה ליצירת אלמנט שאלה במסך
function createQuestionElement(question, index, isStandard = true) {
    const listItem = document.createElement('li');
    listItem.className = 'question-item';
    
    const questionText = document.createElement('div');
    questionText.textContent = question;
    listItem.appendChild(questionText);
    
    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.className = 'answer-input';
    answerInput.placeholder = 'הזן תשובה...';
    answerInput.dataset.question = question;
    answerInput.dataset.index = index;
    
    // אם זו שאלה סטנדרטית, נוסיף כיתוב data-standard
    if (isStandard) {
        answerInput.dataset.standard = 'true';
    } else {
        answerInput.dataset.dynamic = 'true';
    }
    
    listItem.appendChild(answerInput);
    
    return listItem;
}

// פונקציה לאיסוף תשובות מהטופס
function collectAnswers(selector) {
    const answers = {};
    document.querySelectorAll(selector).forEach(input => {
        if (input.value.trim() !== '') {
            answers[input.dataset.question] = input.value.trim();
        }
    });
    return answers;
}

// אתחול הממשק
document.addEventListener('DOMContentLoaded', function() {
    // מילוי רשימת התלונות הנפוצות
    const complaintSelect = document.getElementById('main-complaint');
    MedicalDataSystem.commonComplaints.forEach(complaint => {
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
    
    // כפתורי ניווט בין השלבים
    
    // שלב 1 -> שלב 2
    document.getElementById('next-to-step2').addEventListener('click', function() {
        // וידוא שכל השדות מולאו
        const age = document.getElementById('patient-age').value;
        const genderRadios = document.querySelectorAll('input[name="gender"]');
        let gender;
        genderRadios.forEach(radio => {
            if (radio.checked) gender = radio.value;
        });
        const mainComplaintSelect = document.getElementById('main-complaint');
        let mainComplaint = mainComplaintSelect.value;
        
        // בדיקת תקינות הנתונים
        if (!age || age < 0 || age > 120) {
            alert('יש להזין גיל תקין (0-120)');
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
        state.patientRecord = MedicalDataSystem.createPatientRecord(
            parseInt(age),
            gender,
            mainComplaint
        );
        
        // קבלת שאלות סטנדרטיות לפי התלונה
        const standardQuestions = MedicalDataSystem.getStandardQuestions(mainComplaint);
        
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
                const questionElement = createQuestionElement(question, index);
                questionsList.appendChild(questionElement);
            });
        }
        
        // מעבר לשלב הבא
        showStep(2);
    });
    
    // שלב 2 -> שלב 1
    document.getElementById('back-to-step1').addEventListener('click', function() {
        showStep(1);
    });
    
    // שלב 2 -> שלב 3
    document.getElementById('next-to-step3').addEventListener('click', async function() {
        // איסוף תשובות לשאלות סטנדרטיות
        const standardAnswers = collectAnswers('input[data-standard="true"]');
        
        // שמירת התשובות ברשומת המטופל
        state.patientRecord = MedicalDataSystem.saveStandardAnswers(
            state.patientRecord, 
            standardAnswers
        );
        
        // הצגת אנימציית טעינה
        document.getElementById('dynamic-questions-loading').style.display = 'block';
        document.getElementById('dynamic-questions-container').style.display = 'none';
        
        // מעבר לשלב הבא
        showStep(3);
        
        try {
            // קבלת שאלות דינמיות מה-LLM (שרת)
            const dynamicQuestions = await MedicalDataSystem.getDynamicQuestions(state.patientRecord);
            
            // יצירת אלמנטי שאלות במסך
            const questionsList = document.getElementById('dynamic-questions-list');
            questionsList.innerHTML = '';
            
            dynamicQuestions.forEach((question, index) => {
                const questionElement = createQuestionElement(question, index, false);
                questionsList.appendChild(questionElement);
            });
            
            // הסתרת אנימציית הטעינה והצגת השאלות
            document.getElementById('dynamic-questions-loading').style.display = 'none';
            document.getElementById('dynamic-questions-container').style.display = 'block';
        } catch (error) {
            console.error('שגיאה בקבלת שאלות דינמיות:', error);
            alert('אירעה שגיאה בקבלת שאלות נוספות. נא לנסות שוב.');
            showStep(2);
        }
    });
    
    // שלב 3 -> שלב 2
    document.getElementById('back-to-step2').addEventListener('click', function() {
        showStep(2);
    });
    
    // שלב 3 -> שלב 4
    document.getElementById('next-to-step4').addEventListener('click', async function() {
        // איסוף תשובות לשאלות דינמיות
        const dynamicAnswers = collectAnswers('input[data-dynamic="true"]');
        
        // שמירת התשובות ברשומת המטופל
        state.patientRecord = MedicalDataSystem.saveDynamicAnswers(
            state.patientRecord, 
            dynamicAnswers
        );
        
        // הצגת אנימציית טעינה
        document.getElementById('summary-loading').style.display = 'block';
        document.getElementById('summary-container').style.display = 'none';
        
        // מעבר לשלב הבא
        showStep(4);
        
        try {
            // יצירת סיכום אנמנזה (מהשרת)
            state.patientRecord = await MedicalDataSystem.generateSummary(state.patientRecord);
            
            // הצגת הסיכום במסך
            document.getElementById('summary-text').textContent = state.patientRecord.summary;
            
            // הסתרת אנימציית הטעינה והצגת הסיכום
            document.getElementById('summary-loading').style.display = 'none';
            document.getElementById('summary-container').style.display = 'block';
        } catch (error) {
            console.error('שגיאה ביצירת סיכום:', error);
            alert('אירעה שגיאה ביצירת הסיכום. נא לנסות שוב.');
            showStep(3);
        }
    });
    
    // שלב 4 -> שלב 3
    document.getElementById('back-to-step3').addEventListener('click', function() {
        showStep(3);
    });
    
    // שלב 4 -> שלב 5
    document.getElementById('send-summary').addEventListener('click', async function() {
        // בדיקת תקינות כתובת דוא"ל
        const doctorEmail = document.getElementById('doctor-email').value.trim();
        
        if (!doctorEmail) {
            alert('יש להזין כתובת דוא"ל של הרופא/ה');
            return;
        }
        
        // אימות פשוט של פורמט דוא"ל
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(doctorEmail)) {
            alert('יש להזין כתובת דוא"ל תקינה');
            return;
        }
        
        try {
            // שליחת הסיכום לרופא/ה
            await MedicalDataSystem.sendSummaryToDoctor(state.patientRecord, doctorEmail);
            
            // הצגת הסיכום הסופי
            document.getElementById('final-summary-text').textContent = state.patientRecord.summary;
            
            // מעבר לשלב האחרון
            showStep(5);
        } catch (error) {
            console.error('שגיאה בשליחת הסיכום:', error);
            alert('אירעה שגיאה בשליחת הסיכום. נא לנסות שוב.');
        }
    });
    
    // התחלת רשומה חדשה
    document.getElementById('start-new').addEventListener('click', function() {
        // איפוס הטופס
        document.getElementById('patient-age').value = '';
        document.querySelectorAll('input[name="gender"]')[0].checked = true;
        document.getElementById('main-complaint').selectedIndex = 0;
        document.getElementById('other-complaint').value = '';
        document.getElementById('other-complaint-container').style.display = 'none';
        document.getElementById('doctor-email').value = '';
        
        // איפוס המצב
        state.patientRecord = null;
        
        // חזרה לשלב הראשון
        showStep(1);
    });
});

/**
 * פונקציות שיפור חווית משתמש
 */

// מעבר בין מצב רגיל למצב לילה
function toggleDarkMode() {
    const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
    localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');
    
    // עדכון הכפתור
    const darkModeButton = document.getElementById('dark-mode-toggle');
    if (darkModeButton) {
      darkModeButton.innerHTML = isDarkMode ? 
        '<i class="fas fa-moon"></i> מצב לילה' : 
        '<i class="fas fa-sun"></i> מצב יום';
    }
  }
  
  // עדכון תצוגה מקדימה של האנמנזה בזמן אמת
  function updateLivePreview() {
    if (!state.patientRecord) return;
    
    const livePreviewContainer = document.getElementById('live-preview-container');
    if (!livePreviewContainer) return;
    
    const additionalInfo = {
      profile: document.getElementById('profile-number')?.value || '97',
      section: document.getElementById('profile-section')?.value || 'משקפיים',
      allergies: document.getElementById('allergies')?.value || 'ללא אלרגיות ידועות',
      medications: document.getElementById('medications')?.value || 'לא נוטל תרופות באופן קבוע'
    };
    
    livePreviewContainer.innerHTML = FormComponents.createLivePreview(state.patientRecord, additionalInfo);
  }
  
  // עדכון סרגל התקדמות
  function updateProgressBar() {
    const progressContainer = document.getElementById('progress-bar-container');
    if (!progressContainer) return;
    
    progressContainer.innerHTML = FormComponents.createProgressBar(state.currentStep, 4);
  }
  
  // הוספת מאזיני אירועים לתמיכה בתצוגה מקדימה בזמן אמת
  function setupLivePreviewListeners() {
    // מאזיני אירועים לשדות פרופיל
    const profileFields = ['profile-number', 'profile-section', 'allergies', 'medications'];
    profileFields.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', updateLivePreview);
      }
    });
    
    // מאזיני אירועים לשאלות סטנדרטיות ודינמיות
    document.addEventListener('input', function(event) {
      if (event.target.matches('input[data-standard="true"]') || 
          event.target.matches('input[data-dynamic="true"]')) {
        // עדכון מידי של המידע ברשומת המטופל
        if (state.patientRecord) {
          if (event.target.dataset.standard === 'true') {
            state.patientRecord.standardAnswers[event.target.dataset.question] = event.target.value;
          } else if (event.target.dataset.dynamic === 'true') {
            state.patientRecord.dynamicAnswers[event.target.dataset.question] = event.target.value;
          }
          
          // עדכון התצוגה המקדימה
          updateLivePreview();
        }
      }
    });
  }
  
  // הוספת קוד אתחול לאחר טעינת ה-DOM
  document.addEventListener('DOMContentLoaded', function() {
    // הערה: אל תשכח לשלב את הקוד הזה עם האירועים הקיימים
    // אם יש כבר מאזין DOMContentLoaded, הוסף את הקוד הבא בתוכו
    
    // הוספת סרגל התקדמות
    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
      const progressBar = document.createElement('div');
      progressBar.id = 'progress-bar-container';
      progressBar.className = 'progress-bar-container';
      mainContainer.insertBefore(progressBar, mainContainer.firstChild);
      updateProgressBar();
    }
    
    // הוספת כפתור מצב לילה
    const headerElement = document.querySelector('header');
    if (headerElement) {
      const darkModeButton = document.createElement('button');
      darkModeButton.id = 'dark-mode-toggle';
      darkModeButton.className = 'dark-mode-toggle';
      darkModeButton.innerHTML = '<i class="fas fa-moon"></i> מצב לילה';
      darkModeButton.onclick = toggleDarkMode;
      headerElement.appendChild(darkModeButton);
      
      // הגדרת מצב ראשוני לפי העדפת המשתמש
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'dark') {
          darkModeButton.innerHTML = '<i class="fas fa-sun"></i> מצב יום';
        }
      }
    }
    
    // הוספת תצוגה מקדימה לשלב האנמנזה
    const summaryContainer = document.getElementById('summary-container');
    if (summaryContainer) {
      const livePreview = document.createElement('div');
      livePreview.id = 'live-preview-container';
      summaryContainer.appendChild(livePreview);
    }
    
    // הגדרת מאזיני אירועים לתצוגה מקדימה
    setupLivePreviewListeners();
    
    // עדכון פונקציות המעבר בין שלבים כדי לעדכן את סרגל ההתקדמות
    const originalShowStep = window.showStep || function() {};
    window.showStep = function(stepNumber) {
      originalShowStep(stepNumber);
      state.currentStep = stepNumber;
      updateProgressBar();
    };
  });

