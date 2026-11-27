import type { IAutoMovieMotionHumanArmPlanned } from "@automovie/interface";

/*
 * The span a carry's weight states: where it leaves 0 (`start`), first reaches
 * 1 (`ready`), last leaves 1 (`relax`) and is back at 0 (`end`), or `relax` and
 * `end` at the window's end for a weight that holds 1 to it. Each instant is
 * bracketed on a 1/240 s grid of the window and bisected within its bracket to
 * 1e-12 s, or to the finest bracket a double resolves at seconds that large.
 * Parameter weight: The carry's weight, 0 at its rest and 1 on its goal.
 * Parameter from: The window's first second.
 * Parameter to: The window's last second.
 * Returns: The span; none for a weight that states no single reach: one that
 * never leaves 0 or never reaches 1, starts off 0, ends between its ends, or
 * leaves 0 again after it returned.
 */
export function motionHumanArmStated(
  weight: (seconds: number) => number,
  from: number,
  to: number,
): IAutoMovieMotionHumanArmPlanned.ISpan | undefined {
  const count: number = Math.max(1, Math.ceil((to - from) * 240));
  const at = (i: number): number => from + ((to - from) * i) / count;
  const w: number[] = Array.from(
    { length: count + 1 },
    (_: unknown, i: number): number => weight(at(i)),
  );

  // The first sample past a condition, from a sample on.
  const first = (since: number, met: (v: number) => boolean): number => {
    for (let i: number = since; i <= count; ++i) if (met(w[i]!)) return i;
    return -1;
  };

  // The instant between two samples where the condition starts to hold.
  const crossing = (i: number, met: (v: number) => boolean): number => {
    let lo: number = at(i - 1);
    let hi: number = at(i);
    while (hi - lo > 1e-12) {
      // Past the seconds a double tells apart near the bracket the midpoint
      // is one of its ends, and the bracket is as narrow as it can be.
      const mid: number = (lo + hi) / 2;
      if (!(mid > lo && mid < hi)) break;
      if (met(weight(mid))) hi = mid;
      else lo = mid;
    }
    return hi;
  };
  const moved = (v: number): boolean => v > 0;
  const arrived = (v: number): boolean => v >= 1;
  const left = (v: number): boolean => v < 1;
  const rested = (v: number): boolean => v <= 0;
  const leaves: number = first(0, moved);
  if (leaves <= 0) return undefined;
  const reaches: number = first(leaves, arrived);
  if (reaches < 0) return undefined;

  // The last second at rest before it moves, the start.
  const start: number = crossing(leaves, moved);
  const ready: number = crossing(reaches, arrived);
  const releases: number = first(reaches, left);
  if (releases < 0) return { start, ready, relax: to, end: to };
  const returns: number = first(releases, rested);
  if (returns < 0 || first(returns, moved) >= 0) return undefined;
  return {
    start,
    ready,
    relax: crossing(releases, left),
    end: crossing(returns, rested),
  };
}
