export type ContestStatus = 'draft' | 'scheduled' | 'live' | 'finished';
export type AnswerMode = 'keyboard' | 'voice';

export interface ContestPublic {
  id: string;
  name: string;
  timezone: string;
  startAt: string; // ISO
  endAt: string; // ISO
  durationSeconds: number;
  status: ContestStatus;
  resultsPublished: boolean;
  answerMode: AnswerMode;
}

export interface ContestPrompt {
  id: string;
  contest_id: string;
  question_number: number;
  prompt: string;
}

export interface AnswerResult {
  question_number: number;
  answer: string;
  correct: boolean;
}

export interface IntegrityCounters {
  pasteAttempts: number;
  copyAttempts: number;
  cutAttempts: number;
  dropAttempts: number;
  tabSwitches: number;
  visibilityChanges: number;
  fullscreenExits: number;
  refreshCount: number;
  multipleSubmitAttempts: number;
}

export interface SubmitResponse {
  submissionId: string;
  submittedAt: string;
  correctCount: number;
  wrongCount: number;
  score: number;
  total: number;
  results: AnswerResult[];
}

export interface RegisterResponse {
  participantId: string;
  contestId: string;
  fullName: string;
  alreadySubmitted: boolean;
  submissionId: string | null;
}

export interface TopResultEntry {
  rank: number;
  fullName: string;
  score: number;
  submittedAt: string;
}

export interface MyResultResponse {
  contestName: string;
  fullName: string;
  correctCount: number;
  wrongCount: number;
  score: number;
  submittedAt: string;
  rank: number;
  totalParticipants: number;
  results: AnswerResult[];
  topThree: TopResultEntry[];
}

export interface StoredParticipant {
  contestId: string;
  participantId: string;
  fullName: string;
  participantIdentifier: string;
}

export type IntegrityStatus = 'green' | 'yellow' | 'red';

export interface AdminLeaderboardRow {
  submission_id: string;
  contest_id: string;
  participant_id: string;
  full_name: string;
  participant_identifier: string;
  correct_count: number;
  wrong_count: number;
  score: number;
  submitted_at: string;
  duration_seconds: number | null;
  paste_attempts: number;
  copy_attempts: number;
  cut_attempts: number;
  drop_attempts: number;
  tab_switches: number;
  refresh_count: number;
  integrity_status: IntegrityStatus;
  rank: number;
}

export interface AdminContestRow {
  id: string;
  name: string;
  timezone: string;
  start_at: string;
  end_at: string;
  duration_seconds: number;
  status: ContestStatus;
  results_published: boolean;
  answer_mode: AnswerMode;
  created_at: string;
}
