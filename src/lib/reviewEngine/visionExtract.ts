import { chatForTask } from '../llmRouter';
import { LlmSettings } from '../../types/llm';
import { ScreenExtraction } from '../../types/reviewEngine';
import { ReviewProject } from '../../types';
import { parseJsonResponse } from './parseJson';
import { VISION_EXTRACTION_SYSTEM, VISION_EXTRACTION_USER } from './prompts/vision';

function normalizeScreenExtraction(raw: Partial<ScreenExtraction>): ScreenExtraction {
  return {
    screen_summary: raw.screen_summary ?? '',
    visible_texts: raw.visible_texts ?? [],
    main_components: raw.main_components ?? [],
    navigation_elements: raw.navigation_elements ?? [],
    forms_and_inputs: raw.forms_and_inputs ?? [],
    buttons_and_ctas: raw.buttons_and_ctas ?? [],
    visual_hierarchy: {
      primary_area: raw.visual_hierarchy?.primary_area ?? '',
      secondary_areas: raw.visual_hierarchy?.secondary_areas ?? [],
      dominant_elements: raw.visual_hierarchy?.dominant_elements ?? [],
    },
    layout_structure: raw.layout_structure ?? '',
    colors_and_contrast_notes: raw.colors_and_contrast_notes ?? [],
    possible_accessibility_observations: raw.possible_accessibility_observations ?? [],
    unclear_elements: raw.unclear_elements ?? [],
  };
}

export async function extractScreenFromImage(
  imageDataUrl: string,
  settings: LlmSettings
): Promise<ScreenExtraction> {
  const content = await chatForTask(
    settings,
    'vision_extract',
    [
      { role: 'system', content: VISION_EXTRACTION_SYSTEM },
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_EXTRACTION_USER },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ],
    { maxTokens: 2048, temperature: 0.2 }
  );

  try {
    return normalizeScreenExtraction(parseJsonResponse<Partial<ScreenExtraction>>(content));
  } catch {
    const retry = await chatForTask(
      settings,
      'vision_extract',
      [
        { role: 'system', content: VISION_EXTRACTION_SYSTEM },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${VISION_EXTRACTION_USER}\n\nPrevious response was invalid JSON. Return ONLY valid JSON.`,
            },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
      { maxTokens: 2048, temperature: 0.1 }
    );
    return normalizeScreenExtraction(parseJsonResponse<Partial<ScreenExtraction>>(retry));
  }
}

export async function runVisionExtractionForProject(
  project: ReviewProject,
  settings: LlmSettings
): Promise<ScreenExtraction | null> {
  const imageUrl = project.material?.imageDataUrl;
  if (!imageUrl) return null;
  if (settings.taskModels.vision_extract.provider === 'mock') return null;
  return extractScreenFromImage(imageUrl, settings);
}

export function formatScreenExtractionForPrompt(extraction: ScreenExtraction): string {
  return JSON.stringify(extraction, null, 2);
}
