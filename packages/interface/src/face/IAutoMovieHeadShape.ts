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
  width?: number;

  /** Vertical stretch about the eye line: `+` longer, `-` shorter/rounder. */
  length?: number;

  /** Toward an oval outline (`+`) vs a squarer one (`-`). */
  oval?: number;

  /** Toward a round outline (`+`) vs a rectangular one (`-`). */
  round?: number;

  /** Forehead front slope: `+` forward/upright, `-` receding. */
  foreheadSlope?: number;

  /** Forehead vertical height: `+` taller (childlike), `-` shorter. */
  foreheadHeight?: number;

  /** Forehead/cranial bossing (Nubian curvature). */
  foreheadBulge?: number;

  /** Temple width at the side of the forehead. */
  templeWidth?: number;

  /** Occiput (back-of-skull) depth: `+` more projection in profile. */
  occiputDepth?: number;
}
