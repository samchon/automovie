# src/geometry/curve/evaluateAutoMovieBernstein64.ts#evaluateAutoMovieBernstein64

## @evidence contracts/development/implementation.md#principled-implementation

Forward-difference derivative coefficients are evaluated by the same Bernstein recurrence; positive weights keep the supported denominator positive in exact arithmetic, and represented zero/nonfinite intermediate denominators are rejected.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One evaluator handles polynomial, rational and rational-XZ/polynomial-Y branches without fitting or reducing their coefficient degree.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Optional quotient caches are checked, not consumed as authority; explicit nonzero multiplication/division underflow is refused instead of returning a zero fallback. Binary64 cancellation and conditioning remain limitations.

## @evidence contracts/development/common.md#meaningful-documentation

Documents local derivative units, descriptive qInterval, independent hybrid Y and failure before a result is returned.

## @evidence contracts/development/implementation.md#efficient-algorithms

For degree d and hybrid Y degree h, recurrence work is O(d²+h²), with O(d+h) temporary coefficient storage; endpoints avoid the interpolation recurrence.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One piece/t query coordinates no cross-call work, and mutable input coefficients are not cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Work arrays and returned vectors belong to this call; no coefficient, image or external handle is retained.
