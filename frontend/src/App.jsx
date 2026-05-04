import React, { useState, useRef, useEffect } from "react";
import "mathlive"; // Import để đăng ký web component <math-field>

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export default function App() {
  const [file, setFile] = useState(null);
  const [latex, setLatex] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [loading, setLoading] = useState(false);

  const mfRef = useRef(null);

  // 1. Đồng bộ 2 chiều: Từ Textarea -> MathField
  useEffect(() => {
    if (mfRef.current && mfRef.current.value !== latex) {
      mfRef.current.value = latex;
    }
  }, [latex]);

  // 2. Đồng bộ 2 chiều: Từ MathField -> Textarea
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    const handleInput = (e) => {
      setLatex(e.target.value);
    };

    // MathLive phát ra sự kiện 'input' khi có thay đổi
    mf.addEventListener("input", handleInput);
    return () => mf.removeEventListener("input", handleInput);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (!file) {
      alert("Vui lòng chọn file PDF trước.");
      return;
    }

    setLoading(true);
    setLatex("");
    setDocumentId("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload-pdf/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Lỗi khi upload file");

      const data = await response.json();

      // Cập nhật kết quả OCR vào state
      setLatex(data.ocr_result || "");
      // Dùng Document ID thật từ backend để lưu công thức đúng tài liệu vừa upload
      setDocumentId(data.document_id || "");

      alert("Upload thành công!");
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi upload.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClick = async () => {
    if (!documentId || !latex) {
      alert("Thiếu thông tin Document ID hoặc nội dung LaTeX.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/save-formula/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: documentId,
          latex_content: latex,
        }),
      });

      if (!response.ok) throw new Error("Lỗi khi lưu công thức");

      const data = await response.json();
      alert(`Lưu thành công! Formula ID: ${data.formula_id}`);
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi khi lưu công thức.");
    }
  };

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Ebook2Latex</h1>

      {/* Khu vực Upload PDF */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h3>1. Upload tài liệu</h3>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button
          onClick={handleUploadClick}
          disabled={loading}
          style={{ marginLeft: "10px", padding: "5px 15px", cursor: "pointer" }}
        >
          {loading ? "Đang xử lý..." : "Upload PDF"}
        </button>
      </div>

      {/* Khu vực xử lý LaTeX (Chỉ hiển thị khi có kết quả LaTeX) */}
      {latex !== "" && (
        <div
          style={{
            marginBottom: "30px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h3>2. Chỉnh sửa công thức</h3>

          <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
            {/* Cột trái: Textarea */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: "bold", marginBottom: "5px" }}>
                Mã LaTeX (Textarea)
              </label>
              <textarea
                value={latex}
                onChange={(e) => setLatex(e.target.value)}
                rows={6}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Cột phải: MathField (MathLive) */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: "bold", marginBottom: "5px" }}>
                Trực quan (MathLive)
              </label>
              <div
                style={{
                  border: "1px solid #767676",
                  padding: "10px",
                  backgroundColor: "#fff",
                  minHeight: "100px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <math-field
                  ref={mfRef}
                  style={{ width: "100%", fontSize: "24px" }}
                ></math-field>
              </div>
            </div>
          </div>

          {/* Nút Submit */}
          <div style={{ marginTop: "20px", textAlign: "right" }}>
            <button
              onClick={handleSubmitClick}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007BFF",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Lưu xuống DB (Submit)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
