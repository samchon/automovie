# src/film/reviewVisualRead.ts#reviewVisualRead

## @evidence contracts/development/implementation.md#principled-implementation

Samples motion roots through foldRoot, live cameras through resolveCameraAt and pinhole framing through projectToNdc on a fixed sampleTimes grid. Angular separation uses the clamped normalized dot product; these sampled root-point proxies do not measure rendered pixels, occlusion or unsampled instants.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The camera reader builds one fixed-clock table of camera placements and performer roots for framing and silhouette checks; contact checks use an indexed performer and query its root at the event's own time. Grammar findings are filed by grammarDiagnosticsToReviewNotes, which owns that record conversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No actor, camera or event is special-cased; the thresholds are documented parameters with stated defaults, and a degenerate camera skips the camera metrics instead of producing notes from undefined projections.

## @evidence contracts/development/common.md#meaningful-documentation

States what each metric measures, when it fires and at which time, which performances are skipped, the camera precondition, the root-point limitation, the defaults and units, and the order of the returned notes.

## @evidence contracts/development/implementation.md#efficient-algorithms

T = ceil(duration · rate) + 1 sample times require T camera reads and P·T delegated motion samples; pair comparisons add O(P²·T) vector work. Contact events use indexed target lookup but sample the target motion at each event time, adding up to E delegated samples rather than constant work per event.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares camera placements and performer roots on the fixed clock between frame and silhouette metrics, so pair comparisons do not resample roots. Contact checks sample the target at each event's own time independently; an event can coincide with the fixed clock, but that repeated sample is not reused here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The camera and root tables, O(T + P · T) vectors, live for one call and are released on return; the returned notes are fresh records owned by the caller.
