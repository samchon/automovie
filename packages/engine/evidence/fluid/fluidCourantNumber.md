# src/fluid/fluidCourantNumber.ts#fluidCourantNumber

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the rectangular-grid gravity-wave CFL expression at referenceDepth using direct products and reciprocals. Its numerical premise is representable intermediates; finite authored inputs do not establish that premise, and inflow is not constrained to the reference depth during integration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression shared by `validateFluidDomain` and `fluidDomainBudget`, so the refusal and the reported number cannot disagree.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No step is suggested or substituted; the number is reported as computed, including its non-finite outcomes, and the caller decides.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, design-depth comparison and consumers, the lack of a later depth check, and the finite-input underflow/overflow and NaN-admission gaps.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A constant-time closed form with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A few multiplications per call; the validator and the budget each compute it once per domain.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reads five domain fields and returns one number, retaining no reference to the domain.
