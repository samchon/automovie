import { minimumJerk } from "@automovie/engine";

import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";

/**
 * Named clock intervals resolved once for repeated progress reads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns the exact clamped linear rule and prepared uniform/minimum-jerk readers at action-local seconds.
 * @evidence contracts/development/design.md#principled-representation Each interval is the two seconds its clock resolves from names; the original 1e-12-second step branch and engine minimum-jerk profile define its progress.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The clock's ordinary linear reader and prepared consumers share one numeric interval owner; no phase or action vocabulary is added.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled-time cache, altered span, clamped authored instant or new tolerance is introduced.
 */
export namespace AutoMovieMotionInterval {
  /**
   * Uniform progress with the clock's original short-window step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The inputs are action-local seconds; output is clamped to [0,1], stepping at to when to-from is below 1e-12 seconds.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the exact original branch, comparison and subtraction/division grouping from AutoMovieMotionClock.linear.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar function owns the ordinary and prepared interval rule.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reversed, zero and short spans keep the original step behavior; no interval is normalized or sampled.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic and no allocation per actual query.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A single numeric progress query coordinates no retained work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no data or handle.
   */
  export function linear(from: number, to: number, seconds: number): number {
    if (to - from < 1e-12) return seconds >= to ? 1 : 0;
    return Math.min(1, Math.max(0, (seconds - from) / (to - from)));
  }

  /**
   * Resolve a fixed named interval before its repeated reads.
   *
   * @param clock The unchanged action clock whose own at method admits both names.
   * @param from The opening name.
   * @param to The closing name.
   * @returns Uniform and minimum-jerk readers at actual action-local seconds.
   * @throws {Error} Whatever the clock throws for an unknown name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed names, eager name admission, action-local seconds and returned reader lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation The clock contract fixes named instants for its lifetime; reading each once produces the same numeric interval for every subsequent scalar query, and minimumJerk consumes the same uniform progress.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two original at calls and two scalar closures keep name resolution separate from repeated interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every actual second still runs the unchanged interval arithmetic and profile; no time rounding, sampled value or alternate easing replaces it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two map queries occur once rather than twice per one of Q reads; each read remains constant arithmetic, and runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the fixed opening and closing seconds are shared. Different clocks or names prepare independently, and the caller must prepare anew if a custom clock changes its named times.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned record retains two numeric seconds and reader closures until its owning action releases it; no clock, time history, pose or external handle is retained.
   */
  export function prepare(
    clock: Pick<AutoMovieMotionClock.IClock, "at">,
    from: string,
    to: string,
  ): IPrepared {
    const opening: number = clock.at(from);
    const closing: number = clock.at(to);
    const read: (seconds: number) => number = (seconds: number): number =>
      linear(opening, closing, seconds);
    return {
      linear: read,
      progress: (seconds: number): number => minimumJerk(read(seconds)).s,
    };
  }

  /**
   * Fixed-interval scalar readers with the clock's existing rules.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both members consume actual action-local seconds and return progress in [0,1] with the original short-span step.
   * @evidence contracts/development/design.md#principled-representation Uniform and minimum-jerk forms share one numeric interval; each is the same function the clock's named query defines.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only linear and progress are exposed because current prepared consumers need these two forms.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled state, mutable clock reference or optional alternative representation is stored.
   */
  export interface IPrepared {
    /** Uniform progress at action-local seconds. */
    linear(seconds: number): number;

    /** Flash and Hogan minimum-jerk progress at action-local seconds. */
    progress(seconds: number): number;
  }
}
