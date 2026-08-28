// Controlled normalization only — deliberately NOT fuzzy/distance-based.
// This accepts harmless formatting differences (case, spacing, trailing
// punctuation) but will not accept a genuinely different word or a
// near-miss like "Business Minder" vs "Business Minded".

const TRAILING_PUNCTUATION = /[.,!?;:।]+$/g;

export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(TRAILING_PUNCTUATION, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isCorrectAnswer(
  submitted: string,
  officialAnswer: string,
  officialKeyword: string
): boolean {
  const normalizedSubmitted = normalizeAnswer(submitted);
  if (!normalizedSubmitted) return false;
  return (
    normalizedSubmitted === normalizeAnswer(officialAnswer) ||
    normalizedSubmitted === normalizeAnswer(officialKeyword)
  );
}
