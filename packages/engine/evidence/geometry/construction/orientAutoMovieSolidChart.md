# src/geometry/construction/orientAutoMovieSolidChart.ts#orientAutoMovieSolidChart

## @evidence contracts/development/implementation.md#principled-implementation

Uses a binary64 error filter followed by the exact integer determinant of the represented dyadic coordinates; common binary scaling leaves its sign unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sign predicate owns the arithmetic used by native-chart boundary splitting; dyadic decoding stays private.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance classifies nearby distinct points as equal, and this predicate neither moves coordinates nor merges vertex identities. Exact predicates do not certify a separately rounded intersection construction.

## @evidence contracts/development/common.md#meaningful-documentation

States input finiteness, represented-number semantics, sign convention, exact fallback and invalid-input failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordinary separated determinants use constant floating arithmetic, and so does a triple in which a point shares a coordinate with the third, whose sign is one product's read from signs; such triples are the common case on a grid and took the integer path before. Remaining ambiguous cases decode six doubles and use bounded-size integer shifts/products; binary64 exponent range bounds those integers independently of face population.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure predicate coordinates no source evaluations or requests and caches no geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One synchronous module-local eight-byte decoding view is retained; integer/tuple scratch is call-local and no input reference survives.
