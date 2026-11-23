# src/animals/EquineStanceExtras.ts#EquineStanceExtras.Row

## @evidence contracts/development/common.md#meaningful-documentation

The union of the families' rows.

## @evidence contracts/development/design.md#principled-representation

Discriminated by `kind`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Joins the stance's cue union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineStanceExtras.ts#EquineStanceExtras.owns

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

Any family's ownership.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four lookups.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses each family's own test.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineStanceExtras.ts#EquineStanceExtras.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and output.

## @evidence contracts/development/implementation.md#principled-implementation

Dispatch to the owning family.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per family.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant dispatch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses each family's planner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds what its family's holds.
