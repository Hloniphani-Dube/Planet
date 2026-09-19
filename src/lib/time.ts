/** "just now", "2 hours ago", "3 days ago": deliberately rough, which is also what a
 * privacy-minded community map wants to show. */
export function timeAgo(timestamp: number, now: number = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - timestamp) / 60000));
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "about an hour ago" : `about ${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return days === 1 ? "yesterday" : `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `${weeks} weeks ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}
