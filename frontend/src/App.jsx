import { useEffect, useRef, useState } from "react";
import axios from "axios";
// Load MathLive từ CDN (thêm vào index.html hoặc dùng npm install mathlive)
// npm: import "mathlive";

export default function App() {
  const [latex, setLatex] = useState("\\frac{a}{b}");
  const mathFieldRef = useRef(null);
  const isUpdatingFromMathField = useRef(false);
  const isUpdatingFromTextarea = useRef(false);

  // Khi latex thay đổi từ textarea → cập nhật math-field
  useEffect(() => {
    const mf = mathFieldRef.current;
    if (mf && !isUpdatingFromMathField.current) {
      isUpdatingFromTextarea.current = true;
      mf.value = latex;
      isUpdatingFromTextarea.current = false;
    }
  }, [latex]);

  // Lắng nghe sự kiện từ math-field → cập nhật textarea
  useEffect(() => {
    const mf = mathFieldRef.current;
    if (!mf) return;

    const handleInput = (e) => {
      if (!isUpdatingFromTextarea.current) {
        isUpdatingFromMathField.current = true;
        setLatex(e.target.value);
        isUpdatingFromMathField.current = false;
      }
    };

    mf.addEventListener("input", handleInput);
    return () => mf.removeEventListener("input", handleInput);
  }, []);

  const handleSubmit = async () => {
    try {
      const res = await axios.post("/save-formula/", { latex_content: latex });
      alert("Lưu thành công! ID: " + res.data.id);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div style={styles.container}>
      {/* Cột 1: Textarea nhập LaTeX */}
      <div style={styles.column}>
        <h3 style={styles.heading}>📝 Mã LaTeX</h3>
        <textarea
          style={styles.textarea}
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          placeholder="Nhập mã LaTeX tại đây..."
          spellCheck={false}
        />
      </div>

      {/* Cột 2: Hiển thị công thức với MathLive */}
      <div style={styles.column}>
        <h3 style={styles.heading}>🔢 Xem trước công thức</h3>
        <div style={styles.mathContainer}>
          <math-field
            ref={mathFieldRef}
            style={styles.mathField}
          >
            {latex}
          </math-field>
        </div>
      </div>

      {/* Nút Submit */}
      <div style={styles.submitRow}>
        <button style={styles.button} onClick={handleSubmit}>
          💾 Lưu công thức
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "auto auto",
    gap: "24px",
    padding: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
    fontFamily: "sans-serif",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  heading: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
    margin: 0,
  },
  textarea: {
    width: "100%",
    height: "300px",
    padding: "12px",
    fontSize: "14px",
    fontFamily: "monospace",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    resize: "vertical",
    outline: "none",
    lineHeight: "1.6",
    boxSizing: "border-box",
  },
  mathContainer: {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "12px",
    minHeight: "300px",
    background: "#fafafa",
  },
  mathField: {
    width: "100%",
    fontSize: "20px",
  },
  submitRow: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "center",
  },
  button: {
    padding: "10px 32px",
    fontSize: "15px",
    fontWeight: "600",
    background: "#01696f",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
