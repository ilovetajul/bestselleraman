import type { Principle, PrincipleGroup } from '../types';

export const PRINCIPLES: Principle[] = [
  {
    id: 1,
    keyword: 'Honest',
    english: 'We Are Honest.',
    bangla: 'আমরা সৎ।',
    banglaKeyword: 'সৎ',
    pronunciation: 'উই আর অনেস্ট।',
    group: 1,
    memoryTip: 'Honest sounds like "on-est" — think "on the level."',
  },
  {
    id: 2,
    keyword: 'Hard Working',
    english: 'We Are Hard Working.',
    bangla: 'আমরা পরিশ্রমী।',
    banglaKeyword: 'পরিশ্রমী',
    pronunciation: 'উই আর হার্ড ওয়ার্কিং।',
    group: 1,
    memoryTip: 'Two words: Hard + Working — effort, always.',
  },
  {
    id: 3,
    keyword: 'Loyal',
    english: 'We Are Loyal.',
    bangla: 'আমরা বিশ্বস্ত।',
    banglaKeyword: 'বিশ্বস্ত',
    pronunciation: 'উই আর লয়াল।',
    group: 1,
    memoryTip: '"Loyal" rhymes with "royal" — faithful like a knight.',
  },
  {
    id: 4,
    keyword: 'Co-Operative',
    english: 'We Are Co-Operative.',
    bangla: 'আমরা সহযোগিতাপরায়ণ।',
    banglaKeyword: 'সহযোগিতাপরায়ণ',
    pronunciation: 'উই আর কো-অপারেটিভ।',
    group: 2,
    memoryTip: 'Co- means "together" — Co-Operative = working together.',
  },
  {
    id: 5,
    keyword: 'Business Minded',
    english: 'We Are Business Minded.',
    bangla: 'আমরা ব্যবসায়িক মনোভাবসম্পন্ন।',
    banglaKeyword: 'ব্যবসায়িক মনোভাবসম্পন্ন',
    pronunciation: 'উই আর বিজনেস মাইন্ডেড।',
    group: 2,
    memoryTip: 'Mind → Minded. A mindset, not just a minder.',
  },
  {
    id: 6,
    keyword: 'Result',
    english: 'We Want To See Result.',
    bangla: 'আমরা ফলাফল দেখতে চাই।',
    banglaKeyword: 'ফলাফল',
    pronunciation: 'উই ওয়ান্ট টু সি রিজাল্ট।',
    group: 2,
    memoryTip: '"See Result" — outcomes you can point to.',
  },
  {
    id: 7,
    keyword: 'Simple Solutions',
    english: 'We Want Simple Solutions.',
    bangla: 'আমরা সহজ সমাধান চাই।',
    banglaKeyword: 'সহজ সমাধান',
    pronunciation: 'উই ওয়ান্ট সিম্পল সলিউশনস।',
    group: 3,
    memoryTip: 'Simple, not simplistic — the easiest workable path.',
  },
  {
    id: 8,
    keyword: 'Take Nothing For Granted',
    english: 'We Take Nothing For Granted.',
    bangla: 'আমরা কোনো কিছু যাচাই ছাড়া সত্য ধরে নিই না।',
    banglaKeyword: 'যাচাই',
    pronunciation: 'উই টেক নাথিং ফর গ্র্যান্টেড।',
    group: 3,
    memoryTip: 'Verify first. Nothing is assumed true.',
  },
  {
    id: 9,
    keyword: 'Keep Our Promises',
    english: 'We Always Keep Our Promises.',
    bangla: 'আমরা সবসময় আমাদের প্রতিশ্রুতি রক্ষা করি।',
    banglaKeyword: 'প্রতিশ্রুতি',
    pronunciation: 'উই অলওয়েজ কিপ আওয়ার প্রমিসেস।',
    group: 3,
    memoryTip: '"Always" — no exceptions to a promise kept.',
  },
  {
    id: 10,
    keyword: 'Bestseller',
    english: 'We Want To Be The Bestseller.',
    bangla: 'আমরা সেরা হতে চাই।',
    banglaKeyword: 'সেরা',
    pronunciation: 'উই ওয়ান্ট টু বি দ্য বেস্টসেলার।',
    group: 3,
    memoryTip: 'Best + Seller — aim to be #1 in the market.',
  },
];

export const PRINCIPLE_GROUPS: PrincipleGroup[] = [
  {
    id: 1,
    titleBangla: 'আমি কেমন মানুষ?',
    titleEnglish: 'Who We Are',
    principleIds: [1, 2, 3],
    memoryPhrase: 'সৎ – পরিশ্রমী – বিশ্বস্ত',
  },
  {
    id: 2,
    titleBangla: 'আমি কীভাবে কাজ করি?',
    titleEnglish: 'How We Work',
    principleIds: [4, 5, 6],
    memoryPhrase: 'সহযোগিতা – ব্যবসা – ফলাফল',
  },
  {
    id: 3,
    titleBangla: 'আমার কাজের নীতি',
    titleEnglish: 'Our Work Principles',
    principleIds: [7, 8, 9, 10],
    memoryPhrase: 'সহজ – যাচাই – প্রতিশ্রুতি – সেরা',
  },
];

export const getPrincipleById = (id: number): Principle | undefined =>
  PRINCIPLES.find((p) => p.id === id);

export const getGroupForPrinciple = (id: number): PrincipleGroup | undefined =>
  PRINCIPLE_GROUPS.find((g) => g.principleIds.includes(id));
