#!/usr/bin/env python3
"""
Seed script to create an initial super admin user for APSIT TradeHub.
Run this script after setting up the database to create your first admin.

Usage:
    cd backend
    python scripts/create_admin.py
"""

import sys
import os

# Add the parent directory to the path so we can import the app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import User, RoleEnum


def create_admin():
    """Create a super admin user or upgrade existing user."""
    
    print("\n" + "="*50)
    print("  APSIT TradeHub - Create Super Admin")
    print("="*50 + "\n")
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("Enter details for the super admin account:\n")
        
        email = input("Email (must be @apsit.edu.in): ").strip()
        
        # Validate email domain
        if not email.endswith("@apsit.edu.in"):
            print("\n❌ Error: Email must be an @apsit.edu.in address")
            return False
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            if existing_user.role == RoleEnum.super_admin:
                print(f"\n⚠️  User {email} is already a super admin!")
                return True
            else:
                # Upgrade existing user to super admin
                upgrade = input(f"\nUser {email} exists. Upgrade to super admin? (y/n): ").strip().lower()
                if upgrade == 'y':
                    existing_user.role = RoleEnum.super_admin
                    db.commit()
                    print(f"\n✅ User {email} has been upgraded to super admin!")
                    print("They can now login at /admin/login using Google Sign-In.")
                    return True
                else:
                    print("\nOperation cancelled.")
                    return False
        
        # Get name for new user
        name = input("Full Name: ").strip()
        if not name:
            print("\n❌ Name is required!")
            return False
        
        # Get phone (optional)
        phone = input("Phone (optional, press Enter to skip): ").strip() or None
        
        # Create the super admin user (no password needed - uses Google OAuth)
        admin_user = User(
            email=email,
            name=name,
            phone=phone,
            role=RoleEnum.super_admin,
            is_banned=False
        )
        
        db.add(admin_user)
        db.commit()
        
        print("\n" + "="*50)
        print("  ✅ SUPER ADMIN CREATED SUCCESSFULLY!")
        print("="*50)
        print(f"\n  Email: {email}")
        print(f"  Name: {name}")
        print(f"  Role: Super Admin")
        print("\n  Login at /admin/login using Google Sign-In")
        print("  (Use the same @apsit.edu.in Google account)")
        print("="*50 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error creating admin: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def list_admins():
    """List all admin users."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admins = db.query(User).filter(
            User.role.in_([RoleEnum.admin, RoleEnum.super_admin])
        ).all()
        
        if not admins:
            print("\nNo admin users found.")
            return
        
        print("\n" + "="*60)
        print("  Current Admin Users")
        print("="*60)
        
        for admin in admins:
            role_badge = "👑 SUPER" if admin.role == RoleEnum.super_admin else "🔧 ADMIN"
            status = "🚫 BANNED" if admin.is_banned else "✅ ACTIVE"
            print(f"\n  {role_badge} {admin.name}")
            print(f"    Email: {admin.email}")
            print(f"    Status: {status}")
            print(f"    Created: {admin.created_at.strftime('%Y-%m-%d %H:%M') if admin.created_at else 'N/A'}")
        
        print("\n" + "="*60 + "\n")
        
    finally:
        db.close()


def main():
    """Main entry point."""
    print("\n📦 APSIT TradeHub Admin Management\n")
    print("1. Create/Upgrade Super Admin")
    print("2. List All Admins")
    print("3. Exit\n")
    
    choice = input("Select option (1-3): ").strip()
    
    if choice == "1":
        create_admin()
    elif choice == "2":
        list_admins()
    elif choice == "3":
        print("\nGoodbye! 👋\n")
    else:
        print("\n❌ Invalid option!")


if __name__ == "__main__":
    main()
