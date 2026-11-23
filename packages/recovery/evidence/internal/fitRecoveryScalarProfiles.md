# src/internal/fitRecoveryScalarProfiles.ts#fitRecoveryScalarProfiles

## @evidence contracts/development/implementation.md#principled-implementation

Cox-de Boor basis evaluation, one Householder factorization and triangular solves fit the original scalar observations. Endpoint jets determine the exact cubic Bernstein representation of each knot interval without a dense sampled recipe.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This shared recovery algebra owner serves different image-section hypotheses; callers retain family admission, positivity, physical meaning and residual checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normal-equation inverse, expected coefficient, ridge term, endpoint clamp or dropped scalar field supplies a fit; unresolved rank and nonfinite coefficients refuse.

## @evidence contracts/development/common.md#meaningful-documentation

States physical units, cubic knot space, shared factorization, exact polynomial conversion, operational rank limits and caller-owned field semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N rows, K=spans+3 coefficients and F fields, dense QR costs O(N K squared + N K F), retaining O(N K + N F). Bernstein conversion costs O(spans K F) for fixed degree three.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The original design and all F right-hand sides use contiguous binary64 columns. An ascending in-place Cox-de Boor pass reads each old right neighbour before overwriting it, reusing one basis vector instead of one allocation per degree. Arithmetic order is unchanged; all F fields share basis values and reflectors; each previous interval supplies its successor's exact shared endpoint.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Design/right-hand-side scratch expires synchronously; only O(spans F) controls and the scalar rank diagnostic transfer, without a global cache, image or file handle.
