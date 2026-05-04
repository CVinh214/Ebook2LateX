# Hướng Dẫn Đọc Code Ebook2LateX

Tài liệu này dùng để nắm nhanh kiến trúc, công nghệ và thứ tự đọc code của toàn bộ dự án Ebook2LateX.

## 1. Dự án này làm gì

Ebook2LateX là một ứng dụng web gồm 2 phần:

- Người dùng upload file PDF.
- Backend đọc nội dung PDF, lấy ra một chuỗi LaTeX ứng viên.
- Frontend cho phép chỉnh sửa LaTeX bằng textarea và MathLive.
- Người dùng có thể lưu công thức xuống PostgreSQL.

Mục tiêu hiện tại của code là chứng minh luồng xử lý PDF -> trích xuất nội dung -> chỉnh sửa LaTeX -> lưu vào cơ sở dữ liệu.

## 2. Công nghệ chính

### Backend

- Python 3.10
- FastAPI: xây API upload và lưu công thức
- SQLAlchemy: ORM thao tác database
- Alembic: quản lý migration schema
- PostgreSQL: lưu User, Document, FormulaEntry, Log
- PyMuPDF (`fitz`): đọc và trích xuất text từ PDF
- Uvicorn: chạy server backend

### Frontend

- React 19
- Vite: build/dev server
- MathLive: nhập và hiển thị công thức toán học
- Axios đã được cài nhưng code hiện tại đang dùng `fetch`

### Hạ tầng

- Docker / Docker Compose
- 3 service chính: `db`, `backend`, `frontend`

## 3. Cách hệ thống được ghép lại

File quan trọng nhất để hiểu tổng thể là [docker-compose.yml](docker-compose.yml).

- `db` chạy PostgreSQL.
- `backend` build từ thư mục `backend/`, dùng biến môi trường `DATABASE_URL` để kết nối DB.
- `frontend` build từ thư mục `frontend/`, trỏ API về backend qua `VITE_API_BASE_URL`.

Luồng chạy thực tế:

1. Docker Compose khởi động PostgreSQL.
2. Backend kết nối vào DB và tạo bảng nếu chưa có.
3. Frontend gọi API upload PDF.
4. Backend trích xuất nội dung PDF và trả về `document_id` cùng kết quả OCR giả lập/ứng viên LaTeX.
5. Frontend cho phép người dùng sửa LaTeX.
6. Frontend gọi API lưu công thức vào bảng `formula_entries`.

## 4. Thứ tự nên đọc code

Nếu mới vào dự án, nên đọc theo thứ tự này:

1. [docker-compose.yml](docker-compose.yml) để hiểu các service và biến môi trường.
2. [backend/app/main.py](backend/app/main.py) để hiểu các API và luồng xử lý chính.
3. [backend/app/models.py](backend/app/models.py) để hiểu schema dữ liệu.
4. [backend/app/database.py](backend/app/database.py) để hiểu cách tạo engine và session DB.
5. [frontend/src/App.jsx](frontend/src/App.jsx) để hiểu toàn bộ UI và cách gọi API.
6. [frontend/src/main.jsx](frontend/src/main.jsx) để thấy điểm mount của React app.
7. [backend/migrations/env.py](backend/migrations/env.py) để hiểu Alembic lấy metadata từ models.
8. [backend/seed.py](backend/seed.py) để xem dữ liệu mẫu.

## 5. Backend: đọc theo luồng nào

### `backend/app/main.py`

Đây là file trung tâm của backend.

Nó làm 4 việc chính:

- Khởi tạo FastAPI app.
- Bật CORS cho frontend ở `localhost:5173` và `localhost:5174`.
- Tạo bảng bằng `Base.metadata.create_all(bind=engine)`.
- Khai báo 2 endpoint chính:
  - `POST /upload-pdf/`
  - `POST /save-formula/`

Điểm cần chú ý khi đọc:

- `extract_latex_candidate()` chọn một dòng giống công thức toán từ text PDF.
- `/upload-pdf/` đọc file, mở PDF bằng PyMuPDF, trích text từng trang, tạo bản ghi `Document` và trả về `document_id`.
- `/save-formula/` kiểm tra `document_id` tồn tại rồi tạo `FormulaEntry`.

### `backend/app/models.py`

File này mô tả toàn bộ schema chính:

- `User`
- `Document`
- `FormulaEntry`
- `Log`

Quan hệ dữ liệu nên nắm:

