# src/sport/createTableTennisTable.ts#createTableTennisTable

## @evidence contracts/development/implementation.md#principled-implementation

Every dimension is the ITTF Laws of Table Tennis' (2.1.1, 2.2.2); the top's thickness and the legs' section are provisional construction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the top, the net and the legs, then record the affordances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The net is a solid sheet the ball meets, not a gate.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the laws each dimension comes from and the affordances.
