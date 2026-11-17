import { minimumJerk } from "@automovie/engine";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";

/**
 * Prepare the kneel's phase-start lookup while retaining the same eased
 * progress and its existing 1 ns phase-selection allowance.
 *
 * @param clock The unchanged phase clock.
 * @param phases Ordered records whose names exist on that clock.
 * @returns The active original phase, its index and minimum-jerk progress.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States phase order, named-clock premise, original record ownership, progress and the existing phase-selection allowance.
 * @evidence contracts/development/implementation.md#principled-implementation Upper-bound search selects the same latest phase whose start minus 1e-9 seconds has passed; the native guarded interval reader retains the same requested clock.linear method and minimumJerk with the same named endpoints.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare exact start boundaries and one lazy native interval per phase, then return the selected original phase and its unchanged eased linear progress.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the 1e-9 selection allowance, duplicate-start last-phase behavior, index-zero fallback and original interpolation rather than relaxing or replacing them.
 * @evidence contracts/development/implementation.md#efficient-algorithms N boundaries/readers cost O(N) once; each query uses O(log N) selection. First actual native linear demand resolves its two private interval names once; custom/replaced linear callbacks still run with the original receiver and current second.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact clock boundaries and phase names remain fixed for the plan. Only proven native interval metadata share; each query reads only its requested linear method once and independently evaluates current seconds and minimum-jerk progress.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One plan owns N scalar boundaries, bounded native interval readers and original phase records until release; no posture, solver workspace or previous query is retained.
 */
export function prepareKneelClock<T extends { name: string }>(
  clock: AutoMovieMotionClock.IClock,
  phases: readonly T[],
): (seconds: number) => { phase: T; index: number; u: number } {
  const starts: number[] = phases.map(
    (phase: T): number => clock.at(phase.name) - 1e-9,
  );
  const intervals: ReturnType<typeof AutoMovieMotionClock.prepare>[] =
    phases.map(
      (
        phase: T,
        index: number,
      ): ReturnType<typeof AutoMovieMotionClock.prepare> =>
        AutoMovieMotionClock.prepare(
          clock,
          phase.name,
          index + 1 < phases.length ? phases[index + 1]!.name : "end",
        ),
    );
  return (seconds: number): { phase: T; index: number; u: number } => {
    let lo: number = 0;
    let hi: number = starts.length;
    while (lo < hi) {
      const mid: number = Math.floor((lo + hi) / 2);
      if (seconds >= starts[mid]!) lo = mid + 1;
      else hi = mid;
    }
    const index: number = Math.max(0, lo - 1);
    const phase: T = phases[index]!;
    return {
      phase,
      index,
      u: minimumJerk.share(intervals[index]!.linear(seconds)),
    };
  };
}
