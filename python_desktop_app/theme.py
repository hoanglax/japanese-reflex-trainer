"""
===============================================================================
Module: Theme (Bảng Màu & Stylesheet Toàn Cục Cho Ứng Dụng Desktop - Dark Mode)
===============================================================================
Chức năng:
1. Định nghĩa bảng màu Dark Mode dịu mắt, tương phản cao, bo góc hiện đại.
2. Cung cấp 1 QSS (Qt Style Sheet) áp dụng toàn cục qua apply_theme(app).
3. Các nút màu riêng (Primary/Success/Danger/Info) dùng qua thuộc tính "variant",
   ví dụ: btn.setProperty("variant", "success")

Cách dùng:
    from theme import apply_theme
    app = QApplication(sys.argv)
    apply_theme(app)
"""

from PySide6.QtGui import QFont

# ---------------------------------------------------------------------------
# DESIGN TOKENS (DARK MODE)
# ---------------------------------------------------------------------------
COLORS = {
    # Nền tổng thể và Surface
    "bg": "#0f172a",             # Slate 900 - Nền chính sâu, dịu mắt
    "surface": "#1e293b",        # Slate 800 - Nền cho Card / GroupBox / Input
    "surface_hover": "#334155",  # Slate 700 - Trạng thái Hover của các phần tử
    "border": "#334155",         # Viền phân cách tinh tế
    "border_focus": "#38bdf8",   # Viền khi focus (Cyan neon nhẹ)

    # Chữ (Typography)
    "text": "#f8fafc",           # Chữ chính (Trắng ngà, không chói)
    "text_muted": "#94a3b8",     # Chữ phụ / Placeholder / Subtitle

    # Màu sắc chức năng (Button Variants)
    "primary": "#3b82f6",        # Blue
    "primary_hover": "#2563eb",
    "success": "#10b981",        # Emerald Green
    "success_hover": "#059669",
    "danger": "#ef4444",         # Red
    "danger_hover": "#dc2626",
    "info": "#06b6d4",           # Cyan
    "info_hover": "#0891b2",

    # Sidebar / Navigation
    "sidebar_bg": "#0b0f19",
    "sidebar_active": "#3b82f6",
}

FONT_FAMILY = "Segoe UI"
FONT_SIZE_PT = 10


def apply_theme(app):
    """Áp dụng font mặc định + QSS Dark Mode toàn cục cho QApplication."""
    app.setFont(QFont(FONT_FAMILY, FONT_SIZE_PT))
    app.setStyleSheet(_build_qss())


