# src/architecture/builtEnvelopeFaceCorners.ts#builtEnvelopeFaceCorners

## @evidence contracts/development/implementation.md#principled-implementation

Pairs facades by vertex proximity within the thicker wall thickness and reads the turn from the first normal's dot product toward the second centroid. Boundary-id ordering stabilizes pair identity and the side convention. Near-equal distances use the observation tolerance; the predicate does not prove edge intersection or simultaneous orientation behind both planes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Takes placed faces rather than an environment, so the environment-level corner query and the census, which already holds the faces, share one pairing rule without placing the envelope twice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no building or boundary; the proximity slack is each pair's own wall thickness plus the shared observation tolerance, and unreadable pairs are skipped by a stated rule rather than given a guessed side.

## @evidence contracts/development/common.md#meaningful-documentation

States which faces are paired, the meeting rule and its slack, where the meeting point falls, the pair order, the exterior and reentrant tests, when a pair is skipped, the sort, and who calls it.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(F² + sum(Vi Vj) + Q log Q) for F facades, outline sizes Vi/Vj of eligible pairs and Q returned corners. Building and parallel-normal checks precede each vertex-product scan; no measured crossover with a spatial index is asserted.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the caller's already placed faces instead of re-deriving them, which is what lets the census place the envelope once per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one meeting list per pair during the scan and the returned corners, which the caller owns; nothing is kept between calls.
