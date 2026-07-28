// POST /api/answer-question — handle user question or answer submission
// Stateless: client sends all game context, server returns updated state.

import { DIFFICULTIES, jsonResponse, corsPreflight, callAI, parseAIResponse } from '../_lib.js';

async function generateClue(question, answer, difficulty, cluesGiven, questionCount, apiKey) {
  const diff = DIFFICULTIES.find(d => d.id === difficulty);
  if (!diff || questionCount < diff.clueThreshold || cluesGiven >= diff.maxClues) return null;

  const progress = cluesGiven / diff.maxClues;
  const strategy = progress < 0.3 ? '提供一个简单的背景信息，不要涉及核心真相，控制在20字内'
    : progress < 0.6 ? '给出一个人物动机的暗示，保持模糊，控制在25字内'
    : progress < 0.9 ? '提供一个关键细节，引导正确思考方向，控制在30字内'
    : '给出最后的关键提示，但仍需要玩家推理，控制在25字内';

  const systemPrompt = `你是海龟汤游戏的线索提供者。规则：1. ${strategy} 2. 线索要简洁明了，绝对不能超过30字 3. 不能直接暴露答案，要引导玩家思考 4. 线索要与题目和答案逻辑一致 5. 根据难度${difficulty}调整线索的隐蔽程度`;
  const prompt = `题目：${question}\n答案：${answer}\n难度：${difficulty}\n已提供线索数：${cluesGiven}/${diff.maxClues}\n玩家提问数：${questionCount}\n请提供一个简短有用的线索，不超过30字。`;

  try {
    const clueResponse = await callAI(prompt, systemPrompt, apiKey);
    const clean = clueResponse.replace(/线索[：:]?\s*/g, '').replace(/提示[：:]?\s*/g, '').replace(/^[：:\s]+/, '').trim();
    if (clean.length > 0 && clean.length <= 30) return clean;
  } catch { /* fallback */ }

  const fallbacks = ['注意人物行为细节', '思考时间地点关系', '考虑人物动机', '从不合理处入手', '关注关键词'];
  return fallbacks[cluesGiven % fallbacks.length];
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  if (context.request.method !== 'POST') return jsonResponse({ success: false, error: 'Method not allowed' }, 405);

  const { env } = context;
  const apiKey = env.SENSENOVA_API_KEY;

  let body;
  try { body = await context.request.json(); } catch {
    return jsonResponse({ success: false, error: '请求体格式错误' }, 400);
  }

  const { sessionId, question, answer, difficulty, qaHistory, cluesGiven, userInput } = body;
  if (!sessionId || !question || !answer || !difficulty || !userInput?.trim()) {
    return jsonResponse({ success: false, error: '缺少必要参数' }, 400);
  }

  const userInputTrimmed = userInput.trim();
  const history = Array.isArray(qaHistory) ? qaHistory : [];
  const currentCluesGiven = typeof cluesGiven === 'number' ? cluesGiven : 0;
  const questionCount = history.length + 1;
  const isAnswerSubmission = /答案是|我的答案是|答案：|最终答案|我认为答案是/i.test(userInputTrimmed);

  if (isAnswerSubmission) {
    // Answer submission — judge the user's answer
    const systemPrompt = `你是海龟汤游戏的评判者。请仔细比较用户答案和标准答案。评判标准：1. 用户是否理解了核心真相和关键原因 2. 用户答案包含了标准答案的主要要素 3. 允许表述方式不同，但核心逻辑要正确 4. 如果用户答案基本正确但缺少细节，也应认定为正确。请只回答"正确"或"不正确"，并给出简短的评价理由。`;
    const prompt = `题目：${question}\n标准答案：${answer}\n用户答案：${userInputTrimmed}\n请判断用户答案是否正确。`;

    try {
      const aiResponse = await callAI(prompt, systemPrompt, apiKey);
      const parseResult = parseAIResponse(aiResponse, 'answer');
      if (!parseResult.success) return jsonResponse({ success: false, error: '答案验证失败，请重试' }, 500);

      const isCorrect = parseResult.data;
      return jsonResponse({
        success: true,
        type: 'answer_result',
        isCorrect,
        message: isCorrect ? '🎉 恭喜你！答案正确！' : '答案不够准确，继续推理吧！',
        fullAnswer: answer,
        questionsAsked: history.length,
        cluesUsed: currentCluesGiven,
        ...(isCorrect ? {} : { hint: '再仔细想想关键细节，或者继续提问获取更多线索...', correctAnswer: answer }),
      });
    } catch {
      return jsonResponse({ success: false, error: '答案验证失败，请重试' }, 500);
    }
  }

  // Yes/no question
  const diffInfo = DIFFICULTIES.find(d => d.id === difficulty);
  const nightmareNote = diffInfo?.id === 'nightmare' ? '5. 对于困难问题，偶尔可以回答"部分正确"' : '';
  const systemPrompt = `你是海龟汤游戏的主持人。根据题目和答案，对用户问题简洁回答。回答规则：1. 如果问题与解答有直接关系且答案为肯定：回答"是" 2. 如果问题与解答有直接关系且答案为否定：回答"否" 3. 如果问题与核心真相无关：回答"无关" 4. 如果问题基于错误假设：回答"线索错误"\n${nightmareNote}\n题目：${question}\n答案：${answer}\n玩家已问问题数：${history.length}\n请根据规则简洁回答，只用一个词。`;
  const prompt = `用户问题：${userInputTrimmed}\n请根据题目和答案回答"是"、"否"、"无关"或"线索错误"。`;

  try {
    const aiResponse = await callAI(prompt, systemPrompt, apiKey);
    const parseResult = parseAIResponse(aiResponse, 'qa');
    if (!parseResult.success) return jsonResponse({ success: false, error: '处理问题失败，请重试' }, 500);

    const response = parseResult.data;
    let newCluesGiven = currentCluesGiven;

    let clue = null;
    if (diffInfo && questionCount % diffInfo.clueThreshold === 0) {
      clue = await generateClue(question, answer, difficulty, currentCluesGiven, questionCount, apiKey);
      if (clue) newCluesGiven++;
    }

    return jsonResponse({
      success: true,
      type: 'qa_response',
      response,
      clue,
      totalQuestions: history.length + 1,
      cluesReceived: newCluesGiven,
      hint: questionCount === 1 ? '很好的开始！继续提问来获取更多线索。'
        : clue ? '恭喜获得新线索！仔细分析这个提示。'
        : questionCount === 5 && currentCluesGiven === 0 ? '继续提问，即将获得第一个线索！'
        : questionCount > 15 && currentCluesGiven < 2 ? '思考一下已有信息，尝试从不同角度提问。'
        : null,
    });
  } catch {
    return jsonResponse({ success: false, error: '处理问题失败，请重试' }, 500);
  }
}
