# src/effectRuntime/productionFilmFrameForShotTime.ts#productionFilmFrameForShotTime

## @evidence contracts/development/implementation.md#principled-implementation

Source-frame ownership uses the half-open rule `boundary(f) <= t < boundary(f + 1)` on exact `productionFrameBoundaryToSeconds` values, starting from a float estimate and walking to the frame the comparison selects, so a time one ulp below a boundary stays in the earlier frame; segments map a source frame `s` in `[sourceInFrame, sourceOutFrame)` to film frame `startFrame + s - sourceInFrame`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One question, shot and second in and film frame out, over the minimal clock type; the frame search is a private helper because only this mapping needs the floor direction. The function currently has no production caller, only its test, which leaves its review-page consumer as an open gap rather than wiring.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A repeated occurrence returns `null` rather than the first match, and an unrepresentable time returns `null` rather than a clamped frame, so the caller never reads film state from an arbitrarily chosen cut.

## @evidence contracts/development/common.md#meaningful-documentation

States the source-frame ownership rule, when the answer is `null`, which input throws and with which code, and that the answer depends only on the compiled timeline.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work to estimate the source frame plus a walk of at most a few frames, then one pass over the `G` segments to count occurrences, `O(G)` in all; the scan is needed because segments are not indexed by shot.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure query per call; a caller asking many times on one timeline repeats only the rate resolution and segment scan, which no shared index currently amortizes.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one small candidate array per call and keeps no reference to the timeline after returning.
