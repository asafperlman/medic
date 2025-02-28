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
    
    // כפתורי ניווט בין השלבים
    
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
                medications: takesMedications ? medicationsDetails : "לא נוטל תרופות באופן קבוע"
            },
            standardAnswers: {},
            dynamicAnswers: {},
            summary: ""
        };
        
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
            const dynamicQuestions = getDynamicQuestions(state.patientRecord.patientInfo.mainComplaint, standardAnswers);
            
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
    // מיפוי שאלות מפורטות יותר לפי סוג התלונה
    const standardQuestions = {
        "כאב גרון": [
            "כמה זמן נמשך הכאב בגרון?",
            "האם יש חום? אם כן, מה גובהו ומתי נמדד לאחרונה?",
            "האם יש קושי בבליעה? באיזו רמה (קל/בינוני/חמור)?",
            "האם יש צרידות או שינוי בקול?",
            "האם יש נזלת או שיעול המלווים את כאב הגרון?",
            "האם יש נפיחות בצוואר או בבלוטות הלימפה?",
            "האם יש נקודות לבנות או אדומות בגרון?",
            "האם היו אירועים דומים בעבר?",
            "האם היית במגע עם אנשים חולים לאחרונה?"
        ],
        "כאב ראש": [
            "כמה זמן נמשך כאב הראש?",
            "היכן ממוקם הכאב (מצח, רקות, עורף, חד צדדי, דו-צדדי)?",
            "כיצד התחיל הכאב (בהדרגה או בפתאומיות)?",
            "כיצד היית מתאר את אופי הכאב (לוחץ, פועם, דוקר)?",
            "האם יש חום או חולשה כללית?",
            "האם יש רגישות לאור, רעש או ריחות?",
            "האם יש בחילה או הקאות המלוות את הכאב?",
            "האם הכאב מחמיר בפעילות מסוימת (תנועה, שינוי תנוחה)?",
            "האם לקחת משככי כאבים? אם כן, איזה והאם הוקל?"
        ],
        "כאב בטן": [
            "כמה זמן נמשך כאב הבטן?",
            "היכן ממוקם הכאב (באיזה חלק מהבטן)?",
            "האם הכאב קבוע או מתפרץ בהתקפים?",
            "האם הכאב מקרין לאזורים אחרים בגוף?",
            "האם יש שינויים ביציאות (שלשול, עצירות, יציאות דמיות)?",
            "האם יש בחילות, הקאות או חוסר תיאבון?",
            "האם יש חום או צמרמורות?",
            "האם כאב הבטן משתנה לאחר אכילה או יציאה?",
            "האם יש גזים, נפיחות או שיהוקים מרובים?"
        ],
        "כאב גב": [
            "כמה זמן נמשך כאב הגב?",
            "היכן ממוקם הכאב (גב עליון, אמצעי, תחתון)?",
            "האם הכאב התחיל בפתאומיות או בהדרגה?",
            "האם קדמה לכאב חבלה או פעילות מאומצת?",
            "האם הכאב מקרין לרגליים או לאזורים אחרים בגוף?",
            "האם יש תחושות נימול או חולשה ברגליים?",
            "האם הכאב משתנה בתנועה, שכיבה או ישיבה?",
            "האם יש קושי בהליכה או תנועה בשל הכאב?",
            "האם לקחת תרופות לשיכוך כאבים? איזה ובאיזו מידה הן עוזרות?"
        ],
        "שיעול": [
            "כמה זמן נמשך השיעול?",
            "האם השיעול יבש או עם ליחה?",
            "אם יש ליחה, מה צבעה (שקופה, צהובה, ירוקה, דמית)?",
            "האם השיעול חמור יותר בזמנים מסוימים ביום או בתנאים מסוימים?",
            "האם יש קוצר נשימה או צפצופים?",
            "האם יש כאב חזה בזמן השיעול?",
            "האם יש חום או צמרמורות?",
            "האם יש נזלת או כאב גרון המלווים את השיעול?",
            "האם היית חשוף לאנשים עם שיעול או נזלת לאחרונה?"
        ],
        "קוצר נשימה": [
            "מתי התחיל קוצר הנשימה?",
            "האם קוצר הנשימה הופיע בפתאומיות או בהדרגה?",
            "האם זה קורה במנוחה, במאמץ קל או רק במאמץ משמעותי?",
            "האם יש כאב בחזה המלווה את קוצר הנשימה?",
            "האם אתה מרגיש דפיקות לב מהירות או חריגות?",
            "האם יש שיעול או ליחה? אם כן, מה צבעה?",
            "האם יש נפיחות ברגליים?",
            "האם יש לך רקע של מחלות לב או ריאה?",
            "האם אתה מעשן או נחשפת לעשן או זיהום אוויר לאחרונה?"
        ],
        "פציעת ראש": [
            "כיצד אירעה הפציעה בראש?",
            "האם היה אובדן הכרה? אם כן, לכמה זמן?",
            "האם יש כאב ראש? מה עוצמתו ומיקומו?",
            "האם יש בחילה או הקאות?",
            "האם יש סחרחורת או בעיות בשיווי משקל?",
            "האם הרגשת בלבול, חוסר התמצאות או אובדן זיכרון?",
            "האם יש טשטוש ראייה או רגישות לאור?",
            "האם זרם דם או נוזל שקוף מהאף או האוזניים?",
            "האם ישנת מאז הפציעה, ואם כן, האם היה קושי להעיר אותך?"
        ],
        "שבר": [
            "היכן ממוקם השבר החשוד?",
            "כיצד אירעה הפציעה?",
            "האם יש עיוות נראה לעין או שינוי צורה באזור הפגוע?",
            "מה עוצמת הכאב (בסולם 1-10)?",
            "האם יש נפיחות, אודם או שטף דם באזור?",
            "האם יש הגבלה בתנועה באזור הפגיעה?",
            "האם יכול/ה לשאת משקל על האזור הפגוע (אם מדובר בגפה תחתונה)?",
            "האם שמעת קול נקישה או חריקה בזמן הפגיעה?",
            "האם יש שינוי בצבע או בטמפרטורה של האזור הפגוע?"
        ],
        "כוויה": [
            "מה גרם לכוויה (חום יבש, נוזל חם, כימיקלים, חשמל)?",
            "מתי התרחשה הכוויה?",
            "באיזה אזור בגוף הכוויה וכמה שטח מכוסה?",
            "מה עומק הכוויה (אדמומיות בלבד, שלפוחיות, פגיעה עמוקה)?",
            "האם הכוויה פוגעת בפנים, ידיים, רגליים, מפרקים או אברי מין?",
            "האם ננקטו פעולות עזרה ראשונה? אם כן, אילו?",
            "האם יש כאב? מה עוצמתו?",
            "האם יש סימנים של זיהום (מוגלה, ריח רע, נפיחות מתגברת)?",
            "האם חוסנת נגד טטנוס בחמש השנים האחרונות?"
        ]
    };
    
    // אם יש שאלות מוגדרות לתלונה, החזר אותן
    if (standardQuestions[complaint]) {
        return standardQuestions[complaint];
    }
    
    // אחרת החזר שאלות כלליות מפורטות
    return [
        "מתי התחילו הסימפטומים בדיוק (תאריך ושעה אם זכור)?",
        "האם הסימפטומים הופיעו בפתאומיות או התפתחו בהדרגה?",
        "מה עוצמת הסימפטומים בסולם של 1-10?",
        "האם הסימפטומים משתנים במהלך היום או קבועים?",
        "האם יש גורמים מסוימים שמחמירים את המצב (תנועה, אוכל, מאמץ)?",
        "האם יש גורמים שמקלים על הסימפטומים?",
        "האם יש סימפטומים נוספים מלבד התלונה העיקרית?",
        "האם ניסית טיפול כלשהו עד כה? אם כן, מה והאם זה עזר?",
        "האם יש רקע רפואי שיכול להיות קשור למצב הנוכחי?"
    ];
}

