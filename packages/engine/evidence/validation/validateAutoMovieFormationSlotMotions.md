# src/validation/validateAutoMovieFormationSlotMotions.ts#validateAutoMovieFormationSlotMotions

## @evidence contracts/development/implementation.md#principled-implementation

Validate sparse member cue slots, states, ids, order and participant formation references.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Per-formation/slot prior maps enforce exception scheduling while base formation admission stays separate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

More than 256 cues or 1024 total named slot entries report excess without truncation; promoted hero slots are refused to preserve their explicit actor owner.

## @evidence contracts/development/common.md#meaningful-documentation

Half-open nonoverlapping cue windows, unique in-range slots, offsets bounded to +/-1e9m and facing bounded to +/-360000deg are stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

F formations and C cues build maps/sort in O(F+C log C); S named slots drive admission/prior lookup, while hero filter with slots.includes adds O(H*S) per cue in the worst case.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Request-local compiled formation and nested formation/slot prior maps share repeated identity lookup, without joined-string collisions or cross-shot caching.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only diagnostics return; no baked crowd, runtime member handle or cross-request state is retained.
