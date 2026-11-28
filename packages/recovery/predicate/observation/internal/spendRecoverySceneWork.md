# src/observation/internal/spendRecoverySceneWork.ts#spendRecoverySceneWork

## @evidence contracts/development/common.md#meaningful-documentation

Charge a nonnegative safe integer amount to one scene work category before performing the action. A malformed charge, invalid category limit or insufficient remaining work throws `RecoverySceneBudget` and keeps the ledger intact.

## @evidence contracts/development/implementation.md#principled-implementation

Select the matching declared cap and require a representable safe integer ledger. Joint iteration work uses the product of admitted fit and iteration counts. The scenario verifies exact-cap spending, refusal of an additional charge and unchanged work for fractional or NaN input.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use fixed-capacity scalar counts and one counter update. Numerical geometry is not involved in the ledger calculation.
