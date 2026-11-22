import { GoogleGenAI, Type } from '@google/genai';

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: (chunk?: string) => void;
}

const SCHEDULE_RESPONSE_SCHEMA = {
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
};

function isModelNotFoundError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes('404') || msg.includes('not found') || msg.includes('not supported');
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const parsedBody =
      typeof req.body === 'string'
        ? (JSON.parse(req.body || '{}') as { parts?: unknown })
        : ((req.body as { parts?: unknown } | undefined) ?? {});

    const { parts } = parsedBody;
    if (!Array.isArray(parts) || parts.length === 0) {
      res.status(400).json({ error: '분석할 일정 데이터(parts)가 필요합니다.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. Vercel 설정에서 환경 변수를 추가해 주세요.',
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';

    const runGenerate = (model: string) =>
      ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: SCHEDULE_RESPONSE_SCHEMA,
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

    res.status(200).json({ text: response.text ?? '[]' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '일정 분석 요청 처리 중 오류가 발생했습니다.';
    res.status(500).json({ error: message });
  }
}
