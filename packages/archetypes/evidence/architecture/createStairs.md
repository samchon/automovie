# src/architecture/createStairs.ts#createStairs

## @evidence contracts/development/implementation.md#principled-implementation

Every step is the same drawn riser and tread, so the flight is uniform exactly, inside the 9.5 mm of IBC 1011.5.4; the rail's height is the top of its gripping surface measured vertically above the nosing line, as IBC 1014.2 and ADA 505.4 measure it, and it runs one tread beyond the bottom riser on the slope and 305 mm level beyond the top one, the extensions of ADA 505.10.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the count, pick the occupant class's width, draw the dimensions, stack the steps and the landing, then each rail.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Twenty risers at the tallest riser stay under the 3658 mm a flight may rise between landings (IBC 1011.8), so the count's limit is the code's, not a convenience.

## @evidence contracts/development/implementation.md#efficient-algorithms

One box per riser and four rods per rail.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the flight's direction and origin, how steps are named and where a rail runs.
