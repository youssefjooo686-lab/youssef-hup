// =====================================================
// Youssef Soliman - Student Hub
// Student Management System | JavaScript Project
// =====================================================

"use strict";

// 1) Array: جميع الطلاب المسجلين
let studentsList = [];

// 2) Student Class + Encapsulation باستخدام Private Fields
class Student {
  #grade1;
  #grade2;
  #grade3;
  #attendance;

  constructor({ name, studentId, phone, grade1, grade2, grade3, attendance }) {
    if (!name || !name.trim()) {
      throw new Error("من فضلك أدخل اسم الطالب.");
    }
    if (!studentId || !studentId.trim()) {
      throw new Error("من فضلك أدخل ID الطالب.");
    }

    this.name = name.trim();
    this.studentId = studentId.trim();
    this.phone = (phone || "").trim();
    this.grade1 = grade1;
    this.grade2 = grade2;
    this.grade3 = grade3;
    this.attendance = attendance;
  }

  #validateScore(value, fieldName) {
    if (value === "" || value === null || value === undefined) {
      throw new Error(`حقل "${fieldName}" مطلوب ولا يمكن تركه فارغًا.`);
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 100) {
      throw new Error(`يجب أن تكون قيمة "${fieldName}" رقمًا من 0 إلى 100.`);
    }
    return number;
  }

  set grade1(value) { this.#grade1 = this.#validateScore(value, "المادة الأولى"); }
  set grade2(value) { this.#grade2 = this.#validateScore(value, "المادة الثانية"); }
  set grade3(value) { this.#grade3 = this.#validateScore(value, "المادة الثالثة"); }
  set attendance(value) { this.#attendance = this.#validateScore(value, "نسبة الحضور"); }

  get grade1() { return this.#grade1; }
  get grade2() { return this.#grade2; }
  get grade3() { return this.#grade3; }
  get attendance() { return this.#attendance; }

  get average() {
    return (this.#grade1 + this.#grade2 + this.#grade3) / 3;
  }

  get mercyEligible() {
    return this.average >= 40 && this.average < 50;
  }

  get mercyPoints() {
    return this.mercyEligible ? 5 : 0;
  }

  get finalAverage() {
    return Math.min(100, this.average + this.mercyPoints);
  }

  get status() {
    return this.finalAverage >= 50 ? "pass" : "fail";
  }

  get verbalGrade() {
    const value = this.finalAverage;
    if (value >= 90) return "ممتاز";
    if (value >= 80) return "جيد جداً";
    if (value >= 70) return "جيد";
    if (value >= 60) return "مقبول مرتفع";
    if (value >= 50) return "مقبول";
    if (value >= 40) return "ضعيف";
    return "ضعيف جداً";
  }

  toJSON() {
    return {
      name: this.name,
      studentId: this.studentId,
      phone: this.phone,
      grade1: this.grade1,
      grade2: this.grade2,
      grade3: this.grade3,
      attendance: this.attendance
    };
  }
}

// 3) DOM: الإمساك بعناصر الصفحة باستخدام getElementById
const $ = (id) => document.getElementById(id);

const studentForm = $("studentForm");
const formError = $("formError");
const studentNameInput = $("studentName");
const studentIdInput = $("studentId");
const studentPhoneInput = $("studentPhone");
const grade1Input = $("grade1");
const grade2Input = $("grade2");
const grade3Input = $("grade3");
const attendanceInput = $("attendance");
const editingIdInput = $("editingId");

const studentsTableBody = $("studentsTableBody");
const recentStudents = $("recentStudents");
const searchInput = $("searchInput");
const statusFilter = $("statusFilter");
const mercyReport = $("mercyReport");

const toastElement = $("appToast");
const appToast = window.bootstrap ? new bootstrap.Toast(toastElement, { delay: 2600 }) : null;

// حماية النصوص قبل إدراجها في innerHTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function showToast(message) {
  $("toastMessage").textContent = message;
  if (appToast) appToast.show();
}

function showFormError(message) {
  formError.textContent = message;
  formError.classList.remove("d-none");
}

function clearFormError() {
  formError.textContent = "";
  formError.classList.add("d-none");
}

function getStudentFormData() {
  return {
    name: studentNameInput.value,
    studentId: studentIdInput.value,
    phone: studentPhoneInput.value,
    grade1: grade1Input.value,
    grade2: grade2Input.value,
    grade3: grade3Input.value,
    attendance: attendanceInput.value
  };
}

// التخزين المحلي حتى لا تضيع البيانات عند إغلاق الصفحة
function saveToStorage() {
  try {
    localStorage.setItem("youssefStudentHubData", JSON.stringify(studentsList));
  } catch (error) {
    showToast("تعذر حفظ البيانات على هذا المتصفح.");
  }
}

function loadFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem("youssefStudentHubData") || "[]");
    studentsList = saved.map((item) => new Student(item));
  } catch (error) {
    studentsList = [];
    showToast("تعذر قراءة البيانات المحفوظة؛ تم بدء قائمة جديدة.");
  }
}

// عرض متوسط برقمين عشريين
function formatPercent(value) {
  return `${Number(value).toFixed(2)}%`;
}

function statusBadge(student) {
  return student.status === "pass"
    ? '<span class="status-badge status-pass">ناجح</span>'
    : '<span class="status-badge status-fail">راسب</span>';
}

// تحديث بطاقات لوحة التحكم
function renderDashboard() {
  const total = studentsList.length;
  const average = total ? studentsList.reduce((sum, student) => sum + student.average, 0) / total : 0;
  const attendance = total ? studentsList.reduce((sum, student) => sum + student.attendance, 0) / total : 0;
  const passed = studentsList.filter((student) => student.status === "pass").length;
  const failed = total - passed;
  const rate = total ? (passed / total) * 100 : 0;

  $("totalStudents").textContent = total;
  $("overallAverage").textContent = formatPercent(average);
  $("overallAttendance").textContent = formatPercent(attendance);
  $("successRate").textContent = formatPercent(rate);
  $("passedCount").textContent = passed;
  $("failedCount").textContent = failed;
  $("passedBar").style.width = `${rate}%`;
  $("failedBar").style.width = `${total ? (failed / total) * 100 : 0}%`;

  const recent = [...studentsList].slice(-5).reverse();
  recentStudents.innerHTML = recent.length ? recent.map((student) => `
    <div class="recent-item">
      <div class="recent-avatar">${escapeHTML(student.name.trim().charAt(0) || "؟")}</div>
      <div class="recent-main"><strong>${escapeHTML(student.name)}</strong><span>${escapeHTML(student.studentId)}</span></div>
      <div class="recent-score">${formatPercent(student.average)}</div>
    </div>
  `).join("") : '<div class="empty-state">لا توجد بيانات بعد. ابدأ بإضافة طالب.</div>';
}

// عرض جدول الطلاب مع البحث والفلترة
function renderStudentsTable() {
  const query = searchInput.value.trim().toLowerCase();
  const filter = statusFilter.value;

  const visibleStudents = studentsList.filter((student) => {
    const matchesQuery = [student.name, student.studentId, student.phone]
      .some((value) => String(value).toLowerCase().includes(query));
    const matchesStatus =
      filter === "all" ||
      (filter === "pass" && student.status === "pass") ||
      (filter === "fail" && student.status === "fail") ||
      (filter === "mercy" && student.mercyEligible);
    return matchesQuery && matchesStatus;
  });

  $("tableCount").textContent = `${visibleStudents.length} من ${studentsList.length} طالب`;
  if (!visibleStudents.length) {
    studentsTableBody.innerHTML = '<tr><td colspan="10" class="text-center py-5 text-secondary">لا توجد نتائج مطابقة.</td></tr>';
    return;
  }

  studentsTableBody.innerHTML = visibleStudents.map((student) => {
    const index = studentsList.indexOf(student);
    return `
      <tr>
        <td>${index + 1}</td>
        <td><span class="id-chip">${escapeHTML(student.studentId)}</span></td>
        <td><strong>${escapeHTML(student.name)}</strong></td>
        <td>${escapeHTML(student.phone || "—")}</td>
        <td class="subjects-cell">${student.grade1} / ${student.grade2} / ${student.grade3}</td>
        <td><strong>${formatPercent(student.average)}</strong></td>
        <td>${formatPercent(student.attendance)}</td>
        <td>${escapeHTML(student.verbalGrade)}</td>
        <td>${statusBadge(student)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-action edit-action" data-action="edit" data-id="${escapeHTML(student.studentId)}" title="تعديل" aria-label="تعديل">✎</button>
            <button class="icon-action delete-action" data-action="delete" data-id="${escapeHTML(student.studentId)}" title="حذف" aria-label="حذف">×</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderAll() {
  renderDashboard();
  renderStudentsTable();
  updatePreview();
}

function resetStudentForm() {
  studentForm.reset();
  editingIdInput.value = "";
  $("formTitle").textContent = "نموذج تسجيل الطالب";
  $("saveStudentBtn").textContent = "حفظ بيانات الطالب";
  clearFormError();
  updatePreview();
}

function editStudent(studentId) {
  const student = studentsList.find((item) => item.studentId === studentId);
  if (!student) return;

  editingIdInput.value = student.studentId;
  studentNameInput.value = student.name;
  studentIdInput.value = student.studentId;
  studentPhoneInput.value = student.phone;
  grade1Input.value = student.grade1;
  grade2Input.value = student.grade2;
  grade3Input.value = student.grade3;
  attendanceInput.value = student.attendance;
  $("formTitle").textContent = "تعديل بيانات الطالب";
  $("saveStudentBtn").textContent = "حفظ التعديلات";
  clearFormError();
  showView("students");
  $("studentFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

// حفظ طالب جديد أو تحديث طالب موجود
studentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const student = new Student(getStudentFormData());
    const oldId = editingIdInput.value;

    if (oldId) {
      const duplicate = studentsList.some((item) => item.studentId === student.studentId && item.studentId !== oldId);
      if (duplicate) throw new Error("هذا الـ ID مستخدم لطالب آخر.");
      const index = studentsList.findIndex((item) => item.studentId === oldId);
      if (index === -1) throw new Error("لم يتم العثور على سجل الطالب المراد تعديله.");
      studentsList[index] = student;
      showToast("تم تحديث بيانات الطالب بنجاح.");
    } else {
      const duplicate = studentsList.some((item) => item.studentId.toLowerCase() === student.studentId.toLowerCase());
      if (duplicate) throw new Error("هذا الـ ID مسجل بالفعل. استخدم ID مختلفًا.");
      studentsList.push(student);
      showToast("تمت إضافة الطالب بنجاح.");
    }

    clearFormError();
    saveToStorage();
    renderAll();
    resetStudentForm();
  } catch (error) {
    showFormError(error.message);
  }
});

// حذف وتعديل من الجدول
studentsTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const studentId = button.dataset.id;

  if (button.dataset.action === "edit") {
    editStudent(studentId);
  } else if (button.dataset.action === "delete") {
    const student = studentsList.find((item) => item.studentId === studentId);
    if (!student) return;
    if (confirm(`هل أنت متأكد من حذف الطالب "${student.name}"؟`)) {
      studentsList = studentsList.filter((item) => item.studentId !== studentId);
      saveToStorage();
      renderAll();
      showToast("تم حذف الطالب.");
    }
  }
});

// حساب معاينة النتيجة مباشرة أثناء إدخال الدرجات
function updatePreview() {
  const values = [grade1Input.value, grade2Input.value, grade3Input.value];
  const allPresent = values.every((value) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100);
  const attendanceValid = attendanceInput.value !== "" && Number.isFinite(Number(attendanceInput.value)) && Number(attendanceInput.value) >= 0 && Number(attendanceInput.value) <= 100;

  if (!allPresent) {
    $("previewPercentage").textContent = "—";
    $("previewGrade").textContent = "—";
    $("previewAverage").textContent = "—";
    $("previewStatus").textContent = "—";
    $("previewMercy").textContent = "—";
    $("previewFinal").textContent = "—";
    return;
  }

  const average = values.reduce((sum, value) => sum + Number(value), 0) / 3;
  const mercy = average >= 40 && average < 50 ? 5 : 0;
  const finalAverage = Math.min(100, average + mercy);
  const grade = finalAverage >= 90 ? "ممتاز" : finalAverage >= 80 ? "جيد جداً" : finalAverage >= 70 ? "جيد" : finalAverage >= 60 ? "مقبول مرتفع" : finalAverage >= 50 ? "مقبول" : finalAverage >= 40 ? "ضعيف" : "ضعيف جداً";

  $("previewPercentage").textContent = formatPercent(average);
  $("previewGrade").textContent = grade;
  $("previewAverage").textContent = formatPercent(average);
  $("previewStatus").textContent = finalAverage >= 50 ? "ناجح" : "راسب";
  $("previewMercy").textContent = mercy ? "+5 درجات" : "لا توجد";
  $("previewFinal").textContent = formatPercent(finalAverage);
}
[grade1Input, grade2Input, grade3Input, attendanceInput].forEach((input) => input.addEventListener("input", updatePreview));

// لجنة الرأفة: Filter + Map + Reduce
function runMercyAnalysis() {
  const eligibleStudents = studentsList.filter((student) => student.average >= 40 && student.average < 50);

  const adjustedStudents = eligibleStudents.map((student) => ({
    name: student.name,
    studentId: student.studentId,
    oldAverage: student.average,
    newAverage: Math.min(100, student.average + 5)
  }));

  $("mercyCount").textContent = adjustedStudents.length;
  if (adjustedStudents.length === 0) {
    $("mercyBefore").textContent = "0%";
    $("mercyAfter").textContent = "0%";
    mercyReport.innerHTML = '<div class="empty-state">لا يوجد طلاب متوسطهم من 40 إلى أقل من 50. لا توجد حالات مستحقة للرأفة حالياً.</div>';
    return;
  }

  const sumBefore = adjustedStudents.reduce((sum, student) => sum + student.oldAverage, 0);
  const sumAfter = adjustedStudents.reduce((sum, student) => sum + student.newAverage, 0);
  const averageBefore = sumBefore / adjustedStudents.length;
  const averageAfter = sumAfter / adjustedStudents.length;

  $("mercyBefore").textContent = formatPercent(averageBefore);
  $("mercyAfter").textContent = formatPercent(averageAfter);

  mercyReport.innerHTML = `
    <div class="report-summary-grid">
      <div><span>عدد الطلاب المتعثرين</span><strong>${adjustedStudents.length}</strong></div>
      <div><span>المتوسط العام بعد الرأفة</span><strong>${formatPercent(averageAfter)}</strong></div>
    </div>
    <div class="table-responsive">
      <table class="table align-middle mercy-table">
        <thead><tr><th>#</th><th>ID الطالب</th><th>اسم الطالب</th><th>قبل الرأفة</th><th>درجات الرأفة</th><th>بعد الرأفة</th></tr></thead>
        <tbody>
          ${adjustedStudents.map((student, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHTML(student.studentId)}</td>
              <td><strong>${escapeHTML(student.name)}</strong></td>
              <td>${formatPercent(student.oldAverage)}</td>
              <td><span class="mercy-points">+5</span></td>
              <td><strong class="after-score">${formatPercent(student.newAverage)}</strong></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <p class="report-footnote">تم حساب المتوسط الجديد لأغراض تقرير لجنة الرأفة فقط، ولم يتم تغيير الدرجات الأصلية للطلاب.</p>
  `;
}

// تصدير ملف CSV متوافق مع Excel
function exportCSV() {
  if (!studentsList.length) {
    showToast("لا توجد بيانات لتصديرها.");
    return;
  }

  const headers = ["ID الطالب", "اسم الطالب", "رقم الهاتف", "المادة الأولى", "المادة الثانية", "المادة الثالثة", "المتوسط", "الحضور", "التقدير", "درجات الرأفة", "النتيجة بعد الرأفة", "الحالة"];
  const rows = studentsList.map((student) => [
    student.studentId, student.name, student.phone,
    student.grade1, student.grade2, student.grade3,
    student.average.toFixed(2), student.attendance,
    student.verbalGrade, student.mercyPoints,
    student.finalAverage.toFixed(2), student.status === "pass" ? "ناجح" : "راسب"
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Youssef_Soliman_Student_Results.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("تم تجهيز ملف CSV للتنزيل.");
}

// التنقل بين أقسام لوحة التحكم
function showView(viewName) {
  document.querySelectorAll(".view-section").forEach((section) => section.classList.remove("active"));
  const target = $(`${viewName}View`);
  if (target) target.classList.add("active");

  document.querySelectorAll(".side-nav .nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  $("sidebar").classList.remove("sidebar-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});
document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    showView(button.dataset.go);
    if (button.dataset.go === "students") studentNameInput.focus({ preventScroll: true });
  });
});

$("newStudentBtn").addEventListener("click", () => {
  resetStudentForm();
  $("studentFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  studentNameInput.focus({ preventScroll: true });
});
$("cancelFormBtn").addEventListener("click", resetStudentForm);
$("runMercyBtn").addEventListener("click", runMercyAnalysis);
$("exportBtn").addEventListener("click", exportCSV);
$("sidebarExport").addEventListener("click", exportCSV);
searchInput.addEventListener("input", renderStudentsTable);
statusFilter.addEventListener("change", renderStudentsTable);
$("mobileMenu").addEventListener("click", () => $("sidebar").classList.toggle("sidebar-open"));

// التاريخ الحالي
$("todayLabel").textContent = new Intl.DateTimeFormat("ar-EG", {
  year: "numeric", month: "long", day: "numeric"
}).format(new Date());

// تشغيل التطبيق
loadFromStorage();
renderAll();
