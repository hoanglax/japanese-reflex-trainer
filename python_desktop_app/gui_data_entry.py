"""
===============================================================================
Module: GUIDataEntry (UI Nạp Dữ Liệu: Nhập Thủ Công, Import File, Sinh AI)
Architecture Layer: View / Presentation Layer
===============================================================================
Chức năng:
1. Giao diện Nhập thủ công (Form nhập đầy đủ thuộc tính từ vựng).
2. Giao diện Nạp từ File (CSV, JSON, TXT) hỗ trợ mã hóa UTF-8.
3. Giao diện Sinh dữ liệu thông minh bằng Gemini AI theo chủ đề.
"""

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, 
    QTextEdit, QComboBox, QPushButton, QFileDialog, QMessageBox,
    QTableWidget, QTableWidgetItem, QHeaderView, QGroupBox, QSpinBox, QTabWidget
)
from PySide6.QtCore import Qt, Signal
from data_manager import DataManager
from ai_service import AIService

class DataEntryWidget(QWidget):
    data_changed_signal = Signal() # Tín hiệu phát ra khi dữ liệu kho thay đổi

    def __init__(self, data_manager: DataManager, ai_service: AIService, parent=None):
        super().__init__(parent)
        self.db = data_manager
        self.ai_service = ai_service
        self._init_ui()

    def _init_ui(self):
        main_layout = QVBoxLayout(self)

        # Tab Widget cho 3 phương thức nạp dữ liệu
        self.tabs = QTabWidget()
        
        self.tab_manual = QWidget()
        self.tab_file = QWidget()
        self.tab_ai = QWidget()

        self.tabs.addTab(self.tab_manual, "1. Nhập Thủ Công (GUI)")
        self.tabs.addTab(self.tab_file, "2. Nạp Qua File (CSV/JSON/TXT)")
        self.tabs.addTab(self.tab_ai, "3. Sinh Dữ Liệu Bằng AI (Gemini)")

        self._setup_manual_tab()
        self._setup_file_tab()
        self._setup_ai_tab()

        main_layout.addWidget(self.tabs)

    # -------------------------------------------------------------------------
    # TAB 1: NHẬP THỦ CÔNG (MANUAL FORM)
    # -------------------------------------------------------------------------
    def _setup_manual_tab(self):
        layout = QVBoxLayout(self.tab_manual)

        form_group = QGroupBox("Thêm Từ vựng / Mẫu câu mới vào Kho Local")
        form_layout = QVBoxLayout(form_group)

        # Hàng 1: Tiếng Nhật & Cách đọc Kana
        row1 = QHBoxLayout()
        self.txt_jp = QLineEdit()
        self.txt_jp.setPlaceholderText("VD: お疲れ様でした hoặc 確認する")
        self.txt_kana = QLineEdit()
        self.txt_kana.setPlaceholderText("VD: おつかれさまでした")
        row1.addWidget(QLabel("Từ/Câu tiếng Nhật (Kanji/Kana):"))
        row1.addWidget(self.txt_jp)
        row1.addWidget(QLabel("Cách đọc Kana:"))
        row1.addWidget(self.txt_kana)
        form_layout.addLayout(row1)

        # Hàng 2: Romaji & Nghĩa tiếng Việt
        row2 = QHBoxLayout()
        self.txt_romaji = QLineEdit()
        self.txt_romaji.setPlaceholderText("VD: Otsukaresama deshita")
        self.txt_vi = QLineEdit()
        self.txt_vi.setPlaceholderText("VD: Anh/Chị đã làm việc vất vả rồi")
        row2.addWidget(QLabel("Romaji:"))
        row2.addWidget(self.txt_romaji)
        row2.addWidget(QLabel("Nghĩa tiếng Việt (*):"))
        row2.addWidget(self.txt_vi)
        form_layout.addLayout(row2)

        # Hàng 3: Loại từ & Cấp độ JLPT
        row3 = QHBoxLayout()
        self.cbo_type = QComboBox()
        self.cbo_type.addItems(["Từ vựng", "Động từ", "Tính từ", "Mẫu ngữ pháp", "Cụm giao tiếp", "Câu phản xạ"])
        self.cbo_jlpt = QComboBox()
        self.cbo_jlpt.addItems(["N5", "N4", "N3", "N2", "N1", "Khác"])
        row3.addWidget(QLabel("Loại từ/Cấu trúc:"))
        row3.addWidget(self.cbo_type)
        row3.addWidget(QLabel("Cấp độ JLPT:"))
        row3.addWidget(self.cbo_jlpt)
        form_layout.addLayout(row3)

        # Hàng 4: Ví dụ tiếng Nhật & Ví dụ dịch Việt
        form_layout.addWidget(QLabel("Ví dụ tiếng Nhật:"))
        self.txt_ex_jp = QLineEdit()
        form_layout.addWidget(self.txt_ex_jp)

        form_layout.addWidget(QLabel("Ví dụ dịch tiếng Việt:"))
        self.txt_ex_vi = QLineEdit()
        form_layout.addWidget(self.txt_ex_vi)

        # Hàng 5: Ghi chú / Sắc thái dùng
        form_layout.addWidget(QLabel("Ghi chú / Ngữ cảnh sử dụng:"))
        self.txt_notes = QLineEdit()
        form_layout.addWidget(self.txt_notes)

        # Nút Lưu
        self.btn_save_manual = QPushButton("💾 Lưu Vào Kho Dữ Liệu Local")
        self.btn_save_manual.setStyleSheet("background-color: #2e7d32; color: white; font-weight: bold; padding: 10px;")
        self.btn_save_manual.clicked.connect(self._handle_manual_save)
        form_layout.addWidget(self.btn_save_manual)

        layout.addWidget(form_group)

    def _handle_manual_save(self):
        jp = self.txt_jp.text().strip()
        vi = self.txt_vi.text().strip()

        if not jp or not vi:
            QMessageBox.warning(self, "Thiếu thông tin", "Vui lòng nhập cả Từ tiếng Nhật và Nghĩa tiếng Việt!")
            return

        item = {
            "japanese": jp,
            "kana": self.txt_kana.text().strip(),
            "romaji": self.txt_romaji.text().strip(),
            "vietnamese": vi,
            "type": self.cbo_type.currentText(),
            "jlpt": self.cbo_jlpt.currentText(),
            "example_jp": self.txt_ex_jp.text().strip(),
            "example_vi": self.txt_ex_vi.text().strip(),
            "notes": self.txt_notes.text().strip()
        }

        self.db.add_vocabulary(item)
        QMessageBox.information(self, "Thành công", f"Đã lưu '{jp}' vào cơ sở dữ liệu local!")
        
        # Reset form
        self.txt_jp.clear()
        self.txt_kana.clear()
        self.txt_romaji.clear()
        self.txt_vi.clear()
        self.txt_ex_jp.clear()
        self.txt_ex_vi.clear()
        self.txt_notes.clear()

        self.data_changed_signal.emit()

    # -------------------------------------------------------------------------
    # TAB 2: NẠP QUA FILE (CSV, JSON, TXT)
    # -------------------------------------------------------------------------
    def _setup_file_tab(self):
        layout = QVBoxLayout(self.tab_file)

        group = QGroupBox("Nạp hàng loạt dữ liệu từ tập tin máy tính (UTF-8)")
        g_layout = QVBoxLayout(group)

        lbl_desc = QLabel(
            "Hỗ trợ nạp các file:\n"
            "• JSON: [ {\"japanese\": \"...\", \"vietnamese\": \"...\", \"type\": \"...\"}, ... ]\n"
            "• CSV: Cột 'japanese', 'vietnamese', 'kana', 'type'\n"
            "• TXT: Mỗi dòng định dạng: Tiếng Nhật | Tiếng Việt | Kana | Loại từ"
        )
        g_layout.addWidget(lbl_desc)

        btn_select_file = QPushButton("📁 Chọn File CSV / JSON / TXT Từ Máy Tính")
        btn_select_file.setStyleSheet("background-color: #0288d1; color: white; font-weight: bold; padding: 12px;")
        btn_select_file.clicked.connect(self._handle_file_import)
        g_layout.addWidget(btn_select_file)

        layout.addWidget(group)

    def _handle_file_import(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Chọn File Nạp Dữ Liệu", "", "Supported Files (*.csv *.json *.txt);;JSON Files (*.json);;CSV Files (*.csv);;TXT Files (*.txt)"
        )
        if not file_path:
            return

        try:
            count = self.db.import_from_file(file_path)
            QMessageBox.information(self, "Nạp thành công", f"Đã nạp thành công {count} mục từ tập tin:\n{file_path}")
            self.data_changed_signal.emit()
        except Exception as e:
            QMessageBox.critical(self, "Lỗi Nạp File", f"Không thể nạp file. Chi tiết lỗi:\n{str(e)}")

    # -------------------------------------------------------------------------
    # TAB 3: SINH DỮ LIỆU BẰNG AI (GEMINI API)
    # -------------------------------------------------------------------------
    def _setup_ai_tab(self):
        layout = QVBoxLayout(self.tab_ai)

        group = QGroupBox("Tự Động Sinh Từ Vựng & Mẫu Câu Phản Xạ Bằng Gemini AI")
        g_layout = QVBoxLayout(group)

        row_input = QHBoxLayout()
        self.txt_topic = QLineEdit()
        self.txt_topic.setPlaceholderText("VD: Giao tiếp trong nhà hàng / Từ vựng IT lập trình / Xin lỗi sếp...")
        self.spn_count = QSpinBox()
        self.spn_count.setRange(1, 20)
        self.spn_count.setValue(5)

        row_input.addWidget(QLabel("Chủ đề luyện tập:"))
        row_input.addWidget(self.txt_topic)
        row_input.addWidget(QLabel("Số lượng:"))
        row_input.addWidget(self.spn_count)
        g_layout.addLayout(row_input)

        self.btn_gen_ai = QPushButton("✨ Yêu Cầu Gemini AI Sinh Dữ Liệu Vấn Đáp")
        self.btn_gen_ai.setStyleSheet("background-color: #7b1fa2; color: white; font-weight: bold; padding: 10px;")
        self.btn_gen_ai.clicked.connect(self._handle_ai_generate)
        g_layout.addWidget(self.btn_gen_ai)

        layout.addWidget(group)

    def _handle_ai_generate(self):
        topic = self.txt_topic.text().strip()
        count = self.spn_count.value()

        if not topic:
            QMessageBox.warning(self, "Thiếu chủ đề", "Vui lòng nhập chủ đề bạn muốn Gemini AI sinh bài tập!")
            return

        if not self.ai_service.is_configured():
            QMessageBox.warning(
                self, "Chưa Cấu Hình Gemini", 
                "Chưa tìm thấy GEMINI_API_KEY. Vui lòng thiết lập biến môi trường GEMINI_API_KEY hoặc nhập key trong Cài đặt."
            )
            return

        self.btn_gen_ai.setEnabled(False)
        self.btn_gen_ai.setText("⏳ Gemini đang sinh dữ liệu tiếng Nhật...")

        try:
            items = self.ai_service.generate_vocabulary_by_topic(topic=topic, count=count)
            saved_count = 0
            for item in items:
                self.db.add_vocabulary(item)
                saved_count += 1

            QMessageBox.information(
                self, "Hoàn thành", 
                f"Gemini AI đã sinh thành công {saved_count} mục phản xạ thuộc chủ đề '{topic}' và nạp vào kho SQLite!"
            )
            self.data_changed_signal.emit()
            self.txt_topic.clear()
        except Exception as e:
            QMessageBox.critical(self, "Lỗi AI", f"Không thể sinh dữ liệu qua Gemini API:\n{str(e)}")
        finally:
            self.btn_gen_ai.setEnabled(True)
            self.btn_gen_ai.setText("✨ Yêu Cầu Gemini AI Sinh Dữ Liệu Vấn Đáp")
