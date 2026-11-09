import type { IAutoMovieConstructionOutline } from "./IAutoMovieConstructionOutline";

/**
 * The horizontal course of a level axis's origin: its `x` and `z` in metres as natural cubic splines of the world height, C2, so the level planes' origins drift smoothly with height.
 *
 * Each outline of the part stays a chart coordinate about this origin, so a breadth or depth measured from the course reads back as given.
 *
 * @evidence contracts/development/design.md#principled-representation Two C2 curves of height place each level section's centre, keeping the polar section's premise (its centre inside its box) without tilting a plane.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two outlines, the same knot type as every curve along a part, carry the course.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The course is authored at named heights; it is not centred on a measured section by the engine.
 * @evidence contracts/development/common.md#meaningful-documentation States the two offsets, their units and interpolant, and how the outlines relate to the course.
 */
export interface IAutoMovieConstructionLevelOrigin {
  /** The origin's `x` per height, metres, knots at named heights. */
  x: IAutoMovieConstructionOutline;

  /** The origin's `z` per height, metres, knots at named heights. */
  z: IAutoMovieConstructionOutline;
}
