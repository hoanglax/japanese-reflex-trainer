# 🇯🇵 Japanese Reflex Trainer - Standalone Desktop App (PySide6 + Gemini AI)

Ứng dụng Desktop cá nhân rèn luyện phản xạ tiếng Nhật (từ vựng, ngữ pháp, mẫu câu giao tiếp) tích hợp trí tuệ nhân tạo Google Gemini API.

---

## 🏗️ Cấu Trúc Thư Mục Dự Án (Clean Architecture)

```
python_desktop_app/
├── main.py                   # Launch Script (Khởi tạo App & GUI)
├── gui_main.py               # Main Window GUI (Thanh điều hướng, layout chính)
├── gui_data_entry.py         # Module Nạp Dữ Liệu (Thủ công, Import File, Sinh AI)
├── gui_reflex_mode.py        # Module Luyện Phản Xạ Nhanh (Timer, AI chấm điểm)
├── ai_service.py             # Service Layer gọi Google GenAI SDK (gemini-3.6-flash)
├── data_manager.py           # Data Access Layer (SQLite Database local & SRS)
├── requirements.txt          # Danh sách thư viện phụ thuộc
├── sample_vocabulary.json    # File mẫu nạp JSON
├── sample_vocabulary.csv     # File mẫu nạp CSV
├── sample_vocabulary.txt     # File mẫu nạp TXT
└── README.md                 # Hướng dẫn chi tiết
```

---

## 🚀 Hướng Dẫn Chạy Trên Máy Cục Bộ (Local Setup)

### Bước 1: Chuẩn bị môi trường Python (Python 3.9+)
```bash
cd python_desktop_app
python -m venv venv

# Trên Windows:
venv\Scripts\activate

# Trên macOS / Linux:
source venv/bin/activate
```

### Bước 2: Cài đặt thư viện
```bash
pip install -r requirements.txt
```

### Bước 3: Cấu hình khóa Google Gemini API Key
Bạn có thể cấu hình bằng 2 cách:
1. Tạo file `.env` trong thư mục `python_desktop_app/` với nội dung:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   ```
2. Hoặc nhập trực tiếp API Key trong giao diện phần **⚙️ Cài Đặt API Key** khi ứng dụng khởi chạy.

### Bước 4: Chạy ứng dụng Desktop
```bash
python main.py
```

---

## 🎯 Điểm Mở Rộng Dành Cho Lập Trình Viên (Extensibility Points)

Mã nguồn được tổ chức sạch sẽ với các đánh dấu `# TODO: [Developer Extension]` để bạn dễ dàng phát triển mở rộng:
1. **Thuật toán Spaced Repetition (SRS / Anki Algorithm)**: Xem file `data_manager.py` tại phương thức `update_srs_stats` để điều chỉnh hệ số quên, Leitner boxes hoặc đồng bộ thẻ `.apkg`.
2. **Tuỳ chỉnh AI Prompt & Phân tích Ngữ Pháp**: Xem file `ai_service.py` để sửa đổi Prompt Template, điều chỉnh Temperature hoặc thêm bộ kiểm tra phát âm qua Whisper STT.
3. **CFFI / C++ Extension**: Trong `data_manager.py`, bạn có thể thay thế SQLite query bằng module native C++ qua CFFI nếu cần xử lý kho dữ liệu hàng trăm ngàn từ với tốc độ cực đại.
