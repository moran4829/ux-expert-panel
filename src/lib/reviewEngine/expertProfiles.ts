export type EngineExpertId =
  | 'ux_expert'
  | 'accessibility_expert'
  | 'behavioral_economics_expert'
  | 'cognitive_psychology_expert'
  | 'marketing_expert'
  | 'art_director'
  | 'adhd_attention_expert';

export const EXPERT_ID_TO_ENGINE: Record<string, EngineExpertId> = {
  ux_don_norman: 'ux_expert',
  usability_nielsen: 'ux_expert',
  simplicity_krug: 'ux_expert',
  accessibility_wcag: 'accessibility_expert',
  behavioral_economics: 'behavioral_economics_expert',
  interaction_psychology: 'cognitive_psychology_expert',
  marketing_cro: 'marketing_expert',
  art_director: 'art_director',
  attention_cognitive_load: 'adhd_attention_expert',
  business_domain: 'ux_expert',
};

export const ENGINE_EXPERT_FOCUS: Record<EngineExpertId, string> = {
  ux_expert:
    'User flow clarity, CTA clarity, information hierarchy, navigation, friction points, task completion.',
  accessibility_expert:
    'Contrast, text readability, button clarity, form labels, error prevention, keyboard/screen reader assumptions.',
  behavioral_economics_expert:
    'Choice overload, decision friction, loss aversion, default options, anchoring, trust signals, motivation to act.',
  cognitive_psychology_expert:
    'Cognitive load, memory load, visual scanning, attention management, mental model match, clarity of grouping.',
  marketing_expert:
    'Value proposition, persuasion, trust, conversion, messaging clarity, CTA motivation.',
  art_director:
    'Visual style, consistency, typography, spacing, color usage, visual polish.',
  adhd_attention_expert:
    'Distracting elements, overload, clear next action, short text blocks, visual prioritization, reducing friction.',
};

export const ENGINE_EXPERT_LABELS: Record<EngineExpertId, string> = {
  ux_expert: 'מומחה UX',
  accessibility_expert: 'מומחה נגישות',
  behavioral_economics_expert: 'מומחה כלכלה התנהגותית',
  cognitive_psychology_expert: 'מומחה פסיכולוגיה קוגניטיבית',
  marketing_expert: 'מומחה שיווק והמרה',
  art_director: 'ארט דיירקטור',
  adhd_attention_expert: 'מומחה קשב ועומס קוגניטיבי',
};

export function getEngineExpertId(expertId: string): EngineExpertId {
  return EXPERT_ID_TO_ENGINE[expertId] ?? 'ux_expert';
}
