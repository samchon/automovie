import {
  Vector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedFooting } from "../AutoMovieArchetypeQuadrupedFooting";
import { AutoMovieArchetypeQuadrupedLimb } from "../AutoMovieArchetypeQuadrupedLimb";
import type { QuadrupedRidePose } from "../quadruped/QuadrupedRidePose";

/*
 * The limb tuck of a jump's flight: each fore's carpus folds to the jumping
 * horse's measured maximum, each hind shortens by its measured greatest
 * shortening, and the hoof hangs from the folded limb.
 *
 * St George, Clayton, Sinclair, Richards, Roy and Hobbs 2021, Muscle Function
 * and Kinematics during Submaximal Equine Jumping, Animals 11:414, Table 1
 * (https://doi.org/10.3390/ani11020414; seventeen horses over a 1.0 m vertical)
 * report the maximum carpus flexion over the jump stride: trailing fore 128.3 ±
 * 7.2 and leading fore 130.7 ± 9.8 degrees in the intermediate-elevation group,
 * reached at 24.8 and 28.2 % of the jump stride, after takeoff. `FOLD` is the
 * mean of those two group means. The same table gives no hock angle; it gives
 * the hindlimb's greatest shortening (`SHORTENING`), from which `hind` finds
 * the hock fold.
 */
export namespace EquineTuck {
  /*
   * The fore's carpal fold at the height of the tuck, degrees: the mean of St
   * George et al. 2021's trailing (128.3) and leading (130.7) fore maxima,
   * intermediate group.
   */
  export const FOLD: number = (128.3 + 130.7) / 2;

  /*
   * The hindlimb's greatest shortening in the jump's flight, metres at the
   * cohort's height: St George et al. 2021's maximum hindlimb (hip to hoof)
   * shortening, -0.4 +/- 0.1 m for both hinds in the intermediate group, Table
   * 1, over that group's 155.3 cm standing height, so a horse of another height
   * shortens in proportion: a derivation.
   */
  export const SHORTENING: number = 0.4 / 1.553;

  /*
   * One limb's prepared tuck.
   */
  export type Tuck = (
    goal: QuadrupedRidePose.IGoal,
    weight: number,
  ) => QuadrupedRidePose.IGoal;

  /*
   * Prepare one limb's tuck from its neutral chain.
   * Parameter chain: The limb's neutral joint points, model metres, attachment
   * first and hoof endpoint last.
   * Parameter fold: The tuck's greatest fold, degrees.
   * Parameter fore: Whether the chain is a fore's.
   * Returns: The tuck reader.
   * Through `AutoMovieArchetypeQuadrupedLimb.prepare` for
   * an unsupported chain.
   */
  export function prepare(
    chain: readonly IAutoMovieVector3[],
    fold: number = FOLD,
    fore: boolean = true,
  ): Tuck {
    const limb: AutoMovieArchetypeQuadrupedLimb.IPrepared =
      AutoMovieArchetypeQuadrupedLimb.prepare(chain, fore);
    const top: IAutoMovieVector3 = chain[0]!;
    return (
      goal: QuadrupedRidePose.IGoal,
      weight: number,
    ): QuadrupedRidePose.IGoal => {
      if (!(weight > 0)) return goal;
      const folded: number = Math.max(goal.fold, weight * fold);
      const reach: number = limb.range(folded).maximum;
      // The folded limb carries its hoof back under its elbow or stifle, the second joint.
      const z: number = goal.z + weight * (chain[1]!.z - goal.z);
      const across: number = Math.hypot((goal.x ?? top.x) - top.x, z - top.z);
      if (!(across < reach)) return goal;
      const hanging: number =
        top.y - Math.sqrt(reach * reach - across * across);
      // The hang is the body's own: the swing's ground plane yields, by the same weight, to the body's floor, so a pitched or terrain-borne swing hangs under the shoulder and lands back on its plane.
      const surface: AutoMovieArchetypeQuadrupedFooting.ISurface | undefined =
        goal.surface === undefined
          ? undefined
          : {
              point: Vector3.lerp(
                goal.surface.point,
                { ...goal.surface.point, y: 0 },
                weight,
              ),
              normal: Vector3.normalize(
                Vector3.lerp(goal.surface.normal, { x: 0, y: 1, z: 0 }, weight),
              ),
            };
      // The lift is measured from that plane along its normal, so the hang is reached from the plane's height under the hoof.
      const x: number = goal.x ?? top.x;
      const base: number =
        surface === undefined
          ? 0
          : surface.point.y -
            (surface.normal.x * (x - surface.point.x) +
              surface.normal.z * (z - surface.point.z)) /
              surface.normal.y;
      return {
        ...goal,
        ...(surface === undefined ? {} : { surface }),
        z,
        fold: folded,
        lift: Math.max(goal.lift, (hanging - base) / (surface?.normal.y ?? 1)),
      };
    };
  }

