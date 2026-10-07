// A rolling hour; retain at most thirty timestamps and no candidate content.
export function reserveCall(previous: number[], now: number): number[] | null {
  const active = previous.filter(time => time > now - 60 * 60 * 1000);
  if (active.length >= 30) return null;
  return [...active, now];
}
