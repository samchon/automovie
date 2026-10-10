/**
 * Named regional centreline lengths of a scalp population. These are authored cut lengths, not measured follicle growth or a clinical population fit. They resolve to the existing convex neutral-chart field; scalp geometry and curl can alter the visible endpoint distance.
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
