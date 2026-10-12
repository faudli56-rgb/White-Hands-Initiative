// 1. رابط قاعدة البيانات (Google Apps Script)
const API_URL = "https://script.google.com/macros/s/AKfycbyy2Q69kwtZKExOtOMAetY67KLLd3W5WdGunwNtUQdVYyL7NIZp-zQNruxlK4txMZF0kw/exec";
let globalCases = [];

// ==========================================
// 2. دوال الواجهة والتنقل (SPA)
// ==========================================
function toggleMenu() { document.getElementById('sideMenu').classList.toggle('open'); }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function switchPage(pageId, navElement = null) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    if (navElement) {
        document.querySelectorAll('#mainNav a').forEach(a => a.classList.remove('active'));
        navElement.classList.add('active');
    }
    window.scrollTo(0, 0);
}

function openPartnerModal(type) {
    document.getElementById('partnerType').value = type;
    document.getElementById('partnerModalTitle').innerText = 'انضمام كـ: ' + type;
    openModal('partnerModal');
}

// ==========================================
// 3. جلب البيانات من الخادم
// ==========================================
async function fetchSettings() {
    try {
        const res = await fetch(`${API_URL}?action=getSettings`);
        const settings = await res.json();
        if(settings.Facebook) document.getElementById('linkFacebook').href = settings.Facebook;
        if(settings.Twitter) document.getElementById('linkTwitter').href = settings.Twitter;
        if(settings.HeroBgImage) document.getElementById('heroTarget').style.backgroundImage = `url('${settings.HeroBgImage}')`;
    } catch (e) { console.error("Error loading settings"); }
}

async function fetchBanks() {
    const container = document.getElementById('banksContainer');
    try {
        const res = await fetch(`${API_URL}?action=getBanks`);
        const banks = await res.json();
        container.innerHTML = '';
        if(banks.length === 0) { container.innerHTML = '<p>لا توجد حسابات حالياً.</p>'; return; }
        banks.forEach(b => {
            container.innerHTML += `<div class="bank-item"><strong>${b.BankName}</strong><small>باسم: ${b.AccountName}</small><span>${b.AccountNumber}</span></div>`;
        });
    } catch (e) { container.innerHTML = '<p style="color:red;">تعذر جلب الحسابات.</p>'; }
}

async function fetchCases() {
    const container = document.getElementById('casesContainer');
    try {
        const res = await fetch(`${API_URL}?action=getCases`);
        globalCases = await res.json();
        renderCases('all');
    } catch (e) { container.innerHTML = '<div style="width:100%; text-align:center; color:red;">خطأ في الاتصال.</div>'; }
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
    if(filtered.length === 0) { container.innerHTML = '<div>لا توجد حالات.</div>'; return; }

    filtered.forEach(c => {
        const percent = Math.min((c.Collected / c.Required) * 100, 100);
        const remaining = c.Required - c.Collected;
        container.innerHTML += `
            <div class="case-card">
                <small style="color:#888;">${c.CaseID} | ${c.Governorate}</small>
                <h3 style="color:var(--primary); margin:5px 0;">${c.Title}</h3>
                <div class="progress-bg"><div class="progress-fill" style="width: ${percent}%"></div></div>
                <div class="case-stats">
                    <span style="color:var(--danger)">متبقي: ${remaining.toLocaleString()} ريال</span>
                    <span style="color:var(--primary)">${Math.round(percent)}%</span>
                </div>
                <button onclick="openModal('donateModal')" class="btn-solid-gold w-100 mt-10" style="border:none; cursor:pointer; padding:10px;">ساهم في الإغلاق <i class="fas fa-heart"></i></button>
            </div>
        `;
    });
}

// ==========================================
// 4. إرسال النماذج الأساسية وتسجيل الدخول
// ==========================================
async function submitData(payload, btnId, statusId, modalId) {
    const btn = document.getElementById(btnId);
    const status = document.getElementById(statusId);
    const originalText = btn.innerText;
    btn.disabled = true; btn.innerText = "جاري الإرسال...";
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        status.style.color = result.status === 'success' ? 'green' : 'red';
        status.innerText = result.message;
        if(result.status === 'success') setTimeout(() => { closeModal(modalId); status.innerText = ''; document.querySelector(`#${modalId} form`).reset(); }, 2000);
    } catch (e) { status.style.color = 'red'; status.innerText = "خطأ في الاتصال."; } 
    finally { btn.disabled = false; btn.innerText = originalText; }
}

function submitVolunteer(e) {
    e.preventDefault();
    submitData({ action: 'submitVolunteer', fullName: document.getElementById('volName').value, phone: document.getElementById('volPhone').value, governorate: document.getElementById('volGov').value, skills: document.getElementById('volSkills').value }, 'btnSubmitVol', 'volStatus', 'volunteerModal');
}

function submitPartner(e) {
    e.preventDefault();
    submitData({ action: 'submitPartner', partnerType: document.getElementById('partnerType').value, entityName: document.getElementById('partnerName').value, phone: document.getElementById('partnerPhone').value, governorate: document.getElementById('partnerGov').value }, 'btnSubmitPartner', 'partnerStatus', 'partnerModal');
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('submitLoginBtn');
    const status = document.getElementById('loginStatus');
    btn.disabled = true; btn.innerText = "جاري التحقق...";
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'login', username: document.getElementById('username').value, password: document.getElementById('password').value }) });
        const result = await res.json();
        if(result.status === 'success') {
            status.style.color = 'green'; status.innerText = "نجاح! جاري التوجيه...";
            sessionStorage.setItem('userRole', result.role); sessionStorage.setItem('userName', result.name);
            setTimeout(() => { window.location.href = 'admin.html'; }, 1000);
        } else { status.style.color = 'red'; status.innerText = result.message; btn.disabled = false; btn.innerText = "دخول"; }
    } catch (e) { status.style.color = 'red'; status.innerText = "خطأ اتصال."; btn.disabled = false; btn.innerText = "دخول"; }
}

// ==========================================
// 5. الميزات المتقدمة: الأوفلاين وطلب المساعدة
// ==========================================
async function submitBeneficiary(e) {
    e.preventDefault();
    const payload = {
        action: 'submitBeneficiary',
        title: document.getElementById('benTitle').value,
        desc: document.getElementById('benDesc').value,
        reqAmount: document.getElementById('benAmount').value,
        governorate: document.getElementById('benGov').value,
        category: document.getElementById('benCat').value
    };
    
    // فحص ذكي: إذا لم يكن هناك إنترنت، احفظ البيانات في الجوال محلياً!
    if (!navigator.onLine) {
        saveOfflineCase(payload);
        closeModal('beneficiaryModal');
        document.getElementById('beneficiaryModal').querySelector('form').reset();
        return;
    }
    
    // إذا كان هناك إنترنت، أرسلها للخادم طبيعياً
    submitData(payload, 'btnSubmitBen', 'benStatus', 'beneficiaryModal');
}

function saveOfflineCase(payload) {
    let offline
