import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const app = express();
app.use(express.json({ limit: '25mb' }));

function isModelNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes('404') || msg.includes('not found') || msg.includes('not supported');
}

app.post('/api/parse-schedule', async (req: Request, res: Response) => {
  try {
    const { parts } = req.body ?? {};
    if (!Array.isArray(parts) || parts.length === 0) {
      res.status(400).json({ error: '분석할 일정 데이터(parts)가 필요합니다.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' });
      return;
    }

    const primaryModel = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';
    const runGenerate = (model: string) =>
      ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: '공연명 또는 프로그램명' },
                venue: { type: Type.STRING, description: '유치원, 어린이집, 기관명 등 공연 장소' },
                date: { type: Type.STRING, description: 'YYYY-MM-DD 형식 날짜' },
                time: { type: Type.STRING, description: 'HH:MM 형식 공연 시작 시간' },
                contact: { type: Type.STRING, description: '담당자 연락처 (없으면 빈 문자열)' },
                notes: { type: Type.STRING, description: '특이사항, 주차, 대상 연령 등 메모 (없으면 빈 문자열)' },
              },
              required: ['title', 'venue', 'date', 'time'],
            },
          },
        },
      });

    let response;
    try {
      response = await runGenerate(primaryModel);
    } catch (primaryErr) {
      if (primaryModel !== 'gemini-2.5-flash' && isModelNotFoundError(primaryErr)) {
        response = await runGenerate('gemini-2.5-flash');
      } else {
        throw primaryErr;
      }
    }

    res.json({ text: response.text ?? '[]' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '일정 분석 요청 처리 중 오류가 발생했습니다.';
    res.status(500).json({ error: message });
  }
});

let initialized = false;

async function setupFrontendAndListen() {
  if (initialized) return;
  initialized = true;

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

setupFrontendAndListen();

export default app;
