import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Cranium and overall head proportion: the frame the features sit in.
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
