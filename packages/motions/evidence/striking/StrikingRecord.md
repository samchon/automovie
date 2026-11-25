# src/striking/StrikingRecord.ts#StrikingRecord

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the meaning of undefined.

## @evidence contracts/development/implementation.md#principled-implementation

Runs the plan's own record builder, so the record reflects the plan's current geometry and stop.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One test and one call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

The builder's cost, which reads the plan's cached geometry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Not cached here: the plan's geometry is cached by the plan and may be settled, so each read rebuilds the record from it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
