// ⚠️ ضع رابط سكربت جوجل هنا
const API_URL = "https://script.google.com/macros/s/AKfycbwfsGOzMDVj3eClJdqFrZ8wD08XqgkktaX6HN7hBnXhA_e6pBbU0xTaaAW8V1h3-oIvXQ/exec";

let adminData = null;

// 1. التحقق من صلاحية الدخول
function checkAuth() {
    const role = sessionStorage.getItem('userRole');
    const name = sessionStorage.getItem('userName');
    
    // إذا لم يكن مسجلاً الدخول كمدير أو قائد فريق، اطرده للصفحة الرئيسية
    if (role !== 'مدير' && role !== 'قائد فريق') {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('adminName').innerText = `مرحباً بك أ. ${name}`;
    fetchAdminData();
}

// 2. التحكم بالقائمة الجانبية (للجوال) والتنقل
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function showSection(sectionId, element) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');
    
    if(window.innerWidth <= 768) toggleSidebar();
}

// 3. جلب بيانات الإدارة المركزية
async function fetchAdminData() {
    document.getElementById('loading').style.display = 'flex';
    try {
        const payload = { action: 'getAdminData' };
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        
        adminData = result;
        populateDashboard();
        populateCasesTable();
        populateVolunteersTable();
        populateUsersTable();
        populateSettingsForm();
        
    } catch (e) {
        alert("حدث خطأ أثناء جلب البيانات من الخادم.");
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// 4. تعبئة الجداول والبيانات
function populateDashboard() {
    document.getElementById('statTotalCases').innerText = adminData.cases.length;
    const pendingCases = adminData.cases.filter(c => c.Status === 'مسودة').length;
    document.getElementById('statPendingCases').innerText = pendingCases;
    document.getElementById('statVolunteers').innerText = adminData.volunteers.length;
}

function populateCasesTable() {
    const tbody = document.getElementById('casesTableBody');
    tbody.innerHTML = '';
    
    // عكس المصفوفة لعرض الأحدث أولاً
    [...adminData.cases].reverse().forEach(c => {
        const isDraft = c.Status === 'مسودة';
        const badgeClass = isDraft ? 'status-draft' : 'status-pub';
        
        let actionButtons = '';
        if (isDraft) {
            actionButtons = `<button class="btn-approve" onclick="changeCaseStatus('${c.CaseID}', 'منشورة')">اعتماد ونشر</button>`;
        } else if (c.Status === 'منشورة') {
            actionButtons = `<button class="btn-reject" onclick="changeCaseStatus('${c.CaseID}', 'مغلقة')">إغلاق الحالة</button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>${c.CaseID}</strong></td>
                <td>${c.Category} - ${c.Title}</td>
                <td>${Number(c.Required).toLocaleString()} ريال</td>
                <td>${c.Governorate}</td>
                <td><span class="status-badge ${badgeClass}">${c.Status}</span></td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });
}

function populateVolunteersTable() {
    const tbody = document.getElementById('volunteersTableBody');
    tbody.innerHTML = '';
    [...adminData.volunteers].reverse().forEach(v => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${v.FullName}</strong></td>
                <td>${v.Governorate}</td>
                <td><a href="https://wa.me/${v.Phone}" target="_blank" style="color:#25D366;"><i class="fab fa-whatsapp"></i> ${v.Phone}</a></td>
                <td>${v.Skills}</td>
            </tr>
        `;
    });
}

function populateUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    adminData.users.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.FullName}</td>
                <td>${u.Username}</td>
                <td><span class="status-badge status-pub">${u.Role}</span></td>
                <td>${u.Governorate}</td>
            </tr>
        `;
    });
}

function populateSettingsForm() {
    const settingsObj = {};
    adminData.settings.forEach(item => settingsObj[item.SettingKey] = item.SettingValue);
    
    if(settingsObj.Facebook) document.getElementById('setFacebook').value = settingsObj.Facebook;
    if(settingsObj.Whatsapp) document.getElementById('setWhatsapp').value = settingsObj.Whatsapp;
    if(settingsObj.Twitter) document.getElementById('setTwitter').value = settingsObj.Twitter;
    if(settingsObj.HeroBgImage) document.getElementById('setHeroBg').value = settingsObj.HeroBgImage;
}

// 5. العمليات التفاعلية (الإرسال للخادم)
async function changeCaseStatus(caseId, newStatus) {
    if(!confirm(`هل أنت متأكد أنك تريد تغيير حالة الملف إلى: ${newStatus}؟`)) return;
    
    document.getElementById('loading').style.display = 'flex';
    const payload = {
        action: 'updateCaseStatus',
        caseId: caseId,
        newStatus: newStatus,
        adminUser: sessionStorage.getItem('userName')
    };
    
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        if(result.status === 'success') fetchAdminData(); // إعادة جلب البيانات لتحديث الجدول
        else alert(result.message);
    } catch(e) { alert("حدث خطأ"); }
}

async function addUser(e) {
    e.preventDefault();
    const btn = document.getElementById('btnAddUser');
    const msg = document.getElementById('userStatusMsg');
    btn.disabled = true; btn.innerText = "جاري الإضافة...";
    
    const payload = {
        action: 'addUser',
        fullName: document.getElementById('newFullName').value,
        username: document.getElementById('newUsername').value,
        password: document.getElementById('newPassword').value,
        role: document.getElementById('newRole').value,
        governorate: document.getElementById('newGov').value,
        adminUser: sessionStorage.getItem('userName')
    };

    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        msg.style.color = result.status === 'success' ? 'green' : 'red';
        msg.innerText = result.message;
        if(result.status === 'success') {
            document.getElementById('addUserForm').reset();
            fetchAdminData();
        }
    } catch(e) { msg.style.color = 'red'; msg.innerText = "حدث خطأ"; }
    finally { btn.disabled = false; btn.innerText = "إضافة المستخدم"; }
}

async function saveSettings(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveSettings');
    const msg = document.getElementById('settingsStatusMsg');
    btn.disabled = true; btn.innerText = "جاري الحفظ...";
    
    const payload = {
        action: 'saveSettings',
        adminUser: sessionStorage.getItem('userName'),
        settingsData: {
            'Facebook': document.getElementById('setFacebook').value,
            'Whatsapp': document.getElementById('setWhatsapp').value,
            'Twitter': document.getElementById('setTwitter').value,
            'HeroBgImage': document.getElementById('setHeroBg').value
        }
    };

    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        msg.style.color = result.status === 'success' ? 'green' : 'red';
        msg.innerText = result.message;
    } catch(e) { msg.style.color = 'red'; msg.innerText = "حدث خطأ"; }
    finally { btn.disabled = false; btn.innerText = "حفظ الإعدادات"; }
}

// 6. تسجيل الخروج
function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// بدء التشغيل
window.onload = checkAuth;