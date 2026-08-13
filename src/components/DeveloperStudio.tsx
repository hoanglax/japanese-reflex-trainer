import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode2, 
  Terminal, 
  Layers, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const DeveloperStudio: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('main.py');
  const [copied, setCopied] = useState<boolean>(false);

  const filesContent: Record<string, { title: string; lang: string; desc: string; code: string }> = {
    'main.py': {
      title: 'main.py (App Launch Script)',
      lang: 'python',
      desc: 'Điểm khởi tạo ứng dụng PySide6 Desktop, load biến môi trường .env và hiển thị MainWindow.',
      code: `import sys
import os
from PySide6.QtWidgets import QApplication
from dotenv import load_dotenv

from data_manager import DataManager
from ai_service import AIService
from gui_main import MainWindow

def main():
    load_dotenv()
    app = QApplication(sys.argv)
    app.setStyle("Fusion")

    db_manager = DataManager("japanese_reflex.db")
    ai_service = AIService()

    window = MainWindow(data_manager=db_manager, ai_service=ai_service)
    window.show()

    sys.exit(app.exec())

if __name__ == "__main__":
    main()`
    },
    'gui_main.py': {
      title: 'gui_main.py (Desktop Navigation & Layout)',
      lang: 'python',
      desc: 'Cửa sổ chính với Sidebar Navigation, Bảng hiển thị CSDL local, Status Bar và cài đặt API Key.',
      code: `from PySide6.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QVBoxLayout, QPushButton, 
    QStackedWidget, QLabel, QTableWidget, QTableWidgetItem, QHeaderView,
    QLineEdit, QStatusBar, QMessageBox, QGroupBox
)

from data_manager import DataManager
from ai_service import AIService
from gui_data_entry import DataEntryWidget
from gui_reflex_mode import ReflexModeWidget

class MainWindow(QMainWindow):
    def __init__(self, data_manager: DataManager, ai_service: AIService):
        super().__init__()
        self.db = data_manager
        self.ai_service = ai_service

        self.setWindowTitle("Japanese Reflex Trainer - Ứng Dụng Rèn Luyện Phản Xạ Tiếng Nhật")
        self.resize(1100, 720)
        self._init_ui()`
    },
    'gui_data_entry.py': {
      title: 'gui_data_entry.py (3 Data Input Methods)',
      lang: 'python',
      desc: 'Cung cấp 3 phương thức nạp dữ liệu: Form thủ công, Nạp qua file CSV/JSON/TXT và Sinh tự động bằng Gemini AI.',
      code: `from PySide6.QtWidgets import QWidget, QVBoxLayout, QTabWidget, QMessageBox
from data_manager import DataManager
from ai_service import AIService

class DataEntryWidget(QWidget):
    def __init__(self, data_manager: DataManager, ai_service: AIService, parent=None):
        super().__init__(parent)
        self.db = data_manager
        self.ai_service = ai_service
        self._init_ui()`
    },
    'gui_reflex_mode.py': {
      title: 'gui_reflex_mode.py (Flash Reflex Timer View)',
      lang: 'python',
      desc: 'Chế độ luyện phản xạ nhanh với đồng hồ đếm ngược, xử lý phím tắt và kết nối Gemini AI chấm điểm.',
      code: `from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QProgressBar
from PySide6.QtCore import QTimer
from data_manager import DataManager
from ai_service import AIService

class ReflexModeWidget(QWidget):
    def __init__(self, data_manager: DataManager, ai_service: AIService, parent=None):
        super().__init__(parent)
        self.db = data_manager
        self.ai_service = ai_service
        self.timer = QTimer(self)`
    },
    'ai_service.py': {
      title: 'ai_service.py (Gemini GenAI SDK Wrapper)',
      lang: 'python',
      desc: 'Service Layer độc lập đóng gói các lệnh gọi Google GenAI SDK (gemini-3.6-flash) cho AI generation & evaluation.',
      code: `import os
import json
from google import genai
from google.genai import types

class AIService:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    # TODO: [Developer Extension] Thêm Whisper API hoặc custom prompt templates tại đây`
    },
    'data_manager.py': {
      title: 'data_manager.py (SQLite DB & Spaced Repetition SRS)',
      lang: 'python',
      desc: 'Data Access Layer quản lý CSDL SQLite, lưu nhật ký thực hành và thuật toán SuperMemo SM-2 Spaced Repetition.',
      code: `import sqlite3
import json
import csv

class DataManager:
    def __init__(self, db_path="japanese_reflex.db"):
        self.db_path = db_path
        self._init_db()

    # TODO: [Developer Extension] Bạn có thể thay đổi hệ số quên SRS hoặc tích hợp Anki .apkg`
    },
    'requirements.txt': {
      title: 'requirements.txt (Dependencies)',
      lang: 'text',
      desc: 'Danh sách thư viện phụ thuộc cho ứng dụng Desktop Python.',
      code: `PySide6>=6.6.0
google-genai>=0.1.1
python-dotenv>=1.0.0
requests>=2.31.0`
    },
    'README.md': {
      title: 'README.md (Setup Instructions)',
      lang: 'markdown',
      desc: 'Hướng dẫn từng bước chạy local, cấu hình GEMINI_API_KEY và cài đặt môi trường virtualenv.',
      code: `# 🇯🇵 Japanese Reflex Trainer - Standalone Desktop App (PySide6 + Gemini AI)

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local Setup)

1. cd python_desktop_app
2. python -m venv venv
3. source venv/bin/activate (Linux/Mac) hoặc venv\\Scripts\\activate (Windows)
4. pip install -r requirements.txt
5. python main.py`
    }
  };

  const currentFile = filesContent[selectedFile] || filesContent['main.py'];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Developer Extension Studio (PySide6 Codebase)
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded">
                Clean Architecture
              </span>
            </h2>
            <p className="text-xs text-slate-400">Xem, sao chép hoặc mở rộng mã nguồn Python Desktop sẵn sàng để chạy local</p>
          </div>
        </div>
      </div>

      {/* Extensibility Points Highlight */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>CÁC ĐIỂM MỞ RỘNG ĐÃ ĐƯỢC ĐÁNH DẤU (# TODO: [Developer Extension])</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <div className="font-bold text-white">1. Thuật Toán SRS / Anki</div>
            <p className="text-[11px] text-slate-400">
              Được đánh dấu tại <code>data_manager.py</code> trong hàm <code>update_srs_stats</code>. Dễ dàng đổi sang SM-2, Leitner hoặc sync Anki.
            </p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <div className="font-bold text-white">2. Prompt & AIService Layer</div>
            <p className="text-[11px] text-slate-400">
              Được đánh dấu tại <code>ai_service.py</code>. Bạn có thể tùy chỉnh Prompt Template cho chuyên ngành IT, Kinh doanh, Y tế.
            </p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <div className="font-bold text-white">3. Native C++ / CFFI Bridge</div>
            <p className="text-[11px] text-slate-400">
              Đã chèn sẵn vị trí nạp module C++ native tăng tốc xử lý cho kho dữ liệu hàng trăm ngàn từ.
            </p>
          </div>
        </div>
      </div>

      {/* Code Viewer Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* File Explorer Tree */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-800 mb-1">
            THƯ MỤC DỰ ÁN (python_desktop_app)
          </div>
          {Object.keys(filesContent).map((fileKey) => (
            <button
              key={fileKey}
              onClick={() => setSelectedFile(fileKey)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                selectedFile === fileKey
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{fileKey}</span>
              </div>
              <ChevronRight className="w-3 h-3 opacity-50" />
            </button>
          ))}
        </div>

        {/* Code Content Window */}
        <div className="md:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col font-mono text-xs">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-white font-bold">{currentFile.title}</span>
              <p className="text-[11px] text-slate-400 font-sans">{currentFile.desc}</p>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-sans transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép mã'}</span>
            </button>
          </div>

          <div className="p-4 overflow-x-auto max-h-96 text-slate-300 leading-relaxed font-mono">
            <pre>
              <code>{currentFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
