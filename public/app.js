// public/app.js

// מצב הנוכחי של המערכת
const state = {
    currentStep: 1,
    patientRecord: null
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
    
    // עדכון סרגל התקדמות אם קיים
    if (window.FormComponents && window.FormComponents.createProgressBar) {
        updateProgressBar();
    }
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
                    <div class="red-flag-content">${paragraph}</div>
                </div>`;
            } else {
                updatedHtml += paragraph + '\n\n';
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

// אתחול הממשק
document.addEventListener('DOMContentLoaded', function() {
    // הוספת סרגל התקדמות
    const mainContainer = document.querySelector('.container');
    if (mainContainer) {
        const progressBar = document.createElement('div');
        progressBar.id = 'progress-bar-container';
        progressBar.className = 'progress-bar-container';
        mainContainer.insertBefore(progressBar, mainContainer.firstChild);
        updateProgressBar();
    }
    
    // מילוי רשימת התלונות הנפוצות - VERY IMPORTANT
    const complaintSelect = document.getElementById('main-complaint');
    if (!complaintSelect) {
        console.error("לא נמצא אלמנט 'main-complaint' בדף!");
        return;
    }
    
    // רשימת תלונות נפוצות (בגרסה פשוטה בלי תלות בשרת)
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
                timestamp: new Date().toISOString()
            },
            standardAnswers: {},
            dynamicAnswers: {},
            summary: ""
        };
        
        // קבלת שאלות סטנדרטיות לפי התלונה
        // במקום לשלוח בקשה לשרת, נשתמש בשאלות מוגדרות מראש
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
    document.getElementById('next-to-step3').addEventListener('click', function() {
        // איסוף תשובות לשאלות סטנדרטיות
        const standardAnswers = collectAnswers('input[data-standard="true"]');
        
        // שמירת התשובות ברשומת המטופל
        state.patientRecord.standardAnswers = standardAnswers;
        
        // הצגת אנימציית טעינה
        document.getElementById('dynamic-questions-loading').style.display = 'block';
        document.getElementById('dynamic-questions-container').style.display = 'none';
        
        // מעבר לשלב הבא
        showStep(3);
        
        // סימולציית קבלת שאלות דינמיות (במקום בקשה אמיתית לשרת)
        setTimeout(() => {
            const dynamicQuestions = getDynamicQuestions(state.patientRecord.patientInfo.mainComplaint);
            
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
        }, 1500); // סימולציית המתנה של 1.5 שניות
    });
    
    // שלב 3 -> שלב 2
    document.getElementById('back-to-step2').addEventListener('click', function() {
        showStep(2);
    });
    
    // שלב 3 -> שלב 4
    document.getElementById('next-to-step4').addEventListener('click', function() {
        // איסוף תשובות לשאלות דינמיות
        const dynamicAnswers = collectAnswers('input[data-dynamic="true"]');
        
        // שמירת התשובות ברשומת המטופל
        state.patientRecord.dynamicAnswers = dynamicAnswers;
        
        // הצגת אנימציית טעינה
        document.getElementById('summary-loading').style.display = 'block';
        document.getElementById('summary-container').style.display = 'none';
        
        // מעבר לשלב הבא
        showStep(4);
        
        // סימולציית יצירת סיכום אנמנזה (במקום בקשה אמיתית לשרת)
        // סימולציית יצירת סיכום אנמנזה (במקום בקשה אמיתית לשרת)
        setTimeout(() => {
            const summary = generateSummary(state.patientRecord);
            state.patientRecord.summary = summary;
            
            // הצגת הסיכום במסך
            document.getElementById('summary-text').textContent = summary;
            
            // הדגשת דגלים אדומים
            highlightRedFlags();
            
            // הסתרת אנימציית הטעינה והצגת הסיכום
            document.getElementById('summary-loading').style.display = 'none';
            document.getElementById('summary-container').style.display = 'block';
        }, 2000); // סימולציית המתנה של 2 שניות
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
            alert(`הסיכום נשלח בהצלחה לכתובת: ${doctorEmail}`);
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
                    <div class="red-flag-content">${paragraph}</div>
                </div>`;
            } else {
                updatedHtml += paragraph + '\n\n';
            }
        }
        
        // עדכון התצוגה עם ההדגשות
        summaryElement.innerHTML = updatedHtml;
    }
}

