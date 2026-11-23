# src/motion/human/reaction/IAutoMovieMotionHumanThrown.ts#IAutoMovieMotionHumanThrown.Rig

## @evidence contracts/development/common.md#meaningful-documentation

Names the two rigs; the namespace states each one's stunt practice and take-off shape.

## @evidence contracts/development/design.md#principled-representation

A closed union of the air ram's blast and the ratchet's jerk-back.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IParams` reads it and `thrown.plan` chooses the take-off shape by it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per rig, with no optional fields to combine.

# src/motion/human/reaction/IAutoMovieMotionHumanThrown.ts#IAutoMovieMotionHumanThrown.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and default.

## @evidence contracts/development/design.md#principled-representation

Metres and seconds; the law refuses non-positive lengths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `thrown.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member has one meaning in both rigs.
