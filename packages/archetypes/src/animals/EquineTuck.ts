import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedLimb } from "./QuadrupedLimb";
import type { QuadrupedRidePose } from "./QuadrupedRidePose";

/**
 * The forelimb tuck of a jump's flight: each fore's carpus folds to the jumping horse's measured maximum and the hoof hangs from the folded limb.
 *
 * St George, Clayton, Sinclair, Richards, Roy and Hobbs 2021, Muscle Function and Kinematics during Submaximal Equine Jumping, Animals 11:414, Table 1 (https://doi.org/10.3390/ani11020414; seventeen horses over a 1.0 m vertical) report the maximum carpus flexion over the jump stride: trailing fore 128.3 ± 7.2 and leading fore 130.7 ± 9.8 degrees in the intermediate-elevation group, reached at 24.8 and 28.2 % of the jump stride, after takeoff. `FOLD` is the mean of those two group means. The same table gives no hock angle, so the hinds keep their gait's swing fold.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source, the values used, what is left untucked and why.
 * @evidence contracts/development/design.md#principled-representation One measured fold in degrees and a hanging hoof height from the actual limb's reach.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the ride's fore goals while a jump carries them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No hind tuck is invented for want of a measured hock angle.
 */
export namespace EquineTuck {
  /** The fore's carpal fold at the height of the tuck, degrees: the mean of St George et al. 2021's trailing (128.3) and leading (130.7) fore maxima, intermediate group. */
  export const FOLD: number = (128.3 + 130.7) / 2;

  /**
   * One fore's prepared tuck.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the reader returns.
   * @evidence contracts/development/design.md#principled-representation A pure function of the swing goal and the tuck's weight.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built once per fore by `prepare`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Tuck = (
    goal: QuadrupedRidePose.IGoal,
    weight: number,
  ) => QuadrupedRidePose.IGoal;

  /**
   * Prepare one fore's tuck from its actual neutral chain.
   *
   * @param chain The fore's actual neutral joint points, model metres, attachment first and hoof endpoint last.
   * @returns The tuck reader.
   * @throws {RangeError} Through `QuadrupedLimb.prepare` for an unsupported chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation The fold grows with the weight to `FOLD`; the hoof is raised to where the folded limb hangs from its neutral attachment, its distance the chain's greatest reach at that fold, so the solve stays inside the limb's reach while the body is at or below its neutral height. The swing's own lift and fold are kept where they are larger.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reach read and one height per call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hoof beyond the folded reach horizontally keeps its swing goal rather than being moved.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the limb owner's reach.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one prepared chain.
   */
  export function prepare(chain: readonly IAutoMovieVector3[]): Tuck {
    const limb: QuadrupedLimb.IPrepared = QuadrupedLimb.prepare(chain, true);
    const top: IAutoMovieVector3 = chain[0]!;
    return (
      goal: QuadrupedRidePose.IGoal,
      weight: number,
    ): QuadrupedRidePose.IGoal => {
      if (!(weight > 0)) return goal;
      const fold: number = Math.max(goal.fold, weight * FOLD);
      const reach: number = limb.range(fold).maximum;
      const across: number = Math.hypot(
        (goal.x ?? top.x) - top.x,
        goal.z - top.z,
      );
      if (!(across < reach)) return goal;
      const hanging: number =
        top.y - Math.sqrt(reach * reach - across * across);
      return { ...goal, fold, lift: Math.max(goal.lift, hanging) };
    };
  }

  /**
   * The weight of the tuck through one carried fore swing: rising from its liftoff to final hind liftoff and falling from the middle of the flight to its landing.
   *
   * @param seconds The film second.
   * @param lift The swing's liftoff second.
   * @param takeoff Final hind liftoff.
   * @param landing First fore landing.
   * @param land The swing's landing second.
   * @returns The weight, zero to one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each second and the range.
   * @evidence contracts/development/implementation.md#principled-implementation The fores fold after leaving the ground before takeoff and reach their maxima early in the flight (24.8 to 28.2 % of the jump stride), then extend to land; minimum-jerk ramps keep the fold and its rate continuous.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Product of two ramps.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's `minimumJerk`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function weight(
    seconds: number,
    lift: number,
    takeoff: number,
    landing: number,
    land: number,
  ): number {
    const middle: number = (takeoff + landing) / 2;
    const rising: number =
      takeoff > lift ? (seconds - lift) / (takeoff - lift) : 1;
    const falling: number =
      land > middle ? (land - seconds) / (land - middle) : 0;
    return (
      minimumJerk(Math.max(0, Math.min(1, rising))).s *
      minimumJerk(Math.max(0, Math.min(1, falling))).s
    );
  }

  /**
   * The fores' prepared tucks.
   *
   * @param limbs The actual neutral limb chains.
   * @returns The left and right fore tucks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation One `prepare` per fore.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two calls.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `prepare`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains two prepared chains.
   */
  export function fores(
    limbs: Readonly<Record<QuadrupedBody.Limb, readonly IAutoMovieVector3[]>>,
  ): IFores {
    return {
      leftFore: prepare(limbs.leftFore),
      rightFore: prepare(limbs.rightFore),
    };
  }

  /**
   * Both fores' tucks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each fore.
   * @evidence contracts/development/design.md#principled-representation One reader per fore.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `fores`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IFores {
    /** The left fore's tuck. */
    leftFore: Tuck;
    /** The right fore's tuck. */
    rightFore: Tuck;
  }
}
