import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Google GenAI SDK server-side
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // API Route: Generate vocabulary & sentences by topic using Gemini
  app.post("/api/ai/generate-vocab", async (req, res) => {
    try {
      const { topic, count = 5, jlpt = "N3" } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Chủ đề (topic) không được để trống" });
      }

      const ai = getAI();
      const prompt = `Bạn là một chuyên gia giảng dạy tiếng Nhật. Hãy tạo ${count} từ vựng/mẫu câu/cụm từ phản xạ thuộc chủ đề "${topic}" trình độ ${jlpt} cho người Việt học tiếng Nhật.
Yêu cầu:
1. Từ/Mẫu câu tiếng Nhật chính xác (gồm Kanji/Kana).
2. Romaji phiên âm chuẩn.
3. Nghĩa tiếng Việt tự nhiên.
4. Loại từ (Danh từ, Động từ, Tính từ, Mẫu ngữ pháp, Cụm từ giao tiếp, v.v.).
5. Câu ví dụ thực tế kèm nghĩa tiếng Việt.
6. Mẹo ghi nhớ hoặc ghi chú sắc thái dùng.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Danh sách từ vựng/cấu trúc tiếng Nhật sinh bởi AI",
            items: {
              type: Type.OBJECT,
              properties: {
                japanese: { type: Type.STRING, description: "Từ/Mẫu câu tiếng Nhật (Kanji/Kana)" },
                kana: { type: Type.STRING, description: "Cách đọc Kana/Furigana" },
                romaji: { type: Type.STRING, description: "Phiên âm Romaji" },
                vietnamese: { type: Type.STRING, description: "Nghĩa tiếng Việt chuẩn" },
                type: { type: Type.STRING, description: "Loại từ/cấu trúc" },
                jlpt: { type: Type.STRING, description: "Trình độ JLPT (N5-N1)" },
                exampleJp: { type: Type.STRING, description: "Ví dụ tiếng Nhật" },
                exampleVi: { type: Type.STRING, description: "Dịch ví dụ tiếng Việt" },
                notes: { type: Type.STRING, description: "Sắc thái hoặc ghi chú sử dụng" },
              },
              required: ["japanese", "kana", "vietnamese", "type", "exampleJp", "exampleVi"],
            },
          },
        },
      });

      const jsonText = response.text || "[]";
      const items = JSON.parse(jsonText);
      res.json({ success: true, items });
    } catch (error: any) {
      console.error("Error generating vocab with Gemini:", error);
      res.status(500).json({
        error: "Không thể sinh từ vựng bằng AI. " + (error?.message || "Lỗi không xác định."),
      });
    }
  });

  // API Route: Evaluate Reflex Answer
  app.post("/api/reflex/evaluate", async (req, res) => {
    try {
      const { promptQuestion, targetExpected, userAnswer, direction = "jp-to-vi", contextNotes } = req.body;

      if (!userAnswer || !userAnswer.trim()) {
        return res.json({
          success: true,
          evaluation: {
            score: 0,
            isCorrect: false,
            feedback: "Bạn chưa nhập câu trả lời.",
            suggestedCorrection: targetExpected,
            explanation: "Hãy cố gắng nhập phản xạ ngay cả khi chưa chắc chắn!",
            naturalExample: "",
            nuanceNote: "",
          },
        });
      }

      const ai = getAI();
      const prompt = `Bạn là giám khảo chấm thi phản xạ tiếng Nhật - tiếng Việt cực kỳ chuyên nghiệp.
      
[ĐỐI TƯỢNG VÀ BÀI TẬP]
- Hướng luyện tập: ${direction === "jp-to-vi" ? "Tiếng Nhật -> Tiếng Việt" : "Tiếng Việt -> Tiếng Nhật"}
- Đề bài (Prompt): "${promptQuestion}"
- Đáp án tham chiếu (Expected): "${targetExpected}"
- Câu trả lời của học viên (User Answer): "${userAnswer}"
- Ghi chú/Ngữ cảnh bổ sung: "${contextNotes || "Không có"}"

[NHIỆM VỤ Chấm Điểm & Nhận Xét Phản Xạ]
1. Đánh giá độ chính xác (score: 0 đến 100).
   - Đánh giá theo ngữ nghĩa và phản xạ tự nhiên, không bắt buộc phải trùng từ từng chữ nếu nghĩa hoàn toàn đúng trong ngữ cảnh giao tiếp.
   - Nếu hướng là Vi->Jp, chấp nhận các cách nói tự nhiên khác cùng ý nghĩa.
2. Xác định isCorrect (true nếu score >= 75).
3. Đưa ra nhận xét ngắn gọn (feedback).
4. Sửa lỗi hoặc đưa ra câu chuẩn nhất (suggestedCorrection).
5. Giải thích lý do/ngữ pháp/sắc thái từ (explanation).
6. Đưa ra 1 câu ví dụ mẫu tự nhiên dùng từ/cấu trúc này trong thực tế (naturalExample).
7. Ghi chú về sắc thái từ hoặc hoàn cảnh sử dụng (nuanceNote).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Điểm số từ 0 đến 100" },
              isCorrect: { type: Type.BOOLEAN, description: "Đạt yêu cầu phản xạ hay chưa" },
              feedback: { type: Type.STRING, description: "Đánh giá vắn tắt" },
              suggestedCorrection: { type: Type.STRING, description: "Câu trả lời chuẩn xác/tự nhiên nhất" },
              explanation: { type: Type.STRING, description: "Phân tích ngữ pháp và lỗi sai" },
              naturalExample: { type: Type.STRING, description: "Ví dụ thực tế tự nhiên" },
              nuanceNote: { type: Type.STRING, description: "Lưu ý sắc thái giao tiếp" },
            },
            required: ["score", "isCorrect", "feedback", "suggestedCorrection", "explanation"],
          },
        },
      });

      const jsonText = response.text || "{}";
      const evaluation = JSON.parse(jsonText);
      res.json({ success: true, evaluation });
    } catch (error: any) {
      console.error("Error evaluating reflex with Gemini:", error);
      res.status(500).json({
        error: "Lỗi khi kiểm tra phản xạ bằng AI: " + (error?.message || "Lỗi server"),
      });
    }
  });

  // API Route: Custom AI Prompt for developer testing
  app.post("/api/ai/custom-prompt", async (req, res) => {
    try {
      const { promptText, systemInstruction } = req.body;
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: promptText,
        config: {
          systemInstruction: systemInstruction || "Bạn là trợ lý AI thông minh về ngôn ngữ tiếng Nhật.",
        },
      });
      res.json({ success: true, result: response.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Serve Vite in development, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
