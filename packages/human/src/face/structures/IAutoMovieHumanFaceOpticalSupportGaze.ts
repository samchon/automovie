/**
 * Witness copy of one gaze channel of the basis eye articulation, recorded
 * by the optical source producer.
 *
 * The values reproduce the basis entry with its authored units unchanged, so
 * the consumer can refuse a support produced against a different rigid
 * configuration. It is not a second motion law.
 *
 * @evidence contracts/common.md#principled-implementation The optical frame resolver compares each channel, axis, degree endpoint and metre translation exactly against the named eye's existing gaze entry in composition order.
 * @evidence contracts/common.md#clear-and-simple-design A witness repeats the rigid source configuration for qualification, while the actual articulation remains the sole motion owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stale gaze witnesses refuse rather than authoring a substitute pivot/path; source endpoint shifts do not certify individual clinical gaze trajectories.
 * @evidence contracts/common.md#meaningful-documentation Degree rotation, metre translation and head-frame unit direction retain the original source convention unchanged.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This witness computes no rotation or equality comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Exact configuration identity is data rather than a transform cache here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No articulation matrix or source resource is created by the record.
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
