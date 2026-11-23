# src/geometry/curve/evaluateAutoMovieCurve64.ts#evaluateAutoMovieCurve64

## @evidence contracts/development/implementation.md#principled-implementation

Complete primitive admission precedes cumulative-width selection; analytic ellipses use center plus cosine/sine semiaxes and their analytic derivatives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One dispatch preserves the representation and exposes a position plus tangent in declared parameter units.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No display samples, uniform-piece assumption or cubic fit replace coefficients; unresolved nonzero physical derivative underflow is rejected. Closure metadata alone does not establish seam continuity.

## @evidence contracts/development/common.md#meaningful-documentation

Documents mm output, per-phase derivatives, domain endpoints and interior-piece selection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each query scans all C coefficients for admission and S widths/pieces; a selected degree-d Bernstein evaluation adds O(d²) work and O(d) scratch storage. Cubics additionally create S local piece descriptors.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No partition or validity cache spans calls because the input record is not required to be immutable.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local partition/descriptors and output vectors are per-call; the evaluator retains no primitive or external resources.
