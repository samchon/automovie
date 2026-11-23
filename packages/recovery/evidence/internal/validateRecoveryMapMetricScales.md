# src/index.ts#validateRecoveryMapMetricScales

## @evidence contracts/development/implementation.md#principled-implementation

Current D has one positive finite camera scale and three positive finite scales per ordered point. Indexed traversal treats missing entries as malformed ownership rather than optional arithmetic absence.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Assembly, optional formation and shared triangular actions use one scale contract at their own entry boundaries; factors and rows have separate validation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No skipped array hole, inferred scale, floor or caught numerical failure supplies a missing owned coefficient.

## @evidence contracts/development/common.md#meaningful-documentation

Borrows camera/point scale arrays and throws on invalid shape or any missing, zero or nonfinite value; valid inputs may still overflow later arithmetic.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(C+L) indexed pass fits the owner's prepaid invariant checks, without rescanning factors per physical row.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Mutable borrowed arrays are checked at the owning operation rather than cached across models.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only scalar indices and a borrowed point-row reference live during this call; no array copy or external resource transfers.
