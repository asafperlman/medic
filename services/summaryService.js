// services/summaryService.js

/**
 * מודול לטיפול ביצירת וניהול סיכומי אנמנזה
 * ==========================================
 * 
 * מספק פונקציות ליצירת סיכומים רפואיים, זיהוי דגלים אדומים,
 * והצגת הנתונים בצורה ברורה לרופא והמטופל.
 */

import { getElement } from '../utils/uiHelpers.js';

/**
 * יוצר סיכום אנמנזה מרשומת מטופל
 * @param {object} patientRecord - רשומת המטופל
 * @returns {Promise<object>} - רשומת המטופל המעודכנת עם סיכום
 */
export async function generateSummary(patientRecord) {
    try {
        // ניסיון ליצור סיכום באמצעות API אם זמין
        if (window.navigator.onLine && window.OPENAI_API_KEY) {
            try {
                console.log("משתמש בשירות AI ליצירת סיכום מתקדם...");
                
                // שליחת בקשה לשרת
                const response = await fetch('/api/generate-summary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(patientRecord)
                });
                
                const data = await response.json();
                
                if (data.success !== false) {
                    console.log("✅ סיכום התקבל מהשרת");
                    patientRecord.summary = data.summary;
                    return patientRecord;
                } else {
                    throw new Error(data.error || "שגיאה בקבלת נתונים מהשרת");
                }
            } catch (error) {
                console.warn("נכשל בשימוש בשירות AI, משתמש בלוגיקת סיכום מקומית", error);
                
                // נפלבק לסיכום מקומי
                const summary = createLocalSummary(patientRecord);
                patientRecord.summary = summary;
                return patientRecord;
            }
        } else {
            // אין חיבור לשרת או מפתח API חסר, יצירת סיכום מקומי
            console.log("משתמש בלוגיקת סיכום מקומית");
            const summary = createLocalSummary(patientRecord);
            patientRecord.summary = summary;
            return patientRecord;
        }
    } catch (error) {
        console.error("שגיאה כללית ביצירת סיכום:", error);
        
        // יצירת סיכום בסיסי מאוד במקרה של כישלון מוחלט
        const basicSummary = createBasicSummary(patientRecord);
        patientRecord.summary = basicSummary;
        return patientRecord;
    }
}

/**
 * יוצר סיכום אנמנזה מקומי (כשאין חיבור לשרת)
 * @param {object} patientRecord - רשומת המטופל
 * @returns {string} - סיכום אנמנזה
 */
function createLocalSummary(patientRecord) {
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
            
            summary += vitalSignsArr.join(', ') + '.\n\n';
        } else {
            summary += '.\n\n';
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
        
        // עיבוד המידע מהתשובות
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
            // התאמת ניסוח לפי מגדר
            else if (answer.toLowerCase().match(/^לא|אין|שולל/)) {
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
            // הוספת מידע נוסף שלא סווג לקטגוריות מוגדרות
            else if (!question.match(/אחר|נוסף|שם|גיל|כתובת|טלפון/i)) {
                associatedSymptoms.push(`${question.replace(/\?/g, '').trim()}: ${answer}`);
            }
        }
        
        // בניית תיאור משמעותי בצורה קוהרנטית
        summary += "אנמנזה: ";
        
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
        
        // הוספת סימפטומים נלווים בפורמט משופר
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
        
        // הוספת הערות אם הוזנו
        if (notes.length > 0) {
            summary += `\n\nהערות נוספות: ${notes.join("; ")}. `;
        }
        
        // בדיקת דגלים אדומים 
        const redFlags = checkForRedFlags(patientRecord);
        
        if (redFlags && redFlags.length > 0) {
            summary += `\n\nדגלים אדומים: ${redFlags.join("; ")}.`;
        }
        
        return summary;
    } catch (error) {
        // במקרה של שגיאה, נחזור לסיכום בסיסי
        console.error("שגיאה ביצירת סיכום מקומי:", error);
        return createBasicSummary(patientRecord);
    }
}

/**
 * יוצר סיכום בסיסי מאוד במקרה של כישלון
 * @param {object} patientRecord - רשומת המטופל
 * @returns {string} - סיכום בסיסי
 */
