# src/architecture/segmentsTouch.ts#segmentsTouch

## @evidence contracts/development/implementation.md#principled-implementation

Composes proper crossing with four endpoint-on-segment checks. This is the ideal closed-segment case split, evaluated through the shared approximate predicates and their numerical premises; it is not an independent exact-arithmetic certificate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The contact test `polygonIsSimple` and `polygonsOverlap` both need, composed from the shared crossing and point-on-segment predicates instead of the private copy each file kept.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No configuration or caller is special-cased; every contact is decided by the two shared predicates and their shared tolerance.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states what counts as touching, why the case split is complete, and each parameter's role.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time, at most four orientation tests and four point-on-segment tests, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure contact predicate over two segments, called per edge pair by the polygon predicates; it shares no work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reads two segments, delegates to allocation-free predicates, and retains nothing.
