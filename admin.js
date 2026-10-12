// ⚠️ ضع الرابط الجديد لـ Google Apps Script بعد عمل (إصدار جديد)
const API_URL = "https://script.google.com/macros/s/AKfycbyy2Q69kwtZKExOtOMAetY67KLLd3W5WdGunwNtUQdVYyL7NIZp-zQNruxlK4txMZF0kw/exec";

let adminData = null;

function checkAuth() {
    const role = sessionStorage.getItem('userRole');
    const name = sessionStorage.getItem('userName');
    if (!role || (!role.includes('مدير') && !role.includes('قائد'))) {
        window.location.href = 'index.html'; return;
    }
    document.getElementById('adminName').innerText = `مرحباً بك أ. ${name}`;
    fetchAdminData();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

function showSection(sectionId, element) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');
    if(window.innerWidth <= 768) toggleSidebar();
}

async function fetchAdminData() {
    document.getElementById('loading').style.display = 'flex';
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getAdminData' }) });
        adminData = await res.json();
        
        populateDashboard();
        populateCasesTable();
        populateVolunteersTable();
        populateUsersTable();
        populateSettingsForm();
        populateTasksSection(); // الدالة الجديدة للمهام
        
    } catch (e) { alert("حدث خطأ أثناء جلب البيانات."); } 
    finally { document.getElementById('loading').style.display = 'none'; }
}

function populateDashboard() {
    document.getElementById('statTotalCases').innerText = adminData.cases.length;
    document.getElementById('statPendingCases').innerText = adminData.cases.filter(c => c.Status === 'مسودة').length;
    document.getElementById('statVolunteers').innerText = adminData.volunteers.length;
}

function populateCasesTable() {
    const tbody = document.getElementById('casesTableBody');
    tbody.innerHTML = '';
    
    [...adminData.cases].reverse().forEach(c => {
        const isDraft = c.Status === 'مسودة';
        const badgeClass = isDraft ? 'status-draft' : 'status-pub';
        
        let actionButtons = '';
        if (isDraft) {
            actionButtons = `<button class="btn-approve" onclick="changeCaseStatus('${c.CaseID}', 'منشورة')">اعتماد ونشر</button>`;
        } else if (c.Status === 'منشورة') {
            actionButtons = `<button class="btn-reject" onclick="changeCaseStatus('${c.CaseID}', 'مغلقة')">إغلاق وتوليد PDF</button>`;
        }

        let folderLink = c.FolderURL && c.FolderURL.startsWith('http') ? `<a href="${c.FolderURL}" target="_blank" style="color:#0a2240; font-weight:bold;"><i class="fas fa-folder-open"></i> المجلد</a>` : 'لا يوجد';
        if (c.ReportURL && c.ReportURL.startsWith('http')) {
             folderLink += `<br><a href="${c.ReportURL}" target="_blank" style="color:#e63946; font-size:0.8rem;"><i class="fas fa-file-pdf"></i> تقرير الشفافية</a>`;
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>${c.CaseID}</strong></td>
                <td>${c.Category} - ${c.Title}</td>
                <td>${Number(c.Required).toLocaleString()} ريال</td>
                <td><span class="status-badge ${badgeClass}">${c.Status}</span></td>
                <td>${folderLink}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });
}

function populateTasksSection() {
    // تعبئة قوائم الإسناد المنسدلة
    const caseSelect = document.getElementById('taskCaseId');
    const volSelect = document.getElementById('taskVolunteer');
    caseSelect.innerHTML = '<option value="">اختر الحالة...</option>';
    volSelect.innerHTML = '<option value="">اختر المتطوع...</option>';
    
    adminData.cases.filter(c => c.Status !== 'مغلقة').forEach(c => {
        caseSelect.innerHTML += `<option value="${c.CaseID}">${c.CaseID} - ${c.Title}</option>`;
    });
    adminData.volunteers.forEach(v => {
        volSelect.innerHTML += `<option value="${v.FullName}">${v.FullName} (${v.Governorate})</option>`;
    });

    // تعبئة جدول المهام السابقة
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = '';
    if(adminData.tasks) {
        [...adminData.tasks].reverse().forEach(t => {
            tbody.innerHTML += `<tr><td>${t.CaseID}</td><td>${t.VolunteerName}</td><td>${t.TaskDesc}</td><td>${t.Date.split('T')[0]}</td></tr>`;
        });
    }
}

function populateVolunteersTable() {
    const tbody = document.getElementById('volunteersTableBody');
    tbody.innerHTML = '';
    [...adminData.volunteers].reverse().forEach(v => {
        tbody.innerHTML += `<tr><td><strong>${v.FullName}</strong></td><td>${v.Governorate}</td><td><a href="https://wa.me/${v.Phone}" target="_blank" style="color:#25D366;"><i class="fab fa-whatsapp"></i> ${v.Phone}</a></td><td>${v.Skills}</td></tr>`;
    });
}

function populateUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    adminData.users.forEach(u => {
        tbody.innerHTML += `<tr><td>${u.FullName}</td><td>${u.Username}</td><td><span class="status-badge status-pub">${u.Role}</span></td></tr>`;
    });
}

