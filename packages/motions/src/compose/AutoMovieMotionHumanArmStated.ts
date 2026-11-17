import type { IAutoMovieMotionHumanArmPlanned } from "@automovie/interface";

import type { AutoMovieMotionHumanArmPlanned } from "./AutoMovieMotionHumanArmPlanned";

/**
 * The span a carry's weight states: where it leaves 0 (`start`), first
 * reaches 1 (`ready`), last leaves 1 (`relax`) and is back at 0 (`end`),
 * or `relax` and `end` at the window's end for a weight that holds 1 to
 * it. Each instant is bracketed on a 1/240 s grid of the window and
 * bisected within its bracket to 1e-12 s.
 *
 * @param weight The carry's weight, 0 at its rest and 1 on its goal.
 * @param from The window's first second.
 * @param to The window's last second.
 * @returns The span; none for a weight that states no single reach: one that never leaves 0 or never reaches 1, starts off 0, ends between its ends, or leaves 0 again after it returned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four instants, the hold to the end, the precision and every case with no span.
 * @evidence contracts/development/implementation.md#principled-implementation A weight is a time course of a reach, so its instants are where it crosses its ends; a crossing bracketed by two samples is found by bisection to the precision asked.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan for the brackets and one bisection per instant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A weight with two reaches or none is not given a span: its law states its own (`AutoMovieMotionHumanArmCarry.ICarry.span`).
 * @evidence contracts/development/implementation.md#efficient-algorithms 240 samples a second of window and forty-odd reads per instant, once per carry.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per carry by `carried`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function AutoMovieMotionHumanArmStated(
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
      const mid: number = (lo + hi) / 2;
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
