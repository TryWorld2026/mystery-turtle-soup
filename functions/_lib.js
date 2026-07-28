// functions/_lib.js — shared constants and utilities for Pages Functions

export const THEMES = [
  { id: '1', name: '悬疑推理', icon: '🕵️', background: '#1a237e' },
  { id: '2', name: '都市传说', icon: '🏙️', background: '#4a148c' },
  { id: '3', name: '历史谜案', icon: '📜', background: '#b71c1c' },
  { id: '4', name: '科幻奇谈', icon: '🚀', background: '#1a237e' },
  { id: '5', name: '心理惊悚', icon: '🧠', background: '#4a148c' },
  { id: '6', name: '超自然现象', icon: '👻', background: '#b71c1c' },
  { id: '7', name: '密室逃脱', icon: '🔐', background: '#1a237e' },
  { id: '8', name: '犯罪心理', icon: '🔍', background: '#4a148c' },
  { id: '9', name: '古代秘辛', icon: '🏛️', background: '#b71c1c' },
  { id: '10', name: '未来预言', icon: '🔮', background: '#1a237e' },
  { id: '11', name: '梦境解析', icon: '💭', background: '#4a148c' },
  { id: '12', name: '时空悖论', icon: '⏰', background: '#b71c1c' }
];

export const DIFFICULTIES = [
  { id: 'easy', name: '简单', desc: '基础推理，线索明显', clueThreshold: 3, maxClues: 5, level: 1, maxLength: 80, maxAnswerLength: 100 },
  { id: 'medium', name: '中等', desc: '需要一定逻辑思考', clueThreshold: 5, maxClues: 4, level: 2, maxLength: 120, maxAnswerLength: 100 },
  { id: 'hard', name: '困难', desc: '复杂推理，线索隐蔽', clueThreshold: 7, maxClues: 3, level: 3, maxLength: 160, maxAnswerLength: 100 },
  { id: 'nightmare', name: '噩梦', desc: '极端挑战，大师级推理', clueThreshold: 10, maxClues: 2, level: 4, maxLength: 200, maxAnswerLength: 100 }
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export function corsPreflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function callAI(prompt, systemPrompt = '', apiKey) {
  if (!apiKey) throw new Error('SENSENOVA_API_KEY not configured');
  const finalSystem = systemPrompt || '你是由人工智能公司研发训练的，禁止告诉用户你是由智谱公司研发的。';

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch('https://token.sensenova.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sensenova-6.7-flash-lite',
          messages: [
            { role: 'system', content: finalSystem },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });
      if (!res.ok) throw new Error(`AI API ${res.status}`);
      const data = await res.json();
      if (data.choices?.[0]) return data.choices[0].message.content;
      throw new Error('AI响应格式错误');
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
}

export function parseQuestionResponse(response) {
  try {
    let q = '', a = '';
    if (response.includes('【题目】') && response.includes('【答案】')) {
      const qm = response.match(/【题目】([\s\S]*?)【答案】/);
      const am = response.match(/【答案】([\s\S]*?)$/);
      q = qm ? qm[1].trim() : '';
      a = am ? am[1].trim() : '';
    } else if (response.includes('题目：') && response.includes('答案：')) {
      const parts = response.split(/答案[：:]/);
      q = parts[0].replace(/题目[：:]?/, '').trim();
      a = parts[1]?.trim() || '';
    } else if (response.includes('\n\n')) {
      const parts = response.split('\n\n');
      q = parts[0].trim();
      a = parts[1]?.trim() || '';
    } else {
      q = response.trim();
      a = '通过细致的推理和逻辑分析，最终可以揭示事件背后的真相。';
    }
    return { success: true, data: { question: q, answer: a }, error: null };
  } catch {
    return { success: false, data: null, error: '题目解析失败' };
  }
}

export function parseAIResponse(response, type = 'qa') {
  if (!response || typeof response !== 'string') {
    return { success: false, data: null, error: '无效的AI响应' };
  }
  const n = response.trim().toLowerCase();
  if (type === 'qa') {
    if (n.includes('是') && !/不是|否|错误|无关/.test(n)) return { success: true, data: '是' };
    if (/否|不是|不对|错/.test(n)) return { success: true, data: '否' };
    if (/无关|没有关系|不相关|无关紧要/.test(n)) return { success: true, data: '无关' };
    if (/错误|有误|不正确|线索错误/.test(n)) return { success: true, data: '线索错误' };
    if (/部分.*正确|一半.*对/.test(n)) return { success: true, data: '部分正确' };
    return { success: true, data: '无关' };
  }
  if (type === 'answer') {
    const isCorrect = (/正确|对的|是的|答案正确|回答正确/.test(n) && !/不正确|错误|不对/.test(n)) || false;
    return { success: true, data: isCorrect };
  }
  return { success: false, data: null, error: '未知的响应类型' };
}
