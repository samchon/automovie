# src/vehicles/BoatHull.ts#BoatHull.panel

## @evidence contracts/development/common.md#meaningful-documentation

States the panel's ends, its heights and what `from`'s height means.

## @evidence contracts/development/implementation.md#principled-implementation

A box `createBoat.ESTIMATES.plank` thick, as long as the run between its feet on the ground and as tall as the gunwale above the bottom, turned about the upright to lie along that run.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The run and its heading, then one box.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The panel is flat; the hull's curves are not modelled, as `createBoat` states.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Adds one part.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/BoatHull.ts#BoatHull.thwart

## @evidence contracts/development/common.md#meaningful-documentation

States the board, where its seat stands and what `facing` means.

## @evidence contracts/development/implementation.md#principled-implementation

A board `createBoat.THWART` deep and `createBoat.ESTIMATES.seat` thick with its top at the seat's height, behind its front edge as the sitter faces. The seat's frame on that edge has `+Y` up and `+Z` along the sitter's heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One box, one seat.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The board's depth and thickness are the named estimates, as `createBoat` states.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Adds one part and one contact.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
