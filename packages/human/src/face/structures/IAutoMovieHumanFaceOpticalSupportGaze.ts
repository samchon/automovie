/**
 * Witness copy of one gaze channel of the basis eye articulation, recorded
 * by the optical source producer.
 *
 * The values reproduce the basis entry with its authored units unchanged, so
 * the consumer can refuse a support produced against a different rigid
 * configuration. It is not a second motion law.
 *
 * @evidence contracts/common.md#principled-implementation Copies the existing gaze entry exactly so staleness is detected by comparison.
 * @evidence contracts/common.md#clear-and-simple-design Four named fields replace an anonymous array element type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Records the producer's configuration; it never drives articulation.
 * @evidence contracts/common.md#meaningful-documentation States the witness role and unit preservation.
 * @evidence contracts/modeling.md#spatial-conventions The axis is a unit head-frame direction, degrees are reached at weight one and the translation is head-frame metres at weight one.
 * @evidenceExclude contracts/modeling.md#parameter-channels Names an existing gaze channel; defines none.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Defines no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The connected builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis articulation owns the gaze figures and their sources.
 * @evidenceExclude contracts/anatomy.md#permitted-range Introduces no bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A witness, not a control.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOpticalSupportGaze {
  /** Existing gaze channel name. */
  channel: string;
  /** Unit rotation axis in the head frame. */
  axis: [number, number, number];
  /** Rotation at weight one, in degrees. */
  degrees: number;
  /** Globe translation at weight one, in head-frame metres. */
  translation: [number, number, number];
}
