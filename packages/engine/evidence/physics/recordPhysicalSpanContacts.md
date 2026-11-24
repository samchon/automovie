# src/physics/recordPhysicalSpanContacts.ts#recordPhysicalSpanContacts

## @evidence contracts/development/common.md#meaningful-documentation

States which reaction is recorded, how it is shared between the planted feet, where each share acts and the support wrench kept.

## @evidence contracts/development/implementation.md#principled-implementation

The reaction is the linear inverted pendulum's, m omega^2 (c - cmp) across the floor and the weight up at the pivot, from the prepared response's curves, as the body is kinematic while it plays; the receipts go through `recordPhysicalContact` as the solver's do.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sample of the held response and one receipt per planted foot per substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It appends to the caller's receipts and retains nothing.