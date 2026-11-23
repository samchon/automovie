/**
 * Structurally narrowed shot fields inspected at stored and submitted artifact boundaries.
 */
export namespace IAutoMovieAppendShotMetadataArtifact {
  /**
   * Borrowed optional fields passed to appendShotMetadataArtifact after the caller has established a shot object. Present metadata dispatches in events, editorialMarkers, cameraIntent, coverage, cameraClearance order and appends to the caller's violations array; no field is repaired. Missing fields are skipped, while present null or malformed fields reach their validators.
   *
   * Nested admission errors are accumulated, but exceptions from delegated work or pathological input access propagate with earlier findings intact. Findings may retain offending values. This surface accepts unknown because it is an ingress contract, not a trusted shot type.
   */
  export type IShot = {
    /** Shot duration in seconds when numeric, passed through even if nonfinite; absent/non-number values become Infinity for metadata inspection. Base shot-duration admission remains separate. */
    duration?: unknown;

    /** Hero camera id used to exclude that camera from coverage; not independently admitted by this adapter. */
    camera?: unknown;

    /** Optional event-array artifact; event times are checked against the supplied shot clock. */
    events?: unknown;

    /** Optional marker array whose ids and source endpoints are checked on the shot clock. */
    editorialMarkers?: unknown;

    /** Optional camera-intent evidence inspected using the same duration. */
    cameraIntent?: unknown;

    /** Optional alternate-camera takes; validation receives hero camera and any caller-supplied scene camera set. */
    coverage?: unknown;

    /** Optional sampled camera-clearance evidence; structural validity does not prove current scene clearance. */
    cameraClearance?: unknown;
  };
}
