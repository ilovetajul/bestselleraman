import type { Principle, Question, QuestionType, QuizMode } from '../types';
import { PRINCIPLES } from '../data/principles';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const QUESTION_TYPES: QuestionType[] = [
  'keyword-to-english',
  'english-to-bangla',
  'fill-blank',
  'multiple-choice',
  'full-sentence-recall',
];

function pickRandomType(): QuestionType {
  return QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];
}

function buildBlankTemplate(sentence: string, keyword: string): string {
  // Try to blank out the distinguishing part of the sentence.
  const idx = sentence.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return sentence.replace(/\w+\.$/, '______.');
  const before = sentence.slice(0, idx);
  const after = sentence.slice(idx + keyword.length);
  return `${before}______${after}`;
}

function buildMultipleChoiceDistractors(correct: Principle, pool: Principle[]): string[] {
  const others = shuffle(pool.filter((p) => p.id !== correct.id)).slice(0, 3);
  const options = shuffle([correct.english, ...others.map((o) => o.english)]);
  return options;
}

export function generateQuestion(
  principle: Principle,
  type: QuestionType,
  pool: Principle[] = PRINCIPLES
): Question {
  const baseId = `${principle.id}-${type}-${Math.random().toString(36).slice(2, 8)}`;

  switch (type) {
    case 'keyword-to-english':
      return {
        id: baseId,
        principleId: principle.id,
        type,
        prompt: principle.banglaKeyword,
        promptLang: 'bn',
        correctAnswer: principle.english,
      };
    case 'english-to-bangla':
      return {
        id: baseId,
        principleId: principle.id,
        type,
        prompt: principle.english,
        promptLang: 'en',
        correctAnswer: principle.banglaKeyword,
      };
    case 'fill-blank':
      return {
        id: baseId,
        principleId: principle.id,
        type,
        prompt: principle.banglaKeyword,
        promptLang: 'bn',
        correctAnswer: principle.keyword,
        blankTemplate: buildBlankTemplate(principle.english, principle.keyword),
      };
    case 'multiple-choice':
      return {
        id: baseId,
        principleId: principle.id,
        type,
        prompt: principle.banglaKeyword,
        promptLang: 'bn',
        correctAnswer: principle.english,
        choices: buildMultipleChoiceDistractors(principle, pool),
      };
    case 'full-sentence-recall':
    default:
      return {
        id: baseId,
        principleId: principle.id,
        type,
        prompt: principle.banglaKeyword,
        promptLang: 'bn',
        correctAnswer: principle.english,
      };
  }
}

export function generateSessionQuestions(
  principles: Principle[],
  mode: QuizMode,
  count?: number
): Question[] {
  const chosenPrinciples = count ? shuffle(principles).slice(0, count) : shuffle(principles);

  return chosenPrinciples.map((p) => {
    const type = mode === 'mixed' ? pickRandomType() : mode;
    return generateQuestion(p, type, principles);
  });
}
