# src/perform/HumanPerformanceReadWhere.ts#HumanPerformanceReadWhere

## @evidence contracts/development/common.md#meaningful-documentation

States the performer/action fields and one-based occurrence among matching carrier and overlay ids.

## @evidence contracts/development/implementation.md#principled-implementation

Uses anchor or capability as the id and counts every matching already placed carrier and overlay before adding this occurrence.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional person lookup and two ordered counting loops precede one result assembly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves duplicate ids and the initial occurrence of one for an unknown or unplaced person; no array is reordered or record deduplicated.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S+L) comparisons for S carriers and L overlays, with O(1) auxiliary space instead of concatenation/filter arrays and repeated Map lookups.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Counts from the same resolved person once without retaining a mutable occurrence index between placements.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing and returns a fresh scalar/string location record.
