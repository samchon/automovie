# src/scene/inspection/observeAutoMovieCollisionMotion.ts#observeAutoMovieCollisionMotion

## @evidence contracts/development/common.md#meaningful-documentation

States the candidate rule, the swept bound, the stopping rule, the cut rule and the restoration.

## @evidence contracts/development/implementation.md#principled-implementation

Places actual instants through the playback placement, measures each with the same pair resolution as a placed frame, and stops by feature motion against thickness.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Endpoint snapshots, candidate selection, bisection and reporting are separate steps sharing one instant memo.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No motion law is assumed between placed instants; a reached limit defers the pair rather than clearing it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pairs that barely move or never approach cost no extra placement; each placed instant is shared by every pair that needs it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Collected parts, solids and posed surfaces are memoized per instant.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Releases every instant at return and restores the drawn placement.
