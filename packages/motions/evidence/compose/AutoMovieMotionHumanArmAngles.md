# src/compose/AutoMovieMotionHumanArmAngles.ts#AutoMovieMotionHumanArmAngles.angles

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and what a missing joint reads.

## @evidence contracts/development/implementation.md#principled-implementation

The pose already holds each joint's clinical triple, so the angles are read and never re-derived from bone directions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered pass captures the first three arm records and original last-value digit records, then constructs the same clinical triples.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing joint is the rest angle, zero, the value the resolver gives an unset joint.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(J) pass over J joints replaces three find scans plus the digit scan; output still contains the same three fresh arm triples and F fresh digit triples, without a measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The arm and digit observations share one traversal of the same immutable canonical input; duplicate arm names retain first-match semantics while digit assignments retain original last-value semantics and insertion order.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
