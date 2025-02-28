// public/components/formComponents.js

/**
 * קומפוננטות UI משופרות לטפסים
 */

/**
 * יוצר כרטיסיות מתקפלות לשאלות
 * @param {string} id - מזהה הכרטיסייה
 * @param {string} title - כותרת הכרטיסייה
 * @param {string} content - תוכן HTML של הכרטיסייה
 * @param {boolean} isOpen - האם הכרטיסייה פתוחה כברירת מחדל
 * @returns {string} - HTML של הכרטיסייה
 */
function createAccordion(id, title, content, isOpen = false) {
    return `
      <div class="accordion-item" id="accordion-${id}">
        <div class="accordion-header" onclick="toggleAccordion('${id}')">
          <span>${title}</span>
          <span class="accordion-icon">${isOpen ? '▲' : '▼'}</span>
        </div>
        <div class="accordion-content ${isOpen ? 'open' : ''}" id="accordion-content-${id}">
          ${content}
        </div>
      </div>
    `;
  }
  
  /**
   * פותח או סוגר כרטיסייה מתקפלת
   * @param {string} id - מזהה הכרטיסייה
   */
  function toggleAccordion(id) {
    const content = document.getElementById(`accordion-content-${id}`);
    const icon = document.querySelector(`#accordion-${id} .accordion-icon`);
    
    if (content.classList.contains('open')) {
      content.classList.remove('open');
      icon.textContent = '▼';
    } else {
      content.classList.add('open');
      icon.textContent = '▲';
    }
  }
  
  /**
   * יוצר סרגל התקדמות ויזואלי
   * @param {number} currentStep - השלב הנוכחי
   * @param {number} totalSteps - מספר השלבים הכולל
   * @returns {string} - HTML של סרגל ההתקדמות
   */
  function createProgressBar(currentStep, totalSteps) {
    let progressBar = '<div class="progress-bar">';
    
    for (let i = 1; i <= totalSteps; i++) {
      let statusClass = '';
      if (i < currentStep) statusClass = 'completed';
      if (i === currentStep) statusClass = 'active';
      
      progressBar += `<div class="progress-step ${statusClass}">${i}</div>`;
    }
    
    progressBar += '</div>';
    return progressBar;
  }
  
  /**
   * יוצר תצוגת דגל אדום
   * @param {string} title - כותרת הדגל האדום
   * @param {string} details - פרטי הדגל האדום
   * @returns {string} - HTML של תצוגת הדגל האדום
   */
  function createRedFlag(title, details) {
    return `
      <div class="red-flag slide-in">
        <div class="red-flag-icon">⚠️</div>
        <div class="red-flag-content">
          <div class="red-flag-title">${title}</div>
          <div class="red-flag-details">${details}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * יוצר תצוגה מקדימה בזמן אמת של האנמנזה
   * @param {object} patientData - נתוני המטופל
   * @param {object} additionalInfo - מידע נוסף (פרופיל, סעיף, וכו')
   * @returns {string} - HTML של תצוגת האנמנזה
   */
  function createLivePreview(patientData) {
    // יצירת שורת פרופיל
    const profile = patientData.patientInfo.profile || '97';
    const sections = patientData.patientInfo.medicalSections || 'ללא סעיפים';
    const allergies = patientData.patientInfo.allergies || 'ללא אלרגיות ידועות';
    const medications = patientData.patientInfo.medications || 'לא נוטל תרופות באופן קבוע';
    
    const profileLine = `פרופיל ${profile}, ${sections}. ${allergies}, ${medications}`;
    
    // יצירת טקסט האנמנזה הבסיסי
    let summaryText = '';
    if (patientData.patientInfo) {
      const { age, gender, mainComplaint } = patientData.patientInfo;
      const genderText = gender === 'male' ? 'זכר' : 'נקבה';
      summaryText = `מטופל בן ${age}, ${genderText}, מתלונן על ${mainComplaint}`;
      
      // הוספת תשובות לאנמנזה
      const detailsArr = [];
      
      if (patientData.standardAnswers) {
        for (const [question, answer] of Object.entries(patientData.standardAnswers)) {
          if (answer && answer.trim()) {
            // עיבוד התשובה לפורמט מתאים לאנמנזה
            detailsArr.push(`${question.replace('?', '')}: ${answer}`);
          }
        }
      }
      
      if (patientData.dynamicAnswers) {
        for (const [question, answer] of Object.entries(patientData.dynamicAnswers)) {
          if (answer && answer.trim()) {
            detailsArr.push(`${question.replace('?', '')}: ${answer}`);
          }
        }
      }
      
      if (detailsArr.length > 0) {
        summaryText += `. ${detailsArr.join('; ')}`;
      }
      
      // הוספת נקודה בסוף אם אין
      if (!summaryText.endsWith('.')) {
        summaryText += '.';
      }
    }
    
    return `
      <div class="live-preview fade-in">
        <div class="live-preview-title">תצוגה מקדימה של האנמנזה:</div>
        <p class="profile-line"><strong>${profileLine}</strong></p>
        <p class="summary-text">${summaryText}</p>
      </div>
    `;
  }
  
  /**
   * יוצר תצוגת פרופיל רפואי
   * @param {object} profileData - נתוני הפרופיל הרפואי
   * @returns {string} - HTML של תצוגת הפרופיל
   */
  function createMedicalProfile(profileData) {
    const { profile, sections, allergies, medications } = profileData;
    
    return `
      <div class="medical-profile-card">
        <div class="profile-header">
          <h3>פרופיל רפואי</h3>
        </div>
        <div class="profile-details">
          <div class="profile-item">
            <span class="profile-label">פרופיל:</span>
            <span class="profile-value">${profile}</span>
          </div>
          <div class="profile-item">
            <span class="profile-label">סעיפים:</span>
            <span class="profile-value">${sections || 'ללא סעיפים'}</span>
          </div>
          <div class="profile-item">
            <span class="profile-label">אלרגיות:</span>
            <span class="profile-value">${allergies}</span>
          </div>
          <div class="profile-item">
            <span class="profile-label">תרופות קבועות:</span>
            <span class="profile-value">${medications}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * פורמט האנמנזה עם הדגשת דגלים אדומים
   * @param {string} summaryText - טקסט האנמנזה המקורי
   * @returns {string} - HTML של האנמנזה המעוצבת
   */
  function formatAnamnesis(summaryText) {
    // חלוקה לפסקאות
    const paragraphs = summaryText.split('\n\n');
    let formattedHtml = '';
    
    paragraphs.forEach(paragraph => {
      if (paragraph.includes('דגלים אדומים:')) {
        formattedHtml += `<div class="red-flag-section">${paragraph}</div>`;
      } else {
        formattedHtml += `<p>${paragraph}</p>`;
      }
    });
    
    return formattedHtml;
  }
  
  // ייצוא הפונקציות לשימוש בקובץ הראשי
  window.FormComponents = {
    createAccordion,
    toggleAccordion,
    createProgressBar,
    createRedFlag,
    createLivePreview,
    createMedicalProfile,
    formatAnamnesis
  };