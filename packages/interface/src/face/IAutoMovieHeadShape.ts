import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Cranium and overall head proportion of an {@link IAutoMovieHead}: the frame
 * the features sit in. Signed weights in `[-2, 2]`, omitted meaning unchanged.
 * `flattenHead` projects `width`, `length`, `oval` and `round` onto
 * `faceWidth`, `faceLength`, `faceOval` and `headRound`, and the forehead,
 * temple and occiput fields onto same-stem names.
 *
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
