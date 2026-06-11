export function extractJsonFromText(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function repairTruncatedJson(jsonStr: string): string {
  let repaired = jsonStr.trim();
  if (!repaired) return repaired;

  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  const openBraces = (repaired.match(/{/g) ?? []).length;
  const closeBraces = (repaired.match(/}/g) ?? []).length;
  const openBrackets = (repaired.match(/\[/g) ?? []).length;
  const closeBrackets = (repaired.match(/]/g) ?? []).length;

  repaired += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
  repaired += '}'.repeat(Math.max(0, openBraces - closeBraces));
  return repaired;
}

export function parseJsonResponse<T>(text: string): T {
  const jsonStr = extractJsonFromText(text);
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return JSON.parse(repairTruncatedJson(jsonStr)) as T;
  }
}
