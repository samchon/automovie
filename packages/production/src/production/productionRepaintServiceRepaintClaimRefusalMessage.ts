import { AutoMovieRepaintClaimRefusal } from "./AutoMovieRepaintClaimRefusal";

/**
 * Formats the original already-active/prefix-changed/unknown-outcome/admission-failed messages with request and owner identity.
 *
 * @evidence contracts/common.md#principled-implementation Formats the original already-active/prefix-changed/unknown-outcome/admission-failed messages with request and owner identity.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original service value/admission operation; project lookup, dispatch and publication sequencing remain with the service coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation It retains no claim store or attempt history, only the returned diagnostic string.
 * @evidence contracts/performance.md#efficient-algorithms The closed status switch performs constant branch work plus text interpolation and directs the caller to the actual recovery cause.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources It retains no claim store or attempt history, only the returned diagnostic string.
 */
export const productionRepaintServiceRepaintClaimRefusalMessage: (requestId: string, refusal: AutoMovieRepaintClaimRefusal) => string = (
  requestId: string,
  refusal: AutoMovieRepaintClaimRefusal,
): string => {
  switch (refusal.status) {
    case "already-active":
      return `Repaint request "${requestId}" is held by an unsettled dispatch claim for attempt "${refusal.ownerAttemptId}"; no provider call was made. If that run is still executing, wait for it to settle. If it ended without settling, its provider outcome is unknown and this request identity stays closed: author a new request instead of retrying this one.`;
    case "unknown-outcome":
      return `Repaint request "${requestId}" attempt "${refusal.ownerAttemptId}" ended with an unknown provider outcome, so this request identity is closed to further dispatch and no provider call was made. Reconcile the provider side, then author a new request identity.`;
    case "prefix-changed":
      return `Repaint request "${requestId}" attempt journal or claim generation changed between planning and dispatch; no provider call was made. Run the same repaint again so it plans against the current journal.`;
    case "admission-failed":
      return `Repaint request "${requestId}" claim admission failed before any provider call: ${refusal.message}`;
  }
};
