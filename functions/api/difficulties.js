// GET /api/difficulties — list all difficulty levels

import { DIFFICULTIES, jsonResponse, corsPreflight } from '../_lib.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  return jsonResponse(DIFFICULTIES);
}
