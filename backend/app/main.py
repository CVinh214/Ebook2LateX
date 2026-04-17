import fitz  # PyMuPDF
import uuid
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

# Import database engine và models từ file models.py đã tạo trước đó
from .database import SessionLocal, engine # Giả định bạn có file database.py khởi tạo engine
from .models import Base, FormulaEntry, Document

# Tạo bảng trong DB nếu chưa tồn tại
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency để lấy DB Session cho mỗi request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Schemas ---
class FormulaSaveRequest(BaseModel):
    document_id: uuid.UUID
    latex_content: str

# --- API Endpoints ---

@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    """
    1. Nhận file PDF
    2. Dùng PyMuPDF trích xuất ảnh trang đầu (giả lập)
    3. Trả về kết quả OCR mẫu (LaTeX)
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file PDF.")

    try:
        # Đọc nội dung file
        content = await file.read()
        
        # Mở PDF bằng PyMuPDF (fitz)
        doc = fitz.open(stream=content, filetype="pdf")
        
        if len(doc) == 0:
            raise HTTPException(status_code=400, detail="File PDF trống.")

        # Trích xuất trang đầu tiên
        page = doc[0]
        pix = page.get_pixmap()
        
        # Trong thực tế, bạn sẽ lưu pix.tobytes() vào storage (S3/Local) 
        # và gửi qua model AI OCR. Ở đây ta giả lập kết quả OCR:
        sample_latex = r"\int_{a}^{b} x^2 dx = \frac{b^3 - a^3}{3}"
        
        doc.close()

        return {
            "file_name": file.filename,
            "status": "processed",
            "ocr_result": sample_latex,
            "info": "Đã trích xuất trang 1 và giả lập OCR thành công."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý file: {str(e)}")

@app.post("/save-formula/")
async def save_formula(request: FormulaSaveRequest, db: Session = Depends(get_db)):
    """
    Nhận JSON, kiểm tra DocumentID và lưu vào bảng FormulaEntries
    """
    # Kiểm tra xem DocumentID có tồn tại không (tùy chọn nhưng nên có)
    doc_exists = db.query(Document).filter(Document.id == request.document_id).first()
    if not doc_exists:
        raise HTTPException(status_code=404, detail="Không tìm thấy Document ID tương ứng.")

    try:
        # Tạo bản ghi mới cho FormulaEntries
        new_entry = FormulaEntry(
            id=uuid.uuid4(),
            document_id=request.document_id,
            latex_content=request.latex_content,
            order_index=0,  # Giá trị mặc định hoặc logic tính toán index
            raw_image_path="images/sample_path.png" # Giả định đường dẫn ảnh
        )
        
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        
        return {
            "message": "Lưu công thức thành công",
            "formula_id": new_entry.id,
            "document_id": new_entry.document_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu vào Database: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)