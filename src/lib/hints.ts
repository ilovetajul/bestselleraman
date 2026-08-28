export function buildHint(answer: string, level: 1 | 2 | 3): string {
  if (level === 3) return answer;

  const words = answer.split(' ');
  if (level === 1) {
    // Reveal the first word only.
    return words.map((w, i) => (i === 0 ? w : '______')).join(' ');
  }

  // Level 2: reveal roughly half of each word's letters (min 2 chars), keep punctuation.
  return words
    .map((word, i) => {
      if (i === 0) return word;
      const core = word.replace(/[.,!?]/g, '');
      const punct = word.slice(core.length);
      const revealCount = Math.max(2, Math.ceil(core.length / 2));
      const revealed = core.slice(0, revealCount);
      const hidden = '_'.repeat(Math.max(0, core.length - revealCount));
      return `${revealed}${hidden}${punct}`;
    })
    .join(' ');
}
