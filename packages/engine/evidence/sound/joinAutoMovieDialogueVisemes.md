# src/sound/joinAutoMovieDialogueVisemes.ts#joinAutoMovieDialogueVisemes

## @evidence contracts/development/implementation.md#principled-implementation

Exactly one speaker match, a nonblank actor and ordered positive safe-integer half-open ranges are required; the linear cursor inserts explicit rest gaps and produces complete line coverage without sorting.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Binding admission and timeline construction stay together, while sampling is a separate cursor-free query; closed not-run reasons expose missing or ambiguous speaker resolution.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No actor is guessed and no external phonemes or acoustic-arrival offset is synthesized. Final-byte provenance and actual compiled actor existence are caller prerequisites, not verified by this join's test-only repository reach.

## @evidence contracts/development/common.md#meaningful-documentation

Documents emission clock, gap-rest policy, ordering and throws for corrupt timing/targets; successful availability certifies this timing join rather than actor application.

## @evidence contracts/development/implementation.md#efficient-algorithms

B bindings and V visemes require O(B+V) time; the matching subset is temporary and successful output has at most 2V+1 ranges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The completed fresh timeline can be sampled repeatedly under arbitrary seeks; changed receipt, line timing or binding requires joining again, without a mutable playback or actor registry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the outcome and fresh ranges; input receipts and binding records are read but not retained, and no audio, scene node or host task is acquired.
