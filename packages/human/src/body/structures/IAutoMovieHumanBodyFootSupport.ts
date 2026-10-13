import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieHumanBodySide } from "../anatomy/identity/AutoMovieHumanBodySide";

/**
 * One foot's geometric support against the ground plane: its lowest posed
 * skin point and that point's height above the plane.
 *
 * A positive gap is a foot clear of the ground, a negative one a foot through
 * it. This is a final-surface reading, not a pressure or contact simulation.
 *
 * @evidence contracts/common.md#principled-implementation A side, lowest posed skin point and signed gap describe geometric support against a ground plane, without simulating contact forces.
 * @evidence contracts/common.md#clear-and-simple-design The reading contains the witness point beside its signed height.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Negative gaps report penetration rather than correcting the posed body.
 * @evidence contracts/common.md#meaningful-documentation Documentation gives metres, sign meaning and the distinction from pressure simulation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The foot support witnesses declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The foot support witnesses schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The foot support witnesses type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyFootSupport {
  /** The foot read. */
  side: AutoMovieHumanBodySide;

  /** The foot region's lowest posed skin point, metres. */
  lowest: IAutoMovieVector3;

  /** Height of that point above the ground plane, metres; negative is through it. */
  gapMetres: number;
}
