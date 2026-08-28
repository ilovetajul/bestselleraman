import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppSettings, AttemptRecord, MatchResult, QuestionType, UserProgress } from '../types';
import { PRINCIPLES } from '../data/principles';
import { loadJSON, saveJSON, clearAll, STORAGE_KEYS } from '../lib/storage';
import { createInitialSRS, updateSRSAfterAnswer } from '../lib/srs';
import { computeNewBadges, updateStreakOnActivity, xpForResult } from '../lib/gamification';

function defaultSettings(): AppSettings {
  return {
    theme: 'light',
    pronunciation: true,
    autoNext: true,
    soundEffects: true,
    strictMatching: false,
  };
}

function defaultProgress(): UserProgress {
  const srs: UserProgress['srs'] = {};
  PRINCIPLES.forEach((p) => {
    srs[p.id] = createInitialSRS(p.id);
  });
  return {
    srs,
    streakDays: 0,
    lastActiveDate: null,
    xp: 0,
    badges: [],
    totalQuestionsCompleted: 0,
    totalCorrect: 0,
    totalMistakes: 0,
    bestSpeedRecallScore: 0,
    history: [],
    sessionCorrectStreak: 0,
    bestSessionCorrectStreak: 0,
  };
}

interface AnswerContext {
  mode: AttemptRecord['mode'];
}

interface AppContextValue {
  settings: AppSettings;
  progress: UserProgress;
  updateSettings: (partial: Partial<AppSettings>) => void;
  recordAnswer: (
    principleId: number,
    type: QuestionType,
    result: MatchResult,
    ctx: AnswerContext
  ) => { newBadges: string[] };
  recordSpeedScore: (score: number) => { newBadges: string[] };
  resetSessionStreak: () => void;
  resetProgress: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadJSON(STORAGE_KEYS.settings, defaultSettings())
  );
  const [progress, setProgress] = useState<UserProgress>(() =>
    loadJSON(STORAGE_KEYS.progress, defaultProgress())
  );

  useEffect(() => {
    saveJSON(STORAGE_KEYS.settings, settings);
    const root = document.documentElement;
    if (settings.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [settings]);

  useEffect(() => {
    saveJSON(STORAGE_KEYS.progress, progress);
  }, [progress]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const recordAnswer = useCallback(
    (principleId: number, type: QuestionType, result: MatchResult, ctx: AnswerContext) => {
      let newBadges: string[] = [];

      setProgress((prev) => {
        const isCorrect = result === 'correct';
        const currentSRS = prev.srs[principleId] ?? createInitialSRS(principleId);
        const updatedSRS = updateSRSAfterAnswer(currentSRS, isCorrect);

        const { streakDays, lastActiveDate } = updateStreakOnActivity(prev);

        const sessionCorrectStreak = isCorrect ? prev.sessionCorrectStreak + 1 : 0;
        const bestSessionCorrectStreak = Math.max(prev.bestSessionCorrectStreak, sessionCorrectStreak);

        const record: AttemptRecord = {
          timestamp: new Date().toISOString(),
          principleId,
          type,
          result,
          mode: ctx.mode,
        };

        const allMastered = PRINCIPLES.every((p) => {
          const s = p.id === principleId ? updatedSRS : prev.srs[p.id];
          return (s?.masteryScore ?? 0) >= 90;
        });

        const next: UserProgress = {
          ...prev,
          srs: { ...prev.srs, [principleId]: updatedSRS },
          streakDays,
          lastActiveDate,
          xp: prev.xp + xpForResult(result),
          totalQuestionsCompleted: prev.totalQuestionsCompleted + 1,
          totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
          totalMistakes: prev.totalMistakes + (isCorrect ? 0 : 1),
          history: [...prev.history.slice(-199), record],
          sessionCorrectStreak,
          bestSessionCorrectStreak,
        };

        newBadges = computeNewBadges(next, { masteredAllTen: allMastered });
        next.badges = [...next.badges, ...newBadges];

        return next;
      });

      return { newBadges };
    },
    []
  );

  const recordSpeedScore = useCallback((score: number) => {
    let newBadges: string[] = [];
    setProgress((prev) => {
      const next: UserProgress = {
        ...prev,
        bestSpeedRecallScore: Math.max(prev.bestSpeedRecallScore, score),
      };
      newBadges = computeNewBadges(next, { speedScore: score });
      next.badges = [...next.badges, ...newBadges];
      return next;
    });
    return { newBadges };
  }, []);

  const resetSessionStreak = useCallback(() => {
    setProgress((prev) => ({ ...prev, sessionCorrectStreak: 0 }));
  }, []);

  const resetProgress = useCallback(() => {
    clearAll();
    setProgress(defaultProgress());
    setSettings(defaultSettings());
  }, []);

  const value = useMemo(
    () => ({
      settings,
      progress,
      updateSettings,
      recordAnswer,
      recordSpeedScore,
      resetSessionStreak,
      resetProgress,
    }),
    [settings, progress, updateSettings, recordAnswer, recordSpeedScore, resetSessionStreak, resetProgress]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
