from app.core.database import Base, SessionLocal, engine
from app.core.security import get_password_hash
from app.models import ProfessorSubjectAccess, Student, User


STUDENTS = [
    {
        "id": 1,
        "name": "Raju",
        "gender": "M",
        "blood_group": "A+",
        "phone_number": "9876543210",
        "email": "raju@student.com",
        "course": "MPC",
        "status": "Pass",
        "bank_account_number": "4343",
        "bank_name": "HDFC",
        "bank_branch": "HYD",
        "guardian_name": "Raju Parent",
        "address": "Hyderabad",
        "subjects": ["maths", "physics", "chemistry"],
        "marks": {"maths": 140, "physics": 130, "chemistry": 140},
        "fee": 30000,
        "discount": 15,
        "year": 2024,
    },
    {
        "id": 2,
        "name": "Ravi",
        "gender": "M",
        "blood_group": "B+",
        "phone_number": "9876543211",
        "email": "ravi@student.com",
        "course": "MPC",
        "status": "Pass",
        "bank_account_number": "4345",
        "bank_name": "HDFC",
        "bank_branch": "HYD",
        "guardian_name": "Ravi Parent",
        "address": "Hyderabad",
        "subjects": ["maths", "physics", "chemistry"],
        "marks": {"maths": 120, "physics": 115, "chemistry": 115},
        "fee": 30000,
        "discount": 0,
        "year": 2024,
    },
    {
        "id": 3,
        "name": "Rani",
        "gender": "F",
        "blood_group": "O+",
        "phone_number": "9876543212",
        "email": "rani@student.com",
        "course": "MPC",
        "status": "Fail",
        "bank_account_number": "4346",
        "bank_name": "HDFC",
        "bank_branch": "HYD",
        "guardian_name": "Rani Parent",
        "address": "Hyderabad",
        "subjects": ["maths", "physics", "chemistry"],
        "marks": {"maths": 50, "physics": 45, "chemistry": 55},
        "fee": 30000,
        "discount": 45,
        "year": 2024,
    },
    {
        "id": 4,
        "name": "Ram",
        "gender": "M",
        "blood_group": "A+",
        "phone_number": "9876543213",
        "email": "ram@student.com",
        "course": "BiPC",
        "status": "Pass",
        "bank_account_number": "4347",
        "bank_name": "HDFC",
        "bank_branch": "HYD",
        "guardian_name": "Ram Parent",
        "address": "Hyderabad",
        "subjects": ["biology"],
        "marks": {"biology": 321},
        "fee": 50000,
        "discount": 7,
        "year": 2024,
    },
    {
        "id": 5,
        "name": "Sita",
        "gender": "F",
        "blood_group": "O-",
        "phone_number": "9876543214",
        "email": "sita@student.com",
        "course": "CEC",
        "status": "Pass",
        "bank_account_number": "4348",
        "bank_name": "HDFC",
        "bank_branch": "HYD",
        "guardian_name": "Sita Parent",
        "address": "Hyderabad",
        "subjects": ["social", "english"],
        "marks": {"social": 190, "english": 190},
        "fee": 28000,
        "discount": 10,
        "year": 2024,
    },
    {
        "id": 6,
        "name": "John",
        "gender": "M",
        "blood_group": "AB+",
        "phone_number": "9876543215",
        "email": "john@student.com",
        "course": "MEC",
        "status": "Fail",
        "bank_account_number": "4349",
        "bank_name": "HDFC",
        "bank_branch": "HYD",
        "guardian_name": "John Parent",
        "address": "Hyderabad",
        "subjects": ["maths", "english", "social"],
        "marks": {"maths": 70, "english": 60, "social": 60},
        "fee": 32000,
        "discount": 20,
        "year": 2024,
    },
]


USERS = [
    ("Admin User", "admin@college.com", "Admin@123", "admin", None),
    ("Chairman User", "chairman@college.com", "Chairman@123", "chairman", None),
    ("Principal User", "principal@college.com", "Principal@123", "principal", None),
    ("Finance User", "finance@college.com", "Finance@123", "finance", None),
    ("Maths Professor", "maths.prof@college.com", "Prof@123", "professor", None),
    ("Social Professor", "social.prof@college.com", "Prof@123", "professor", None),
    ("English Assistant", "english.assist@college.com", "Assist@123", "assistant", None),
    ("Student User Raju", "raju@student.com", "Student@123", "student", 1),
]

 
ACCESS_BY_EMAIL = {
    "maths.prof@college.com": ["maths"],
    "social.prof@college.com": ["social"],
    "english.assist@college.com": ["english"],
}


def upsert_student(db, data):
    student = db.query(Student).filter(Student.id == data["id"]).first()
    if not student:
        db.add(Student(**data))
        return
    for key, value in data.items():
        setattr(student, key, value)
    student.is_deleted = False


def upsert_user(db, name, email, password, role, student_id):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        db.add(
            User(
                name=name,
                email=email,
                password_hash=get_password_hash(password),
                role=role,
                student_id=student_id,
                is_active=True,
            )
        )
        return
    user.name = name
    user.password_hash = get_password_hash(password)
    user.role = role
    user.student_id = student_id
    user.is_active = True


def ensure_access(db, user, subject):
    existing = (
        db.query(ProfessorSubjectAccess)
        .filter(
            ProfessorSubjectAccess.user_id == user.id,
            ProfessorSubjectAccess.subject == subject,
        )
        .first()
    )
    if not existing:
        db.add(ProfessorSubjectAccess(user_id=user.id, subject=subject))


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for student in STUDENTS:
            upsert_student(db, student)
        db.commit()

        for user_data in USERS:
            upsert_user(db, *user_data)
        db.commit()

        for email, subjects in ACCESS_BY_EMAIL.items():
            user = db.query(User).filter(User.email == email).first()
            for subject in subjects:
                ensure_access(db, user, subject)
        db.commit()
        print("Seed data loaded successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