// פונקציית עזר לקבלת שאלות דינמיות בהתאם לתשובות הקודמות
function getDynamicQuestions(complaint, previousAnswers) {
    // ניתוח התשובות הקודמות לזיהוי סימפטומים ייחודיים
    let hasSymptom = (keyword) => {
        return Object.values(previousAnswers).some(answer => 
            answer.toLowerCase().includes(keyword.toLowerCase()) &&
            answer.toLowerCase().includes('כן'));
    };
    
    // מיפוי שאלות המשך מותאמות לפי סוג התלונה ותשובות קודמות
    const dynamicQuestionsMap = {
        "כאב ראש": [
            "האם יש הפרעות ראייה כמו טשטוש או כפל ראייה?",
            "האם הכאב מתגבר בשכיבה או התכופפות?",
            "האם יש תחושה של לחץ מאחורי העיניים?",
            "האם זהו כאב ראש חזק יותר מכאבים קודמים?",
            hasSymptom('הקאות') ? "האם ההקאות התגברו בשעות האחרונות?" : "האם יש רגישות יתר לריחות במהלך הכאב?",
            hasSymptom('אור') ? "האם הרגישות לאור מופיעה רק בזמן הכאב או גם לפני?" : "האם יש רגישות לאור או רעש?",
            hasSymptom('דופק') ? "האם אתה חש דופק בראש יחד עם הכאב?" : "האם יש תחושת דפיקות בראש?",
            "האם יש תסמינים שמופיעים לפני התחלת הכאב (אאורה)?",
            "האם הכאב החל אחרי פעילות פיזית מאומצת או שינוי בתרופות?"
        ],
        "כאב בטן": [
            "האם אכלת משהו חדש או חריג לאחרונה?",
            "האם יש תחושת ׳מלאות׳ או כבדות בבטן?",
            "האם הכאב מפריע לשינה?",
            hasSymptom('שלשול') ? "כמה יציאות יש ביום וכיצד הן נראות?" : "האם יש שינוי בתדירות או בצורת היציאות?",
            hasSymptom('דם') ? "האם ראית דם ביציאות או בהקאות?" : "האם הבחנת בדם ביציאות או שהיציאות כהות באופן חריג?",
            hasSymptom('הקאות') ? "האם ההקאות מכילות מזון שאכלת לאחרונה או נוזל אחר?" : "האם יש בחילות או הקאות?",
            hasSymptom('חום') ? "מה גובה החום וכמה זמן הוא נמשך?" : "האם יש חום או צמרמורות?",
            "האם הכאב מקרין לגב, לכתף או למקומות אחרים?",
            "האם יש תחושת בטן נפוחה או גזים מרובים?"
        ],
        "כאב גרון": [
            "האם אתה מרגיש גוש או נפיחות בגרון?",
            "האם הקושי בבליעה מתייחס לנוזלים, מוצקים או שניהם?",
            "האם יש שינוי בטעם או ריח?",
            hasSymptom('חום') ? "האם החום נמשך יותר מ-3 ימים?" : "האם יש תחושת חמימות או חום?",
            hasSymptom('נקודות') ? "האם הנקודות הלבנות בגרון גדלות או משתנות?" : "האם הבחנת בנקודות לבנות או כתמים בגרון?",
            hasSymptom('בלוטות') ? "האם הבלוטות הנפוחות רגישות למגע?" : "האם יש נפיחות בבלוטות הצוואר?",
            hasSymptom('קשיי נשימה') ? "האם קשיי הנשימה גוברים בשכיבה?" : "האם יש קושי בנשימה או שריקות בעת נשימה?",
            "האם כאב הגרון הוא בצד אחד או בשני הצדדים?",
            "האם הדיבור כואב או משתנה (צרידות, קושי בדיבור)?"
        ],
        "פציעת ראש": [
            "האם אתה זוכר את האירוע שגרם לפציעה בבירור?",
            "האם יש אזורים רכים או נפוחים בראש?",
            "האם יש שינויים בהתנהגות או במצב הרוח מאז הפגיעה?",
            hasSymptom('הכרה') ? "למשך כמה זמן הייתה אובדן ההכרה?" : "האם היו אירועים של בלבול או חוסר זיכרון?",
            hasSymptom('הקאות') ? "האם ההקאות חוזרות או הן היו חד פעמיות?" : "האם יש בחילות או הקאות?",
            hasSymptom('ראייה') ? "האם שינויי הראייה משתפרים או מחמירים?" : "האם יש שינויים בראייה או רגישות לאור?",
            hasSymptom('סחרחורת') ? "האם הסחרחורת משתנה בתנוחות שונות או קבועה?" : "האם יש סחרחורת או בעיות בשיווי משקל?",
            "האם יש רעשים או צלצולים באוזניים מאז הפגיעה?",
            "האם הצלחת להירדם לאחר הפגיעה ואם כן, האם היה קושי להתעורר?"
        ],
        "שבר": [
            "האם יש בשבר החשוד חדירה של העצם דרך העור?",
            "האם יכול/ה להזיז את האצבעות/כף הרגל מתחת לאזור הפגוע?",
            "האם יש סימנים של פגיעה בכלי דם (חיוורון, קור, דופק חלש)?",
            hasSymptom('נפיחות') ? "האם הנפיחות גוברת או יציבה?" : "האם יש נפיחות באזור?",
            hasSymptom('דפורמציה') ? "האם העיוות באזור השבר בולט או מוסתר?" : "האם יש עיוות נראה לעין באזור?",
            hasSymptom('תנועה') ? "האם התנועה באזור הפגוע גורמת לכאב חד?" : "האם יש הגבלה בתנועה?",
            hasSymptom('כאב') ? "האם הכאב משתנה או קבוע בעוצמתו?" : "מה עוצמת הכאב בסולם 1-10?",
            "האם ניסית לקבע את האזור הפגוע? אם כן, כיצד?",
            "האם יש תחושת נימול או חוסר תחושה מתחת לאזור הפגיעה?"
        ]
    };
    
    // אם יש שאלות ספציפיות לתלונה
    if (dynamicQuestionsMap[complaint]) {
        return dynamicQuestionsMap[complaint];
    }
    
    // שאלות המשך כלליות משופרות
    return [
        "האם יש שינויים ברמת האנרגיה או העייפות שלך לאחרונה?",
        "האם יש שינויים בהרגלי האכילה או השתייה שלך?",
        "האם יש שינויים בהרגלי השינה שלך לאחרונה?",
        "האם חווית מצבים דומים בעבר? אם כן, כיצד טופלו?",
        "האם יש גורמים סביבתיים שעשויים להשפיע על מצבך (חשיפה לחומרים, אלרגנים)?",
        "האם חל שינוי במשקל שלך לאחרונה ללא סיבה ברורה?",
        "האם יש לך מחלות כרוניות שיכולות להיות קשורות למצב הנוכחי?",
        "האם היו שינויים בתרופות שאתה נוטל לאחרונה?",
        "האם יש משהו נוסף שחשוב שנדע על מצבך הבריאותי?"
    ];
}

