/**
 * A face measurement the current basis cannot read, with the named reason.
 *
 * The reason says what is missing, for example a landmark the basis does not
 * register or a structure it does not model, so the caller sees a gap rather
 * than a default value.
 *
 * @evidence contracts/common.md#principled-implementation The measurement reader preserves each registry instrument's missing-source reason, caught refusal or nonfinite-result explanation instead of manufacturing a number.
 * @evidence contracts/common.md#clear-and-simple-design A distinct unavailable discriminator carries the named instrument and its reason without ambiguous nullable numeric fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreadable quantities do not become zero, requested targets or successful observations; other readable instruments can still be reported independently.
 * @evidence contracts/common.md#meaningful-documentation The reason states the source/protocol gap for callers rather than concealing it in an aggregate pass flag.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The result type executes no instrument or exception handling.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It stores an explanation without caching failed instrument work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record retains strings only, not source geometry or error handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMeasurementUnavailable {
  /** Reading kind. */
  status: "unavailable";

  /** Registered measurement name. */
  measurement: string;

  /** What the basis lacks for this measurement. */
  reason: string;
}
