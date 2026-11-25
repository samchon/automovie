# src/architecture/createDoor.ts#createDoor

## @evidence contracts/development/implementation.md#principled-implementation

A leaf box in a three-piece frame, which a sliding door has without the jamb on the side its leaf runs out past; the hinge axis points down for a left hinge and up for a right one so that a positive travel swings the leaf toward `+Z`, and the latch's axis points so that a positive travel presses the levers down. A left-hinged door is the mirror image of a right-hinged one in the `YZ` plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the leaf's standard sizes, a latch's backset and a lever's style, draw the remaining dimensions, then build the frame and the leaf with its articulation, then the hardware of each face.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No latch bolt, closer or panel detail; the opening force is a drawn dimension for an act to read, not simulated. Hardware named for a sliding door is refused, never ignored.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most ten parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the door's plane and origin, which way it opens, what moves with what and what each hand contact is.
