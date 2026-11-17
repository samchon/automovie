/**
 * Structurally narrowed shot fields inspected at stored and submitted artifact boundaries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Structurally narrowed shot fields inspected at stored and submitted artifact boundaries. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation Optional unknown metadata fields intentionally represent untrusted ingress rather than admitted shot values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Stored and submitted shot gates share metadata inspection with separately supplied reporting/camera context.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Structural evidence cannot independently prove geometry freshness and absent metadata is not invented.
 */
export namespace IAutoMovieAppendShotMetadataArtifact {
  /**
   * Borrowed optional fields passed to appendShotMetadataArtifact after the caller has established a shot object. Present metadata dispatches in events, cameraIntent, coverage, cameraClearance order and appends to the caller's violations array; no field is repaired. Missing fields are skipped, while present null or malformed fields reach their validators.
   *
   * Nested admission errors are accumulated, but exceptions from delegated work or pathological input access propagate with earlier findings intact. Findings may retain offending values. This surface accepts unknown because it is an ingress contract, not a trusted shot type.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines optional dispatch, borrowed values, append effects, duration fallback and failure propagation.
   * @evidence contracts/development/design.md#principled-representation Optional unknown fields support both narrowed untrusted records and typed stored shots without pretending metadata is already admitted.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Submitted-shot and stored-slice validators share metadata checks while separately supplying the path, nullable camera-id context and violations sink.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Absence preserves legacy metadata omission; structural clearance admission cannot prove freshness against geometry revisions that this projection does not carry.
   */
  export type IShot = {
    /** Shot duration in seconds when numeric, passed through even if nonfinite; absent/non-number values become Infinity for metadata inspection. Base shot-duration admission remains separate. */
    duration?: unknown;

    /** Hero camera id used to exclude that camera from coverage; not independently admitted by this adapter. */
    camera?: unknown;

    /** Optional event-array artifact; event times are checked against the supplied shot clock. */
    events?: unknown;

    /** Optional camera-intent evidence inspected using the same duration. */
    cameraIntent?: unknown;

    /** Optional alternate-camera takes; validation receives hero camera and any caller-supplied scene camera set. */
    coverage?: unknown;

    /** Optional sampled camera-clearance evidence; structural validity does not prove current scene clearance. */
    cameraClearance?: unknown;
  };
}
