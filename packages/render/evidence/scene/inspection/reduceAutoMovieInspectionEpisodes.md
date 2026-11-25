# src/scene/inspection/reduceAutoMovieInspectionEpisodes.ts#reduceAutoMovieInspectionEpisodes

## @evidence contracts/development/implementation.md#principled-implementation

Maps retain the previous sample, the first clock of its run and open results per continuity occurrence. Matching findings and coverage extend only across adjacent indices on that shot clock. Distinct confirmed error and required coverage flags come from the actual records.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The fold owns observation order and delivery checks. The two per-packet helpers update coverage and episodes respectively, and share the same explicit adjacency decision.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A frame index is optional and never inferred from seconds. Off-grid samples, gaps, unchecked findings, clock changes and different occurrences break episode continuity. Source clocks with a changing offset, including deliberate speed changes, keep separately observed spans. An episode preserves whether every addressed witness agreed with the enclosing clock, even when a conflicting witness ranks below both retained observations.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass uses maps for scoped identities and counts the ordered output indices once. Work is proportional to packets, their rows and their identity lengths, with serialized comparison only for repeated scoped samples.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated samples add no evidence. The summary keeps two witnesses per episode and extends unchanged coverage ranges in place.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Scope maps keep one borrowed packet and its open rows per occurrence. Only the reported ranges, selected witness data and counts escape.

## @evidence contracts/development/common.md#meaningful-documentation

States the packet order, duplicate rule, adjacency rule, expected schedule semantics and exact fields returned.