- Một `User` có nhiều `Document`.
- Một `Document` có nhiều `FormulaEntry`.
- Một `FormulaEntry` có nhiều `Log`.

Các cột đáng chú ý:

- `Document.file_name`, `file_path_url`, `status`
- `FormulaEntry.latex_content`, `order_index`, `raw_image_path`
- `Log.confidence_score`, `environment_info`

### `backend/app/database.py`

File này chịu trách nhiệm kết nối DB:

- Đọc `DATABASE_URL` từ môi trường.
- Tạo `engine`.
- Tạo `SessionLocal`.
- Tạo `Base` cho SQLAlchemy models.

Nếu backend không kết nối được DB, file này là nơi đầu tiên cần kiểm tra.

### `backend/migrations/env.py`

File này nối Alembic với SQLAlchemy models.

- `target_metadata = Base.metadata` để Alembic biết schema hiện tại.
- Đây là nơi chạy migration offline/online.

### `backend/seed.py`

File này tạo dữ liệu mẫu:

- 1 user admin
- 1 document mẫu
- 1 công thức LaTeX mẫu

Đây là file hữu ích khi muốn kiểm tra giao diện hoặc test nhanh luồng dữ liệu.

## 6. Frontend: đọc theo luồng nào

### `frontend/src/main.jsx`

Đây là điểm khởi động React app.

- Mount `App` vào `#root`.
- Import `mathlive` để web component `<math-field>` hoạt động.

### `frontend/src/App.jsx`

Đây là file giao diện chính.

Luồng UI:

- Chọn file PDF.
- Gọi API upload.
- Nhận `ocr_result` và `document_id` từ backend.
- Hiển thị nội dung LaTeX trong textarea và `math-field`.
- Gọi API lưu công thức.

Các state chính:

- `file`: file PDF được chọn
- `latex`: nội dung LaTeX đang chỉnh sửa
- `documentId`: ID document trả về từ backend
- `loading`: trạng thái upload

Điểm cần chú ý:

- Có đồng bộ 2 chiều giữa textarea và MathLive.
- `API_BASE_URL` lấy từ `VITE_API_BASE_URL`, nếu không có thì mặc định về `http://127.0.0.1:8000`.

### `frontend/src/index.css` và `frontend/src/App.css`

Hai file này hiện chứa style mẫu của template Vite/React, không phải logic nghiệp vụ chính.

Nếu muốn chỉnh giao diện thật của app, phần quan trọng hơn vẫn là `App.jsx`.

## 7. Mô hình dữ liệu cần nhớ

Schema hiện tại xoay quanh 4 bảng:

- `users`: tài khoản người dùng
- `documents`: file đã upload
- `formula_entries`: công thức trích xuất/chỉnh sửa
- `logs`: log xử lý và độ tin cậy

Trong luồng hiện tại, ứng dụng chủ yếu chạm vào `documents` và `formula_entries`.

## 8. Những điểm nên lưu ý khi đọc code

- `main.py` đang tạo bảng trực tiếp bằng `create_all`, nên đây là luồng chạy nhanh cho dev chứ chưa phải thiết kế migration chặt chẽ cho production.
- `upload-pdf/` hiện trích text từ PDF rồi chọn dòng “giống công thức” làm kết quả LaTeX ứng viên. Đây là logic đơn giản hóa, chưa phải OCR thực sự.
- `seed.py` nhập dữ liệu mẫu để test, không nên chạy nguyên trạng trên dữ liệu thật nếu chưa kiểm tra kỹ.
- Frontend đang dùng style inline khá nhiều trong `App.jsx`, nên việc đọc component cần nhìn cả JSX lẫn logic state.

## 9. Cách chạy dự án

Theo cấu hình hiện tại, cách dễ nhất là dùng Docker Compose:

```bash
docker compose up --build
```

Sau đó:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

## 10. Gợi ý đọc nhanh trong 15 phút

Nếu chỉ có ít thời gian, hãy đọc theo thứ tự:

1. [README.md](README.md)
2. [docker-compose.yml](docker-compose.yml)
3. [backend/app/main.py](backend/app/main.py)
4. [backend/app/models.py](backend/app/models.py)
5. [frontend/src/App.jsx](frontend/src/App.jsx)

## 11. Tóm tắt ngắn

Backend nhận PDF, trích text, tạo bản ghi Document và trả về chuỗi LaTeX ứng viên. Frontend hiển thị chuỗi đó để người dùng chỉnh sửa bằng textarea hoặc MathLive, rồi gửi lại để lưu vào PostgreSQL.
