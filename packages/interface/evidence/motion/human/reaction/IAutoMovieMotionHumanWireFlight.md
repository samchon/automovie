# src/motion/human/reaction/IAutoMovieMotionHumanWireFlight.ts#IAutoMovieMotionHumanWireFlight.Shape

## @evidence contracts/development/common.md#meaningful-documentation

Names the flight shapes; the namespace states the posture of each.

## @evidence contracts/development/design.md#principled-representation

A closed union of the shapes the body holds along the wire path.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IParams` reads it and `wireFlight.plan` chooses the held posture by it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per shape, with no optional fields to combine.

# src/motion/human/reaction/IAutoMovieMotionHumanWireFlight.ts#IAutoMovieMotionHumanWireFlight.Part

## @evidence contracts/development/common.md#meaningful-documentation

Names the four end effectors that can touch a surface in the air.

## @evidence contracts/development/design.md#principled-representation

A closed union of the two hands and two feet, by side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The flight's touch records read it to choose the limb `wireFlight.plan` places on the surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per hand or foot, with no optional fields to combine.

# src/motion/human/reaction/IAutoMovieMotionHumanWireFlight.ts#IAutoMovieMotionHumanWireFlight.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame, unit and default.

## @evidence contracts/development/design.md#principled-representation

World root points in metres and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `wireFlight.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member has one meaning in every shape.

# src/motion/human/reaction/IAutoMovieMotionHumanWireFlight.ts#IAutoMovieMotionHumanWireFlight.ITouch

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

A part, a target and a share of the flight.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `wireFlight.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A touch the part cannot reach from the path is refused.

# src/motion/human/reaction/IAutoMovieMotionHumanWireFlight.ts#IAutoMovieMotionHumanWireFlight.IArrest

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

Metres, metres per second squared and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `wireArrest.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fall the bound cannot stop above `stop` is refused.
