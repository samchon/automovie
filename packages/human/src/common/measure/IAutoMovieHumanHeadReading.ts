import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One head measurement read on a person's skin at rest: the value and the
 * points the instrument touched, so the reading can be marked on a render.
 *
 * @evidence contracts/common.md#principled-implementation The reading carries its instrument points, so a render can show where the value was taken.
 * @evidence contracts/common.md#clear-and-simple-design A value and named points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The points are the ones measured, not illustrative.
 * @evidence contracts/common.md#meaningful-documentation States the unit and the purpose of the points.
 * @evidence contracts/modeling.md#spatial-conventions Metres of the person frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reading defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reading carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reading emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reading builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The reading is displayed by its consumer.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule cites its definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reading admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reading converts no input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadReading {
  /** The measured value, metres. */
  metres: number;

  /** The points the instrument touched, by role (`vertex`, `euryon-right`, ...), metres. */
  points: Record<string, IAutoMovieVector3>;
}
