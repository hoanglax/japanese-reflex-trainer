"""
===============================================================================
Module: GUIMain (Cửa Sổ Chính Ứng Dụng Desktop PySide6)
Architecture Layer: View / Main Controller Layout
===============================================================================
Chức năng:
1. Giao diện Desktop hiện đại với Thanh Điều Hướng (Sidebar Navigation).
2. Tích hợp Quản lý Kho Dữ liệu (Bảng 9 cột đầy đủ), Chế độ Phản Xạ Nhanh & Cài đặt API.
3. Thanh trạng thái Status Bar và Xử lý Phím tắt Hệ thống.
"""

from PySide6.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QVBoxLayout, QPushButton, 
    QStackedWidget, QLabel, QTableWidget, QTableWidgetItem, QHeaderView,
    QLineEdit, QStatusBar, QMessageBox, QGroupBox
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont

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
        self.resize(1200, 750)

        self._init_ui()
        self._update_status_bar()

    def _init_ui(self):
        main_widget = QWidget()
        self.setCentralWidget(main_widget)

        root_layout = QHBoxLayout(main_widget)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        # ---------------------------------------------------------------------
        # 1. SIDEBAR NAVIGATION
        # ---------------------------------------------------------------------
        sidebar = QWidget()
        sidebar.setFixedWidth(240)
        sidebar.setStyleSheet("background-color: #0b0f19;")
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(14, 24, 14, 20)
        sidebar_layout.setSpacing(6)

        # Title / Logo
        lbl_logo = QLabel("🇯🇵  JP Reflex")
        lbl_logo.setStyleSheet("font-size: 20px; font-weight: 700; color: #38bdf8; margin-bottom: 24px;")
        sidebar_layout.addWidget(lbl_logo)

        # Buttons Menu
        self.btn_nav_reflex = QPushButton("⚡   Phản Xạ Nhanh")
        self.btn_nav_data = QPushButton("🗂️   Quản Lý Kho Dữ Liệu")
        self.btn_nav_entry = QPushButton("➕   Nạp Từ / Sinh AI")
        self.btn_nav_settings = QPushButton("⚙️   Cài Đặt API Key")

        menu_buttons = [self.btn_nav_reflex, self.btn_nav_data, self.btn_nav_entry, self.btn_nav_settings]
        for btn in menu_buttons:
            btn.setStyleSheet("""
                QPushButton {
                    text-align: left;
                    padding: 12px 14px;
                    font-size: 14px;
                    font-weight: 500;
                    border: none;
                    border-radius: 8px;
                    background-color: transparent;
                    color: #94a3b8;
                }
                QPushButton:hover {
                    background-color: #1e293b;
                    color: #ffffff;
                }
                QPushButton:checked {
                    background-color: #3b82f6;
                    color: #ffffff;
                    font-weight: 700;
                }
            """)
            btn.setCheckable(True)
            btn.setCursor(Qt.PointingHandCursor)
            sidebar_layout.addWidget(btn)

        self.btn_nav_reflex.setChecked(True)

        self.btn_nav_reflex.clicked.connect(lambda: self._switch_page(0))
        self.btn_nav_data.clicked.connect(lambda: self._switch_page(1))
        self.btn_nav_entry.clicked.connect(lambda: self._switch_page(2))
        self.btn_nav_settings.clicked.connect(lambda: self._switch_page(3))

        sidebar_layout.addStretch()

        lbl_version = QLabel("Phiên bản Desktop v1.0")
        lbl_version.setStyleSheet("color: #64748b; font-size: 11px;")
        sidebar_layout.addWidget(lbl_version)

        root_layout.addWidget(sidebar)

        # ---------------------------------------------------------------------
        # 2. MAIN STACKED PAGES
        # ---------------------------------------------------------------------
        self.pages_stack = QStackedWidget()

        # Page 0: Reflex Training Mode
        self.page_reflex = ReflexModeWidget(self.db, self.ai_service)
        self.page_reflex.answer_scored.connect(self._update_status_bar)
        self.pages_stack.addWidget(self.page_reflex)

        # Page 1: Data Manager Table View
        self.page_data_list = self._create_data_table_view()
        self.pages_stack.addWidget(self.page_data_list)

        # Page 2: Data Entry
        self.page_entry = DataEntryWidget(self.db, self.ai_service)
        self.page_entry.data_changed_signal.connect(self._refresh_data_table)
        self.pages_stack.addWidget(self.page_entry)

        # Page 3: Settings Page
        self.page_settings = self._create_settings_view()
        self.pages_stack.addWidget(self.page_settings)

        root_layout.addWidget(self.pages_stack)

        # ---------------------------------------------------------------------
        # 3. STATUS BAR
        # ---------------------------------------------------------------------
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)

    def _switch_page(self, page_index: int):
        self.pages_stack.setCurrentIndex(page_index)
        
        buttons = [self.btn_nav_reflex, self.btn_nav_data, self.btn_nav_entry, self.btn_nav_settings]
        for i, btn in enumerate(buttons):
            btn.setChecked(i == page_index)

        if page_index != 0 and hasattr(self.page_reflex, 'is_running') and self.page_reflex.is_running:
            self.page_reflex._stop_session()

        if page_index == 1:
            self._refresh_data_table()

    # -------------------------------------------------------------------------
    # TAB QUẢN LÝ KHO DỮ LIỆU (CẬP NHẬT 9 CỘT)
    # -------------------------------------------------------------------------
    def _create_data_table_view(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(12)

        # Search bar & Action Buttons
        search_box = QHBoxLayout()
        search_box.setSpacing(10)
        self.txt_search = QLineEdit()
        self.txt_search.setPlaceholderText("🔍 Tìm kiếm từ tiếng Nhật, nghĩa tiếng Việt, ghi chú...")
        self.txt_search.textChanged.connect(self._refresh_data_table)
        
        btn_refresh = QPushButton("🔄  Tải lại Kho")
        btn_refresh.setProperty("variant", "info")
        btn_refresh.clicked.connect(self._refresh_data_table)

        btn_delete_selected = QPushButton("🗑️  Xóa Mục Đã Chọn")
        btn_delete_selected.setProperty("variant", "danger")
        btn_delete_selected.clicked.connect(self._handle_delete_item)

        search_box.addWidget(self.txt_search, 1)
        search_box.addWidget(btn_refresh)
        search_box.addWidget(btn_delete_selected)
        layout.addLayout(search_box)

        # Table Vocabulary (Cấu hình 9 Cột)
        self.table_vocab = QTableWidget()
        self.table_vocab.setAlternatingRowColors(True)
        self.table_vocab.verticalHeader().setVisible(False)
        
        # Bổ sung đủ 9 cột thông tin CSDL
        self.table_vocab.setColumnCount(9)
        self.table_vocab.setHorizontalHeaderLabels([
            "ID", "Tiếng Nhật", "Kana/Đọc", "Nghĩa Tiếng Việt", "Loại", "JLPT", "Ví dụ JP", "Ghi chú & Giải thích", "Đáp án chấp nhận"
        ])
        self.table_vocab.horizontalHeader().setSectionResizeMode(QHeaderView.Interactive)
        self.table_vocab.horizontalHeader().setStretchLastSection(True)
        self.table_vocab.setSelectionBehavior(QTableWidget.SelectRows)

        layout.addWidget(self.table_vocab)
        return widget

    def _refresh_data_table(self):
        query = self.txt_search.text().strip()
        vocab_list = self.db.get_all_vocabulary(filter_text=query)

        self.table_vocab.setRowCount(len(vocab_list))
        for row_idx, item in enumerate(vocab_list):
            self.table_vocab.setItem(row_idx, 0, QTableWidgetItem(str(item['id'])))
            self.table_vocab.setItem(row_idx, 1, QTableWidgetItem(item['japanese']))
            self.table_vocab.setItem(row_idx, 2, QTableWidgetItem(item.get('kana', '')))
            self.table_vocab.setItem(row_idx, 3, QTableWidgetItem(item['vietnamese']))
            self.table_vocab.setItem(row_idx, 4, QTableWidgetItem(item.get('type', '')))
            self.table_vocab.setItem(row_idx, 5, QTableWidgetItem(item.get('jlpt', '')))
            self.table_vocab.setItem(row_idx, 6, QTableWidgetItem(item.get('example_jp', '')))
            self.table_vocab.setItem(row_idx, 7, QTableWidgetItem(item.get('notes', '')))              # Cột 8: Notes / Giải thích
            self.table_vocab.setItem(row_idx, 8, QTableWidgetItem(item.get('allowed_answers', '')))   # Cột 9: Đáp án chấp nhận

        self._update_status_bar()

    def _handle_delete_item(self):
        selected_rows = self.table_vocab.selectedItems()
        if not selected_rows:
            QMessageBox.warning(self, "Chưa chọn mục", "Vui lòng chọn dòng cần xóa trong bảng!")
            return

        row_idx = selected_rows[0].row()
        item_id = int(self.table_vocab.item(row_idx, 0).text())
        jp_text = self.table_vocab.item(row_idx, 1).text()

        confirm = QMessageBox.question(
            self, "Xác nhận xóa", f"Bạn có chắc muốn xóa mục '{jp_text}' khỏi kho SQLite local?",
            QMessageBox.Yes | QMessageBox.No
        )
        if confirm == QMessageBox.Yes:
            self.db.delete_vocabulary(item_id)
            self._refresh_data_table()

    # -------------------------------------------------------------------------
    # TAB CÀI ĐẶT API KEY
    # -------------------------------------------------------------------------
    def _create_settings_view(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(12)

        group = QGroupBox("🔑  Cấu Hình Gemini API Key")
        g_layout = QVBoxLayout(group)
        g_layout.setSpacing(10)

        lbl_info = QLabel(
            "Cấu hình khóa API Google Gemini để bật tính năng:\n"
            "• Chấm điểm phản xạ chính xác, nhận xét lỗi ngữ pháp & phân tích sắc thái\n"
            "• Tự động sinh bài tập/từ vựng theo chủ đề tùy chọn"
        )
        lbl_info.setStyleSheet("color: #94a3b8;")
        g_layout.addWidget(lbl_info)

        row_key = QHBoxLayout()
        row_key.setSpacing(10)
        self.txt_api_key = QLineEdit()
        self.txt_api_key.setEchoMode(QLineEdit.Password)
        if self.ai_service.api_key:
            self.txt_api_key.setText(self.ai_service.api_key)

        btn_save_key = QPushButton("💾  Cập Nhật GEMINI_API_KEY")
        btn_save_key.setProperty("variant", "primary")
        btn_save_key.clicked.connect(self._handle_save_api_key)

        row_key.addWidget(QLabel("GEMINI_API_KEY:"))
        row_key.addWidget(self.txt_api_key, 1)
        row_key.addWidget(btn_save_key)
        g_layout.addLayout(row_key)

        layout.addWidget(group)
        layout.addStretch()
        return widget

    def _handle_save_api_key(self):
        new_key = self.txt_api_key.text().strip()
        self.ai_service.set_api_key(new_key)
        QMessageBox.information(self, "Đã Cập Nhật", "Khóa Gemini API Key đã được lưu thành công!")
        self._update_status_bar()

    def _update_status_bar(self):
        stats = self.db.get_stats_summary()
        ai_status = "🟢 Gemini API Ready" if self.ai_service.is_configured() else "🔴 Chưa Cấu Hình Gemini API Key"
        msg = f"Kho dữ liệu: {stats['total_vocab']} mục | Đã luyện: {stats['total_practices']} lượt | Điểm TB: {stats['avg_score']}/100 | {ai_status}"
        self.status_bar.showMessage(msg)