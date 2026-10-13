import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Cranium and overall head proportion of an {@link IAutoMovieHead}: the frame
 * the features sit in. Signed weights in `[-2, 2]`, omitted meaning unchanged.
 * `flattenHead` projects `width`, `length`, `oval` and `round` onto
 * `faceWidth`, `faceLength`, `faceOval` and `headRound`, and the forehead,
 * temple and occiput fields onto same-stem names.
 *
 * @evidence contracts/common.md#principled-implementation Nine leaves mapped by `flattenHead`, with the four outline fields landing on `faceWidth`, `faceLength`, `faceOval` and `headRound` and the forehead, temple and occiput fields on names spelled like the field.
 * @evidence contracts/common.md#clear-and-simple-design Cranium and outline proportions form one group so the feature groups can be edited without touching overall head size.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `oval` and `round` are independent additive controls that can both be set; the projection does not reconcile them, and the template's deltas alone decide their combined effect.
 * @evidence contracts/common.md#meaningful-documentation Adds the owning document, the range, neutral omission and the renamed outline morphs; members give direction for every field except bulge and temple width.
 * @author Samchon
 */
export interface IAutoMovieHeadShape {
  /** Lateral width of the whole face: `+` wider, `-` narrower. */
  width?: AutoMovieFaceWeight;

  /** Vertical stretch about the eye line: `+` longer, `-` shorter/rounder. */
  length?: AutoMovieFaceWeight;

  /** Toward an oval outline (`+`) vs a squarer one (`-`). */
  oval?: AutoMovieFaceWeight;

  /** Toward a round outline (`+`) vs a rectangular one (`-`). */
  round?: AutoMovieFaceWeight;

  /** Forehead front slope: `+` forward/upright, `-` receding. */
  foreheadSlope?: AutoMovieFaceWeight;

  /** Forehead vertical height: `+` taller (childlike), `-` shorter. */
  foreheadHeight?: AutoMovieFaceWeight;

  /** Forehead/cranial bossing (Nubian curvature). */
  foreheadBulge?: AutoMovieFaceWeight;

  /** Temple width at the side of the forehead. */
  templeWidth?: AutoMovieFaceWeight;

  /** Occiput (back-of-skull) depth: `+` more projection in profile. */
  occiputDepth?: AutoMovieFaceWeight;
}
