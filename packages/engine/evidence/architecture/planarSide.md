# src/architecture/planarSide.ts#planarSide

## @evidence contracts/development/implementation.md#principled-implementation

Classifies the binary64 cross-product sign outside an extent-scaled zero band. The linear band is a tolerance policy, not a proven roundoff bound or adaptive exact orientation predicate. Callers need finite, suitable-scale intermediates; overflow/cancellation can invalidate the geometric interpretation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one orientation test behind `pointOnSegment`, `segmentsCross`, `segmentsTouch` and so every planar containment and overlap predicate, replacing four private copies those predicates each carried.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coordinate, figure or caller is special-cased; the tolerance is the shared `PLANAR_EPSILON` constant scaled by the operands themselves.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the sign convention and axis orientation, the exact zero band and its floor, the degenerate-line answer, and each parameter's frame.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time, one cross product and one comparison, with no algorithm or structure to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate over three points; it coordinates no work across requests or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reads three points and allocates nothing, so no state, handle or task outlives the call.
