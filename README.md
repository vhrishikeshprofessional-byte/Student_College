# College Role-Based Student Information System

Demo full-stack application with:

- FastAPI backend
- PostgreSQL database
- SQLAlchemy ORM
- JWT access tokens and persisted hashed refresh tokens
- bcrypt password hashing
- Pydantic validation
- Role-based and field-level access control
- React + Vite frontend
- Axios token refresh interceptor
- React Router protected pages

This is a demo application. Production systems should use stronger controls such as httpOnly secure cookies, stricter role approval, login rate limiting, refresh-token rotation, CSRF protections where applicable, centralized audit monitoring, and database migrations.

## Project Structure

```txt
backend/
  app/
    main.py
    core/
    models/
    schemas/
    routers/
    services/
    seed.py
  requirements.txt
  .env.example

frontend/
  src/
    api/
    auth/
    components/
    pages/
  package.json
  .env.example

README.md
```

## Backend Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE college_rbac;
```

Install and run:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.seed
uvicorn app.main:app --reload
```

Windows PowerShell activation:

```powershell
.\venv\Scripts\Activate.ps1
```

Backend `.env.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/college_rbac
JWT_SECRET_KEY=change_this_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=5
REFRESH_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:5173
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend `.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The frontend stores tokens in `localStorage` for demo clarity. Production apps should prefer httpOnly secure cookies with a matching CSRF strategy.

## Seed Users

| Role | Email | Password |
| --- | --- | --- |
| admin | admin@college.com | Admin@123 |
| chairman | chairman@college.com | Chairman@123 |
| principal | principal@college.com | Principal@123 |
| finance | finance@college.com | Finance@123 |
| professor | maths.prof@college.com | Prof@123 |
| professor | social.prof@college.com | Prof@123 |
| professor | physics.prof@college.com | Prof@123 |
| professor | chemistry.prof@college.com | Prof@123 |
| professor | maths.prof@college.com | Prof@123 |

| assistant | english.assist@college.com | Assist@123 |
| student | raju@student.com | Student@123 |

## API Summary

Auth:

- `POST /v1/register`
- `POST /v1/login`
- `POST /v1/refresh`
- `GET /v1/me`

Students:

- `GET /v1/student`
- `GET /v1/student/{id}`
- `POST /v1/student`
- `PUT /v1/student/{id}`
- `DELETE /v1/student/{id}`

Professor subject access:

- `POST /v1/access/professor-subject`
- `GET /v1/access/professor-subject/{user_id}`
- `DELETE /v1/access/professor-subject/{access_id}`

Users:

- `GET /v1/users`
- `POST /v1/users/{user_id}/link-student/{student_id}`
- `PATCH /v1/users/{user_id}/deactivate`

Audit:

- `GET /v1/audit-logs`

## Role Behavior

`admin` and `chairman` can view full student data.

`finance` can view all students, but only financial and bank fields:

```txt
id, name, course, year, fee, discount, bank_account_number, bank_name, bank_branch
```

`principal`, `hod`, and `dean` can view all students, but only academic fields:

```txt
id, name, gender, blood_group, course, status, subjects, marks, year
```

`professor` and `assistant` can view only students matching their assigned subjects. They receive only matching subject marks:

```json
{
  "id": 1,
  "name": "Raju",
  "subjects": [
    {
      "subject": "maths",
      "marks": 140
    }
  ],
  "status": "Pass"
}
```

`student` can view only their linked student profile, including academic, fee, discount, and bank details.

Every protected endpoint requires a JWT access token. Expired or invalid access tokens return `401 Unauthorized`. Valid users without permission receive `403 Forbidden`.

## Manual Test Checklist

```txt
1. Register user
2. Login user
3. Access /v1/me with token
4. Access /v1/student without token -> 401
5. Access /v1/student with expired token -> 401
6. Refresh access token using refresh token
7. Maths professor accesses maths student -> success
8. Social professor accesses maths-only student -> 403
9. Principal accesses student -> academic fields only
10. Finance accesses student -> financial fields only
11. Chairman accesses student -> full details
12. Student accesses own details -> success
13. Student accesses another student -> 403
14. Admin assigns professor subject access
15. Professor can access newly assigned subject students
16. Audit logs are created for access and denied actions
```

## Notes

- Access token expiry defaults to 5 minutes.
- Refresh token expiry defaults to 60 minutes.
- Access JWT payload includes `user_id`, `name`, `email`, `role`, `created_at`, and `expires_at`.
- Refresh tokens are persisted as SHA-256 hashes.
- Passwords are stored only as bcrypt hashes.
- The backend reloads the user from the database before every permission check and never trusts role data from the frontend.
- The login route includes a TODO for production-grade brute-force protection.




 git remote add origin https://github.com/vhrishikeshprofessional-byte/Student_College.git