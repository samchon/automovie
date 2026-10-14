/**
 * The jaw opening: the channel that drives it, the rotation it reaches at
 * weight one and the mandibular translation coupled linearly with the angle.
 *
 * @evidence contracts/common.md#principled-implementation One expression weight drives both source opening degrees and accompanying metre translation about the shaped condylar axis, preserving endpoint-linear coupling.
 * @evidence contracts/common.md#clear-and-simple-design Channel/angle/translation define the opening contribution; Jaw owns common pivot, axis and combined budget.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint scaling is an authored approximation, not a universal hinge or measured patient trajectory across the full envelope.
 * @evidence contracts/common.md#meaningful-documentation Members give expression identity and the common weight-one reference for degrees and coupled metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type computes no opening quaternion or aperture.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source record defines no shaped-joint cache or reused pose result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns one scalar/triple; the declaration acquires no joint resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisJawOpening {
  /** The expression channel that opens the jaw. */
  channel: string;

  /** Rotation at weight one, in degrees. */
  degrees: number;

  /** Mandibular translation at weight one, in metres, coupled linearly with the angle. */
  translation: [number, number, number];
}
