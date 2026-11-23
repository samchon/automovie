# src/gym/createRowingMachine.ts#createRowingMachine

## @evidence contracts/development/implementation.md#principled-implementation

A rail box of the drawn length on two feet, a seat box on it at the picked legs' height, a flywheel box at the front, two stretcher plates turned back by a fixed tilt and a handle rod before them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the legs, draw the dimensions, the rail and its feet, the seat, the flywheel, the stretchers, the handle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The seat does not slide and the chain is not drawn; the rail is level; the parts' sizes are named estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how the machine stands, the way the rower faces and its four contacts.
