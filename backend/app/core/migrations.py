from sqlalchemy import inspect, text


STUDENT_OPTIONAL_COLUMNS = {
    "phone_number": "VARCHAR(30)",
    "email": "VARCHAR(255)",
    "guardian_name": "VARCHAR(120)",
    "address": "VARCHAR(500)",
}


def ensure_student_optional_columns(engine):
    inspector = inspect(engine)
    if not inspector.has_table("students"):
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("students")
    }
    missing_columns = [
        (name, ddl_type)
        for name, ddl_type in STUDENT_OPTIONAL_COLUMNS.items()
        if name not in existing_columns
    ]
    if not missing_columns:
        return

    with engine.begin() as connection:
        for name, ddl_type in missing_columns:
            connection.execute(
                text(f"ALTER TABLE students ADD COLUMN {name} {ddl_type}")
            )
