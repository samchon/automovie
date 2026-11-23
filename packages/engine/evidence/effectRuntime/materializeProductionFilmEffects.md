# src/effectRuntime/materializeProductionFilmEffects.ts#materializeProductionFilmEffects

## @evidence contracts/development/implementation.md#principled-implementation

Ownership is half-open interval overlap per zone: because cues are visited in start-frame order and earlier same-zone cues were already proven disjoint, only the most recent cue on a zone can overlap the next one, so comparing against it alone decides every film-film conflict; shot intervals are compared by the same `start < otherEnd && otherStart < end` test. Seconds come from `productionFrameBoundaryToSeconds`, so the stream window is the exact rational boundary the sampler and validator recompute.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function validates and resolves the whole track first, then asks `materializeCompiledEffects` once for all streams under the film seed owner and wraps each in its runtime record; rate reduction, identity checks and cue ordering stay with their single shared owners so the reader verifies exactly what this writer persists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cue, zone or recipe is skipped or defaulted: every problem the reader would reject is refused here with its named code, the identity is copied field by field so no extra member of the caller's object reaches the persisted runtime, and the inner stream lookup by id cannot miss because each cue's zone and recipe were resolved and its id proven unique before materialization.

## @evidence contracts/development/common.md#meaningful-documentation

States the output order and every stamped field, the stream's step, window, intensity and seed protocol, and each refusal code with the condition that raises it.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C cues, S shot intervals, R recipes and Z zones the cost is `O(R + Z + S)` to index the world and group shot intervals by zone, `O(C log C)` to sort, `O(1)` per cue for the film conflict against the zone's latest cue, a scan of only that zone's shot intervals, and two SHA-256 digests per cue for the stream plus one for the runtime.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per production build with that build's identity and timeline; the result is the persisted artifact, and nothing is cached across builds because the identity is part of every digest.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The id set, latest-cue map, shot-interval groups and stream map live only for the call and grow linearly with the cue and interval counts; the returned runtimes own their streams and share one reduced `frameRate` object, so mutating one runtime's rate changes the others.
