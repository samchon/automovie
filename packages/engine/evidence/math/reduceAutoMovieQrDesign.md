# src/math/reduceAutoMovieQrDesign.ts#reduceAutoMovieQrDesign

## @evidence contracts/development/implementation.md#principled-implementation

Orthogonal two-row rotations eliminate each incoming row against a retained upper triangle, preserving least-squares singular values and variable-dependent residuals without squaring condition numbers. Hypot supplies finite rotations; unrepresentable actions throw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This generic algebra owner compresses rows only; numerical rank, scaling, damping and nonlinear acceptance remain with its consumer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normal equations, diagonal floor, invented rank, dropped nonconstant residual or fixture-specific branch substitutes for orthogonal elimination.

## @evidence contracts/development/common.md#meaningful-documentation

States original-row semantics, unchanged variable coordinates, constant discarded residual, independent rank responsibility and safe-integer entry/work admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

For m rows and n columns, at most m*n*(n+1) transformed cells cost O(m*n^2); retained storage is O(n^2). This removes the tall dimension before a consumer's small square SVD, without claiming a measured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each rotation updates the design and right side together; one upper triangle accumulates all rows without retaining a full orthogonal basis.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Admitted owned upper rows/right transfer to the caller. A single incoming row and scratch expire on return or throw without mutating input, globals or external resources.
