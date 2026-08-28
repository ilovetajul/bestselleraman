import type { AdminLeaderboardRow } from '../../../types/competition';

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatCompletionTime(seconds: number | null): string {
  if (seconds === null || Number.isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function exportLeaderboardCsv(rows: AdminLeaderboardRow[], contestName: string): void {
  const headers = [
    'Rank',
    'Name',
    'Participant ID',
    'Score',
    'Correct',
    'Wrong',
    'Submission Time',
    'Completion Time',
    'Integrity Status',
  ];

  const lines = [headers.join(',')];

  rows.forEach((row) => {
    lines.push(
      [
        csvEscape(row.rank),
        csvEscape(row.full_name),
        csvEscape(row.participant_identifier),
        csvEscape(`${row.score}/10`),
        csvEscape(row.correct_count),
        csvEscape(row.wrong_count),
        csvEscape(new Date(row.submitted_at).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })),
        csvEscape(formatCompletionTime(row.duration_seconds)),
        csvEscape(row.integrity_status),
      ].join(',')
    );
  });

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = contestName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  link.href = url;
  link.download = `${safeName || 'contest'}-results.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
