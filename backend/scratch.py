from app.database import SessionLocal
from app.models import User
db = SessionLocal()
print("User count:", db.query(User).count())
for u in db.query(User).all():
    print(f"User: {u.email}")
