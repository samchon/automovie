/**
 * Vertical perspective field of view in degrees and width/height aspect for subject inspection.
 *
 * @evidence contracts/development/design.md#principled-representation The narrower derived horizontal/vertical half-angle controls sphere framing; finite fov in (0,180) and positive finite aspect are caller premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps optical inputs beside the pose and delegates camera realization and bounds framing to their owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The interface enforces no numeric range; current framing rejects ordinary range violations but nonfinite admission remains incomplete.
 * @evidence contracts/development/common.md#meaningful-documentation Documents angle/aspect units and the narrower-field framing rule.
 */
export interface IAutoMovieViewerSubjectLens {
  /**
   * Vertical field of view in degrees.
   */
  fovDeg: number;

  /**
   * Viewport width divided by height.
   *
   * The horizontal field follows from this, and framing uses the narrower half-angle for its sphere fit. Actual containment still depends on valid bounds, a distance factor of at least one and noncropping clip planes; this record proves no displayed pixels.
   */
  aspect: number;
}
