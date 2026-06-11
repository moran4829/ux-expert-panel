import type { SavedPersona } from '../../types/userSimulation';

export function buildPersonaQuestionsPrompt(role: string): string {
  return `The user wants to define a UX persona for the role: "${role}".
Generate 3 short, closed-ended multiple-choice questions (in Hebrew) to help refine this persona's characteristics, technical literacy, and motivation.
Each question should have 3-4 distinct options.

Return ONLY a JSON array with objects: { "id": string, "question": string, "options": string[] }`;
}

export function buildPersonaDescriptionPrompt(
  role: string,
  qa: { question: string; answer: string[] }[]
): string {
  const qaString = qa.map((item) => `Q: ${item.question}\nA: ${item.answer.join(', ')}`).join('\n');
  return `Based on the role "${role}" and the following answers, write a concise but detailed persona description (in Hebrew).
Focus on their behavior, pain points, and technical proficiency.

${qaString}

Return only the description text string.`;
}

export function buildAnalyzeFlowPrompt(persona: Pick<SavedPersona, 'role' | 'characteristics'>, tasks: string[]): string {
  return `אתה מומחה UX/UI בעל 15 שנות ניסיון. אתה מנתח מסכים (בודד או Flow) לפי מתודולוגיה קפדנית של 9 שלבים.

הפרסונה שלך לניתוח זה:
מי זה (תפקיד/זהות): ${persona.role}
מאפיינים: ${persona.characteristics}

המשימות שהמשתמש מצפה לבצע (עד 3):
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

עליך לנתח את התמונות המצורפות ולספק דוח JSON מלא לפי השלבים הבאים בלבד:

שלב 1: הגדרת הקשר (Context Definition)
מה מטרת המסך? באיזה שלב בפאנל המשתמש נמצא? מה רמת המחויבות הרגשית?

שלב 2: ניתוח היררכיית קשב (Attention Hierarchy)
מה הדבר הראשון והשני שהעין רואה? האם ההיררכיה הויזואלית משרתת את העסקית?

שלב 3: עומס קוגניטיבי (Cognitive Load)
ניתוח עומס אינפורמטיבי, השוואתי, החלטתי (Hick's Law).

שלב 4: ניתוח רגשי (Emotional Friction)
האם מופעל Loss Aversion? לחץ זמן? האם המסך מרגיע או מלחיץ?

שלב 5: חיכוך התנהגותי (Behavioral Friction)
שדות מיותרים, הסחות דעת, נקודות נטישה משוערות.

שלב 6: ניתוח אמון (Trust & Risk)
שקיפות, אבטחה נתפסת, בירוקרטיה.

שלב 7: Event & Funnel Hypothesis
אילו KPI למדוד? איפה יהיה ה-Drop-off המרכזי?

שלב 8: הצעת פתרונות ממוסגרים
לכל בעיה מהותית, ציין רכיב, הבעיה, למה זו בעיה, סיכון לנטישה, ופתרון.

שלב 9: תעדוף (Impact vs Effort)
חלק את הפתרונות ל-Quick wins, Medium impact, Structural redesign.

החזר אך ורק JSON תקין עם השדות:
contextGoal, userCommitmentLevel,
firstElementSeen, secondElementSeen, hierarchyMatch, hierarchyAnalysis,
cognitiveLoadAnalysis, emotionalAnalysis,
frictionPoints, estimatedDropOffRate,
trustAnalysis,
kpiToMeasure, dropOffHypothesis,
solutions (array of { component, problem, whyItsAProblem, abandonmentRisk, solution }),
prioritization ({ quickWins, mediumImpact, structuralRedesign })`;
}

export function buildBusinessContextSupplement(context: {
  goal?: string;
  targetAudience?: string;
  domain?: string;
}): string {
  const parts = [
    context.goal?.trim() ? `מטרת הבדיקה: ${context.goal.trim()}` : null,
    context.targetAudience?.trim() ? `קהל יעד: ${context.targetAudience.trim()}` : null,
    context.domain?.trim() ? `תחום: ${context.domain.trim()}` : null,
  ].filter(Boolean);
  return parts.length ? `\n\nהקשר עסקי משלים:\n${parts.join('\n')}` : '';
}
