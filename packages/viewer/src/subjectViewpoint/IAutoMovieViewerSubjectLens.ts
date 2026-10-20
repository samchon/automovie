/**
 * Vertical perspective field of view in degrees and width/height aspect for subject inspection.
 *
 * @evidence contracts/common.md#principled-implementation The narrower derived horizontal/vertical half-angle controls sphere framing; finite fov in (0,180) and positive finite aspect are caller premises.
 * @evidence contracts/common.md#clear-and-simple-design Keeps optical inputs beside the pose and delegates camera realization and bounds framing to their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface enforces no numeric range; current framing rejects ordinary range violations but nonfinite admission remains incomplete.
 * @evidence contracts/common.md#meaningful-documentation Documents angle/aspect units and the narrower-field framing rule.
 * @evidence contracts/performance.md#efficient-algorithms A two-scalar shape chooses no projection algorithm; framing and Three projection updates have fixed arithmetic cost.
 * @evidence contracts/performance.md#reuse-equivalent-work A lens can be shared while viewport aspect and fov remain unchanged; resize invalidates its correspondence to an actual canvas.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record acquires no camera or renderer and retains no native projection resources.
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
