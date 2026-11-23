# src/internal/GhoshConicApproximationDisplacement.ts#GhoshConicApproximationDisplacement

## @evidence contracts/development/common.md#meaningful-documentation

States barycentric units, compactified conic equation, degenerate search limit, unique-root contract and absent geometry output.

## @evidence contracts/development/implementation.md#principled-implementation

The rational quadratic's barycentric implicit equation is divided by (1+w)^2 before taking its w-to-infinity limit. Stable quadratic roots and determinant-roundoff bounds evaluate the original normal intersection without moving source points.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns only normal/conic arithmetic so the public fitter owns differential admission, search and coverage.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No source fallback, artificial displacement, tangent replacement or merged distinct normal intersections is used. Roundoff tolerances scale with their actual arithmetic terms.

## @evidence contracts/development/implementation.md#efficient-algorithms

One quadratic, at most two candidate roots and three barycentric tests have constant time and space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Compactified factors and normalized coefficients are computed once and reused for root and triangle admission.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous scalar operation retains no coordinates, callback, state or resources after return.
