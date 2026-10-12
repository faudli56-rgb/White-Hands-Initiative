const API_URL = "https://script.google.com/macros/s/AKfycbwfsGOzMDVj3eClJdqFrZ8wD08XqgkktaX6HN7hBnXhA_e6pBbU0xTaaAW8V1h3-oIvXQ/exec";
let globalCases = [];

function toggleMenu() { document.getElementById('sideMenu').classList.toggle('open'); }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// التمرير السلس لأقسام الصفحة
function scrollToSection(id) {
    const el = document.getElementById(id);
    if(el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('sideMenu').classList.remove('open');
    }
}

// 1. جلب الإعدادات (السوشيال ميديا والخلفيات)
async function fetchSettings() {
    try {
        const res = await fetch(`${API_URL}?action=getSettings`);
        const settings = await res.json();
        
        // ربط أيقونات التواصل الاجتماعي بالأعلى
        if(settings.Facebook) document.getElementById('linkFacebook').href = settings.Facebook;
        if(settings.Twitter) document.getElementById('linkTwitter').href = settings.Twitter;
        if(settings.Whatsapp) document.getElementById('linkWhatsappTop').href = settings.Whatsapp;
        
        if(settings.HeroBgImage) {
            document.getElementById('heroTarget').style.backgroundImage = `url('${settings.HeroBgImage}')`;
        }
    } catch (e) { console.error("Error loading settings", e); }
}

// 2. جلب الحسابات البنكية لنافذة التبرع
async function fetchBanks() {
    const container = document.getElementById('banksContainer');
    try {
        const res = await fetch(`${API_URL}?action=getBanks`);
        const banks = await res.json();
        container.innerHTML = '';
        
        if(banks.length === 0) {
            container.innerHTML = '<p>لا توجد حسابات بنكية مضافة حالياً.</p>';
            return;
        }
        
        banks.forEach(b => {
            container.innerHTML += `
                <div class="bank-item">
                    <strong>${b.BankName}</strong>
                    <small>باسم: ${b.AccountName}</small>
                    <span>${b.AccountNumber}</span>
                </div>
            `;
        });
    } catch (e) {
        container.innerHTML = '<p style="color:red;">تعذر جلب الحسابات البنكية.</p>';
    }
}

// 3. جلب وعرض الحالات
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
                <div class="progress-bg"><div class="progress-fill" style="width: ${percent}%"></div></div>
                <div class="case-stats">
                    <span style="color:var(--danger)">متبقي: ${remaining.toLocaleString()} ريال</span>
                    <span style="color:var(--primary)">${Math.round(percent)}%</span>
                </div>
                <button onclick="openModal('donateModal')" class="btn-solid-gold w-100 mt-10" style="display:block; text-align:center; border:none; padding:10px; cursor:pointer;">
                   ساهم في الإغلاق <i class="fas fa-heart"></i>
                </button>
            </div>
        `;
    });
}

// إرسال النماذج وتسجيل الدخول
async function submitData(payload, btnId, statusId, modalId) {
    // ... [نفس كود دالة submitData الموجود لديك سابقاً دون تغيير] ...
}

async function handleLogin(e) {
    // ... [نفس كود دالة handleLogin المحدثة سابقاً التي توجهك للـ admin.html] ...
}

// بدء التشغيل التلقائي عند فتح الموقع
window.onload = () => {
    fetchSettings();
    fetchBanks();
    fetchCases();
};
