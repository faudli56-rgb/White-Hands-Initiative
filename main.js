const API_URL = "https://script.google.com/macros/s/AKfycbwfsGOzMDVj3eClJdqFrZ8wD08XqgkktaX6HN7hBnXhA_e6pBbU0xTaaAW8V1h3-oIvXQ/exec";

// 1. جلب إعدادات الموقع (الصور الديناميكية)
async function fetchSettings() {
    try {
        const res = await fetch(`${API_URL}?action=getSettings`);
        const settings = await res.json();
        
        // تطبيق الصور من قاعدة البيانات على الواجهة
        if(settings.HeroBgImage) {
            document.getElementById('dynamicHeroBg').style.backgroundImage = `url('${settings.HeroBgImage}')`;
        }
        if(settings.MapImage) document.getElementById('dynamicMapImg').src = settings.MapImage;
        if(settings.AboutImage) document.getElementById('dynamicAboutImg').src = settings.AboutImage;
        if(settings.PromoImage) document.getElementById('dynamicPromoImg').src = settings.PromoImage;
        
    } catch (e) { console.error("Error loading settings", e); }
}

// 2. جلب أبرز الحالات
async function fetchCases() {
    const container = document.getElementById('casesContainer');
    try {
        const res = await fetch(`${API_URL}?action=getCases`);
        const cases = await res.json();
        container.innerHTML = '';
        
        // عرض أول 3 حالات فقط في الواجهة الرئيسية
        cases.slice(0, 3).forEach(c => {
            const percent = Math.min((c.Collected / c.Required) * 100, 100);
            
            // إذا لم تكن هناك صورة للحالة، نضع صورة افتراضية
            const imgSource = c.ImageURL ? c.ImageURL : 'default-case.jpg';
            
            container.innerHTML += `
                <div class="case-card">
                    <img src="${imgSource}" class="case-img" alt="${c.Title}">
                    <div class="case-info">
                        <h3 style="color:var(--primary);">${c.Title}</h3>
                        <div class="progress-bg">
                            <div class="progress-fill" style="width: ${percent}%"></div>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:0.8rem;">
                            <span>${Math.round(percent)}%</span>
                            <span style="color:#666;"><i class="fas fa-map-marker-alt"></i> ${c.Governorate}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        container.innerHTML = '<p>تعذر تحميل الحالات.</p>';
    }
}

// 3. دالة معالجة رفع الصور عند إضافة حالة (تستخدم في لوحة تحكم المدير)
// تُستدعى هذه الدالة عندما يختار المدير صورة من جهازه
function getBase64(file) {
   return new Promise((resolve, reject) => {
     const reader = new FileReader();
     reader.readAsDataURL(file);
     reader.onload = () => resolve(reader.result);
     reader.onerror = error => reject(error);
   });
}

// مثال لكيفية إرسال الحالة مع الصورة للإدارة
async function submitNewCaseForm() {
    const fileInput = document.getElementById('caseImageInput').files[0];
    let imageB64 = null;
    let imageMime = null;
    let imageName = null;
    
    if (fileInput) {
        imageB64 = await getBase64(fileInput);
        imageMime = fileInput.type;
        imageName = fileInput.name;
    }
    
    const payload = {
        action: 'addCase',
        title: document.getElementById('caseTitle').value,
        desc: document.getElementById('caseDesc').value,
        reqAmount: document.getElementById('caseReq').value,
        governorate: document.getElementById('caseGov').value,
        category: document.getElementById('caseCat').value,
        imageB64: imageB64,
        imageMime: imageMime,
        imageName: imageName
    };
    
    // إرسال الـ payload عبر fetch إلى API_URL...
}

window.onload = () => {
    fetchSettings();
    fetchCases();
};
