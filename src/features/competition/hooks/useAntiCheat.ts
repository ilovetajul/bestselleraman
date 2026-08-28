import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { IntegrityCounters } from '../../../types/competition';

function emptyCounters(): IntegrityCounters {
  return {
    pasteAttempts: 0,
    copyAttempts: 0,
    cutAttempts: 0,
    dropAttempts: 0,
    tabSwitches: 0,
    visibilityChanges: 0,
    fullscreenExits: 0,
    refreshCount: 0,
    multipleSubmitAttempts: 0,
  };
}

/**
 * Attaches UI-level copy/paste/cut/drop/context-menu prevention to a
 * container (typically the answer form wrapper), and logs how often each
 * was attempted. This is a deterrent and an audit trail, not a guarantee —
 * see the on-screen disclosure text. Keyboard shortcuts (Ctrl/Cmd+V/C/X)
 * are already covered here: browsers fire the same paste/copy/cut DOM
 * events regardless of whether they were triggered by a shortcut, the
 * context menu, or a long-press on mobile, so no separate keydown handler
 * is needed to catch them.
 */
export function useAntiCheat(containerRef: RefObject<HTMLElement>) {
  const countersRef = useRef<IntegrityCounters>(emptyCounters());

  const bump = useCallback((key: keyof IntegrityCounters) => {
    countersRef.current[key] += 1;
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const onPaste = (e: Event) => {
      e.preventDefault();
      bump('pasteAttempts');
    };
    const onCopy = (e: Event) => {
      e.preventDefault();
      bump('copyAttempts');
    };
    const onCut = (e: Event) => {
      e.preventDefault();
      bump('cutAttempts');
    };
    const onDrop = (e: Event) => {
      e.preventDefault();
      bump('dropAttempts');
    };
    const onDragOver = (e: Event) => {
      e.preventDefault();
    };
    const onContextMenu = (e: Event) => {
      e.preventDefault();
    };

    node.addEventListener('paste', onPaste);
    node.addEventListener('copy', onCopy);
    node.addEventListener('cut', onCut);
    node.addEventListener('drop', onDrop);
    node.addEventListener('dragover', onDragOver);
    node.addEventListener('contextmenu', onContextMenu);

    const onVisibilityChange = () => {
      countersRef.current.visibilityChanges += 1;
      if (document.hidden) countersRef.current.tabSwitches += 1;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) countersRef.current.fullscreenExits += 1;
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      node.removeEventListener('paste', onPaste);
      node.removeEventListener('copy', onCopy);
      node.removeEventListener('cut', onCut);
      node.removeEventListener('drop', onDrop);
      node.removeEventListener('dragover', onDragOver);
      node.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [containerRef, bump]);

  const recordMultipleSubmitAttempt = useCallback(() => {
    countersRef.current.multipleSubmitAttempts += 1;
  }, []);

  const setRefreshCount = useCallback((count: number) => {
    countersRef.current.refreshCount = count;
  }, []);

  const getCounters = useCallback((): IntegrityCounters => ({ ...countersRef.current }), []);

  return { getCounters, recordMultipleSubmitAttempt, setRefreshCount };
}

/**
 * Tracks how many times the Live screen has been mounted for this specific
 * contest+participant, persisted in localStorage so it survives the actual
 * page refresh it's meant to detect. The very first mount does not count.
 */
export function trackRefreshCount(contestId: string, participantId: string): number {
  const key = `pm_refresh:${contestId}:${participantId}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      window.localStorage.setItem(key, '0');
      return 0;
    }
    const next = Number(raw) + 1;
    window.localStorage.setItem(key, String(next));
    return next;
  } catch {
    return 0;
  }
}
