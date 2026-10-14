/**
 * A closed anterior optical shell, in the shared millimetre frame. Angular
 * extents clip it to the visible aperture; they contain one sample per column,
 * without a duplicated closing sample. Front/back surfaces share a joined rim.
 * Curvature is added relative to the underlying spherical globe so the limbus
 * retains one declared lift. This is a rendering approximation of the anterior
 * optical surface, not a complete physiological model of the eye.
 *
 *
 * @evidence contracts/common.md#principled-implementation One support-relative sag shell retains declared radius, curvature, axial thickness and actual per-column extent.
 * @evidence contracts/common.md#clear-and-simple-design buildPortraitCornea owns admitted construction while the caller owns the support frame and final metric conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The posterior sheet is an authored offset and this shell is not a complete physiological optical eye.
 * @evidence contracts/common.md#meaningful-documentation Fields state construction millimetres, clipped versus full radius, ring counts and support-height callback.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitCornea is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitCornea declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitCornea acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IPortraitCornea {
  /** In-plane centre of the iris/corneal aperture; surface supplies its depth. */
  center: {
    /** Centre coordinate along the current support's X axis, millimetres. */
    x: number;

    /** Centre coordinate along the current support's Y axis, millimetres. */
    y: number;
  };

  /** Unclipped aperture radius, in millimetres. */
  radius: number;

  /** Corneal surface curvature radius, greater than the aperture radius. */
  curvature: number;

  /** Underlying spherical curvature radius, at least the corneal curvature. */
  globeRadius: number;

  /** Positive axial separation of the two shell surfaces, in millimetres. */
  thickness: number;

  /** Front-rim lift from the underlying globe, greater than shell thickness. */
  rimLift: number;

  /** Positive visible radial reach at each equally spaced angular column. */
  extents: number[];

  /** Positive integral count of concentric rings on each surface. */
  radialSamples: number;

  /**
   * Underlying globe surface height, in millimetres, at a head-frame X/Y.
   *
   * @evidence contracts/common.md#principled-implementation Current support X/Y select the underlying globe height in the shell's same construction frame.
   * @evidence contracts/common.md#clear-and-simple-design The optical support owner supplies height while buildPortraitCornea adds declared corneal-minus-globe sag.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback must return finite values and must not independently refit the shell's curvature.
   * @evidence contracts/common.md#meaningful-documentation The member states support coordinates and millimetre height result.
   * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitCornea.surface is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitCornea.surface declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitCornea.surface acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
   */
  surface: (x: number, y: number) => number;
}
