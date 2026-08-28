// ============================================================================
// OFFICIAL ANSWER KEY — BESTSELLER 10 Founding Principles
// ============================================================================
// This file is deployed only as part of the Supabase Edge Functions bundle
// (`supabase functions deploy`). It is never imported by, or bundled into,
// the Netlify/Vite frontend — that's a physically separate build and deploy
// pipeline. Do not import this file from anything under /src.
// ============================================================================

export interface OfficialQuestion {
  questionNumber: number;
  prompt: string; // Bangla keyword shown to the participant
  officialAnswer: string; // accepted full-sentence answer (normalized form)
  officialKeyword: string; // accepted short-keyword answer (normalized form)
}

export const OFFICIAL_QUESTIONS: OfficialQuestion[] = [
  { questionNumber: 1, prompt: 'সৎ', officialAnswer: 'We Are Honest', officialKeyword: 'Honest' },
  { questionNumber: 2, prompt: 'পরিশ্রমী', officialAnswer: 'We Are Hard Working', officialKeyword: 'Hard Working' },
  { questionNumber: 3, prompt: 'বিশ্বস্ত', officialAnswer: 'We Are Loyal', officialKeyword: 'Loyal' },
  { questionNumber: 4, prompt: 'সহযোগিতাপরায়ণ', officialAnswer: 'We Are Co-Operative', officialKeyword: 'Co-Operative' },
  { questionNumber: 5, prompt: 'ব্যবসায়িক মনোভাবসম্পন্ন', officialAnswer: 'We Are Business Minded', officialKeyword: 'Business Minded' },
  { questionNumber: 6, prompt: 'ফলাফল', officialAnswer: 'We Want To See Result', officialKeyword: 'Result' },
  { questionNumber: 7, prompt: 'সহজ সমাধান', officialAnswer: 'We Want Simple Solutions', officialKeyword: 'Simple Solutions' },
  { questionNumber: 8, prompt: 'যাচাই', officialAnswer: 'We Take Nothing For Granted', officialKeyword: 'Take Nothing For Granted' },
  { questionNumber: 9, prompt: 'প্রতিশ্রুতি', officialAnswer: 'We Always Keep Our Promises', officialKeyword: 'Keep Our Promises' },
  { questionNumber: 10, prompt: 'সেরা', officialAnswer: 'We Want To Be The Bestseller', officialKeyword: 'Bestseller' },
];