function createBasicSummary(patientRecord) {
    const { age, gender, mainComplaint, profile, medicalSections, allergies, medications, smoking } = patientRecord.patientInfo;
    const genderText = gender === 'male' ? 'זכר' : 'נקבה';
    
    return `פרופיל ${profile}, ${medicalSections || "ללא סעיפים"}, ${allergies || "ללא אלרגיות ידועות"}, ${medications || "לא נוטל תרופות באופן קבוע"}.\n\nמטופל/ת בגיל ${age}, ${genderText}, ${smoking === 'yes' ? 'מעשן/ת' : 'לא מעשן/ת'}, עם תלונה עיקרית של ${mainComplaint}.\n\nלא ניתן היה ליצור סיכום מפורט עקב בעיה טכנית.`;
}

/**
 * בודק ומדגיש דגלים אדומים בסיכום
 */
export function highlightRedFlags() {
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
 * מדגיש דגלים אדומים בסיכום הסופי
 */
export function highlightRedFlagsInFinalSummary() {
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
 * מחפש דגלים אדומים ברשומת מטופל
 * @param {object} patientRecord - רשומת המטופל
 * @returns {Array} - רשימת דגלים אדומים
 */
export function checkForRedFlags(patientRecord) {
    const redFlags = [];
    const { mainComplaint } = patientRecord.patientInfo;
    const allAnswers = { ...patientRecord.standardAnswers, ...patientRecord.dynamicAnswers };
    
    // פונקציית עזר לבדיקת תשובות
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
    
    // דגלים אדומים לפי סוג תלונה
    if (mainComplaint.includes("כאב ראש")) {
        if (containsKeyword(["הופעה פתאומית", "פתאומי", "חד"])) 
            redFlags.push("כאב ראש שהופיע בפתאומיות - יש לשקול הערכה נוירולוגית דחופה");
        
        if (containsKeyword(["הקאות", "בחילות"])) 
            redFlags.push("הקאות בשילוב עם כאב ראש - חשד למצב נוירולוגי דחוף");
        
        if (containsKeyword(["חמור", "חזק ביותר", "הכי גרוע"])) 
            redFlags.push("כאב ראש בעוצמה גבוהה מאוד - נדרשת הערכה רפואית");
        
        if (containsKeyword(["הפרעות ראייה", "טשטוש", "כפל ראייה"])) 
            redFlags.push("הפרעות ראייה המלוות כאב ראש - מצריך בירור דחוף");
        
        if (containsKeyword(["נימול", "חולשה בגפיים"])) 
            redFlags.push("תסמינים נוירולוגיים המלווים כאב ראש - חשד לאירוע מוחי");
        
        if (containsKeyword(["מעיר משינה", "מתעורר בגלל הכאב"])) 
            redFlags.push("כאב ראש המעיר משינה - סימן למצב דחוף");
    }
    
    else if (mainComplaint.includes("כאב חזה")) {
        if (containsKeyword(["קוצר נשימה", "קשיי נשימה"])) 
            redFlags.push("כאב חזה בשילוב עם קוצר נשימה - יש לשלול מצב לבבי או ריאתי חריף");
        
        if (containsKeyword(["זיעה", "הזעה", "זיעה קרה"])) 
            redFlags.push("כאב חזה בשילוב עם הזעה - חשד למצב לבבי חריף");
        
        if (containsKeyword(["לחץ", "מועקה", "כבדות"])) 
            redFlags.push("תחושת לחץ או מועקה בחזה - חשד לבעיה לבבית");
        
        if (containsKeyword(["הקרנה", "מקרין", "פשט", "התפשט"])) 
            redFlags.push("כאב חזה המקרין לזרוע, כתף או לסת - חשד לבעיה לבבית");
    }
    
    else if (mainComplaint.includes("כאב בטן")) {
        if (containsKeyword(["דם", "דמי"])) 
            redFlags.push("דם בצואה או בהקאות - מצריך הערכה דחופה");
        
        if ((containsKeyword(["כאב חזק", "כאב חמור"]) && containsKeyword(["ימין תחתונה", "צד ימין למטה"]))) 
            redFlags.push("כאב חזק בבטן ימין תחתונה - יש לשלול אפנדיציט");
        
        if (containsKeyword(["בטן קשה", "בטן מתוחה", "נוקשות"])) 
            redFlags.push("בטן קשה או מתוחה - יש לשלול מצב כירורגי חריף");
        
        if (containsKeyword(["חום"])) 
            redFlags.push("כאב בטן המלווה בחום - יש לשלול זיהום חמור");
    }
    
    else if (mainComplaint.includes("קוצר נשימה")) {
        if (containsKeyword(["במנוחה", "ללא מאמץ"])) 
            redFlags.push("קוצר נשימה במנוחה - מצריך הערכה דחופה");
        
        if (containsKeyword(["כחלון", "שפתיים כחולות"])) 
            redFlags.push("כחלון - סימן לחמצון נמוך, מצריך טיפול דחוף");
        
        if (containsKeyword(["דיבור קטוע", "לא מסוגל לדבר משפט"])) 
            redFlags.push("קוצר נשימה המקשה על הדיבור - מצב חמור המצריך הערכה מיידית");
    }
    
    else if (mainComplaint.includes("פציעת ראש")) {
        if (containsKeyword(["איבוד הכרה", "התעלפות", "איבד הכרה"])) 
            redFlags.push("איבוד הכרה לאחר פציעת ראש - מצריך הערכה נוירולוגית דחופה");
        
        if (containsKeyword(["הקאות", "בחילות"])) 
            redFlags.push("הקאות חוזרות לאחר פציעת ראש - חשד לעליית לחץ תוך גולגולתי");
        
        if (containsKeyword(["בלבול", "חוסר התמצאות", "חוסר זיכרון"])) 
            redFlags.push("בלבול או חוסר התמצאות לאחר פציעת ראש - חשד לפגיעה מוחית משמעותית");
    }
    
    // דגלים אדומים כלליים
    if (containsKeyword(["קשיי נשימה", "קוצר נשימה חמור"])) 
        redFlags.push("קשיי נשימה משמעותיים - מצריכים הערכה דחופה");
    
    if (containsKeyword(["הקאות", "דם"])) 
        redFlags.push("הקאות דמיות - מצריכות הערכה דחופה");
    
    if (containsKeyword(["חום גבוה", "חום מעל 39"])) 
        redFlags.push("חום גבוה מעל 39 מעלות - דורש התייחסות");
    
    if (containsKeyword(["בלבול", "חוסר התמצאות", "הזיות"])) 
        redFlags.push("שינוי במצב ההכרה או בלבול - מצריך הערכה נוירולוגית");
    
    if (containsKeyword(["אובדן הכרה", "התעלפות"])) 
        redFlags.push("אובדן הכרה - מצריך הערכה רפואית");
    
    // בדיקת מדדים חיוניים
    if (patientRecord.vitalSigns) {
        const temperature = parseFloat(patientRecord.vitalSigns.temperature);
        if (!isNaN(temperature) && temperature >= 39) {
            redFlags.push("חום גבוה מעל 39 מעלות");
        }
        
        const pulse = parseInt(patientRecord.vitalSigns.pulse);
        if (!isNaN(pulse)) {
            if (pulse > 120) redFlags.push("דופק מהיר מאוד");
            else if (pulse < 50) redFlags.push("דופק איטי מאוד");
        }
        
        const saturation = parseInt(patientRecord.vitalSigns.saturation);
        if (!isNaN(saturation) && saturation < 94) {
            redFlags.push("רוויון חמצן נמוך");
        }
        
        // בדיקת לחץ דם גבוה
        const bloodPressure = patientRecord.vitalSigns.bloodPressure;
        if (bloodPressure) {
            const parts = bloodPressure.split('/');
            if (parts.length === 2) {
                const systolic = parseInt(parts[0]);
                const diastolic = parseInt(parts[1]);
                
                if (!isNaN(systolic) && !isNaN(diastolic) && 
                    (systolic > 160 || diastolic > 100)) {
                    redFlags.push("לחץ דם גבוה");
                }
            }
        }
    }
    
    return redFlags;
}

/**
 * שולח בקשה ל-API לקבלת המלצות טיפוליות
 * @param {object} patientRecord - רשומת המטופל
 * @returns {Promise<string>} - המלצות טיפוליות
 */
export async function getTreatmentRecommendations(patientRecord) {
    try {
        if (!window.navigator.onLine || !window.OPENAI_API_KEY) {
            return generateLocalRecommendations(patientRecord);
        }
        
        const response = await fetch('/api/get-treatment-recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientRecord })
        });
        
        if (!response.ok) {
            throw new Error(`שגיאת שרת: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.recommendations) {
            return data.recommendations;
        } else {
            throw new Error("תשובה לא תקינה מהשרת");
        }
    } catch (error) {
        console.error("שגיאה בקבלת המלצות טיפוליות:", error);
        return generateLocalRecommendations(patientRecord);
    }
}

/**
 * יוצר המלצות טיפוליות בסיסיות באופן מקומי
 * @param {object} patientRecord - רשומת המטופל
 * @returns {string} - המלצות טיפוליות
 */
function generateLocalRecommendations(patientRecord) {
    const { mainComplaint } = patientRecord.patientInfo;
    
    let recommendations = "המלצות לטיפול:\n";
    
    // המלצות כלליות
    recommendations += "- מנוחה והפחתת פעילות גופנית מאומצת\n";
    recommendations += "- שתייה מרובה של נוזלים (8-10 כוסות מים ביום)\n";
    recommendations += "- נטילת משככי כאבים לפי הצורך ובהתאם להוראות היצרן\n";
    
    // המלצות ספציפיות לפי תלונה
    if (mainComplaint.includes("כאב ראש")) {
        recommendations += "- מנוחה בסביבה שקטה ומוארת באופן מעומעם\n";
        recommendations += "- הימנעות ממסכים ומקורות אור חזקים\n";
        recommendations += "- במקרה של מיגרנה: שכיבה בחדר חשוך ושקט\n";
    }
    else if (mainComplaint.includes("כאב גרון")) {
        recommendations += "- גרגור עם מי מלח פושרים (כפית מלח בכוס מים) 3-4 פעמים ביום\n";
        recommendations += "- שתיית משקאות חמים כמו תה עם דבש ולימון\n";
        recommendations += "- מנוחה קולית והפחתת דיבור\n";
    }
    else if (mainComplaint.includes("כאב בטן")) {
        recommendations += "- אכילת ארוחות קטנות ותכופות\n";
        recommendations += "- הימנעות ממזונות מתובלים, שומניים או מעובדים\n";
        recommendations += "- חימום האזור הכואב בעזרת בקבוק חם\n";
    }
    else if (mainComplaint.includes("כאב גב")) {
        recommendations += "- חימום האזור הכואב בעזרת בקבוק חם או מגבת חמה\n";
        recommendations += "- מנוחה קצרה על משטח קשיח יחסית\n";
        recommendations += "- הימנעות מישיבה או עמידה ממושכות\n";
    }
    else if (mainComplaint.includes("שיעול")) {
        recommendations += "- הימנעות מאוויר יבש או קר\n";
        recommendations += "- שימוש במכשיר אדים בחדר השינה\n";
        recommendations += "- שתיית תה עם דבש ולימון\n";
    }
    else if (mainComplaint.includes("פציעה") || mainComplaint.includes("נקע") || mainComplaint.includes("שבר")) {
        recommendations += "- טיפול RICE - מנוחה, קרח, לחץ והרמה\n";
        recommendations += "- קומפרסים קרים 15-20 דקות כל 2-3 שעות\n";
        recommendations += "- קיבוע האזור הפגוע\n";
    }
    
    // המלצות לפנייה לרופא
    recommendations += "\nדגשים חשובים:\n";
    
    if (mainComplaint.includes("כאב ראש")) {
        recommendations += "- פניה לרופא אם הכאב חמור, מתמשך מעל 3 ימים, או מלווה בהקאות\n";
        recommendations += "- פניה דחופה למיון אם הכאב מלווה בבלבול, חולשה בצד אחד של הגוף או שינויים בדיבור\n";
    }
    else if (mainComplaint.includes("כאב גרון")) {
        recommendations += "- פניה לרופא אם כאב הגרון נמשך יותר מ-7 ימים\n";
        recommendations += "- פניה לרופא אם יש חום גבוה (מעל 38.3°C) למשך יותר מ-48 שעות\n";
    }
    else if (mainComplaint.includes("כאב בטן")) {
        recommendations += "- פניה מיידית לרופא אם הכאב חזק מאוד או מתמקד בצד ימין תחתון של הבטן\n";
        recommendations += "- פניה מיידית לרופא אם הכאב מלווה בחום, הקאות מרובות או דם בצואה\n";
    }
    else if (mainComplaint.includes("כאב גב")) {
        recommendations += "- פניה לרופא אם הכאב חמור או לא משתפר לאחר 3-5 ימים\n";
        recommendations += "- פניה מיידית לרופא אם יש חולשה ברגליים, קושי בשליטה בשתן או צואה\n";
    }
    else if (mainComplaint.includes("פציעה") || mainComplaint.includes("נקע") || mainComplaint.includes("שבר")) {
        recommendations += "- פניה מיידית לרופא אם יש עיוות ברור באזור הפגוע\n";
        recommendations += "- פניה לרופא אם הכאב או הנפיחות לא משתפרים לאחר 48 שעות\n";
    }
    else {
        recommendations += "- פניה לרופא אם הסימפטומים מחמירים או לא משתפרים לאחר 3 ימים\n";
    }
    
    // המלצה כללית
    recommendations += "- פניה מיידית לטיפול רפואי בכל החמרה משמעותית או הופעת סימנים חדשים מדאיגים\n";
    
    return recommendations;
}