import { LlmSettings } from '../types/llm';

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  provider: 'lm_studio',
  lmStudioBaseUrl: 'http://localhost:1234/v1',
  lmStudioModel: 'google/gemma-4-e4b',
};
