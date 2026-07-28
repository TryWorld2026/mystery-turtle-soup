// POST /api/generate-question — create a new game session with AI-generated question

import { THEMES, DIFFICULTIES, jsonResponse, corsPreflight, callAI, parseQuestionResponse } from '../_lib.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'POST') return jsonResponse({ success: false, error: 'Method not allowed' }, 405);

  const { env } = context;
  const apiKey = env.SENSENOVA_API_KEY;

  let body;
  try { body = await context.request.json(); } catch {
    return jsonResponse({ success: false, error: '请求体格式错误' }, 400);
  }

  const { theme, difficulty } = body;
  if (!theme || !difficulty) return jsonResponse({ success: false, error: '主题和难度不能为空' }, 400);

  const themeInfo = THEMES.find(t => t.id === theme);
  const diffInfo = DIFFICULTIES.find(d => d.id === difficulty);
  if (!themeInfo || !diffInfo) return jsonResponse({ success: false, error: '无效的主题或难度' }, 400);

  let questionData;
  try {
    const systemPrompt = `你是专业的海龟汤游戏出题者。请生成一个${themeInfo.name}主题的海龟汤题目。要求：1. 题目要有悬念和推理性，符合${themeInfo.name}风格 2. 答案要合理且出人意料，难度适合${diffInfo.name}水平 3. 严格按照格式：【题目】具体题目内容【答案】具体答案内容 4. 题目长度严格限制在${diffInfo.maxLength}字以内，答案长度严格限制在${diffInfo.maxAnswerLength}字以内 5. 确保逻辑严密，答案能完美解释题目中的疑点 6. 避免过于复杂的情节设置，保持简洁明了 7. 难度要求：${diffInfo.desc}`;
    const prompt = `请为${themeInfo.name}主题、${diffInfo.name}难度生成一个海龟汤题目。要求题目简洁明了，长度不超过${diffInfo.maxLength}字，答案不超过${diffInfo.maxAnswerLength}字。请确保题目新颖有趣，长度适中，答案令人恍然大悟。`;

    const aiResponse = await callAI(prompt, systemPrompt, apiKey);
    const parsed = parseQuestionResponse(aiResponse);
    if (!parsed.success) throw new Error(parsed.error);

    let { question, answer } = parsed.data;
    if (question.length > diffInfo.maxLength) question = question.substring(0, diffInfo.maxLength - 3) + '...';
    if (answer.length > diffInfo.maxAnswerLength) answer = answer.substring(0, diffInfo.maxAnswerLength - 3) + '...';

    questionData = {
      content: question, answer,
      theme: themeInfo.name,
      contentLength: question.length, answerLength: answer.length, source: 'ai_generated',
    };
  } catch {
    return jsonResponse({ success: false, error: '题目生成失败，请重试' }, 500);
  }

  const fallbackQuestion = `${themeInfo.name}背景下，一个简单而神秘的事件。请通过提问来揭示真相。`;
  const fallbackAnswer = '通过仔细分析可以发现，这个现象有其合理的解释。关键在于理解当时的具体情况。';
  const finalQuestion = questionData.content.length >= 15 ? questionData.content : fallbackQuestion;
  const finalAnswer = questionData.answer.length >= 20 ? questionData.answer : fallbackAnswer;

  const sessionId = crypto.randomUUID();

  return jsonResponse({
    success: true,
    sessionId,
    theme: themeInfo.name,
    difficulty: diffInfo.name,
    difficultyId: diffInfo.id,
    question: finalQuestion,
    answer: finalAnswer,
    hint: '开始你的推理吧！提问时尽量简洁明了。',
    source: questionData.source,
    questionLength: questionData.contentLength || finalQuestion.length,
    answerLength: questionData.answerLength || finalAnswer.length,
    maxLength: diffInfo.maxLength,
    maxAnswerLength: diffInfo.maxAnswerLength,
  });
}
