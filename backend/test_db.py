import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine, inspect
from app.models import Document, FormulaEntry

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

print(f"🔍 Connecting to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("✅ Database connection successful!")
        
    # List all tables
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\n📋 Tables in database: {tables}")
    
    if tables:
        for table in tables:
            columns = inspector.get_columns(table)
            print(f"\n  Table: {table}")
            for col in columns:
                print(f"    - {col['name']} ({col['type']})")
    else:
        print("⚠️  No tables found!")
        
except Exception as e:
    print(f"❌ Connection failed: {e}")

try:
    with Session(engine) as session:
        docs = session.query(Document).all()
        print(f"\n📄 Documents in DB: {len(docs)}")
        for doc in docs:
            print(f"  - {doc.id}: {doc.file_name}")
        
        formulas = session.query(FormulaEntry).all()
        print(f"\n📐 Formulas in DB: {len(formulas)}")
        for formula in formulas:
            print(f"  - {formula.id}: {formula.latex_content}")
except Exception as e:
    print(f"❌ Query failed: {e}")