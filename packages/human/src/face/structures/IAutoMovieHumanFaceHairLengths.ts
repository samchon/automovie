/**
 * Named regional centreline lengths of a scalp population. These are authored cut lengths, not measured follicle growth or a clinical population fit. They resolve to the existing convex neutral-chart field; scalp geometry and curl can alter the visible endpoint distance.
 *
 * @evidence contracts/common.md#principled-implementation The trait expander converts six positive mm lengths to the existing metre axes in left/right/crown/nape/front/back order, preserving the neutral-chart regional field.
 * @evidence contracts/common.md#clear-and-simple-design Named axial lengths make asymmetric cuts explicit without exposing sampled roots or private centrelines.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical layer admission checks positive finite lengths; requested centreline length is not a measured growth rate, landmark distance or guaranteed visible tip displacement.
 * @evidence contracts/common.md#meaningful-documentation Every axial anatomical direction and millimetre unit is stated, including the distinction between arc length and endpoint distance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration performs no conversion or regional interpolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It supplies lengths without caching root directions or integrated curves.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Six caller-owned scalars retain no hair population or texture.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairLengths {
  /** Positive length on the anatomical-left chart axis, millimetres. */
  leftMm: number;

  /** Independent anatomical-right axial length, millimetres. */
  rightMm: number;

  /** Positive superior axial length, millimetres. */
  crownMm: number;

  /** Positive inferior axial length, millimetres. */
  napeMm: number;

  /** Positive anterior axial length, millimetres. */
  frontMm: number;

  /** Positive posterior axial length, millimetres. */
  backMm: number;
}
