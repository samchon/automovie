# src/geometry/curve/assertAutoMovieCurve64.ts#assertAutoMovieCurve64

## @evidence contracts/development/implementation.md#principled-implementation

Tag-specific admission checks dense coefficients, positive rational weights and strictly increasing binary64 cumulative phase widths; oval axes use the existing64-epsilon orthonormal tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One assertion owns representation admission for both evaluation and boundary publication.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rational numerator/weights remain authoritative; an optional quotient cache is compared within 32 epsilons at its scalar magnitude, with no repaired coefficients or fitted replacement.

## @evidence contracts/development/common.md#meaningful-documentation

States admitted properties, unchanged input ownership, millimetre/phase conventions and limits of numerical validity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in total coefficient count and phase widths; fixed-size oval checks are constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Caller coefficients can be mutable, so no cross-call admitted-object cache is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only scalar locals and helper closures are allocated for one call; the input is neither cloned nor retained.
