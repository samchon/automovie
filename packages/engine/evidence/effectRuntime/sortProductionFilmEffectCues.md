# src/effectRuntime/sortProductionFilmEffectCues.ts#sortProductionFilmEffectCues

## @evidence contracts/development/implementation.md#principled-implementation

A total order on (start frame, id) using integer subtraction and `compareCodeUnits`, which compares UTF-16 code units without locale collation, so `B` precedes `a` and the order is the same on every runtime; ids are unique in a valid track, so no two cues tie.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A separate function only because two owners, the writer and the verifier, must apply the identical order; neither keeps its own comparator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No authored order or cue kind is privileged, and the caller's track order is not trusted as already canonical.

## @evidence contracts/development/common.md#meaningful-documentation

States the two sort keys, who depends on the order and why it is shared, why locale cannot change it, and that the input is not mutated.

## @evidence contracts/development/implementation.md#efficient-algorithms `O(C log C)` comparisons for C cues over one shallow copy of the array; the copy is needed so the timeline's own track keeps its authored order.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure ordering per call; the writer and verifier run in different processes over different timelines, so there is no shared result to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new array of references to the caller's cue records and retains nothing.
