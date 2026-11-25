# src/perform/overlayContactGoals.ts#overlayContactGoals

## @evidence contracts/development/common.md#meaningful-documentation

States what the function computes and where it was moved from; the caller's documentation states the method.

## @evidence contracts/development/implementation.md#principled-implementation

The same computation its caller performed inline before the move, with the same inputs and outputs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function per file; the caller keeps its own decisions and delegates this step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No value, tolerance or branch changed in the move.

## @evidence contracts/development/implementation.md#efficient-algorithms

The cost is the moved body's, unchanged; the move adds one call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares nothing beyond what the body shared before the move.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond what the body retained before the move.
