"""
===============================================================================
Module: GUIReflexMode (Flash Reflex Training Mode - Chế Độ Phản Xạ Nhanh)
Architecture Layer: View / Interactive Presentation Layer
===============================================================================
Chức năng:
1. Hiển thị đề bài phản xạ ngẫu nhiên (Nhật -> Việt hoặc Việt -> Nhật).
2. Đồng hồ đếm ngược thời gian phản xạ (Timer) tạo áp lực rèn luyện.
3. Nhập câu trả lời và gửi tới Gemini AI để chấm điểm, sửa ngữ pháp & phân tích sắc thái.
4. Hỗ trợ phím tắt Enter, Space.
"""

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
        self.direction = "jp-to-vi" # "jp-to-vi" hoặc "vi-to-jp"

        self.timer = QTimer(self)
        self.timer.setInterval(1000)
        self.timer.timeout.connect(self._on_timer_tick)

        self._init_ui()

    def _init_ui(self):
        layout = QVBoxLayout(self)

        # Thanh Cấu Hình Phản Xạ (Hướng & Thời gian đếm ngược)
        config_box = QGroupBox("⚙️ Cấu Hình Chế Độ Phản Xạ Nhanh")
        cfg_layout = QHBoxLayout(config_box)

        self.cbo_direction = QComboBox()
        self.cbo_direction.addItems(["Tiếng Nhật ➔ Tiếng Việt", "Tiếng Việt ➔ Tiếng Nhật"])
        self.cbo_direction.currentIndexChanged.connect(self._on_direction_changed)

        self.cbo_timer = QComboBox()
        self.cbo_timer.addItems(["5 Giây (Rất Nhanh)", "10 Giây (Chuẩn)", "15 Giây (Thoải Mái)"])
        self.cbo_timer.setCurrentIndex(1)
        self.cbo_timer.currentIndexChanged.connect(self._on_timer_config_changed)

        btn_start_new = QPushButton("🎲 Đổi Câu Khác (Shortcut: Enter/Space)")
        btn_start_new.setStyleSheet("background-color: #00838f; color: white; font-weight: bold; padding: 6px 12px;")
        btn_start_new.clicked.connect(self.load_next_question)

        cfg_layout.addWidget(QLabel("Hướng phản xạ:"))
        cfg_layout.addWidget(self.cbo_direction)
        cfg_layout.addWidget(QLabel("Thời gian giới hạn:"))
        cfg_layout.addWidget(self.cbo_timer)
        cfg_layout.addWidget(btn_start_new)

        layout.addWidget(config_box)

        # Khung Đề Bái & Đếm Ngược Timer
        prompt_box = QGroupBox("⚡ Đề Bài Phản Xạ (Prompt)")
        p_layout = QVBoxLayout(prompt_box)

        self.lbl_question = QLabel("Nhấn 'Bắt đầu' hoặc nút 'Đổi câu' để mở câu luyện tập!")
        self.lbl_question.setAlignment(Qt.AlignCenter)
        self.lbl_question.setStyleSheet("font-size: 22px; font-weight: bold; color: #1a237e; padding: 15px;")
        p_layout.addWidget(self.lbl_question)

        self.lbl_hint = QLabel("")
        self.lbl_hint.setAlignment(Qt.AlignCenter)
        self.lbl_hint.setStyleSheet("font-size: 13px; color: #666;")
        p_layout.addWidget(self.lbl_hint)

        # Đồng hồ đếm ngược
        self.progress_timer = QProgressBar()
        self.progress_timer.setRange(0, 100)
        self.progress_timer.setValue(100)
        self.progress_timer.setTextVisible(True)
        self.progress_timer.setFormat("⏳ Thời gian còn lại: %v%")
        p_layout.addWidget(self.progress_timer)

        layout.addWidget(prompt_box)

        # Khung Nhập Câu Trả Lời
        answer_box = QGroupBox("✍️ Câu Trả Lời Phản Xạ Của Bạn")
        a_layout = QHBoxLayout(answer_box)

        self.txt_answer = QLineEdit()
        self.txt_answer.setPlaceholderText("Gõ phản xạ của bạn ở đây và nhấn Enter...")
        self.txt_answer.setStyleSheet("font-size: 16px; padding: 8px;")
        self.txt_answer.returnPressed.connect(self._handle_submit)

        self.btn_submit = QPushButton("🚀 Đánh Giá (Enter)")
        self.btn_submit.setStyleSheet("background-color: #2e7d32; color: white; font-weight: bold; padding: 8px 16px;")
        self.btn_submit.clicked.connect(self._handle_submit)

        a_layout.addWidget(self.txt_answer)
        a_layout.addWidget(self.btn_submit)

        layout.addWidget(answer_box)

        # Khung Phân Tích Đánh Giá Bằng AI
        ai_box = QGroupBox("🤖 Phân Tích & Nhận Xét Từ Gemini AI")
        ai_layout = QVBoxLayout(ai_box)

        self.txt_ai_feedback = QTextBrowser()
        self.txt_ai_feedback.setHtml("<p style='color:#888;'>Kết quả phân tích ngữ pháp, điểm số và ví dụ thực tế sẽ hiển thị ở đây sau khi bạn gửi câu trả lời...</p>")
        ai_layout.addWidget(self.txt_ai_feedback)

        layout.addWidget(ai_box)

    def _on_direction_changed(self, idx):
        self.direction = "jp-to-vi" if idx == 0 else "vi-to-jp"
        self.load_next_question()

    def _on_timer_config_changed(self, idx):
        limits = [5, 10, 15]
        self.time_limit_sec = limits[idx]
        self.load_next_question()

    def load_next_question(self):
        items = self.db.get_random_vocabulary(1)
        if not items:
            self.lbl_question.setText("Kho từ vựng đang trống. Vui lòng nạp thêm dữ liệu!")
            return

        self.current_item = items[0]
        self.remaining_sec = self.time_limit_sec
        self.start_time = time.time()

        if self.direction == "jp-to-vi":
            self.lbl_question.setText(self.current_item['japanese'])
            kana_str = f"({self.current_item['kana']})" if self.current_item.get('kana') else ""
            self.lbl_hint.setText(f"Cách đọc: {kana_str} | Loại từ: {self.current_item.get('type', '')}")
        else:
            self.lbl_question.setText(self.current_item['vietnamese'])
            self.lbl_hint.setText(f"Loại từ: {self.current_item.get('type', '')} | Cấp độ: {self.current_item.get('jlpt', '')}")

        self.txt_answer.clear()
        self.txt_answer.setFocus()
        self.txt_ai_feedback.setHtml("<p style='color:#888;'>Sẵn sàng phản xạ...</p>")

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

    def _handle_submit(self):
        self.timer.stop()
        if not self.current_item:
            return

        user_ans = self.txt_answer.text().strip()
        elapsed_ms = int((time.time() - self.start_time) * 1000)

        prompt_q = self.current_item['japanese'] if self.direction == "jp-to-vi" else self.current_item['vietnamese']
        target_expected = self.current_item['vietnamese'] if self.direction == "jp-to-vi" else self.current_item['japanese']

        self.txt_ai_feedback.setHtml("<i>⏳ Gemini AI đang phân tích và chấm điểm phản xạ...</i>")

        # Gọi AIService chấm điểm
        eval_result = self.ai_service.evaluate_reflex_answer(
            prompt_question=prompt_q,
            target_expected=target_expected,
            user_answer=user_ans,
            direction=self.direction,
            notes=self.current_item.get('notes', '')
        )

        score = eval_result.get('score', 0)
        is_corr = eval_result.get('isCorrect', False)
        feedback = eval_result.get('feedback', '')
        correction = eval_result.get('suggestedCorrection', target_expected)
        explanation = eval_result.get('explanation', '')
        example = eval_result.get('naturalExample', '')
        nuance = eval_result.get('nuanceNote', '')

        color_code = "#2e7d32" if is_corr else "#c62828"
        status_txt = "ĐẠT PHẢN XẠ 🎯" if is_corr else "CẦN Luyện Thêm ❌"

        html_out = f"""
        <div style='font-family: sans-serif;'>
            <h3 style='color: {color_code}; margin-bottom: 5px;'>Điểm phản xạ: {score}/100 - {status_txt}</h3>
            <p><b>⏱️ Thời gian đáp:</b> {round(elapsed_ms/1000.0, 2)} giây</p>
            <p><b>💡 Nhận xét:</b> {feedback}</p>
            <p><b>✨ Đáp án gợi ý chuẩn nhất:</b> <span style='color: #1565c0; font-weight: bold;'>{correction}</span></p>
            <p><b>🔍 Phân tích ngữ pháp & Lỗi sai:</b> {explanation}</p>
        """
        if example:
            html_out += f"<p><b>💬 Ví dụ giao tiếp thực tế:</b> <i>{example}</i></p>"
        if nuance:
            html_out += f"<p><b>📌 Sắc thái sử dụng:</b> {nuance}</p>"

        html_out += "</div>"

        self.txt_ai_feedback.setHtml(html_out)

        # Lưu nhật ký vào SQLite local
        self.db.record_practice_log(
            vocab_id=self.current_item['id'],
            prompt_q=prompt_q,
            user_ans=user_ans,
            correct_ans=correction,
            score=score,
            response_time_ms=elapsed_ms,
            ai_feedback=explanation
        )
