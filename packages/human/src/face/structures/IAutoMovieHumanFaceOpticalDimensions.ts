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
 * @author Samchon
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
