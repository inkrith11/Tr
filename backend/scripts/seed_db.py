#!/usr/bin/env python3
"""
Seed the database with initial data.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/seed_db.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.models import User, RoleEnum, Listing, ConditionEnum, ListingStatusEnum
from app.services.auth import get_password_hash


def seed():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ---- Users ----
        if not db.query(User).filter(User.email == "admin@apsit.edu.in").first():
            admin = User(
                email="admin@apsit.edu.in",
                name="Super Admin",
                hashed_password=get_password_hash("Admin@123456"),
                role=RoleEnum.super_admin,
                is_banned=False,
            )
            db.add(admin)
            print("✅ Created super admin: admin@apsit.edu.in / Admin@123456")
        else:
            print("⏭️  Super admin already exists")

        if not db.query(User).filter(User.email == "student@apsit.edu.in").first():
            student = User(
                email="student@apsit.edu.in",
                name="Test Student",
                hashed_password=get_password_hash("Student@123456"),
                role=RoleEnum.user,
                is_banned=False,
            )
            db.add(student)
            print("✅ Created test user: student@apsit.edu.in / Student@123456")
        else:
            print("⏭️  Test student already exists")

        db.commit()

        # ---- Sample Listings ----
        admin_user = db.query(User).filter(User.email == "admin@apsit.edu.in").first()
        student_user = db.query(User).filter(User.email == "student@apsit.edu.in").first()

        existing_count = db.query(Listing).count()
        if existing_count == 0:
            listings = [
                Listing(
                    title="Engineering Mathematics Textbook",
                    description="M1 textbook by Grewal, 44th edition. Very good condition with some highlighting. Covers calculus, linear algebra, and differential equations. Perfect for first year students.",
                    price=250.0,
                    category="Books",
                    condition=ConditionEnum.good,
                    status=ListingStatusEnum.available,
                    seller_id=student_user.id,
                ),
                Listing(
                    title="Scientific Calculator Casio fx-991EX",
                    description="Casio fx-991EX ClassWiz scientific calculator. Works perfectly, all buttons responsive. Includes original cover. Great for engineering exams and practicals.",
                    price=800.0,
                    category="Electronics",
                    condition=ConditionEnum.like_new,
                    status=ListingStatusEnum.available,
                    seller_id=student_user.id,
                ),
                Listing(
                    title="Drawing Drafter Set with Box",
                    description="Complete mini-drafter set with T-square, set squares, protractor, and compass. Used for one semester only. Original wooden box included. Perfect for engineering drawing.",
                    price=350.0,
                    category="Tools",
                    condition=ConditionEnum.good,
                    status=ListingStatusEnum.available,
                    seller_id=admin_user.id,
                ),
                Listing(
                    title="Data Structures & Algorithms Notes",
                    description="Handwritten notes for DSA covering arrays, linked lists, trees, graphs, sorting, searching, and dynamic programming. Very neat and organized. 120 pages total.",
                    price=150.0,
                    category="Stationery",
                    condition=ConditionEnum.new,
                    status=ListingStatusEnum.available,
                    seller_id=admin_user.id,
                ),
            ]
            db.add_all(listings)
            db.commit()
            print(f"✅ Created {len(listings)} sample listings")
        else:
            print(f"⏭️  {existing_count} listings already exist")

        print("\n🎉 Database seeded successfully!")
        print("\n📋 Test Accounts:")
        print("   Admin:   admin@apsit.edu.in   / Admin@123456")
        print("   Student: student@apsit.edu.in / Student@123456")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
