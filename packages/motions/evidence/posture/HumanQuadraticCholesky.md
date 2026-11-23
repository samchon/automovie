# src/posture/HumanQuadraticCholesky.ts#HumanQuadraticCholesky

## @evidence contracts/development/implementation.md#principled-implementation

Applies the standard band-limited Cholesky recurrence to the reduced positive-definite OSQP system; compatible finite storage and positive definiteness remain caller premises. With `dependent`, Wright's (1999) modified factorisation for interior-point systems replaces a radicand lost to cancellation by a huge pivot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the original triangular recurrence for both factor consumers, reusing the upper system as U and copying each finalized off-diagonal value into its preallocated forward row; Workspace owns allocation and reset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the existing arithmetic order and 1e-300 diagonal-radicand guard; the guard is neither a convexity test nor a replacement for residual admission. A skipped pivot changes only the step's component along a row that rounding made dependent; the caller's residuals still decide convergence.

## @evidence contracts/development/implementation.md#efficient-algorithms

With w=band+1, takes O(n*w*w) time and O(1) auxiliary storage beyond the caller's two O(n*w) coefficient layouts; each finalized value adds one copy and repeated forward solves avoid scattered upper-row reads. Runtime speed is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each off-diagonal result is copied exactly, including signed zero or nonfinite values, into its forward position once; preceding outer rows and preceding current-row columns are finalized before the recurrence reads those copies in increasing t order. Changed systems reset upper storage and overwrite every forward entry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates and returns only the caller-owned system buffer, retaining no global state; immutable initial factors and mutable solve factors receive independent allocations.

## @evidence contracts/development/common.md#meaningful-documentation

Defines upper storage, mirrored forward rows, the L-to-U mapping, in-place recurrence, caller premises and unchanged numerical guard.