// פונקציית עזר ליצירת סיכום אנמנזה משופר
function generateSummary(patientRecord) {
    try {
        // חילוץ מידע בסיסי
        const { age, gender, mainComplaint, profile, medicalSections, allergies, medications } = patientRecord.patientInfo;
        const genderText = gender === 'male' ? 'זכר' : 'נקבה';
        
        // פתיחת האנמנזה עם פרטי הפרופיל הרפואי
        let summary = `פרופיל ${profile}, ${medicalSections}, ${allergies}, ${medications}.\n\n`;
        
        // תיאור דמוגרפי ותלונה עיקרית
        summary += `מטופל/ת בגיל ${age}, ${genderText}, מתלונן/ת על ${mainComplaint} `;
        
        // איסוף מידע משמעותי מהתשובות
        let duration = "";
        let painLocation = "";
        let painCharacteristics = [];
        let associatedSymptoms = [];
        let aggravatingFactors = [];
        let relievingFactors = [];
        let treatments = [];
        
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
                painLocation = answer;
            }
            else if (question.includes("אופי") || question.includes("מתאר") || question.includes("סוג")) {
                painCharacteristics.push(answer);
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
                associatedSymptoms.push(`${question.replace('?', '')}: ${answer}`);
            }
            else if (question.includes("טיפול") || question.includes("תרופות") || question.includes("לקחת")) {
                treatments.push(`${question.replace('?', '')}: ${answer}`);
            }
        }
        
        // בניית משפט משמעותי על התלונה העיקרית
        if (duration) {
            summary += `המתחיל/ה לפני ${duration}`;
        }
        
        if (painLocation) {
            summary += ` ומתמקם ב${painLocation}`;
        }
        
        if (painCharacteristics.length > 0) {
            summary += `. הכאב מתואר כ${painCharacteristics.join(", ")}`;
        }
        
        summary += '. ';
        
        // הוספת גורמים מחמירים ומקלים
        if (aggravatingFactors.length > 0 || relievingFactors.length > 0) {
            if (aggravatingFactors.length > 0) {
                summary += `גורמים המחמירים את המצב: ${aggravatingFactors.join(", ")}. `;
            }
            
            if (relievingFactors.length > 0) {
                summary += `גורמים המקלים על המצב: ${relievingFactors.join(", ")}. `;
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
        
        // בדיקה לדגלים אדומים
        const redFlags = checkForRedFlags(patientRecord);
        
        if (redFlags.length > 0) {
            summary += `דגלים אדומים: ${redFlags.join("; ")}.`;
        }
        
        return summary;
    } catch (error) {
        console.error("שגיאה ביצירת סיכום:", error);
        
        // אם יש שגיאה, יצירת סיכום בסיסי
        const { age, gender, mainComplaint, profile, medicalSections, allergies, medications } = patientRecord.patientInfo;
        const genderText = gender === 'male' ? 'זכר' : 'נקבה';
        
        return `פרופיל ${profile}, ${medicalSections}, ${allergies}, ${medications}.\n\nמטופל/ת בגיל ${age}, ${genderText}, עם תלונה עיקרית של ${mainComplaint}.\n\nלא ניתן היה ליצור סיכום מפורט עקב בעיה טכנית.`;
    }
}

