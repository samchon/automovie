# src/touch/touchFaces.ts#touchFaces

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned, when, and why the trunk turns.

## @evidence contracts/development/implementation.md#principled-implementation

The regions' middle is read against the shoulder joints across the floor: off to one side beyond half their span, the trunk turns toward it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One middle, one lateral distance, one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bound is the body's own shoulder span; nothing is tuned.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per touch plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
