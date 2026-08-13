"""
===============================================================================
Module: AIService (Google Gemini GenAI SDK Service Wrapper)
Architecture Layer: Service / Business Logic Layer
===============================================================================
Chức năng:
1. Kết nối Google Gemini API thông qua gói SDK mới: google-genai.
2. Tự động sinh dữ liệu từ vựng/mẫu câu theo chủ đề yêu cầu.
3. Chấm điểm bài làm phản xạ tiếng Nhật, sửa lỗi ngữ pháp và phân tích sắc thái.
4. Đóng gói độc lập để Developer dễ dàng đổi Prompt / nâng cấp mô hình.

Extensibility Points:
- # TODO: [Developer Extension] Thêm Whisper API / Speech-to-Text native local
- # TODO: [Developer Extension] Thay đổi Prompt Template tùy chỉnh theo ngành nghề
- # TODO: [Developer Extension] Cấu hình tham số Temperature & System Instruction
"""

import os
import json
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

class AIService:
    def __init__(self, api_key: Optional[str] = None):
        """
        Khởi tạo AIService kết nối Gemini API.
        Tự động lấy GEMINI_API_KEY từ biến môi trường nếu không truyền trực tiếp.
        """
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.client = None
        if self.api_key:
            self._init_client()

    def set_api_key(self, api_key: str):
        """Cập nhật API Key và khởi tạo lại client."""
        self.api_key = api_key
        self._init_client()

    def _init_client(self):
        """
        Khởi tạo GoogleGenAI Client với SDK chính thức google-genai.
        """
        try:
            self.client = genai.Client(api_key=self.api_key)
        except Exception as e:
            print(f"[AIService Warning] Không thể khởi tạo Google GenAI Client: {e}")

    def is_configured(self) -> bool:
        """Kiểm tra xem API Key đã được cấu hình hợp lệ hay chưa."""
        return bool(self.client and self.api_key)

    # -------------------------------------------------------------------------
    # 1. AI VOCABULARY & SENTENCE GENERATOR
    # -------------------------------------------------------------------------
    def generate_vocabulary_by_topic(self, topic: str, count: int = 5, jlpt: str = "N3") -> List[Dict[str, Any]]:
        """
        Sử dụng Gemini sinh danh sách từ vựng/mẫu câu phản xạ theo Chủ đề & Trình độ JLPT.
        Returns: Danh sách các dict dữ liệu chuẩn hóa.
        """
        if not self.is_configured():
            raise ValueError("GEMINI_API_KEY chưa được cấu hình. Vui lòng nhập API Key trong phần Cài đặt.")

        prompt = f"""
        Bạn là chuyên gia giảng dạy phản xạ tiếng Nhật.
        Hãy tạo danh sách {count} từ vựng / cụm câu giao tiếp phản xạ theo chủ đề: "{topic}" (Trình độ {jlpt}).
        
        Trả về kết quả chuẩn định dạng JSON Array chứa các object có các thuộc tính:
        - "japanese": Từ/câu tiếng Nhật chính xác (Kanji + Kana)
        - "kana": Cách đọc Kana
        - "romaji": Phiên âm Romaji
        - "vietnamese": Nghĩa tiếng Việt chuẩn giao tiếp
        - "type": Loại từ/cấu trúc (VD: Động từ, Danh từ, Mẫu ngữ pháp, Cụm giao tiếp)
        - "jlpt": Trình độ JLPT (N5, N4, N3, N2, N1)
        - "example_jp": Ví dụ mẫu bằng tiếng Nhật
        - "example_vi": Dịch nghĩa ví dụ bằng tiếng Việt
        - "notes": Sắc thái sử dụng hoặc lưu ý đặc biệt
        """

        # TODO: [Developer Extension] Bạn có thể tùy chỉnh Prompt Template hoặc bổ sung System Instructions riêng
        try:
            response = self.client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )
            data = json.loads(response.text)
            return data if isinstance(data, list) else []
        except Exception as e:
            print(f"[AIService Error] Lỗi khi sinh từ vựng AI: {e}")
            raise e

    # -------------------------------------------------------------------------
    # 2. AI FLASH REFLEX EVALUATOR & GRAMMAR CHECKER
    # -------------------------------------------------------------------------
    def evaluate_reflex_answer(self, prompt_question: str, target_expected: str, 
                               user_answer: str, direction: str = "jp-to-vi", 
                               notes: str = "") -> Dict[str, Any]:
        """
        Đánh giá câu trả lời phản xạ của người dùng bằng Gemini AI.
        
        Parameters:
        - prompt_question: Đề bài (Tiếng Nhật hoặc Tiếng Việt)
        - target_expected: Đáp án gợi ý trong kho
        - user_answer: Câu trả lời nhập từ người dùng
        - direction: "jp-to-vi" hoặc "vi-to-jp"
        """
        if not self.is_configured():
            # Nếu chưa có API Key, thực hiện chấm sơ bộ bằng so sánh chuỗi
            is_match = user_answer.strip().lower() in target_expected.strip().lower()
            return {
                "score": 100 if is_match else 50,
                "isCorrect": is_match,
                "feedback": "Chấm điểm Offline (Chưa cấu hình Gemini API Key)",
                "suggestedCorrection": target_expected,
                "explanation": "Nạp GEMINI_API_KEY để nhận phân tích chi tiết ngữ pháp và sắc thái từ AI.",
                "naturalExample": "",
                "nuanceNote": ""
            }

        prompt = f"""
        Bạn là giám khảo chấm thi phản xạ tiếng Nhật - Việt chuyên nghiệp.
        
        - Hướng kiểm tra: {"Tiếng Nhật -> Tiếng Việt" if direction == "jp-to-vi" else "Tiếng Việt -> Tiếng Nhật"}
        - Đề bài: "{prompt_question}"
        - Đáp án mẫu trong kho: "{target_expected}"
        - Câu trả lời người dùng: "{user_answer}"
        - Ghi chú/Ngữ cảnh: "{notes}"

        Nhiệm vụ:
        1. Đánh giá độ chính xác về mặt ngữ nghĩa và tự nhiên trong giao tiếp (Score từ 0 đến 100).
        2. Chấp nhận các câu diễn đạt khác nếu đúng nghĩa trong thực tế.
        3. Nhận xét ngắn gọn (feedback).
        4. Đưa ra phiên bản chuẩn xác/tự nhiên nhất (suggestedCorrection).
        5. Giải thích lý do/lỗi sai ngữ pháp (explanation).
        6. Cho 1 câu ví dụ mẫu thực tế (naturalExample).
        7. Ghi chú về sắc thái (nuanceNote).

        Trả về JSON Object theo đúng định dạng các key:
        {{"score": int, "isCorrect": bool, "feedback": str, "suggestedCorrection": str, "explanation": str, "naturalExample": str, "nuanceNote": str}}
        """

        try:
            response = self.client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"[AIService Error] Lỗi khi chấm điểm bằng AI: {e}")
            return {
                "score": 0,
                "isCorrect": False,
                "feedback": f"Lỗi gọi Gemini API: {str(e)}",
                "suggestedCorrection": target_expected,
                "explanation": "Đã xảy ra lỗi mạng hoặc API Key không hợp lệ.",
                "naturalExample": "",
                "nuanceNote": ""
            }
