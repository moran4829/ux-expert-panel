export const VISION_EXTRACTION_SYSTEM = `You are a UI screen parser.
Analyze the uploaded screen image objectively.
Do not give UX recommendations yet.
Extract only what is visible in the screen.
Return valid JSON only — no markdown fences, no commentary.`;

export const VISION_EXTRACTION_USER = `Return a valid JSON with the following structure:

{
  "screen_summary": "",
  "visible_texts": [],
  "main_components": [],
  "navigation_elements": [],
  "forms_and_inputs": [],
  "buttons_and_ctas": [],
  "visual_hierarchy": {
    "primary_area": "",
    "secondary_areas": [],
    "dominant_elements": []
  },
  "layout_structure": "",
  "colors_and_contrast_notes": [],
  "possible_accessibility_observations": [],
  "unclear_elements": []
}`;
