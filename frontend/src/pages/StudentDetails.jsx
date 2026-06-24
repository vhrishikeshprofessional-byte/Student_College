import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Droplet,
  GraduationCap,
  Landmark,
  Mail,
  Pencil,
  Phone,
  RefreshCcw,
  Save,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api, getApiMessage } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

const notAvailable = "Not available";

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function titleize(value) {
  if (!hasValue(value)) {
    return notAvailable;
  }
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getField(source, keys, fallback = notAvailable) {
  const match = keys.find((key) => hasValue(source?.[key]));
  return match ? source[match] : fallback;
}

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatCurrency(value) {
  const numberValue = toNumber(value);
  if (numberValue === null) {
    return notAvailable;
  }
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(numberValue);
}

function formatDiscount(value) {
  const numberValue = toNumber(value);
  if (numberValue === null) {
    return notAvailable;
  }
  return numberValue <= 100 ? `${numberValue}%` : formatCurrency(numberValue);
}

function calculatePayableFee(fee, discount) {
  const feeValue = toNumber(fee);
  const discountValue = toNumber(discount) ?? 0;
  if (feeValue === null) {
    return null;
  }
  const discountAmount =
    discountValue <= 100 ? (feeValue * discountValue) / 100 : discountValue;
  return Math.max(feeValue - discountAmount, 0);
}

function formatMarks(value) {
  const numberValue = toNumber(value);
  return numberValue === null ? notAvailable : String(numberValue);
}

function getInitials(name) {
  return String(name || "Student")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function normalizeSubjects(student) {
  const subjectEntries = Array.isArray(student.subjects) ? student.subjects : [];
  const marks = student.marks && !Array.isArray(student.marks) ? student.marks : {};

  if (subjectEntries.length) {
    return subjectEntries
      .map((entry) => {
        const subject = typeof entry === "object" ? entry.subject : entry;
        return {
          marks:
            typeof entry === "object"
              ? entry.marks ?? entry.subject_marks ?? marks?.[subject]
              : marks?.[subject],
          subject,
        };
      })
      .filter((entry) => hasValue(entry.subject));
  }

  return Object.entries(marks || {}).map(([subject, marksValue]) => ({
    marks: marksValue,
    subject,
  }));
}

function normalizeTeacher(teacher) {
  if (!teacher) {
    return null;
  }
  if (typeof teacher === "string") {
    return { label: teacher, meta: "" };
  }
  return {
    label: teacher.name || teacher.email || "Assigned faculty",
    meta: [teacher.role, teacher.email].filter(Boolean).join(" - "),
  };
}

function getAssignedTeachers(student, subject) {
  const assignments = student.assigned_teachers;
  if (!assignments || !subject) {
    return [];
  }

  if (Array.isArray(assignments)) {
    return assignments
      .filter((item) => item.subject?.toLowerCase() === String(subject).toLowerCase())
      .map((item) => normalizeTeacher(item.teacher || item))
      .filter(Boolean);
  }

  const matchingKey = Object.keys(assignments).find(
    (key) => key.toLowerCase() === String(subject).toLowerCase(),
  );
  const teacherRows = matchingKey ? assignments[matchingKey] : [];
  return (Array.isArray(teacherRows) ? teacherRows : [teacherRows])
    .map(normalizeTeacher)
    .filter(Boolean);
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <article className="student-detail-row">
      <span>
        <Icon size={17} aria-hidden="true" />
        {label}
      </span>
      <strong>{hasValue(value) ? value : notAvailable}</strong>
    </article>
  );
}

const optionalEditableFields = new Set([
  "phone_number",
  "email",
  "guardian_name",
  "address",
]);

const editableFieldGroups = [
  {
    fields: [
      ["name", "Full Name", "text", "Enter full name"],
      ["phone_number", "Phone Number", "tel", "Enter phone number"],
      ["email", "Mail ID", "email", "Enter mail ID"],
      ["gender", "Gender", "select", ""],
      ["blood_group", "Blood Group", "text", "Enter blood group"],
      ["course", "Course", "text", "Enter course"],
    ],
    title: "Personal details",
  },
  {
    fields: [
      ["bank_name", "Bank Name", "text", "Enter bank name"],
      ["bank_account_number", "Account Number", "text", "Enter account number"],
      ["bank_branch", "Bank Branch", "text", "Enter bank branch"],
      ["guardian_name", "Guardian Name", "text", "Enter guardian name"],
      ["address", "Address", "text", "Enter address"],
    ],
    title: "Bank and guardian details",
  },
];

function buildEditForm(student, user) {
  return {
    address: student.address ?? "",
    bank_account_number: student.bank_account_number ?? "",
    bank_branch: student.bank_branch ?? "",
    bank_name: student.bank_name ?? "",
    blood_group: student.blood_group ?? "",
    course: student.course ?? "",
    email: student.email ?? (user?.role === "student" ? user.email : "") ?? "",
    gender: student.gender ?? "",
    guardian_name: student.guardian_name ?? "",
    name: student.name ?? "",
    phone_number: student.phone_number ?? "",
  };
}

function StudentProfile({ student, user, onStudentSaved }) {
  const subjects = useMemo(() => normalizeSubjects(student), [student]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(() => buildEditForm(student, user));
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const numericMarks = subjects
    .map((subject) => toNumber(subject.marks))
    .filter((mark) => mark !== null);
  const averageMarks = numericMarks.length
    ? Math.round(numericMarks.reduce((sum, mark) => sum + mark, 0) / numericMarks.length)
    : null;
  const maxMark = Math.max(...numericMarks, 100);
  const payableFee = calculatePayableFee(student.fee, student.discount);
  const status = getField(student, ["status"], "Student");
  const currentUserEmail = user?.role === "student" ? user.email : "";
  const hasFinancialDetails = [
    "fee",
    "discount",
    "bank_account_number",
    "bank_name",
    "bank_branch",
  ].some((key) => hasValue(student[key]));
  const canEditDetails =
    user?.role === "student" &&
    (!hasValue(user.student_id) || Number(user.student_id) === Number(student.id));

  useEffect(() => {
    if (!isEditing) {
      setFormData(buildEditForm(student, user));
    }
  }, [isEditing, student, user]);

  function updateFormField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submitStudentDetails(event) {
    event.preventDefault();
    setSaveError("");
    setSaveMessage("");
    setIsSaving(true);

    const payload = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => {
        const trimmed = typeof value === "string" ? value.trim() : value;
        return [key, optionalEditableFields.has(key) && trimmed === "" ? null : trimmed];
      }),
    );

    try {
      const { data } = await api.put(`/v1/student/${student.id}`, payload);
      onStudentSaved(data.student);
      setIsEditing(false);
      setSaveMessage("Details updated successfully.");
    } catch (err) {
      setSaveError(getApiMessage(err, "Unable to update student details"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="student-dossier">
      <section className="student-dashboard-section" aria-label="Student dashboard">
        <div className="student-identity-panel">
          <div className="student-avatar" aria-hidden="true">
            {getInitials(student.name)}
          </div>
          <div>
            <span className="eyebrow">Dashboard</span>
            <h3>{getField(student, ["name"], "Student")}</h3>
            <p>
              Student profile for {titleize(getField(student, ["course"], "course"))}
              {hasValue(student.year) ? ` - Academic year ${student.year}` : ""}
            </p>
          </div>
          <span
            className={`student-status-pill ${
              String(status).toLowerCase() === "pass" ? "is-success" : "is-warning"
            }`}
          >
            {titleize(status)}
          </span>
        </div>

        <div className="student-metric-strip">
          <article className="student-metric">
            <span>
              <GraduationCap size={18} aria-hidden="true" />
              Student Type
            </span>
            <strong>Student</strong>
          </article>
          <article className="student-metric">
            <span>
              <ClipboardList size={18} aria-hidden="true" />
              Student ID
            </span>
            <strong>{getField(student, ["id", "student_id", "roll_number"])}</strong>
          </article>
          <article className="student-metric">
            <span>
              <BookOpen size={18} aria-hidden="true" />
              Subjects
            </span>
            <strong>{subjects.length || notAvailable}</strong>
          </article>
          <article className="student-metric">
            <span>
              <ShieldCheck size={18} aria-hidden="true" />
              Average Marks
            </span>
            <strong>{averageMarks ?? notAvailable}</strong>
          </article>
        </div>
      </section>

      {canEditDetails && (
        <section className="student-section edit-profile-section" aria-label="Edit student details">
          <div className="student-section-heading">
            <div>
              <span className="eyebrow">Edit Details</span>
              <h3>Update personal and bank information</h3>
            </div>
            {!isEditing ? (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setSaveError("");
                  setSaveMessage("");
                  setFormData(buildEditForm(student, user));
                  setIsEditing(true);
                }}
              >
                <Pencil size={17} aria-hidden="true" />
                <span>Edit</span>
              </button>
            ) : (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setSaveError("");
                  setFormData(buildEditForm(student, user));
                  setIsEditing(false);
                }}
              >
                <X size={17} aria-hidden="true" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          {saveError && <div className="alert error">{saveError}</div>}
          {saveMessage && <div className="alert success">{saveMessage}</div>}

          {isEditing ? (
            <form className="student-edit-form" onSubmit={submitStudentDetails}>
              {editableFieldGroups.map((group) => (
                <fieldset className="student-edit-fieldset" key={group.title}>
                  <legend>{group.title}</legend>
                  <div className="student-edit-grid">
                    {group.fields.map(([field, label, type, placeholder]) => (
                      <label key={field} className={field === "address" ? "wide-field" : ""}>
                        {label}
                        {type === "select" ? (
                          <select
                            value={formData[field]}
                            onChange={(event) => updateFormField(field, event.target.value)}
                            required
                          >
                            <option value="">Select gender</option>
                            <option value="M">M</option>
                            <option value="F">F</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : field === "address" ? (
                          <textarea
                            value={formData[field]}
                            maxLength={500}
                            placeholder={placeholder}
                            onChange={(event) => updateFormField(field, event.target.value)}
                          />
                        ) : (
                          <input
                            value={formData[field]}
                            type={type}
                            maxLength={field === "email" ? 255 : field === "phone_number" ? 30 : undefined}
                            placeholder={placeholder}
                            onChange={(event) => updateFormField(field, event.target.value)}
                            required={!optionalEditableFields.has(field)}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <div className="student-edit-actions">
                <button className="primary-button" disabled={isSaving} type="submit">
                  <Save size={17} aria-hidden="true" />
                  <span>{isSaving ? "Saving..." : "Save details"}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="edit-profile-summary">
              <DetailRow icon={UserRound} label="Editable Personal Fields" value="Name, phone, mail, gender, blood group, course, guardian and address" />
              <DetailRow icon={Landmark} label="Editable Bank Fields" value="Bank name, account number and branch" />
            </div>
          )}
        </section>
      )}

      <section className="student-section" aria-label="Academic details">
        <div className="student-section-heading">
          <div>
            <span className="eyebrow">Academic Section</span>
            <h3>Subjects, marks and assigned teachers</h3>
          </div>
          <strong>{subjects.length ? `${subjects.length} subjects` : "No subjects"}</strong>
        </div>

        <div className="academic-summary-grid">
          <DetailRow icon={GraduationCap} label="Course" value={titleize(student.course)} />
          <DetailRow icon={CalendarDays} label="Year" value={student.year} />
          <DetailRow icon={CheckCircle2} label="Academic Status" value={titleize(status)} />
        </div>

        {subjects.length ? (
          <div className="subject-grid">
            {subjects.map((subject) => {
              const markValue = toNumber(subject.marks);
              const progress = markValue === null ? 0 : Math.min((markValue / maxMark) * 100, 100);
              const teachers = getAssignedTeachers(student, subject.subject);

              return (
                <article className="subject-card" key={subject.subject}>
                  <div className="subject-card-top">
                    <div>
                      <span className="subject-icon">
                        <BookOpen size={18} aria-hidden="true" />
                      </span>
                      <div>
                        <strong>{titleize(subject.subject)}</strong>
                        <small>Marks recorded for this subject</small>
                      </div>
                    </div>
                    <span className="mark-pill">{formatMarks(subject.marks)}</span>
                  </div>
                  <div className="mark-track" aria-hidden="true">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <div className="teacher-list">
                    <span>Assigned teachers</span>
                    {teachers.length ? (
                      <div className="teacher-chip-list">
                        {teachers.map((teacher) => (
                          <span className="teacher-chip" key={`${subject.subject}-${teacher.label}`}>
                            <UserRound size={15} aria-hidden="true" />
                            <span>
                              <strong>{teacher.label}</strong>
                              {teacher.meta && <small>{teacher.meta}</small>}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <strong className="muted-value">Faculty to be assigned</strong>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state compact">No academic subject details are visible.</div>
        )}
      </section>

      <section className="student-section" aria-label="Financial details">
        <div className="student-section-heading">
          <div>
            <span className="eyebrow">Financial Details</span>
            <h3>Bank, fee and payment information</h3>
          </div>
          <Wallet size={22} aria-hidden="true" />
        </div>

        {hasFinancialDetails ? (
          <>
            <div className="finance-overview-grid">
              <article>
                <span>Total Fee</span>
                <strong>{formatCurrency(student.fee)}</strong>
              </article>
              <article>
                <span>Discount</span>
                <strong>{formatDiscount(student.discount)}</strong>
              </article>
              <article>
                <span>Net Payable</span>
                <strong>{formatCurrency(payableFee)}</strong>
              </article>
            </div>
            <div className="student-detail-grid">
              <DetailRow icon={Landmark} label="Bank Name" value={student.bank_name} />
              <DetailRow icon={CreditCard} label="Account Number" value={student.bank_account_number} />
              <DetailRow icon={Landmark} label="Bank Branch" value={student.bank_branch} />
              <DetailRow icon={Wallet} label="Fee Status" value={getField(student, ["fee_status", "payment_status"])} />
              <DetailRow icon={ClipboardList} label="Scholarship" value={getField(student, ["scholarship", "concession"])} />
              <DetailRow icon={CalendarDays} label="Last Payment" value={getField(student, ["last_payment_date", "paid_on"])} />
            </div>
          </>
        ) : (
          <div className="empty-state compact">Financial and bank details are not visible for this role.</div>
        )}
      </section>

      <section className="student-section" aria-label="Personal details">
        <div className="student-section-heading">
          <div>
            <span className="eyebrow">Personal Details</span>
            <h3>Name, contact, blood group and identity</h3>
          </div>
          <UserRound size={22} aria-hidden="true" />
        </div>

        <div className="student-detail-grid">
          <DetailRow icon={UserRound} label="Full Name" value={student.name} />
          <DetailRow icon={Phone} label="Phone Number" value={getField(student, ["phone", "phone_number", "mobile", "mobile_number"])} />
          <DetailRow icon={Droplet} label="Blood Group" value={student.blood_group} />
          <DetailRow icon={Mail} label="Mail ID" value={getField(student, ["email", "mail_id", "account_email"], currentUserEmail || notAvailable)} />
          <DetailRow icon={ClipboardList} label="Gender" value={titleize(student.gender)} />
          <DetailRow icon={GraduationCap} label="Course" value={titleize(student.course)} />
          <DetailRow icon={CalendarDays} label="Year" value={student.year} />
          <DetailRow icon={ShieldCheck} label="Status" value={titleize(status)} />
          <DetailRow icon={UserRound} label="Guardian Name" value={getField(student, ["guardian_name", "parent_name", "father_name"])} />
          <DetailRow icon={ClipboardList} label="Address" value={getField(student, ["address", "permanent_address"])} />
        </div>
      </section>
    </div>
  );
}

export default function StudentDetails() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadStudent() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/v1/student/${studentId}`);
      setStudent(data);
    } catch (err) {
      const message = getApiMessage(err, "Unable to load student");
      if (err.response?.status === 403) {
        navigate("/unauthorized", { state: { message }, replace: true });
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <Link className="back-link" to="/students">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Students</span>
          </Link>
          <h2>Student Details</h2>
        </div>
        <button className="secondary-button" type="button" onClick={loadStudent}>
          <RefreshCcw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>
      {error && <div className="alert error">{error}</div>}
      {loading && <div className="screen-message inline">Loading student...</div>}
      {!loading && student && (
        <StudentProfile
          student={student}
          user={user}
          onStudentSaved={setStudent}
        />
      )}
    </div>
  );
}