// פונקציית עזר להשגת שאלות סטנדרטיות לפי תלונה
function getStandardQuestions(complaint) {
    const standardQuestions = {
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
        "שיעול": [
            "כמה זמן נמשך השיעול?",
            "האם השיעול יבש או עם ליחה?",
            "מה צבע הליחה אם יש?",
            "האם יש קוצר נשימה?",
            "האם היית במגע עם אנשים חולים?"
        ],
        "קוצר נשימה": [
            "מתי התחיל קוצר הנשימה?",
            "האם זה קורה במנוחה או במאמץ?",
            "האם יש כאב בחזה?",
            "האם יש שיעול או ליחה?",
            "האם אתה סובל ממחלת ריאות או לב?"
        ],
        "שבר": [
            "היכן ממוקם הכאב?",
            "האם מרגיש/ה עיוות או עקמומיות באזור?",
            "האם יש נפיחות באזור?",
            "האם יש שינוי צבע (שטף דם)?",
            "האם יש הגבלה בתנועה?",
            "מתי ואיך אירעה הפציעה?"
        ],
        "פציעת ראש": [
            "האם היה אובדן הכרה?",
            "האם יש בחילה או הקאות?",
            "האם יש סחרחורת?",
            "האם יש אי-שקט או בלבול?",
            "האם זרם דם או נוזל שקוף מהאף או האוזניים?",
            "האם יש כאב ראש חזק?",
            "האם יש טשטוש ראייה?"
        ],
        "כוויה": [
            "היכן נמצאת הכוויה?",
            "מה גודל הכוויה (אחוז משטח הגוף)?",
            "כיצד נגרמה הכוויה (חום, כימיקלים, חשמל)?",
            "האם יש שלפוחיות?",
            "האם האזור אדום, לבן או שחור?",
            "האם ננקטו פעולות עזרה ראשונה?"
        ]
    };
    
    // אם יש שאלות מוגדרות לתלונה, החזר אותן
    if (standardQuestions[complaint]) {
        return standardQuestions[complaint];
    }
    
    // אחרת החזר שאלות כלליות
    return [
        "מתי התחילו הסימפטומים?",
        "האם הסימפטומים מחמירים או משתפרים?",
        "האם יש גורמים שמחמירים את המצב?",
        "האם ניסית טיפול כלשהו עד כה?",
        "האם יש רקע רפואי שיכול להיות קשור למצב הנוכחי?"
    ];
}

// פונקציית עזר לקבלת שאלות דינמיות (מדמה תשובה מהשרת)
function getDynamicQuestions(complaint) {
    const dynamicQuestionsMap = {
        "כאב ראש": [
            "האם יש גורמים מחמירים כמו אור או רעש?",
            "האם יש הפרעות ראייה?",
            "האם הכאב ממוקד בצד אחד או בשני הצדדים?",
            "האם היו לך כאבי ראש דומים בעבר?",
            "האם הכאב הופיע בפתאומיות או בהדרגה?"
        ],
        "כאב בטן": [
            "האם הכאב מקרין לאזורים אחרים?",
            "האם יש תיאבון?",
            "האם הכאב משתנה אחרי אכילה?",
            "האם יש גזים או נפיחות?",
            "האם היו אירועים דומים בעבר?"
        ],
        "כאב גרון": [
            "האם יש נקודות לבנות בגרון?",
            "האם יש נפיחות בבלוטות הלימפה בצוואר?",
            "האם הכאב מחמיר בבליעה?",
            "האם היית במגע עם אנשים חולים?",
            "האם יש כאבים באוזניים?"
        ],
        "פציעת ראש": [
            "האם איבדת הכרה אחרי הפגיעה?",
            "האם יש בלבול או טשטוש?",
            "האם אתה זוכר את האירוע שגרם לפציעה?",
            "האם יש רגישות לאור או רעש?",
            "האם ישנת מאז הפציעה ואם כן, היה קושי להעיר אותך?"
        ],
        "שבר": [
            "האם יש דפורמציה באזור הפגוע?",
            "האם יש כאב בתנועה פסיבית (כשמזיזים לך)?",
            "האם ניתן לשאת משקל על האזור הפגוע?",
            "האם היו פגיעות דומות באותו מקום בעבר?",
            "האם יש תחושת נימול או חוסר תחושה מתחת לאזור הפגיעה?"
        ]
    };
    
    // אם יש שאלות ספציפיות לתלונה
    if (dynamicQuestionsMap[complaint]) {
        return dynamicQuestionsMap[complaint];
    }
    
    // שאלות כלליות
    return [
        "האם יש סימפטומים נוספים שלא הזכרת?",
        "האם המצב משפיע על התפקוד היומיומי?",
        "האם ניסית טיפול כלשהו בבית?",
        "האם יש רקע רפואי שעשוי להיות רלוונטי?",
        "האם אתה נוטל תרופות באופן קבוע?"
    ];
}

