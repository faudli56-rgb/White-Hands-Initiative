const API_URL = "https://script.google.com/macros/s/AKfycbwfsGOzMDVj3eClJdqFrZ8wD08XqgkktaX6HN7hBnXhA_e6pBbU0xTaaAW8V1h3-oIvXQ/exec";
let globalCases = [];

// التحكم بالقائمة الجانبية (Mobile Menu)
function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('open');
}

// التمرير السلس لقسم الحالات
function scrollToCases() {
    document.getElementById('casesTarget').scrollIntoView({ behavior: 'smooth' });
}

// النوافذ المنبثقة
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// جلب الإعدادات (صور الواجهة من قاعدة البيانات)
async function fetchSettings() {
    try {
        const res = await fetch(`${API_URL}?action=getSettings`);
        const settings = await res.json();
        
        if(settings.HeroBgImage) {
            document.getElementById('dynamicHeroBg').style.backgroundImage = `url('${settings.HeroBgImage}')`;
        }
        if(settings.MapImage) document.getElementById('dynamicMapImg').src = settings.MapImage;
        if(settings.PromoImage) document.getElementById('dynamicPromoImg').src = settings.PromoImage;
        if(settings.AboutImage) document.getElementById('dynamicAboutImg').src = settings.AboutImage;
    } catch (e) { console.error("Error loading images", e); }
}

// جلب الحالات
async function fetchCases() {
    const container = document.getElementById('casesContainer');
    try {
        const res = await fetch(`${API_URL}?action=getCases`);
        globalCases = await res.json();
        renderCases('all');
    } catch (e) {
        container.innerHTML = '<div style="width:100%; text-align:center; color:red;">تعذر الاتصال بقاعدة البيانات.</div>';
    }
}

function applyFilter(cat, btnElement) {
    document.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    renderCases(cat);
}

function renderCases(filter) {
    const container = document.getElementById('casesContainer');
    container.innerHTML = '';
    
    const filtered = globalCases.filter(c => filter === 'all' || c.Category === filter);
    
    if(filtered.length === 0) {
        container.innerHTML = '<div style="width:100%; text-align:center;">لا توجد حالات حالياً.</div>';
        return;
    }

    filtered.forEach(c => {
        const percent = Math.min((c.Collected / c.Required) * 100, 100);
        const remaining = c.Required - c.Collected;
        const isUrgent = c.Category === 'فزعة' || c.Category === 'عاجلة';

        container.innerHTML += `
            <div class="case-card ${isUrgent ? 'urgent' : ''}">
                <small style="color:#888;">${c.CaseID} | ${c.Governorate}</small>
                <h3 style="color:var(--primary); margin:5px 0;">${c.Title}</h3>
                <div class="progress-bg">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="case-stats">
                    <span style="color:var(--danger)">متبقي: ${remaining.toLocaleString()} ريال</span>
                    <span style="color:var(--primary)">${Math.round(percent)}%</span>
                </div>
                <a href="https://wa.me/967700000000?text=أرغب بالمساهمة في ${c.CaseID}" target="_blank" 
                   class="btn-solid-gold w-100 mt-10" style="display:block; text-align:center; text-decoration:none;">
                   ساهم في الإغلاق <i class="fas fa-heart"></i>
                </a>
            </div>
        `;
    });
}

// دالة الإرسال المشتركة للنماذج
async function submitData(payload, btnId, statusId, modalId) {
    const btn = document.getElementById(btnId);
    const status = document.getElementById(statusId);
    const originalText = btn.innerHTML;
    
    btn.disabled = true; btn.innerText = "جاري الإرسال...";
    
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        
        status.style.color = result.status === 'success' ? 'green' : 'red';
        status.innerText = result.message;
        
        if(result.status === 'success' && modalId) {
            setTimeout(() => { closeModal(modalId); status.innerText = ''; }, 2000);
        }
    } catch (e) {
        status.style.color = 'red'; status.innerText = "خطأ في الاتصال.";
    } finally {
        btn.disabled = false; btn.innerHTML = originalText;
    }
}

// أحداث النماذج
function handleLogin(e) {
    e.preventDefault();
    submitData({
        action: 'login',
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    }, 'submitLoginBtn', 'loginStatus', 'loginModal');
}

function submitBeneficiary(e) {
    e.preventDefault();
    submitData({
        action: 'submitBeneficiary',
        title: document.getElementById('benTitle').value,
        desc: document.getElementById('benDesc').value,
        reqAmount: document.getElementById('benAmount').value,
        governorate: document.getElementById('benGov').value,
        category: document.getElementById('benCat').value
    }, 'btnSubmitBen', 'benStatus', 'beneficiaryModal');
}

function submitVolunteer(e) {
    e.preventDefault();
    submitData({
        action: 'submitVolunteer',
        fullName: document.getElementById('volName').value,
        phone: document.getElementById('volPhone').value,
        governorate: document.getElementById('volGov').value,
        skills: document.getElementById('volSkills').value
    }, 'btnSubmitVol', 'volStatus', 'volunteerModal');
}

// بدء التشغيل التلقائي
window.onload = () => {
    fetchSettings();
    fetchCases();
};
