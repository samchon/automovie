/**
 * Witness copy of one gaze channel of the basis eye articulation, recorded
 * by the optical source producer.
 *
 * The values reproduce the basis entry with its authored units unchanged, so
 * the consumer can refuse a support produced against a different rigid
 * configuration. It is not a second motion law.
 *
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
