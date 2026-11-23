# src/motion/human/handling/IAutoMovieMotionHumanPutDownAperture.ts#IAutoMovieMotionHumanPutDownAperture

## @evidence contracts/development/common.md#meaningful-documentation

Names the prop, its attachment point, the receiver frames and optional waypoint groups and the event that transfers ownership.

## @evidence contracts/development/design.md#principled-representation

All targets are affordance ids on one stationary prop and share an orientation. The two waypoint groups preserve the mandatory aperture event.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The registered putDownAperture law reads this input without extending the inherited placement schema.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Identifies authored affordances instead of presuming prop kinds, dimensions or collision-free geometry.

# src/motion/human/handling/IAutoMovieMotionHumanPutDownAperture.ts#IAutoMovieMotionHumanPutDownAperture.IGuide

## @evidence contracts/development/common.md#meaningful-documentation

Names the slider, its unit and direction, and the riding socket.

## @evidence contracts/development/design.md#principled-representation

Two affordance ids of the receptacle; the placement law checks them against it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two ids `putDownAperture` reads; `HumanSheath.sheathe` writes them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both ids are required together, so a half-declared guide cannot be written.
