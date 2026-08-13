"""
===============================================================================
Japanese Reflex Trainer - Desktop Application Entry Point
Architecture Pattern: Clean Architecture (MVC / Presentation-Service-Data)
===============================================================================
Cách chạy ứng dụng Desktop:
1. Cài đặt thư viện: pip install -r requirements.txt
2. Thiết lập GEMINI_API_KEY trong file .env hoặc biến môi trường
3. Chạy lệnh: python main.py
"""

import sys
import os
from PySide6.QtWidgets import QApplication
from dotenv import load_dotenv

from data_manager import DataManager
from ai_service import AIService
from gui_main import MainWindow
from theme import apply_theme

def main():
    # Load môi trường từ .env nếu có
    load_dotenv()

    # Khởi tạo QApplication
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    apply_theme(app)

    # Khởi tạo Data Access Layer & Service Layer
    db_manager = DataManager("japanese_reflex.db")
    ai_service = AIService()

    # Khởi tạo GUI Main Window
    window = MainWindow(data_manager=db_manager, ai_service=ai_service)
    window.show()

    sys.exit(app.exec())

if __name__ == "__main__":
    main()