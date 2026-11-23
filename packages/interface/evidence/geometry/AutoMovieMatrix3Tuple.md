# src/geometry/AutoMovieMatrix3Tuple.ts#AutoMovieMatrix3Tuple

## @evidence contracts/development/common.md#meaningful-documentation

States row order, multiplication convention, mutability and the separate rotation and finite-number premises.

## @evidence contracts/development/design.md#principled-representation

Three fixed rows of three dimensionless numbers preserve matrix dimensions; tuple shape cannot certify orthogonality or numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the matrix exchanged by Human segment-frame arithmetic and engine Curve64 transformations; their particular transform restrictions remain at those operations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A concrete tuple replaces no runtime library object. ReadonlyRows preserves the same layout for borrowed input without claiming runtime freezing.

# src/geometry/AutoMovieMatrix3Tuple.ts#AutoMovieMatrix3Tuple.ReadonlyRows

## @evidence contracts/development/common.md#meaningful-documentation

States both readonly tuple levels and the absence of ownership or runtime immutability guarantees.

## @evidence contracts/development/design.md#principled-representation

Three readonly rows retain dimensionless coefficients and fixed three-by-three arity; numerical validity remains the caller's responsibility.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Engine Curve64 transformations borrow the matrix layout also produced by Human segment-frame arithmetic.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Readonly is an access restriction rather than a second matrix concept or hidden immutable allocation.
