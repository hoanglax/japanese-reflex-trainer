"""
===============================================================================
Module: DataManager (Database & File Storage Management)
Architecture Layer: Data Access Layer / Persistence Repository
===============================================================================
Chức năng:
1. Quản lý cơ sở dữ liệu SQLite local lưu trữ Từ vựng, Ngữ pháp, Mẫu câu.
2. Lưu nhật ký phản xạ (Practice Logs) và thông số Lặp lại Ngắt quãng (SRS).
3. Hỗ trợ nạp dữ liệu từ File (CSV, JSON, TXT) và Xuất dữ liệu ra file.

Extensibility Points:
- # TODO: [Developer Extension] Spaced Repetition (Anki SM-2 / Leitner custom algorithm)
- # TODO: [Developer Extension] CFFI / C++ Native SQLite accelerator
"""

import sqlite3
import json
import csv
import os
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

class DataManager:
    def __init__(self, db_path: str = "japanese_reflex.db"):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Khởi tạo các bảng SQLite local nếu chưa tồn tại."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Bảng Kho từ vựng & Cấu trúc ngữ pháp
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS vocabulary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                japanese TEXT NOT NULL,
                kana TEXT,
                romaji TEXT,
                vietnamese TEXT NOT NULL,
                type TEXT DEFAULT 'Từ vựng',
                jlpt TEXT DEFAULT 'N3',
                example_jp TEXT,
                example_vi TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Thông số SRS (Spaced Repetition System)
                srs_level INTEGER DEFAULT 0,
                ease_factor REAL DEFAULT 2.5,
                interval_days INTEGER DEFAULT 0,
                next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                mastery_score INTEGER DEFAULT 0
            )
            """)

            # Bảng Nhật ký luyện phản xạ (Reflex Practice Logs)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS practice_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vocab_id INTEGER,
                prompt_question TEXT,
                user_answer TEXT,
                correct_answer TEXT,
                score INTEGER,
                response_time_ms INTEGER,
                ai_feedback TEXT,
                practiced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vocab_id) REFERENCES vocabulary (id) ON DELETE SET NULL
            )
            """)
            conn.commit()

            # Nếu cơ sở dữ liệu trống, nạp sẵn một số mẫu câu cơ bản
            cursor.execute("SELECT COUNT(*) FROM vocabulary")
            if cursor.fetchone()[0] == 0:
                self._seed_initial_data()

    def _seed_initial_data(self):
        """Nạp dữ liệu mẫu ban đầu để ứng dụng sẵn sàng luyện tập ngay."""
        sample_items = [
            {
                "japanese": "お疲れ様でした",
                "kana": "おつかれさまでした",
                "romaji": "Otsukaresama deshita",
                "vietnamese": "Anh/Chị đã làm việc vất vả rồi",
                "type": "Cụm giao tiếp",
                "jlpt": "N4",
                "example_jp": "今日も一日、お疲れ様でした。",
                "example_vi": "Cảm ơn anh chị vì một ngày làm việc vất vả.",
                "notes": "Dùng rất phổ biến ở công ty Nhật khi hết giờ làm."
            },
            {
                "japanese": "確認する",
                "kana": "かくにんする",
                "romaji": "Kakininsuru",
                "vietnamese": "Xác nhận / Kiểm tra lại",
                "type": "Động từ",
                "jlpt": "N3",
                "example_jp": "スケジュールをもう一度確認します。",
                "example_vi": "Tôi sẽ xác nhận lại lịch trình một lần nữa.",
                "notes": "Rất hay gặp trong công việc IT & Kinh doanh."
            }
        ]
        for item in sample_items:
            self.add_vocabulary(item)

    # -------------------------------------------------------------------------
    # BASIC CRUD OPERATIONS
    # -------------------------------------------------------------------------

    def add_vocabulary(self, item: Dict[str, Any]) -> int:
        """Thêm một mục từ/câu mới vào CSDL."""
        jp = item.get('japanese', '').strip()
        vi = item.get('vietnamese', '').strip()
        
        # Đảm bảo không insert chuỗi rỗng vào NOT NULL
        if not jp or not vi:
            return 0

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO vocabulary (japanese, kana, romaji, vietnamese, type, jlpt, example_jp, example_vi, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                jp,
                item.get('kana', '').strip(),
                item.get('romaji', '').strip(),
                vi,
                item.get('type', 'Từ vựng').strip(),
                item.get('jlpt', 'N3').strip(),
                item.get('example_jp', '').strip(),
                item.get('example_vi', '').strip(),
                item.get('notes', '').strip()
            ))
            conn.commit()
            return cursor.lastrowid

    def get_all_vocabulary(self, filter_text: str = "", category: str = "Tất cả") -> List[Dict[str, Any]]:
        """Lấy danh sách từ vựng kèm lọc tìm kiếm."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM vocabulary WHERE 1=1"
            params = []

            if filter_text:
                query += " AND (japanese LIKE ? OR vietnamese LIKE ? OR kana LIKE ?)"
                like_str = f"%{filter_text}%"
                params.extend([like_str, like_str, like_str])

            if category and category != "Tất cả":
                query += " AND type = ?"
                params.append(category)

            query += " ORDER BY id DESC"
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def delete_vocabulary(self, vocab_id: int) -> bool:
        """Xóa mục từ vựng khỏi CSDL."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM vocabulary WHERE id = ?", (vocab_id,))
            conn.commit()
            return cursor.rowcount > 0

    def get_random_vocabulary(self, count: int = 1) -> List[Dict[str, Any]]:
        """Lấy ngẫu nhiên câu từ kho để luyện phản xạ."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM vocabulary ORDER BY RANDOM() LIMIT ?", (count,))
            return [dict(row) for row in cursor.fetchall()]

    # -------------------------------------------------------------------------
    # SRS (SPACED REPETITION) ALGORITHM & LOGGING
    # -------------------------------------------------------------------------

    def record_practice_log(self, vocab_id: int, prompt_q: str, user_ans: str, 
                               correct_ans: str, score: int, response_time_ms: int, ai_feedback: str):
        """Lưu kết quả lượt thực hành phản xạ."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO practice_logs (vocab_id, prompt_question, user_answer, correct_answer, score, response_time_ms, ai_feedback)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (vocab_id, prompt_q, user_ans, correct_ans, score, response_time_ms, ai_feedback))
            
            if vocab_id:
                self.update_srs_stats(vocab_id, score, conn)
            
            conn.commit()

    def update_srs_stats(self, vocab_id: int, score: int, conn=None):
        """Cập nhật thuật toán Lặp lại Ngắt quãng (SRS)."""
        should_close = False
        if conn is None:
            conn = self._get_connection()
            should_close = True

        cursor = conn.cursor()
        cursor.execute("SELECT srs_level, ease_factor, interval_days, mastery_score FROM vocabulary WHERE id = ?", (vocab_id,))
        row = cursor.fetchone()
        if not row:
            if should_close: conn.close()
            return

        srs_level, ease_factor, interval_days, mastery_score = row
        quality = max(0, min(5, int(score / 20)))

        new_ef = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        new_ef = max(1.3, new_ef)

        if quality >= 3:
            if srs_level == 0:
                new_interval = 1
            elif srs_level == 1:
                new_interval = 6
            else:
                new_interval = int(interval_days * new_ef)
            new_level = srs_level + 1
            new_mastery = min(100, mastery_score + 15)
        else:
            new_interval = 1
            new_level = 0
            new_mastery = max(0, mastery_score - 20)

        MAX_INTERVAL_DAYS = 3650
        new_interval = min(new_interval, MAX_INTERVAL_DAYS)
        next_review_date = datetime.now() + timedelta(days=new_interval)

        cursor.execute("""
        UPDATE vocabulary 
        SET srs_level = ?, ease_factor = ?, interval_days = ?, next_review = ?, mastery_score = ?
        WHERE id = ?
        """, (new_level, new_ef, new_interval, next_review_date.strftime('%Y-%m-%d %H:%M:%S'), new_mastery, vocab_id))

        if should_close:
            conn.commit()
            conn.close()

    # -------------------------------------------------------------------------
    # FILE IMPORT & EXPORT (CSV, JSON, TXT) - ĐÃ BẮT BỆNH LỖI 0 MỤC
    # -------------------------------------------------------------------------

    def import_from_file(self, file_path: str) -> int:
        """Đọc file CSV, JSON hoặc TXT với UTF-8 encoding và lưu vào SQLite."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File không tồn tại: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()
        imported_count = 0

        if ext == '.json':
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if self.add_vocabulary(item) > 0:
                            imported_count += 1

        elif ext == '.csv':
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    item = {
                        'japanese': row.get('japanese') or row.get('Từ tiếng Nhật') or row.get('japanese_text', ''),
                        'kana': row.get('kana') or row.get('Cách đọc') or '',
                        'romaji': row.get('romaji') or '',
                        'vietnamese': row.get('vietnamese') or row.get('Nghĩa tiếng Việt') or '',
                        'type': row.get('type') or row.get('Loại từ') or 'Từ vựng',
                        'jlpt': row.get('jlpt') or row.get('Trình độ') or 'N3',
                        'example_jp': row.get('example_jp') or row.get('Ví dụ JP') or '',
                        'example_vi': row.get('example_vi') or row.get('Dịch ví dụ') or '',
                        'notes': row.get('notes') or row.get('Ghi chú') or ''
                    }
                    if self.add_vocabulary(item) > 0:
                        imported_count += 1

        elif ext == '.txt':
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                lines = f.readlines()
                print(f"=== DEBUG: Tìm thấy {len(lines)} dòng trong file ===")
                for i, line in enumerate(lines):
                    line = line.strip()
                    if not line or line.startswith('#'): 
                        continue
                    
                    parts = [p.strip() for p in line.split('|')]
                    print(f"Dòng {i+1}: raw='{line}' | parts={parts} | count={len(parts)}")
                    
                    if len(parts) >= 2:
                        jp = parts[0]
                        vi = parts[1]
                        kana = parts[2] if len(parts) > 2 else jp
                        item_type = parts[3] if len(parts) > 3 else 'Từ vựng'
                        notes = parts[4] if len(parts) > 4 else ''

                        item = {
                            'japanese': jp,
                            'vietnamese': vi,
                            'kana': kana,
                            'type': item_type,
                            'notes': notes
                        }
                        
                        row_id = self.add_vocabulary(item)
                        if row_id > 0:
                            imported_count += 1

        return imported_count

    def export_to_json(self, output_path: str):
        """Xuất toàn bộ dữ liệu ra file JSON."""
        all_vocab = self.get_all_vocabulary()
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(all_vocab, f, ensure_ascii=False, indent=2)

    def get_stats_summary(self) -> Dict[str, Any]:
        """Thống kê tổng quan dữ liệu và tiến trình học."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM vocabulary")
            total_vocab = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*), AVG(score), AVG(response_time_ms) FROM practice_logs")
            log_row = cursor.fetchone()
            total_practices = log_row[0] or 0
            avg_score = round(log_row[1] or 0, 1)
            avg_speed_sec = round((log_row[2] or 0) / 1000.0, 2)

            return {
                "total_vocab": total_vocab,
                "total_practices": total_practices,
                "avg_score": avg_score,
                "avg_speed_sec": avg_speed_sec
            }