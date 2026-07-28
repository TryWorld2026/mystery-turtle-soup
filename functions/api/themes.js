// GET /api/themes — list all themes

import { THEMES, jsonResponse, corsPreflight } from '../../_lib.js';

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return corsPreflight();
  return jsonResponse(THEMES);
}
