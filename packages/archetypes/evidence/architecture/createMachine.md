# src/architecture/createMachine.ts#createMachine

## @evidence contracts/development/implementation.md#principled-implementation

Resolve the old kind, then let its canonical producer admit the original inputs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One kind check and one dispatch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Pass all arguments to the named producer so saved invalid inputs still raise their refusal.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The kind table is bounded.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both entry points run the exact same producer.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The dispatcher keeps no inputs or intermediate state.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the saved recipe and draw namespace.
