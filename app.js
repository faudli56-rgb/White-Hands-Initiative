const API_URL = "https://script.google.com/macros/s/AKfycbyy2Q69kwtZKExOtOMAetY67KLLd3W5WdGunwNtUQdVYyL7NIZp-zQNruxlK4txMZF0kw/exec";

let globalCases = [];

// --- إدارة النوافذ المنبثقة ---
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// --- جلب وعرض الحالات ---
async function fetchCases() {
    const container = document.getElementById('casesList');
    try {
        const res = await fetch(`${API_URL}?action=getCases`);
        globalCases = await res.json();
        renderCases('all');
    } catch (e) {
        container.innerHTML = '<p style="text-align:center; color:red;">تعذر الاتصال بقاعدة البيانات.</p>';
    }
}

function applyFilter(cat, btnElement) {
    document.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    renderCases(cat);
}

function renderCases(filter) {
    const container = document.getElementById('casesList');
    container.innerHTML = '';
    
    const filtered = globalCases.filter(c => filter === 'all' || c.Category === filter);
    
    if(filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666;">لا توجد حالات حالياً.</p>';
        return;
    }

    filtered.forEach(c => {
        const percent = Math.min((c.Collected / c.Required) * 100, 100);
        const remaining = c.Required - c.Collected;
        const isUrgent = c.Category === 'فزعة' || c.Category === 'عاجلة';

        container.innerHTML += `
            <div class="case-card ${isUrgent ? 'urgent' : ''}">
                <small style="color:#666;">${c.CaseID} | ${c.Governorate}</small>
                <h3 style="color:var(--primary); margin:5px 0;">${c.Title}</h3>
                <div class="progress-container">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="case-stats">
                    <span style="color:var(--danger)">متبقي: ${remaining.toLocaleString()} ريال</span>
                    <span style="color:var(--primary)">${Math.round(percent)}%</span>
                </div>
                <a href="https://wa.me/967700000000?text=أرغب بالمساهمة في الحالة ${c.CaseID}" target="_blank" 
                   style="display:block; background:var(--primary); color:white; text-align:center; padding:10px; border-radius:8px; margin-top:12px; text-decoration:none; font-weight:bold;">
                   ساهم في الإغلاق
                </a>
            </div>
        `;
    });
}

// --- إرسال النماذج ---
async function submitData(payload, btnId, statusId, modalId) {
    const btn = document.getElementById(btnId);
    const status = document.getElementById(statusId);
    const originalText = btn.innerText;
    
    btn.disabled = true;
    btn.innerText = "جاري الإرسال...";
    
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        
        status.style.color = result.status === 'success' ? 'green' : 'red';
        status.innerText = result.message;
        
        if(result.status === 'success') {
            setTimeout(() => {
                closeModal(modalId);
                status.innerText = '';
            }, 3000);
        }
    } catch (e) {
        status.style.color = 'red';
        status.innerText = "حدث خطأ في الاتصال.";
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

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

// بدء التشغيل
window.onload = fetchCases;