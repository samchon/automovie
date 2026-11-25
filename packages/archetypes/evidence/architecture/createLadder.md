# src/architecture/createLadder.ts#createLadder

## @evidence contracts/development/implementation.md#principled-implementation

Rungs at one drawn spacing along the ladder's own line, which is upright or tilted by the pitch; a leaning ladder's pitch is fixed by the quarter-length rule of 29 CFR 1926.1053(b)(5)(i), whose arccosine of one quarter is 75.5 degrees.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the count, draw the dimensions, lay the two rails and the rungs along one direction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No feet, hooks or cage.

## @evidence contracts/development/implementation.md#efficient-algorithms

One rod per rung and two rails.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the ladder's foot, the way it is climbed, its tilt and how rungs are named.
