import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * The bend hint's side term of a hinged chain's swivel, read in closed form.
 *
 * The mid joint's offset across the root-to-target axis at swivel `s`
 * degrees is its offset at 0 turned by `s` about that axis, so its unit
 * direction is `cos s e0 + sin s e90` and its dot with the side is
 * `R cos(s - p)`, with `R` and `p` read from the offsets at 0 and 90
 * degrees. The term `(1 - dot) min(1, off / SIDED)` is therefore least at
 * `p`, the swivel that puts the mid joint toward the hint: the pole of
 * two-bone IK. `bound` gives the term's least value over an interval and
 * `peak` gives `p`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the circle, the sinusoid, the weight and both readings with their units.
 * @evidence contracts/development/design.md#principled-representation Swivels in degrees, offsets in world metres, the term in fitHingedChainCandidate's deviation units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hint-side weight's length scale and two readers, all read by fitHingedChainCandidate; split from it to keep that file within its size.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One circle reading serves both the bound and the peak, so they cannot disagree about the phase.
 */
export namespace hingedChainSide {
  /**
   * The mid joint's distance from the line to the target, metres, from which
   * the bend hint's side weighs in full (provisional: a millimetre, past any
   * rounding of a limb's joints and short of any bend one sees).
   */
  export const SIDED: number = 1e-3;

  /**
   * A lower bound of twice the hint-side term over a swivel interval: at the
   * peak when the interval holds it, else at the nearer end.
   *
   * @param offset The mid joint's offset across the axis at a swivel, degrees.
   * @param side The unit hint direction across the axis.
   * @returns The bound over `low` to `high` degrees; zero for a limb straight to within rounding.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the bound and the straight case.
   * @evidence contracts/development/implementation.md#principled-implementation The sinusoid's greatest cosine over an interval is 1 when the interval holds the phase, else the larger end cosine; the bound is lowered by ROUNDING below every candidate it bounds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One circle reading, then a closure per interval.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A straight limb bounds nothing rather than guessing a side.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two offsets once, then constant work per interval.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The closure keeps three scalars.
   */
  export function bound(
    offset: (swivel: number) => IAutoMovieVector3,
    side: IAutoMovieVector3,
  ): (low: number, high: number) => number {
    const circle: ICircle | null = read(offset, side);
    if (circle === null) return (): number => 0;
    const { off, reach, phase }: ICircle = circle;
    const weight: number = 2 * Math.min(1, off / SIDED);
    const cos = (degrees: number): number => Math.cos((degrees * Math.PI) / 180);
    return (low: number, high: number): number => {
      const next: number = phase + 360 * Math.ceil((low - phase) / 360);
      const top: number =
        high - low >= 360 || next <= high
          ? reach
          : reach * Math.max(cos(low - phase), cos(high - phase));
      return Math.max(0, weight * (1 - top) - ROUNDING);
    };
  }

  /**
   * The swivel at which the hint-side term is least, the pole of two-bone IK.
   *
   * @param offset The mid joint's offset across the axis at a swivel, degrees.
   * @param side The unit hint direction across the axis.
   * @returns The phase `p`, degrees in [0, 360); null for a limb straight to within rounding.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the range and the straight case.
   * @evidence contracts/development/implementation.md#principled-implementation `R cos(s - p)` is greatest at `s = p = atan2(b, a)`, with `a` and `b` the side's dots with the unit offsets at 0 and 90 degrees.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One circle reading and one wrap.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A straight limb returns null so its caller's general search decides.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two offsets and constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function peak(
    offset: (swivel: number) => IAutoMovieVector3,
    side: IAutoMovieVector3,
  ): number | null {
    const circle: ICircle | null = read(offset, side);
    return circle === null ? null : ((circle.phase % 360) + 360) % 360;
  }
}

/**
 * Below this a bound is lowered, deviation units: a hundred times the float
 * error of reading the same side term two ways (a few operations at 2^-53
 * relative on a term of at most 4), so the bound stays below every candidate
 * it bounds.
 */
const ROUNDING: number = 1e-12;

/** The mid joint's side circle: offset length at 0 degrees, metres; the side dot's amplitude; its phase, degrees. */
interface ICircle {
  /** The mid joint's offset across the axis at swivel 0, metres. */
  off: number;

  /** The amplitude of the side dot over the swivel. */
  reach: number;

  /** The swivel at which the side dot is greatest, degrees. */
  phase: number;
}

/** The circle from the offsets at 0 and 90 degrees; null for a limb straight to within rounding. */
function read(
  offset: (swivel: number) => IAutoMovieVector3,
  side: IAutoMovieVector3,
): ICircle | null {
  const zero: IAutoMovieVector3 = offset(0);
  const quarter: IAutoMovieVector3 = offset(90);
  const off: number = Vector3.length(zero);
  const across: number = Vector3.length(quarter);
  if (!(off >= 1e-9 && across >= 1e-9)) return null;
  const a: number = Vector3.dot(zero, side) / off;
  const b: number = Vector3.dot(quarter, side) / across;
  return { off, reach: Math.hypot(a, b), phase: (Math.atan2(b, a) * 180) / Math.PI };
}
