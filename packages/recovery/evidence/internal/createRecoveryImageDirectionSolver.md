# src/internal/createRecoveryImageDirectionSolver.ts#createRecoveryImageDirectionSolver

## @evidence contracts/development/implementation.md#principled-implementation

Reorthogonalized QR acts on the original two direction columns and solves each right-hand side by orthogonal projection and triangular substitution. The determinant product of R and its largest singular value yield the smaller singular value without forming or inverting a normal matrix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call-local factorization owns one camera design and transfers a reusable pure solve closure to the section fitter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normal-equation inverse, ridge term, small-denominator replacement, discarded view or fixture-specific direction supplies a solution; weak or nonfinite geometry refuses.

## @evidence contracts/development/common.md#meaningful-documentation

States the factorization, reuse scope, binary64 rank-ratio interpretation, solve assumptions and refusal behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V camera directions, two-column factorization and each right-hand side cost O(V), retaining two V-entry orthonormal columns instead of a per-section dense inverse.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One factorization serves all physical section rows for exactly its supplied camera columns and is discarded when that fitting request returns.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned closure owns two O(V) arrays and scalar factors for the request lifetime; it acquires no file, process, listener or global cache.
