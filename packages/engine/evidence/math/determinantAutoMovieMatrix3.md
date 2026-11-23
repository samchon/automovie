# src/math/determinantAutoMovieMatrix3.ts#determinantAutoMovieMatrix3

## @evidence contracts/development/implementation.md#principled-implementation

The six determinant products have a 64-epsilon absolute-sum filter, with subnormal/overflow cases excluded from the filter. IEEE-754 mantissa/exponent decomposition and BigInt alignment then determine the exact cancellation sign before one bounded scalar conversion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One generic engine scalar primitive owns uncertain determinant classification for actual support-boundary incidence, without changing the caller's geometry or tolerances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No determinant epsilon replacement, guessed zero, coordinate weld or fixture-specific sign is returned. Nonfinite input and unrepresentable nonzero magnitudes refuse.

## @evidence contracts/development/common.md#meaningful-documentation

States row-major ordering, adaptive versus exact-sign paths, rounded magnitude, binary64 input meaning and underflow/overflow refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed-size filter is constant work. The fallback multiplies six fixed-count binary64 mantissas and aligns a bounded exponent range, so BigInt work/storage are bounded by the input format rather than geometry size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The six module-private Leibniz permutation/sign tuples are fixed mathematical constants reused across queries; each nonzero input is decomposed at most once within a fallback, and no input-dependent result survives or requires invalidation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only one number escapes; the optional eight-byte view, six integer terms and aligned sum expire synchronously. The fixed six-entry mathematical index table is module-owned, without handles or global input-dependent state.
