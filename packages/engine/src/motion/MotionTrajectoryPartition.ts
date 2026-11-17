/**
 * Own the exact time partition reused by integrations over one unchanged
 * physical history. A new interval follows the controller's actual proposal;
 * a rejected interval is bisected down to the controller's proposed reduction. Subsequent
 * trials replay those same numeric endpoints and still perform every local
 * and dense physical error check. No state, rate or admitted error is reused.
 *
 * @param t0 The finite first second.
 * @param t1 The finite last second, after t0.
 * @returns Operation-owned interval lookup, rejection refinement and release.
 * @throws {Error} For an invalid interval or a lookup outside its owned span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States exact endpoint reuse, controller proposals, bisection and unchanged per-trial admission.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses an adaptive mesh, not a trajectory: every new trial evaluates its own Runge-Kutta stages and error estimates, and any failed interval receives a strict midpoint refinement. Midpoint failure reports time resolution to the stepper rather than accepting an unresolved interval.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A map from exact interval starts to their current ends serves lookup and midpoint replacement.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts There is no rounded time, fixed grid, guessed rate, iteration cap or reused physical verdict. Existing finer intervals are conservative starting proposals, not evidence of accuracy for a different momentum.
 * @evidence contracts/development/implementation.md#efficient-algorithms Expected constant-time interval lookup; refinement takes ceil(log2(old duration / recommended duration)) midpoint splits, at most three for the current controller's fivefold maximum reduction. Storage follows the finest partition encountered without a fixed bound. Reusing an over-refined mesh can cost more stages and needs end-to-end qualification.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only numeric time boundaries are shared within the caller's one history epoch; state, sensitivities and all acceptance checks are recomputed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one map for its shooting operation, clears it in finally and never transfers it into completed playback. The map retains no physical history, callbacks or states.
 */
export function MotionTrajectoryPartition(
  t0: number,
  t1: number,
): MotionTrajectoryPartition.IPartition {
  if (!(Number.isFinite(t0) && Number.isFinite(t1) && t1 > t0))
    throw new Error("A reusable trajectory partition needs a finite forward interval");
  const ends: Map<number, number> = new Map();
  return {
    end: (start: number, proposed: number): number => {
      if (!(start >= t0 && start < proposed && proposed <= t1))
        throw new Error("A trajectory partition query must lie inside its interval");
      const known: number | undefined = ends.get(start);
      if (known !== undefined) return known;
      ends.set(start, proposed);
      return proposed;
    },
    split: (start: number, maximumStep?: number): boolean => {
      let end: number | undefined = ends.get(start);
      if (end === undefined) return false;
      const limit: number = maximumStep ?? (end - start) / 2;
      if (!(Number.isFinite(limit) && limit > 0 && limit < end - start)) return false;
      do {
        const middle: number = start + (end - start) / 2;
        if (!(start < middle && middle < end)) return false;
        ends.set(start, middle);
        ends.set(middle, end);
        end = middle;
      } while (end - start > limit);
      return true;
    },
    clear: (): void => ends.clear(),
  };
}

/**
 * The mutable time-mesh owner passed only between one shooting solve's trials.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members read exact seconds, refine one failed interval and release the operation's map. Companion IPartition: Describes exact-end lookup, strict rejected-leaf bisection and explicit release.
 * @evidence contracts/development/design.md#principled-representation A forward interval partition contains time boundaries only; it carries no physical state or accuracy claim. Companion IPartition: Contains only numerical time boundaries of one finite forward integration interval, never physical state or admission verdicts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shooting constructs and releases it; the adaptive stepper alone reads and refines it. Companion IPartition: Shooting owns the object and the adaptive stepper alone consumes end/split; clear releases the mesh on every exit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The surface cannot mark a trajectory accepted or supply a fabricated history value. Its only boolean reports whether a strict midpoint exists. Companion IPartition: No trusted success flag, estimated shape or unconstrained output storage is exposed.
 */
export namespace MotionTrajectoryPartition {
  /**
   * Numeric interval ownership, with all times in seconds.
   *
   * Describes exact-end lookup, strict rejected-leaf bisection and explicit release.
   * Contains only numerical time boundaries of one finite forward integration interval, never physical state or admission verdicts.
   * Shooting owns the object and the adaptive stepper alone consumes end/split; clear releases the mesh on every exit.
   * No trusted success flag, estimated shape or unconstrained output storage is exposed.
   */
  export interface IPartition {
    /** Return an existing leaf's exact end, or register the controller's new proposal. */
    end(start: number, proposed: number): number;

    /** Bisect the rejected start leaf until its duration meets the controller's finite positive maximumStep, or once when omitted. False means an invalid reduction or exhausted strict midpoint. */
    split(start: number, maximumStep?: number): boolean;

    /** Release all boundaries after the shooting operation, including failure. */
    clear(): void;
  }
}