  /*
   * The weight of the tuck through one carried swing. A fore's rises from its
   * liftoff to final hind liftoff and falls from the middle of the flight to
   * its landing. A hind's rises from final hind liftoff to first fore landing
   * and falls to its own landing: St George et al. 2021 put the hinds' greatest
   * shortening at 68.5 to 87 % of the jump stride, late in the flight.
   * Parameter seconds: The film second.
   * Parameter lift: The swing's liftoff second.
   * Parameter takeoff: Final hind liftoff.
   * Parameter landing: First fore landing.
   * Parameter land: The swing's landing second.
   * Parameter fore: Whether the swing is a fore's.
   * Returns: The weight, zero to one.
   */
  export function weight(
    seconds: number,
    lift: number,
    takeoff: number,
    landing: number,
    land: number,
    fore: boolean = true,
  ): number {
    if (!fore) return weight(seconds, takeoff, landing, landing, land);
    const middle: number = (takeoff + landing) / 2;
    const rising: number =
      takeoff > lift ? (seconds - lift) / (takeoff - lift) : 1;
    const falling: number =
      land > middle ? (land - seconds) / (land - middle) : 0;
    return (
      AutoMovieEngineMotionSampling.minimumJerk(Math.max(0, Math.min(1, rising))).s *
      AutoMovieEngineMotionSampling.minimumJerk(Math.max(0, Math.min(1, falling))).s
    );
  }

  /*
   * The four limbs' prepared tucks.
   * Parameter limbs: The neutral limb chains.
   * Parameter withers: The height at the withers, metres.
   * Returns: The fore and hind tucks.
   */
  export function fores(
    limbs: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, readonly IAutoMovieVector3[]>
    >,
    withers: number,
  ): IFores {
    return {
      leftFore: prepare(limbs.leftFore),
      rightFore: prepare(limbs.rightFore),
      leftHind: hind(limbs.leftHind, withers),
      rightHind: hind(limbs.rightHind, withers),
    };
  }

  /*
   * One hind's tuck: the hock fold at which the hind's greatest reach, hip to
   * hoof, is its standing length less SHORTENING of the withers.
   * Parameter chain: The hind's neutral joint points.
   * Parameter withers: The height at the withers, metres.
   * Returns: The tuck reader.
   */
  export function hind(
    chain: readonly IAutoMovieVector3[],
    withers: number,
  ): Tuck {
    const limb: AutoMovieArchetypeQuadrupedLimb.IPrepared =
      AutoMovieArchetypeQuadrupedLimb.prepare(chain, false);
    const target: number =
      Math.hypot(
        chain[4]!.x - chain[0]!.x,
        chain[4]!.y - chain[0]!.y,
        chain[4]!.z - chain[0]!.z,
      ) -
      SHORTENING * withers;
    let low: number = 0;
    let high: number = 180;
    for (let k: number = 0; k < 48; k++) {
      const middle: number = (low + high) / 2;
      if (limb.range(middle).maximum > target) low = middle;
      else high = middle;
    }
    return prepare(chain, low, false);
  }

  /*
   * The four limbs' tucks.
   */
  export interface IFores {
    /*
     * The left fore's tuck.
     */
    leftFore: Tuck;
    /*
     * The right fore's tuck.
     */
    rightFore: Tuck;
    /*
     * The left hind's tuck.
     */
    leftHind: Tuck;
    /*
     * The right hind's tuck.
     */
    rightHind: Tuck;
  }
}
