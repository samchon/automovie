# src/motion/human/grappling/IAutoMovieMotionHumanLungeGrab.ts#IAutoMovieMotionHumanLungeGrab

## @evidence contracts/development/common.md#meaningful-documentation

States the step, the reach and the grab it ends in.

## @evidence contracts/development/design.md#principled-representation

The victim and the region named, one leading side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the `lungeGrab` law reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A region beyond the lunge's reach is refused with the distance named.

# src/motion/human/grappling/IAutoMovieMotionHumanLungeGrab.ts#IAutoMovieMotionHumanLungeGrab.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

Subject id, region and side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `lungeGrab.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reach is the step plus the arms, measured on the body.
