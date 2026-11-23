# src/film/evaluateAutoMovieCameraDepthPrecision.ts#evaluateAutoMovieCameraDepthPrecision

## @evidence contracts/development/implementation.md#principled-implementation

Uses the standard perspective depth mapping, linear in `1/z`, and the inverse formula at integer codes; monotonic growth of decoded spacing identifies the farthest touched cell under exact-real arithmetic. Binary64 reciprocal/subtraction rounding can select a neighbouring cell or make derived arithmetic invalid; this report is not a certified floating-point error bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure function from a camera's clip range, a required range and a constraint to a serializable report; both depth-precision paths in `realizeShotContract` call it, so the formula and its refusals live in one place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no camera or scene; malformed input becomes an `invalid` report with null measurements rather than a clamped guess, and the degenerate point on `near` reports its exact zero step instead of borrowing the following cell.

## @evidence contracts/development/common.md#meaningful-documentation

States the depth mapping, the decoding, which cell is measured and why, the degenerate near case, how inputs are echoed, every status and its condition, the inclusive threshold, and metre units through the report's `unit`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one normalized depth, one ceiling and two decodes, with no search over codes because monotonic spacing identifies the worst cell directly.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the current camera range and constraint; it coordinates no requests or effects and retains no map across mutable camera samples.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned report is a fresh record owned by the caller.
