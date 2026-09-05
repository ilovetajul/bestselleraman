-- ============================================================================
-- Migration 2: Voice-only competition mode
-- ============================================================================
-- Run this in the SQL Editor AFTER 0001_competition_schema.sql has already
-- been applied. This is additive — it only adds one column with a safe
-- default, so it will not affect any contest you've already created.
-- ============================================================================

alter table contests
  add column answer_mode text not null default 'keyboard'
    check (answer_mode in ('keyboard', 'voice'));

comment on column contests.answer_mode is
  'keyboard: participants type answers (with anti-copy/paste protection). '
  'voice: participants must speak answers — no keyboard input field is shown '
  'at all, which removes the copy/paste vector entirely.';
