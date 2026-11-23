# src/internal/validateRecoveryMapMetricRow.ts#validateRecoveryMapMetricRow

## @evidence contracts/development/implementation.md#principled-implementation

A finite affine covector has matching coefficient/index counts, increasing unique physical axes in range, finite coefficients and a finite offset. Offset sign is preserved for its owner rather than reinterpreted by a linear metric action.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Optional factor formation validates all fixed rows before arithmetic refusal can hide an ownership defect; a triangular action validates just its supplied sparse row, without rescanning factors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Malformed IDs, missing values, duplicate axes or nonfinite input are core exceptions, never nullable arithmetic support or silently overwritten coordinates.

## @evidence contracts/development/common.md#meaningful-documentation

Borrows one row and positive physical width, returning no allocation or transformed row. Valid finite inputs may still overflow later numerical actions.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(Zrow) pass with fewer than16 fixed/scalar visits per entry fits the optional polynomial reserve; ordinary callers include it in their conservative current-model whitening scan. No factor/scale traversal occurs per row.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Validation depends on the borrowed current row and is not cached across models or mutable callers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only scalar indices live during the call; no borrowed object, numeric copy or external resource transfers.
