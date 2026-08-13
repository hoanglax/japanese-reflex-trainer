"""
===============================================================================
Module: GUIReflexMode (Flash Reflex Training Mode - Chế Độ Phản Xạ Nhanh)
Architecture Layer: View / Interactive Presentation Layer
===============================================================================
Chức năng:
1. Hiển thị đề bài phản xạ ngẫu nhiên (Nhật -> Việt hoặc Việt -> Nhật).
2. Đồng hồ đếm ngược thời gian phản xạ (Timer) tạo áp lực rèn luyện.
3. Nhập câu trả lời và so khớp thông minh với đáp án chấp nhận (allowed_answers).
4. Tự động hiển thị Ghi chú, Ngữ cảnh & Ví dụ minh họa khi chấm điểm.
5. Hỗ trợ phím tắt Enter, Space và tự động chuyển câu sau 1.5 giây.
"""

import re
import time
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, 
    QPushButton, QProgressBar, QGroupBox, QTextBrowser, QComboBox, QMessageBox
)
from PySide6.QtCore import Qt, QTimer, Signal
from data_manager import DataManager
from ai_service import AIService


class ReflexModeWidget(QWidget):
    def __init__(self, data_manager: DataManager, ai_service: AIService, parent=None):
        super().__init__(parent)
        self.db = data_manager
        self.ai_service = ai_service

        self.current_item = None
        self.start_time = 0
        self.time_limit_sec = 10
        self.remaining_sec = 10
        self.direction = "jp-to-vi"  # "jp-to-vi" hoặc "vi-to-jp"
        self.is_running = False  # Phiên luyện tập đang chạy hay chưa

        self.timer = QTimer(self)
        self.timer.setInterval(1000)
        self.timer.timeout.connect(self._on_timer_tick)

        # Timer riêng để tự động chuyển câu sau khi hiện kết quả (có thể hủy được)
        self.advance_timer = QTimer(self)
        self.advance_timer.setSingleShot(True)
        self.advance_timer.timeout.connect(self._advance_to_next_question)

        self._init_ui()

    def _init_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)

        # ---------------------------------------------------------------------
        # 1. THANH CẤU HÌNH PHẢN XẠ
        # ---------------------------------------------------------------------
        config_box = QGroupBox("⚙️  Cấu Hình Chế Độ Phản Xạ Nhanh")
        cfg_layout = QHBoxLayout(config_box)
        cfg_layout.setSpacing(10)

        self.cbo_direction = QComboBox()
        self.cbo_direction.addItems(["Tiếng Nhật ➔ Tiếng Việt", "Tiếng Việt ➔ Tiếng Nhật"])
        self.cbo_direction.currentIndexChanged.connect(self._on_direction_changed)

        self.cbo_timer = QComboBox()
        self.cbo_timer.addItems(["5 Giây (Rất Nhanh)", "10 Giây (Chuẩn)", "15 Giây (Thoải Mái)"])
        self.cbo_timer.setCurrentIndex(1)
        self.cbo_timer.currentIndexChanged.connect(self._on_timer_config_changed)

        self.btn_start_new = QPushButton("🎲  Đổi Câu Khác")
        self.btn_start_new.setProperty("variant", "info")
        self.btn_start_new.clicked.connect(self.load_next_question)
        self.btn_start_new.setEnabled(False)

        cfg_layout.addWidget(QLabel("Hướng phản xạ:"))
        cfg_layout.addWidget(self.cbo_direction, 1)
        cfg_layout.addWidget(QLabel("Thời gian giới hạn:"))
        cfg_layout.addWidget(self.cbo_timer, 1)
        cfg_layout.addWidget(self.btn_start_new)

        layout.addWidget(config_box)

        # ---------------------------------------------------------------------
        # 2. NÚT BẮT ĐẦU / KẾT THÚC PHIÊN
        # ---------------------------------------------------------------------
        session_box = QHBoxLayout()
        self.btn_start_stop = QPushButton("▶️   Bắt Đầu Luyện Tập")
        self.btn_start_stop.setProperty("variant", "success")
        self.btn_start_stop.setMinimumWidth(240)
        self.btn_start_stop.setStyleSheet("font-size: 14px; padding: 12px 24px;")
        self.btn_start_stop.clicked.connect(self._toggle_session)
        session_box.addStretch()
        session_box.addWidget(self.btn_start_stop)
        session_box.addStretch()
        layout.addLayout(session_box)

        # ---------------------------------------------------------------------
        # 3. KHUNG ĐỀ BÀI & ĐẾM NGƯỢC
        # ---------------------------------------------------------------------
        prompt_box = QGroupBox("⚡  Đề Bài Phản Xạ")
        p_layout = QVBoxLayout(prompt_box)
        p_layout.setSpacing(10)

        self.lbl_question = QLabel("Nhấn '▶️ Bắt Đầu Luyện Tập' để mở câu luyện tập!")
        self.lbl_question.setAlignment(Qt.AlignCenter)
        self.lbl_question.setWordWrap(True)
        self.lbl_question.setStyleSheet(
            "font-size: 24px; font-weight: 700; color: #f8fafc; padding: 18px; "
            "background-color: #1e293b; border-radius: 10px;"
        )
        p_layout.addWidget(self.lbl_question)

        self.lbl_hint = QLabel("")
        self.lbl_hint.setAlignment(Qt.AlignCenter)
        self.lbl_hint.setStyleSheet("font-size: 13px; color: #94a3b8;")
        p_layout.addWidget(self.lbl_hint)

        # Đồng hồ đếm ngược
        self.progress_timer = QProgressBar()
        self.progress_timer.setRange(0, 100)
        self.progress_timer.setValue(100)
        self.progress_timer.setTextVisible(True)
        self.progress_timer.setFormat("⏳ Thời gian còn lại: %v%")
        p_layout.addWidget(self.progress_timer)

        layout.addWidget(prompt_box)

        # ---------------------------------------------------------------------
        # 4. KHUNG NHẬP CÂU TRẢ LỜI
        # ---------------------------------------------------------------------
        answer_box = QGroupBox("✍️  Câu Trả Lời Phản Xạ Của Bạn")
        a_layout = QHBoxLayout(answer_box)
        a_layout.setSpacing(10)

        self.txt_answer = QLineEdit()
        self.txt_answer.setPlaceholderText("Gõ phản xạ của bạn ở đây và nhấn Enter...")
        self.txt_answer.setStyleSheet("font-size: 15px; padding: 10px 12px;")
        self.txt_answer.returnPressed.connect(self._handle_submit)
        self.txt_answer.setEnabled(False)

        self.btn_submit = QPushButton("🚀  Đánh Giá")
        self.btn_submit.setProperty("variant", "success")
        self.btn_submit.clicked.connect(self._handle_submit)
        self.btn_submit.setEnabled(False)

        a_layout.addWidget(self.txt_answer, 1)
        a_layout.addWidget(self.btn_submit)

        layout.addWidget(answer_box)

        # ---------------------------------------------------------------------
        # 5. KHUNG KẾT QUẢ & GIẢI THÍCH (FEEDBACK BOX)
        # ---------------------------------------------------------------------
        ai_box = QGroupBox("📊  Kết Quả Phản Xạ & Giải Thích Ngữ Cảnh")
        ai_layout = QVBoxLayout(ai_box)

        self.txt_ai_feedback = QTextBrowser()
        self.txt_ai_feedback.setStyleSheet("border: none; background: transparent;")
        self.txt_ai_feedback.setHtml("<p style='color:#94a3b8;'>Kết quả chấm điểm và giải thích chi tiết sẽ hiển thị ở đây...</p>")
        ai_layout.addWidget(self.txt_ai_feedback)

        layout.addWidget(ai_box)

    # -------------------------------------------------------------------------
    # ACTION CONTROL & EVENT HANDLERS
    # -------------------------------------------------------------------------
    def _on_direction_changed(self, idx):
        self.direction = "jp-to-vi" if idx == 0 else "vi-to-jp"
        if self.is_running:
            self.load_next_question()

    def _on_timer_config_changed(self, idx):
        limits = [5, 10, 15]
        self.time_limit_sec = limits[idx]
        if self.is_running:
            self.load_next_question()

    def _toggle_session(self):
        if self.is_running:
            self._stop_session()
        else:
            self._start_session()

    def _start_session(self):
        """Bắt đầu phiên luyện tập: mở khóa các control và tải câu hỏi đầu tiên."""
        self.is_running = True
        self.btn_start_stop.setText("⏹   Kết Thúc Phiên")
        self.btn_start_stop.setProperty("variant", "danger")
        self._repolish(self.btn_start_stop)
        self.btn_start_new.setEnabled(True)
        self.txt_answer.setEnabled(True)
        self.btn_submit.setEnabled(True)
        self.cbo_direction.setEnabled(False)
        self.cbo_timer.setEnabled(False)
        self.load_next_question()

    def _stop_session(self):
        """Kết thúc phiên luyện tập: dừng timer và khóa lại các control."""
        self.is_running = False
        self.timer.stop()
        self.advance_timer.stop()
        self.current_item = None

        self.btn_start_stop.setText("▶️   Bắt Đầu Luyện Tập")
        self.btn_start_stop.setProperty("variant", "success")
        self._repolish(self.btn_start_stop)
        self.btn_start_new.setEnabled(False)
        self.txt_answer.setEnabled(False)
        self.btn_submit.setEnabled(False)
        self.cbo_direction.setEnabled(True)
        self.cbo_timer.setEnabled(True)

        self.txt_answer.clear()
        self.lbl_question.setText("Nhấn '▶️ Bắt Đầu Luyện Tập' để mở câu luyện tập!")
        self.lbl_hint.setText("")
        self.progress_timer.setValue(100)

    @staticmethod
    def _repolish(widget):
        """Buộc Qt áp dụng lại QSS sau khi đổi thuộc tính động (setProperty)."""
        widget.style().unpolish(widget)
        widget.style().polish(widget)

    def load_next_question(self):
        # Hủy mọi lịch tự động chuyển câu còn treo từ trước
        self.advance_timer.stop()

        items = self.db.get_random_vocabulary(1)
        if not items:
            self.lbl_question.setText("Kho từ vựng đang trống. Vui lòng nạp thêm dữ liệu!")
            return

        self.current_item = items[0]
        self.remaining_sec = self.time_limit_sec
        self.start_time = time.time()

        if self.is_running:
            self.txt_answer.setEnabled(True)
            self.btn_submit.setEnabled(True)

        if self.direction == "jp-to-vi":
            self.lbl_question.setText(self.current_item['japanese'])
            kana_str = f"({self.current_item['kana']})" if self.current_item.get('kana') else ""
            self.lbl_hint.setText(f"Cách đọc: {kana_str} | Loại từ: {self.current_item.get('type', '')}")
        else:
            self.lbl_question.setText(self.current_item['vietnamese'])
            self.lbl_hint.setText(f"Loại từ: {self.current_item.get('type', '')} | Cấp độ: {self.current_item.get('jlpt', '')}")

        self.txt_answer.clear()
        self.txt_answer.setFocus()
        self.txt_ai_feedback.setHtml("<p style='color:#94a3b8;'>Sẵn sàng phản xạ...</p>")

        self.progress_timer.setValue(100)
        self.timer.start()

    def _on_timer_tick(self):
        self.remaining_sec -= 1
        pct = int((self.remaining_sec / self.time_limit_sec) * 100)
        self.progress_timer.setValue(max(0, pct))

        if self.remaining_sec <= 0:
            self.timer.stop()
            self._handle_timeout()

    def _handle_timeout(self):
        self.lbl_hint.setText("⚠️ Hết thời gian phản xạ! Tự động kiểm tra...")
        self._handle_submit()

    # -------------------------------------------------------------------------
    # XỬ LÝ CHẤM ĐIỂM THÔNG MINH & TỰ ĐỘNG HIỂN THỊ GIẢI THÍCH
    # -------------------------------------------------------------------------
    def _handle_submit(self):
        self.timer.stop()
        if not self.current_item:
            return

        # Khóa tạm ô nhập/nút gửi trong lúc hiển thị kết quả
        self.txt_answer.setEnabled(False)
        self.btn_submit.setEnabled(False)

        user_ans = self.txt_answer.text().strip()
        elapsed_ms = int((time.time() - self.start_time) * 1000)

        prompt_q = self.current_item['japanese'] if self.direction == "jp-to-vi" else self.current_item['vietnamese']
        
        # So sánh thông minh dựa trên Smart Checker
        score, is_corr = self._local_check(user_ans, self.current_item, self.direction)
        
        # Lấy thông tin chi tiết phục vụ hiển thị
        correct_display = self.current_item['vietnamese'] if self.direction == "jp-to-vi" else self.current_item['japanese']
        notes = self.current_item.get('notes', '')
        ex_jp = self.current_item.get('example_jp', '')
        ex_vi = self.current_item.get('example_vi', '')

        color_code = "#10b981" if is_corr else "#ef4444"
        status_txt = "ĐẠT PHẢN XẠ 🎯" if is_corr else "CẦN LUYỆN THÊM ❌"

        # Dựng nội dung Feedback HTML bao gồm cả GIẢI THÍCH & VÍ DỤ
        feedback_parts = []
        if notes:
            feedback_parts.append(f"<p style='margin-top: 8px;'><b>📌 Ghi chú / Ngữ cảnh:</b> {notes}</p>")
        if ex_jp:
            ex_html = f"<p style='margin-top: 4px; color: #38bdf8;'><b>💬 Ví dụ:</b> {ex_jp}"
            if ex_vi:
                ex_html += f"<br>&nbsp;&nbsp;&nbsp;&nbsp;➔ <i>{ex_vi}</i>"
            ex_html += "</p>"
            feedback_parts.append(ex_html)

        extra_info_html = "".join(feedback_parts)

        html_out = f"""
        <div style='font-family: sans-serif; font-size: 13px; color: #f8fafc;'>
            <h3 style='color: {color_code}; margin-bottom: 6px; font-size: 16px;'>Điểm phản xạ: {score}/100 - {status_txt}</h3>
            <p><b>⏱️ Thời gian đáp:</b> {round(elapsed_ms/1000.0, 2)} giây</p>
            <p><b>✍️ Câu trả lời của bạn:</b> {user_ans if user_ans else '<i>(bỏ trống)</i>'}</p>
            <p><b>✨ Đáp án chuẩn:</b> <span style='color: #38bdf8; font-weight: bold;'>{correct_display}</span></p>
            {extra_info_html}
        </div>
        """

        self.txt_ai_feedback.setHtml(html_out)

        # Lưu nhật ký vào SQLite local
        self.db.record_practice_log(
            vocab_id=self.current_item['id'],
            prompt_q=prompt_q,
            user_ans=user_ans,
            correct_ans=correct_display,
            score=score,
            response_time_ms=elapsed_ms,
            ai_feedback=notes
        )

        # Tự động chuyển sang câu tiếp theo sau 1.5 giây
        if self.is_running:
            self.current_item = None
            self.lbl_hint.setText("➡️ Câu tiếp theo sau 1.5 giây...")
            self.advance_timer.start(1500)

    def _advance_to_next_question(self):
        """Được gọi tự động sau khi hiển thị kết quả, để chuyển sang câu kế tiếp."""
        if not self.is_running:
            return
        self.txt_answer.setEnabled(True)
        self.btn_submit.setEnabled(True)
        self.load_next_question()

    # -------------------------------------------------------------------------
    # SMART CHECKER (CHẤM ĐIỂM MỀM DẺO HỖ TRỢ ALLOWED_ANSWERS & KHÔNG DẤU)
    # -------------------------------------------------------------------------
    @staticmethod
    def _local_check(user_ans: str, item: dict, direction: str) -> tuple[int, bool]:
        """
        So sánh câu trả lời thông minh:
        - Bỏ qua hoa/thường, khoảng trắng thừa, dấu câu (?, !, .).
        - Hỗ trợ phân tách danh sách đáp án chấp nhận qua dấu phẩy, gạch chéo, gạch đứng.
        - Phân biệt hướng Nhật->Việt (so sánh với allowed_answers/vietnamese) 
          và Việt->Nhật (so sánh với japanese/kana).
        """
        user_clean = user_ans.strip().lower()
        user_clean = re.sub(r'[^\w\s]', '', user_clean)  # Loại bỏ dấu câu

        if not user_clean:
            return 0, False

        # Xác định chuỗi đáp án chuẩn tùy theo hướng phản xạ
        if direction == "jp-to-vi":
            raw_target = item.get('allowed_answers') or item.get('vietnamese', '')
        else:
            jp = item.get('japanese', '')
            kana = item.get('kana', '')
            raw_target = f"{jp}, {kana}" if kana and kana != jp else jp

        # Tách danh sách đáp án chấp nhận theo các dấu phân cách: , / |
        valid_targets = re.split(r'[,/|]', raw_target)

        for target in valid_targets:
            target_clean = target.strip().lower()
            target_clean = re.sub(r'[^\w\s]', '', target_clean)
            
            if user_clean == target_clean:
                return 100, True

        return 0, False