# src/drawing/roundAutoMovieDrawingPoint.ts#roundAutoMovieDrawingPoint

## @evidence contracts/development/implementation.md#principled-implementation

Applies `roundAutoMovieDrawingScalar` to each coordinate independently, which is the grid rule for a point because the page axes are independent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One page-point rounding shared by the drafter's line, section, opening and annotation stages, replacing the private copies each stage would otherwise keep.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No point is special-cased; the precision is the contract constant the scalar rule reads.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states which stored points pass through it, the shared precision and the negative-zero guarantee.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A page point has two axes and each is rounded once, a fixed cost with nothing to choose between.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Two scalar roundings per stored page point, each cheaper than any lookup that could replace it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The rounded point is stored in the drawing the caller is assembling; the unrounded input is not referenced afterwards.
