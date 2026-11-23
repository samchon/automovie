# src/index.ts#solveRecoveryMapDesign

## @evidence contracts/development/implementation.md#principled-implementation

Scaling columns preserves physical parameter units on back substitution. Tall original designs are compressed by orthogonal Givens QR before SVD measures the same singular spectrum. An augmented identity design implements Levenberg damping without squaring condition or changing the least-squares step.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared original factorization serves this complete resection/joint LS operation and a separate metric-only operation; model derivatives, robust loss and actual acceptance remain with callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normal-equation inverse, singular floor, damped-rank claim or unconverged decomposition supplies a step.

## @evidence contracts/development/common.md#meaningful-documentation

States right-side sign, unscaled returned coordinates, dimensionless damping, original rank and preallocation entry bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

For m rows and n parameters, tall QR costs O(m*n^2), followed by square original-design SVDs costing O(S*n^3), with O(m*n+n^2) storage. Variable camera width remains explicitly bounded; compression supplies no measured host-speed guarantee.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared original factors alias the same normalized/QR arrays for gradient and answer synthesis. Column norms restore units, and zero damping reuses the independently qualified SVD.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only an owned step and scalar diagnostics return; call-local factors expire with no mutable global cache or external resource.
