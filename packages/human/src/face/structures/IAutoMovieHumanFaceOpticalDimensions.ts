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
 * @evidence contracts/common.md#principled-implementation resolveHumanFaceOpticalProfile converts seven supplied metric dimensions into a C1-joined polynomial anterior/spherical posterior model, an axial shell offset and an open flat iris annulus; exact source support independently establishes placement.
 * @evidence contracts/common.md#clear-and-simple-design Optical size/profile quantities are separate from source axis, chart and rigid pivot so a dimension edit cannot introduce a second gaze law.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Profile admission checks finite positive representable metres, aperture < iris <= limbus < globe and strict shell/iris containment without clamping; clinical biometry or entrance-pupil observations are not automatically converted into these geometry values.
 * @evidence contracts/common.md#meaningful-documentation Radius versus axial length, micrometre axial thickness and source-support-relative iris depth identify the authored geometric meanings and their clinical limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The dimension record does not resolve polynomials or tessellate optics.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Profile/geometry reuse is owned by the optical assembly, not this schema.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Seven scalars acquire no cell metrics, hulls or textures.
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
