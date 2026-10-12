const API_URL = "https://script.google.com/macros/s/AKfycbyy2Q69kwtZKExOtOMAetY67KLLd3W5WdGunwNtUQdVYyL7NIZp-zQNruxlK4txMZF0kw/exec";
let globalCases = [];

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
    
    if (!navigator.onLine) {
        saveOfflineCase(payload);
        closeModal('beneficiaryModal');
        document.getElementById('beneficiaryModal').querySelector('form').reset();
        return;
    }
    
    submitData(payload, 'btnSubmitBen', 'benStatus', 'beneficiaryModal');
}

function saveOfflineCase(payload) {
    let offlineCases = JSON.parse(localStorage.getItem('offlineCases') || '[]');
    offlineCases.push(payload);
    localStorage.setItem('offlineCases', JSON.stringify(offlineCases));
    checkOfflineStatus();
    alert("⚠️ لا يوجد اتصال بالإنترنت حالياً!\nتم حفظ بيانات الحالة في هاتفك، وسيتم رفعها تلقائياً عند عودة الشبكة.");
}

function checkOfflineStatus() {
    let offlineCases = JSON.parse(localStorage.getItem('offlineCases') || '[]');
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        if (offlineCases.length > 0) {
            syncBtn.style.display = 'block';
            const countSpan = document.getElementById('offlineCount');
            if(countSpan) countSpan.innerText = offlineCases.length;
        } else {
            syncBtn.style.display = 'none';
        }
    }
}

async function syncOfflineData() {
    let offlineCases = JSON.parse(localStorage.getItem('offlineCases') || '[]');
    if (offlineCases.length === 0) return;
    
    if (!navigator.onLine) { alert("لا يزال الاتصال مقطوعاً. يرجى الاتصال بالإنترنت أولاً."); return; }
    
    const btn = document.getElementById('syncBtn');
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
    
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'syncOfflineCases', cases: offlineCases }) });
        const result = await res.json();
        if (result.status === 'success') {
            localStorage.removeItem('offlineCases');
            checkOfflineStatus();
            alert("✅ تمت مزامنة جميع الحالات المحفوظة مع قاعدة البيانات بنجاح!");
            fetchCases(); 
        }
    } catch (e) { alert("فشلت المزامنة، يرجى المحاولة لاحقاً."); } 
    finally { if(btn) btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> مزامنة الحالات (<span id="offlineCount">0</span>)'; }
}

async function handleTrackDonation(e) {
    e.preventDefault();
    const btn = document.getElementById('btnTrack');
    const resultsDiv = document.getElementById('trackResults');
    const searchKey = document.getElementById('trackInput').value;
    
    btn.disabled = true; btn.innerHTML = "جاري البحث <i class='fas fa-spinner fa-spin'></i>";
    resultsDiv.innerHTML = '';
    
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'trackDonation', searchKey: searchKey }) });
        const result = await res.json();
        
        if (result.status === 'success' && result.data.length > 0) {
            result.data.forEach(d => {
                resultsDiv.innerHTML += `
                    <div style="background:#f4f7f6; padding:15px; border-radius:8px; margin-bottom:10px; border-right:4px solid #2a9d8f;">
                        <strong style="color:#0a2240; font-size:1.1rem;">المبلغ المساهم به: ${d.Amount} ريال</strong><br>
                        <small style="color:#666;">تم توجيهه للحالة رقم: ${d.CaseID}</small><br>
                        <small style="color:#666;">طريقة الدفع: ${d.Method}</small>
                    </div>
                `;
            });
        } else {
            resultsDiv.innerHTML = '<p style="color:#e63946; text-align:center; font-weight:bold;">لم يتم العثور على سجلات مطابقة لهذا الرقم.</p>';
        }
    } catch (e) { resultsDiv.innerHTML = '<p style="color:#e63946; text-align:center;">خطأ في الاتصال بالسيرفر.</p>'; } 
    finally { btn.disabled = false; btn.innerHTML = 'بحث في السجلات <i class="fas fa-search"></i>'; }
}

window.onload = () => { 
    fetchSettings(); 
    fetchBanks(); 
    fetchCases(); 
    checkOfflineStatus(); 
};

window.addEventListener('online', syncOfflineData);
