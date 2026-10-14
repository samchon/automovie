import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One trial chord at the station where a rooted stem refused.
 *
 * The exterior interval along `direction` was certified up to `bound` metres (`bounded` when a surface ended it before the station's nominal chord). For a clipped trial, `reached` is the certified interior point the progress rule tested, with its clearance, nearest triangle and outward normal.
 *
 * @evidence contracts/common.md#principled-implementation Direction, certified interval bound and reached-point contact describe one attempted rooted chord.
 * @evidence contracts/common.md#clear-and-simple-design The trial record distinguishes nominal-bound clipping from the progress point actually tested.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Certified travel follows the exterior query's rounding premises; it does not excuse a collided chord or establish biological viability.
 * @evidence contracts/common.md#meaningful-documentation bound and reachedClearance are metres, triangle is the resident contact ordinal and blocking is a unit outward direction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Trial admission belongs to stepHumanFaceHairRootedStem rather than this diagnostic type.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The refusing station's existing trials are reused by the failure report.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The diagnostic caller owns retained trial records; no reader or independent budget is acquired by this schema.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStemTrial {
  /** Unit trial direction. */
  direction: IAutoMovieVector3;

  /** Certified travel along the direction, in metres. */
  bound: number;

  /** Whether a surface ended the interval before the nominal chord. */
  bounded: boolean;

  /** The certified interior point the progress rule tested. */
  reached: IAutoMovieVector3;

  /** Signed free distance of `reached`. */
  reachedClearance: number;

  /** Original collider triangle nearest `reached`. */
  reachedTriangle: number;

  /** Unit outward normal of the skin nearest `reached`. */
  blocking: IAutoMovieVector3;
}
