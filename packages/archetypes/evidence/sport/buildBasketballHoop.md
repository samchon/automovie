# src/sport/buildBasketballHoop.ts#buildBasketballHoop

## @evidence contracts/development/common.md#meaningful-documentation

States the board and ring arrangement, drawn dimensions and contact affordances.

## @evidence contracts/development/implementation.md#principled-implementation

The board bottom, ring height and radius come from the drawn dimensions in the shared goal frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Place the board and bracket, draw the ring, then declare its bar and board surface.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The rod tangents place the ring at the drawn radius, and the board and rim affordances follow the constructed parts.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The sixteen ring rods, bracket and board are fixed in count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the goal builder's parts and affordances and the shared frame constructor.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The helper retains no data after writing the construction.
