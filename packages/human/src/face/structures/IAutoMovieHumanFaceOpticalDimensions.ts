/**
 * Explicit dimensions of one authored optical core, independent of skin morphs.
 *
 * These seven values construct a spherical posterior globe, a joined anterior
 * profile, a constant axial corneal offset and a flat iris annulus. They are
 * geometry inputs, not a patient reconstruction or a clinical population range.
 * Ocular axial biometry, mean keratometry, white-to-white diameter and a
 * refracted entrance-pupil observation do not implicitly supply these values.
 * Source registration owns placement; none of these dimensions owns a pivot.
 *
 * @evidence contracts/common.md#principled-implementation Separates the supplied globe, limbus, curvature, thickness, iris extent, physical aperture and iris depth; no dimension fills another one.
 * @evidence contracts/common.md#clear-and-simple-design One complete record describes one side; the document owns side selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No personal vertex, sculpt curve or population default is an input.
 * @evidence contracts/common.md#meaningful-documentation States units, constructed surfaces and why clinical measurements cannot be silently converted.
 * @evidence contracts/modeling.md#parameter-channels Each length names its geometric role and unit; the profile owner converts it once and admits joint feasibility.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Describes dimensions and defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The geometry builder owns sampling and incidence.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The shared profile owns the limbal interface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The connected builder owns displayed parts.
 * @evidence contracts/modeling.md#spatial-conventions All lengths are explicit millimetres except central thickness in micrometres, and depth is posterior from the registered anterior support.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries caller-supplied dimensions and introduces no measured anatomical number.
 * @evidenceExclude contracts/anatomy.md#permitted-range Geometric feasibility is admitted by the profile, without claiming a physiological range.
 * @evidence contracts/anatomy.md#parametric-authority Defines dimensions of named ocular components instead of editing source vertices or fitting a personal mesh.
 */
export interface IAutoMovieHumanFaceOpticalDimensions {
  /** Positive posterior spherical globe radius in millimetres, not axial length. */
  globeRadiusMm: number;
  /** Positive circular corneoscleral interface radius in millimetres. */
  limbusRadiusMm: number;
  /** Positive central anterior profile curvature radius in millimetres. */
  apexCurvatureRadiusMm: number;
  /** Positive full central shell thickness in micrometres; modeled as an axial offset. */
  centralThicknessMicrometres: number;
  /** Positive flat iris outer radius in millimetres, at most the limbal radius. */
  irisOuterRadiusMm: number;
  /** Positive physical iris aperture radius in millimetres, below the outer radius. */
  irisApertureRadiusMm: number;
  /** Positive posterior depth of the iris plane from source-axis/native-surface support, in millimetres. */
  irisDepthFromAnteriorSupportMm: number;
}
