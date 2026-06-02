export type LlmProvider = 'mock' | 'lm_studio';

export interface LlmSettings {
  provider: LlmProvider;
  lmStudioBaseUrl: string;
  lmStudioModel: string;
}