// פונקציית בדיקת דגלים אדומים
function checkForRedFlags(patientRecord) {
    const redFlags = [];
    const { mainComplaint } = patientRecord.patientInfo;
    const allAnswers = { ...patientRecord.standardAnswers, ...patientRecord.dynamicAnswers };
    
    // פונקציית עזר משופרת לבדיקת תשובות
    const containsKeyword = (keywords, positiveTerms = ['כן', 'חיובי', 'נכון']) => {
        if (!Array.isArray(keywords)) keywords = [keywords];
        
        for (const [question, answer] of Object.entries(allAnswers)) {
            if (!answer) continue;
            
            // בדיקה אם השאלה או התשובה מכילות את אחת ממילות המפתח
            const questionOrAnswerContainsKeyword = keywords.some(keyword => 
                question.toLowerCase().includes(keyword.toLowerCase()) || 
                answer.toLowerCase().includes(keyword.toLowerCase())
            );
            
            // בדיקה אם התשובה חיובית
            const isPositiveResponse = positiveTerms.some(term => 
                answer.toLowerCase().includes(term.toLowerCase())
            ) || !['לא', 'שלילי', 'אין'].some(term => 
                answer.toLowerCase().includes(term.toLowerCase())
            );
            
            if (questionOrAnswerContainsKeyword && isPositiveResponse) {
                return true;
            }
        }
        return false;
    };
    
    // בדיקות ספציפיות לתלונות שונות לפי מדריך הטיפול הרפואי
    
    // כאב ראש - דגלים אדומים
    if (mainComplaint.includes("כאב ראש")) {
        if (containsKeyword(["הופעה פתאומית", "פתאומי", "חד"])) 
            redFlags.push("כאב ראש שהופיע בפתאומיות - יש לשקול הערכה נוירולוגית");
        
        if (containsKeyword(["הקאות", "בחילות"]) && containsKeyword(["מרובות", "חוזרות"]))
            redFlags.push("הקאות בשילוב עם כאב ראש");
        
        if (containsKeyword(["חמור", "חזק ביותר", "הכי גרוע"]))
            redFlags.push("כאב ראש בעוצמה גבוהה מאוד");
        
        if (containsKeyword(["הפרעות ראייה", "טשטוש", "כפל ראייה"]))
            redFlags.push("הפרעות ראייה המלוות כאב ראש");
        
        if (containsKeyword(["נימול", "חולשה בגפיים"]))
            redFlags.push("תסמינים נוירולוגיים המלווים כאב ראש");
        
        if (containsKeyword(["מעיר משינה", "מתעורר בגלל הכאב"]))
            redFlags.push("כאב ראש המעיר משינה");
    }
    
    // כאב חזה - דגלים אדומים
    else if (mainComplaint.includes("כאב חזה")) {
        if (containsKeyword(["קוצר נשימה", "קשיי נשימה"]))
            redFlags.push("כאב חזה בשילוב עם קוצר נשימה - יש לשלול מצב לבבי או ריאתי חריף");
        
        if (containsKeyword(["זיעה", "הזעה", "זיעה קרה"]))
            redFlags.push("כאב חזה בשילוב עם הזעה");
        
        if (containsKeyword(["לחץ", "מועקה", "כבדות"]))
            redFlags.push("תחושת לחץ או מועקה בחזה");
        
        if (containsKeyword(["הקרנה", "מקרין", "פשט", "התפשט"], ["ליד", "לזרוע", "לכתף", "ללסת"]))
            redFlags.push("כאב חזה המקרין לזרוע, כתף או לסת");
        
        if (containsKeyword(["בחילה", "סחרחורת"]) && containsKeyword(["חזה"]))
            redFlags.push("כאב חזה המלווה בבחילה או סחרחורת");
    }
    
    // פציעת ראש - דגלים אדומים
    else if (mainComplaint.includes("פציעת ראש")) {
        if (containsKeyword(["איבוד הכרה", "התעלפות", "איבד הכרה"]))
            redFlags.push("איבוד הכרה לאחר פציעת ראש");
        
        if (containsKeyword(["הקאות", "בחילות"]) && containsKeyword(["חוזרות", "מרובות"]))
            redFlags.push("הקאות חוזרות לאחר פציעת ראש");
        
        if (containsKeyword(["בלבול", "חוסר התמצאות", "חוסר זיכרון"]))
            redFlags.push("בלבול או חוסר התמצאות לאחר פציעת ראש");
        
        if (containsKeyword(["נוזל", "דימום"]) && containsKeyword(["אוזניים", "אף", "פה"]))
            redFlags.push("נוזל או דימום מהאוזניים או האף");
        
        if (containsKeyword(["אישונים לא שווים", "תגובת אישונים"]))
            redFlags.push("אישונים לא שווים או תגובה לא תקינה לאור");
        
        if (containsKeyword(["קושי להעיר", "שינה עמוקה"]))
            redFlags.push("קושי להעיר את המטופל לאחר פציעת ראש");
    }
    
    // כאב בטן - דגלים אדומים
    else if (mainComplaint.includes("כאב בטן")) {
        if (containsKeyword(["דם", "דמי"]) && (containsKeyword(["צואה", "יציאות"]) || containsKeyword(["הקאה", "הקאות"])))
            redFlags.push("דם בצואה או בהקאות");
        
        if (containsKeyword(["כאב חזק", "כאב חמור"]) && containsKeyword(["ימין תחתונה", "צד ימין למטה"]))
            redFlags.push("כאב חזק בבטן ימין תחתונה - יש לשלול אפנדיציט");
        
        if (containsKeyword(["קושי במתן שתן", "כאב במתן שתן"]) && containsKeyword(["בטן"]))
            redFlags.push("כאב בטן המלווה בבעיות במתן שתן");
        
        if (containsKeyword(["בטן קשה", "בטן מתוחה", "נוקשות"]))
            redFlags.push("בטן קשה או מתוחה - יש לשלול מצב כירורגי חריף");
        
        if (containsKeyword(["חום"]) && containsKeyword(["בטן"]))
            redFlags.push("כאב בטן המלווה בחום - יש לשלול זיהום חמור");
    }
    
    // שבר - דגלים אדומים
    else if (mainComplaint.includes("שבר")) {
        if (containsKeyword(["עצם חודרת", "עצם בולטת", "חדירה של העצם"]))
            redFlags.push("שבר פתוח - עצם חודרת דרך העור");
        
        if (containsKeyword(["חוסר תחושה", "נימול", "חוסר יכולת להזיז"]))
            redFlags.push("סימני פגיעה עצבית באזור השבר");
        
        if (containsKeyword(["דופק חלש", "חיוורון", "קור"]) && !containsKeyword(["חזר", "השתפר"]))
            redFlags.push("סימני פגיעה בכלי דם מתחת לאזור השבר");
        
        if (containsKeyword(["צוואר", "גב", "ראש", "אגן", "ירך"]))
            redFlags.push("שבר באזור קריטי - מצריך טיפול מיידי");
    }
    
    // קוצר נשימה - דגלים אדומים
    else if (mainComplaint.includes("קוצר נשימה")) {
        if (containsKeyword(["במנוחה", "ללא מאמץ"]))
            redFlags.push("קוצר נשימה במנוחה - מצריך הערכה דחופה");
        
        if (containsKeyword(["כחלון", "שפתיים כחולות"]))
            redFlags.push("כחלון - סימן לחמצון נמוך");
        
        if (containsKeyword(["דיבור קטוע", "לא מסוגל לדבר משפט"]))
            redFlags.push("קוצר נשימה המקשה על הדיבור");
        
        if (containsKeyword(["דפיקות לב", "דופק מהיר"]))
            redFlags.push("קוצר נשימה המלווה בדפיקות לב");
    }
    
    // כוויה - דגלים אדומים
    else if (mainComplaint.includes("כוויה")) {
        if (containsKeyword(["פנים", "עיניים", "אוזניים"]))
            redFlags.push("כוויה באזור הפנים או העיניים");
        
        if (containsKeyword(["נשימה", "קוצר", "שאיפה"]))
            redFlags.push("כוויה במערכת הנשימה או קוצר נשימה");
        
        if (containsKeyword(["גדולה", "נרחבת", "מעל 10%"]))
            redFlags.push("כוויה נרחבת - מעל 10% משטח הגוף");
        
        if (containsKeyword(["עמוקה", "דרגה 3", "לבנה", "שחורה"]))
            redFlags.push("כוויה עמוקה (דרגה 3)");
        
        if (containsKeyword(["חשמל", "מתח"]))
            redFlags.push("כוויה כתוצאה מחשמל - סיכון לפגיעה פנימית");
    }
    
    // דגלים אדומים כלליים
    if (containsKeyword(["קשיי נשימה", "קוצר נשימה חמור"]))
        redFlags.push("קשיי נשימה משמעותיים");
    
    if (containsKeyword(["הקאות", "דם"]) && !containsKeyword(["שלילי", "אין"]))
        redFlags.push("הקאות דמיות");
    
    if (containsKeyword(["חום גבוה", "חום מעל 39"]))
        redFlags.push("חום גבוה מעל 39 מעלות");
    
    if (containsKeyword(["בלבול", "חוסר התמצאות", "הזיות"]))
        redFlags.push("שינוי במצב ההכרה או בלבול");
    
    if (containsKeyword(["אובדן הכרה", "התעלפות"]))
        redFlags.push("אובדן הכרה");
    
    return redFlags;
}