# src/effectRuntime/projectProductionShotEffectFilmIntervals.ts#projectProductionShotEffectFilmIntervals

## @evidence contracts/development/implementation.md#principled-implementation

Each bound maps to the first frame whose exact `productionFrameBoundaryToSeconds` value is at or after it, so the owned source frames are exactly those with `start <= boundary < end`; the segment trim is an interval intersection with `[sourceInFrame, sourceOutFrame)` and the film frame is `startFrame + source - sourceInFrame`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Converts each shot's seconds to source frames once, then places those source intervals on every segment of the shot, so the rational frame search and the edit placement stay two separate steps; the input takes only the four effect fields the projection reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing shots are skipped only because the builder's shot-availability diagnostics refuse them, malformed cue seconds are refused rather than clamped, and no tolerance is added to the boundary comparison.

## @evidence contracts/development/common.md#meaningful-documentation

States the ownership rule and why it matches the sampler, the trim and drop rule, why a missing shot contributes nothing, the output order, and every refused input with its code.

## @evidence contracts/development/implementation.md#efficient-algorithms

For G segments, and E effects per realized shot, the cost is one constant-time frame estimate plus a short boundary walk per bound for each distinct shot, then `O(1)` per effect per segment to trim and place, `O(G * E)` in all with the frame search paid once per shot rather than once per occurrence.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within one call each shot's source intervals are computed on its first segment and reused for every later segment of the same shot, keyed by shot id over the caller's immutable-for-the-call shot map; nothing survives the call, so a changed shot set is never answered from a stale entry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The per-shot interval cache grows to at most one entry per distinct realized shot and is released when the call returns; the result array holds new interval records the caller owns.