def _build_qss() -> str:
    c = COLORS
    return f"""
    /* ---------- NỀN TỔNG THỂ ---------- */
    QWidget {{
        background-color: {c['bg']};
        color: {c['text']};
        font-family: "{FONT_FAMILY}", "Segoe UI", "Noto Sans JP", sans-serif;
        font-size: {FONT_SIZE_PT}pt;
    }}

    QMainWindow {{
        background-color: {c['bg']};
    }}

    /* ---------- NHÓM (GROUPBOX / CARD) ---------- */
    QGroupBox {{
        background-color: {c['surface']};
        border: 1px solid {c['border']};
        border-radius: 12px;
        margin-top: 18px;
        padding: 16px 14px 14px 14px;
        font-weight: 600;
    }}
    QGroupBox::title {{
        subcontrol-origin: margin;
        left: 14px;
        top: 2px;
        padding: 0 8px;
        color: {c['border_focus']};
        font-size: {FONT_SIZE_PT + 1}pt;
        font-weight: 700;
    }}

    /* ---------- Ô NHẬP LIỆU ---------- */
    QLineEdit, QTextEdit, QTextBrowser, QComboBox, QSpinBox {{
        background-color: {c['bg']};
        color: {c['text']};
        border: 1px solid {c['border']};
        border-radius: 8px;
        padding: 8px 12px;
        selection-background-color: {c['primary']};
        selection-color: white;
    }}
    QLineEdit:focus, QTextEdit:focus, QComboBox:focus, QSpinBox:focus {{
        border: 1.5px solid {c['border_focus']};
    }}
    QLineEdit:disabled, QComboBox:disabled {{
        background-color: #161e2e;
        color: {c['text_muted']};
    }}
    QComboBox::drop-down {{
        border: none;
        width: 24px;
    }}

    /* ---------- NÚT BẤM (BUTTONS) ---------- */
    QPushButton {{
        background-color: {c['surface_hover']};
        color: {c['text']};
        border: 1px solid {c['border']};
        border-radius: 8px;
        padding: 9px 18px;
        font-weight: 600;
    }}
    QPushButton:hover {{
        background-color: #475569;
        border-color: #475569;
    }}
    QPushButton:pressed {{
        background-color: #1e293b;
    }}
    QPushButton:disabled {{
        background-color: #1e293b;
        color: #475569;
        border-color: #1e293b;
    }}

    /* Button Variants */
    QPushButton[variant="primary"] {{ background-color: {c['primary']}; color: white; border: none; }}
    QPushButton[variant="primary"]:hover {{ background-color: {c['primary_hover']}; }}

    QPushButton[variant="success"] {{ background-color: {c['success']}; color: white; border: none; }}
    QPushButton[variant="success"]:hover {{ background-color: {c['success_hover']}; }}

    QPushButton[variant="danger"] {{ background-color: {c['danger']}; color: white; border: none; }}
    QPushButton[variant="danger"]:hover {{ background-color: {c['danger_hover']}; }}

    QPushButton[variant="info"] {{ background-color: {c['info']}; color: white; border: none; }}
    QPushButton[variant="info"]:hover {{ background-color: {c['info_hover']}; }}

    QPushButton:disabled[variant="primary"],
    QPushButton:disabled[variant="success"],
    QPushButton:disabled[variant="danger"],
    QPushButton:disabled[variant="info"] {{
        background-color: #334155;
        color: {c['text_muted']};
    }}

    /* ---------- THANH TIẾN TRÌNH ---------- */
    QProgressBar {{
        border: 1px solid {c['border']};
        border-radius: 8px;
        background-color: {c['bg']};
        text-align: center;
        height: 20px;
        color: {c['text']};
        font-weight: 600;
    }}
    QProgressBar::chunk {{
        background-color: {c['primary']};
        border-radius: 7px;
    }}

    /* ---------- BẢNG DỮ LIỆU ---------- */
    QTableWidget {{
        background-color: {c['surface']};
        border: 1px solid {c['border']};
        border-radius: 8px;
        gridline-color: {c['border']};
        alternate-background-color: #162032;
        color: {c['text']};
    }}
    QHeaderView::section {{
        background-color: #0f172a;
        color: {c['text_muted']};
        padding: 8px;
        border: none;
        border-bottom: 1px solid {c['border']};
        font-weight: 700;
    }}
    QTableWidget::item:selected {{
        background-color: {c['primary']};
        color: white;
    }}

    /* ---------- TAB ---------- */
    QTabWidget::pane {{
        background-color: {c['surface']};
        border: 1px solid {c['border']};
        border-radius: 8px;
        top: -1px;
    }}
    QTabBar::tab {{
        background-color: transparent;
        color: {c['text_muted']};
        padding: 10px 18px;
        font-weight: 600;
        border-bottom: 2px solid transparent;
    }}
    QTabBar::tab:selected {{
        color: {c['border_focus']};
        border-bottom: 2px solid {c['border_focus']};
    }}
    QTabBar::tab:hover {{
        color: {c['text']};
    }}

    /* ---------- THANH TRẠNG THÁI ---------- */
    QStatusBar {{
        background-color: {c['sidebar_bg']};
        border-top: 1px solid {c['border']};
        color: {c['text_muted']};
    }}

    /* ---------- SCROLLBAR GỌN ---------- */
    QScrollBar:vertical {{
        background: transparent;
        width: 8px;
    }}
    QScrollBar::handle:vertical {{
        background: {c['surface_hover']};
        border-radius: 4px;
        min-height: 24px;
    }}
    QScrollBar::handle:vertical:hover {{
        background: {c['text_muted']};
    }}
    QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
        height: 0px;
    }}
    """