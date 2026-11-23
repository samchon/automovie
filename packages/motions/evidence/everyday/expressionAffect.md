# src/everyday/expressionAffect.ts#expressionAffect

## @evidence contracts/development/common.md#meaningful-documentation

States what the layer adds, its parameter, its refusal and its return.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `HumanAffect.layer`, which owns the displays.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegating call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no value of its own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work over the call it delegates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the layer builder with every caller of `HumanAffect.layer`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned layer closes over its displays only.
