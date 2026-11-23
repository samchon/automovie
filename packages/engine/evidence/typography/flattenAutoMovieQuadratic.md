# src/typography/flattenAutoMovieQuadratic.ts#flattenAutoMovieQuadratic

## @evidence contracts/development/implementation.md#principled-implementation

A quadratic Bézier has the constant second derivative `2(P0 − 2P1 + P2)`, so a chord over parameter step `h` deviates by at most `|P0 − 2P1 + P2| h² / 4`; the fewest equal steps meeting the tolerance are `⌈√(|P0 − 2P1 + P2| / (4 · tolerance))⌉`, at least one, as #4098 specifies.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One curve per call; ring assembly and duplicate removal stay with the glyph region builder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The step count comes from the bound, not a fixed count; non-finite points and a nonpositive tolerance refuse.

## @evidence contracts/development/common.md#meaningful-documentation

States the bound's derivation, the step formula, the straight-piece case, the units and the returned points.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the steps, which grow as the square root of curvature over tolerance.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure evaluation of one segment.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new tuples owned by the caller and retains nothing.
