import os

from dotenv import load_dotenv

from sqlalchemy import create_engine

from sqlalchemy.orm import sessionmaker, declarative_base

# Tải các biến môi trường từ tập tin .env

load_dotenv()

# 1. Lấy chuỗi kết nối từ biến môi trường

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:chotaomatkhau1@db:5432/ebook2latex_db"
)

# 2. Tạo Engine: Đây là "nguồn" kết nối chính tới Database

engine = create_engine(DATABASE_URL)

# 3. Tạo SessionLocal: Mỗi thực thể của lớp này sẽ là một phiên làm việc database

# autocommit=False: Đảm bảo dữ liệu chỉ được lưu khi ta ra lệnh commit()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Tạo Base class: Các models (User, Document...) sẽ kế thừa từ đây

Base = declarative_base()