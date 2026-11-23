# src/populationRuntime/instancePrototypeChoices.ts#instancePrototypeChoices

## @evidence contracts/development/implementation.md#principled-implementation

Encodes the one rule for which prototypes a set can draw, the stated table or the single base-model default, so membership and weighted selection read the same list.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared by `selectInstancePrototype`, which draws from the list, and the structural subject diff, which asks whether an explicit member's prototype is in it instead of matching the selection's error message.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No set or prototype is special-cased; the `default` choice is the contract's spelling of a set without a table.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states both cases, the default choice's id and weight, the order, and that a stated table is returned by reference.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time: it returns the stated table or one literal choice, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read of one set that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates at most the one-choice default list and retains nothing.