// פונקציית עזר ליצירת סיכום אנמנזה (מדמה תשובה מהשרת)
function generateSummary(patientRecord) {
    const { age, gender, mainComplaint } = patientRecord.patientInfo;
    const genderText = gender === 'male' ? 'זכר' : 'נקבה';
    
    // איסוף מידע משמעותי מהתשובות
    let duration = "לא ידוע";
    let painLocation = "";
    let severityFactors = [];
    let otherSymptoms = [];
    let treatments = [];
    
    // חיפוש תשובות רלוונטיות
    for (const [question, answer] of Object.entries(patientRecord.standardAnswers)) {
        if (!answer) continue;
        
        if (question.includes("זמן") || question.includes("מתי")) {
            duration = answer;
        } else if (question.includes("היכן") || question.includes("מיקום") || question.includes("איפה")) {
            painLocation = answer;
        } else if (question.includes("מחמיר") || question.includes("מקל")) {
            severityFactors.push(answer);
        } else if (question.includes("סימפטומים") || question.includes("תסמינים")) {
            otherSymptoms.push(answer);
        } else if (question.includes("טיפול") || question.includes("תרופות")) {
            treatments.push(answer);
        }
    }
    
    for (const [question, answer] of Object.entries(patientRecord.dynamicAnswers)) {
        if (!answer) continue;
        
        if (question.includes("זמן") || question.includes("מתי")) {
            duration = answer;
        } else if (question.includes("היכן") || question.includes("מיקום") || question.includes("איפה")) {
            painLocation = answer;
        } else if (question.includes("מחמיר") || question.includes("מקל")) {
            severityFactors.push(answer);
        } else if (question.includes("סימפטומים") || question.includes("תסמינים")) {
            otherSymptoms.push(answer);
        } else if (question.includes("טיפול") || question.includes("תרופות")) {
            treatments.push(answer);
        }
    }
    
    // בדיקה לדגלים אדומים
    const redFlags = checkForRedFlags(patientRecord);
    
    // יצירת הסיכום
    let summary = `מטופל/ת בגיל ${age}, ${genderText}, עם תלונה עיקרית של ${mainComplaint}.\n\n`;
    
    summary += `התלונה החלה ${duration || "לפני זמן לא ידוע"}`;
    if (painLocation) {
        summary += ` ומתמקדת ב${painLocation}`;
    }
    if (severityFactors.length > 0) {
        summary += `. הגורמים המשפיעים על עוצמת התלונה כוללים: ${severityFactors.join(", ")}`;
    }
    summary += ".\n\n";
    
    if (otherSymptoms.length > 0 || treatments.length > 0) {
        summary += "מידע נוסף: ";
        if (otherSymptoms.length > 0) {
            summary += `סימפטומים נלווים - ${otherSymptoms.join(", ")}. `;
        }
        if (treatments.length > 0) {
            summary += `טיפולים שננקטו - ${treatments.join(", ")}. `;
        }
        summary += "\n\n";
    }
    
    if (redFlags.length > 0) {
        summary += `דגלים אדומים: ${redFlags.join("; ")}.`;
    }
    
    return summary;
}

// פונקציית עזר לבדיקת דגלים אדומים
function checkForRedFlags(patientRecord) {
    const redFlags = [];
    const { mainComplaint } = patientRecord.patientInfo;
    
    // פונקציית עזר לבדיקה אם מילת מפתח מופיעה בשאלות ותשובות
    const hasKeyword = (keyword) => {
        for (const [question, answer] of Object.entries({
            ...patientRecord.standardAnswers,
            ...patientRecord.dynamicAnswers
        })) {
            if ((question.toLowerCase().includes(keyword.toLowerCase()) ||
                 answer.toLowerCase().includes(keyword.toLowerCase())) && 
                answer.toLowerCase().includes("כן")) {
                return true;
            }
        }
        return false;
    };
    
    // דגלים אדומים לפי תלונה עיקרית
    if (mainComplaint.includes("כאב ראש")) {
        if (hasKeyword("הקאות")) redFlags.push("הקאות בשילוב עם כאב ראש");
        if (hasKeyword("פתאומי")) redFlags.push("כאב ראש שהופיע בפתאומיות");
        if (hasKeyword("הכרה")) redFlags.push("איבוד הכרה בשילוב עם כאב ראש");
    } 
    else if (mainComplaint.includes("כאב חזה")) {
        if (hasKeyword("קוצר נשימה")) redFlags.push("כאב חזה בשילוב עם קוצר נשימה");
        if (hasKeyword("זיעה")) redFlags.push("כאב חזה בשילוב עם הזעה");
        if (hasKeyword("לחץ")) redFlags.push("תחושת לחץ בחזה");
    }
    else if (mainComplaint.includes("פציעת ראש")) {
        if (hasKeyword("הכרה")) redFlags.push("איבוד הכרה לאחר פציעת ראש");
        if (hasKeyword("הקאות")) redFlags.push("הקאות לאחר פציעת ראש");
        if (hasKeyword("שקוף") || hasKeyword("נוזל") || hasKeyword("אוזניים")) 
            redFlags.push("נוזל שקוף מהאף או האוזניים");
    }
    
    // דגלים אדומים כלליים
    if (hasKeyword("נשימה")) redFlags.push("קשיי נשימה");
    if (hasKeyword("דם") && hasKeyword("הקאות")) redFlags.push("הקאות דמיות");
    
    return redFlags;
}