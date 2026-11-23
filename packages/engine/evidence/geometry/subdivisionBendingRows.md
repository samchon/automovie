# src/geometry/subdivisionBendingRows.ts#subdivisionBendingRows

## @evidence contracts/development/implementation.md#principled-implementation

The cotangent finite-element Laplacian with lumped barycentric mass gives the squared mass-weighted discrete Laplacian energy. The metric is frozen at the supplied initial controls, so the optimization is quadratic rather than an undeclared nonlinear surface-energy solve.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns sparse physical-coordinate residual rows; the fitting coordinator composes them with hierarchical coordinates and performs the quadratic solve separately.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Cotangents retain their signs, degenerate metric triangles are refused and no anatomy coefficient, clamping or solver regularization changes the declared energy.

## @evidence contracts/development/common.md#meaningful-documentation

States the mass, stiffness, triangulation, frozen metric, distinction from analytic plate energy and degeneracy refusal. A positive scalar mean-diagonal normalization changes units but not the minimizer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each quad contributes two triangles and six edge updates; sparse row construction and normalization are linear in the stored stiffness terms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One frozen stiffness and mass serves all three coordinate solves; no metric is rebuilt per axis.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned row maps own their coefficients; mass and construction arrays are local to the call and no state is retained.
