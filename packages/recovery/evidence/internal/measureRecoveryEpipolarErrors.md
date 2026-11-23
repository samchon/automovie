# src/index.ts#measureRecoveryEpipolarErrors

## @evidence contracts/development/implementation.md#principled-implementation

For e=x2-transpose F x1, Sampson residual divides e by the joint norm of both epipolar line normals, while symmetric error averages the two absolute point-to-line distances. Homogeneous F scale cancels in both expressions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One measurement pass supplies consensus residuals and final pixel diagnostics in the same chart, keeping undefined geometry explicit rather than overloading a finite error.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero normals and nonfinite residuals return null; malformed or overflowing matrix actions throw. No epsilon denominator, pixel clamp or selected correspondence conceals a degenerate line.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the two distinct error definitions, pixel units, signed convention, null meaning and local-approximation limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N pairs, one transpose and two fixed matrix-vector actions per pair require O(N) time and O(N) result storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both diagnostics share the two lines and scalar incidence for each pair; F-transpose is computed once for the full pass.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only owned scalar records escape, with no borrowed points, cache, image buffer or external handle retained.
