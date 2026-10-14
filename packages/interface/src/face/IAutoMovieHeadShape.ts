/**
 * Cranium and overall head proportion of an {@link IAutoMovieHead}: the frame
 * the features sit in. Signed weights in `[-2, 2]`, with omission leaving the
 * template unchanged.
 *
 * `flattenHead` renames `width`, `length`, `oval` and `round` to `faceWidth`,
 * `faceLength`, `faceOval` and `headRound`, and the forehead, temple and
 * occiput fields to same-stem names.
 *
 * @evidence contracts/common.md#principled-implementation `HEAD_PARAMETERS.shape` in `flattenHead` renames the nine leaves one-to-one, the four outline leaves gaining a `face` or `head` prefix and the five skull leaves keeping their names.
 * @evidence contracts/common.md#clear-and-simple-design The outline controls and the skull-surface controls share one group because both set the frame the features sit in, and none is sided.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `oval` and `round` stay independent targets rather than one axis with a hidden midpoint, and every leaf is copied unchanged for the template to blend.
 * @evidence contracts/common.md#meaningful-documentation States the group's role, the range and neutral meaning, and all nine morph names; members give each sign's direction.
 * @author Samchon
 */
export interface IAutoMovieHeadShape {
  /** Lateral width of the whole face: `+` wider, `-` narrower. */
  width?: number;

  /** Vertical stretch about the eye line: `+` longer, `-` shorter and rounder. */
  length?: number;

  /** Outline: `+` toward an oval, `-` toward a squarer shape. */
  oval?: number;

  /** Outline: `+` toward a round shape, `-` toward a rectangular one. */
  round?: number;

  /** Forehead slope: `+` forward and upright, `-` receding. */
  foreheadSlope?: number;

  /** Forehead height: `+` taller, `-` shorter. */
  foreheadHeight?: number;

  /** Forehead bossing: `+` more rounded bulge, `-` flatter. */
  foreheadBulge?: number;

  /** Temple width at the side of the forehead: `+` wider, `-` narrower. */
  templeWidth?: number;

  /** Back-of-skull depth: `+` more projection in profile, `-` flatter. */
  occiputDepth?: number;
}
