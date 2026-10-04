// --- 1. الإعدادات المركزية ---
const CONFIG = {
    // ⚠️ ضع رابط السكربت الذي حصلت عليه بعد نشر Google Apps Script هنا
    API_URL: "https://script.google.com/macros/s/AKfycby3niM52qJV1XmzFPACUzIb0DNfwMaWuZ0LtighB-x1x1eaLfLvNtMLHCIhRVrPyW-_lg/exec", 
    APP_DOWNLOAD_URL: "https://drive.google.com/1iJPQbmg28_IJIqBcM2K0GhPskbq7jXYb" 
};

document.getElementById('downloadAppBtn').href = CONFIG.APP_DOWNLOAD_URL;

// --- 2. إدارة اللغات ---
let currentLang = 'ar';
const translations = {
    ar: {
        logo: "الأيادي البيضاء", themeLight: "☀️ فاتح", themeDark: "🌙 داكن",
        langText: "English", login: "دخول الإدارة",
        heroTitle: "عطاءٌ يحفظ الكرامة… وأيادٍ تصنع الأثر",
        heroSub: "منصة التكافل الأولى في اليمن. نربط المحتاج بالداعم بشفافية تامة.",
        downloadApp: "📱 حمل التطبيق الآن", allGovs: "جميع المحافظات اليمنية",
        allCats: "جميع الحالات", urgent: "فزعة عاجلة",
        medical: "حالات مرضية", orphans: "أيتام",
        donateBtn: "ساهم في الإغلاق", reqText: "المطلوب:", govText: "المحافظة:",
        loading: "جاري تحميل الحالات...", empty: "لا توجد حالات مطابقة."
    },
    en: {
        logo: "White Hands", themeLight: "☀️ Light", themeDark: "🌙 Dark",
        langText: "عربي", login: "Login",
        heroTitle: "Dignified Giving... Hands Creating Impact",
        heroSub: "Yemen's premier solidarity platform.",
        downloadApp: "📱 Download App", allGovs: "All Governorates",
        allCats: "All Cases", urgent: "Urgent SOS",
        medical: "Medical", orphans: "Orphans",
        donateBtn: "Contribute Now", reqText: "Required:", govText: "Gov:",
        loading: "Loading cases...", empty: "No cases found."
    }
};

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    
    const t = translations[currentLang];
    document.getElementById('logoText').innerText = t.logo;
    document.getElementById('langBtn').innerText = t.langText;
    document.getElementById('loginBtn').innerText = t.login;
    document.getElementById('heroTitle').innerText = t.heroTitle;
    document.getElementById('heroSubtitle').innerText = t.heroSub;
    document.getElementById('downloadAppBtn').innerText = t.downloadApp;
    document.getElementById('optAll').innerText = t.allGovs;
    document.getElementById('optCatAll').innerText = t.allCats;
    document.getElementById('optCatUrgent').innerText = t.urgent;
    document.getElementById('optCatMed').innerText = t.medical;
    document.getElementById('optCatOrp').innerText = t.orphans;
    
    updateThemeBtn();
    fetchAndRenderCases(); 
}

// --- 3. إدارة الوضع الداكن/الفاتح ---
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    updateThemeBtn();
}

function updateThemeBtn() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.getElementById('themeBtn').innerText = isDark ? translations[currentLang].themeLight : translations[currentLang].themeDark;
}

if (localStorage.getItem('theme') === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    updateThemeBtn();
}

// --- 4. جلب وعرض الحالات ---
let globalCases = [];

async function fetchAndRenderCases() {
    const container = document.getElementById('casesContainer');
    container.innerHTML = `<p style="text-align: center; width: 100%;">${translations[currentLang].loading}</p>`;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getCases`);
        globalCases = await response.json();
        renderFilteredCases();
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="text-align: center; color: red; width: 100%;">تعذر الاتصال بقاعدة البيانات.</p>`;
    }
}

function renderFilteredCases() {
    const container = document.getElementById('casesContainer');
    const govFilter = document.getElementById('govFilter').value;
    const catFilter = document.getElementById('catFilter').value;
    const t = translations[currentLang];
    
    container.innerHTML = '';
    
    const filtered = globalCases.filter(c => {
        const matchGov = govFilter === 'all' || c.Governorate === govFilter;
        const matchCat = catFilter === 'all' || c.Category === catFilter;
        const isPublished = c.Status === 'منشورة'; 
        return matchGov && matchCat && isPublished;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align: center; width: 100%;">${t.empty}</p>`;
        return;
    }

    filtered.forEach(c => {
        const percent = Math.min((c.Collected / c.Required) * 100, 100);
        const isUrgent = c.Category === 'فزعة';
        
        container.innerHTML += `
            <div class="case-card ${isUrgent ? 'urgent' : ''}">
                ${isUrgent ? `<span class="urgent-badge">${t.urgent}</span>` : ''}
                <div style="clear: both;"></div>
                <small style="color: var(--text-muted);">${c.CaseID} | ${t.govText} ${c.Governorate}</small>
                <h3 style="color: var(--primary); margin: 10px 0;">${c.Title}</h3>
                <p>${t.reqText} ${Number(c.Required).toLocaleString()}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <a href="https://wa.me/967700000000?text=المساهمة في ${c.CaseID}" target="_blank" class="btn-main" style="width: 100%; text-align: center; display: block;">${t.donateBtn}</a>
            </div>
        `;
    });
}

// --- 5. بوابة تسجيل الدخول ---
function openLoginModal() { document.getElementById('loginModal').style.display = 'flex'; }
function closeLoginModal() { document.getElementById('loginModal').style.display = 'none'; }

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('submitLoginBtn');
    const status = document.getElementById('loginStatus');
    btn.disabled = true; btn.innerText = "جاري التحقق...";
    
    const payload = {
        action: 'login',
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            status.style.color = "green";
            status.innerText = `تم الدخول بصلاحية: ${result.role}`;
            setTimeout(() => {
                sessionStorage.setItem('userRole', result.role);
                sessionStorage.setItem('userGov', result.governorate);
                window.location.href = result.role === 'Admin' ? 'admin_dash.html' : 'team_dash.html';
            }, 1500);
        } else {
            status.style.color = "red";
            status.innerText = result.message;
        }
    } catch (err) {
        status.style.color = "red";
        status.innerText = "خطأ في الاتصال بالخادم.";
    } finally {
        btn.disabled = false; btn.innerText = "دخول";
    }
}

window.onload = fetchAndRenderCases;
