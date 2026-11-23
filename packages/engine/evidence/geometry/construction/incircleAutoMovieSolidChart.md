# src/geometry/construction/incircleAutoMovieSolidChart.ts#incircleAutoMovieSolidChart

## @evidence contracts/development/implementation.md#principled-implementation

Uses the standard lifted in-circle determinant with a floating error filter and an exact integer fallback on the represented dyadic coordinates; a common binary scale multiplies the determinant by a positive power of two and leaves its sign unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sign predicate owns the in-circle arithmetic of chart legalization, beside the orientation predicate it pairs with; dyadic decoding stays private.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance classifies nearly cocircular points as on the circle; the predicate moves no coordinate, merges no vertex and never answers from an unfiltered floating value.

## @evidence contracts/development/common.md#meaningful-documentation

States the determinant, its sign convention for both orientations, the filter's source and bound, the exact fallback and the invalid-input failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Separated determinants cost constant floating arithmetic; ambiguous ones decode eight doubles and multiply integers whose size the binary64 exponent range bounds, independently of the mesh size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure predicate coordinates no source evaluations or requests and caches no geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one module-local eight-byte decoding view; integer scratch is call-local and no input reference survives.