function populateSettingsForm() {
    const s = {};
    adminData.settings.forEach(item => s[item.SettingKey] = item.SettingValue);
    if(s.Facebook) document.getElementById('setFacebook').value = s.Facebook;
    if(s.Whatsapp) document.getElementById('setWhatsapp').value = s.Whatsapp;
    if(s.Twitter) document.getElementById('setTwitter').value = s.Twitter;
    if(s.HeroBgImage) document.getElementById('setHeroBg').value = s.HeroBgImage;
}

// ================= العمليات التفاعلية ================= //

async function changeCaseStatus(caseId, newStatus) {
    let reportDetails = '';
    
    // إذا كان الإجراء هو إغلاق الحالة، نطلب تفاصيل التقرير لتوليد الـ PDF
    if(newStatus === 'مغلقة') {
        reportDetails = prompt("اكتب ملخصاً لعملية الصرف ليتم اعتماده آلياً في تقرير الشفافية (PDF):", "تم استلام التبرعات بالكامل وشراء الاحتياجات وتسليمها للمستفيد.");
        if (reportDetails === null) return; // تم الإلغاء
    } else {
        if(!confirm(`تأكيد تغيير حالة الملف إلى: ${newStatus}؟`)) return;
    }
    
    document.getElementById('loading').style.display = 'flex';
    const payload = { action: 'updateCaseStatus', caseId: caseId, newStatus: newStatus, reportDetails: reportDetails, adminUser: sessionStorage.getItem('userName') };
    
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        if(result.status === 'success') fetchAdminData();
        else alert(result.message);
    } catch(e) { alert("حدث خطأ"); document.getElementById('loading').style.display = 'none'; }
}

async function handleAssignTask(e) {
    e.preventDefault();
    const btn = document.getElementById('btnAssignTask');
    const msg = document.getElementById('taskStatusMsg');
    btn.disabled = true; btn.innerText = "جاري الإسناد...";
    
    const payload = {
        action: 'assignTask',
        caseId: document.getElementById('taskCaseId').value,
        volunteerName: document.getElementById('taskVolunteer').value,
        taskDesc: document.getElementById('taskDesc').value
    };

    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        msg.style.color = result.status === 'success' ? 'green' : 'red';
        msg.innerText = result.message;
        if(result.status === 'success') { document.getElementById('assignTaskForm').reset(); fetchAdminData(); }
    } catch(e) { msg.style.color = 'red'; msg.innerText = "حدث خطأ"; }
    finally { btn.disabled = false; btn.innerText = "إسناد المهمة"; }
}

async function addUser(e) {
    e.preventDefault();
    const payload = {
        action: 'addUser',
        fullName: document.getElementById('newFullName').value,
        username: document.getElementById('newUsername').value,
        password: document.getElementById('newPassword').value,
        role: document.getElementById('newRole').value,
        governorate: document.getElementById('newGov').value
    };
    const btn = document.getElementById('btnAddUser');
    const msg = document.getElementById('userStatusMsg');
    btn.disabled = true; btn.innerText = "جاري الإضافة...";
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        msg.style.color = result.status === 'success' ? 'green' : 'red';
        msg.innerText = result.message;
        if(result.status === 'success') { document.getElementById('addUserForm').reset(); fetchAdminData(); }
    } catch(e) { msg.style.color = 'red'; msg.innerText = "حدث خطأ"; }
    finally { btn.disabled = false; btn.innerText = "إضافة المستخدم"; }
}

async function saveSettings(e) {
    e.preventDefault();
    const payload = {
        action: 'saveSettings',
        settingsData: {
            Facebook: document.getElementById('setFacebook').value,
            Whatsapp: document.getElementById('setWhatsapp').value,
            Twitter: document.getElementById('setTwitter').value,
            HeroBgImage: document.getElementById('setHeroBg').value
        }
    };
    const btn = document.getElementById('btnSaveSettings');
    const msg = document.getElementById('settingsStatusMsg');
    btn.disabled = true; btn.innerText = "جاري الحفظ...";
    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        msg.style.color = result.status === 'success' ? 'green' : 'red';
        msg.innerText = result.message;
    } catch(e) { msg.style.color = 'red'; msg.innerText = "حدث خطأ"; }
    finally { btn.disabled = false; btn.innerText = "حفظ الإعدادات"; }
}
