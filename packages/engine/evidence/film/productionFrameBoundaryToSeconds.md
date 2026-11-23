# src/film/productionFrameBoundaryToSeconds.ts#productionFrameBoundaryToSeconds

## @evidence contracts/development/implementation.md#principled-implementation

One multiplication of exact integers and one IEEE division, which is correctly rounded, so the boundary is the nearest double to the exact rational while `f·d` is a safe integer, a limitation the documentation states; reducing the rate first makes equal rates produce equal bits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single seconds form of a frame boundary, read by effect materialization, interval projection and frame ownership so their half-open comparisons agree.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rate or frame is special-cased and no epsilon is added; callers compare against these exact doubles instead of tolerancing.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, the reduction and why it matters, the precision bound, why callers share it, and both thrown conditions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time apart from the frame-rate reduction's Euclidean algorithm, logarithmic in the rate terms.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call maps one boundary independently and retains no mapping history; callers own reuse of a reduced rate or repeated boundary reads when their traversal needs it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the reduced rate record and retains nothing.
