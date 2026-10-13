/**
 * One gaze channel of an eye: the authored unit axis it rotates about, the
 * degrees reached at weight one and the globe translation that accompanies it.
 *
 * @evidence contracts/common.md#principled-implementation One expression channel couples an authored unit head-frame axis, weight-one angular endpoint and metre translation, as used by the shared rigid articulation reader.
 * @evidence contracts/common.md#clear-and-simple-design The four fields identify one rotation/translation contribution; the parent eye supplies its centre and list order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The source endpoint is not a clinical duction maximum or an independent optical-size edit. Structural axis/channel/finite admission belongs to assertHumanFaceArticulation.
 * @evidence contracts/common.md#meaningful-documentation Members state expression identity, head-frame unit axis, degrees and weight-one metre translation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema performs no axis-angle quaternion construction or position transform.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A source contribution defines no shared rotation evaluation or cached motion.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns two fixed triples; the declaration acquires no globe buffers or resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisEyeGaze {
  /** The expression channel that drives this rotation. */
  channel: string;

  /** Authored unit rotation axis in the head frame. */
  axis: [number, number, number];

  /** Rotation at weight one, in degrees. */
  degrees: number;

  /** Globe translation at weight one, in metres. */
  translation: [number, number, number];
}
