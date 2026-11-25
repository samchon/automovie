# src/motion/human/floor/IAutoMovieMotionHumanCrabWalk.ts#IAutoMovieMotionHumanCrabWalk.Lead

## @evidence contracts/development/common.md#meaningful-documentation

Names the two leading ends, feet first or head first.

## @evidence contracts/development/design.md#principled-representation

A closed union of the two travel directions along the body's long axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IParams.lead` reads it and `crabWalk.plan` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per lead, with no optional fields to combine.

# src/motion/human/floor/IAutoMovieMotionHumanCrabWalk.ts#IAutoMovieMotionHumanCrabWalk.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

Metres in the performer's frame, a closed lead, a flag and statures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `crabWalk.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The law refuses a height the arms and legs cannot hold.
